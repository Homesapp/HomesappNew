import { db } from "../db";
import { 
  appNotifications, 
  appNotificationPreferences,
  userFeedbackReports,
  InsertAppNotification,
  InsertUserFeedbackReport,
  AppNotification,
  AppNotificationPreferences,
  UserFeedbackReport,
} from "@shared/schema";
import { eq, and, desc, sql, isNull, or, count } from "drizzle-orm";

export type NotificationCategory = 'lead' | 'payment' | 'maintenance' | 'message' | 'appointment' | 'contract' | 'system';

export interface CreateNotificationParams {
  recipientUserId: string;
  recipientRole?: string;
  agencyId?: string;
  category: NotificationCategory;
  type: string;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  triggeredByUserId?: string;
  triggeredByName?: string;
}

export interface NotificationFilters {
  userId: string;
  category?: NotificationCategory;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

class NotificationService {
  async createNotification(params: CreateNotificationParams): Promise<AppNotification | null> {
    try {
      const prefs = await this.getUserPreferences(params.recipientUserId);
      
      if (prefs) {
        const categoryKey = `${params.category}Notifications` as keyof AppNotificationPreferences;
        if (prefs[categoryKey] === false) {
          return null;
        }
      }

      const [notification] = await db
        .insert(appNotifications)
        .values({
          recipientUserId: params.recipientUserId,
          recipientRole: params.recipientRole,
          agencyId: params.agencyId,
          category: params.category,
          type: params.type,
          title: params.title,
          body: params.body,
          payload: params.payload,
          triggeredByUserId: params.triggeredByUserId,
          triggeredByName: params.triggeredByName,
        })
        .returning();

      return notification;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      return null;
    }
  }

  async createNotificationBatch(notifications: CreateNotificationParams[]): Promise<AppNotification[]> {
    const results: AppNotification[] = [];
    for (const params of notifications) {
      const notification = await this.createNotification(params);
      if (notification) {
        results.push(notification);
      }
    }
    return results;
  }

  async getNotifications(filters: NotificationFilters): Promise<{ notifications: AppNotification[]; total: number }> {
    const conditions = [eq(appNotifications.recipientUserId, filters.userId)];
    
    if (filters.category) {
      conditions.push(eq(appNotifications.category, filters.category));
    }
    
    if (filters.isRead !== undefined) {
      conditions.push(eq(appNotifications.isRead, filters.isRead));
    }

    const [notifications, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(appNotifications)
        .where(and(...conditions))
        .orderBy(desc(appNotifications.createdAt))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0),
      db
        .select({ count: count() })
        .from(appNotifications)
        .where(and(...conditions)),
    ]);

    return { notifications, total: Number(total) };
  }

  async getRecentNotifications(userId: string, limit: number = 10): Promise<AppNotification[]> {
    return db
      .select()
      .from(appNotifications)
      .where(eq(appNotifications.recipientUserId, userId))
      .orderBy(desc(appNotifications.createdAt))
      .limit(limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(appNotifications)
      .where(
        and(
          eq(appNotifications.recipientUserId, userId),
          eq(appNotifications.isRead, false)
        )
      );
    return Number(result?.count || 0);
  }

  async markAsRead(notificationId: string, userId: string): Promise<AppNotification | null> {
    const [notification] = await db
      .update(appNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(appNotifications.id, notificationId),
          eq(appNotifications.recipientUserId, userId)
        )
      )
      .returning();
    return notification || null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await db
      .update(appNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(appNotifications.recipientUserId, userId),
          eq(appNotifications.isRead, false)
        )
      );
    return result.rowCount || 0;
  }

  async getUserPreferences(userId: string): Promise<AppNotificationPreferences | null> {
    const [prefs] = await db
      .select()
      .from(appNotificationPreferences)
      .where(eq(appNotificationPreferences.userId, userId));
    return prefs || null;
  }

  async upsertUserPreferences(
    userId: string, 
    preferences: Partial<Omit<AppNotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AppNotificationPreferences> {
    const existing = await this.getUserPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(appNotificationPreferences)
        .set({ ...preferences, updatedAt: new Date() })
        .where(eq(appNotificationPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(appNotificationPreferences)
        .values({ userId, ...preferences })
        .returning();
      return created;
    }
  }

  async notifyLeadAssigned(leadId: string, sellerId: string, leadName: string, triggeredBy?: { userId: string; name: string }): Promise<void> {
    await this.createNotification({
      recipientUserId: sellerId,
      category: 'lead',
      type: 'lead_assigned',
      title: 'Nuevo lead asignado',
      body: `Se te ha asignado el lead: ${leadName}`,
      payload: { leadId, actionUrl: `/external/clients` },
      triggeredByUserId: triggeredBy?.userId,
      triggeredByName: triggeredBy?.name,
    });
  }

  async notifyLeadStageChange(leadId: string, sellerId: string, leadName: string, newStage: string): Promise<void> {
    await this.createNotification({
      recipientUserId: sellerId,
      category: 'lead',
      type: 'lead_stage_change',
      title: 'Lead actualizado',
      body: `El lead ${leadName} avanzó a: ${newStage}`,
      payload: { leadId, stage: newStage, actionUrl: `/external/clients` },
    });
  }

  async notifyPaymentStatusChange(
    recipientUserId: string, 
    paymentId: string, 
    contractId: string, 
    newStatus: string,
    amount?: number
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      'verified': 'Tu pago ha sido verificado',
      'rejected': 'Tu pago ha sido rechazado',
      'pending': 'Tienes un pago pendiente',
    };

    await this.createNotification({
      recipientUserId,
      category: 'payment',
      type: `payment_${newStatus}`,
      title: statusMessages[newStatus] || 'Estado de pago actualizado',
      body: amount ? `Monto: $${amount.toLocaleString()}` : undefined,
      payload: { paymentId, contractId, actionUrl: `/portal/payments` },
    });
  }

  async notifyTicketUpdate(
    recipientUserId: string,
    ticketId: string,
    ticketTitle: string,
    updateType: string,
    triggeredBy?: { userId: string; name: string }
  ): Promise<void> {
    const messages: Record<string, string> = {
      'status_change': `El ticket "${ticketTitle}" ha cambiado de estado`,
      'new_comment': `Nuevo comentario en el ticket "${ticketTitle}"`,
      'assigned': `Se te ha asignado el ticket "${ticketTitle}"`,
    };

    await this.createNotification({
      recipientUserId,
      category: 'maintenance',
      type: `ticket_${updateType}`,
      title: messages[updateType] || 'Ticket actualizado',
      payload: { ticketId, actionUrl: `/portal/maintenance` },
      triggeredByUserId: triggeredBy?.userId,
      triggeredByName: triggeredBy?.name,
    });
  }

  async notifyNewMessage(
    recipientUserId: string,
    messageId: string,
    contractId: string,
    senderName: string
  ): Promise<void> {
    await this.createNotification({
      recipientUserId,
      category: 'message',
      type: 'new_message',
      title: 'Nuevo mensaje',
      body: `${senderName} te ha enviado un mensaje`,
      payload: { messageId, contractId, actionUrl: `/portal/messages` },
      triggeredByName: senderName,
    });
  }

  async notifyAppointment(
    recipientUserId: string,
    appointmentId: string,
    propertyAddress: string,
    appointmentDate: Date,
    type: 'created' | 'updated' | 'cancelled' | 'reminder'
  ): Promise<void> {
    const titles: Record<string, string> = {
      'created': 'Nueva visita programada',
      'updated': 'Visita actualizada',
      'cancelled': 'Visita cancelada',
      'reminder': 'Recordatorio de visita',
    };

    await this.createNotification({
      recipientUserId,
      category: 'appointment',
      type: `appointment_${type}`,
      title: titles[type],
      body: `${propertyAddress} - ${appointmentDate.toLocaleDateString()}`,
      payload: { appointmentId, actionUrl: `/external/calendar` },
    });
  }

  async notifyContractUpdate(
    recipientUserId: string,
    contractId: string,
    updateType: string,
    details?: string
  ): Promise<void> {
    await this.createNotification({
      recipientUserId,
      category: 'contract',
      type: `contract_${updateType}`,
      title: 'Contrato actualizado',
      body: details,
      payload: { contractId, actionUrl: `/portal/contract` },
    });
  }

  async notifySystem(
    recipientUserId: string,
    title: string,
    body?: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    await this.createNotification({
      recipientUserId,
      category: 'system',
      type: 'system_notification',
      title,
      body,
      payload,
    });
  }
}

class FeedbackService {
  async createFeedback(data: InsertUserFeedbackReport): Promise<UserFeedbackReport> {
    const [feedback] = await db
      .insert(userFeedbackReports)
      .values(data)
      .returning();
    return feedback;
  }

  async getFeedbackList(filters: {
    status?: string;
    type?: string;
    urgency?: string;
    agencyId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ feedback: UserFeedbackReport[]; total: number }> {
    const conditions: ReturnType<typeof eq>[] = [];
    
    if (filters.status) {
      conditions.push(eq(userFeedbackReports.status, filters.status as any));
    }
    if (filters.type) {
      conditions.push(eq(userFeedbackReports.type, filters.type as any));
    }
    if (filters.urgency) {
      conditions.push(eq(userFeedbackReports.urgency, filters.urgency as any));
    }
    if (filters.agencyId) {
      conditions.push(eq(userFeedbackReports.agencyId, filters.agencyId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [feedback, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(userFeedbackReports)
        .where(whereClause)
        .orderBy(desc(userFeedbackReports.createdAt))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0),
      db
        .select({ count: count() })
        .from(userFeedbackReports)
        .where(whereClause),
    ]);

    return { feedback, total: Number(total) };
  }

  async getFeedbackById(id: string): Promise<UserFeedbackReport | null> {
    const [feedback] = await db
      .select()
      .from(userFeedbackReports)
      .where(eq(userFeedbackReports.id, id));
    return feedback || null;
  }

  async updateFeedbackStatus(
    id: string, 
    status: string, 
    handledBy: string, 
    adminNotes?: string,
    resolution?: string
  ): Promise<UserFeedbackReport | null> {
    const updates: Partial<UserFeedbackReport> = {
      status: status as any,
      handledBy,
      adminNotes,
      updatedAt: new Date(),
    };

    if (status === 'resolved') {
      updates.resolvedAt = new Date();
      updates.resolution = resolution;
    }

    const [feedback] = await db
      .update(userFeedbackReports)
      .set(updates)
      .where(eq(userFeedbackReports.id, id))
      .returning();
    
    return feedback || null;
  }

  async getNewFeedbackCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(userFeedbackReports)
      .where(eq(userFeedbackReports.status, 'new'));
    return Number(result?.count || 0);
  }

  async getHighUrgencyFeedbackCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(userFeedbackReports)
      .where(
        and(
          eq(userFeedbackReports.urgency, 'high'),
          or(
            eq(userFeedbackReports.status, 'new'),
            eq(userFeedbackReports.status, 'in_review')
          )
        )
      );
    return Number(result?.count || 0);
  }
}

export const notificationService = new NotificationService();
export const feedbackService = new FeedbackService();
