import { db } from "./db";
import { 
  externalAgencyActivityLogs, 
  externalAgencyChatMessages, 
  externalAgencySellerPoints,
  externalAgencyPointConfig 
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

type ActionType = 
  | 'lead_registered'
  | 'offer_sent'
  | 'rental_form_sent'
  | 'owner_registered'
  | 'lead_converted'
  | 'rental_completed'
  | 'showing_scheduled'
  | 'property_listed'
  | 'client_registered';

interface ActivityData {
  agencyId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actionType: ActionType;
  subjectType: 'lead' | 'client' | 'owner' | 'property' | 'rental';
  subjectId: string;
  subjectName: string;
  subjectInfo?: Record<string, any>;
}

const DEFAULT_POINTS: Record<ActionType, number> = {
  lead_registered: 10,
  offer_sent: 15,
  rental_form_sent: 15,
  owner_registered: 25,
  lead_converted: 50,
  rental_completed: 100,
  showing_scheduled: 5,
  property_listed: 20,
  client_registered: 15,
};

const ACTION_MESSAGES: Record<ActionType, { es: string; en: string }> = {
  lead_registered: { 
    es: 'registró un nuevo lead', 
    en: 'registered a new lead' 
  },
  offer_sent: { 
    es: 'envió una oferta a', 
    en: 'sent an offer to' 
  },
  rental_form_sent: { 
    es: 'envió un formato de renta a', 
    en: 'sent a rental form to' 
  },
  owner_registered: { 
    es: 'registró un nuevo propietario de', 
    en: 'registered a new owner for' 
  },
  lead_converted: { 
    es: 'convirtió a cliente a', 
    en: 'converted to client' 
  },
  rental_completed: { 
    es: 'completó una renta para', 
    en: 'completed a rental for' 
  },
  showing_scheduled: { 
    es: 'programó una cita con', 
    en: 'scheduled a showing with' 
  },
  property_listed: { 
    es: 'listó una nueva propiedad', 
    en: 'listed a new property' 
  },
  client_registered: { 
    es: 'registró un nuevo cliente', 
    en: 'registered a new client' 
  },
};

export async function logSellerActivity(data: ActivityData): Promise<void> {
  try {
    // Get points for this action type
    let points = DEFAULT_POINTS[data.actionType] || 0;
    
    // Check if agency has custom point configuration
    const [customConfig] = await db.select()
      .from(externalAgencyPointConfig)
      .where(and(
        eq(externalAgencyPointConfig.agencyId, data.agencyId),
        eq(externalAgencyPointConfig.actionType, data.actionType),
        eq(externalAgencyPointConfig.isActive, true)
      ));
    
    if (customConfig) {
      points = customConfig.points;
    }

    // Create activity log
    const [activityLog] = await db.insert(externalAgencyActivityLogs).values({
      agencyId: data.agencyId,
      actorId: data.actorId,
      actorName: data.actorName,
      actorRole: data.actorRole,
      actionType: data.actionType,
      subjectType: data.subjectType,
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      subjectInfo: data.subjectInfo || {},
      pointsAwarded: points,
      notifiedToChat: true,
    }).returning();

    // Create system message in chat
    const actionMessage = ACTION_MESSAGES[data.actionType];
    const content = `${data.actorName} ${actionMessage.es}: ${data.subjectName}`;
    
    const [chatMessage] = await db.insert(externalAgencyChatMessages).values({
      agencyId: data.agencyId,
      senderId: data.actorId,
      senderName: data.actorName,
      senderRole: data.actorRole,
      senderAvatarUrl: null,
      messageType: 'system_activity',
      content,
      activityLogId: activityLog.id,
      readBy: [],
    }).returning();

    // Update activity log with chat message reference
    await db.update(externalAgencyActivityLogs)
      .set({ chatMessageId: chatMessage.id })
      .where(eq(externalAgencyActivityLogs.id, activityLog.id));

    // Update seller points
    const [existingPoints] = await db.select()
      .from(externalAgencySellerPoints)
      .where(and(
        eq(externalAgencySellerPoints.agencyId, data.agencyId),
        eq(externalAgencySellerPoints.sellerId, data.actorId)
      ));

    if (existingPoints) {
      // Get the field to increment based on action type
      const updateData: Record<string, any> = {
        totalPoints: existingPoints.totalPoints + points,
        weeklyPoints: existingPoints.weeklyPoints + points,
        monthlyPoints: existingPoints.monthlyPoints + points,
        updatedAt: new Date(),
      };

      // Increment specific counter based on action type
      switch (data.actionType) {
        case 'lead_registered':
          updateData.leadsRegistered = existingPoints.leadsRegistered + 1;
          break;
        case 'offer_sent':
          updateData.offersSent = existingPoints.offersSent + 1;
          break;
        case 'rental_form_sent':
          updateData.rentalFormsSent = existingPoints.rentalFormsSent + 1;
          break;
        case 'owner_registered':
          updateData.ownersRegistered = existingPoints.ownersRegistered + 1;
          break;
        case 'rental_completed':
          updateData.rentalsCompleted = existingPoints.rentalsCompleted + 1;
          break;
      }

      await db.update(externalAgencySellerPoints)
        .set(updateData)
        .where(eq(externalAgencySellerPoints.id, existingPoints.id));
    } else {
      // Create new points record
      const initialData: any = {
        agencyId: data.agencyId,
        sellerId: data.actorId,
        totalPoints: points,
        weeklyPoints: points,
        monthlyPoints: points,
        leadsRegistered: data.actionType === 'lead_registered' ? 1 : 0,
        offersSent: data.actionType === 'offer_sent' ? 1 : 0,
        rentalFormsSent: data.actionType === 'rental_form_sent' ? 1 : 0,
        ownersRegistered: data.actionType === 'owner_registered' ? 1 : 0,
        rentalsCompleted: data.actionType === 'rental_completed' ? 1 : 0,
      };

      await db.insert(externalAgencySellerPoints).values(initialData);
    }

    console.log(`[Activity] Logged: ${data.actionType} by ${data.actorName} - ${points} points`);
  } catch (error) {
    console.error('[Activity] Failed to log activity:', error);
  }
}

export async function getActivityDescription(actionType: ActionType, language: 'es' | 'en' = 'es'): string {
  return ACTION_MESSAGES[actionType]?.[language] || actionType;
}
