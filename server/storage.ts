import {
  users,
  properties,
  appointments,
  presentationCards,
  serviceProviders,
  services,
  offers,
  permissions,
  propertyStaff,
  budgets,
  tasks,
  workReports,
  auditLogs,
  type User,
  type UpsertUser,
  type InsertUser,
  type Property,
  type InsertProperty,
  type Appointment,
  type InsertAppointment,
  type PresentationCard,
  type InsertPresentationCard,
  type ServiceProvider,
  type InsertServiceProvider,
  type Service,
  type InsertService,
  type Offer,
  type InsertOffer,
  type Permission,
  type InsertPermission,
  type PropertyStaff,
  type InsertPropertyStaff,
  type Budget,
  type InsertBudget,
  type Task,
  type InsertTask,
  type WorkReport,
  type InsertWorkReport,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, ilike, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByStatus(status: string): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserStatus(id: string, status: string): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  approveAllPendingUsers(): Promise<number>;
  
  // Property operations
  getProperty(id: string): Promise<Property | undefined>;
  getProperties(filters?: { status?: string; ownerId?: string; active?: boolean }): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: string): Promise<void>;
  searchProperties(query: string): Promise<Property[]>;
  
  // Property staff operations
  assignStaff(assignment: InsertPropertyStaff): Promise<PropertyStaff>;
  getPropertyStaff(propertyId: string): Promise<PropertyStaff[]>;
  removeStaff(propertyId: string, staffId: string, role: string): Promise<void>;
  
  // Appointment operations
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointments(filters?: { status?: string; clientId?: string; propertyId?: string }): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;
  
  // Presentation card operations
  getPresentationCard(id: string): Promise<PresentationCard | undefined>;
  getPresentationCards(clientId?: string): Promise<PresentationCard[]>;
  createPresentationCard(card: InsertPresentationCard): Promise<PresentationCard>;
  updatePresentationCard(id: string, updates: Partial<InsertPresentationCard>): Promise<PresentationCard>;
  deletePresentationCard(id: string): Promise<void>;
  matchPropertiesForCard(cardId: string): Promise<Property[]>;
  
  // Service provider operations
  getServiceProvider(id: string): Promise<ServiceProvider | undefined>;
  getServiceProviders(filters?: { specialty?: string; available?: boolean }): Promise<ServiceProvider[]>;
  createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider>;
  updateServiceProvider(id: string, updates: Partial<InsertServiceProvider>): Promise<ServiceProvider>;
  
  // Service operations
  getService(id: string): Promise<Service | undefined>;
  getServicesByProvider(providerId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  
  // Offer operations
  getOffer(id: string): Promise<Offer | undefined>;
  getOffers(filters?: { status?: string; clientId?: string; propertyId?: string }): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: string, updates: Partial<InsertOffer>): Promise<Offer>;
  
  // Permission operations
  getUserPermissions(userId: string): Promise<Permission[]>;
  addPermission(permission: InsertPermission): Promise<Permission>;
  removePermission(userId: string, permissionName: string): Promise<void>;
  hasPermission(userId: string, permissionName: string): Promise<boolean>;
  
  // Budget operations
  getBudget(id: string): Promise<Budget | undefined>;
  getBudgets(filters?: { propertyId?: string; staffId?: string; status?: string }): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, updates: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  
  // Task operations
  getTask(id: string): Promise<Task | undefined>;
  getTasks(filters?: { propertyId?: string; assignedToId?: string; status?: string }): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Work report operations
  getWorkReport(id: string): Promise<WorkReport | undefined>;
  getWorkReports(filters?: { taskId?: string; staffId?: string }): Promise<WorkReport[]>;
  createWorkReport(report: InsertWorkReport): Promise<WorkReport>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; entityType?: string; entityId?: string; action?: string; limit?: number }): Promise<AuditLog[]>;
  getUserAuditHistory(userId: string, limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByStatus(status: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, status as any));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async updateUserStatus(id: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async approveAllPendingUsers(): Promise<number> {
    const result = await db
      .update(users)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(users.status, "pending"))
      .returning();
    return result.length;
  }

  // Property operations
  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getProperties(filters?: { status?: string; ownerId?: string; active?: boolean }): Promise<Property[]> {
    let query = db.select().from(properties);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(properties.status, filters.status as any));
    }
    if (filters?.ownerId) {
      conditions.push(eq(properties.ownerId, filters.ownerId));
    }
    if (filters?.active !== undefined) {
      conditions.push(eq(properties.active, filters.active));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(properties.createdAt));
  }

  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(propertyData).returning();
    return property;
  }

  async updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property> {
    const [property] = await db
      .update(properties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async deleteProperty(id: string): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  async searchProperties(query: string): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(
        or(
          ilike(properties.title, `%${query}%`),
          ilike(properties.location, `%${query}%`),
          ilike(properties.description, `%${query}%`)
        )
      )
      .orderBy(desc(properties.createdAt));
  }

  // Property staff operations
  async assignStaff(assignment: InsertPropertyStaff): Promise<PropertyStaff> {
    const [staff] = await db.insert(propertyStaff).values(assignment).returning();
    return staff;
  }

  async getPropertyStaff(propertyId: string): Promise<PropertyStaff[]> {
    return await db.select().from(propertyStaff).where(eq(propertyStaff.propertyId, propertyId));
  }

  async removeStaff(propertyId: string, staffId: string, role: string): Promise<void> {
    await db
      .delete(propertyStaff)
      .where(
        and(
          eq(propertyStaff.propertyId, propertyId),
          eq(propertyStaff.staffId, staffId),
          eq(propertyStaff.role, role)
        )
      );
  }

  // Appointment operations
  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointments(filters?: { status?: string; clientId?: string; propertyId?: string }): Promise<Appointment[]> {
    let query = db.select().from(appointments);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(appointments.status, filters.status as any));
    }
    if (filters?.clientId) {
      conditions.push(eq(appointments.clientId, filters.clientId));
    }
    if (filters?.propertyId) {
      conditions.push(eq(appointments.propertyId, filters.propertyId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(appointments.date));
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(appointmentData).returning();
    return appointment;
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // Presentation card operations
  async getPresentationCard(id: string): Promise<PresentationCard | undefined> {
    const [card] = await db.select().from(presentationCards).where(eq(presentationCards.id, id));
    return card;
  }

  async getPresentationCards(clientId?: string): Promise<PresentationCard[]> {
    if (clientId) {
      return await db
        .select()
        .from(presentationCards)
        .where(eq(presentationCards.clientId, clientId))
        .orderBy(desc(presentationCards.createdAt));
    }
    return await db.select().from(presentationCards).orderBy(desc(presentationCards.createdAt));
  }

  async createPresentationCard(cardData: InsertPresentationCard): Promise<PresentationCard> {
    const [card] = await db.insert(presentationCards).values(cardData).returning();
    return card;
  }

  async updatePresentationCard(id: string, updates: Partial<InsertPresentationCard>): Promise<PresentationCard> {
    const [card] = await db
      .update(presentationCards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presentationCards.id, id))
      .returning();
    return card;
  }

  async deletePresentationCard(id: string): Promise<void> {
    await db.delete(presentationCards).where(eq(presentationCards.id, id));
  }

  async matchPropertiesForCard(cardId: string): Promise<Property[]> {
    const card = await this.getPresentationCard(cardId);
    if (!card) return [];

    const conditions = [eq(properties.active, true)];

    if (card.modality !== "both") {
      conditions.push(
        or(
          eq(properties.status, card.modality),
          eq(properties.status, "both")
        ) as any
      );
    }

    conditions.push(gte(properties.price, card.minPrice));
    conditions.push(lte(properties.price, card.maxPrice));

    if (card.bedrooms) {
      conditions.push(gte(properties.bedrooms, card.bedrooms));
    }

    if (card.bathrooms) {
      conditions.push(gte(properties.bathrooms, String(card.bathrooms)));
    }

    if (card.location) {
      conditions.push(ilike(properties.location, `%${card.location}%`));
    }

    return await db
      .select()
      .from(properties)
      .where(and(...conditions))
      .orderBy(desc(properties.createdAt));
  }

  // Service provider operations
  async getServiceProvider(id: string): Promise<ServiceProvider | undefined> {
    const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
    return provider;
  }

  async getServiceProviders(filters?: { specialty?: string; available?: boolean }): Promise<ServiceProvider[]> {
    let query = db.select().from(serviceProviders);
    const conditions = [];

    if (filters?.specialty) {
      conditions.push(eq(serviceProviders.specialty, filters.specialty));
    }
    if (filters?.available !== undefined) {
      conditions.push(eq(serviceProviders.available, filters.available));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(serviceProviders.rating));
  }

  async createServiceProvider(providerData: InsertServiceProvider): Promise<ServiceProvider> {
    const [provider] = await db.insert(serviceProviders).values(providerData).returning();
    return provider;
  }

  async updateServiceProvider(id: string, updates: Partial<InsertServiceProvider>): Promise<ServiceProvider> {
    const [provider] = await db
      .update(serviceProviders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceProviders.id, id))
      .returning();
    return provider;
  }

  // Service operations
  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getServicesByProvider(providerId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.providerId, providerId));
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Offer operations
  async getOffer(id: string): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer;
  }

  async getOffers(filters?: { status?: string; clientId?: string; propertyId?: string }): Promise<Offer[]> {
    let query = db.select().from(offers);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(offers.status, filters.status as any));
    }
    if (filters?.clientId) {
      conditions.push(eq(offers.clientId, filters.clientId));
    }
    if (filters?.propertyId) {
      conditions.push(eq(offers.propertyId, filters.propertyId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(offers.createdAt));
  }

  async createOffer(offerData: InsertOffer): Promise<Offer> {
    const [offer] = await db.insert(offers).values(offerData).returning();
    return offer;
  }

  async updateOffer(id: string, updates: Partial<InsertOffer>): Promise<Offer> {
    const [offer] = await db
      .update(offers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(offers.id, id))
      .returning();
    return offer;
  }

  // Permission operations
  async getUserPermissions(userId: string): Promise<Permission[]> {
    return await db.select().from(permissions).where(eq(permissions.userId, userId));
  }

  async addPermission(permissionData: InsertPermission): Promise<Permission> {
    const [permission] = await db.insert(permissions).values(permissionData).returning();
    return permission;
  }

  async removePermission(userId: string, permissionName: string): Promise<void> {
    await db
      .delete(permissions)
      .where(and(eq(permissions.userId, userId), eq(permissions.permission, permissionName)));
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const [permission] = await db
      .select()
      .from(permissions)
      .where(and(eq(permissions.userId, userId), eq(permissions.permission, permissionName)));
    return !!permission;
  }

  // Budget operations
  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }

  async getBudgets(filters?: { propertyId?: string; staffId?: string; status?: string }): Promise<Budget[]> {
    let query = db.select().from(budgets);
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(eq(budgets.propertyId, filters.propertyId));
    }
    if (filters?.staffId) {
      conditions.push(eq(budgets.staffId, filters.staffId));
    }
    if (filters?.status) {
      conditions.push(eq(budgets.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(budgets.createdAt));
  }

  async createBudget(budgetData: InsertBudget): Promise<Budget> {
    const [budget] = await db.insert(budgets).values(budgetData).returning();
    return budget;
  }

  async updateBudget(id: string, updates: Partial<InsertBudget>): Promise<Budget> {
    const [budget] = await db
      .update(budgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return budget;
  }

  async deleteBudget(id: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  // Task operations
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasks(filters?: { propertyId?: string; assignedToId?: string; status?: string }): Promise<Task[]> {
    let query = db.select().from(tasks);
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(eq(tasks.propertyId, filters.propertyId));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(tasks.assignedToId, filters.assignedToId));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(tasks.createdAt));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Work report operations
  async getWorkReport(id: string): Promise<WorkReport | undefined> {
    const [report] = await db.select().from(workReports).where(eq(workReports.id, id));
    return report;
  }

  async getWorkReports(filters?: { taskId?: string; staffId?: string }): Promise<WorkReport[]> {
    let query = db.select().from(workReports);
    const conditions = [];

    if (filters?.taskId) {
      conditions.push(eq(workReports.taskId, filters.taskId));
    }
    if (filters?.staffId) {
      conditions.push(eq(workReports.staffId, filters.staffId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(workReports.createdAt));
  }

  async createWorkReport(reportData: InsertWorkReport): Promise<WorkReport> {
    const [report] = await db.insert(workReports).values(reportData).returning();
    return report;
  }

  // Audit log operations
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }

  async getAuditLogs(filters?: { 
    userId?: string; 
    entityType?: string; 
    entityId?: string; 
    action?: string; 
    limit?: number 
  }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(auditLogs.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getUserAuditHistory(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
