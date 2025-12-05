import { db } from "../db";
import { 
  appNotifications, 
  appNotificationPreferences,
  userFeedbackReports,
  users,
  InsertAppNotification,
  InsertUserFeedbackReport,
  AppNotification,
  AppNotificationPreferences,
  UserFeedbackReport,
} from "@shared/schema";
import { eq, and, desc, sql, isNull, or, count } from "drizzle-orm";
import { getUncachableResendClient } from "../resend-service";

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

class EmailNotificationService {
  private async getUserEmail(userId: string): Promise<string | null> {
    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
    return user?.email || null;
  }

  private async getUserName(userId: string): Promise<string> {
    const [user] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, userId));
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario' : 'Usuario';
  }

  private async checkEmailPreferences(userId: string, category: NotificationCategory): Promise<boolean> {
    const [prefs] = await db
      .select()
      .from(appNotificationPreferences)
      .where(eq(appNotificationPreferences.userId, userId));
    
    if (!prefs) return true;
    
    if (prefs.emailNotifications === false) return false;
    
    const categoryKey = `${category}Notifications` as keyof typeof prefs;
    if (prefs[categoryKey] === false) return false;
    
    return true;
  }

  private generateEmailHtml(title: string, body: string, actionUrl?: string, actionText?: string): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1E3A5F 0%, #2d5a7b 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">HomesApp</h1>
          <p style="color: #B8D4E8; margin: 8px 0 0; font-size: 14px;">Tulum Rental Homes</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1E3A5F; margin: 0 0 16px; font-size: 20px; font-weight: 600;">${title}</h2>
          <p style="color: #4a5568; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">${body}</p>
          ${actionUrl ? `
            <a href="${actionUrl}" style="display: inline-block; background-color: #1E3A5F; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
              ${actionText || 'Ver detalles'}
            </a>
          ` : ''}
        </div>
        <div style="background-color: #f7fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; margin: 0; font-size: 12px;">Este es un mensaje automático de HomesApp.</p>
          <p style="color: #718096; margin: 8px 0 0; font-size: 12px;">© ${new Date().getFullYear()} Tulum Rental Homes. Todos los derechos reservados.</p>
        </div>
      </div>
    `;
  }

  async sendNotificationEmail(
    recipientUserId: string,
    subject: string,
    title: string,
    body: string,
    actionUrl?: string,
    actionText?: string,
    category: NotificationCategory = 'system'
  ): Promise<boolean> {
    try {
      const canSendEmail = await this.checkEmailPreferences(recipientUserId, category);
      if (!canSendEmail) {
        console.log('[EmailNotification] User opted out of email notifications:', recipientUserId);
        return false;
      }

      const email = await this.getUserEmail(recipientUserId);
      if (!email) {
        console.log('[EmailNotification] User has no email:', recipientUserId);
        return false;
      }

      const { client, fromEmail } = await getUncachableResendClient();
      const html = this.generateEmailHtml(title, body, actionUrl, actionText);

      const { data, error } = await client.emails.send({
        from: fromEmail,
        to: [email],
        subject: `HomesApp - ${subject}`,
        html,
      });

      if (error) {
        console.error('[EmailNotification] Failed to send:', error);
        return false;
      }

      console.log('[EmailNotification] Email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('[EmailNotification] Error sending email:', error);
      return false;
    }
  }

  async sendPaymentReminderEmail(
    recipientUserId: string,
    amount: number,
    dueDate: Date,
    propertyName: string
  ): Promise<boolean> {
    const formattedAmount = amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    const formattedDate = dueDate.toLocaleDateString('es-MX', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    return this.sendNotificationEmail(
      recipientUserId,
      'Recordatorio de Pago',
      'Recordatorio de Pago Próximo',
      `Tienes un pago de ${formattedAmount} pendiente para la propiedad ${propertyName}. La fecha de vencimiento es el ${formattedDate}.`,
      undefined,
      'Ver mis pagos',
      'payment'
    );
  }

  async sendPaymentConfirmationEmail(
    recipientUserId: string,
    amount: number,
    propertyName: string
  ): Promise<boolean> {
    const formattedAmount = amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

    return this.sendNotificationEmail(
      recipientUserId,
      'Pago Confirmado',
      'Tu pago ha sido verificado',
      `Tu pago de ${formattedAmount} para la propiedad ${propertyName} ha sido verificado exitosamente.`,
      undefined,
      'Ver recibo',
      'payment'
    );
  }

  async sendContractExpirationEmail(
    recipientUserId: string,
    propertyName: string,
    expirationDate: Date,
    daysRemaining: number
  ): Promise<boolean> {
    const formattedDate = expirationDate.toLocaleDateString('es-MX', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    return this.sendNotificationEmail(
      recipientUserId,
      'Contrato por Vencer',
      'Tu contrato está por vencer',
      `Tu contrato de renta para ${propertyName} vence el ${formattedDate} (${daysRemaining} días restantes). Por favor contacta a tu administrador para renovar.`,
      undefined,
      'Ver contrato',
      'contract'
    );
  }

  async sendMaintenanceTicketEmail(
    recipientUserId: string,
    ticketTitle: string,
    ticketStatus: string,
    propertyName: string
  ): Promise<boolean> {
    const statusLabels: Record<string, string> = {
      'new': 'creado',
      'in_progress': 'en progreso',
      'resolved': 'resuelto',
      'closed': 'cerrado',
    };

    return this.sendNotificationEmail(
      recipientUserId,
      'Actualización de Mantenimiento',
      `Ticket de mantenimiento ${statusLabels[ticketStatus] || ticketStatus}`,
      `El ticket "${ticketTitle}" para la propiedad ${propertyName} ha sido ${statusLabels[ticketStatus] || 'actualizado'}.`,
      undefined,
      'Ver ticket',
      'maintenance'
    );
  }

  async sendDirectEmail(
    toEmail: string,
    subject: string,
    title: string,
    body: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<boolean> {
    try {
      const { client, fromEmail } = await getUncachableResendClient();
      const html = this.generateEmailHtml(title, body, actionUrl, actionText);

      const { data, error } = await client.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: `HomesApp - ${subject}`,
        html,
      });

      if (error) {
        console.error('[EmailNotification] Failed to send direct email:', error);
        return false;
      }

      console.log('[EmailNotification] Direct email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('[EmailNotification] Error sending direct email:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
export const feedbackService = new FeedbackService();
export const emailNotificationService = new EmailNotificationService();
