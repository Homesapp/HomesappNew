import {
  users,
  properties,
  colonies,
  condominiums,
  amenities,
  appointments,
  businessHours,
  conciergeBlockedSlots,
  calendarEvents,
  propertyReviews,
  appointmentReviews,
  conciergeReviews,
  clientReviews,
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
  leadPropertyOffers,
  systemConfig,
  rentalApplications,
  rentalContracts,
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
  referralConfig,
  clientReferrals,
  ownerReferrals,
  feedback,
  rentalCommissionConfigs,
  accountantAssignments,
  payoutBatches,
  incomeTransactions,
  changelogs,
  slaConfigurations,
  leadScoringRules,
  leadScores,
  contractChecklistTemplates,
  contractChecklistTemplateItems,
  contractChecklistItems,
  rentalHealthScores,
  leadResponseMetrics,
  contractCycleMetrics,
  workflowEvents,
  systemAlerts,
  type User,
  type Colony,
  type InsertColony,
  type Condominium,
  type InsertCondominium,
  type Amenity,
  type InsertAmenity,
  type UpsertUser,
  type InsertUser,
  type Property,
  type InsertProperty,
  type Appointment,
  type InsertAppointment,
  type BusinessHours,
  type InsertBusinessHours,
  type ConciergeBlockedSlot,
  type InsertConciergeBlockedSlot,
  type CalendarEvent,
  type InsertCalendarEvent,
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
  type LeadPropertyOffer,
  type InsertLeadPropertyOffer,
  type SystemConfig,
  type InsertSystemConfig,
  type RentalApplication,
  type InsertRentalApplication,
  type RentalContract,
  type InsertRentalContract,
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
  type ReferralConfig,
  type InsertReferralConfig,
  type ClientReferral,
  type InsertClientReferral,
  type OwnerReferral,
  type InsertOwnerReferral,
  type Feedback,
  type InsertFeedback,
  type UpdateFeedback,
  type PropertyReview,
  type InsertPropertyReview,
  type AppointmentReview,
  type RentalCommissionConfig,
  type InsertRentalCommissionConfig,
  type AccountantAssignment,
  type InsertAccountantAssignment,
  type PayoutBatch,
  type InsertPayoutBatch,
  type IncomeTransaction,
  type InsertIncomeTransaction,
  type Changelog,
  type InsertChangelog,
  type InsertAppointmentReview,
  type ConciergeReview,
  type InsertConciergeReview,
  type ClientReview,
  type InsertClientReview,
  type SlaConfiguration,
  type InsertSlaConfiguration,
  type LeadScoringRule,
  type InsertLeadScoringRule,
  type LeadScore,
  type InsertLeadScore,
  type ContractChecklistTemplate,
  type InsertContractChecklistTemplate,
  type ContractChecklistTemplateItem,
  type InsertContractChecklistTemplateItem,
  type ContractChecklistItem,
  type InsertContractChecklistItem,
  type RentalHealthScore,
  type InsertRentalHealthScore,
  type LeadResponseMetric,
  type InsertLeadResponseMetric,
  type ContractCycleMetric,
  type InsertContractCycleMetric,
  type WorkflowEvent,
  type InsertWorkflowEvent,
  type SystemAlert,
  type InsertSystemAlert,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, ilike, desc, sql, isNull, count, inArray } from "drizzle-orm";

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
  getEmailVerificationTokenByCode(code: string): Promise<EmailVerificationToken | undefined>;
  getEmailVerificationTokenByUserId(userId: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(token: string): Promise<void>;
  deleteEmailVerificationTokenByUserId(userId: string): Promise<void>;
  
  // Role request operations
  createRoleRequest(request: InsertRoleRequest): Promise<RoleRequest>;
  getRoleRequest(id: string): Promise<RoleRequest | undefined>;
  getRoleRequests(filters?: { userId?: string; status?: string }): Promise<RoleRequest[]>;
  updateRoleRequestStatus(id: string, status: string, reviewedBy?: string | null, reviewNotes?: string): Promise<RoleRequest>;
  getUserActiveRoleRequest(userId: string): Promise<RoleRequest | undefined>;
  
  // Colony operations
  getColony(id: string): Promise<Colony | undefined>;
  getColonies(filters?: { active?: boolean; approvalStatus?: string }): Promise<Colony[]>;
  getActiveColonies(): Promise<Colony[]>;
  getApprovedColonies(): Promise<Colony[]>;
  createColony(colony: InsertColony): Promise<Colony>;
  updateColony(id: string, updates: Partial<InsertColony>): Promise<Colony>;
  updateColonyStatus(id: string, approvalStatus: string): Promise<Colony>;
  deleteColony(id: string): Promise<void>;
  
  // Condominium operations
  getCondominium(id: string): Promise<Condominium | undefined>;
  getCondominiums(filters?: { approvalStatus?: string }): Promise<Condominium[]>;
  getApprovedCondominiums(): Promise<Condominium[]>;
  createCondominium(condominium: InsertCondominium): Promise<Condominium>;
  updateCondominiumStatus(id: string, approvalStatus: string): Promise<Condominium>;
  updateCondominium(id: string, updates: Partial<InsertCondominium>): Promise<Condominium>;
  toggleCondominiumActive(id: string, active: boolean): Promise<Condominium>;
  countPropertiesByCondominium(condominiumId: string): Promise<number>;
  deleteCondominium(id: string): Promise<void>;
  
  // Amenity operations
  getAmenity(id: string): Promise<Amenity | undefined>;
  getAmenities(filters?: { category?: string; approvalStatus?: string }): Promise<Amenity[]>;
  getApprovedAmenities(category?: string): Promise<Amenity[]>;
  createAmenity(amenity: InsertAmenity): Promise<Amenity>;
  updateAmenity(id: string, updates: Partial<InsertAmenity>): Promise<Amenity>;
  updateAmenityStatus(id: string, approvalStatus: string): Promise<Amenity>;
  deleteAmenity(id: string): Promise<void>;
  
  // Suggestion limits
  getUserSuggestionsCount(userId: string, timeframe?: 'today' | 'total'): Promise<number>;
  
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
  getAppointments(filters?: { status?: string; clientId?: string; propertyId?: string }): Promise<any[]>;
  getAllAppointmentsAdmin(): Promise<any[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;
  
  // Calendar Event operations
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  getCalendarEvents(filters?: { eventType?: string; assignedToId?: string; status?: string; propertyId?: string; startDate?: Date; endDate?: Date }): Promise<any[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // Business Hours operations
  getBusinessHours(): Promise<BusinessHours[]>;
  getBusinessHoursByDay(dayOfWeek: number): Promise<BusinessHours | undefined>;
  upsertBusinessHours(hours: InsertBusinessHours): Promise<BusinessHours>;
  initializeBusinessHours(): Promise<void>;
  
  // Concierge Blocked Slots operations
  getConciergeBlockedSlot(id: string): Promise<ConciergeBlockedSlot | undefined>;
  getConciergeBlockedSlots(conciergeId: string): Promise<ConciergeBlockedSlot[]>;
  getConciergeBlockedSlotsByDateRange(conciergeId: string, startDate: Date, endDate: Date): Promise<ConciergeBlockedSlot[]>;
  createConciergeBlockedSlot(slot: InsertConciergeBlockedSlot): Promise<ConciergeBlockedSlot>;
  deleteConciergeBlockedSlot(id: string): Promise<void>;
  
  // Property Review operations
  getPropertyReview(id: string): Promise<PropertyReview | undefined>;
  getPropertyReviews(filters?: { propertyId?: string; clientId?: string }): Promise<PropertyReview[]>;
  createPropertyReview(review: InsertPropertyReview): Promise<PropertyReview>;
  updatePropertyReview(id: string, updates: Partial<InsertPropertyReview>): Promise<PropertyReview>;
  
  // Appointment Review operations
  getAppointmentReview(id: string): Promise<AppointmentReview | undefined>;
  getAppointmentReviews(filters?: { appointmentId?: string; clientId?: string }): Promise<AppointmentReview[]>;
  createAppointmentReview(review: InsertAppointmentReview): Promise<AppointmentReview>;
  updateAppointmentReview(id: string, updates: Partial<InsertAppointmentReview>): Promise<AppointmentReview>;
  
  // Concierge Review operations (from clients)
  getConciergeReview(id: string): Promise<ConciergeReview | undefined>;
  getConciergeReviews(filters?: { conciergeId?: string; clientId?: string }): Promise<ConciergeReview[]>;
  createConciergeReview(review: InsertConciergeReview): Promise<ConciergeReview>;
  updateConciergeReview(id: string, updates: Partial<InsertConciergeReview>): Promise<ConciergeReview>;
  
  // Client Review operations (from concierges)
  getClientReview(id: string): Promise<ClientReview | undefined>;
  getClientReviews(filters?: { clientId?: string; conciergeId?: string }): Promise<ClientReview[]>;
  createClientReview(review: InsertClientReview): Promise<ClientReview>;
  updateClientReview(id: string, updates: Partial<InsertClientReview>): Promise<ClientReview>;
  
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
  
  // Referral Configuration operations
  getReferralConfig(): Promise<ReferralConfig | undefined>;
  updateReferralConfig(updates: Partial<InsertReferralConfig>, updatedBy: string): Promise<ReferralConfig>;
  
  // Client Referral operations
  getClientReferral(id: string): Promise<ClientReferral | undefined>;
  getClientReferrals(filters?: { referrerId?: string; status?: string }): Promise<ClientReferral[]>;
  createClientReferral(referral: InsertClientReferral): Promise<ClientReferral>;
  updateClientReferral(id: string, updates: Partial<InsertClientReferral>): Promise<ClientReferral>;
  updateClientReferralStatus(id: string, status: string): Promise<ClientReferral>;
  
  // Owner Referral operations
  getOwnerReferral(id: string): Promise<OwnerReferral | undefined>;
  getOwnerReferrals(filters?: { referrerId?: string; status?: string; sellerView?: string }): Promise<OwnerReferral[]>;
  createOwnerReferral(referral: InsertOwnerReferral): Promise<OwnerReferral>;
  updateOwnerReferral(id: string, updates: Partial<InsertOwnerReferral>): Promise<OwnerReferral>;
  updateOwnerReferralStatus(id: string, status: string): Promise<OwnerReferral>;
  getOwnerReferralByVerificationToken(token: string): Promise<OwnerReferral | undefined>;
  verifyOwnerReferralEmail(id: string): Promise<OwnerReferral>;
  approveOwnerReferralByAdmin(id: string, adminId: string, commissionAmount?: string): Promise<OwnerReferral>;
  rejectOwnerReferralByAdmin(id: string, adminId: string, rejectionReason: string): Promise<OwnerReferral>;
  
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
  getTasks(filters?: { propertyId?: string; assignedToId?: string; status?: string; priority?: string; search?: string }): Promise<Task[]>;
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
  updateAdminProfile(id: string, updates: { firstName?: string; lastName?: string; email?: string; profileImageUrl?: string }): Promise<AdminUser>;
  updateAdminPassword(id: string, passwordHash: string): Promise<AdminUser>;
  
  // Favorite operations
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, propertyId: string): Promise<void>;
  getUserFavorites(userId: string): Promise<Property[]>;
  isFavorite(userId: string, propertyId: string): Promise<boolean>;
  
  // Lead operations
  getLead(id: string): Promise<Lead | undefined>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  getLeads(filters?: { status?: string; assignedToId?: string; registeredById?: string }): Promise<Lead[]>;
  getActiveLead(email: string): Promise<Lead | undefined>; // Get non-expired lead by email
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead>;
  updateLeadStatus(id: string, status: string): Promise<Lead>;
  verifyLeadEmail(leadId: string): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  
  // Lead Property Offer operations
  getLeadPropertyOffer(id: string): Promise<LeadPropertyOffer | undefined>;
  getLeadPropertyOffers(filters?: { leadId?: string; propertyId?: string; offeredById?: string }): Promise<LeadPropertyOffer[]>;
  createLeadPropertyOffer(offer: InsertLeadPropertyOffer): Promise<LeadPropertyOffer>;
  updateLeadPropertyOffer(id: string, updates: Partial<InsertLeadPropertyOffer>): Promise<LeadPropertyOffer>;
  
  // System Configuration operations
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  getAllSystemConfigs(): Promise<SystemConfig[]>;
  upsertSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  deleteSystemConfig(key: string): Promise<void>;
  
  // Rental Application operations
  getRentalApplication(id: string): Promise<RentalApplication | undefined>;
  getRentalApplications(filters?: { status?: string; propertyId?: string; applicantId?: string }): Promise<RentalApplication[]>;
  createRentalApplication(application: InsertRentalApplication): Promise<RentalApplication>;
  updateRentalApplication(id: string, updates: Partial<InsertRentalApplication>): Promise<RentalApplication>;
  updateRentalApplicationStatus(id: string, status: string): Promise<RentalApplication>;
  deleteRentalApplication(id: string): Promise<void>;

  // Rental Contract operations
  getRentalContract(id: string): Promise<RentalContract | undefined>;
  getRentalContracts(filters?: { status?: string; propertyId?: string; tenantId?: string; sellerId?: string }): Promise<RentalContract[]>;
  createRentalContract(contract: InsertRentalContract): Promise<RentalContract>;
  updateRentalContract(id: string, updates: Partial<InsertRentalContract>): Promise<RentalContract>;
  updateRentalContractStatus(id: string, status: string, additionalData?: { apartadoDate?: Date; contractSignedDate?: Date; checkInDate?: Date; payoutReleasedAt?: Date }): Promise<RentalContract>;
  deleteRentalContract(id: string): Promise<void>;

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
  getNotification(id: string): Promise<Notification | undefined>;
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
  getPropertySubmissionDraftByProperty(propertyId: string): Promise<PropertySubmissionDraft | undefined>;
  getPropertySubmissionDrafts(filters?: { userId?: string; status?: string }): Promise<PropertySubmissionDraft[]>;
  createPropertySubmissionDraft(draft: InsertPropertySubmissionDraft): Promise<PropertySubmissionDraft>;
  updatePropertySubmissionDraft(id: string, updates: Partial<InsertPropertySubmissionDraft>): Promise<PropertySubmissionDraft>;
  deletePropertySubmissionDraft(id: string): Promise<void>;
  approvePropertySubmissionDraft(id: string, adminId: string): Promise<Property>;
  
  // Property Agreement operations
  getPropertyAgreement(id: string): Promise<PropertyAgreement | undefined>;
  getPropertyAgreements(filters?: { userId?: string; propertyId?: string; status?: string; submissionDraftId?: string }): Promise<PropertyAgreement[]>;
  createPropertyAgreement(agreement: InsertPropertyAgreement): Promise<PropertyAgreement>;
  updatePropertyAgreement(id: string, updates: Partial<InsertPropertyAgreement>): Promise<PropertyAgreement>;
  signPropertyAgreement(id: string, signerName: string, signerIp: string): Promise<PropertyAgreement>;

  // Feedback operations
  getFeedback(id: string): Promise<Feedback | undefined>;
  getAllFeedback(filters?: { type?: string; status?: string; userId?: string }): Promise<Feedback[]>;
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: string, updates: UpdateFeedback): Promise<Feedback>;

  // Rental Commission Config operations
  getRentalCommissionConfig(id: string): Promise<RentalCommissionConfig | undefined>;
  getRentalCommissionConfigs(filters?: { propertyId?: string; userId?: string }): Promise<RentalCommissionConfig[]>;
  createRentalCommissionConfig(config: InsertRentalCommissionConfig): Promise<RentalCommissionConfig>;
  updateRentalCommissionConfig(id: string, updates: Partial<InsertRentalCommissionConfig>): Promise<RentalCommissionConfig>;
  deleteRentalCommissionConfig(id: string): Promise<void>;

  // Accountant Assignment operations
  getAccountantAssignment(id: string): Promise<AccountantAssignment | undefined>;
  getAccountantAssignments(filters?: { accountantId?: string; assignmentType?: string; propertyId?: string; userId?: string }): Promise<AccountantAssignment[]>;
  createAccountantAssignment(assignment: InsertAccountantAssignment): Promise<AccountantAssignment>;
  updateAccountantAssignment(id: string, updates: Partial<InsertAccountantAssignment>): Promise<AccountantAssignment>;
  deleteAccountantAssignment(id: string): Promise<void>;
  getAccountantActiveAssignments(accountantId: string): Promise<AccountantAssignment[]>;

  // Payout Batch operations
  getPayoutBatch(id: string): Promise<PayoutBatch | undefined>;
  getPayoutBatches(filters?: { status?: string; createdBy?: string }): Promise<PayoutBatch[]>;
  createPayoutBatch(batch: InsertPayoutBatch): Promise<PayoutBatch>;
  updatePayoutBatch(id: string, updates: Partial<InsertPayoutBatch>): Promise<PayoutBatch>;
  updatePayoutBatchStatus(id: string, status: string, updatedBy: string, notes?: string): Promise<PayoutBatch>;
  generatePayoutBatchNumber(): Promise<string>;

  // Income Transaction operations
  getIncomeTransaction(id: string): Promise<IncomeTransaction | undefined>;
  getIncomeTransactions(filters?: { 
    beneficiaryId?: string;
    category?: string;
    status?: string;
    propertyId?: string;
    payoutBatchId?: string;
    accountantId?: string; // For scope filtering
    fromDate?: Date;
    toDate?: Date;
  }): Promise<IncomeTransaction[]>;
  createIncomeTransaction(transaction: InsertIncomeTransaction): Promise<IncomeTransaction>;
  updateIncomeTransaction(id: string, updates: Partial<InsertIncomeTransaction>): Promise<IncomeTransaction>;
  updateIncomeTransactionStatus(id: string, status: string, updatedBy: string, notes?: string, rejectionReason?: string): Promise<IncomeTransaction>;
  getIncomeReports(filters?: {
    beneficiaryId?: string;
    propertyId?: string;
    category?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    groupBy?: 'beneficiary' | 'property' | 'category' | 'status';
  }): Promise<Array<{
    groupKey: string;
    totalAmount: string;
    count: number;
    avgAmount: string;
  }>>;

  // Changelog operations
  getChangelog(id: string): Promise<Changelog | undefined>;
  getAllChangelogs(): Promise<Changelog[]>;
  createChangelog(changelog: InsertChangelog): Promise<Changelog>;
  updateChangelog(id: string, updates: Partial<InsertChangelog>): Promise<Changelog>;
  deleteChangelog(id: string): Promise<void>;

  // SLA Configuration operations
  getSlaConfiguration(id: string): Promise<SlaConfiguration | undefined>;
  getSlaConfigurations(filters?: { isActive?: boolean }): Promise<SlaConfiguration[]>;
  getSlaConfigurationByProcess(processName: string): Promise<SlaConfiguration | undefined>;
  createSlaConfiguration(config: InsertSlaConfiguration): Promise<SlaConfiguration>;
  updateSlaConfiguration(id: string, updates: Partial<InsertSlaConfiguration>): Promise<SlaConfiguration>;
  deleteSlaConfiguration(id: string): Promise<void>;

  // Lead Scoring operations
  getLeadScoringRule(id: string): Promise<LeadScoringRule | undefined>;
  getLeadScoringRules(filters?: { isActive?: boolean }): Promise<LeadScoringRule[]>;
  createLeadScoringRule(rule: InsertLeadScoringRule): Promise<LeadScoringRule>;
  updateLeadScoringRule(id: string, updates: Partial<InsertLeadScoringRule>): Promise<LeadScoringRule>;
  deleteLeadScoringRule(id: string): Promise<void>;
  getLeadScore(leadId: string): Promise<LeadScore | undefined>;
  createLeadScore(score: InsertLeadScore): Promise<LeadScore>;
  updateLeadScore(leadId: string, updates: Partial<InsertLeadScore>): Promise<LeadScore>;
  calculateLeadScore(leadId: string): Promise<LeadScore>;

  // Contract Checklist operations
  getContractChecklistTemplate(id: string): Promise<ContractChecklistTemplate | undefined>;
  getContractChecklistTemplates(filters?: { contractType?: string; isActive?: boolean }): Promise<ContractChecklistTemplate[]>;
  createContractChecklistTemplate(template: InsertContractChecklistTemplate): Promise<ContractChecklistTemplate>;
  updateContractChecklistTemplate(id: string, updates: Partial<InsertContractChecklistTemplate>): Promise<ContractChecklistTemplate>;
  deleteContractChecklistTemplate(id: string): Promise<void>;
  getContractChecklistTemplateItems(templateId: string): Promise<ContractChecklistTemplateItem[]>;
  createContractChecklistTemplateItem(item: InsertContractChecklistTemplateItem): Promise<ContractChecklistTemplateItem>;
  updateContractChecklistTemplateItem(id: string, updates: Partial<InsertContractChecklistTemplateItem>): Promise<ContractChecklistTemplateItem>;
  deleteContractChecklistTemplateItem(id: string): Promise<void>;
  getContractChecklistItems(contractId: string): Promise<ContractChecklistItem[]>;
  createContractChecklistItem(item: InsertContractChecklistItem): Promise<ContractChecklistItem>;
  updateContractChecklistItem(id: string, updates: Partial<InsertContractChecklistItem>): Promise<ContractChecklistItem>;
  completeContractChecklistItem(id: string, completedBy: string, notes?: string): Promise<ContractChecklistItem>;
  deleteContractChecklistItem(id: string): Promise<void>;
  initializeContractChecklist(contractId: string, templateId: string): Promise<ContractChecklistItem[]>;

  // Rental Health Score operations
  getRentalHealthScore(contractId: string): Promise<RentalHealthScore | undefined>;
  createRentalHealthScore(score: InsertRentalHealthScore): Promise<RentalHealthScore>;
  updateRentalHealthScore(contractId: string, updates: Partial<InsertRentalHealthScore>): Promise<RentalHealthScore>;
  calculateRentalHealthScore(contractId: string): Promise<RentalHealthScore>;
  getRentalHealthScoresByStatus(status: string): Promise<RentalHealthScore[]>;

  // Performance Metrics operations
  getLeadResponseMetric(leadId: string): Promise<LeadResponseMetric | undefined>;
  createLeadResponseMetric(metric: InsertLeadResponseMetric): Promise<LeadResponseMetric>;
  getContractCycleMetric(contractId: string): Promise<ContractCycleMetric | undefined>;
  createContractCycleMetric(metric: InsertContractCycleMetric): Promise<ContractCycleMetric>;
  updateContractCycleMetric(contractId: string, updates: Partial<InsertContractCycleMetric>): Promise<ContractCycleMetric>;

  // Workflow Event operations
  createWorkflowEvent(event: InsertWorkflowEvent): Promise<WorkflowEvent>;
  getWorkflowEvents(filters?: { eventType?: string; entityType?: string; entityId?: string }): Promise<WorkflowEvent[]>;

  // System Alert operations
  getSystemAlert(id: string): Promise<SystemAlert | undefined>;
  getSystemAlerts(filters?: { userId?: string; status?: string; priority?: string; alertType?: string }): Promise<SystemAlert[]>;
  getUserPendingAlerts(userId: string): Promise<SystemAlert[]>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  updateSystemAlert(id: string, updates: Partial<InsertSystemAlert>): Promise<SystemAlert>;
  acknowledgeSystemAlert(id: string): Promise<SystemAlert>;
  resolveSystemAlert(id: string): Promise<SystemAlert>;
  dismissSystemAlert(id: string): Promise<SystemAlert>;
  deleteSystemAlert(id: string): Promise<void>;
  cleanupExpiredAlerts(): Promise<number>;
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
    // First check if a user with this email already exists  
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email));

    if (existingUser) {
      // Return existing user without modification to avoid breaking references
      return existingUser;
    } else {
      // Insert new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    }
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

  async updateBankInfo(id: string, updates: { paymentMethod: string; bankName?: string; bankAccountName: string; bankAccountNumber: string; bankClabe?: string; bankEmail?: string; bankAddress?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        paymentMethod: updates.paymentMethod as "bank" | "zelle" | "wise",
        bankName: updates.bankName,
        bankAccountName: updates.bankAccountName,
        bankAccountNumber: updates.bankAccountNumber,
        bankClabe: updates.bankClabe,
        bankEmail: updates.bankEmail,
        bankAddress: updates.bankAddress,
        updatedAt: new Date() 
      })
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

  async getEmailVerificationTokenByCode(code: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.code, code));
    return verificationToken;
  }

  async getEmailVerificationTokenByUserId(userId: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));
    return verificationToken;
  }

  async deleteEmailVerificationToken(tokenId: string): Promise<void> {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, tokenId));
  }

  async deleteEmailVerificationTokenByUserId(userId: string): Promise<void> {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
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
    reviewedBy?: string | null,
    reviewNotes?: string
  ): Promise<RoleRequest> {
    const [request] = await db
      .update(roleRequests)
      .set({
        status: status as any,
        reviewedBy: reviewedBy || null,
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

  async getColonies(filters?: { active?: boolean; approvalStatus?: string }): Promise<Colony[]> {
    let query = db.select().from(colonies);
    const conditions = [];
    
    if (filters?.active !== undefined) {
      conditions.push(eq(colonies.active, filters.active));
    }
    if (filters?.approvalStatus) {
      conditions.push(eq(colonies.approvalStatus, filters.approvalStatus as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
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

  async getApprovedColonies(): Promise<Colony[]> {
    return await db
      .select()
      .from(colonies)
      .where(eq(colonies.approvalStatus, "approved"))
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

  async updateColonyStatus(id: string, approvalStatus: string): Promise<Colony> {
    const [colony] = await db
      .update(colonies)
      .set({ approvalStatus: approvalStatus as any, updatedAt: new Date() })
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

  async updateCondominium(id: string, updates: Partial<InsertCondominium>): Promise<Condominium> {
    const [condominium] = await db
      .update(condominiums)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(condominiums.id, id))
      .returning();
    return condominium;
  }

  async toggleCondominiumActive(id: string, active: boolean): Promise<Condominium> {
    const [condominium] = await db
      .update(condominiums)
      .set({ active, updatedAt: new Date() })
      .where(eq(condominiums.id, id))
      .returning();
    return condominium;
  }

  async countPropertiesByCondominium(condominiumId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.condominiumId, condominiumId));
    return result[0]?.count || 0;
  }

  async deleteCondominium(id: string): Promise<void> {
    await db.delete(condominiums).where(eq(condominiums.id, id));
  }

  // Amenity operations
  async getAmenity(id: string): Promise<Amenity | undefined> {
    const [amenity] = await db.select().from(amenities).where(eq(amenities.id, id));
    return amenity;
  }

  async getAmenities(filters?: { category?: string; approvalStatus?: string }): Promise<Amenity[]> {
    let query = db.select().from(amenities);
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(amenities.category, filters.category as any));
    }
    if (filters?.approvalStatus) {
      conditions.push(eq(amenities.approvalStatus, filters.approvalStatus as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(amenities.name);
  }

  async getApprovedAmenities(category?: string): Promise<Amenity[]> {
    let query = db
      .select()
      .from(amenities)
      .where(eq(amenities.approvalStatus, "approved"));

    if (category) {
      query = query.where(and(
        eq(amenities.approvalStatus, "approved"),
        eq(amenities.category, category as any)
      )) as any;
    }

    return await query.orderBy(amenities.name);
  }

  async createAmenity(amenityData: InsertAmenity): Promise<Amenity> {
    const [amenity] = await db.insert(amenities).values(amenityData).returning();
    return amenity;
  }

  async updateAmenity(id: string, updates: Partial<InsertAmenity>): Promise<Amenity> {
    const [amenity] = await db
      .update(amenities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(amenities.id, id))
      .returning();
    return amenity;
  }

  async updateAmenityStatus(id: string, approvalStatus: string): Promise<Amenity> {
    const [amenity] = await db
      .update(amenities)
      .set({ approvalStatus: approvalStatus as any, updatedAt: new Date() })
      .where(eq(amenities.id, id))
      .returning();
    return amenity;
  }

  async deleteAmenity(id: string): Promise<void> {
    await db.delete(amenities).where(eq(amenities.id, id));
  }

  // Suggestion limits
  async getUserSuggestionsCount(userId: string, timeframe: 'today' | 'total' = 'total'): Promise<number> {
    const startOfDay = timeframe === 'today' ? (() => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      return date;
    })() : null;

    // Count colonies
    const coloniesConditions = [eq(colonies.requestedBy, userId)];
    if (startOfDay) {
      coloniesConditions.push(gte(colonies.createdAt, startOfDay));
    }
    const coloniesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(colonies)
      .where(and(...coloniesConditions));

    // Count condominiums
    const condoConditions = [eq(condominiums.requestedBy, userId)];
    if (startOfDay) {
      condoConditions.push(gte(condominiums.createdAt, startOfDay));
    }
    const condosCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(condominiums)
      .where(and(...condoConditions));

    // Count amenities
    const amenityConditions = [eq(amenities.requestedBy, userId)];
    if (startOfDay) {
      amenityConditions.push(gte(amenities.createdAt, startOfDay));
    }
    const amenitiesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(amenities)
      .where(and(...amenityConditions));

    const total = 
      Number(coloniesCount[0]?.count || 0) + 
      Number(condosCount[0]?.count || 0) + 
      Number(amenitiesCount[0]?.count || 0);

    return total;
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
    approvalStatus?: string | string[];
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

    if (filters.approvalStatus) {
      if (Array.isArray(filters.approvalStatus)) {
        conditions.push(
          or(...filters.approvalStatus.map(status => eq(properties.approvalStatus, status as any)))
        );
      } else {
        conditions.push(eq(properties.approvalStatus, filters.approvalStatus as any));
      }
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

  async getAppointments(filters?: { status?: string; clientId?: string; propertyId?: string }): Promise<any[]> {
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

    let query = db
      .select()
      .from(appointments)
      .orderBy(desc(appointments.date));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const baseAppointments = await query;

    // Fetch all related data in parallel
    const propertyIds = [...new Set(baseAppointments.map(a => a.propertyId).filter(Boolean))];
    const clientIds = [...new Set(baseAppointments.map(a => a.clientId).filter(Boolean))];
    const conciergeIds = [...new Set(baseAppointments.map(a => a.conciergeId).filter(Boolean))];
    const presentationCardIds = [...new Set(baseAppointments.map(a => a.presentationCardId).filter(Boolean))];

    const [propertiesData, clientsData, conciergesData, cardsData] = await Promise.all([
      propertyIds.length > 0 ? db.select().from(properties).where(inArray(properties.id, propertyIds)) : [],
      clientIds.length > 0 ? db.select().from(users).where(inArray(users.id, clientIds)) : [],
      conciergeIds.length > 0 ? db.select().from(users).where(inArray(users.id, conciergeIds)) : [],
      presentationCardIds.length > 0 ? db.select().from(presentationCards).where(inArray(presentationCards.id, presentationCardIds)) : [],
    ]);

    // Create lookup maps
    const propertyMap = new Map(propertiesData.map(p => [p.id, p]));
    const clientMap = new Map(clientsData.map(c => [c.id, c]));
    const conciergeMap = new Map(conciergesData.map(c => [c.id, c]));
    const cardMap = new Map(cardsData.map(c => [c.id, c]));

    // Combine data
    return baseAppointments.map(appointment => ({
      ...appointment,
      property: appointment.propertyId ? propertyMap.get(appointment.propertyId) : null,
      client: appointment.clientId ? clientMap.get(appointment.clientId) : null,
      concierge: appointment.conciergeId ? conciergeMap.get(appointment.conciergeId) : null,
      presentationCard: appointment.presentationCardId ? cardMap.get(appointment.presentationCardId) : null,
    }));
  }

  async getAllAppointmentsAdmin(): Promise<any[]> {
    const baseAppointments = await db
      .select()
      .from(appointments)
      .orderBy(desc(appointments.date));

    // Fetch all related data in parallel
    const propertyIds = [...new Set(baseAppointments.map(a => a.propertyId).filter(Boolean))];
    const clientIds = [...new Set(baseAppointments.map(a => a.clientId).filter(Boolean))];
    const conciergeIds = [...new Set(baseAppointments.map(a => a.conciergeId).filter(Boolean))];

    const [propertiesData, clientsData, conciergesData] = await Promise.all([
      propertyIds.length > 0 ? db.select().from(properties).where(inArray(properties.id, propertyIds)) : [],
      clientIds.length > 0 ? db.select().from(users).where(inArray(users.id, clientIds)) : [],
      conciergeIds.length > 0 ? db.select().from(users).where(inArray(users.id, conciergeIds)) : [],
    ]);

    // Create lookup maps
    const propertyMap = new Map(propertiesData.map(p => [p.id, { id: p.id, title: p.title, location: p.location }]));
    const clientMap = new Map(clientsData.map(c => [c.id, { id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, profileImageUrl: c.profileImageUrl }]));
    const conciergeMap = new Map(conciergesData.map(c => [c.id, { id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email }]));

    // Combine data
    return baseAppointments.map(appointment => ({
      ...appointment,
      property: appointment.propertyId ? propertyMap.get(appointment.propertyId) : null,
      client: appointment.clientId ? clientMap.get(appointment.clientId) : null,
      concierge: appointment.conciergeId ? conciergeMap.get(appointment.conciergeId) : null,
    }));
  }

  async getSellerManagementData(): Promise<any[]> {
    // Get all sellers
    const sellers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'seller'))
      .orderBy(users.firstName, users.lastName);

    if (sellers.length === 0) {
      return [];
    }

    const sellerIds = sellers.map(s => s.id);

    // Fetch all related data in parallel
    const [allLeads, allRecommendations] = await Promise.all([
      db.select().from(leads).where(
        or(
          inArray(leads.assignedToId, sellerIds),
          inArray(leads.registeredById, sellerIds)
        )
      ),
      db.select().from(propertyRecommendations).where(
        inArray(propertyRecommendations.sellerId, sellerIds)
      ),
    ]);

    // Get property data for recommendations
    const propertyIds = [...new Set(allRecommendations.map(r => r.propertyId))];
    const propertiesData = propertyIds.length > 0 
      ? await db.select().from(properties).where(inArray(properties.id, propertyIds))
      : [];
    const propertyMap = new Map(propertiesData.map(p => [p.id, { id: p.id, title: p.title, location: p.location }]));

    // Organize data by seller
    return sellers.map(seller => {
      const assignedLeads = allLeads.filter(l => l.assignedToId === seller.id);
      const registeredLeads = allLeads.filter(l => l.registeredById === seller.id);
      const recommendations = allRecommendations.filter(r => r.sellerId === seller.id);

      // Count leads by status
      const leadsByStatus = {
        nuevo: assignedLeads.filter(l => l.status === 'nuevo').length,
        contactado: assignedLeads.filter(l => l.status === 'contactado').length,
        calificado: assignedLeads.filter(l => l.status === 'calificado').length,
        propuesta: assignedLeads.filter(l => l.status === 'propuesta').length,
        negociacion: assignedLeads.filter(l => l.status === 'negociacion').length,
        ganado: assignedLeads.filter(l => l.status === 'ganado').length,
        perdido: assignedLeads.filter(l => l.status === 'perdido').length,
      };

      return {
        seller: {
          id: seller.id,
          firstName: seller.firstName,
          lastName: seller.lastName,
          email: seller.email,
          profileImageUrl: seller.profileImageUrl,
          phone: seller.phone,
        },
        stats: {
          totalAssignedLeads: assignedLeads.length,
          totalRegisteredLeads: registeredLeads.length,
          totalRecommendations: recommendations.length,
          leadsByStatus,
        },
        assignedLeads: assignedLeads.map(lead => ({
          ...lead,
          isAssigned: true,
        })),
        registeredLeads: registeredLeads.map(lead => ({
          ...lead,
          isRegistered: true,
        })),
        recentRecommendations: recommendations
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
          .map(rec => ({
            ...rec,
            property: rec.propertyId ? propertyMap.get(rec.propertyId) : null,
          })),
      };
    });
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

  // Calendar Event operations
  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event;
  }

  async getCalendarEvents(filters?: { 
    eventType?: string; 
    assignedToId?: string; 
    status?: string; 
    propertyId?: string; 
    startDate?: Date; 
    endDate?: Date;
  }): Promise<any[]> {
    const conditions = [];

    if (filters?.eventType) {
      conditions.push(eq(calendarEvents.eventType, filters.eventType as any));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(calendarEvents.assignedToId, filters.assignedToId));
    }
    if (filters?.status) {
      conditions.push(eq(calendarEvents.status, filters.status as any));
    }
    if (filters?.propertyId) {
      conditions.push(eq(calendarEvents.propertyId, filters.propertyId));
    }
    if (filters?.startDate) {
      conditions.push(gte(calendarEvents.startDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(calendarEvents.endDate, filters.endDate));
    }

    let query = db
      .select()
      .from(calendarEvents)
      .orderBy(calendarEvents.startDate);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const baseEvents = await query;

    // Fetch all related data in parallel
    const propertyIds = [...new Set(baseEvents.map(e => e.propertyId).filter(Boolean))];
    const assignedToIds = [...new Set(baseEvents.map(e => e.assignedToId).filter(Boolean))];
    const clientIds = [...new Set(baseEvents.map(e => e.clientId).filter(Boolean))];

    // Combine assignedTo and client IDs for a single user query
    const allUserIds = [...new Set([...assignedToIds, ...clientIds])];

    const [propertiesData, usersData] = await Promise.all([
      propertyIds.length > 0 ? db.select().from(properties).where(sql`${properties.id} = ANY(${propertyIds})`) : [],
      allUserIds.length > 0 ? db.select().from(users).where(sql`${users.id} = ANY(${allUserIds})`) : [],
    ]);

    // Create lookup maps
    const propertyMap = new Map(propertiesData.map(p => [p.id, p]));
    const userMap = new Map(usersData.map(u => [u.id, u]));

    // Combine data
    return baseEvents.map(event => ({
      ...event,
      property: event.propertyId ? propertyMap.get(event.propertyId) : null,
      assignedTo: event.assignedToId ? userMap.get(event.assignedToId) : null,
      client: event.clientId ? userMap.get(event.clientId) : null,
    }));
  }

  async createCalendarEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(eventData).returning();
    return event;
  }

  async updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const [event] = await db
      .update(calendarEvents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    return event;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  // Business Hours operations
  async getBusinessHours(): Promise<BusinessHours[]> {
    return await db.select().from(businessHours).orderBy(businessHours.dayOfWeek);
  }

  async getBusinessHoursByDay(dayOfWeek: number): Promise<BusinessHours | undefined> {
    const [hours] = await db.select().from(businessHours).where(eq(businessHours.dayOfWeek, dayOfWeek));
    return hours;
  }

  async upsertBusinessHours(hours: InsertBusinessHours): Promise<BusinessHours> {
    const existing = await this.getBusinessHoursByDay(hours.dayOfWeek);
    
    if (existing) {
      const [updated] = await db
        .update(businessHours)
        .set({ ...hours, updatedAt: new Date() })
        .where(eq(businessHours.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(businessHours).values(hours).returning();
      return created;
    }
  }

  async initializeBusinessHours(): Promise<void> {
    const existing = await this.getBusinessHours();
    if (existing.length > 0) return;

    // Initialize default hours: Monday-Saturday 10:00-18:00, Sunday closed
    const defaultHours: InsertBusinessHours[] = [
      { dayOfWeek: 0, isOpen: false, openTime: "10:00", closeTime: "18:00" }, // Sunday
      { dayOfWeek: 1, isOpen: true, openTime: "10:00", closeTime: "18:00" },  // Monday
      { dayOfWeek: 2, isOpen: true, openTime: "10:00", closeTime: "18:00" },  // Tuesday
      { dayOfWeek: 3, isOpen: true, openTime: "10:00", closeTime: "18:00" },  // Wednesday
      { dayOfWeek: 4, isOpen: true, openTime: "10:00", closeTime: "18:00" },  // Thursday
      { dayOfWeek: 5, isOpen: true, openTime: "10:00", closeTime: "18:00" },  // Friday
      { dayOfWeek: 6, isOpen: true, openTime: "10:00", closeTime: "18:00" },  // Saturday
    ];

    await db.insert(businessHours).values(defaultHours);
  }

  // Concierge Blocked Slots operations
  async getConciergeBlockedSlot(id: string): Promise<ConciergeBlockedSlot | undefined> {
    const [slot] = await db.select().from(conciergeBlockedSlots).where(eq(conciergeBlockedSlots.id, id));
    return slot;
  }

  async getConciergeBlockedSlots(conciergeId: string): Promise<ConciergeBlockedSlot[]> {
    return await db
      .select()
      .from(conciergeBlockedSlots)
      .where(eq(conciergeBlockedSlots.conciergeId, conciergeId))
      .orderBy(conciergeBlockedSlots.startTime);
  }

  async getConciergeBlockedSlotsByDateRange(
    conciergeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConciergeBlockedSlot[]> {
    return await db
      .select()
      .from(conciergeBlockedSlots)
      .where(
        and(
          eq(conciergeBlockedSlots.conciergeId, conciergeId),
          gte(conciergeBlockedSlots.startTime, startDate),
          lte(conciergeBlockedSlots.endTime, endDate)
        )
      )
      .orderBy(conciergeBlockedSlots.startTime);
  }

  async createConciergeBlockedSlot(slot: InsertConciergeBlockedSlot): Promise<ConciergeBlockedSlot> {
    const [created] = await db.insert(conciergeBlockedSlots).values(slot).returning();
    return created;
  }

  async deleteConciergeBlockedSlot(id: string): Promise<void> {
    await db.delete(conciergeBlockedSlots).where(eq(conciergeBlockedSlots.id, id));
  }

  // Property Review operations
  async getPropertyReview(id: string): Promise<PropertyReview | undefined> {
    const [review] = await db.select().from(propertyReviews).where(eq(propertyReviews.id, id));
    return review;
  }

  async getPropertyReviews(filters?: { propertyId?: string; clientId?: string }): Promise<PropertyReview[]> {
    const conditions = [];
    if (filters?.propertyId) {
      conditions.push(eq(propertyReviews.propertyId, filters.propertyId));
    }
    if (filters?.clientId) {
      conditions.push(eq(propertyReviews.clientId, filters.clientId));
    }

    let query = db.select().from(propertyReviews);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(desc(propertyReviews.createdAt));
  }

  async createPropertyReview(reviewData: InsertPropertyReview): Promise<PropertyReview> {
    const [review] = await db.insert(propertyReviews).values(reviewData).returning();
    return review;
  }

  async updatePropertyReview(id: string, updates: Partial<InsertPropertyReview>): Promise<PropertyReview> {
    const [review] = await db
      .update(propertyReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(propertyReviews.id, id))
      .returning();
    return review;
  }

  // Appointment Review operations
  async getAppointmentReview(id: string): Promise<AppointmentReview | undefined> {
    const [review] = await db.select().from(appointmentReviews).where(eq(appointmentReviews.id, id));
    return review;
  }

  async getAppointmentReviews(filters?: { appointmentId?: string; clientId?: string }): Promise<AppointmentReview[]> {
    const conditions = [];
    if (filters?.appointmentId) {
      conditions.push(eq(appointmentReviews.appointmentId, filters.appointmentId));
    }
    if (filters?.clientId) {
      conditions.push(eq(appointmentReviews.clientId, filters.clientId));
    }

    let query = db.select().from(appointmentReviews);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(desc(appointmentReviews.createdAt));
  }

  async createAppointmentReview(reviewData: InsertAppointmentReview): Promise<AppointmentReview> {
    const [review] = await db.insert(appointmentReviews).values(reviewData).returning();
    return review;
  }

  async updateAppointmentReview(id: string, updates: Partial<InsertAppointmentReview>): Promise<AppointmentReview> {
    const [review] = await db
      .update(appointmentReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointmentReviews.id, id))
      .returning();
    return review;
  }

  // Concierge Review operations (from clients)
  async getConciergeReview(id: string): Promise<ConciergeReview | undefined> {
    const [review] = await db.select().from(conciergeReviews).where(eq(conciergeReviews.id, id));
    return review;
  }

  async getConciergeReviews(filters?: { conciergeId?: string; clientId?: string }): Promise<ConciergeReview[]> {
    const conditions = [];
    if (filters?.conciergeId) {
      conditions.push(eq(conciergeReviews.conciergeId, filters.conciergeId));
    }
    if (filters?.clientId) {
      conditions.push(eq(conciergeReviews.clientId, filters.clientId));
    }

    let query = db.select().from(conciergeReviews);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(desc(conciergeReviews.createdAt));
  }

  async createConciergeReview(reviewData: InsertConciergeReview): Promise<ConciergeReview> {
    const [review] = await db.insert(conciergeReviews).values(reviewData).returning();
    return review;
  }

  async updateConciergeReview(id: string, updates: Partial<InsertConciergeReview>): Promise<ConciergeReview> {
    const [review] = await db
      .update(conciergeReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conciergeReviews.id, id))
      .returning();
    return review;
  }

  // Client Review operations (from concierges)
  async getClientReview(id: string): Promise<ClientReview | undefined> {
    const [review] = await db.select().from(clientReviews).where(eq(clientReviews.id, id));
    return review;
  }

  async getClientReviews(filters?: { clientId?: string; conciergeId?: string }): Promise<ClientReview[]> {
    const conditions = [];
    if (filters?.clientId) {
      conditions.push(eq(clientReviews.clientId, filters.clientId));
    }
    if (filters?.conciergeId) {
      conditions.push(eq(clientReviews.conciergeId, filters.conciergeId));
    }

    let query = db.select().from(clientReviews);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(desc(clientReviews.createdAt));
  }

  async createClientReview(reviewData: InsertClientReview): Promise<ClientReview> {
    const [review] = await db.insert(clientReviews).values(reviewData).returning();
    return review;
  }

  async updateClientReview(id: string, updates: Partial<InsertClientReview>): Promise<ClientReview> {
    const [review] = await db
      .update(clientReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientReviews.id, id))
      .returning();
    return review;
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

  // Referral Configuration operations
  async getReferralConfig(): Promise<ReferralConfig | undefined> {
    const [config] = await db.select().from(referralConfig).limit(1);
    return config;
  }

  async updateReferralConfig(updates: Partial<InsertReferralConfig>, updatedBy: string): Promise<ReferralConfig> {
    const existing = await this.getReferralConfig();
    
    if (existing) {
      const [config] = await db
        .update(referralConfig)
        .set({ ...updates, updatedBy, updatedAt: new Date() })
        .where(eq(referralConfig.id, existing.id))
        .returning();
      return config;
    } else {
      const [config] = await db
        .insert(referralConfig)
        .values({ ...updates, updatedBy })
        .returning();
      return config;
    }
  }

  // Client Referral operations
  async getClientReferral(id: string): Promise<ClientReferral | undefined> {
    const [referral] = await db.select().from(clientReferrals).where(eq(clientReferrals.id, id));
    return referral;
  }

  async getClientReferrals(filters?: { referrerId?: string; sellerView?: string; status?: string }): Promise<ClientReferral[]> {
    let query = db.select().from(clientReferrals);
    const conditions = [];

    if (filters?.sellerView) {
      conditions.push(
        or(
          eq(clientReferrals.referrerId, filters.sellerView),
          eq(clientReferrals.assignedTo, filters.sellerView),
          isNull(clientReferrals.assignedTo)
        )!
      );
    } else if (filters?.referrerId) {
      conditions.push(eq(clientReferrals.referrerId, filters.referrerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(clientReferrals.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(clientReferrals.createdAt));
  }

  async createClientReferral(referralData: InsertClientReferral): Promise<ClientReferral> {
    const [referral] = await db.insert(clientReferrals).values(referralData).returning();
    return referral;
  }

  async updateClientReferral(id: string, updates: Partial<InsertClientReferral>): Promise<ClientReferral> {
    const [referral] = await db
      .update(clientReferrals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientReferrals.id, id))
      .returning();
    return referral;
  }

  async updateClientReferralStatus(id: string, status: string): Promise<ClientReferral> {
    const [referral] = await db
      .update(clientReferrals)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(clientReferrals.id, id))
      .returning();
    return referral;
  }

  // Owner Referral operations
  async getOwnerReferral(id: string): Promise<OwnerReferral | undefined> {
    const [referral] = await db.select().from(ownerReferrals).where(eq(ownerReferrals.id, id));
    return referral;
  }

  async getOwnerReferrals(filters?: { referrerId?: string; sellerView?: string; status?: string }): Promise<OwnerReferral[]> {
    let query = db.select().from(ownerReferrals);
    const conditions = [];

    if (filters?.sellerView) {
      conditions.push(
        or(
          eq(ownerReferrals.referrerId, filters.sellerView),
          eq(ownerReferrals.assignedTo, filters.sellerView),
          isNull(ownerReferrals.assignedTo)
        )!
      );
    } else if (filters?.referrerId) {
      conditions.push(eq(ownerReferrals.referrerId, filters.referrerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(ownerReferrals.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(ownerReferrals.createdAt));
  }

  async createOwnerReferral(referralData: InsertOwnerReferral): Promise<OwnerReferral> {
    const [referral] = await db.insert(ownerReferrals).values(referralData).returning();
    return referral;
  }

  async updateOwnerReferral(id: string, updates: Partial<InsertOwnerReferral>): Promise<OwnerReferral> {
    const [referral] = await db
      .update(ownerReferrals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ownerReferrals.id, id))
      .returning();
    return referral;
  }

  async updateOwnerReferralStatus(id: string, status: string): Promise<OwnerReferral> {
    const [referral] = await db
      .update(ownerReferrals)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(ownerReferrals.id, id))
      .returning();
    return referral;
  }

  async getOwnerReferralByVerificationToken(token: string): Promise<OwnerReferral | undefined> {
    const [referral] = await db
      .select()
      .from(ownerReferrals)
      .where(eq(ownerReferrals.verificationToken, token));
    return referral;
  }

  async verifyOwnerReferralEmail(id: string): Promise<OwnerReferral> {
    const [referral] = await db
      .update(ownerReferrals)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        status: 'confirmado' as any,
        updatedAt: new Date()
      })
      .where(eq(ownerReferrals.id, id))
      .returning();
    return referral;
  }

  async approveOwnerReferralByAdmin(id: string, adminId: string, commissionAmount?: string): Promise<OwnerReferral> {
    const updates: any = {
      status: 'aprobado' as any,
      adminApprovedById: adminId,
      adminApprovedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (commissionAmount) {
      updates.commissionAmount = commissionAmount;
    }
    
    const [referral] = await db
      .update(ownerReferrals)
      .set(updates)
      .where(eq(ownerReferrals.id, id))
      .returning();
    return referral;
  }

  async rejectOwnerReferralByAdmin(id: string, adminId: string, rejectionReason: string): Promise<OwnerReferral> {
    const [referral] = await db
      .update(ownerReferrals)
      .set({
        status: 'rechazado' as any,
        rejectedById: adminId,
        rejectedAt: new Date(),
        rejectionReason,
        updatedAt: new Date()
      })
      .where(eq(ownerReferrals.id, id))
      .returning();
    return referral;
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

  async getTasks(filters?: { propertyId?: string; assignedToId?: string; status?: string; priority?: string; search?: string }): Promise<Task[]> {
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
    if (filters?.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }
    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${tasks.title}) LIKE ${searchLower}`,
          sql`LOWER(${tasks.description}) LIKE ${searchLower}`,
          sql`LOWER(${tasks.notes}) LIKE ${searchLower}`
        )
      );
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
  
  async updateAdminProfile(id: string, updates: { firstName?: string; lastName?: string; email?: string; profileImageUrl?: string }): Promise<AdminUser> {
    const [admin] = await db
      .update(adminUsers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return admin;
  }
  
  async updateAdminPassword(id: string, passwordHash: string): Promise<AdminUser> {
    const [admin] = await db
      .update(adminUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return admin;
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

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.email, email)).orderBy(desc(leads.createdAt)).limit(1);
    return lead;
  }

  async getActiveLead(email: string): Promise<Lead | undefined> {
    const now = new Date();
    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.email, email),
          gte(leads.validUntil, now)
        )
      )
      .orderBy(desc(leads.createdAt))
      .limit(1);
    return lead;
  }

  async getLeads(filters?: { status?: string; assignedToId?: string; registeredById?: string }): Promise<Lead[]> {
    let query = db.select().from(leads);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status as any));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(leads.assignedToId, filters.assignedToId));
    }
    if (filters?.registeredById) {
      conditions.push(eq(leads.registeredById, filters.registeredById));
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

  async verifyLeadEmail(leadId: string): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning();
    return updated;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }
  
  // Lead Property Offer operations
  async getLeadPropertyOffer(id: string): Promise<LeadPropertyOffer | undefined> {
    const [offer] = await db.select().from(leadPropertyOffers).where(eq(leadPropertyOffers.id, id));
    return offer;
  }

  async getLeadPropertyOffers(filters?: { leadId?: string; propertyId?: string; offeredById?: string }): Promise<LeadPropertyOffer[]> {
    let query = db.select().from(leadPropertyOffers);
    
    const conditions = [];
    if (filters?.leadId) {
      conditions.push(eq(leadPropertyOffers.leadId, filters.leadId));
    }
    if (filters?.propertyId) {
      conditions.push(eq(leadPropertyOffers.propertyId, filters.propertyId));
    }
    if (filters?.offeredById) {
      conditions.push(eq(leadPropertyOffers.offeredById, filters.offeredById));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(leadPropertyOffers.createdAt));
  }

  async createLeadPropertyOffer(offerData: InsertLeadPropertyOffer): Promise<LeadPropertyOffer> {
    const [offer] = await db.insert(leadPropertyOffers).values(offerData).returning();
    return offer;
  }

  async updateLeadPropertyOffer(id: string, updates: Partial<InsertLeadPropertyOffer>): Promise<LeadPropertyOffer> {
    const [updated] = await db
      .update(leadPropertyOffers)
      .set(updates)
      .where(eq(leadPropertyOffers.id, id))
      .returning();
    return updated;
  }
  
  // System Configuration operations
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
    return config;
  }

  async getAllSystemConfigs(): Promise<SystemConfig[]> {
    return await db.select().from(systemConfig).orderBy(systemConfig.key);
  }

  async upsertSystemConfig(configData: InsertSystemConfig): Promise<SystemConfig> {
    const [config] = await db
      .insert(systemConfig)
      .values(configData)
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: {
          ...configData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return config;
  }

  async deleteSystemConfig(key: string): Promise<void> {
    await db.delete(systemConfig).where(eq(systemConfig.key, key));
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

  // Rental Contract operations
  async getRentalContract(id: string): Promise<RentalContract | undefined> {
    const [contract] = await db.select().from(rentalContracts).where(eq(rentalContracts.id, id));
    return contract;
  }

  async getRentalContracts(filters?: { status?: string; propertyId?: string; tenantId?: string; sellerId?: string }): Promise<RentalContract[]> {
    let query = db.select().from(rentalContracts);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(rentalContracts.status, filters.status as any));
    }
    if (filters?.propertyId) {
      conditions.push(eq(rentalContracts.propertyId, filters.propertyId));
    }
    if (filters?.tenantId) {
      conditions.push(eq(rentalContracts.tenantId, filters.tenantId));
    }
    if (filters?.sellerId) {
      conditions.push(eq(rentalContracts.sellerId, filters.sellerId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(rentalContracts.createdAt));
  }

  async createRentalContract(contractData: InsertRentalContract): Promise<RentalContract> {
    const [contract] = await db.insert(rentalContracts).values(contractData).returning();
    return contract;
  }

  async updateRentalContract(id: string, updates: Partial<InsertRentalContract>): Promise<RentalContract> {
    const [updated] = await db
      .update(rentalContracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rentalContracts.id, id))
      .returning();
    return updated;
  }

  async updateRentalContractStatus(
    id: string, 
    status: string, 
    additionalData?: { apartadoDate?: Date; contractSignedDate?: Date; checkInDate?: Date; payoutReleasedAt?: Date }
  ): Promise<RentalContract> {
    const updateData: any = { status: status as any, updatedAt: new Date() };
    
    if (additionalData?.apartadoDate) {
      updateData.apartadoDate = additionalData.apartadoDate;
    }
    if (additionalData?.contractSignedDate) {
      updateData.contractSignedDate = additionalData.contractSignedDate;
    }
    if (additionalData?.checkInDate) {
      updateData.checkInDate = additionalData.checkInDate;
    }
    if (additionalData?.payoutReleasedAt) {
      updateData.payoutReleasedAt = additionalData.payoutReleasedAt;
    }
    
    const [updated] = await db
      .update(rentalContracts)
      .set(updateData)
      .where(eq(rentalContracts.id, id))
      .returning();
    return updated;
  }

  async deleteRentalContract(id: string): Promise<void> {
    await db.delete(rentalContracts).where(eq(rentalContracts.id, id));
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

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
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
      const whereConditions = [eq(chatParticipants.userId, filters.userId)];
      
      if (filters?.type) {
        whereConditions.push(eq(chatConversations.type, filters.type as any));
      }
      
      const query = db
        .select({
          id: chatConversations.id,
          type: chatConversations.type,
          title: chatConversations.title,
          propertyId: chatConversations.propertyId,
          rentalApplicationId: chatConversations.rentalApplicationId,
          createdById: chatConversations.createdById,
          lastMessageAt: chatConversations.lastMessageAt,
          isBot: chatConversations.isBot,
          createdAt: chatConversations.createdAt,
          updatedAt: chatConversations.updatedAt,
        })
        .from(chatConversations)
        .innerJoin(
          chatParticipants,
          eq(chatConversations.id, chatParticipants.conversationId)
        )
        .where(and(...whereConditions));
      
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

  async getPropertySubmissionDraftByProperty(propertyId: string): Promise<PropertySubmissionDraft | undefined> {
    // Find the draft that was approved and created this specific property
    const [draft] = await db
      .select()
      .from(propertySubmissionDrafts)
      .where(eq(propertySubmissionDrafts.propertyId, propertyId))
      .limit(1);
    
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

  async approvePropertySubmissionDraft(id: string, adminId: string): Promise<Property> {
    // Import transformer
    const { draftToPropertyData } = await import("./utils/draftTransformers.js");
    
    // Get the draft
    const draft = await this.getPropertySubmissionDraft(id);
    if (!draft) {
      throw new Error("Borrador no encontrado");
    }
    
    if (draft.status !== "submitted") {
      throw new Error("Solo se pueden aprobar borradores enviados");
    }
    
    // Normalize termsAcceptance for rental lifecycle integration
    let normalizedTermsAcceptance = draft.termsAcceptance;
    if (draft.termsAcceptance) {
      const terms = draft.termsAcceptance as any;
      
      // Ensure acceptedAt field exists for rental contract integration
      if (!terms.acceptedAt && terms.acceptedTerms && terms.confirmedAccuracy && terms.acceptedCommission) {
        normalizedTermsAcceptance = {
          ...terms,
          acceptedAt: draft.updatedAt?.toISOString() || new Date().toISOString(), // Use draft update time as fallback
        };
      }
    }
    
    // Transform draft to property data
    const propertyData = draftToPropertyData(draft, adminId);
    
    // Create the property
    const [property] = await db.insert(properties).values(propertyData as any).returning();
    
    // Update draft status to approved and link to created property
    await this.updatePropertySubmissionDraft(id, { 
      status: "approved",
      propertyId: property.id, // Link draft to created property
      termsAcceptance: normalizedTermsAcceptance as any, // Normalize terms acceptance
      reviewedBy: adminId,
      reviewedAt: new Date()
    });
    
    return property;
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

  // Feedback operations
  async getFeedback(id: string): Promise<Feedback | undefined> {
    const [feedbackItem] = await db.select().from(feedback).where(eq(feedback.id, id));
    return feedbackItem;
  }

  async getAllFeedback(filters?: { type?: string; status?: string; userId?: string }): Promise<Feedback[]> {
    let query = db.select().from(feedback);
    
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(feedback.type, filters.type as any));
    }
    if (filters?.status) {
      conditions.push(eq(feedback.status, filters.status as any));
    }
    if (filters?.userId) {
      conditions.push(eq(feedback.userId, filters.userId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(feedback.createdAt));
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  async updateFeedback(id: string, updates: UpdateFeedback): Promise<Feedback> {
    const [updated] = await db
      .update(feedback)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(feedback.id, id))
      .returning();
    return updated;
  }

  // Rental Commission Config operations
  async getRentalCommissionConfig(id: string): Promise<RentalCommissionConfig | undefined> {
    const [config] = await db.select().from(rentalCommissionConfigs).where(eq(rentalCommissionConfigs.id, id));
    return config;
  }

  async getRentalCommissionConfigs(filters?: { propertyId?: string; userId?: string }): Promise<RentalCommissionConfig[]> {
    let query = db.select().from(rentalCommissionConfigs);
    
    const conditions = [];
    if (filters?.propertyId) {
      conditions.push(eq(rentalCommissionConfigs.propertyId, filters.propertyId));
    }
    if (filters?.userId) {
      conditions.push(eq(rentalCommissionConfigs.userId, filters.userId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(rentalCommissionConfigs.createdAt));
  }

  async createRentalCommissionConfig(configData: InsertRentalCommissionConfig): Promise<RentalCommissionConfig> {
    const [config] = await db.insert(rentalCommissionConfigs).values(configData).returning();
    return config;
  }

  async updateRentalCommissionConfig(id: string, updates: Partial<InsertRentalCommissionConfig>): Promise<RentalCommissionConfig> {
    const [updated] = await db
      .update(rentalCommissionConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rentalCommissionConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteRentalCommissionConfig(id: string): Promise<void> {
    await db.delete(rentalCommissionConfigs).where(eq(rentalCommissionConfigs.id, id));
  }

  // Accountant Assignment operations
  async getAccountantAssignment(id: string): Promise<AccountantAssignment | undefined> {
    const [assignment] = await db.select().from(accountantAssignments).where(eq(accountantAssignments.id, id));
    return assignment;
  }

  async getAccountantAssignments(filters?: { accountantId?: string; assignmentType?: string; propertyId?: string; userId?: string }): Promise<AccountantAssignment[]> {
    let query = db.select().from(accountantAssignments);
    
    const conditions = [];
    if (filters?.accountantId) {
      conditions.push(eq(accountantAssignments.accountantId, filters.accountantId));
    }
    if (filters?.assignmentType) {
      conditions.push(eq(accountantAssignments.assignmentType, filters.assignmentType as any));
    }
    if (filters?.propertyId) {
      conditions.push(eq(accountantAssignments.propertyId, filters.propertyId));
    }
    if (filters?.userId) {
      conditions.push(eq(accountantAssignments.userId, filters.userId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(accountantAssignments.createdAt));
  }

  async createAccountantAssignment(assignmentData: InsertAccountantAssignment): Promise<AccountantAssignment> {
    const [assignment] = await db.insert(accountantAssignments).values(assignmentData).returning();
    return assignment;
  }

  async updateAccountantAssignment(id: string, updates: Partial<InsertAccountantAssignment>): Promise<AccountantAssignment> {
    const [updated] = await db
      .update(accountantAssignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accountantAssignments.id, id))
      .returning();
    return updated;
  }

  async deleteAccountantAssignment(id: string): Promise<void> {
    await db.delete(accountantAssignments).where(eq(accountantAssignments.id, id));
  }

  async getAccountantActiveAssignments(accountantId: string): Promise<AccountantAssignment[]> {
    const now = new Date();
    return await db
      .select()
      .from(accountantAssignments)
      .where(
        and(
          eq(accountantAssignments.accountantId, accountantId),
          lte(accountantAssignments.effectiveFrom, now),
          or(
            isNull(accountantAssignments.effectiveTo),
            gte(accountantAssignments.effectiveTo, now)
          )
        )
      )
      .orderBy(desc(accountantAssignments.createdAt));
  }

  // Payout Batch operations
  async getPayoutBatch(id: string): Promise<PayoutBatch | undefined> {
    const [batch] = await db.select().from(payoutBatches).where(eq(payoutBatches.id, id));
    return batch;
  }

  async getPayoutBatches(filters?: { status?: string; createdBy?: string }): Promise<PayoutBatch[]> {
    let query = db.select().from(payoutBatches);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(payoutBatches.status, filters.status as any));
    }
    if (filters?.createdBy) {
      conditions.push(eq(payoutBatches.createdBy, filters.createdBy));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(payoutBatches.createdAt));
  }

  async createPayoutBatch(batchData: InsertPayoutBatch): Promise<PayoutBatch> {
    const [batch] = await db.insert(payoutBatches).values(batchData).returning();
    return batch;
  }

  async updatePayoutBatch(id: string, updates: Partial<InsertPayoutBatch>): Promise<PayoutBatch> {
    const [updated] = await db
      .update(payoutBatches)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payoutBatches.id, id))
      .returning();
    return updated;
  }

  async updatePayoutBatchStatus(id: string, status: string, updatedBy: string, notes?: string): Promise<PayoutBatch> {
    const updates: any = {
      status: status as any,
      updatedAt: new Date(),
    };

    if (notes) {
      updates.notes = notes;
    }

    if (status === "approved") {
      updates.approvedBy = updatedBy;
      updates.approvedAt = new Date();
    } else if (status === "paid") {
      updates.paidBy = updatedBy;
      updates.paidAt = new Date();
      updates.actualPaymentDate = new Date();
    }

    const [updated] = await db
      .update(payoutBatches)
      .set(updates)
      .where(eq(payoutBatches.id, id))
      .returning();
    return updated;
  }

  async generatePayoutBatchNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(payoutBatches)
      .where(sql`EXTRACT(YEAR FROM created_at) = ${year}`);
    
    const count = Number(result[0]?.count || 0) + 1;
    return `PAYOUT-${year}-${String(count).padStart(3, '0')}`;
  }

  // Income Transaction operations
  async getIncomeTransaction(id: string): Promise<IncomeTransaction | undefined> {
    const [transaction] = await db.select().from(incomeTransactions).where(eq(incomeTransactions.id, id));
    return transaction;
  }

  async getIncomeTransactions(filters?: { 
    beneficiaryId?: string;
    category?: string;
    status?: string;
    propertyId?: string;
    payoutBatchId?: string;
    accountantId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<IncomeTransaction[]> {
    let query = db.select().from(incomeTransactions);
    
    const conditions = [];
    
    if (filters?.beneficiaryId) {
      conditions.push(eq(incomeTransactions.beneficiaryId, filters.beneficiaryId));
    }
    if (filters?.category) {
      conditions.push(eq(incomeTransactions.category, filters.category as any));
    }
    if (filters?.status) {
      conditions.push(eq(incomeTransactions.status, filters.status as any));
    }
    if (filters?.propertyId) {
      conditions.push(eq(incomeTransactions.propertyId, filters.propertyId));
    }
    if (filters?.payoutBatchId) {
      conditions.push(eq(incomeTransactions.payoutBatchId, filters.payoutBatchId));
    }
    if (filters?.fromDate) {
      conditions.push(gte(incomeTransactions.createdAt, filters.fromDate));
    }
    if (filters?.toDate) {
      conditions.push(lte(incomeTransactions.createdAt, filters.toDate));
    }

    // Accountant scope filtering
    if (filters?.accountantId) {
      const assignments = await this.getAccountantActiveAssignments(filters.accountantId);
      const hasAllAccess = assignments.some(a => a.assignmentType === 'all');
      
      if (!hasAllAccess) {
        const propertyIds = assignments
          .filter(a => a.assignmentType === 'property' && a.propertyId)
          .map(a => a.propertyId!);
        
        const userIds = assignments
          .filter(a => a.assignmentType === 'user' && a.userId)
          .map(a => a.userId!);

        if (propertyIds.length > 0 || userIds.length > 0) {
          const scopeConditions = [];
          if (propertyIds.length > 0) {
            scopeConditions.push(sql`${incomeTransactions.propertyId} IN ${propertyIds}`);
          }
          if (userIds.length > 0) {
            scopeConditions.push(sql`${incomeTransactions.beneficiaryId} IN ${userIds}`);
          }
          conditions.push(or(...scopeConditions) as any);
        } else {
          // No assignments, return empty result
          conditions.push(sql`1 = 0`);
        }
      }
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(incomeTransactions.createdAt));
  }

  async createIncomeTransaction(transactionData: InsertIncomeTransaction): Promise<IncomeTransaction> {
    const [transaction] = await db.insert(incomeTransactions).values(transactionData).returning();
    return transaction;
  }

  async updateIncomeTransaction(id: string, updates: Partial<InsertIncomeTransaction>): Promise<IncomeTransaction> {
    const [updated] = await db
      .update(incomeTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(incomeTransactions.id, id))
      .returning();
    return updated;
  }

  async updateIncomeTransactionStatus(id: string, status: string, updatedBy: string, notes?: string, rejectionReason?: string): Promise<IncomeTransaction> {
    const updates: any = {
      status: status as any,
      updatedAt: new Date(),
    };

    if (notes) {
      updates.notes = notes;
    }

    if (status === "approved") {
      updates.approvedBy = updatedBy;
      updates.approvedAt = new Date();
    } else if (status === "rejected") {
      updates.rejectedBy = updatedBy;
      updates.rejectedAt = new Date();
      if (rejectionReason) {
        updates.rejectionReason = rejectionReason;
      }
    } else if (status === "paid") {
      updates.actualPaymentDate = new Date();
    }

    const [updated] = await db
      .update(incomeTransactions)
      .set(updates)
      .where(eq(incomeTransactions.id, id))
      .returning();
    return updated;
  }

  async getIncomeReports(filters?: {
    beneficiaryId?: string;
    propertyId?: string;
    category?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    groupBy?: 'beneficiary' | 'property' | 'category' | 'status';
  }): Promise<Array<{
    groupKey: string;
    totalAmount: string;
    count: number;
    avgAmount: string;
  }>> {
    const conditions = [];
    
    if (filters?.beneficiaryId) {
      conditions.push(eq(incomeTransactions.beneficiaryId, filters.beneficiaryId));
    }
    if (filters?.propertyId) {
      conditions.push(eq(incomeTransactions.propertyId, filters.propertyId));
    }
    if (filters?.category) {
      conditions.push(eq(incomeTransactions.category, filters.category as any));
    }
    if (filters?.status) {
      conditions.push(eq(incomeTransactions.status, filters.status as any));
    }
    if (filters?.fromDate) {
      conditions.push(gte(incomeTransactions.createdAt, filters.fromDate));
    }
    if (filters?.toDate) {
      conditions.push(lte(incomeTransactions.createdAt, filters.toDate));
    }

    const groupByField = filters?.groupBy || 'beneficiary';
    let groupColumn;
    
    switch (groupByField) {
      case 'beneficiary':
        groupColumn = incomeTransactions.beneficiaryId;
        break;
      case 'property':
        groupColumn = incomeTransactions.propertyId;
        break;
      case 'category':
        groupColumn = incomeTransactions.category;
        break;
      case 'status':
        groupColumn = incomeTransactions.status;
        break;
      default:
        groupColumn = incomeTransactions.beneficiaryId;
    }

    let query = db
      .select({
        groupKey: groupColumn,
        totalAmount: sql<string>`SUM(${incomeTransactions.amount})`,
        count: sql<number>`COUNT(*)`,
        avgAmount: sql<string>`AVG(${incomeTransactions.amount})`,
      })
      .from(incomeTransactions)
      .groupBy(groupColumn);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map(r => ({
      groupKey: r.groupKey || 'unknown',
      totalAmount: r.totalAmount || '0',
      count: Number(r.count) || 0,
      avgAmount: r.avgAmount || '0',
    }));
  }

  // Changelog operations
  async getChangelog(id: string): Promise<Changelog | undefined> {
    const [changelog] = await db.select().from(changelogs).where(eq(changelogs.id, id));
    return changelog;
  }

  async getAllChangelogs(): Promise<Changelog[]> {
    return await db.select().from(changelogs).orderBy(desc(changelogs.createdAt));
  }

  async createChangelog(changelogData: InsertChangelog): Promise<Changelog> {
    const [changelog] = await db.insert(changelogs).values(changelogData).returning();
    return changelog;
  }

  async updateChangelog(id: string, updates: Partial<InsertChangelog>): Promise<Changelog> {
    const [changelog] = await db
      .update(changelogs)
      .set(updates)
      .where(eq(changelogs.id, id))
      .returning();
    return changelog;
  }

  async deleteChangelog(id: string): Promise<void> {
    await db.delete(changelogs).where(eq(changelogs.id, id));
  }

  // SLA Configuration operations
  async getSlaConfiguration(id: string): Promise<SlaConfiguration | undefined> {
    const [config] = await db.select().from(slaConfigurations).where(eq(slaConfigurations.id, id));
    return config;
  }

  async getSlaConfigurations(filters?: { isActive?: boolean }): Promise<SlaConfiguration[]> {
    let query = db.select().from(slaConfigurations);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(slaConfigurations.isActive, filters.isActive)) as any;
    }
    
    return await query.orderBy(desc(slaConfigurations.createdAt));
  }

  async getSlaConfigurationByProcess(processName: string): Promise<SlaConfiguration | undefined> {
    const [config] = await db.select().from(slaConfigurations)
      .where(and(
        eq(slaConfigurations.processName, processName),
        eq(slaConfigurations.isActive, true)
      ));
    return config;
  }

  async createSlaConfiguration(configData: InsertSlaConfiguration): Promise<SlaConfiguration> {
    const [config] = await db.insert(slaConfigurations).values(configData).returning();
    return config;
  }

  async updateSlaConfiguration(id: string, updates: Partial<InsertSlaConfiguration>): Promise<SlaConfiguration> {
    const [config] = await db
      .update(slaConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(slaConfigurations.id, id))
      .returning();
    return config;
  }

  async deleteSlaConfiguration(id: string): Promise<void> {
    await db.delete(slaConfigurations).where(eq(slaConfigurations.id, id));
  }

  // Lead Scoring operations
  async getLeadScoringRule(id: string): Promise<LeadScoringRule | undefined> {
    const [rule] = await db.select().from(leadScoringRules).where(eq(leadScoringRules.id, id));
    return rule;
  }

  async getLeadScoringRules(filters?: { isActive?: boolean }): Promise<LeadScoringRule[]> {
    let query = db.select().from(leadScoringRules);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(leadScoringRules.isActive, filters.isActive)) as any;
    }
    
    return await query.orderBy(leadScoringRules.priority, desc(leadScoringRules.createdAt));
  }

  async createLeadScoringRule(ruleData: InsertLeadScoringRule): Promise<LeadScoringRule> {
    const [rule] = await db.insert(leadScoringRules).values(ruleData).returning();
    return rule;
  }

  async updateLeadScoringRule(id: string, updates: Partial<InsertLeadScoringRule>): Promise<LeadScoringRule> {
    const [rule] = await db
      .update(leadScoringRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leadScoringRules.id, id))
      .returning();
    return rule;
  }

  async deleteLeadScoringRule(id: string): Promise<void> {
    await db.delete(leadScoringRules).where(eq(leadScoringRules.id, id));
  }

  async getLeadScore(leadId: string): Promise<LeadScore | undefined> {
    const [score] = await db.select().from(leadScores).where(eq(leadScores.leadId, leadId));
    return score;
  }

  async createLeadScore(scoreData: InsertLeadScore): Promise<LeadScore> {
    const [score] = await db.insert(leadScores).values(scoreData).returning();
    return score;
  }

  async updateLeadScore(leadId: string, updates: Partial<InsertLeadScore>): Promise<LeadScore> {
    const [score] = await db
      .update(leadScores)
      .set({ ...updates, lastCalculatedAt: new Date() })
      .where(eq(leadScores.leadId, leadId))
      .returning();
    return score;
  }

  async calculateLeadScore(leadId: string): Promise<LeadScore> {
    // Get the lead
    const lead = await this.getLead(leadId);
    if (!lead) throw new Error("Lead not found");

    // Get active scoring rules
    const rules = await this.getLeadScoringRules({ isActive: true });

    let totalScore = 0;
    const reasons: string[] = [];

    // Apply each rule
    for (const rule of rules) {
      let applies = false;

      // Simple rule evaluation logic (can be extended)
      const leadValue = (lead as any)[rule.criteriaField];
      
      switch (rule.criteriaOperator) {
        case "greater_than":
          applies = Number(leadValue) > Number(rule.criteriaValue);
          break;
        case "equals":
          applies = leadValue === rule.criteriaValue;
          break;
        case "contains":
          applies = String(leadValue).includes(rule.criteriaValue);
          break;
      }

      if (applies) {
        totalScore += rule.scorePoints;
        reasons.push(`${rule.name}: +${rule.scorePoints}`);
      }
    }

    // Determine quality based on score
    let quality: "hot" | "warm" | "cold" = "cold";
    if (totalScore >= 70) quality = "hot";
    else if (totalScore >= 40) quality = "warm";

    // Update or create score
    const existingScore = await this.getLeadScore(leadId);
    
    if (existingScore) {
      return await this.updateLeadScore(leadId, {
        score: totalScore,
        quality,
        reasons,
      });
    } else {
      return await this.createLeadScore({
        leadId,
        score: totalScore,
        quality,
        reasons,
      });
    }
  }

  // Contract Checklist operations
  async getContractChecklistTemplate(id: string): Promise<ContractChecklistTemplate | undefined> {
    const [template] = await db.select().from(contractChecklistTemplates).where(eq(contractChecklistTemplates.id, id));
    return template;
  }

  async getContractChecklistTemplates(filters?: { contractType?: string; isActive?: boolean }): Promise<ContractChecklistTemplate[]> {
    const conditions = [];
    
    if (filters?.contractType) {
      conditions.push(eq(contractChecklistTemplates.contractType, filters.contractType));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(contractChecklistTemplates.isActive, filters.isActive));
    }
    
    let query = db.select().from(contractChecklistTemplates);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(contractChecklistTemplates.isDefault), desc(contractChecklistTemplates.createdAt));
  }

  async createContractChecklistTemplate(templateData: InsertContractChecklistTemplate): Promise<ContractChecklistTemplate> {
    const [template] = await db.insert(contractChecklistTemplates).values(templateData).returning();
    return template;
  }

  async updateContractChecklistTemplate(id: string, updates: Partial<InsertContractChecklistTemplate>): Promise<ContractChecklistTemplate> {
    const [template] = await db
      .update(contractChecklistTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractChecklistTemplates.id, id))
      .returning();
    return template;
  }

  async deleteContractChecklistTemplate(id: string): Promise<void> {
    await db.delete(contractChecklistTemplates).where(eq(contractChecklistTemplates.id, id));
  }

  async getContractChecklistTemplateItems(templateId: string): Promise<ContractChecklistTemplateItem[]> {
    return await db.select().from(contractChecklistTemplateItems)
      .where(eq(contractChecklistTemplateItems.templateId, templateId))
      .orderBy(contractChecklistTemplateItems.order);
  }

  async createContractChecklistTemplateItem(itemData: InsertContractChecklistTemplateItem): Promise<ContractChecklistTemplateItem> {
    const [item] = await db.insert(contractChecklistTemplateItems).values(itemData).returning();
    return item;
  }

  async updateContractChecklistTemplateItem(id: string, updates: Partial<InsertContractChecklistTemplateItem>): Promise<ContractChecklistTemplateItem> {
    const [item] = await db
      .update(contractChecklistTemplateItems)
      .set(updates)
      .where(eq(contractChecklistTemplateItems.id, id))
      .returning();
    return item;
  }

  async deleteContractChecklistTemplateItem(id: string): Promise<void> {
    await db.delete(contractChecklistTemplateItems).where(eq(contractChecklistTemplateItems.id, id));
  }

  async getContractChecklistItems(contractId: string): Promise<ContractChecklistItem[]> {
    return await db.select().from(contractChecklistItems)
      .where(eq(contractChecklistItems.contractId, contractId))
      .orderBy(contractChecklistItems.order);
  }

  async createContractChecklistItem(itemData: InsertContractChecklistItem): Promise<ContractChecklistItem> {
    const [item] = await db.insert(contractChecklistItems).values(itemData).returning();
    return item;
  }

  async updateContractChecklistItem(id: string, updates: Partial<InsertContractChecklistItem>): Promise<ContractChecklistItem> {
    const [item] = await db
      .update(contractChecklistItems)
      .set(updates)
      .where(eq(contractChecklistItems.id, id))
      .returning();
    return item;
  }

  async completeContractChecklistItem(id: string, completedBy: string, notes?: string): Promise<ContractChecklistItem> {
    const [item] = await db
      .update(contractChecklistItems)
      .set({
        isCompleted: true,
        completedBy,
        completedAt: new Date(),
        notes,
      })
      .where(eq(contractChecklistItems.id, id))
      .returning();
    return item;
  }

  async getContractChecklistItem(id: string): Promise<ContractChecklistItem | undefined> {
    const [item] = await db.select().from(contractChecklistItems).where(eq(contractChecklistItems.id, id));
    return item;
  }

  async deleteContractChecklistItem(id: string): Promise<void> {
    await db.delete(contractChecklistItems).where(eq(contractChecklistItems.id, id));
  }

  async initializeContractChecklist(contractId: string, templateId: string): Promise<ContractChecklistItem[]> {
    const templateItems = await this.getContractChecklistTemplateItems(templateId);
    
    const items = await Promise.all(
      templateItems.map(item =>
        this.createContractChecklistItem({
          contractId,
          templateItemId: item.id,
          title: item.title,
          description: item.description,
          requiredRole: item.requiredRole,
          order: item.order,
        })
      )
    );
    
    return items;
  }

  // Rental Health Score operations
  async getRentalHealthScore(contractId: string): Promise<RentalHealthScore | undefined> {
    const [score] = await db.select().from(rentalHealthScores).where(eq(rentalHealthScores.contractId, contractId));
    return score;
  }

  async createRentalHealthScore(scoreData: InsertRentalHealthScore): Promise<RentalHealthScore> {
    const [score] = await db.insert(rentalHealthScores).values(scoreData).returning();
    return score;
  }

  async updateRentalHealthScore(contractId: string, updates: Partial<InsertRentalHealthScore>): Promise<RentalHealthScore> {
    const [score] = await db
      .update(rentalHealthScores)
      .set({ ...updates, lastCalculatedAt: new Date(), updatedAt: new Date() })
      .where(eq(rentalHealthScores.contractId, contractId))
      .returning();
    return score;
  }

  async calculateRentalHealthScore(contractId: string): Promise<RentalHealthScore> {
    // Get the contract
    const contract = await this.getRentalContract(contractId);
    if (!contract) throw new Error("Contract not found");

    // Initialize scores
    let paymentScore = 100;
    let incidentScore = 100;
    let communicationScore = 100;

    // Check for payment delays (would need payment history tracking)
    const hasPaymentDelay = false; // TODO: Implement payment history check

    // Check for open incidents (chats with type="rental" and open issues)
    const conversations = await db.select().from(chatConversations)
      .where(eq(chatConversations.propertyId, contract.propertyId));
    const hasOpenIncidents = conversations.length > 5; // Simplified logic

    // Check if near expiry (< 90 days)
    const daysUntilExpiry = contract.endDate 
      ? Math.floor((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    const isNearExpiry = daysUntilExpiry < 90;

    // Calculate overall score
    const overallScore = Math.floor((paymentScore + incidentScore + communicationScore) / 3);

    // Determine status
    let status: "excellent" | "good" | "fair" | "poor" | "critical" = "excellent";
    if (overallScore < 30) status = "critical";
    else if (overallScore < 50) status = "poor";
    else if (overallScore < 70) status = "fair";
    else if (overallScore < 90) status = "good";

    // Calculate renewal probability
    const renewalProbability = String(Math.max(0, overallScore - (isNearExpiry ? 0 : 20)));

    const reasons: string[] = [];
    if (hasPaymentDelay) reasons.push("Payment delays detected");
    if (hasOpenIncidents) reasons.push("Multiple open incidents");
    if (isNearExpiry) reasons.push("Contract expiring soon");
    if (overallScore >= 90) reasons.push("Excellent track record");

    // Update or create score
    const existingScore = await this.getRentalHealthScore(contractId);
    
    if (existingScore) {
      return await this.updateRentalHealthScore(contractId, {
        score: overallScore,
        status,
        paymentScore,
        incidentScore,
        communicationScore,
        hasPaymentDelay,
        hasOpenIncidents,
        isNearExpiry,
        renewalProbability,
        reasons,
      });
    } else {
      return await this.createRentalHealthScore({
        contractId,
        score: overallScore,
        status,
        paymentScore,
        incidentScore,
        communicationScore,
        hasPaymentDelay,
        hasOpenIncidents,
        isNearExpiry,
        renewalProbability,
        reasons,
      });
    }
  }

  async getRentalHealthScoresByStatus(status: string): Promise<RentalHealthScore[]> {
    return await db.select().from(rentalHealthScores)
      .where(eq(rentalHealthScores.status, status as any))
      .orderBy(rentalHealthScores.score);
  }

  // Performance Metrics operations
  async getLeadResponseMetric(leadId: string): Promise<LeadResponseMetric | undefined> {
    const [metric] = await db.select().from(leadResponseMetrics).where(eq(leadResponseMetrics.leadId, leadId));
    return metric;
  }

  async createLeadResponseMetric(metricData: InsertLeadResponseMetric): Promise<LeadResponseMetric> {
    const [metric] = await db.insert(leadResponseMetrics).values(metricData).returning();
    return metric;
  }

  async getContractCycleMetric(contractId: string): Promise<ContractCycleMetric | undefined> {
    const [metric] = await db.select().from(contractCycleMetrics).where(eq(contractCycleMetrics.contractId, contractId));
    return metric;
  }

  async createContractCycleMetric(metricData: InsertContractCycleMetric): Promise<ContractCycleMetric> {
    const [metric] = await db.insert(contractCycleMetrics).values(metricData).returning();
    return metric;
  }

  async updateContractCycleMetric(contractId: string, updates: Partial<InsertContractCycleMetric>): Promise<ContractCycleMetric> {
    const [metric] = await db
      .update(contractCycleMetrics)
      .set(updates)
      .where(eq(contractCycleMetrics.contractId, contractId))
      .returning();
    return metric;
  }

  // Workflow Event operations
  async createWorkflowEvent(eventData: InsertWorkflowEvent): Promise<WorkflowEvent> {
    const [event] = await db.insert(workflowEvents).values(eventData).returning();
    return event;
  }

  async getWorkflowEvents(filters?: { eventType?: string; entityType?: string; entityId?: string }): Promise<WorkflowEvent[]> {
    const conditions = [];
    
    if (filters?.eventType) {
      conditions.push(eq(workflowEvents.eventType, filters.eventType as any));
    }
    if (filters?.entityType) {
      conditions.push(eq(workflowEvents.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(workflowEvents.entityId, filters.entityId));
    }
    
    let query = db.select().from(workflowEvents);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(workflowEvents.createdAt));
  }

  // System Alert operations
  async getSystemAlert(id: string): Promise<SystemAlert | undefined> {
    const [alert] = await db.select().from(systemAlerts).where(eq(systemAlerts.id, id));
    return alert;
  }

  async getSystemAlerts(filters?: { 
    userId?: string; 
    status?: string; 
    priority?: string; 
    alertType?: string 
  }): Promise<SystemAlert[]> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(systemAlerts.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(systemAlerts.status, filters.status as any));
    }
    if (filters?.priority) {
      conditions.push(eq(systemAlerts.priority, filters.priority as any));
    }
    if (filters?.alertType) {
      conditions.push(eq(systemAlerts.alertType, filters.alertType));
    }
    
    let query = db.select().from(systemAlerts);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(systemAlerts.createdAt));
  }

  async getUserPendingAlerts(userId: string): Promise<SystemAlert[]> {
    return await db.select().from(systemAlerts)
      .where(and(
        eq(systemAlerts.userId, userId),
        eq(systemAlerts.status, "pending")
      ))
      .orderBy(systemAlerts.priority, desc(systemAlerts.createdAt));
  }

  async createSystemAlert(alertData: InsertSystemAlert): Promise<SystemAlert> {
    const [alert] = await db.insert(systemAlerts).values(alertData).returning();
    return alert;
  }

  async updateSystemAlert(id: string, updates: Partial<InsertSystemAlert>): Promise<SystemAlert> {
    const [alert] = await db
      .update(systemAlerts)
      .set(updates)
      .where(eq(systemAlerts.id, id))
      .returning();
    return alert;
  }

  async acknowledgeSystemAlert(id: string): Promise<SystemAlert> {
    const [alert] = await db
      .update(systemAlerts)
      .set({
        status: "acknowledged",
        acknowledgedAt: new Date(),
      })
      .where(eq(systemAlerts.id, id))
      .returning();
    return alert;
  }

  async resolveSystemAlert(id: string): Promise<SystemAlert> {
    const [alert] = await db
      .update(systemAlerts)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
      })
      .where(eq(systemAlerts.id, id))
      .returning();
    return alert;
  }

  async dismissSystemAlert(id: string): Promise<SystemAlert> {
    const [alert] = await db
      .update(systemAlerts)
      .set({
        status: "dismissed",
        dismissedAt: new Date(),
      })
      .where(eq(systemAlerts.id, id))
      .returning();
    return alert;
  }

  async deleteSystemAlert(id: string): Promise<void> {
    await db.delete(systemAlerts).where(eq(systemAlerts.id, id));
  }

  async cleanupExpiredAlerts(): Promise<number> {
    const result = await db
      .delete(systemAlerts)
      .where(and(
        eq(systemAlerts.status, "pending"),
        lte(systemAlerts.expiresAt, new Date())
      ))
      .returning({ id: systemAlerts.id });
    
    return result.length;
  }

  async getPropertyRecommendation(id: string): Promise<PropertyRecommendation | undefined> {
    const [recommendation] = await db.select().from(propertyRecommendations).where(eq(propertyRecommendations.id, id));
    return recommendation;
  }

  async getAutoSuggestion(id: string): Promise<AutoSuggestion | undefined> {
    const [suggestion] = await db.select().from(autoSuggestions).where(eq(autoSuggestions.id, id));
    return suggestion;
  }
}

export const storage = new DatabaseStorage();
