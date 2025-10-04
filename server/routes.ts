import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { createGoogleMeetEvent, deleteGoogleMeetEvent } from "./googleCalendar";
import {
  insertPropertySchema,
  insertAppointmentSchema,
  insertPresentationCardSchema,
  insertServiceProviderSchema,
  insertServiceSchema,
  insertOfferSchema,
  insertPermissionSchema,
  insertPropertyStaffSchema,
  insertBudgetSchema,
  insertTaskSchema,
  insertWorkReportSchema,
  insertAuditLogSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes
  app.get("/api/users", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/pending", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const users = await storage.getUsersByStatus("pending");
      res.json(users);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post("/api/users/:id/approve", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUserStatus(id, "approved");
      res.json(user);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post("/api/users/:id/reject", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUserStatus(id, "rejected");
      res.json(user);
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.post("/api/users/approve-all", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const count = await storage.approveAllPendingUsers();
      res.json({ count });
    } catch (error) {
      console.error("Error approving all users:", error);
      res.status(500).json({ message: "Failed to approve all users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole(["master"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get("/api/users/role/:role", isAuthenticated, async (req, res) => {
    try {
      const { role } = req.params;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Failed to fetch users by role" });
    }
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    try {
      const { status, ownerId, active } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (ownerId) filters.ownerId = ownerId;
      if (active !== undefined) filters.active = active === "true";
      
      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query required" });
      }
      const properties = await storage.searchProperties(q);
      res.json(properties);
    } catch (error) {
      console.error("Error searching properties:", error);
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["master", "admin", "admin_jr", "seller", "owner"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const propertyData = insertPropertySchema.parse({
        ...req.body,
        ownerId: req.body.ownerId || userId,
      });
      
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error: any) {
      console.error("Error creating property:", error);
      res.status(400).json({ message: error.message || "Failed to create property" });
    }
  });

  app.patch("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!user || (property.ownerId !== userId && !["master", "admin", "admin_jr"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedProperty = await storage.updateProperty(id, req.body);
      res.json(updatedProperty);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!user || (property.ownerId !== userId && !["master", "admin"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteProperty(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Property staff routes
  app.post("/api/properties/:id/staff", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!user || (property.ownerId !== userId && !["master", "admin"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const staffData = insertPropertyStaffSchema.parse({
        propertyId: id,
        ...req.body,
      });

      const staff = await storage.assignStaff(staffData);
      res.status(201).json(staff);
    } catch (error: any) {
      console.error("Error assigning staff:", error);
      res.status(400).json({ message: error.message || "Failed to assign staff" });
    }
  });

  app.get("/api/properties/:id/staff", async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await storage.getPropertyStaff(id);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching property staff:", error);
      res.status(500).json({ message: "Failed to fetch property staff" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const { status, clientId, propertyId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (propertyId) filters.propertyId = propertyId;

      const appointments = await storage.getAppointments(filters);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentData = insertAppointmentSchema.parse({
        ...req.body,
        clientId: req.body.clientId || userId,
      });

      // Create Google Meet event if type is video
      let meetLink = null;
      let googleEventId = null;
      
      if (appointmentData.type === "video") {
        const property = await storage.getProperty(appointmentData.propertyId);
        const appointmentDate = new Date(appointmentData.date);
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later

        const eventResult = await createGoogleMeetEvent({
          summary: `Visita Virtual: ${property?.title || "Propiedad"}`,
          description: `Cita virtual para visitar la propiedad`,
          start: appointmentDate,
          end: endDate,
          attendees: [], // Can be extended to include emails
        });

        if (eventResult) {
          meetLink = eventResult.meetLink;
          googleEventId = eventResult.eventId;
        }
      }

      const appointment = await storage.createAppointment({
        ...appointmentData,
        meetLink: meetLink || appointmentData.meetLink,
        googleEventId: googleEventId || undefined,
      });

      res.status(201).json(appointment);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ message: error.message || "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.updateAppointment(id, req.body);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.getAppointment(id);

      if (appointment?.googleEventId) {
        await deleteGoogleMeetEvent(appointment.googleEventId);
      }

      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Presentation card routes
  app.get("/api/presentation-cards", isAuthenticated, async (req, res) => {
    try {
      const { clientId } = req.query;
      const cards = await storage.getPresentationCards(clientId as string);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching presentation cards:", error);
      res.status(500).json({ message: "Failed to fetch presentation cards" });
    }
  });

  app.get("/api/presentation-cards/:id/matches", async (req, res) => {
    try {
      const { id } = req.params;
      const properties = await storage.matchPropertiesForCard(id);
      res.json(properties);
    } catch (error) {
      console.error("Error matching properties:", error);
      res.status(500).json({ message: "Failed to match properties" });
    }
  });

  app.post("/api/presentation-cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardData = insertPresentationCardSchema.parse({
        ...req.body,
        clientId: req.body.clientId || userId,
      });

      const card = await storage.createPresentationCard(cardData);
      res.status(201).json(card);
    } catch (error: any) {
      console.error("Error creating presentation card:", error);
      res.status(400).json({ message: error.message || "Failed to create presentation card" });
    }
  });

  app.patch("/api/presentation-cards/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const card = await storage.updatePresentationCard(id, req.body);
      res.json(card);
    } catch (error) {
      console.error("Error updating presentation card:", error);
      res.status(500).json({ message: "Failed to update presentation card" });
    }
  });

  app.delete("/api/presentation-cards/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePresentationCard(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting presentation card:", error);
      res.status(500).json({ message: "Failed to delete presentation card" });
    }
  });

  // Service provider routes
  app.get("/api/service-providers", async (req, res) => {
    try {
      const { specialty, available } = req.query;
      const filters: any = {};
      if (specialty) filters.specialty = specialty;
      if (available !== undefined) filters.available = available === "true";

      const providers = await storage.getServiceProviders(filters);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching service providers:", error);
      res.status(500).json({ message: "Failed to fetch service providers" });
    }
  });

  app.post("/api/service-providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerData = insertServiceProviderSchema.parse({
        ...req.body,
        userId,
      });

      const provider = await storage.createServiceProvider(providerData);
      res.status(201).json(provider);
    } catch (error: any) {
      console.error("Error creating service provider:", error);
      res.status(400).json({ message: error.message || "Failed to create service provider" });
    }
  });

  app.patch("/api/service-providers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await storage.updateServiceProvider(id, req.body);
      res.json(provider);
    } catch (error) {
      console.error("Error updating service provider:", error);
      res.status(500).json({ message: "Failed to update service provider" });
    }
  });

  // Service routes
  app.get("/api/service-providers/:id/services", async (req, res) => {
    try {
      const { id } = req.params;
      const services = await storage.getServicesByProvider(id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error: any) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: error.message || "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const service = await storage.updateService(id, req.body);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteService(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Offer routes
  app.get("/api/offers", isAuthenticated, async (req, res) => {
    try {
      const { status, clientId, propertyId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (propertyId) filters.propertyId = propertyId;

      const offers = await storage.getOffers(filters);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post("/api/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const offerData = insertOfferSchema.parse({
        ...req.body,
        clientId: req.body.clientId || userId,
      });

      const offer = await storage.createOffer(offerData);
      res.status(201).json(offer);
    } catch (error: any) {
      console.error("Error creating offer:", error);
      res.status(400).json({ message: error.message || "Failed to create offer" });
    }
  });

  app.patch("/api/offers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const offer = await storage.updateOffer(id, req.body);
      res.json(offer);
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(500).json({ message: "Failed to update offer" });
    }
  });

  // Permission routes
  app.get("/api/users/:id/permissions", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const permissions = await storage.getUserPermissions(id);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/permissions", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const permissionData = insertPermissionSchema.parse(req.body);
      const permission = await storage.addPermission(permissionData);
      res.status(201).json(permission);
    } catch (error: any) {
      console.error("Error adding permission:", error);
      res.status(400).json({ message: error.message || "Failed to add permission" });
    }
  });

  app.delete("/api/permissions", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { userId, permission } = req.body;
      await storage.removePermission(userId, permission);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing permission:", error);
      res.status(500).json({ message: "Failed to remove permission" });
    }
  });

  // Budget routes
  app.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, staffId, status } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (staffId) filters.staffId = staffId;
      if (status) filters.status = status;

      const budgets = await storage.getBudgets(filters);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.get("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const budget = await storage.getBudget(id);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget:", error);
      res.status(500).json({ message: "Failed to fetch budget" });
    }
  });

  app.post("/api/budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["master", "admin", "admin_jr", "management", "provider"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        staffId: req.body.staffId || userId,
      });
      
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error: any) {
      console.error("Error creating budget:", error);
      res.status(400).json({ message: error.message || "Failed to create budget" });
    }
  });

  app.patch("/api/budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const budget = await storage.getBudget(id);

      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      if (!user || (budget.staffId !== userId && !["master", "admin", "admin_jr"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedBudget = await storage.updateBudget(id, req.body);
      res.json(updatedBudget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  app.delete("/api/budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const budget = await storage.getBudget(id);

      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      if (!user || (budget.staffId !== userId && !["master", "admin"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteBudget(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, assignedToId, status } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (assignedToId) filters.assignedToId = assignedToId;
      if (status) filters.status = status;

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["master", "admin", "admin_jr", "management"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: error.message || "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const task = await storage.getTask(id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (!user || (task.assignedToId !== userId && !["master", "admin", "admin_jr", "management"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedTask = await storage.updateTask(id, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const task = await storage.getTask(id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (!user || !["master", "admin", "management"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Work report routes
  app.get("/api/work-reports", isAuthenticated, async (req, res) => {
    try {
      const { taskId, staffId } = req.query;
      const filters: any = {};
      if (taskId) filters.taskId = taskId;
      if (staffId) filters.staffId = staffId;

      const reports = await storage.getWorkReports(filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching work reports:", error);
      res.status(500).json({ message: "Failed to fetch work reports" });
    }
  });

  app.get("/api/work-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getWorkReport(id);
      if (!report) {
        return res.status(404).json({ message: "Work report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching work report:", error);
      res.status(500).json({ message: "Failed to fetch work report" });
    }
  });

  app.post("/api/work-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportData = insertWorkReportSchema.parse({
        ...req.body,
        staffId: req.body.staffId || userId,
      });

      const report = await storage.createWorkReport(reportData);
      res.status(201).json(report);
    } catch (error: any) {
      console.error("Error creating work report:", error);
      res.status(400).json({ message: error.message || "Failed to create work report" });
    }
  });

  // Audit log routes
  app.get("/api/audit-logs", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { userId, entityType, entityId, action, limit } = req.query;
      const filters: any = {};
      if (userId) filters.userId = userId;
      if (entityType) filters.entityType = entityType;
      if (entityId) filters.entityId = entityId;
      if (action) filters.action = action;
      if (limit) filters.limit = parseInt(limit as string);

      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);

      // Users can view their own audit logs, admins can view any user's logs
      if (userId !== currentUserId && !["master", "admin"].includes(currentUser?.role || "")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const logs = await storage.getUserAuditHistory(userId, limit ? parseInt(limit as string) : 100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user audit history:", error);
      res.status(500).json({ message: "Failed to fetch user audit history" });
    }
  });

  app.post("/api/audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      const logData = insertAuditLogSchema.parse(req.body);
      const log = await storage.createAuditLog(logData);
      res.status(201).json(log);
    } catch (error: any) {
      console.error("Error creating audit log:", error);
      res.status(400).json({ message: error.message || "Failed to create audit log" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
