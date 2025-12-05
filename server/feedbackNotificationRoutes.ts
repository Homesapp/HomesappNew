import { Express } from "express";
import { isAuthenticated, requireRole } from "./replitAuth";
import { storage } from "./storage";
import { notificationService, feedbackService } from "./services/notificationService";
import { insertUserFeedbackReportSchema } from "@shared/schema";

export function registerFeedbackNotificationRoutes(app: Express) {
  // ============================================
  // App Notifications API
  // ============================================

  // GET /api/app-notifications - Get user notifications
  app.get("/api/app-notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { category, isRead, limit, offset } = req.query;
      
      const result = await notificationService.getNotifications({
        userId,
        category: category as any,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('[Notifications] Error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/app-notifications/recent - Get recent notifications for bell dropdown
  app.get("/api/app-notifications/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const notifications = await notificationService.getRecentNotifications(userId, 10);
      const unreadCount = await notificationService.getUnreadCount(userId);
      res.json({ notifications, unreadCount });
    } catch (error: any) {
      console.error('[Notifications] Error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/app-notifications/unread-count - Get unread count
  app.get("/api/app-notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/app-notifications/:id/read - Mark as read
  app.post("/api/app-notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const notification = await notificationService.markAsRead(req.params.id, userId);
      if (!notification) return res.status(404).json({ message: "Notificación no encontrada" });
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/app-notifications/mark-all-read - Mark all as read
  app.post("/api/app-notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const count = await notificationService.markAllAsRead(userId);
      res.json({ markedCount: count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/app-notification-preferences - Get user preferences
  app.get("/api/app-notification-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      let prefs = await notificationService.getUserPreferences(userId);
      if (!prefs) {
        prefs = await notificationService.upsertUserPreferences(userId, {});
      }
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH /api/app-notification-preferences - Update preferences
  app.patch("/api/app-notification-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const prefs = await notificationService.upsertUserPreferences(userId, req.body);
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // User Feedback API
  // ============================================

  // POST /api/user-feedback - Submit feedback (available to all, including anonymous)
  app.post("/api/user-feedback", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const user = userId ? await storage.getUser(userId) : null;
      
      const feedbackData = {
        ...req.body,
        userId,
        userEmail: user?.email || req.body.userEmail,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : req.body.userName,
        userRole: user?.role || req.body.userRole || 'anonymous',
        agencyId: user?.agencyId || req.body.agencyId,
      };
      
      const validationResult = insertUserFeedbackReportSchema.safeParse(feedbackData);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Datos inválidos", errors: validationResult.error.errors });
      }
      
      const feedback = await feedbackService.createFeedback(validationResult.data);
      
      // Notify admins of high urgency feedback
      if (feedback.urgency === 'high') {
        // Could add admin notification here in the future
      }
      
      res.status(201).json(feedback);
    } catch (error: any) {
      console.error('[Feedback] Error creating:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/user-feedback - List feedback (admin only)
  app.get("/api/user-feedback", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { status, type, urgency, agencyId, limit, offset } = req.query;
      
      const result = await feedbackService.getFeedbackList({
        status: status as string,
        type: type as string,
        urgency: urgency as string,
        agencyId: agencyId as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/user-feedback/stats - Get feedback stats (admin)
  app.get("/api/user-feedback/stats", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const [newCount, highUrgencyCount] = await Promise.all([
        feedbackService.getNewFeedbackCount(),
        feedbackService.getHighUrgencyFeedbackCount(),
      ]);
      res.json({ newCount, highUrgencyCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/user-feedback/:id - Get single feedback (admin)
  app.get("/api/user-feedback/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const feedback = await feedbackService.getFeedbackById(req.params.id);
      if (!feedback) return res.status(404).json({ message: "No encontrado" });
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH /api/user-feedback/:id - Update feedback status (admin)
  app.patch("/api/user-feedback/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { status, adminNotes, resolution } = req.body;
      
      const feedback = await feedbackService.updateFeedbackStatus(
        req.params.id,
        status,
        userId,
        adminNotes,
        resolution
      );
      
      if (!feedback) return res.status(404).json({ message: "No encontrado" });
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  console.log('[Routes] Feedback and notification routes registered');
}
