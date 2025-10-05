import {
  users,
  properties,
  colonies,
  condominiums,
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
  adminUsers,
  emailVerificationTokens,
  roleRequests,
  favorites,
  leads,
  rentalApplications,
  propertyChangeRequests,
  inspectionReports,
  ownerSettings,
  notifications,
  chatConversations,
  chatParticipants,
  chatMessages,
  chatbotConfig,
  agreementTemplates,
  propertySubmissionDrafts,
  propertyAgreements,
  serviceBookings,
  providerApplications,
  type User,
  type Colony,
  type InsertColony,
  type Condominium,
  type InsertCondominium,
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
  type AdminUser,
  type InsertAdminUser,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type RoleRequest,
  type InsertRoleRequest,
  type Favorite,
  type InsertFavorite,
  type Lead,
  type InsertLead,
  type RentalApplication,
  type InsertRentalApplication,
  type PropertyChangeRequest,
  type InsertPropertyChangeRequest,
  type InspectionReport,
  type InsertInspectionReport,
  type OwnerSettings,
  type InsertOwnerSettings,
  type Notification,
  type InsertNotification,
  type ChatConversation,
  type InsertChatConversation,
  type ChatParticipant,
  type InsertChatParticipant,
  type ChatMessage,
  type InsertChatMessage,
  type ChatbotConfig,
  type InsertChatbotConfig,
  type UpdateChatbotConfig,
  type AgreementTemplate,
  type InsertAgreementTemplate,
  type PropertySubmissionDraft,
  type InsertPropertySubmissionDraft,
  type PropertyAgreement,
  type InsertPropertyAgreement,
  type ServiceBooking,
  type InsertServiceBooking,
  type ProviderApplication,
  type InsertProviderApplication,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, ilike, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(userData: InsertUser & { passwordHash: string }): Promise<User>;
  getUsersByStatus(status: string): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserStatus(id: string, status: string): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUserAdditionalRole(id: string, additionalRole: string | null): Promise<User>;
  verifyUserEmail(userId: string): Promise<User>;
  approveAllPendingUsers(): Promise<number>;
  updateUserProfile(id: string, updates: { firstName?: string; lastName?: string; bio?: string; profileImageUrl?: string; phone?: string; preferredLanguage?: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Email verification token operations
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(token: string): Promise<void>;
  
  // Role request operations
  createRoleRequest(request: InsertRoleRequest): Promise<RoleRequest>;
  getRoleRequest(id: string): Promise<RoleRequest | undefined>;
  getRoleRequests(filters?: { userId?: string; status?: string }): Promise<RoleRequest[]>;
  updateRoleRequestStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<RoleRequest>;
  getUserActiveRoleRequest(userId: string): Promise<RoleRequest | undefined>;
  
  // Colony operations
  getColony(id: string): Promise<Colony | undefined>;
  getColonies(filters?: { active?: boolean }): Promise<Colony[]>;
  getActiveColonies(): Promise<Colony[]>;
  createColony(colony: InsertColony): Promise<Colony>;
  updateColony(id: string, updates: Partial<InsertColony>): Promise<Colony>;
  deleteColony(id: string): Promise<void>;
  
  // Condominium operations
  getCondominium(id: string): Promise<Condominium | undefined>;
  getCondominiums(filters?: { approvalStatus?: string }): Promise<Condominium[]>;
  getApprovedCondominiums(): Promise<Condominium[]>;
  createCondominium(condominium: InsertCondominium): Promise<Condominium>;
  updateCondominiumStatus(id: string, approvalStatus: string): Promise<Condominium>;
  
  // Property operations
  getProperty(id: string): Promise<Property | undefined>;
  getProperties(filters?: { status?: string; ownerId?: string; active?: boolean }): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: string): Promise<void>;
  searchProperties(query: string): Promise<Property[]>;
  searchPropertiesAdvanced(filters: {
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    minArea?: number;
    maxArea?: number;
    location?: string;
    amenities?: string[];
    status?: string;
    minRating?: number;
    featured?: boolean;
    availableFrom?: Date;
    availableTo?: Date;
    propertyType?: string;
    colonyName?: string;
    condoName?: string;
    unitType?: string;
    allowsSubleasing?: boolean;
  }): Promise<Property[]>;
  
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
  
  // Service Booking operations
  getServiceBooking(id: string): Promise<ServiceBooking | undefined>;
  getServiceBookings(filters?: { clientId?: string; providerId?: string; status?: string }): Promise<ServiceBooking[]>;
  createServiceBooking(booking: InsertServiceBooking): Promise<ServiceBooking>;
  updateServiceBooking(id: string, updates: Partial<InsertServiceBooking>): Promise<ServiceBooking>;
  updateServiceBookingStatus(id: string, status: string): Promise<ServiceBooking>;
  deleteServiceBooking(id: string): Promise<void>;
  
  // Provider Application operations
  getProviderApplication(id: string): Promise<ProviderApplication | undefined>;
  getProviderApplications(filters?: { status?: string }): Promise<ProviderApplication[]>;
  createProviderApplication(application: InsertProviderApplication): Promise<ProviderApplication>;
  updateProviderApplicationStatus(id: string, status: string, adminId: string, notes?: string): Promise<ProviderApplication>;
  
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
  
  // Admin user operations
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  getAllAdmins(): Promise<AdminUser[]>;
  
  // Favorite operations
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, propertyId: string): Promise<void>;
  getUserFavorites(userId: string): Promise<Property[]>;
  isFavorite(userId: string, propertyId: string): Promise<boolean>;
  
  // Lead operations
  getLead(id: string): Promise<Lead | undefined>;
  getLeads(filters?: { status?: string; assignedToId?: string }): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead>;
  updateLeadStatus(id: string, status: string): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  
  // Rental Application operations
  getRentalApplication(id: string): Promise<RentalApplication | undefined>;
  getRentalApplications(filters?: { status?: string; propertyId?: string; applicantId?: string }): Promise<RentalApplication[]>;
  createRentalApplication(application: InsertRentalApplication): Promise<RentalApplication>;
  updateRentalApplication(id: string, updates: Partial<InsertRentalApplication>): Promise<RentalApplication>;
  updateRentalApplicationStatus(id: string, status: string): Promise<RentalApplication>;
  deleteRentalApplication(id: string): Promise<void>;

  // Property Change Request operations
  getPropertyChangeRequest(id: string): Promise<PropertyChangeRequest | undefined>;
  getPropertyChangeRequests(filters?: { propertyId?: string; status?: string; requestedById?: string }): Promise<PropertyChangeRequest[]>;
  createPropertyChangeRequest(request: InsertPropertyChangeRequest): Promise<PropertyChangeRequest>;
  updatePropertyChangeRequestStatus(id: string, status: string, reviewedById: string, reviewNotes?: string): Promise<PropertyChangeRequest>;
  
  // Inspection Report operations
  getInspectionReport(id: string): Promise<InspectionReport | undefined>;
  getInspectionReports(filters?: { propertyId?: string; inspectorId?: string; status?: string }): Promise<InspectionReport[]>;
  createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport>;
  updateInspectionReport(id: string, updates: Partial<InsertInspectionReport>): Promise<InspectionReport>;
  
  // Owner Settings operations
  getOwnerSettings(userId: string): Promise<OwnerSettings | undefined>;
  createOwnerSettings(settings: InsertOwnerSettings): Promise<OwnerSettings>;
  updateOwnerSettings(userId: string, updates: Partial<InsertOwnerSettings>): Promise<OwnerSettings>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Chat operations
  getChatConversations(filters?: { type?: string; userId?: string }): Promise<ChatConversation[]>;
  getChatConversation(id: string): Promise<ChatConversation | undefined>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  getChatMessages(conversationId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  getChatParticipants(conversationId: string): Promise<ChatParticipant[]>;
  markConversationAsRead(conversationId: string, userId: string): Promise<boolean>;
  
  // Chatbot Configuration operations
  getChatbotConfig(): Promise<ChatbotConfig | undefined>;
  updateChatbotConfig(updates: UpdateChatbotConfig): Promise<ChatbotConfig>;
  
  // Agreement Template operations
  getAgreementTemplate(id: string): Promise<AgreementTemplate | undefined>;
  getAgreementTemplateByType(type: string): Promise<AgreementTemplate | undefined>;
  getAgreementTemplates(filters?: { active?: boolean }): Promise<AgreementTemplate[]>;
  createAgreementTemplate(template: InsertAgreementTemplate): Promise<AgreementTemplate>;
  updateAgreementTemplate(id: string, updates: Partial<InsertAgreementTemplate>): Promise<AgreementTemplate>;
  deleteAgreementTemplate(id: string): Promise<void>;
  
  // Property Submission Draft operations
  getPropertySubmissionDraft(id: string): Promise<PropertySubmissionDraft | undefined>;
  getPropertySubmissionDrafts(filters?: { userId?: string; status?: string }): Promise<PropertySubmissionDraft[]>;
  createPropertySubmissionDraft(draft: InsertPropertySubmissionDraft): Promise<PropertySubmissionDraft>;
  updatePropertySubmissionDraft(id: string, updates: Partial<InsertPropertySubmissionDraft>): Promise<PropertySubmissionDraft>;
  deletePropertySubmissionDraft(id: string): Promise<void>;
  
  // Property Agreement operations
  getPropertyAgreement(id: string): Promise<PropertyAgreement | undefined>;
  getPropertyAgreements(filters?: { userId?: string; propertyId?: string; status?: string; submissionDraftId?: string }): Promise<PropertyAgreement[]>;
  createPropertyAgreement(agreement: InsertPropertyAgreement): Promise<PropertyAgreement>;
  updatePropertyAgreement(id: string, updates: Partial<InsertPropertyAgreement>): Promise<PropertyAgreement>;
  signPropertyAgreement(id: string, signerName: string, signerIp: string): Promise<PropertyAgreement>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUserWithPassword(userData: InsertUser & { passwordHash: string }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserAdditionalRole(id: string, additionalRole: string | null): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ additionalRole: additionalRole as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyUserEmail(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(id: string, updates: { firstName?: string; lastName?: string; bio?: string; profileImageUrl?: string; phone?: string; preferredLanguage?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Email verification token operations
  async createEmailVerificationToken(tokenData: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const [token] = await db.insert(emailVerificationTokens).values(tokenData).returning();
    return token;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));
    return verificationToken;
  }

  async deleteEmailVerificationToken(token: string): Promise<void> {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
  }

  // Role request operations
  async createRoleRequest(requestData: InsertRoleRequest): Promise<RoleRequest> {
    const [request] = await db.insert(roleRequests).values(requestData).returning();
    return request;
  }

  async getRoleRequest(id: string): Promise<RoleRequest | undefined> {
    const [request] = await db.select().from(roleRequests).where(eq(roleRequests.id, id));
    return request;
  }

  async getRoleRequests(filters?: { userId?: string; status?: string }): Promise<RoleRequest[]> {
    let query = db.select().from(roleRequests);
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(roleRequests.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(roleRequests.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(roleRequests.createdAt));
  }

  async updateRoleRequestStatus(
    id: string,
    status: string,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<RoleRequest> {
    const [request] = await db
      .update(roleRequests)
      .set({
        status: status as any,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date(),
      })
      .where(eq(roleRequests.id, id))
      .returning();
    return request;
  }

  async getUserActiveRoleRequest(userId: string): Promise<RoleRequest | undefined> {
    const [request] = await db
      .select()
      .from(roleRequests)
      .where(and(eq(roleRequests.userId, userId), eq(roleRequests.status, "pending")))
      .orderBy(desc(roleRequests.createdAt))
      .limit(1);
    return request;
  }

  // Colony operations
  async getColony(id: string): Promise<Colony | undefined> {
    const [colony] = await db.select().from(colonies).where(eq(colonies.id, id));
    return colony;
  }

  async getColonies(filters?: { active?: boolean }): Promise<Colony[]> {
    let query = db.select().from(colonies);
    
    if (filters?.active !== undefined) {
      query = query.where(eq(colonies.active, filters.active)) as any;
    }

    return await query.orderBy(colonies.name);
  }

  async getActiveColonies(): Promise<Colony[]> {
    return await db
      .select()
      .from(colonies)
      .where(eq(colonies.active, true))
      .orderBy(colonies.name);
  }

  async createColony(colonyData: InsertColony): Promise<Colony> {
    const [colony] = await db.insert(colonies).values(colonyData).returning();
    return colony;
  }

  async updateColony(id: string, updates: Partial<InsertColony>): Promise<Colony> {
    const [colony] = await db
      .update(colonies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(colonies.id, id))
      .returning();
    return colony;
  }

  async deleteColony(id: string): Promise<void> {
    await db.delete(colonies).where(eq(colonies.id, id));
  }

  // Condominium operations
  async getCondominium(id: string): Promise<Condominium | undefined> {
    const [condominium] = await db.select().from(condominiums).where(eq(condominiums.id, id));
    return condominium;
  }

  async getCondominiums(filters?: { approvalStatus?: string }): Promise<Condominium[]> {
    let query = db.select().from(condominiums);
    
    if (filters?.approvalStatus) {
      query = query.where(eq(condominiums.approvalStatus, filters.approvalStatus as any)) as any;
    }

    return await query.orderBy(condominiums.name);
  }

  async getApprovedCondominiums(): Promise<Condominium[]> {
    return await db
      .select()
      .from(condominiums)
      .where(eq(condominiums.approvalStatus, "approved"))
      .orderBy(condominiums.name);
  }

  async createCondominium(condominiumData: InsertCondominium): Promise<Condominium> {
    const [condominium] = await db.insert(condominiums).values(condominiumData).returning();
    return condominium;
  }

  async updateCondominiumStatus(id: string, approvalStatus: string): Promise<Condominium> {
    const [condominium] = await db
      .update(condominiums)
      .set({ approvalStatus: approvalStatus as any, updatedAt: new Date() })
      .where(eq(condominiums.id, id))
      .returning();
    return condominium;
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

  async searchPropertiesAdvanced(filters: {
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    minArea?: number;
    maxArea?: number;
    location?: string;
    amenities?: string[];
    status?: string;
    minRating?: number;
    featured?: boolean;
    availableFrom?: Date;
    availableTo?: Date;
    propertyType?: string;
    colonyName?: string;
    condoName?: string;
    unitType?: string;
    allowsSubleasing?: boolean;
  }): Promise<Property[]> {
    let query = db.select().from(properties);
    const conditions = [];

    conditions.push(eq(properties.active, true));

    if (filters.query) {
      conditions.push(
        or(
          ilike(properties.title, `%${filters.query}%`),
          ilike(properties.location, `%${filters.query}%`),
          ilike(properties.description, `%${filters.query}%`)
        )
      );
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(properties.price, filters.minPrice.toString()));
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(lte(properties.price, filters.maxPrice.toString()));
    }

    if (filters.bedrooms !== undefined) {
      conditions.push(eq(properties.bedrooms, filters.bedrooms));
    }
    if (filters.bathrooms !== undefined) {
      conditions.push(eq(properties.bathrooms, filters.bathrooms.toString()));
    }

    if (filters.minArea !== undefined) {
      conditions.push(gte(properties.area, filters.minArea.toString()));
    }
    if (filters.maxArea !== undefined) {
      conditions.push(lte(properties.area, filters.maxArea.toString()));
    }

    if (filters.location) {
      conditions.push(ilike(properties.location, `%${filters.location}%`));
    }

    if (filters.status) {
      conditions.push(eq(properties.status, filters.status as any));
    }

    if (filters.minRating !== undefined) {
      conditions.push(gte(properties.rating, filters.minRating.toString()));
    }

    if (filters.featured !== undefined) {
      conditions.push(eq(properties.featured, filters.featured));
    }

    if (filters.availableFrom) {
      conditions.push(
        or(
          sql`${properties.availableFrom} IS NULL`,
          lte(properties.availableFrom, filters.availableFrom)
        )
      );
    }

    if (filters.availableTo) {
      conditions.push(
        or(
          sql`${properties.availableTo} IS NULL`,
          gte(properties.availableTo, filters.availableTo)
        )
      );
    }

    if (filters.amenities && filters.amenities.length > 0) {
      conditions.push(
        sql`${properties.amenities} && ARRAY[${sql.join(filters.amenities.map(a => sql`${a}`), sql`, `)}]::text[]`
      );
    }

    if (filters.propertyType) {
      conditions.push(eq(properties.propertyType, filters.propertyType));
    }

    if (filters.colonyName) {
      conditions.push(ilike(properties.colonyName, `%${filters.colonyName}%`));
    }

    if (filters.condoName) {
      conditions.push(ilike(properties.condoName, `%${filters.condoName}%`));
    }

    if (filters.unitType) {
      conditions.push(eq(properties.unitType, filters.unitType));
    }

    if (filters.allowsSubleasing !== undefined) {
      conditions.push(eq(properties.allowsSubleasing, filters.allowsSubleasing));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(
      desc(properties.featured),
      desc(properties.rating),
      desc(properties.createdAt)
    );
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

  // Service Booking operations
  async getServiceBooking(id: string): Promise<ServiceBooking | undefined> {
    const [booking] = await db.select().from(serviceBookings).where(eq(serviceBookings.id, id));
    return booking;
  }

  async getServiceBookings(filters?: { clientId?: string; providerId?: string; status?: string }): Promise<ServiceBooking[]> {
    let query = db.select().from(serviceBookings);
    const conditions = [];

    if (filters?.clientId) {
      conditions.push(eq(serviceBookings.clientId, filters.clientId));
    }
    if (filters?.providerId) {
      conditions.push(eq(serviceBookings.providerId, filters.providerId));
    }
    if (filters?.status) {
      conditions.push(eq(serviceBookings.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(serviceBookings.createdAt));
  }

  async createServiceBooking(bookingData: InsertServiceBooking): Promise<ServiceBooking> {
    const [booking] = await db.insert(serviceBookings).values(bookingData).returning();
    return booking;
  }

  async updateServiceBooking(id: string, updates: Partial<InsertServiceBooking>): Promise<ServiceBooking> {
    const [booking] = await db
      .update(serviceBookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceBookings.id, id))
      .returning();
    return booking;
  }

  async updateServiceBookingStatus(id: string, status: string): Promise<ServiceBooking> {
    const [booking] = await db
      .update(serviceBookings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(serviceBookings.id, id))
      .returning();
    return booking;
  }

  async deleteServiceBooking(id: string): Promise<void> {
    await db.delete(serviceBookings).where(eq(serviceBookings.id, id));
  }

  // Provider Application operations
  async getProviderApplication(id: string): Promise<ProviderApplication | undefined> {
    const [application] = await db.select().from(providerApplications).where(eq(providerApplications.id, id));
    return application;
  }

  async getProviderApplications(filters?: { status?: string }): Promise<ProviderApplication[]> {
    let query = db.select().from(providerApplications);
    
    if (filters?.status) {
      query = query.where(eq(providerApplications.status, filters.status as any)) as any;
    }

    return await query.orderBy(desc(providerApplications.createdAt));
  }

  async createProviderApplication(applicationData: InsertProviderApplication): Promise<ProviderApplication> {
    const [application] = await db.insert(providerApplications).values(applicationData).returning();
    return application;
  }

  async updateProviderApplicationStatus(id: string, status: string, adminId: string, notes?: string): Promise<ProviderApplication> {
    const [application] = await db
      .update(providerApplications)
      .set({ 
        status: status as any, 
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes 
      })
      .where(eq(providerApplications.id, id))
      .returning();
    return application;
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
  
  // Admin user operations
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));
    return admin;
  }
  
  async createAdmin(adminData: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db
      .insert(adminUsers)
      .values(adminData)
      .returning();
    return admin;
  }
  
  async getAllAdmins(): Promise<AdminUser[]> {
    return await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true))
      .orderBy(desc(adminUsers.createdAt));
  }
  
  // Favorite operations
  async addFavorite(favoriteData: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db.insert(favorites).values(favoriteData).returning();
    return favorite;
  }

  async removeFavorite(userId: string, propertyId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.propertyId, propertyId)
        )
      );
  }

  async getUserFavorites(userId: string): Promise<Property[]> {
    const userFavorites = await db
      .select({ property: properties })
      .from(favorites)
      .innerJoin(properties, eq(favorites.propertyId, properties.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    
    return userFavorites.map(f => f.property);
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.propertyId, propertyId)
        )
      )
      .limit(1);
    
    return !!favorite;
  }
  
  // Lead operations
  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeads(filters?: { status?: string; assignedToId?: string }): Promise<Lead[]> {
    let query = db.select().from(leads);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status as any));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(leads.assignedToId, filters.assignedToId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(leads.createdAt));
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(leadData).returning();
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  async updateLeadStatus(id: string, status: string): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }
  
  // Rental Application operations
  async getRentalApplication(id: string): Promise<RentalApplication | undefined> {
    const [application] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, id));
    return application;
  }

  async getRentalApplications(filters?: { status?: string; propertyId?: string; applicantId?: string }): Promise<RentalApplication[]> {
    let query = db.select().from(rentalApplications);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(rentalApplications.status, filters.status as any));
    }
    if (filters?.propertyId) {
      conditions.push(eq(rentalApplications.propertyId, filters.propertyId));
    }
    if (filters?.applicantId) {
      conditions.push(eq(rentalApplications.applicantId, filters.applicantId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(rentalApplications.createdAt));
  }

  async createRentalApplication(applicationData: InsertRentalApplication): Promise<RentalApplication> {
    const [application] = await db.insert(rentalApplications).values(applicationData).returning();
    return application;
  }

  async updateRentalApplication(id: string, updates: Partial<InsertRentalApplication>): Promise<RentalApplication> {
    const [updated] = await db
      .update(rentalApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rentalApplications.id, id))
      .returning();
    return updated;
  }

  async updateRentalApplicationStatus(id: string, status: string): Promise<RentalApplication> {
    const [updated] = await db
      .update(rentalApplications)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(rentalApplications.id, id))
      .returning();
    return updated;
  }

  async deleteRentalApplication(id: string): Promise<void> {
    await db.delete(rentalApplications).where(eq(rentalApplications.id, id));
  }

  // Property Change Request operations
  async getPropertyChangeRequest(id: string): Promise<PropertyChangeRequest | undefined> {
    const [request] = await db.select().from(propertyChangeRequests).where(eq(propertyChangeRequests.id, id));
    return request;
  }

  async getPropertyChangeRequests(filters?: { propertyId?: string; status?: string; requestedById?: string }): Promise<PropertyChangeRequest[]> {
    let query = db.select().from(propertyChangeRequests);
    
    const conditions = [];
    if (filters?.propertyId) {
      conditions.push(eq(propertyChangeRequests.propertyId, filters.propertyId));
    }
    if (filters?.status) {
      conditions.push(eq(propertyChangeRequests.status, filters.status as any));
    }
    if (filters?.requestedById) {
      conditions.push(eq(propertyChangeRequests.requestedById, filters.requestedById));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(propertyChangeRequests.createdAt));
  }

  async createPropertyChangeRequest(requestData: InsertPropertyChangeRequest): Promise<PropertyChangeRequest> {
    const [request] = await db.insert(propertyChangeRequests).values(requestData).returning();
    return request;
  }

  async updatePropertyChangeRequestStatus(id: string, status: string, reviewedById: string, reviewNotes?: string): Promise<PropertyChangeRequest> {
    const [updated] = await db
      .update(propertyChangeRequests)
      .set({ 
        status: status as any, 
        reviewedById, 
        reviewedAt: new Date(), 
        reviewNotes,
        updatedAt: new Date() 
      })
      .where(eq(propertyChangeRequests.id, id))
      .returning();
    
    // If approved, apply the changes to the property
    if (status === 'approved' && updated) {
      const changedFields = updated.changedFields as any;
      if (changedFields && updated.propertyId) {
        await db.update(properties)
          .set({ ...changedFields, updatedAt: new Date() })
          .where(eq(properties.id, updated.propertyId));
      }
    }
    
    return updated;
  }

  // Inspection Report operations
  async getInspectionReport(id: string): Promise<InspectionReport | undefined> {
    const [report] = await db.select().from(inspectionReports).where(eq(inspectionReports.id, id));
    return report;
  }

  async getInspectionReports(filters?: { propertyId?: string; inspectorId?: string; status?: string }): Promise<InspectionReport[]> {
    let query = db.select().from(inspectionReports);
    
    const conditions = [];
    if (filters?.propertyId) {
      conditions.push(eq(inspectionReports.propertyId, filters.propertyId));
    }
    if (filters?.inspectorId) {
      conditions.push(eq(inspectionReports.inspectorId, filters.inspectorId));
    }
    if (filters?.status) {
      conditions.push(eq(inspectionReports.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(inspectionReports.createdAt));
  }

  async createInspectionReport(reportData: InsertInspectionReport): Promise<InspectionReport> {
    const [report] = await db.insert(inspectionReports).values(reportData).returning();
    return report;
  }

  async updateInspectionReport(id: string, updates: Partial<InsertInspectionReport>): Promise<InspectionReport> {
    const [updated] = await db
      .update(inspectionReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inspectionReports.id, id))
      .returning();
    
    // Update property approval status based on inspection result
    if (updated && updated.propertyId) {
      if (updates.approved === true) {
        await db.update(properties)
          .set({ 
            approvalStatus: 'approved',
            published: true,
            updatedAt: new Date() 
          })
          .where(eq(properties.id, updated.propertyId));
      } else if (updates.approved === false) {
        await db.update(properties)
          .set({ 
            approvalStatus: 'rejected',
            published: false,
            updatedAt: new Date() 
          })
          .where(eq(properties.id, updated.propertyId));
      } else if (updates.status === 'completed' && updates.approved === undefined) {
        // Inspection completed but approval not set yet
        await db.update(properties)
          .set({ 
            approvalStatus: 'inspection_completed',
            updatedAt: new Date() 
          })
          .where(eq(properties.id, updated.propertyId));
      } else if (updates.status === 'scheduled') {
        await db.update(properties)
          .set({ 
            approvalStatus: 'inspection_scheduled',
            updatedAt: new Date() 
          })
          .where(eq(properties.id, updated.propertyId));
      }
    }
    
    return updated;
  }

  // Owner Settings operations
  async getOwnerSettings(userId: string): Promise<OwnerSettings | undefined> {
    const [settings] = await db.select().from(ownerSettings).where(eq(ownerSettings.userId, userId));
    return settings;
  }

  async createOwnerSettings(settingsData: InsertOwnerSettings): Promise<OwnerSettings> {
    const [settings] = await db.insert(ownerSettings).values(settingsData).returning();
    return settings;
  }

  async updateOwnerSettings(userId: string, updates: Partial<InsertOwnerSettings>): Promise<OwnerSettings> {
    const [updated] = await db
      .update(ownerSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ownerSettings.userId, userId))
      .returning();
    return updated;
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  // Chat operations
  async getChatConversations(filters?: { type?: string; userId?: string }): Promise<ChatConversation[]> {
    if (filters?.userId) {
      // If userId is provided, join with participants table to filter
      let query = db
        .select({
          id: chatConversations.id,
          type: chatConversations.type,
          title: chatConversations.title,
          propertyId: chatConversations.propertyId,
          appointmentId: chatConversations.appointmentId,
          lastMessageAt: chatConversations.lastMessageAt,
          isBot: chatConversations.isBot,
          createdAt: chatConversations.createdAt,
        })
        .from(chatConversations)
        .innerJoin(
          chatParticipants,
          eq(chatConversations.id, chatParticipants.conversationId)
        )
        .where(eq(chatParticipants.userId, filters.userId));
      
      if (filters?.type) {
        query = query.where(
          and(
            eq(chatParticipants.userId, filters.userId),
            eq(chatConversations.type, filters.type as any)
          )
        ) as any;
      }
      
      return await query.orderBy(desc(chatConversations.createdAt));
    } else {
      // If no userId, return all conversations (admin view)
      let query = db.select().from(chatConversations);
      
      if (filters?.type) {
        query = query.where(eq(chatConversations.type, filters.type as any)) as any;
      }
      
      return await query.orderBy(desc(chatConversations.createdAt));
    }
  }

  async getChatConversation(id: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    return conversation;
  }

  async createChatConversation(conversationData: InsertChatConversation): Promise<ChatConversation> {
    const [conversation] = await db.insert(chatConversations).values(conversationData).returning();
    return conversation;
  }

  async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }

  async addChatParticipant(participantData: InsertChatParticipant): Promise<ChatParticipant> {
    const [participant] = await db.insert(chatParticipants).values(participantData).returning();
    return participant;
  }

  async getChatParticipants(conversationId: string): Promise<ChatParticipant[]> {
    return await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.conversationId, conversationId));
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(chatParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(chatParticipants.conversationId, conversationId),
          eq(chatParticipants.userId, userId)
        )
      )
      .returning();
    
    return result.length > 0;
  }

  // Chatbot Configuration operations
  async getChatbotConfig(): Promise<ChatbotConfig | undefined> {
    const [config] = await db.select().from(chatbotConfig).limit(1);
    return config;
  }

  async updateChatbotConfig(updates: UpdateChatbotConfig): Promise<ChatbotConfig> {
    const existingConfig = await this.getChatbotConfig();
    
    if (!existingConfig) {
      throw new Error("Chatbot configuration not found");
    }

    const [updatedConfig] = await db
      .update(chatbotConfig)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(chatbotConfig.id, existingConfig.id))
      .returning();
    
    return updatedConfig;
  }

  // Agreement Template operations
  async getAgreementTemplate(id: string): Promise<AgreementTemplate | undefined> {
    const [template] = await db.select().from(agreementTemplates).where(eq(agreementTemplates.id, id));
    return template;
  }

  async getAgreementTemplateByType(type: string): Promise<AgreementTemplate | undefined> {
    const [template] = await db.select().from(agreementTemplates).where(eq(agreementTemplates.type, type as any));
    return template;
  }

  async getAgreementTemplates(filters?: { active?: boolean }): Promise<AgreementTemplate[]> {
    let query = db.select().from(agreementTemplates);
    
    if (filters?.active !== undefined) {
      query = query.where(eq(agreementTemplates.active, filters.active)) as any;
    }
    
    return await query.orderBy(agreementTemplates.name);
  }

  async createAgreementTemplate(templateData: InsertAgreementTemplate): Promise<AgreementTemplate> {
    const [template] = await db.insert(agreementTemplates).values(templateData).returning();
    return template;
  }

  async updateAgreementTemplate(id: string, updates: Partial<InsertAgreementTemplate>): Promise<AgreementTemplate> {
    const [updated] = await db
      .update(agreementTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agreementTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteAgreementTemplate(id: string): Promise<void> {
    await db.delete(agreementTemplates).where(eq(agreementTemplates.id, id));
  }

  // Property Submission Draft operations
  async getPropertySubmissionDraft(id: string): Promise<PropertySubmissionDraft | undefined> {
    const [draft] = await db.select().from(propertySubmissionDrafts).where(eq(propertySubmissionDrafts.id, id));
    return draft;
  }

  async getPropertySubmissionDrafts(filters?: { userId?: string; status?: string }): Promise<PropertySubmissionDraft[]> {
    let query = db.select().from(propertySubmissionDrafts);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(propertySubmissionDrafts.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(propertySubmissionDrafts.status, filters.status as any));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(propertySubmissionDrafts.updatedAt));
  }

  async createPropertySubmissionDraft(draftData: InsertPropertySubmissionDraft): Promise<PropertySubmissionDraft> {
    const [draft] = await db.insert(propertySubmissionDrafts).values(draftData).returning();
    return draft;
  }

  async updatePropertySubmissionDraft(id: string, updates: Partial<InsertPropertySubmissionDraft>): Promise<PropertySubmissionDraft> {
    const [updated] = await db
      .update(propertySubmissionDrafts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(propertySubmissionDrafts.id, id))
      .returning();
    return updated;
  }

  async deletePropertySubmissionDraft(id: string): Promise<void> {
    await db.delete(propertySubmissionDrafts).where(eq(propertySubmissionDrafts.id, id));
  }

  // Property Agreement operations
  async getPropertyAgreement(id: string): Promise<PropertyAgreement | undefined> {
    const [agreement] = await db.select().from(propertyAgreements).where(eq(propertyAgreements.id, id));
    return agreement;
  }

  async getPropertyAgreements(filters?: { userId?: string; propertyId?: string; status?: string; submissionDraftId?: string }): Promise<PropertyAgreement[]> {
    let query = db.select().from(propertyAgreements);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(propertyAgreements.userId, filters.userId));
    }
    if (filters?.propertyId) {
      conditions.push(eq(propertyAgreements.propertyId, filters.propertyId));
    }
    if (filters?.status) {
      conditions.push(eq(propertyAgreements.status, filters.status as any));
    }
    if (filters?.submissionDraftId) {
      conditions.push(eq(propertyAgreements.submissionDraftId, filters.submissionDraftId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(propertyAgreements.createdAt));
  }

  async createPropertyAgreement(agreementData: InsertPropertyAgreement): Promise<PropertyAgreement> {
    const [agreement] = await db.insert(propertyAgreements).values(agreementData).returning();
    return agreement;
  }

  async updatePropertyAgreement(id: string, updates: Partial<InsertPropertyAgreement>): Promise<PropertyAgreement> {
    const [updated] = await db
      .update(propertyAgreements)
      .set(updates)
      .where(eq(propertyAgreements.id, id))
      .returning();
    return updated;
  }

  async signPropertyAgreement(id: string, signerName: string, signerIp: string): Promise<PropertyAgreement> {
    const [updated] = await db
      .update(propertyAgreements)
      .set({
        status: "signed",
        signedAt: new Date(),
        signerName,
        signerIp,
      })
      .where(eq(propertyAgreements.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
