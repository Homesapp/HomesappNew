import {
  users,
  properties,
  propertyDocuments,
  colonies,
  condominiums,
  amenities,
  propertyFeatures,
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
  propertyNotes,
  budgets,
  tasks,
  workReports,
  auditLogs,
  adminUsers,
  emailVerificationTokens,
  roleRequests,
  favorites,
  leads,
  leadHistory,
  leadPropertyOffers,
  systemConfig,
  rentalApplications,
  rentalContracts,
  rentalPayments,
  tenantMaintenanceRequests,
  propertyChangeRequests,
  propertyLimitRequests,
  inspectionReports,
  ownerSettings,
  notifications,
  chatConversations,
  chatParticipants,
  chatMessages,
  chatbotConfig,
  agreementTemplates,
  propertySubmissionDrafts,
  propertySubmissionTokens,
  propertyAgreements,
  serviceBookings,
  providerApplications,
  referralConfig,
  clientReferrals,
  ownerReferrals,
  feedback,
  rentalCommissionConfigs,
  rentalOpportunityRequests,
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
  errorLogs,
  contractTenantInfo,
  contractOwnerInfo,
  contractLegalDocuments,
  contractTermDiscussions,
  contractApprovals,
  checkInAppointments,
  contractSignedDocuments,
  type User,
  type Colony,
  type InsertColony,
  type Condominium,
  type InsertCondominium,
  type Amenity,
  type InsertAmenity,
  type PropertyFeature,
  type InsertPropertyFeature,
  type UpsertUser,
  type InsertUser,
  type Property,
  type InsertProperty,
  type PropertyDocument,
  type InsertPropertyDocument,
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
  type PropertyNote,
  type InsertPropertyNote,
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
  type LeadHistory,
  type InsertLeadHistory,
  type LeadPropertyOffer,
  type InsertLeadPropertyOffer,
  type SystemConfig,
  type InsertSystemConfig,
  type RentalApplication,
  type InsertRentalApplication,
  type RentalContract,
  type InsertRentalContract,
  type RentalPayment,
  type InsertRentalPayment,
  type TenantMaintenanceRequest,
  type InsertTenantMaintenanceRequest,
  type PropertyChangeRequest,
  type InsertPropertyChangeRequest,
  type PropertyLimitRequest,
  type InsertPropertyLimitRequest,
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
  type PropertySubmissionToken,
  type InsertPropertySubmissionToken,
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
  type RentalOpportunityRequest,
  type InsertRentalOpportunityRequest,
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
  type ErrorLog,
  type InsertErrorLog,
  type ContractTenantInfo,
  type InsertContractTenantInfo,
  type ContractOwnerInfo,
  type InsertContractOwnerInfo,
  type ContractLegalDocument,
  type InsertContractLegalDocument,
  type ContractTermDiscussion,
  type InsertContractTermDiscussion,
  type ContractApproval,
  type InsertContractApproval,
  type CheckInAppointment,
  type InsertCheckInAppointment,
  type ContractSignedDocument,
  type InsertContractSignedDocument,
  passwordResetTokens,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  commissionAdvances,
  type CommissionAdvance,
  type InsertCommissionAdvance,
  serviceFavorites,
  type ServiceFavorite,
  type InsertServiceFavorite,
  predictiveAnalytics,
  type PredictiveAnalytic,
  type InsertPredictiveAnalytic,
  marketingCampaigns,
  type MarketingCampaign,
  type InsertMarketingCampaign,
  maintenanceSchedules,
  type MaintenanceSchedule,
  type InsertMaintenanceSchedule,
  legalDocuments,
  type LegalDocument,
  type InsertLegalDocument,
  tenantScreenings,
  type TenantScreening,
  type InsertTenantScreening,
  propertyDeliveryInventories,
  type PropertyDeliveryInventory,
  type InsertPropertyDeliveryInventory,
  tenantMoveInForms,
  type TenantMoveInForm,
  type InsertTenantMoveInForm,
  condominiumUnits,
  type CondominiumUnit,
  type InsertCondominiumUnit,
  condominiumFees,
  type CondominiumFee,
  type InsertCondominiumFee,
  condominiumFeePayments,
  type CondominiumFeePayment,
  type InsertCondominiumFeePayment,
  condominiumIssues,
  type CondominiumIssue,
  type InsertCondominiumIssue,
  hoaManagerAssignments,
  type HoaManagerAssignment,
  type InsertHoaManagerAssignment,
  hoaAnnouncements,
  type HoaAnnouncement,
  type InsertHoaAnnouncement,
  hoaAnnouncementReads,
  type HoaAnnouncementRead,
  type InsertHoaAnnouncementRead,
  sidebarMenuVisibility,
  type SidebarMenuVisibility,
  type InsertSidebarMenuVisibility,
  sidebarMenuVisibilityUser,
  type SidebarMenuVisibilityUser,
  type InsertSidebarMenuVisibilityUser,
  systemSettings,
  type SystemSetting,
  type InsertSystemSetting,
  propertyOwnerTerms,
  type PropertyOwnerTerms,
  type InsertPropertyOwnerTerms,
  externalAgencies,
  type ExternalAgency,
  type InsertExternalAgency,
  externalProperties,
  type ExternalProperty,
  type InsertExternalProperty,
  externalRentalContracts,
  type ExternalRentalContract,
  type InsertExternalRentalContract,
  externalRentalNotes,
  type ExternalRentalNote,
  type InsertExternalRentalNote,
  type UpdateExternalRentalNote,
  externalPaymentSchedules,
  type ExternalPaymentSchedule,
  type InsertExternalPaymentSchedule,
  externalPayments,
  type ExternalPayment,
  type InsertExternalPayment,
  externalMaintenanceTickets,
  type ExternalMaintenanceTicket,
  type InsertExternalMaintenanceTicket,
  externalMaintenanceUpdates,
  type ExternalMaintenanceUpdate,
  type InsertExternalMaintenanceUpdate,
  externalMaintenancePhotos,
  type ExternalMaintenancePhoto,
  type InsertExternalMaintenancePhoto,
  externalCondominiums,
  type ExternalCondominium,
  type InsertExternalCondominium,
  externalUnits,
  type ExternalUnit,
  type ExternalUnitWithCondominium,
  type InsertExternalUnit,
  externalUnitOwners,
  type ExternalUnitOwner,
  type InsertExternalUnitOwner,
  externalUnitAccessControls,
  type ExternalUnitAccessControl,
  type InsertExternalUnitAccessControl,
  externalCheckoutReports,
  type ExternalCheckoutReport,
  type InsertExternalCheckoutReport,
  externalClients,
  type ExternalClient,
  type InsertExternalClient,
  externalClientDocuments,
  type ExternalClientDocument,
  type InsertExternalClientDocument,
  externalClientIncidents,
  type ExternalClientIncident,
  type InsertExternalClientIncident,
  type UpdateExternalClientIncident,
  externalLeads,
  type ExternalLead,
  type InsertExternalLead,
  type UpdateExternalLead,
  externalLeadRegistrationTokens,
  type ExternalLeadRegistrationToken,
  type InsertExternalLeadRegistrationToken,
  externalLeadActivities,
  type ExternalLeadActivity,
  type InsertExternalLeadActivity,
  externalLeadStatusHistory,
  type ExternalLeadStatusHistory,
  type InsertExternalLeadStatusHistory,
  externalLeadShowings,
  type ExternalLeadShowing,
  type InsertExternalLeadShowing,
  type UpdateExternalLeadShowing,
  externalClientActivities,
  type ExternalClientActivity,
  type InsertExternalClientActivity,
  externalClientPropertyHistory,
  type ExternalClientPropertyHistory,
  type InsertExternalClientPropertyHistory,
  externalFinancialTransactions,
  type ExternalFinancialTransaction,
  type InsertExternalFinancialTransaction,
  externalTermsAndConditions,
  type ExternalTermsAndConditions,
  type InsertExternalTermsAndConditions,
  type UpdateExternalTermsAndConditions,
  externalQuotations,
  type ExternalQuotation,
  type InsertExternalQuotation,
  type UpdateExternalQuotation,
  externalQuotationTokens,
  type ExternalQuotationToken,
  type InsertExternalQuotationToken,
  offerTokens,
  tenantRentalFormTokens,
  externalRolePermissions,
  type ExternalRolePermission,
  type InsertExternalRolePermission,
  externalUserPermissions,
  type ExternalUserPermission,
  type InsertExternalUserPermission,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, ilike, asc, desc, sql, isNull, isNotNull, count, inArray, SQL, between } from "drizzle-orm";

// Custom error class for not-found scenarios
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(userData: InsertUser & { passwordHash: string }): Promise<User>;
  getUsersByStatus(status: string): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByAgency(agencyId: string): Promise<User[]>;
  updateUserStatus(id: string, status: string): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUserAdditionalRole(id: string, additionalRole: string | null): Promise<User>;
  verifyUserEmail(userId: string): Promise<User>;
  approveAllPendingUsers(): Promise<number>;
  updateUserProfile(id: string, updates: { firstName?: string; lastName?: string; bio?: string; profileImageUrl?: string; phone?: string; preferredLanguage?: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateUserPassword(id: string, passwordHash: string): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Password reset token operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  
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
  
  // Property Feature operations
  getPropertyFeature(id: string): Promise<PropertyFeature | undefined>;
  getPropertyFeatures(filters?: { active?: boolean }): Promise<PropertyFeature[]>;
  createPropertyFeature(feature: InsertPropertyFeature): Promise<PropertyFeature>;
  updatePropertyFeature(id: string, updates: Partial<InsertPropertyFeature>): Promise<PropertyFeature>;
  deletePropertyFeature(id: string): Promise<void>;
  
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
    published?: boolean;
    requestVirtualTour?: boolean;
    limit?: number;
  }): Promise<Property[]>;
  
  // Property staff operations
  assignStaff(assignment: InsertPropertyStaff): Promise<PropertyStaff>;
  getPropertyStaff(propertyId: string): Promise<PropertyStaff[]>;
  removeStaff(propertyId: string, staffId: string, role: string): Promise<void>;
  
  // Property Notes operations (Internal Annotations)
  getPropertyNote(id: string): Promise<PropertyNote | undefined>;
  getPropertyNotes(propertyId: string): Promise<any[]>;
  createPropertyNote(note: InsertPropertyNote): Promise<PropertyNote>;
  deletePropertyNote(id: string): Promise<void>;
  
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
  
  // Concierge Availability operations
  getActiveConciergues(): Promise<any[]>;
  getAvailableConcierguesForSlot(date: Date, durationMinutes?: number): Promise<any[]>;
  getAvailableSlotCount(date: Date, durationMinutes?: number): Promise<number>;
  assignConciergeToAppointment(appointmentId: string, conciergeId: string, assignedBy: string, accessInfo?: { accessType?: string; accessCode?: string; accessInstructions?: string }): Promise<Appointment>;
  
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
  getOffersByOwner(ownerId: string): Promise<Array<Offer & { property: Property; client: User }>>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: string, updates: Partial<InsertOffer>): Promise<Offer>;
  acceptOffer(offerId: string): Promise<{ offer: Offer; contract: RentalContract }>;
  rejectOffer(offerId: string, reason?: string): Promise<Offer>;
  createCounterOffer(offerId: string, counterOfferData: {
    counterOfferAmount?: string;
    counterOfferServicesIncluded?: any;
    counterOfferServicesExcluded?: any;
    counterOfferNotes?: string;
    offeredBy: 'client' | 'owner';
  }): Promise<Offer>;
  
  // Rental Opportunity Request operations
  getVisitedPropertiesByClient(clientId: string): Promise<Array<Property & { appointment: Appointment }>>;
  createRentalOpportunityRequest(request: InsertRentalOpportunityRequest): Promise<RentalOpportunityRequest>;
  getRentalOpportunityRequestsByClient(clientId: string): Promise<RentalOpportunityRequest[]>;
  getRentalOpportunityRequest(id: string): Promise<RentalOpportunityRequest | undefined>;
  getAllRentalOpportunityRequests(): Promise<RentalOpportunityRequest[]>;
  approveRentalOpportunityRequest(id: string, adminId: string): Promise<RentalOpportunityRequest>;
  rejectRentalOpportunityRequest(id: string, adminId: string, reason: string): Promise<RentalOpportunityRequest>;
  updateRentalOpportunityRequestStatus(id: string, status: string): Promise<RentalOpportunityRequest>;
  
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
  getAdminById(id: string): Promise<AdminUser | undefined>;
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
  getLeadsForSeller(sellerId: string, filters?: { status?: string; assignedToId?: string }): Promise<Lead[]>;
  getActiveLead(email: string): Promise<Lead | undefined>; // Get non-expired lead by email
  getActiveLeadByPhone(phone: string): Promise<Lead | undefined>; // Get non-expired lead by phone
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead>;
  updateLeadStatus(id: string, status: string): Promise<Lead>;
  verifyLeadEmail(leadId: string): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  
  // Lead History operations
  createLeadHistory(historyData: InsertLeadHistory): Promise<LeadHistory>;
  getLeadHistory(leadId: string): Promise<LeadHistory[]>;
  
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

  // Property Owner Terms operations
  getAllPropertyOwnerTerms(): Promise<PropertyOwnerTerms[]>;
  getActivePropertyOwnerTerms(language?: string): Promise<PropertyOwnerTerms[]>;
  getPropertyOwnerTerm(id: string): Promise<PropertyOwnerTerms | undefined>;
  createPropertyOwnerTerm(term: InsertPropertyOwnerTerms): Promise<PropertyOwnerTerms>;
  updatePropertyOwnerTerm(id: string, updates: Partial<InsertPropertyOwnerTerms>): Promise<PropertyOwnerTerms>;
  deletePropertyOwnerTerm(id: string): Promise<void>;
  
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
  getActiveRentalsByTenant(tenantId: string): Promise<RentalContract[]>;
  getActiveRentalsByOwner(ownerId: string): Promise<RentalContract[]>;
  getRentalPayments(rentalContractId: string): Promise<RentalPayment[]>;
  getRentalPayment(id: string): Promise<RentalPayment | undefined>;
  updateRentalPayment(id: string, updates: Partial<InsertRentalPayment>): Promise<RentalPayment>;
  approveRentalPayment(id: string, ownerId: string): Promise<RentalPayment>;
  getPendingPaymentsByOwner(ownerId: string): Promise<RentalPayment[]>;
  createTenantMaintenanceRequest(requestData: InsertTenantMaintenanceRequest): Promise<TenantMaintenanceRequest>;
  getTenantMaintenanceRequests(rentalContractId: string): Promise<TenantMaintenanceRequest[]>;
  
  // Property Delivery Inventory operations
  getPropertyDeliveryInventory(rentalContractId: string): Promise<PropertyDeliveryInventory | undefined>;
  createPropertyDeliveryInventory(inventory: InsertPropertyDeliveryInventory): Promise<PropertyDeliveryInventory>;
  updatePropertyDeliveryInventory(id: string, updates: Partial<InsertPropertyDeliveryInventory>): Promise<PropertyDeliveryInventory>;
  
  // Tenant Move-In Form operations
  getTenantMoveInForm(rentalContractId: string): Promise<TenantMoveInForm | undefined>;
  createTenantMoveInForm(form: InsertTenantMoveInForm): Promise<TenantMoveInForm>;
  updateTenantMoveInForm(id: string, updates: Partial<InsertTenantMoveInForm>): Promise<TenantMoveInForm>;

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
  markNotificationAsUnread(id: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // Chat operations
  getChatConversations(filters?: { type?: string; userId?: string }): Promise<ChatConversation[]>;
  getChatConversation(id: string): Promise<ChatConversation | undefined>;
  getChatConversationByAppointmentId(appointmentId: string): Promise<ChatConversation | undefined>;
  getChatConversationByRentalContractId(rentalContractId: string): Promise<ChatConversation | undefined>;
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
  
  // Property Submission Token operations (for inviting property owners without account)
  getPropertySubmissionToken(id: string): Promise<PropertySubmissionToken | undefined>;
  getPropertySubmissionTokenByToken(token: string): Promise<PropertySubmissionToken | undefined>;
  getPropertySubmissionTokens(filters?: { createdBy?: string; used?: boolean }): Promise<PropertySubmissionToken[]>;
  createPropertySubmissionToken(token: InsertPropertySubmissionToken): Promise<PropertySubmissionToken>;
  updatePropertySubmissionToken(id: string, updates: Partial<InsertPropertySubmissionToken>): Promise<PropertySubmissionToken>;
  markPropertySubmissionTokenAsUsed(id: string, propertyDraftId: string): Promise<PropertySubmissionToken>;
  deletePropertySubmissionToken(id: string): Promise<void>;
  
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

  // Error Log operations
  getErrorLog(id: string): Promise<ErrorLog | undefined>;
  getAllErrorLogs(filters?: { status?: string; errorType?: string; userId?: string }): Promise<ErrorLog[]>;
  createErrorLog(errorData: InsertErrorLog): Promise<ErrorLog>;
  updateErrorLog(id: string, updates: Partial<InsertErrorLog>): Promise<ErrorLog>;

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

  // Property Limit Request operations
  getPropertyLimitRequest(id: string): Promise<PropertyLimitRequest | undefined>;
  getPropertyLimitRequests(filters?: { ownerId?: string; status?: string }): Promise<PropertyLimitRequest[]>;
  getUserActivePropertyLimitRequest(ownerId: string): Promise<PropertyLimitRequest | undefined>;
  createPropertyLimitRequest(request: InsertPropertyLimitRequest): Promise<PropertyLimitRequest>;
  updatePropertyLimitRequestStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<PropertyLimitRequest>;
  getUserPropertyCount(ownerId: string): Promise<number>;

  // Commission Advance operations
  getCommissionAdvance(id: string): Promise<CommissionAdvance | undefined>;
  getCommissionAdvances(filters?: { sellerId?: string; status?: string }): Promise<CommissionAdvance[]>;
  createCommissionAdvance(advance: InsertCommissionAdvance): Promise<CommissionAdvance>;
  updateCommissionAdvanceStatus(id: string, status: string, approvedBy?: string, notes?: string): Promise<CommissionAdvance>;

  // Service Favorite operations
  addServiceFavorite(favorite: InsertServiceFavorite): Promise<ServiceFavorite>;
  removeServiceFavorite(userId: string, providerId: string): Promise<void>;
  getUserServiceFavorites(userId: string): Promise<ServiceFavorite[]>;
  isServiceFavorite(userId: string, providerId: string): Promise<boolean>;

  // Predictive Analytics operations
  getPredictiveAnalytic(id: string): Promise<PredictiveAnalytic | undefined>;
  getPredictiveAnalytics(filters?: { propertyId?: string; type?: string }): Promise<PredictiveAnalytic[]>;
  createPredictiveAnalytic(analytic: InsertPredictiveAnalytic): Promise<PredictiveAnalytic>;
  updatePredictiveAnalytic(id: string, updates: Partial<InsertPredictiveAnalytic>): Promise<PredictiveAnalytic>;
  deletePredictiveAnalytic(id: string): Promise<void>;

  // Marketing Campaign operations
  getMarketingCampaign(id: string): Promise<MarketingCampaign | undefined>;
  getMarketingCampaigns(filters?: { status?: string; type?: string; createdBy?: string }): Promise<MarketingCampaign[]>;
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  updateMarketingCampaign(id: string, updates: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign>;
  updateMarketingCampaignStatus(id: string, status: string): Promise<MarketingCampaign>;

  // Maintenance Schedule operations
  getMaintenanceSchedule(id: string): Promise<MaintenanceSchedule | undefined>;
  getMaintenanceSchedules(filters?: { propertyId?: string; active?: boolean }): Promise<MaintenanceSchedule[]>;
  createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule>;
  updateMaintenanceSchedule(id: string, updates: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule>;

  // Legal Document operations
  getLegalDocument(id: string): Promise<LegalDocument | undefined>;
  getLegalDocuments(filters?: { propertyId?: string; type?: string; status?: string }): Promise<LegalDocument[]>;
  createLegalDocument(document: InsertLegalDocument): Promise<LegalDocument>;
  updateLegalDocument(id: string, updates: Partial<InsertLegalDocument>): Promise<LegalDocument>;
  updateLegalDocumentStatus(id: string, status: string): Promise<LegalDocument>;

  // Tenant Screening operations
  getTenantScreening(id: string): Promise<TenantScreening | undefined>;
  getTenantScreenings(filters?: { applicationId?: string; applicantId?: string; propertyId?: string; status?: string }): Promise<TenantScreening[]>;
  createTenantScreening(screening: InsertTenantScreening): Promise<TenantScreening>;
  updateTenantScreening(id: string, updates: Partial<InsertTenantScreening>): Promise<TenantScreening>;
  updateTenantScreeningStatus(id: string, status: string, reviewedBy?: string, reviewNotes?: string): Promise<TenantScreening>;

  // Contract Legal Document operations
  getContractLegalDocument(id: string): Promise<ContractLegalDocument | undefined>;
  getContractLegalDocuments(rentalContractId: string): Promise<ContractLegalDocument[]>;
  createContractLegalDocument(document: InsertContractLegalDocument): Promise<ContractLegalDocument>;
  updateContractLegalDocument(id: string, updates: Partial<InsertContractLegalDocument>): Promise<ContractLegalDocument>;
  deleteContractLegalDocument(id: string): Promise<void>;

  // Contract Term Discussion operations
  getContractTermDiscussion(id: string): Promise<ContractTermDiscussion | undefined>;
  getContractTermDiscussions(legalDocumentId: string): Promise<ContractTermDiscussion[]>;
  createContractTermDiscussion(discussion: InsertContractTermDiscussion): Promise<ContractTermDiscussion>;
  updateContractTermDiscussion(id: string, updates: Partial<InsertContractTermDiscussion>): Promise<ContractTermDiscussion>;
  resolveContractTermDiscussion(id: string, resolvedById: string): Promise<ContractTermDiscussion>;

  // Contract Approval operations
  getContractApproval(id: string): Promise<ContractApproval | undefined>;
  getContractApprovals(legalDocumentId: string): Promise<ContractApproval[]>;
  createContractApproval(approval: InsertContractApproval): Promise<ContractApproval>;
  getUserContractApproval(legalDocumentId: string, userId: string): Promise<ContractApproval | undefined>;

  // Check-in Appointment operations
  getCheckInAppointment(id: string): Promise<CheckInAppointment | undefined>;
  getCheckInAppointments(filters?: { rentalContractId?: string; status?: string }): Promise<CheckInAppointment[]>;
  createCheckInAppointment(appointment: InsertCheckInAppointment): Promise<CheckInAppointment>;
  updateCheckInAppointment(id: string, updates: Partial<InsertCheckInAppointment>): Promise<CheckInAppointment>;
  completeCheckInAppointment(id: string): Promise<CheckInAppointment>;
  cancelCheckInAppointment(id: string, cancellationReason: string): Promise<CheckInAppointment>;

  // Contract Signed Document operations
  getContractSignedDocument(id: string): Promise<ContractSignedDocument | undefined>;
  getContractSignedDocuments(rentalContractId: string): Promise<ContractSignedDocument[]>;
  createContractSignedDocument(document: InsertContractSignedDocument): Promise<ContractSignedDocument>;
  deleteContractSignedDocument(id: string): Promise<void>;

  // HOA - Condominium Unit operations
  getCondominiumUnit(id: string): Promise<CondominiumUnit | undefined>;
  getCondominiumUnitsByCondominium(condominiumId: string): Promise<CondominiumUnit[]>;
  getCondominiumUnitsByOwner(ownerId: string): Promise<CondominiumUnit[]>;
  createCondominiumUnit(unit: InsertCondominiumUnit): Promise<CondominiumUnit>;
  updateCondominiumUnit(id: string, updates: Partial<InsertCondominiumUnit>): Promise<CondominiumUnit>;
  deleteCondominiumUnit(id: string): Promise<void>;

  // HOA - Condominium Fee operations
  getCondominiumFee(id: string): Promise<CondominiumFee | undefined>;
  getCondominiumFeesByUnit(unitId: string): Promise<CondominiumFee[]>;
  getCondominiumFeesByStatus(status: string): Promise<CondominiumFee[]>;
  createCondominiumFee(fee: InsertCondominiumFee): Promise<CondominiumFee>;
  updateCondominiumFee(id: string, updates: Partial<InsertCondominiumFee>): Promise<CondominiumFee>;
  updateCondominiumFeeStatus(id: string, status: string): Promise<CondominiumFee>;

  // HOA - Condominium Fee Payment operations
  getCondominiumFeePayment(id: string): Promise<CondominiumFeePayment | undefined>;
  getCondominiumFeePaymentsByFee(feeId: string): Promise<CondominiumFeePayment[]>;
  createCondominiumFeePayment(payment: InsertCondominiumFeePayment): Promise<CondominiumFeePayment>;

  // HOA - Condominium Issue operations
  getCondominiumIssue(id: string): Promise<CondominiumIssue | undefined>;
  getCondominiumIssuesByCondominium(condominiumId: string): Promise<CondominiumIssue[]>;
  getCondominiumIssuesByStatus(status: string): Promise<CondominiumIssue[]>;
  getCondominiumIssuesByReporter(reportedById: string): Promise<CondominiumIssue[]>;
  createCondominiumIssue(issue: InsertCondominiumIssue): Promise<CondominiumIssue>;
  updateCondominiumIssue(id: string, updates: Partial<InsertCondominiumIssue>): Promise<CondominiumIssue>;
  updateCondominiumIssueStatus(id: string, status: string): Promise<CondominiumIssue>;
  resolveCondominiumIssue(id: string, resolvedById: string, resolution: string): Promise<CondominiumIssue>;

  // HOA Manager - Assignment operations
  getHoaManagerAssignment(id: string): Promise<HoaManagerAssignment | undefined>;
  getHoaManagerAssignmentsByManager(managerId: string): Promise<HoaManagerAssignment[]>;
  getHoaManagerAssignmentsByCondominium(condominiumId: string): Promise<HoaManagerAssignment[]>;
  getHoaManagerAssignmentsByStatus(status: string): Promise<HoaManagerAssignment[]>;
  getApprovedHoaManagerByCondominium(condominiumId: string): Promise<HoaManagerAssignment | undefined>;
  createHoaManagerAssignment(assignment: InsertHoaManagerAssignment): Promise<HoaManagerAssignment>;
  updateHoaManagerAssignment(id: string, updates: Partial<InsertHoaManagerAssignment>): Promise<HoaManagerAssignment>;
  approveHoaManagerAssignment(id: string, approvedById: string, reason?: string): Promise<HoaManagerAssignment>;
  rejectHoaManagerAssignment(id: string, rejectedById: string, reason: string): Promise<HoaManagerAssignment>;
  suspendHoaManagerAssignment(id: string, suspendedById: string, reason: string): Promise<HoaManagerAssignment>;

  // HOA Manager - Announcement operations
  getHoaAnnouncement(id: string): Promise<HoaAnnouncement | undefined>;
  getHoaAnnouncementsByCondominium(condominiumId: string): Promise<HoaAnnouncement[]>;
  getHoaAnnouncementsByManager(managerId: string): Promise<HoaAnnouncement[]>;
  getActiveHoaAnnouncementsByCondominium(condominiumId: string): Promise<HoaAnnouncement[]>;
  getUnreadHoaAnnouncementsForOwner(ownerId: string): Promise<HoaAnnouncement[]>;
  createHoaAnnouncement(announcement: InsertHoaAnnouncement): Promise<HoaAnnouncement>;
  updateHoaAnnouncement(id: string, updates: Partial<InsertHoaAnnouncement>): Promise<HoaAnnouncement>;
  publishHoaAnnouncement(id: string): Promise<HoaAnnouncement>;
  deleteHoaAnnouncement(id: string): Promise<void>;

  // HOA Manager - Announcement Read operations
  markHoaAnnouncementAsRead(announcementId: string, ownerId: string): Promise<HoaAnnouncementRead>;
  getHoaAnnouncementReads(announcementId: string): Promise<HoaAnnouncementRead[]>;
  hasOwnerReadAnnouncement(announcementId: string, ownerId: string): Promise<boolean>;

  // Sidebar Menu Visibility operations (role-based)
  getSidebarMenuVisibility(role: string): Promise<SidebarMenuVisibility[]>;
  setSidebarMenuVisibility(visibility: InsertSidebarMenuVisibility): Promise<SidebarMenuVisibility>;
  bulkSetSidebarMenuVisibility(visibilities: InsertSidebarMenuVisibility[]): Promise<SidebarMenuVisibility[]>;
  resetSidebarMenuVisibility(role: string): Promise<void>;
  
  // Sidebar Menu Visibility operations (user-based)
  getSidebarMenuVisibilityByUser(userId: string): Promise<SidebarMenuVisibilityUser[]>;
  bulkSetSidebarMenuVisibilityUser(userId: string, visibilities: InsertSidebarMenuVisibilityUser[]): Promise<SidebarMenuVisibilityUser[]>;
  resetSidebarMenuVisibilityUser(userId: string): Promise<void>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // System Settings operations
  getSystemSetting(settingKey: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(settingKey: string, settingValue: string): Promise<SystemSetting>;

  // External Management System - Agency operations
  getExternalAgency(id: string): Promise<ExternalAgency | undefined>;
  getExternalAgencies(filters?: { isActive?: boolean }): Promise<ExternalAgency[]>;
  getExternalAgenciesByCreator(createdBy: string): Promise<ExternalAgency[]>;
  getExternalAgencyByUser(userId: string): Promise<ExternalAgency | undefined>;
  createExternalAgency(agency: InsertExternalAgency): Promise<ExternalAgency>;
  updateExternalAgency(id: string, updates: Partial<InsertExternalAgency>): Promise<ExternalAgency>;
  toggleExternalAgencyActive(id: string, isActive: boolean): Promise<ExternalAgency>;
  deleteExternalAgency(id: string): Promise<void>;

  // External Agency Integrations operations
  getExternalAgencyIntegration(agencyId: string): Promise<ExternalAgencyIntegration | undefined>;
  upsertExternalAgencyIntegration(agencyId: string, data: Partial<InsertExternalAgencyIntegration>): Promise<ExternalAgencyIntegration>;
  updateGoogleCalendarTokens(agencyId: string, tokens: {
    accessToken: string;
    refreshToken: string;
    expiry: Date;
    calendarId?: string;
  }): Promise<ExternalAgencyIntegration>;
  disconnectGoogleCalendar(agencyId: string): Promise<ExternalAgencyIntegration | undefined>;
  updateOpenAIConfig(agencyId: string, config: {
    apiKey?: string | null;
    useReplitIntegration?: boolean;
  }): Promise<ExternalAgencyIntegration>;

  // External Role Permissions operations
  getExternalRolePermissions(agencyId: string): Promise<ExternalRolePermission[]>;
  getExternalRolePermissionsByRole(agencyId: string, role: string): Promise<ExternalRolePermission[]>;
  upsertExternalRolePermission(permission: InsertExternalRolePermission): Promise<ExternalRolePermission>;
  bulkUpsertExternalRolePermissions(permissions: InsertExternalRolePermission[]): Promise<ExternalRolePermission[]>;
  deleteExternalRolePermission(agencyId: string, role: string, section: string, action: string): Promise<void>;
  deleteAllExternalRolePermissions(agencyId: string): Promise<void>;

  // External User Permissions operations (overrides)
  getExternalUserPermissions(agencyId: string): Promise<ExternalUserPermission[]>;
  getExternalUserPermissionsByUser(agencyId: string, userId: string): Promise<ExternalUserPermission[]>;
  upsertExternalUserPermission(permission: InsertExternalUserPermission): Promise<ExternalUserPermission>;
  bulkUpsertExternalUserPermissions(permissions: InsertExternalUserPermission[]): Promise<ExternalUserPermission[]>;
  deleteExternalUserPermission(agencyId: string, userId: string, section: string, action: string): Promise<void>;
  deleteAllExternalUserPermissions(agencyId: string, userId: string): Promise<void>;

  // External Management System - Property operations
  getExternalProperty(id: string): Promise<ExternalProperty | undefined>;
  getExternalPropertiesByAgency(agencyId: string, filters?: { status?: string }): Promise<ExternalProperty[]>;
  createExternalProperty(property: InsertExternalProperty): Promise<ExternalProperty>;
  updateExternalProperty(id: string, updates: Partial<InsertExternalProperty>): Promise<ExternalProperty>;
  linkExternalProperty(id: string, linkedPropertyId: string): Promise<ExternalProperty>;
  deleteExternalProperty(id: string): Promise<void>;

  // External Management System - Contract operations
  getExternalRentalContract(id: string): Promise<ExternalRentalContract | undefined>;
  getExternalRentalContractsByAgency(agencyId: string, filters?: { status?: string }): Promise<ExternalRentalContract[]>;
  getExternalRentalContractsByProperty(propertyId: string): Promise<ExternalRentalContract[]>;
  createExternalRentalContract(contract: InsertExternalRentalContract): Promise<ExternalRentalContract>;
  updateExternalRentalContract(id: string, updates: Partial<InsertExternalRentalContract>): Promise<ExternalRentalContract>;
  updateExternalContractStatus(id: string, status: string): Promise<ExternalRentalContract>;
  deleteExternalRentalContract(id: string): Promise<void>;

  // External Management System - Rental Notes operations
  getExternalRentalNote(id: string): Promise<ExternalRentalNote | undefined>;
  getExternalRentalNotesByContract(contractId: string, filters?: { isArchived?: boolean; noteType?: string }): Promise<ExternalRentalNote[]>;
  createExternalRentalNote(note: InsertExternalRentalNote): Promise<ExternalRentalNote>;
  updateExternalRentalNote(id: string, updates: UpdateExternalRentalNote): Promise<ExternalRentalNote>;
  getExternalMaintenanceTicketsByContract(contractId: string, filters?: { status?: string }): Promise<ExternalMaintenanceTicket[]>;

  // External Management System - Payment Schedule operations
  getExternalPaymentSchedule(id: string): Promise<ExternalPaymentSchedule | undefined>;
  getExternalPaymentSchedulesByContract(contractId: string): Promise<ExternalPaymentSchedule[]>;
  getExternalPaymentSchedulesByAgency(agencyId: string, filters?: { isActive?: boolean }): Promise<ExternalPaymentSchedule[]>;
  createExternalPaymentSchedule(schedule: InsertExternalPaymentSchedule): Promise<ExternalPaymentSchedule>;
  updateExternalPaymentSchedule(id: string, updates: Partial<InsertExternalPaymentSchedule>): Promise<ExternalPaymentSchedule>;
  toggleExternalPaymentScheduleActive(id: string, isActive: boolean): Promise<ExternalPaymentSchedule>;
  deleteExternalPaymentSchedule(id: string): Promise<void>;

  // External Management System - Payment operations
  getExternalPayment(id: string): Promise<ExternalPayment | undefined>;
  getExternalPaymentsByContract(contractId: string, filters?: { status?: string }): Promise<ExternalPayment[]>;
  getExternalPaymentsByAgency(agencyId: string, filters?: { status?: string; serviceType?: string }): Promise<ExternalPayment[]>;
  getUpcomingExternalPayments(agencyId: string, days: number): Promise<ExternalPayment[]>;
  createExternalPayment(payment: InsertExternalPayment): Promise<ExternalPayment>;
  updateExternalPayment(id: string, updates: Partial<InsertExternalPayment>): Promise<ExternalPayment>;
  updateExternalPaymentStatus(id: string, status: string, paidDate?: Date): Promise<ExternalPayment>;
  markExternalPaymentAsPaid(id: string, data: {
    paidBy: string;
    confirmedBy?: string;
    confirmedAt?: Date;
    paidDate: Date;
    paymentMethod?: string;
    paymentReference?: string;
    paymentProofUrl?: string;
    notes?: string;
  }): Promise<{ payment: ExternalPayment; transaction: ExternalFinancialTransaction }>;
  markExternalPaymentReminderSent(id: string): Promise<ExternalPayment>;
  deleteExternalPayment(id: string): Promise<void>;
  generateNextExternalPayment(paymentId: string, createdBy: string): Promise<ExternalPayment | null>;

  // External Management System - Maintenance Ticket operations
  getExternalMaintenanceTicket(id: string): Promise<ExternalMaintenanceTicket | undefined>;
  getExternalMaintenanceTicketsByAgency(agencyId: string, filters?: { status?: string; priority?: string; category?: string; search?: string }): Promise<ExternalMaintenanceTicket[]>;
  getExternalMaintenanceTicketsPaginated(agencyId: string, options: {
    limit: number;
    offset: number;
    search?: string;
    status?: string | string[];
    priority?: string;
    category?: string;
    condominiumId?: string;
    dateFilter?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: ExternalMaintenanceTicket[]; total: number }>;
  getExternalMaintenanceTicketsByProperty(propertyId: string): Promise<ExternalMaintenanceTicket[]>;
  getExternalMaintenanceTicketsByUnit(unitId: string): Promise<ExternalMaintenanceTicket[]>;
  getExternalMaintenanceTicketsByAssignee(assignedTo: string): Promise<ExternalMaintenanceTicket[]>;
  createExternalMaintenanceTicket(ticket: InsertExternalMaintenanceTicket): Promise<ExternalMaintenanceTicket>;
  updateExternalMaintenanceTicket(id: string, updates: Partial<InsertExternalMaintenanceTicket>): Promise<ExternalMaintenanceTicket>;
  updateExternalTicketStatus(id: string, status: string, resolvedDate?: Date): Promise<ExternalMaintenanceTicket>;
  assignExternalTicket(id: string, assignedTo: string): Promise<ExternalMaintenanceTicket>;
  deleteExternalMaintenanceTicket(id: string): Promise<void>;
  
  // External Maintenance Updates
  getExternalMaintenanceUpdates(ticketId: string): Promise<ExternalMaintenanceUpdate[]>;
  createExternalMaintenanceUpdate(update: InsertExternalMaintenanceUpdate): Promise<ExternalMaintenanceUpdate>;
  
  // External Maintenance Photos
  getExternalMaintenancePhotos(ticketId: string, filters?: { phase?: string; updateId?: string }): Promise<ExternalMaintenancePhoto[]>;
  getExternalMaintenancePhoto(id: string): Promise<ExternalMaintenancePhoto | undefined>;
  createExternalMaintenancePhoto(photo: InsertExternalMaintenancePhoto): Promise<ExternalMaintenancePhoto>;
  updateExternalMaintenancePhoto(id: string, updates: Partial<Pick<InsertExternalMaintenancePhoto, 'phase' | 'caption'>>): Promise<ExternalMaintenancePhoto>;
  deleteExternalMaintenancePhoto(id: string): Promise<void>;

  // External Management System - Condominium operations
  getExternalCondominium(id: string): Promise<ExternalCondominium | undefined>;
  getExternalCondominiumsByAgency(agencyId: string, filters?: { isActive?: boolean; search?: string; zone?: string; sortField?: string; sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number }): Promise<ExternalCondominium[]>;
  getExternalCondominiumsCountByAgency(agencyId: string, filters?: { isActive?: boolean; search?: string; zone?: string }): Promise<number>;
  getExternalDashboardSummary(agencyId: string): Promise<{
    totalCondominiums: number;
    totalUnits: number;
    activeRentals: number;
    rentalsEndingSoon: number;
    completedRentals: number;
    pendingPayments: number;
    overduePayments: number;
    paymentsNext7Days: number;
    openTickets: number;
    scheduledTicketsNext7Days: number;
    totalOwners: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    expectedMonthlyIncome: number;
    occupancyRate: number;
  }>;
  createExternalCondominium(condominium: InsertExternalCondominium): Promise<ExternalCondominium>;
  createCondominiumWithUnits(condominium: InsertExternalCondominium, units: any[], agencyId: string, userId: string): Promise<{ condominium: ExternalCondominium; units: ExternalUnit[] }>;
  addUnitsToCondominium(condominiumId: string, units: any[], agencyId: string, userId: string): Promise<ExternalUnit[]>;
  updateExternalCondominium(id: string, updates: Partial<InsertExternalCondominium>): Promise<ExternalCondominium>;
  deleteExternalCondominium(id: string): Promise<void>;

  // External Management System - Unit operations
  getExternalUnit(id: string): Promise<ExternalUnit | undefined>;
  getExternalUnitsByAgency(agencyId: string, filters?: { isActive?: boolean; condominiumId?: string; search?: string; zone?: string; typology?: string; sortField?: string; sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number }): Promise<ExternalUnitWithCondominium[]>;
  getExternalUnitsCountByAgency(agencyId: string, filters?: { isActive?: boolean; condominiumId?: string; search?: string; zone?: string; typology?: string }): Promise<number>;
  getExternalUnitsByCondominium(condominiumId: string): Promise<ExternalUnit[]>;
  createExternalUnit(unit: InsertExternalUnit): Promise<ExternalUnit>;
  updateExternalUnit(id: string, updates: Partial<InsertExternalUnit>): Promise<ExternalUnit>;
  deleteExternalUnit(id: string): Promise<void>;

  // External Management System - Unit Owner operations
  getExternalUnitOwner(id: string): Promise<ExternalUnitOwner | undefined>;
  getExternalUnitOwnersByUnit(unitId: string): Promise<ExternalUnitOwner[]>;
  getExternalOwnersByAgency(agencyId: string): Promise<any[]>;
  getActiveExternalUnitOwner(unitId: string): Promise<ExternalUnitOwner | undefined>;
  createExternalUnitOwner(owner: InsertExternalUnitOwner): Promise<ExternalUnitOwner>;
  updateExternalUnitOwner(id: string, updates: Partial<InsertExternalUnitOwner>): Promise<ExternalUnitOwner>;
  setActiveExternalUnitOwner(unitId: string, ownerId: string): Promise<ExternalUnitOwner>;
  deleteExternalUnitOwner(id: string): Promise<void>;

  // External Management System - Unit Access Control operations
  getExternalUnitAccessControl(id: string): Promise<ExternalUnitAccessControl | undefined>;
  getExternalUnitAccessControlsByUnit(unitId: string, filters?: { isActive?: boolean }): Promise<ExternalUnitAccessControl[]>;
  createExternalUnitAccessControl(control: InsertExternalUnitAccessControl): Promise<ExternalUnitAccessControl>;
  updateExternalUnitAccessControl(id: string, updates: Partial<InsertExternalUnitAccessControl>): Promise<ExternalUnitAccessControl>;
  deleteExternalUnitAccessControl(id: string): Promise<void>;

  // External Management System - Check-Out Report operations
  getExternalCheckoutReport(id: string): Promise<ExternalCheckoutReport | undefined>;
  getExternalCheckoutReportByContract(contractId: string): Promise<ExternalCheckoutReport | undefined>;
  getExternalCheckoutReportsByAgency(agencyId: string, filters?: { status?: string }): Promise<ExternalCheckoutReport[]>;
  createExternalCheckoutReport(report: InsertExternalCheckoutReport): Promise<ExternalCheckoutReport>;
  updateExternalCheckoutReport(id: string, updates: Partial<InsertExternalCheckoutReport>): Promise<ExternalCheckoutReport>;
  completeExternalCheckoutReport(id: string): Promise<ExternalCheckoutReport>;
  deleteExternalCheckoutReport(id: string): Promise<void>;

  // External Management System - Client operations
  getExternalClient(id: string): Promise<ExternalClient | undefined>;
  getExternalClientsByAgency(agencyId: string, filters?: { status?: string; isVerified?: boolean; search?: string; sortField?: string; sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number }): Promise<ExternalClient[]>;
  getExternalClientsCountByAgency(agencyId: string, filters?: { status?: string; isVerified?: boolean; search?: string }): Promise<number>;
  createExternalClient(client: InsertExternalClient): Promise<ExternalClient>;
  updateExternalClient(id: string, updates: Partial<InsertExternalClient>): Promise<ExternalClient>;
  deleteExternalClient(id: string): Promise<void>;

  // External Leads
  getExternalLead(id: string): Promise<ExternalLead | undefined>;
  getExternalLeadsByAgency(agencyId: string, filters?: { status?: string; registrationType?: string; sellerId?: string; expiringDays?: number; search?: string; sortField?: string; sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number }): Promise<ExternalLead[]>;
  getExternalLeadsCountByAgency(agencyId: string, filters?: { status?: string; registrationType?: string; sellerId?: string; expiringDays?: number; search?: string }): Promise<number>;
  createExternalLead(lead: InsertExternalLead): Promise<ExternalLead>;
  updateExternalLead(id: string, updates: Partial<InsertExternalLead>): Promise<ExternalLead>;
  deleteExternalLead(id: string): Promise<void>;
  convertLeadToClient(leadId: string, clientId: string): Promise<void>;
  checkExternalClientDuplicate(agencyId: string, firstName: string, lastName: string, phone?: string | null, excludeId?: string): Promise<ExternalClient | null>;
  checkExternalLeadDuplicate(agencyId: string, firstName: string, lastName: string, phoneOrLast4?: string | null, excludeId?: string): Promise<ExternalLead | null>;

  // External Lead Registration Tokens
  getExternalLeadRegistrationToken(token: string): Promise<ExternalLeadRegistrationToken | undefined>;
  getExternalLeadRegistrationTokensByAgency(agencyId: string): Promise<ExternalLeadRegistrationToken[]>;
  createExternalLeadRegistrationToken(tokenData: InsertExternalLeadRegistrationToken): Promise<ExternalLeadRegistrationToken>;
  completeExternalLeadRegistrationToken(tokenId: string, leadId: string): Promise<void>;
  deleteExternalLeadRegistrationToken(id: string): Promise<void>;

  // External Client Documents
  getExternalClientDocuments(clientId: string): Promise<ExternalClientDocument[]>;
  getExternalClientDocument(id: string): Promise<ExternalClientDocument | undefined>;
  createExternalClientDocument(document: InsertExternalClientDocument): Promise<ExternalClientDocument>;
  deleteExternalClientDocument(id: string): Promise<void>;

  // External Client Incidents
  getExternalClientIncidents(clientId: string, filters?: { severity?: string; status?: string }): Promise<ExternalClientIncident[]>;
  getExternalClientIncident(id: string): Promise<ExternalClientIncident | undefined>;
  createExternalClientIncident(incident: InsertExternalClientIncident): Promise<ExternalClientIncident>;
  updateExternalClientIncident(id: string, updates: UpdateExternalClientIncident): Promise<ExternalClientIncident>;
  deleteExternalClientIncident(id: string): Promise<void>;

  // CRM - Lead Activities
  getExternalLeadActivities(leadId: string): Promise<ExternalLeadActivity[]>;
  createExternalLeadActivity(activity: InsertExternalLeadActivity): Promise<ExternalLeadActivity>;
  
  // CRM - Lead Status History
  getExternalLeadStatusHistory(leadId: string): Promise<ExternalLeadStatusHistory[]>;
  createExternalLeadStatusHistory(history: InsertExternalLeadStatusHistory): Promise<ExternalLeadStatusHistory>;
  
  // CRM - Lead Showings
  getExternalLeadShowings(leadId: string): Promise<ExternalLeadShowing[]>;
  getExternalLeadShowing(id: string): Promise<ExternalLeadShowing | undefined>;
  getExternalLeadShowingsByAgency(agencyId: string, filters?: { status?: string; startDate?: Date; endDate?: Date }): Promise<ExternalLeadShowing[]>;
  createExternalLeadShowing(showing: InsertExternalLeadShowing): Promise<ExternalLeadShowing>;
  updateExternalLeadShowing(id: string, updates: UpdateExternalLeadShowing): Promise<ExternalLeadShowing>;
  deleteExternalLeadShowing(id: string): Promise<void>;
  
  // CRM - Client Activities
  getExternalClientActivities(clientId: string): Promise<ExternalClientActivity[]>;
  createExternalClientActivity(activity: InsertExternalClientActivity): Promise<ExternalClientActivity>;
  
  // CRM - Client Property History
  getExternalClientPropertyHistory(clientId: string): Promise<ExternalClientPropertyHistory[]>;
  createExternalClientPropertyHistory(history: InsertExternalClientPropertyHistory): Promise<ExternalClientPropertyHistory>;

  // External Management System - Offer Token operations
  getExternalOfferTokensByAgency(agencyId: string): Promise<any[]>;
  getExternalOfferTokenSummariesByAgency(agencyId: string): Promise<any[]>;

  // External Management System - Rental Form Token operations
  getExternalRentalFormTokensByAgency(agencyId: string): Promise<any[]>;
  getExternalRentalFormTokenSummariesByAgency(agencyId: string): Promise<any[]>;

  // External Management System - Financial Transaction operations
  getExternalFinancialTransaction(id: string): Promise<ExternalFinancialTransaction | undefined>;
  getExternalFinancialTransactionsByAgency(
    agencyId: string,
    filters?: {
      direction?: string;
      category?: string;
      status?: string;
      ownerId?: string;
      contractId?: string;
      unitId?: string;
      condominiumId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<ExternalFinancialTransaction[]>;
  getExternalFinancialTransactionsCountByAgency(
    agencyId: string,
    filters?: {
      direction?: string;
      category?: string;
      status?: string;
      ownerId?: string;
      contractId?: string;
      unitId?: string;
      condominiumId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ): Promise<number>;
  createExternalFinancialTransaction(transaction: InsertExternalFinancialTransaction): Promise<ExternalFinancialTransaction>;
  updateExternalFinancialTransaction(id: string, updates: Partial<InsertExternalFinancialTransaction>): Promise<ExternalFinancialTransaction>;
  deleteExternalFinancialTransaction(id: string): Promise<void>;
  getExternalAccountingSummary(agencyId: string): Promise<{
    totalInflow: number;
    totalOutflow: number;
    netBalance: number;
    pendingInflow: number;
    pendingOutflow: number;
    reconciledInflow: number;
    reconciledOutflow: number;
  }>;

  // External Management System - Terms and Conditions operations
  getExternalTermsAndConditions(agencyId: string, type?: 'tenant' | 'owner'): Promise<any[]>;
  getExternalTermsAndConditionsById(id: string): Promise<any | undefined>;
  getActiveExternalTermsAndConditions(agencyId: string, type: 'tenant' | 'owner'): Promise<any | undefined>;
  createExternalTermsAndConditions(terms: any): Promise<any>;
  updateExternalTermsAndConditions(id: string, updates: any): Promise<any>;
  publishExternalTermsAndConditions(id: string, publishedBy: string): Promise<any>;
  unpublishExternalTermsAndConditions(id: string): Promise<any>;
  deleteExternalTermsAndConditions(id: string): Promise<void>;

  // External Management System - Quotations operations
  getExternalQuotations(agencyId: string): Promise<ExternalQuotation[]>;
  getExternalQuotationById(id: string, agencyId: string): Promise<ExternalQuotation | undefined>;
  createExternalQuotation(quotation: InsertExternalQuotation): Promise<ExternalQuotation>;
  updateExternalQuotation(id: string, agencyId: string, updates: UpdateExternalQuotation): Promise<ExternalQuotation>;
  deleteExternalQuotation(id: string, agencyId: string): Promise<void>;
  updateExternalQuotationStatus(id: string, agencyId: string, status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'cancelled', timestamp?: Date): Promise<ExternalQuotation>;
  createExternalQuotationToken(tokenData: InsertExternalQuotationToken): Promise<ExternalQuotationToken>;
  getExternalQuotationByToken(token: string): Promise<{ quotation: ExternalQuotation; token: ExternalQuotationToken } | undefined>;
  incrementQuotationTokenAccess(tokenId: string): Promise<void>;
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
    // Prepare email: if null/empty, immediately use fallback
    const hasProvidedEmail = !!userData.email;
    const fallbackEmail = `user-${userData.id}@homesapp.internal`;
    let emailToUse = hasProvidedEmail ? userData.email : fallbackEmail;
    
    // Build update fields
    const updateFields: any = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      updatedAt: new Date(),
    };

    // Include role in update if provided (for development mode OIDC testing)
    if (userData.role) {
      updateFields.role = userData.role;
    }

    // Atomic upsert with retry logic for email conflicts
    const attemptUpsert = async (email: string, allowEmailUpdate: boolean): Promise<User> => {
      // Include email in update fields only when it's safe to update
      const fieldsToUpdate = { ...updateFields };
      if (allowEmailUpdate && hasProvidedEmail) {
        fieldsToUpdate.email = email;
      }
      
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          email: email,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: fieldsToUpdate,
        })
        .returning();
      return user;
    };

    try {
      // First attempt: use the provided email (or fallback if null)
      return await attemptUpsert(emailToUse!, true);
    } catch (error: any) {
      // Check if error is a unique constraint violation on email
      if (error?.code === '23505' && error?.constraint === 'users_email_unique') {
        // Email conflict detected - retry with fallback email
        // This handles the race condition where two concurrent inserts
        // attempt to use the same email for different user IDs
        return await attemptUpsert(fallbackEmail, false);
      }
      // Re-throw any other error
      throw error;
    }
  }

  async getUsersByStatus(status: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, status as any));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async getUsersByAgency(agencyId: string): Promise<User[]> {
    const result = await db.select()
      .from(users)
      .where(eq(users.externalAgencyId, agencyId))
      .orderBy(desc(users.createdAt));
    
    // Remove sensitive fields from response
    return result.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser as User;
    });
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

  async updateUserPassword(id: string, passwordHash: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Password reset token operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(tokenData).returning();
    return token;
  }

  async getPasswordResetToken(tokenString: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, tokenString));
    return token;
  }

  async markPasswordResetTokenAsUsed(tokenString: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, tokenString));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lte(passwordResetTokens.expiresAt, new Date()));
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

  async getAmenitiesByIds(ids: string[]): Promise<Amenity[]> {
    if (ids.length === 0) return [];
    return await db.select().from(amenities).where(inArray(amenities.id, ids));
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

  // Property Features
  async getPropertyFeature(id: string): Promise<PropertyFeature | undefined> {
    const [feature] = await db
      .select()
      .from(propertyFeatures)
      .where(eq(propertyFeatures.id, id));
    return feature;
  }

  async getPropertyFeatures(filters?: { active?: boolean }): Promise<PropertyFeature[]> {
    let query = db.select().from(propertyFeatures);
    
    if (filters?.active !== undefined) {
      query = query.where(eq(propertyFeatures.active, filters.active)) as any;
    }
    
    return await query.orderBy(propertyFeatures.name);
  }

  async createPropertyFeature(featureData: InsertPropertyFeature): Promise<PropertyFeature> {
    const [feature] = await db.insert(propertyFeatures).values(featureData).returning();
    return feature;
  }

  async updatePropertyFeature(id: string, updates: Partial<InsertPropertyFeature>): Promise<PropertyFeature> {
    const [feature] = await db
      .update(propertyFeatures)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(propertyFeatures.id, id))
      .returning();
    return feature;
  }

  async deletePropertyFeature(id: string): Promise<void> {
    await db.delete(propertyFeatures).where(eq(propertyFeatures.id, id));
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

  // Property Documents operations
  async getPropertyDocument(id: string): Promise<PropertyDocument | undefined> {
    const [document] = await db.select().from(propertyDocuments).where(eq(propertyDocuments.id, id));
    return document;
  }

  async getPropertyDocuments(propertyId: string, category?: string): Promise<PropertyDocument[]> {
    let query = db.select().from(propertyDocuments).where(eq(propertyDocuments.propertyId, propertyId));
    
    if (category) {
      query = query.where(and(
        eq(propertyDocuments.propertyId, propertyId),
        eq(propertyDocuments.category, category as any)
      )) as any;
    }
    
    return await query.orderBy(propertyDocuments.uploadedAt);
  }

  async createPropertyDocument(documentData: InsertPropertyDocument): Promise<PropertyDocument> {
    const [document] = await db.insert(propertyDocuments).values(documentData).returning();
    return document;
  }

  async updatePropertyDocument(id: string, updates: Partial<InsertPropertyDocument>): Promise<PropertyDocument> {
    const [document] = await db
      .update(propertyDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(propertyDocuments.id, id))
      .returning();
    return document;
  }

  async deletePropertyDocument(id: string): Promise<void> {
    await db.delete(propertyDocuments).where(eq(propertyDocuments.id, id));
  }

  async validatePropertyDocument(id: string, validatedBy: string, validationNotes?: string): Promise<PropertyDocument> {
    const [document] = await db
      .update(propertyDocuments)
      .set({
        isValidated: true,
        validatedAt: new Date(),
        validatedBy,
        validationNotes,
        updatedAt: new Date(),
      })
      .where(eq(propertyDocuments.id, id))
      .returning();
    return document;
  }

  async checkPropertyDocumentsComplete(propertyId: string): Promise<{
    complete: boolean;
    missing: string[];
    validated: boolean;
    unvalidated: string[];
    category?: 'persona_fisica' | 'persona_moral';
  }> {
    const documents = await this.getPropertyDocuments(propertyId);
    const requiredDocs = documents.filter(doc => doc.isRequired);
    const missingTypes: string[] = [];
    const unvalidatedTypes: string[] = [];

    // If no documents uploaded yet, cannot determine category
    if (documents.length === 0) {
      return {
        complete: false,
        missing: ['No se han subido documentos'],
        validated: false,
        unvalidated: [],
      };
    }

    // Check required documents
    const requiredTypes = {
      persona_fisica: ['ife_ine_frente', 'ife_ine_reverso', 'escrituras', 'recibo_agua', 'recibo_luz', 'comprobante_no_adeudo'],
      persona_moral: ['acta_constitutiva', 'ife_ine_frente', 'ife_ine_reverso', 'escrituras', 'recibo_agua', 'recibo_luz', 'comprobante_no_adeudo'],
    };

    // Determine category based on documents uploaded
    // If acta_constitutiva is present OR any document has category persona_moral, it's persona_moral
    const hasActaConstitutiva = documents.some(doc => doc.documentType === 'acta_constitutiva');
    const hasPersonaMoralDocs = documents.some(doc => doc.category === 'persona_moral');
    const category = (hasActaConstitutiva || hasPersonaMoralDocs) ? 'persona_moral' : 'persona_fisica';
    const required = requiredTypes[category];

    for (const type of required) {
      const doc = documents.find(d => d.documentType === type);
      if (!doc) {
        missingTypes.push(type);
      } else if (!doc.isValidated) {
        unvalidatedTypes.push(type);
      }
    }

    return {
      complete: missingTypes.length === 0,
      missing: missingTypes,
      validated: unvalidatedTypes.length === 0,
      unvalidated: unvalidatedTypes,
      category,
    };
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
    published?: boolean;
    requestVirtualTour?: boolean;
    limit?: number;
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

    if (filters.published !== undefined) {
      conditions.push(eq(properties.published, filters.published));
    }

    if (filters.requestVirtualTour !== undefined) {
      conditions.push(eq(properties.requestVirtualTour, filters.requestVirtualTour));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(
      desc(properties.featured),
      desc(properties.rating),
      desc(properties.createdAt)
    ) as any;

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  // Property staff operations
  async assignStaff(assignment: InsertPropertyStaff): Promise<PropertyStaff> {
    const [staff] = await db.insert(propertyStaff).values(assignment).returning();
    return staff;
  }

  async getPropertyStaff(propertyId: string): Promise<PropertyStaff[]> {
    return await db.select().from(propertyStaff).where(eq(propertyStaff.propertyId, propertyId));
  }

  async isStaffAssignedToProperty(propertyId: string, staffId: string): Promise<boolean> {
    const [assignment] = await db
      .select()
      .from(propertyStaff)
      .where(and(
        eq(propertyStaff.propertyId, propertyId),
        eq(propertyStaff.staffId, staffId)
      ))
      .limit(1);
    return !!assignment;
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

  async getPropertyNote(id: string): Promise<PropertyNote | undefined> {
    const [note] = await db
      .select()
      .from(propertyNotes)
      .where(eq(propertyNotes.id, id));
    return note;
  }

  async getPropertyNotes(propertyId: string): Promise<any[]> {
    const notes = await db
      .select({
        id: propertyNotes.id,
        propertyId: propertyNotes.propertyId,
        authorId: propertyNotes.authorId,
        content: propertyNotes.content,
        createdAt: propertyNotes.createdAt,
        updatedAt: propertyNotes.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(propertyNotes)
      .leftJoin(users, eq(propertyNotes.authorId, users.id))
      .where(eq(propertyNotes.propertyId, propertyId))
      .orderBy(propertyNotes.createdAt);
    
    return notes;
  }

  async createPropertyNote(note: InsertPropertyNote): Promise<PropertyNote> {
    const [createdNote] = await db
      .insert(propertyNotes)
      .values(note)
      .returning();
    return createdNote;
  }

  async deletePropertyNote(id: string): Promise<void> {
    await db.delete(propertyNotes).where(eq(propertyNotes.id, id));
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

  // Concierge Availability operations
  async getActiveConciergues(): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "concierge"),
          eq(users.approved, true)
        )
      );
  }

  async getAvailableConcierguesForSlot(date: Date, durationMinutes: number = 60): Promise<any[]> {
    // Get all active concierges
    const activeConcierges = await this.getActiveConciergues();
    
    // Check each concierge's blocked slots and existing appointments
    const availableConcierges = [];
    
    // Use provided duration or default to 60 min (individual)
    // Individual appointments = 60 min, tour appointments = 30 min
    const requestedStartTime = new Date(date);
    const requestedEndTime = new Date(date.getTime() + durationMinutes * 60 * 1000);
    
    for (const concierge of activeConcierges) {
      // Check if concierge has this time slot blocked
      const blockedSlots = await db
        .select()
        .from(conciergeBlockedSlots)
        .where(
          and(
            eq(conciergeBlockedSlots.conciergeId, concierge.id),
            lte(conciergeBlockedSlots.startTime, requestedEndTime),
            gte(conciergeBlockedSlots.endTime, requestedStartTime)
          )
        );
      
      if (blockedSlots.length > 0) continue; // Skip if blocked
      
      // Check if concierge has any appointment that overlaps with this time
      // Get all non-cancelled appointments for this concierge
      const existingAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.conciergeId, concierge.id),
            not(eq(appointments.status, "cancelled"))
          )
        );
      
      let hasConflict = false;
      for (const apt of existingAppointments) {
        const aptStart = new Date(apt.date);
        // individual = 60 min, tour = 30 min
        const aptDuration = apt.mode === 'individual' ? 60 : 30;
        const aptEnd = new Date(aptStart.getTime() + aptDuration * 60 * 1000);
        
        // Check for overlap: appointments overlap if one starts before the other ends
        if (aptStart < requestedEndTime && aptEnd > requestedStartTime) {
          hasConflict = true;
          break;
        }
      }
      
      if (hasConflict) continue; // Skip if already booked
      
      availableConcierges.push(concierge);
    }
    
    return availableConcierges;
  }

  async getAvailableSlotCount(date: Date, durationMinutes: number = 60): Promise<number> {
    const availableConcierges = await this.getAvailableConcierguesForSlot(date, durationMinutes);
    return availableConcierges.length;
  }

  async assignConciergeToAppointment(
    appointmentId: string,
    conciergeId: string,
    assignedBy: string,
    accessInfo?: { 
      accessType?: string; 
      accessCode?: string; 
      accessInstructions?: string;
    }
  ): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set({
        conciergeId,
        conciergeAssignedBy: assignedBy,
        conciergeAssignedAt: new Date(),
        ...(accessInfo?.accessType && { accessType: accessInfo.accessType }),
        ...(accessInfo?.accessCode && { accessCode: accessInfo.accessCode }),
        ...(accessInfo?.accessInstructions && { accessInstructions: accessInfo.accessInstructions }),
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();
    
    return updated;
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

  async getOffersByOwner(ownerId: string): Promise<Array<Offer & { property: Property; client: User }>> {
    const offersList = await db
      .select({
        offer: offers,
        property: properties,
        client: users,
      })
      .from(offers)
      .innerJoin(properties, eq(offers.propertyId, properties.id))
      .innerJoin(users, eq(offers.clientId, users.id))
      .where(eq(properties.ownerId, ownerId))
      .orderBy(desc(offers.createdAt));

    return offersList.map(row => ({
      ...row.offer,
      property: row.property,
      client: row.client
    }));
  }

  async acceptOffer(offerId: string): Promise<{ offer: Offer; contract?: RentalContract }> {
    // Get offer details
    const [currentOffer] = await db.select().from(offers).where(eq(offers.id, offerId));
    if (!currentOffer) {
      throw new Error('Offer not found');
    }

    // Get property details to get ownerId
    const property = await this.getProperty(currentOffer.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    // Update offer status to accepted
    const [offer] = await db
      .update(offers)
      .set({ 
        status: 'accepted' as any,
        updatedAt: new Date() 
      })
      .where(eq(offers.id, offerId))
      .returning();

    // Create rental contract automatically
    const contractDurationMonths = currentOffer.contractDurationMonths || 12; // Default 12 months
    const monthlyRent = Number(currentOffer.counterOfferAmount || currentOffer.offerAmount);
    
    // Calculate commission based on contract duration
    let totalCommissionMonths = 1; // Default 1 month
    if (contractDurationMonths >= 60) totalCommissionMonths = 3;       // 5 years
    else if (contractDurationMonths >= 48) totalCommissionMonths = 2.5; // 4 years
    else if (contractDurationMonths >= 36) totalCommissionMonths = 2;   // 3 years
    else if (contractDurationMonths >= 24) totalCommissionMonths = 1.5; // 2 years
    else if (contractDurationMonths >= 6) totalCommissionMonths = 1;    // 1 year or 6 months
    else totalCommissionMonths = 0.5; // Less than 6 months

    const totalCommissionAmount = monthlyRent * totalCommissionMonths;
    
    // Commission distribution (default: 70% seller, 30% homesapp)
    const sellerPercent = 70;
    const homesappPercent = 30;
    
    const sellerCommissionAmount = totalCommissionAmount * (sellerPercent / 100);
    const homesappCommissionAmount = totalCommissionAmount * (homesappPercent / 100);

    // Administrative fee based on property use
    const isForSublease = currentOffer.clientPropertyUse === 'subarrendamiento';
    const administrativeFee = isForSublease ? 3800 : 2500;

    // Calculate lease dates with robust validation
    let leaseStartDate = new Date();
    if (currentOffer.moveInDate) {
      const parsedDate = new Date(currentOffer.moveInDate);
      if (!isNaN(parsedDate.getTime())) {
        leaseStartDate = parsedDate;
      } else {
        console.warn('[WARN] Invalid moveInDate, using current date:', currentOffer.moveInDate);
      }
    }
    
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + contractDurationMonths);

    const [contract] = await db.insert(rentalContracts).values({
      propertyId: currentOffer.propertyId,
      tenantId: currentOffer.clientId,
      ownerId: property.ownerId!,
      sellerId: property.sellerId || null,
      status: 'draft',
      monthlyRent: monthlyRent.toString(),
      leaseDurationMonths: contractDurationMonths,
      depositAmount: currentOffer.depositAmount?.toString() || currentOffer.firstMonthAdvance ? monthlyRent.toString() : '0',
      administrativeFee: administrativeFee.toString(),
      isForSublease: isForSublease,
      totalCommissionMonths: totalCommissionMonths.toString(),
      totalCommissionAmount: totalCommissionAmount.toString(),
      sellerCommissionPercent: sellerPercent.toString(),
      referralCommissionPercent: '0',
      homesappCommissionPercent: homesappPercent.toString(),
      sellerCommissionAmount: sellerCommissionAmount.toString(),
      referralCommissionAmount: '0',
      homesappCommissionAmount: homesappCommissionAmount.toString(),
      includedServices: currentOffer.servicesIncluded as any,
      leaseStartDate,
      leaseEndDate,
    }).returning();

    return { offer, contract };
  }

  async rejectOffer(offerId: string, reason?: string): Promise<Offer> {
    const [offer] = await db
      .update(offers)
      .set({ 
        status: 'rejected' as any,
        notes: reason || null,
        updatedAt: new Date() 
      })
      .where(eq(offers.id, offerId))
      .returning();
    return offer;
  }

  async createCounterOffer(offerId: string, counterOfferData: {
    counterOfferAmount?: string;
    counterOfferServicesIncluded?: any;
    counterOfferServicesExcluded?: any;
    counterOfferNotes?: string;
    offeredBy: 'client' | 'owner';
  }): Promise<Offer> {
    // Get current offer to increment negotiation round and save to history
    const [currentOffer] = await db.select().from(offers).where(eq(offers.id, offerId));
    
    if (!currentOffer) {
      throw new Error('Offer not found');
    }

    // Check negotiation round limit (max 3 rounds)
    const currentRound = currentOffer.negotiationRound || 0;
    if (currentRound >= 3) {
      throw new Error('Maximum negotiation rounds (3) reached');
    }

    // Build negotiation history entry
    const historyEntry = {
      round: currentRound + 1,
      offeredBy: counterOfferData.offeredBy,
      amount: counterOfferData.counterOfferAmount || currentOffer.counterOfferAmount,
      servicesIncluded: counterOfferData.counterOfferServicesIncluded || currentOffer.counterOfferServicesIncluded,
      servicesExcluded: counterOfferData.counterOfferServicesExcluded || currentOffer.counterOfferServicesExcluded,
      notes: counterOfferData.counterOfferNotes,
      timestamp: new Date().toISOString(),
    };

    // Update existing history or create new array
    const history = Array.isArray(currentOffer.negotiationHistory) 
      ? [...currentOffer.negotiationHistory as any[], historyEntry]
      : [historyEntry];

    const [offer] = await db
      .update(offers)
      .set({
        counterOfferAmount: counterOfferData.counterOfferAmount || currentOffer.counterOfferAmount,
        counterOfferServicesIncluded: counterOfferData.counterOfferServicesIncluded || currentOffer.counterOfferServicesIncluded,
        counterOfferServicesExcluded: counterOfferData.counterOfferServicesExcluded || currentOffer.counterOfferServicesExcluded,
        counterOfferNotes: counterOfferData.counterOfferNotes || currentOffer.counterOfferNotes,
        status: 'countered' as any,
        negotiationRound: currentRound + 1,
        lastOfferedBy: counterOfferData.offeredBy,
        negotiationHistory: history,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, offerId))
      .returning();
    
    return offer;
  }

  // Rental Opportunity Request operations
  async getVisitedPropertiesByClient(clientId: string): Promise<Array<Property & { appointment: Appointment }>> {
    // Get appointments that are completed or have passed
    const completedAppointments = await db
      .select({
        property: properties,
        appointment: appointments,
      })
      .from(appointments)
      .innerJoin(properties, eq(appointments.propertyId, properties.id))
      .where(
        and(
          eq(appointments.clientId, clientId),
          or(
            eq(appointments.status, 'completed' as any),
            lte(appointments.appointmentDate, sql`now()`)
          )
        )
      )
      .orderBy(desc(appointments.appointmentDate));

    return completedAppointments.map(row => ({
      ...row.property,
      appointment: row.appointment
    }));
  }

  async createRentalOpportunityRequest(requestData: InsertRentalOpportunityRequest): Promise<RentalOpportunityRequest> {
    const [request] = await db.insert(rentalOpportunityRequests).values(requestData).returning();
    return request;
  }

  async getRentalOpportunityRequestsByClient(clientId: string): Promise<RentalOpportunityRequest[]> {
    return await db
      .select()
      .from(rentalOpportunityRequests)
      .where(eq(rentalOpportunityRequests.userId, clientId))
      .orderBy(desc(rentalOpportunityRequests.createdAt));
  }

  async getRentalOpportunityRequest(id: string): Promise<RentalOpportunityRequest | undefined> {
    const [request] = await db.select().from(rentalOpportunityRequests).where(eq(rentalOpportunityRequests.id, id));
    return request;
  }

  async getAllRentalOpportunityRequests(): Promise<RentalOpportunityRequest[]> {
    return await db
      .select()
      .from(rentalOpportunityRequests)
      .orderBy(desc(rentalOpportunityRequests.createdAt));
  }

  async approveRentalOpportunityRequest(id: string, adminId: string): Promise<RentalOpportunityRequest> {
    const [request] = await db
      .update(rentalOpportunityRequests)
      .set({
        status: 'approved' as any,
        approvedBy: adminId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(rentalOpportunityRequests.id, id))
      .returning();
    return request;
  }

  async rejectRentalOpportunityRequest(id: string, adminId: string, reason: string): Promise<RentalOpportunityRequest> {
    const [request] = await db
      .update(rentalOpportunityRequests)
      .set({
        status: 'rejected' as any,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(rentalOpportunityRequests.id, id))
      .returning();
    return request;
  }

  async updateRentalOpportunityRequestStatus(id: string, status: string): Promise<RentalOpportunityRequest> {
    const [request] = await db
      .update(rentalOpportunityRequests)
      .set({
        status: status as any,
        updatedAt: new Date()
      })
      .where(eq(rentalOpportunityRequests.id, id))
      .returning();
    return request;
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
  async getAdminById(id: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id));
    return admin;
  }

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

  async getActiveLeadByPhone(phone: string): Promise<Lead | undefined> {
    const now = new Date();
    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.phone, phone),
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

  async getLeadsForSeller(sellerId: string, filters?: { status?: string; assignedToId?: string }): Promise<Lead[]> {
    let query = db.select().from(leads);
    
    // Sellers see leads they registered OR are assigned to
    const sellerCondition = or(
      eq(leads.registeredById, sellerId),
      eq(leads.assignedToId, sellerId)
    );
    
    const conditions = [sellerCondition];
    
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status as any));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(leads.assignedToId, filters.assignedToId));
    }
    
    query = query.where(and(...conditions)) as any;
    
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

  // Lead History operations
  async createLeadHistory(historyData: InsertLeadHistory): Promise<LeadHistory> {
    const [history] = await db.insert(leadHistory).values(historyData).returning();
    return history;
  }

  async getLeadHistory(leadId: string): Promise<LeadHistory[]> {
    return await db
      .select()
      .from(leadHistory)
      .where(eq(leadHistory.leadId, leadId))
      .orderBy(desc(leadHistory.createdAt));
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

  // Property Owner Terms operations
  async getAllPropertyOwnerTerms(): Promise<PropertyOwnerTerms[]> {
    return await db.select().from(propertyOwnerTerms).orderBy(propertyOwnerTerms.orderIndex);
  }

  async getActivePropertyOwnerTerms(language?: string): Promise<PropertyOwnerTerms[]> {
    return await db
      .select()
      .from(propertyOwnerTerms)
      .where(eq(propertyOwnerTerms.isActive, true))
      .orderBy(propertyOwnerTerms.orderIndex);
  }

  async getPropertyOwnerTerm(id: string): Promise<PropertyOwnerTerms | undefined> {
    const [term] = await db.select().from(propertyOwnerTerms).where(eq(propertyOwnerTerms.id, id));
    return term;
  }

  async createPropertyOwnerTerm(termData: InsertPropertyOwnerTerms): Promise<PropertyOwnerTerms> {
    const [term] = await db.insert(propertyOwnerTerms).values(termData).returning();
    return term;
  }

  async updatePropertyOwnerTerm(id: string, updates: Partial<InsertPropertyOwnerTerms>): Promise<PropertyOwnerTerms> {
    const [updated] = await db
      .update(propertyOwnerTerms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(propertyOwnerTerms.id, id))
      .returning();
    return updated;
  }

  async deletePropertyOwnerTerm(id: string): Promise<void> {
    await db.delete(propertyOwnerTerms).where(eq(propertyOwnerTerms.id, id));
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

  // Contract Tenant Info CRUD
  async getContractTenantInfo(rentalContractId: string): Promise<ContractTenantInfo | undefined> {
    const [info] = await db
      .select()
      .from(contractTenantInfo)
      .where(eq(contractTenantInfo.rentalContractId, rentalContractId))
      .limit(1);
    return info;
  }

  async createContractTenantInfo(data: InsertContractTenantInfo): Promise<ContractTenantInfo> {
    const [info] = await db
      .insert(contractTenantInfo)
      .values(data)
      .returning();
    return info;
  }

  async updateContractTenantInfo(
    rentalContractId: string,
    updates: Partial<InsertContractTenantInfo>
  ): Promise<ContractTenantInfo> {
    const [updated] = await db
      .update(contractTenantInfo)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractTenantInfo.rentalContractId, rentalContractId))
      .returning();
    return updated;
  }

  async deleteContractTenantInfo(rentalContractId: string): Promise<void> {
    await db.delete(contractTenantInfo).where(eq(contractTenantInfo.rentalContractId, rentalContractId));
  }

  // Contract Owner Info CRUD
  async getContractOwnerInfo(rentalContractId: string): Promise<ContractOwnerInfo | undefined> {
    const [info] = await db
      .select()
      .from(contractOwnerInfo)
      .where(eq(contractOwnerInfo.rentalContractId, rentalContractId))
      .limit(1);
    return info;
  }

  async createContractOwnerInfo(data: InsertContractOwnerInfo): Promise<ContractOwnerInfo> {
    const [info] = await db
      .insert(contractOwnerInfo)
      .values(data)
      .returning();
    return info;
  }

  async updateContractOwnerInfo(
    rentalContractId: string,
    updates: Partial<InsertContractOwnerInfo>
  ): Promise<ContractOwnerInfo> {
    const [updated] = await db
      .update(contractOwnerInfo)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractOwnerInfo.rentalContractId, rentalContractId))
      .returning();
    return updated;
  }

  async deleteContractOwnerInfo(rentalContractId: string): Promise<void> {
    await db.delete(contractOwnerInfo).where(eq(contractOwnerInfo.rentalContractId, rentalContractId));
  }

  async getActiveRentalsByTenant(tenantId: string): Promise<any[]> {
    // Get contracts where user is tenant and status is active (activo or check_in)
    // Include property information
    const results = await db
      .select({
        id: rentalContracts.id,
        propertyId: rentalContracts.propertyId,
        tenantId: rentalContracts.tenantId,
        ownerId: rentalContracts.ownerId,
        startDate: rentalContracts.leaseStartDate,
        endDate: rentalContracts.leaseEndDate,
        monthlyRent: rentalContracts.monthlyRent,
        securityDeposit: rentalContracts.depositAmount,
        status: rentalContracts.status,
        leaseDurationMonths: rentalContracts.leaseDurationMonths,
        createdAt: rentalContracts.createdAt,
        // Property information
        propertyTitle: properties.title,
        propertyType: properties.propertyType,
        unitType: properties.unitType,
        condominiumId: properties.condominiumId,
        condoName: properties.condoName,
        unitNumber: properties.unitNumber,
      })
      .from(rentalContracts)
      .leftJoin(properties, eq(rentalContracts.propertyId, properties.id))
      .where(
        and(
          eq(rentalContracts.tenantId, tenantId),
          or(
            eq(rentalContracts.status, 'activo'),
            eq(rentalContracts.status, 'check_in')
          )
        )
      )
      .orderBy(desc(rentalContracts.createdAt));
    
    return results;
  }

  async getActiveRentalsByOwner(ownerId: string): Promise<RentalContract[]> {
    // Get contracts where user is owner and status is active (activo or check_in)
    return await db
      .select()
      .from(rentalContracts)
      .where(
        and(
          eq(rentalContracts.ownerId, ownerId),
          or(
            eq(rentalContracts.status, 'activo'),
            eq(rentalContracts.status, 'check_in')
          )
        )
      )
      .orderBy(desc(rentalContracts.createdAt));
  }

  async getRentalPayments(rentalContractId: string): Promise<RentalPayment[]> {
    return await db
      .select()
      .from(rentalPayments)
      .where(eq(rentalPayments.rentalContractId, rentalContractId))
      .orderBy(rentalPayments.dueDate);
  }

  async getRentalPayment(id: string): Promise<RentalPayment | undefined> {
    const [payment] = await db
      .select()
      .from(rentalPayments)
      .where(eq(rentalPayments.id, id))
      .limit(1);
    return payment;
  }

  async updateRentalPayment(id: string, updates: Partial<InsertRentalPayment>): Promise<RentalPayment> {
    const [updated] = await db
      .update(rentalPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rentalPayments.id, id))
      .returning();
    return updated;
  }

  async approveRentalPayment(id: string, ownerId: string): Promise<RentalPayment> {
    const [updated] = await db
      .update(rentalPayments)
      .set({ 
        approvedBy: ownerId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(rentalPayments.id, id))
      .returning();
    return updated;
  }

  async getPendingPaymentsByOwner(ownerId: string): Promise<RentalPayment[]> {
    // Get all payments for contracts owned by this owner that are paid but not approved
    const payments = await db
      .select({
        payment: rentalPayments,
        contract: rentalContracts
      })
      .from(rentalPayments)
      .innerJoin(rentalContracts, eq(rentalPayments.rentalContractId, rentalContracts.id))
      .where(
        and(
          eq(rentalContracts.ownerId, ownerId),
          eq(rentalPayments.status, 'paid'),
          isNull(rentalPayments.approvedBy)
        )
      )
      .orderBy(desc(rentalPayments.paymentDate));
    
    return payments.map(p => p.payment);
  }

  async createTenantMaintenanceRequest(requestData: InsertTenantMaintenanceRequest): Promise<TenantMaintenanceRequest> {
    const [request] = await db.insert(tenantMaintenanceRequests).values(requestData).returning();
    return request;
  }

  async getTenantMaintenanceRequests(rentalContractId: string): Promise<TenantMaintenanceRequest[]> {
    return await db
      .select()
      .from(tenantMaintenanceRequests)
      .where(eq(tenantMaintenanceRequests.rentalContractId, rentalContractId))
      .orderBy(desc(tenantMaintenanceRequests.createdAt));
  }

  // Property Delivery Inventory operations
  async getPropertyDeliveryInventory(rentalContractId: string): Promise<PropertyDeliveryInventory | undefined> {
    const [inventory] = await db
      .select()
      .from(propertyDeliveryInventories)
      .where(eq(propertyDeliveryInventories.rentalContractId, rentalContractId));
    return inventory;
  }

  async createPropertyDeliveryInventory(inventory: InsertPropertyDeliveryInventory): Promise<PropertyDeliveryInventory> {
    const [newInventory] = await db.insert(propertyDeliveryInventories).values(inventory).returning();
    return newInventory;
  }

  async updatePropertyDeliveryInventory(id: string, updates: Partial<InsertPropertyDeliveryInventory>): Promise<PropertyDeliveryInventory> {
    const [updated] = await db
      .update(propertyDeliveryInventories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(propertyDeliveryInventories.id, id))
      .returning();
    return updated;
  }

  // Tenant Move-In Form operations
  async getTenantMoveInForm(rentalContractId: string): Promise<TenantMoveInForm | undefined> {
    const [form] = await db
      .select()
      .from(tenantMoveInForms)
      .where(eq(tenantMoveInForms.rentalContractId, rentalContractId));
    return form;
  }

  async createTenantMoveInForm(form: InsertTenantMoveInForm): Promise<TenantMoveInForm> {
    const [newForm] = await db.insert(tenantMoveInForms).values(form).returning();
    return newForm;
  }

  async updateTenantMoveInForm(id: string, updates: Partial<InsertTenantMoveInForm>): Promise<TenantMoveInForm> {
    const [updated] = await db
      .update(tenantMoveInForms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenantMoveInForms.id, id))
      .returning();
    return updated;
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
        // Extract only the 'new' values from changedFields
        const updates: any = {};
        for (const [key, value] of Object.entries(changedFields)) {
          if (value && typeof value === 'object' && 'new' in value) {
            updates[key] = value.new;
          } else {
            // Fallback for old format (if any exist)
            updates[key] = value;
          }
        }
        
        await db.update(properties)
          .set({ ...updates, updatedAt: new Date() })
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

  async markNotificationAsUnread(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ read: false })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
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

  async getChatConversationByAppointmentId(appointmentId: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.appointmentId, appointmentId));
    return conversation;
  }

  async getChatConversationByRentalContractId(rentalContractId: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.rentalContractId, rentalContractId));
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
    // Deep merge JSONB columns to prevent data loss on partial updates
    // Load existing draft first
    const existing = await this.getPropertySubmissionDraft(id);
    if (!existing) {
      throw new Error("Draft not found");
    }

    // Helper to deep merge objects (preserves existing keys not in updates)
    const deepMerge = (target: any, source: any): any => {
      if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return source; // Replace primitives and arrays completely
      }
      if (!target || typeof target !== 'object' || Array.isArray(target)) {
        return source; // If target isn't an object, use source
      }
      
      const result = { ...target }; // Start with all target keys
      for (const key in source) {
        if (source[key] !== undefined) {
          result[key] = deepMerge(target[key], source[key]); // Recursively merge
        }
      }
      return result;
    };

    // Merge JSONB columns deeply
    const mergedUpdates: any = { ...updates, updatedAt: new Date() };
    
    const jsonbColumns = ['basicInfo', 'locationInfo', 'details', 'media', 'servicesInfo', 'accessInfo', 'ownerData', 'commercialTerms'];
    for (const col of jsonbColumns) {
      if (updates[col as keyof typeof updates] !== undefined) {
        mergedUpdates[col] = deepMerge(existing[col as keyof typeof existing], updates[col as keyof typeof updates]);
      }
    }

    const [updated] = await db
      .update(propertySubmissionDrafts)
      .set(mergedUpdates)
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
    
    // CRITICAL: Ensure admin exists in users table for foreign key constraint
    // The managementId field references users table, so admin must exist there
    const adminUser = await this.getUser(adminId);
    if (!adminUser) {
      // Admin doesn't exist in users table - get from admin_users and create
      const adminUserData = await db.select().from(adminUsers).where(eq(adminUsers.id, adminId)).limit(1);
      
      if (adminUserData.length > 0) {
        const admin = adminUserData[0];
        // Create user record for this admin
        await db.insert(users).values({
          id: admin.id,
          email: admin.email,
          username: admin.username,
          firstName: admin.firstName || "Admin",
          lastName: admin.lastName || "User",
          role: "admin",
          approved: true,
          active: true,
        }).onConflictDoNothing();
      } else {
        throw new Error("Admin no encontrado en el sistema");
      }
    }
    
    // CRITICAL: Handle owner user creation for drafts submitted via invitation token
    // If draft doesn't have userId (created without login), create/find owner user
    let ownerUserId = draft.userId;
    
    if (!ownerUserId) {
      const ownerData = draft.ownerData as any;
      
      if (!ownerData || !ownerData.ownerPhone) {
        throw new Error("No se puede aprobar: falta información del propietario (teléfono requerido)");
      }
      
      // Try to find existing user by phone or email
      let existingOwner = null;
      
      if (ownerData.ownerEmail) {
        const emailMatch = await db.select().from(users)
          .where(eq(users.email, ownerData.ownerEmail))
          .limit(1);
        if (emailMatch.length > 0) {
          existingOwner = emailMatch[0];
        }
      }
      
      if (!existingOwner && ownerData.ownerPhone) {
        const phoneMatch = await db.select().from(users)
          .where(eq(users.phone, ownerData.ownerPhone))
          .limit(1);
        if (phoneMatch.length > 0) {
          existingOwner = phoneMatch[0];
        }
      }
      
      if (existingOwner) {
        // Use existing owner
        ownerUserId = existingOwner.id;
      } else {
        // Create new owner user
        const newOwner = await this.createUser({
          email: ownerData.ownerEmail || `owner_${Date.now()}@temp.homesapp.com`,
          username: ownerData.ownerPhone || `owner_${Date.now()}`,
          password: Math.random().toString(36).slice(-12), // Random temp password
          firstName: ownerData.ownerFirstName || "Propietario",
          lastName: ownerData.ownerLastName || "Sin Apellido",
          phone: ownerData.ownerPhone,
          role: "propietario",
          approved: false, // Admin will approve later
          active: true,
        });
        ownerUserId = newOwner.id;
      }
      
      // Update draft with owner user ID
      await this.updatePropertySubmissionDraft(id, { userId: ownerUserId });
      
      // Update draft object for transformer
      draft.userId = ownerUserId;
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
    
    // Save owner documents if provided
    const ownerData = draft.ownerData as any;
    if (ownerData?.documents && Array.isArray(ownerData.documents) && ownerData.documents.length > 0) {
      for (const doc of ownerData.documents) {
        await this.createPropertyDocument({
          propertyId: property.id,
          type: doc.type,
          url: doc.url,
          name: doc.name,
          category: this.getDocumentCategory(doc.type),
          uploadedBy: draft.userId,
          verified: false, // Admin will verify later
        });
      }
    }
    
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

  // Helper method to determine document category based on type
  private getDocumentCategory(type: string): string {
    // Persona Física documents
    const personaFisicaDocs = [
      "ife_ine_frente", "ife_ine_reverso", "pasaporte", "legal_estancia",
      "escrituras", "contrato_compraventa", "fideicomiso",
      "recibo_agua", "recibo_luz", "recibo_internet",
      "reglas_internas", "reglamento_condominio", "comprobante_no_adeudo"
    ];
    
    // Persona Moral documents
    const personaMoralDocs = [
      "acta_constitutiva", "poder_notarial", "identificacion_representante"
    ];
    
    if (personaFisicaDocs.includes(type)) {
      return "persona_fisica";
    } else if (personaMoralDocs.includes(type)) {
      return "persona_moral";
    } else {
      return "optional";
    }
  }

  // Property Submission Token operations
  async getPropertySubmissionToken(id: string): Promise<PropertySubmissionToken | undefined> {
    const [token] = await db.select().from(propertySubmissionTokens).where(eq(propertySubmissionTokens.id, id));
    return token;
  }

  async getPropertySubmissionTokenByToken(token: string): Promise<PropertySubmissionToken | undefined> {
    const [tokenRecord] = await db.select().from(propertySubmissionTokens).where(eq(propertySubmissionTokens.token, token));
    return tokenRecord;
  }

  async getPropertySubmissionTokens(filters?: { createdBy?: string; used?: boolean }): Promise<PropertySubmissionToken[]> {
    let query = db.select().from(propertySubmissionTokens);
    
    const conditions = [];
    if (filters?.createdBy) {
      conditions.push(eq(propertySubmissionTokens.createdBy, filters.createdBy));
    }
    if (filters?.used !== undefined) {
      conditions.push(eq(propertySubmissionTokens.used, filters.used));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(propertySubmissionTokens.createdAt));
  }

  async createPropertySubmissionToken(tokenData: InsertPropertySubmissionToken): Promise<PropertySubmissionToken> {
    const [token] = await db.insert(propertySubmissionTokens).values(tokenData).returning();
    return token;
  }

  async updatePropertySubmissionToken(id: string, updates: Partial<InsertPropertySubmissionToken>): Promise<PropertySubmissionToken> {
    const [updated] = await db
      .update(propertySubmissionTokens)
      .set(updates)
      .where(eq(propertySubmissionTokens.id, id))
      .returning();
    return updated;
  }

  async markPropertySubmissionTokenAsUsed(id: string, propertyDraftId: string): Promise<PropertySubmissionToken> {
    const [updated] = await db
      .update(propertySubmissionTokens)
      .set({ 
        used: true, 
        propertyDraftId: propertyDraftId,
        usedAt: new Date() 
      })
      .where(eq(propertySubmissionTokens.id, id))
      .returning();
    return updated;
  }

  async deletePropertySubmissionToken(id: string): Promise<void> {
    await db.delete(propertySubmissionTokens).where(eq(propertySubmissionTokens.id, id));
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

  // Error Log operations
  async getErrorLog(id: string): Promise<ErrorLog | undefined> {
    const [errorLog] = await db.select().from(errorLogs).where(eq(errorLogs.id, id));
    return errorLog;
  }

  async getAllErrorLogs(filters?: { status?: string; errorType?: string; userId?: string }): Promise<ErrorLog[]> {
    let query = db.select().from(errorLogs);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(errorLogs.status, filters.status as any));
    }
    if (filters?.errorType) {
      conditions.push(eq(errorLogs.errorType, filters.errorType as any));
    }
    if (filters?.userId) {
      conditions.push(eq(errorLogs.userId, filters.userId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(errorLogs.createdAt));
  }

  async createErrorLog(errorData: InsertErrorLog): Promise<ErrorLog> {
    const [newErrorLog] = await db.insert(errorLogs).values(errorData).returning();
    return newErrorLog;
  }

  async updateErrorLog(id: string, updates: Partial<InsertErrorLog>): Promise<ErrorLog> {
    const [updated] = await db
      .update(errorLogs)
      .set(updates)
      .where(eq(errorLogs.id, id))
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

  // Property Limit Request operations
  async getPropertyLimitRequest(id: string): Promise<PropertyLimitRequest | undefined> {
    const [request] = await db
      .select()
      .from(propertyLimitRequests)
      .where(eq(propertyLimitRequests.id, id));
    return request;
  }

  async getPropertyLimitRequests(filters?: { ownerId?: string; status?: string }): Promise<PropertyLimitRequest[]> {
    const conditions: any[] = [];
    
    if (filters?.ownerId) {
      conditions.push(eq(propertyLimitRequests.ownerId, filters.ownerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(propertyLimitRequests.status, filters.status));
    }
    
    return await db
      .select()
      .from(propertyLimitRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(propertyLimitRequests.createdAt));
  }

  async getUserActivePropertyLimitRequest(ownerId: string): Promise<PropertyLimitRequest | undefined> {
    const [request] = await db
      .select()
      .from(propertyLimitRequests)
      .where(
        and(
          eq(propertyLimitRequests.ownerId, ownerId),
          eq(propertyLimitRequests.status, "pending")
        )
      );
    return request;
  }

  async createPropertyLimitRequest(request: InsertPropertyLimitRequest): Promise<PropertyLimitRequest> {
    const [created] = await db
      .insert(propertyLimitRequests)
      .values(request)
      .returning();
    return created;
  }

  async updatePropertyLimitRequestStatus(
    id: string,
    status: string,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<PropertyLimitRequest> {
    const [updated] = await db
      .update(propertyLimitRequests)
      .set({
        status,
        reviewedById: reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date(),
      })
      .where(eq(propertyLimitRequests.id, id))
      .returning();
    return updated;
  }

  async getUserPropertyCount(ownerId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(properties)
      .where(
        and(
          eq(properties.ownerId, ownerId),
          eq(properties.active, true)
        )
      );
    return result[0]?.count || 0;
  }

  // Commission Advance operations
  async getCommissionAdvance(id: string): Promise<CommissionAdvance | undefined> {
    const result = await db.select().from(commissionAdvances).where(eq(commissionAdvances.id, id));
    return result[0];
  }

  async getCommissionAdvances(filters?: { sellerId?: string; status?: string }): Promise<CommissionAdvance[]> {
    const conditions = [];
    if (filters?.sellerId) conditions.push(eq(commissionAdvances.sellerId, filters.sellerId));
    if (filters?.status) conditions.push(eq(commissionAdvances.status, filters.status as any));
    
    return await db.select().from(commissionAdvances).where(conditions.length ? and(...conditions) : undefined);
  }

  async createCommissionAdvance(advance: InsertCommissionAdvance): Promise<CommissionAdvance> {
    const result = await db.insert(commissionAdvances).values(advance).returning();
    return result[0];
  }

  async updateCommissionAdvanceStatus(id: string, status: string, approvedBy?: string, notes?: string): Promise<CommissionAdvance> {
    const updates: any = { status };
    if (approvedBy) updates.approvedBy = approvedBy;
    if (notes) updates.notes = notes;
    if (status === 'approved') updates.approvedAt = new Date();
    if (status === 'paid') updates.paidAt = new Date();
    
    const result = await db.update(commissionAdvances).set(updates).where(eq(commissionAdvances.id, id)).returning();
    return result[0];
  }

  // Service Favorite operations
  async addServiceFavorite(favorite: InsertServiceFavorite): Promise<ServiceFavorite> {
    const result = await db.insert(serviceFavorites).values(favorite).returning();
    return result[0];
  }

  async removeServiceFavorite(userId: string, providerId: string): Promise<void> {
    await db.delete(serviceFavorites).where(
      and(
        eq(serviceFavorites.userId, userId),
        eq(serviceFavorites.providerId, providerId)
      )
    );
  }

  async getUserServiceFavorites(userId: string): Promise<ServiceFavorite[]> {
    return await db.select().from(serviceFavorites).where(eq(serviceFavorites.userId, userId));
  }

  async isServiceFavorite(userId: string, providerId: string): Promise<boolean> {
    const result = await db.select().from(serviceFavorites).where(
      and(
        eq(serviceFavorites.userId, userId),
        eq(serviceFavorites.providerId, providerId)
      )
    );
    return result.length > 0;
  }

  // Predictive Analytics operations
  async getPredictiveAnalytic(id: string): Promise<PredictiveAnalytic | undefined> {
    const result = await db.select().from(predictiveAnalytics).where(eq(predictiveAnalytics.id, id));
    return result[0];
  }

  async getPredictiveAnalytics(filters?: { propertyId?: string; type?: string }): Promise<PredictiveAnalytic[]> {
    const conditions = [];
    if (filters?.propertyId) conditions.push(eq(predictiveAnalytics.propertyId, filters.propertyId));
    if (filters?.type) conditions.push(eq(predictiveAnalytics.type, filters.type as any));
    
    return await db.select().from(predictiveAnalytics)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(predictiveAnalytics.createdAt));
  }

  async createPredictiveAnalytic(analytic: InsertPredictiveAnalytic): Promise<PredictiveAnalytic> {
    const result = await db.insert(predictiveAnalytics).values(analytic).returning();
    return result[0];
  }

  async updatePredictiveAnalytic(id: string, updates: Partial<InsertPredictiveAnalytic>): Promise<PredictiveAnalytic> {
    const result = await db.update(predictiveAnalytics).set(updates).where(eq(predictiveAnalytics.id, id)).returning();
    return result[0];
  }

  async deletePredictiveAnalytic(id: string): Promise<void> {
    await db.delete(predictiveAnalytics).where(eq(predictiveAnalytics.id, id));
  }

  // Marketing Campaign operations
  async getMarketingCampaign(id: string): Promise<MarketingCampaign | undefined> {
    const result = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, id));
    return result[0];
  }

  async getMarketingCampaigns(filters?: { status?: string; type?: string; createdBy?: string }): Promise<MarketingCampaign[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(marketingCampaigns.status, filters.status as any));
    if (filters?.type) conditions.push(eq(marketingCampaigns.type, filters.type as any));
    if (filters?.createdBy) conditions.push(eq(marketingCampaigns.createdBy, filters.createdBy));
    
    return await db.select().from(marketingCampaigns)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(marketingCampaigns.createdAt));
  }

  async createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const result = await db.insert(marketingCampaigns).values(campaign).returning();
    return result[0];
  }

  async updateMarketingCampaign(id: string, updates: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign> {
    const result = await db.update(marketingCampaigns).set(updates).where(eq(marketingCampaigns.id, id)).returning();
    return result[0];
  }

  async updateMarketingCampaignStatus(id: string, status: string): Promise<MarketingCampaign> {
    const updates: any = { status };
    if (status === 'active') updates.startedAt = new Date();
    if (status === 'completed') updates.completedAt = new Date();
    
    const result = await db.update(marketingCampaigns).set(updates).where(eq(marketingCampaigns.id, id)).returning();
    return result[0];
  }

  // Maintenance Schedule operations
  async getMaintenanceSchedule(id: string): Promise<MaintenanceSchedule | undefined> {
    const result = await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.id, id));
    return result[0];
  }

  async getMaintenanceSchedules(filters?: { propertyId?: string; active?: boolean }): Promise<MaintenanceSchedule[]> {
    const conditions = [];
    if (filters?.propertyId) conditions.push(eq(maintenanceSchedules.propertyId, filters.propertyId));
    if (filters?.active !== undefined) conditions.push(eq(maintenanceSchedules.active, filters.active));
    
    return await db.select().from(maintenanceSchedules)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(maintenanceSchedules.nextDue);
  }

  async createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    const result = await db.insert(maintenanceSchedules).values(schedule).returning();
    return result[0];
  }

  async updateMaintenanceSchedule(id: string, updates: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const result = await db.update(maintenanceSchedules).set(updates).where(eq(maintenanceSchedules.id, id)).returning();
    return result[0];
  }

  // Legal Document operations
  async getLegalDocument(id: string): Promise<LegalDocument | undefined> {
    const result = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id));
    return result[0];
  }

  async getLegalDocuments(filters?: { propertyId?: string; type?: string; status?: string }): Promise<LegalDocument[]> {
    const conditions = [];
    if (filters?.propertyId) conditions.push(eq(legalDocuments.propertyId, filters.propertyId));
    if (filters?.type) conditions.push(eq(legalDocuments.type, filters.type as any));
    if (filters?.status) conditions.push(eq(legalDocuments.status, filters.status as any));
    
    return await db.select().from(legalDocuments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(legalDocuments.createdAt));
  }

  async createLegalDocument(document: InsertLegalDocument): Promise<LegalDocument> {
    const result = await db.insert(legalDocuments).values(document).returning();
    return result[0];
  }

  async updateLegalDocument(id: string, updates: Partial<InsertLegalDocument>): Promise<LegalDocument> {
    const result = await db.update(legalDocuments).set({ ...updates, updatedAt: new Date() }).where(eq(legalDocuments.id, id)).returning();
    return result[0];
  }

  async updateLegalDocumentStatus(id: string, status: string): Promise<LegalDocument> {
    const result = await db.update(legalDocuments).set({ status: status as any, updatedAt: new Date() }).where(eq(legalDocuments.id, id)).returning();
    return result[0];
  }

  // Tenant Screening operations
  async getTenantScreening(id: string): Promise<TenantScreening | undefined> {
    const result = await db.select().from(tenantScreenings).where(eq(tenantScreenings.id, id));
    return result[0];
  }

  async getTenantScreenings(filters?: { applicationId?: string; applicantId?: string; propertyId?: string; status?: string }): Promise<TenantScreening[]> {
    const conditions = [];
    if (filters?.applicationId) conditions.push(eq(tenantScreenings.applicationId, filters.applicationId));
    if (filters?.applicantId) conditions.push(eq(tenantScreenings.applicantId, filters.applicantId));
    if (filters?.propertyId) conditions.push(eq(tenantScreenings.propertyId, filters.propertyId));
    if (filters?.status) conditions.push(eq(tenantScreenings.status, filters.status as any));
    
    return await db.select().from(tenantScreenings)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(tenantScreenings.createdAt));
  }

  async createTenantScreening(screening: InsertTenantScreening): Promise<TenantScreening> {
    const result = await db.insert(tenantScreenings).values(screening).returning();
    return result[0];
  }

  async updateTenantScreening(id: string, updates: Partial<InsertTenantScreening>): Promise<TenantScreening> {
    const result = await db.update(tenantScreenings).set(updates).where(eq(tenantScreenings.id, id)).returning();
    return result[0];
  }

  async updateTenantScreeningStatus(id: string, status: string, reviewedBy?: string, reviewNotes?: string): Promise<TenantScreening> {
    const updates: any = { status };
    if (reviewedBy) updates.reviewedBy = reviewedBy;
    if (reviewNotes) updates.reviewNotes = reviewNotes;
    if (['completed', 'approved', 'rejected'].includes(status)) {
      updates.completedAt = new Date();
    }
    
    const result = await db.update(tenantScreenings).set(updates).where(eq(tenantScreenings.id, id)).returning();
    return result[0];
  }

  // Contract Legal Document operations
  async getContractLegalDocument(id: string): Promise<ContractLegalDocument | undefined> {
    const result = await db.select().from(contractLegalDocuments).where(eq(contractLegalDocuments.id, id));
    return result[0];
  }

  async getContractLegalDocuments(rentalContractId: string): Promise<ContractLegalDocument[]> {
    return await db.select()
      .from(contractLegalDocuments)
      .where(eq(contractLegalDocuments.rentalContractId, rentalContractId))
      .orderBy(desc(contractLegalDocuments.createdAt));
  }

  async createContractLegalDocument(document: InsertContractLegalDocument): Promise<ContractLegalDocument> {
    const result = await db.insert(contractLegalDocuments).values(document).returning();
    return result[0];
  }

  async updateContractLegalDocument(id: string, updates: Partial<InsertContractLegalDocument>): Promise<ContractLegalDocument> {
    const result = await db.update(contractLegalDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractLegalDocuments.id, id))
      .returning();
    return result[0];
  }

  async deleteContractLegalDocument(id: string): Promise<void> {
    await db.delete(contractLegalDocuments).where(eq(contractLegalDocuments.id, id));
  }

  // Contract Term Discussion operations
  async getContractTermDiscussion(id: string): Promise<ContractTermDiscussion | undefined> {
    const result = await db.select().from(contractTermDiscussions).where(eq(contractTermDiscussions.id, id));
    return result[0];
  }

  async getContractTermDiscussions(legalDocumentId: string): Promise<ContractTermDiscussion[]> {
    return await db.select()
      .from(contractTermDiscussions)
      .where(eq(contractTermDiscussions.legalDocumentId, legalDocumentId))
      .orderBy(desc(contractTermDiscussions.createdAt));
  }

  async createContractTermDiscussion(discussion: InsertContractTermDiscussion): Promise<ContractTermDiscussion> {
    const result = await db.insert(contractTermDiscussions).values(discussion).returning();
    return result[0];
  }

  async updateContractTermDiscussion(id: string, updates: Partial<InsertContractTermDiscussion>): Promise<ContractTermDiscussion> {
    const result = await db.update(contractTermDiscussions)
      .set(updates)
      .where(eq(contractTermDiscussions.id, id))
      .returning();
    return result[0];
  }

  async resolveContractTermDiscussion(id: string, resolvedById: string): Promise<ContractTermDiscussion> {
    const result = await db.update(contractTermDiscussions)
      .set({ 
        status: 'resolved',
        resolvedById,
        resolvedAt: new Date()
      })
      .where(eq(contractTermDiscussions.id, id))
      .returning();
    return result[0];
  }

  // Contract Approval operations
  async getContractApproval(id: string): Promise<ContractApproval | undefined> {
    const result = await db.select().from(contractApprovals).where(eq(contractApprovals.id, id));
    return result[0];
  }

  async getContractApprovals(legalDocumentId: string): Promise<ContractApproval[]> {
    return await db.select()
      .from(contractApprovals)
      .where(eq(contractApprovals.legalDocumentId, legalDocumentId))
      .orderBy(desc(contractApprovals.approvedAt));
  }

  async createContractApproval(approval: InsertContractApproval): Promise<ContractApproval> {
    const result = await db.insert(contractApprovals).values(approval).returning();
    return result[0];
  }

  async getUserContractApproval(legalDocumentId: string, userId: string): Promise<ContractApproval | undefined> {
    const result = await db.select()
      .from(contractApprovals)
      .where(
        and(
          eq(contractApprovals.legalDocumentId, legalDocumentId),
          eq(contractApprovals.userId, userId)
        )
      );
    return result[0];
  }

  // Check-in Appointment operations
  async getCheckInAppointment(id: string): Promise<CheckInAppointment | undefined> {
    const result = await db.select().from(checkInAppointments).where(eq(checkInAppointments.id, id));
    return result[0];
  }

  async getCheckInAppointments(filters?: { rentalContractId?: string; status?: string }): Promise<CheckInAppointment[]> {
    const conditions = [];
    if (filters?.rentalContractId) conditions.push(eq(checkInAppointments.rentalContractId, filters.rentalContractId));
    if (filters?.status) conditions.push(eq(checkInAppointments.status, filters.status as any));
    
    return await db.select()
      .from(checkInAppointments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(checkInAppointments.scheduledDate));
  }

  async createCheckInAppointment(appointment: InsertCheckInAppointment): Promise<CheckInAppointment> {
    const result = await db.insert(checkInAppointments).values(appointment).returning();
    return result[0];
  }

  async updateCheckInAppointment(id: string, updates: Partial<InsertCheckInAppointment>): Promise<CheckInAppointment> {
    const result = await db.update(checkInAppointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(checkInAppointments.id, id))
      .returning();
    return result[0];
  }

  async completeCheckInAppointment(id: string): Promise<CheckInAppointment> {
    const result = await db.update(checkInAppointments)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(checkInAppointments.id, id))
      .returning();
    return result[0];
  }

  async cancelCheckInAppointment(id: string, cancellationReason: string): Promise<CheckInAppointment> {
    const result = await db.update(checkInAppointments)
      .set({ 
        status: 'cancelled',
        cancellationReason,
        updatedAt: new Date()
      })
      .where(eq(checkInAppointments.id, id))
      .returning();
    return result[0];
  }

  // Contract Signed Document operations
  async getContractSignedDocument(id: string): Promise<ContractSignedDocument | undefined> {
    const result = await db.select().from(contractSignedDocuments).where(eq(contractSignedDocuments.id, id));
    return result[0];
  }

  async getContractSignedDocuments(rentalContractId: string): Promise<ContractSignedDocument[]> {
    return await db.select()
      .from(contractSignedDocuments)
      .where(eq(contractSignedDocuments.rentalContractId, rentalContractId))
      .orderBy(desc(contractSignedDocuments.createdAt));
  }

  async createContractSignedDocument(document: InsertContractSignedDocument): Promise<ContractSignedDocument> {
    const result = await db.insert(contractSignedDocuments).values(document).returning();
    return result[0];
  }

  async deleteContractSignedDocument(id: string): Promise<void> {
    await db.delete(contractSignedDocuments).where(eq(contractSignedDocuments.id, id));
  }

  // ========================================
  // HOA Module Operations
  // ========================================

  // Condominium Unit operations
  async getCondominiumUnit(id: string): Promise<CondominiumUnit | undefined> {
    const result = await db.select().from(condominiumUnits).where(eq(condominiumUnits.id, id));
    return result[0];
  }

  async getCondominiumUnitsByCondominium(condominiumId: string): Promise<CondominiumUnit[]> {
    return await db.select()
      .from(condominiumUnits)
      .where(eq(condominiumUnits.condominiumId, condominiumId))
      .orderBy(condominiumUnits.unitNumber);
  }

  async getCondominiumUnitsByOwner(ownerId: string): Promise<CondominiumUnit[]> {
    return await db.select()
      .from(condominiumUnits)
      .where(eq(condominiumUnits.ownerId, ownerId))
      .orderBy(desc(condominiumUnits.createdAt));
  }

  async createCondominiumUnit(unit: InsertCondominiumUnit): Promise<CondominiumUnit> {
    const result = await db.insert(condominiumUnits).values(unit).returning();
    return result[0];
  }

  async updateCondominiumUnit(id: string, updates: Partial<InsertCondominiumUnit>): Promise<CondominiumUnit> {
    const result = await db.update(condominiumUnits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(condominiumUnits.id, id))
      .returning();
    return result[0];
  }

  async deleteCondominiumUnit(id: string): Promise<void> {
    await db.delete(condominiumUnits).where(eq(condominiumUnits.id, id));
  }

  // Condominium Fee operations
  async getCondominiumFee(id: string): Promise<CondominiumFee | undefined> {
    const result = await db.select().from(condominiumFees).where(eq(condominiumFees.id, id));
    return result[0];
  }

  async getCondominiumFeesByUnit(unitId: string): Promise<CondominiumFee[]> {
    return await db.select()
      .from(condominiumFees)
      .where(eq(condominiumFees.condominiumUnitId, unitId))
      .orderBy(desc(condominiumFees.year), desc(condominiumFees.month));
  }

  async getCondominiumFeesByStatus(status: string): Promise<CondominiumFee[]> {
    return await db.select()
      .from(condominiumFees)
      .where(eq(condominiumFees.status, status as any))
      .orderBy(condominiumFees.dueDate);
  }

  async createCondominiumFee(fee: InsertCondominiumFee): Promise<CondominiumFee> {
    const result = await db.insert(condominiumFees).values(fee).returning();
    return result[0];
  }

  async updateCondominiumFee(id: string, updates: Partial<InsertCondominiumFee>): Promise<CondominiumFee> {
    const result = await db.update(condominiumFees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(condominiumFees.id, id))
      .returning();
    return result[0];
  }

  async updateCondominiumFeeStatus(id: string, status: string): Promise<CondominiumFee> {
    const result = await db.update(condominiumFees)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(condominiumFees.id, id))
      .returning();
    return result[0];
  }

  // Condominium Fee Payment operations
  async getCondominiumFeePayment(id: string): Promise<CondominiumFeePayment | undefined> {
    const result = await db.select().from(condominiumFeePayments).where(eq(condominiumFeePayments.id, id));
    return result[0];
  }

  async getCondominiumFeePaymentsByFee(feeId: string): Promise<CondominiumFeePayment[]> {
    return await db.select()
      .from(condominiumFeePayments)
      .where(eq(condominiumFeePayments.condominiumFeeId, feeId))
      .orderBy(desc(condominiumFeePayments.paidAt));
  }

  async createCondominiumFeePayment(payment: InsertCondominiumFeePayment): Promise<CondominiumFeePayment> {
    const result = await db.insert(condominiumFeePayments).values(payment).returning();
    return result[0];
  }

  // Condominium Issue operations
  async getCondominiumIssue(id: string): Promise<CondominiumIssue | undefined> {
    const result = await db.select().from(condominiumIssues).where(eq(condominiumIssues.id, id));
    return result[0];
  }

  async getCondominiumIssuesByCondominium(condominiumId: string): Promise<CondominiumIssue[]> {
    return await db.select()
      .from(condominiumIssues)
      .where(eq(condominiumIssues.condominiumId, condominiumId))
      .orderBy(desc(condominiumIssues.createdAt));
  }

  async getCondominiumIssuesByStatus(status: string): Promise<CondominiumIssue[]> {
    return await db.select()
      .from(condominiumIssues)
      .where(eq(condominiumIssues.status, status as any))
      .orderBy(desc(condominiumIssues.createdAt));
  }

  async getCondominiumIssuesByReporter(reportedById: string): Promise<CondominiumIssue[]> {
    return await db.select()
      .from(condominiumIssues)
      .where(eq(condominiumIssues.reportedById, reportedById))
      .orderBy(desc(condominiumIssues.createdAt));
  }

  async createCondominiumIssue(issue: InsertCondominiumIssue): Promise<CondominiumIssue> {
    const result = await db.insert(condominiumIssues).values(issue).returning();
    return result[0];
  }

  async updateCondominiumIssue(id: string, updates: Partial<InsertCondominiumIssue>): Promise<CondominiumIssue> {
    const result = await db.update(condominiumIssues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(condominiumIssues.id, id))
      .returning();
    return result[0];
  }

  async updateCondominiumIssueStatus(id: string, status: string): Promise<CondominiumIssue> {
    const result = await db.update(condominiumIssues)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(condominiumIssues.id, id))
      .returning();
    return result[0];
  }

  async resolveCondominiumIssue(id: string, resolvedById: string, resolution: string): Promise<CondominiumIssue> {
    const result = await db.update(condominiumIssues)
      .set({
        status: 'resuelto',
        resolvedAt: new Date(),
        resolution,
        updatedAt: new Date()
      })
      .where(eq(condominiumIssues.id, id))
      .returning();
    return result[0];
  }

  // ========================================
  // HOA Manager System Operations
  // ========================================

  // HOA Manager Assignment operations
  async getHoaManagerAssignment(id: string): Promise<HoaManagerAssignment | undefined> {
    const result = await db.select().from(hoaManagerAssignments).where(eq(hoaManagerAssignments.id, id));
    return result[0];
  }

  async getHoaManagerAssignmentsByManager(managerId: string): Promise<HoaManagerAssignment[]> {
    return await db.select()
      .from(hoaManagerAssignments)
      .where(eq(hoaManagerAssignments.managerId, managerId))
      .orderBy(desc(hoaManagerAssignments.createdAt));
  }

  async getHoaManagerAssignmentsByCondominium(condominiumId: string): Promise<HoaManagerAssignment[]> {
    return await db.select()
      .from(hoaManagerAssignments)
      .where(eq(hoaManagerAssignments.condominiumId, condominiumId))
      .orderBy(desc(hoaManagerAssignments.createdAt));
  }

  async getHoaManagerAssignmentsByStatus(status: string): Promise<HoaManagerAssignment[]> {
    return await db.select()
      .from(hoaManagerAssignments)
      .where(eq(hoaManagerAssignments.status, status as any))
      .orderBy(desc(hoaManagerAssignments.createdAt));
  }

  async getApprovedHoaManagerByCondominium(condominiumId: string): Promise<HoaManagerAssignment | undefined> {
    const result = await db.select()
      .from(hoaManagerAssignments)
      .where(
        and(
          eq(hoaManagerAssignments.condominiumId, condominiumId),
          eq(hoaManagerAssignments.status, 'approved')
        )
      )
      .limit(1);
    return result[0];
  }

  async createHoaManagerAssignment(assignment: InsertHoaManagerAssignment): Promise<HoaManagerAssignment> {
    const result = await db.insert(hoaManagerAssignments).values(assignment).returning();
    return result[0];
  }

  async updateHoaManagerAssignment(id: string, updates: Partial<InsertHoaManagerAssignment>): Promise<HoaManagerAssignment> {
    const result = await db.update(hoaManagerAssignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hoaManagerAssignments.id, id))
      .returning();
    return result[0];
  }

  async approveHoaManagerAssignment(id: string, approvedById: string, reason?: string): Promise<HoaManagerAssignment> {
    const result = await db.update(hoaManagerAssignments)
      .set({
        status: 'approved',
        approvedById,
        approvedAt: new Date(),
        approvalReason: reason,
        updatedAt: new Date()
      })
      .where(eq(hoaManagerAssignments.id, id))
      .returning();
    return result[0];
  }

  async rejectHoaManagerAssignment(id: string, rejectedById: string, reason: string): Promise<HoaManagerAssignment> {
    const result = await db.update(hoaManagerAssignments)
      .set({
        status: 'rejected',
        rejectedById,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(hoaManagerAssignments.id, id))
      .returning();
    return result[0];
  }

  async suspendHoaManagerAssignment(id: string, suspendedById: string, reason: string): Promise<HoaManagerAssignment> {
    const result = await db.update(hoaManagerAssignments)
      .set({
        status: 'suspended',
        suspendedById,
        suspendedAt: new Date(),
        suspensionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(hoaManagerAssignments.id, id))
      .returning();
    return result[0];
  }

  // HOA Announcement operations
  async getHoaAnnouncement(id: string): Promise<HoaAnnouncement | undefined> {
    const result = await db.select().from(hoaAnnouncements).where(eq(hoaAnnouncements.id, id));
    return result[0];
  }

  async getHoaAnnouncementsByCondominium(condominiumId: string): Promise<HoaAnnouncement[]> {
    return await db.select()
      .from(hoaAnnouncements)
      .where(eq(hoaAnnouncements.condominiumId, condominiumId))
      .orderBy(desc(hoaAnnouncements.createdAt));
  }

  async getHoaAnnouncementsByManager(managerId: string): Promise<HoaAnnouncement[]> {
    return await db.select()
      .from(hoaAnnouncements)
      .where(eq(hoaAnnouncements.managerId, managerId))
      .orderBy(desc(hoaAnnouncements.createdAt));
  }

  async getActiveHoaAnnouncementsByCondominium(condominiumId: string): Promise<HoaAnnouncement[]> {
    return await db.select()
      .from(hoaAnnouncements)
      .where(
        and(
          eq(hoaAnnouncements.condominiumId, condominiumId),
          eq(hoaAnnouncements.isActive, true),
          or(
            isNull(hoaAnnouncements.expiresAt),
            gte(hoaAnnouncements.expiresAt, new Date())
          )
        )
      )
      .orderBy(desc(hoaAnnouncements.publishedAt));
  }

  async getUnreadHoaAnnouncementsForOwner(ownerId: string): Promise<HoaAnnouncement[]> {
    // Get all units owned by this owner
    const units = await this.getCondominiumUnitsByOwner(ownerId);
    if (units.length === 0) return [];

    const condominiumIds = [...new Set(units.map(u => u.condominiumId))];

    // Get active announcements for those condominiums
    const announcements = await db.select()
      .from(hoaAnnouncements)
      .where(
        and(
          inArray(hoaAnnouncements.condominiumId, condominiumIds),
          eq(hoaAnnouncements.isActive, true),
          or(
            isNull(hoaAnnouncements.expiresAt),
            gte(hoaAnnouncements.expiresAt, new Date())
          )
        )
      )
      .orderBy(desc(hoaAnnouncements.publishedAt));

    // Filter out read announcements
    const unreadAnnouncements = [];
    for (const announcement of announcements) {
      const hasRead = await this.hasOwnerReadAnnouncement(announcement.id, ownerId);
      if (!hasRead) {
        unreadAnnouncements.push(announcement);
      }
    }

    return unreadAnnouncements;
  }

  async createHoaAnnouncement(announcement: InsertHoaAnnouncement): Promise<HoaAnnouncement> {
    const result = await db.insert(hoaAnnouncements).values(announcement).returning();
    return result[0];
  }

  async updateHoaAnnouncement(id: string, updates: Partial<InsertHoaAnnouncement>): Promise<HoaAnnouncement> {
    const result = await db.update(hoaAnnouncements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hoaAnnouncements.id, id))
      .returning();
    return result[0];
  }

  async publishHoaAnnouncement(id: string): Promise<HoaAnnouncement> {
    const result = await db.update(hoaAnnouncements)
      .set({
        publishedAt: new Date(),
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(hoaAnnouncements.id, id))
      .returning();
    return result[0];
  }

  async deleteHoaAnnouncement(id: string): Promise<void> {
    await db.delete(hoaAnnouncements).where(eq(hoaAnnouncements.id, id));
  }

  // HOA Announcement Read operations
  async markHoaAnnouncementAsRead(announcementId: string, ownerId: string): Promise<HoaAnnouncementRead> {
    const result = await db.insert(hoaAnnouncementReads)
      .values({ announcementId, ownerId })
      .onConflictDoNothing()
      .returning();
    
    if (result.length > 0) {
      return result[0];
    }
    
    // If already exists, fetch it
    const existing = await db.select()
      .from(hoaAnnouncementReads)
      .where(
        and(
          eq(hoaAnnouncementReads.announcementId, announcementId),
          eq(hoaAnnouncementReads.ownerId, ownerId)
        )
      )
      .limit(1);
    return existing[0];
  }

  async getHoaAnnouncementReads(announcementId: string): Promise<HoaAnnouncementRead[]> {
    return await db.select()
      .from(hoaAnnouncementReads)
      .where(eq(hoaAnnouncementReads.announcementId, announcementId))
      .orderBy(desc(hoaAnnouncementReads.readAt));
  }

  async hasOwnerReadAnnouncement(announcementId: string, ownerId: string): Promise<boolean> {
    const result = await db.select()
      .from(hoaAnnouncementReads)
      .where(
        and(
          eq(hoaAnnouncementReads.announcementId, announcementId),
          eq(hoaAnnouncementReads.ownerId, ownerId)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  // Sidebar Menu Visibility operations
  async getSidebarMenuVisibility(role: string): Promise<SidebarMenuVisibility[]> {
    return await db.select()
      .from(sidebarMenuVisibility)
      .where(eq(sidebarMenuVisibility.role, role as any))
      .orderBy(sidebarMenuVisibility.menuItemKey);
  }

  async setSidebarMenuVisibility(visibility: InsertSidebarMenuVisibility): Promise<SidebarMenuVisibility> {
    const [result] = await db.insert(sidebarMenuVisibility)
      .values(visibility)
      .onConflictDoUpdate({
        target: [sidebarMenuVisibility.role, sidebarMenuVisibility.menuItemKey],
        set: {
          visible: visibility.visible,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async bulkSetSidebarMenuVisibility(visibilities: InsertSidebarMenuVisibility[]): Promise<SidebarMenuVisibility[]> {
    if (visibilities.length === 0) return [];
    
    const results: SidebarMenuVisibility[] = [];
    for (const visibility of visibilities) {
      const result = await this.setSidebarMenuVisibility(visibility);
      results.push(result);
    }
    return results;
  }

  async resetSidebarMenuVisibility(role: string): Promise<void> {
    await db.delete(sidebarMenuVisibility)
      .where(eq(sidebarMenuVisibility.role, role as any));
  }

  // Sidebar Menu Visibility operations (user-based)
  async getSidebarMenuVisibilityByUser(userId: string): Promise<SidebarMenuVisibilityUser[]> {
    return await db.select()
      .from(sidebarMenuVisibilityUser)
      .where(eq(sidebarMenuVisibilityUser.userId, userId))
      .orderBy(sidebarMenuVisibilityUser.menuItemKey);
  }

  async bulkSetSidebarMenuVisibilityUser(userId: string, visibilities: InsertSidebarMenuVisibilityUser[]): Promise<SidebarMenuVisibilityUser[]> {
    if (visibilities.length === 0) return [];
    
    const results: SidebarMenuVisibilityUser[] = [];
    for (const visibility of visibilities) {
      const [result] = await db.insert(sidebarMenuVisibilityUser)
        .values({ ...visibility, userId })
        .onConflictDoUpdate({
          target: [sidebarMenuVisibilityUser.userId, sidebarMenuVisibilityUser.menuItemKey],
          set: {
            visible: visibility.visible,
            updatedAt: new Date(),
          },
        })
        .returning();
      results.push(result);
    }
    return results;
  }

  async resetSidebarMenuVisibilityUser(userId: string): Promise<void> {
    await db.delete(sidebarMenuVisibilityUser)
      .where(eq(sidebarMenuVisibilityUser.userId, userId));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.role, role as any))
      .orderBy(users.firstName, users.lastName);
  }

  // System Settings operations
  async getSystemSetting(settingKey: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, settingKey))
      .limit(1);
    return setting;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select()
      .from(systemSettings)
      .orderBy(systemSettings.settingKey);
  }

  async setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [result] = await db.insert(systemSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: systemSettings.settingKey,
        set: {
          settingValue: setting.settingValue,
          description: setting.description,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async updateSystemSetting(settingKey: string, settingValue: string): Promise<SystemSetting> {
    const [result] = await db.update(systemSettings)
      .set({
        settingValue,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.settingKey, settingKey))
      .returning();
    return result;
  }

  // External Management System - Agency operations
  async getExternalAgency(id: string): Promise<ExternalAgency | undefined> {
    const [agency] = await db.select()
      .from(externalAgencies)
      .where(eq(externalAgencies.id, id))
      .limit(1);
    return agency;
  }

  async getExternalAgencies(filters?: { isActive?: boolean }): Promise<ExternalAgency[]> {
    const conditions = [];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(externalAgencies.isActive, filters.isActive));
    }
    
    return await db.select()
      .from(externalAgencies)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(externalAgencies.createdAt));
  }

  async getExternalAgenciesByCreator(createdBy: string): Promise<ExternalAgency[]> {
    return await db.select()
      .from(externalAgencies)
      .where(eq(externalAgencies.createdBy, createdBy))
      .orderBy(desc(externalAgencies.createdAt));
  }

  async getExternalAgencyByUser(userId: string): Promise<ExternalAgency | undefined> {
    const [result] = await db.select()
      .from(externalAgencies)
      .where(and(
        eq(externalAgencies.assignedToUser, userId),
        eq(externalAgencies.isActive, true)
      ));
    return result;
  }

  async createExternalAgency(agency: InsertExternalAgency): Promise<ExternalAgency> {
    const [result] = await db.insert(externalAgencies)
      .values(agency)
      .returning();
    return result;
  }

  async updateExternalAgency(id: string, updates: Partial<InsertExternalAgency>): Promise<ExternalAgency> {
    const [result] = await db.update(externalAgencies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalAgencies.id, id))
      .returning();
    return result;
  }

  async toggleExternalAgencyActive(id: string, isActive: boolean): Promise<ExternalAgency> {
    const [result] = await db.update(externalAgencies)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(externalAgencies.id, id))
      .returning();
    return result;
  }

  async deleteExternalAgency(id: string): Promise<void> {
    await db.delete(externalAgencies)
      .where(eq(externalAgencies.id, id));
  }

  // External Agency Integrations operations
  async getExternalAgencyIntegration(agencyId: string): Promise<ExternalAgencyIntegration | undefined> {
    const [integration] = await db.select()
      .from(externalAgencyIntegrations)
      .where(eq(externalAgencyIntegrations.agencyId, agencyId))
      .limit(1);
    return integration;
  }

  async upsertExternalAgencyIntegration(agencyId: string, data: Partial<InsertExternalAgencyIntegration>): Promise<ExternalAgencyIntegration> {
    const existing = await this.getExternalAgencyIntegration(agencyId);
    
    if (existing) {
      const [updated] = await db.update(externalAgencyIntegrations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(externalAgencyIntegrations.agencyId, agencyId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(externalAgencyIntegrations)
        .values({ agencyId, ...data })
        .returning();
      return created;
    }
  }

  async updateGoogleCalendarTokens(agencyId: string, tokens: {
    accessToken: string;
    refreshToken: string;
    expiry: Date;
    calendarId?: string;
  }): Promise<ExternalAgencyIntegration> {
    return this.upsertExternalAgencyIntegration(agencyId, {
      googleCalendarAccessToken: tokens.accessToken,
      googleCalendarRefreshToken: tokens.refreshToken,
      googleCalendarTokenExpiry: tokens.expiry,
      googleCalendarId: tokens.calendarId,
      googleCalendarConnectedAt: new Date(),
    });
  }

  async disconnectGoogleCalendar(agencyId: string): Promise<ExternalAgencyIntegration | undefined> {
    const existing = await this.getExternalAgencyIntegration(agencyId);
    if (!existing) return undefined;

    const [updated] = await db.update(externalAgencyIntegrations)
      .set({
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
        googleCalendarTokenExpiry: null,
        googleCalendarId: null,
        googleCalendarConnectedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(externalAgencyIntegrations.agencyId, agencyId))
      .returning();
    return updated;
  }

  async updateOpenAIConfig(agencyId: string, config: {
    apiKey?: string | null;
    useReplitIntegration?: boolean;
  }): Promise<ExternalAgencyIntegration> {
    return this.upsertExternalAgencyIntegration(agencyId, {
      openaiApiKey: config.apiKey,
      openaiUseReplitIntegration: config.useReplitIntegration,
      openaiConnectedAt: new Date(),
    });
  }

  // External Role Permissions operations
  async getExternalRolePermissions(agencyId: string): Promise<ExternalRolePermission[]> {
    return await db.select()
      .from(externalRolePermissions)
      .where(eq(externalRolePermissions.agencyId, agencyId))
      .orderBy(asc(externalRolePermissions.role), asc(externalRolePermissions.section), asc(externalRolePermissions.action));
  }

  async getExternalRolePermissionsByRole(agencyId: string, role: string): Promise<ExternalRolePermission[]> {
    return await db.select()
      .from(externalRolePermissions)
      .where(and(
        eq(externalRolePermissions.agencyId, agencyId),
        eq(externalRolePermissions.role, role)
      ))
      .orderBy(asc(externalRolePermissions.section), asc(externalRolePermissions.action));
  }

  async upsertExternalRolePermission(permission: InsertExternalRolePermission): Promise<ExternalRolePermission> {
    const existing = await db.select()
      .from(externalRolePermissions)
      .where(and(
        eq(externalRolePermissions.agencyId, permission.agencyId),
        eq(externalRolePermissions.role, permission.role),
        eq(externalRolePermissions.section, permission.section),
        eq(externalRolePermissions.action, permission.action)
      ))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(externalRolePermissions)
        .set({ allowed: permission.allowed, updatedAt: new Date() })
        .where(eq(externalRolePermissions.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(externalRolePermissions)
      .values(permission)
      .returning();
    return created;
  }

  async bulkUpsertExternalRolePermissions(permissions: InsertExternalRolePermission[]): Promise<ExternalRolePermission[]> {
    const results: ExternalRolePermission[] = [];
    for (const permission of permissions) {
      const result = await this.upsertExternalRolePermission(permission);
      results.push(result);
    }
    return results;
  }

  async deleteExternalRolePermission(agencyId: string, role: string, section: string, action: string): Promise<void> {
    await db.delete(externalRolePermissions)
      .where(and(
        eq(externalRolePermissions.agencyId, agencyId),
        eq(externalRolePermissions.role, role),
        eq(externalRolePermissions.section, section),
        eq(externalRolePermissions.action, action)
      ));
  }

  async deleteAllExternalRolePermissions(agencyId: string): Promise<void> {
    await db.delete(externalRolePermissions)
      .where(eq(externalRolePermissions.agencyId, agencyId));
  }

  // External User Permissions operations (overrides)
  async getExternalUserPermissions(agencyId: string): Promise<ExternalUserPermission[]> {
    return await db.select()
      .from(externalUserPermissions)
      .where(eq(externalUserPermissions.agencyId, agencyId))
      .orderBy(asc(externalUserPermissions.userId), asc(externalUserPermissions.section), asc(externalUserPermissions.action));
  }

  async getExternalUserPermissionsByUser(agencyId: string, userId: string): Promise<ExternalUserPermission[]> {
    return await db.select()
      .from(externalUserPermissions)
      .where(and(
        eq(externalUserPermissions.agencyId, agencyId),
        eq(externalUserPermissions.userId, userId)
      ))
      .orderBy(asc(externalUserPermissions.section), asc(externalUserPermissions.action));
  }

  async upsertExternalUserPermission(permission: InsertExternalUserPermission): Promise<ExternalUserPermission> {
    const existing = await db.select()
      .from(externalUserPermissions)
      .where(and(
        eq(externalUserPermissions.agencyId, permission.agencyId),
        eq(externalUserPermissions.userId, permission.userId),
        eq(externalUserPermissions.section, permission.section),
        eq(externalUserPermissions.action, permission.action)
      ))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(externalUserPermissions)
        .set({ allowed: permission.allowed, updatedAt: new Date() })
        .where(eq(externalUserPermissions.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(externalUserPermissions)
      .values(permission)
      .returning();
    return created;
  }

  async bulkUpsertExternalUserPermissions(permissions: InsertExternalUserPermission[]): Promise<ExternalUserPermission[]> {
    const results: ExternalUserPermission[] = [];
    for (const permission of permissions) {
      const result = await this.upsertExternalUserPermission(permission);
      results.push(result);
    }
    return results;
  }

  async deleteExternalUserPermission(agencyId: string, userId: string, section: string, action: string): Promise<void> {
    await db.delete(externalUserPermissions)
      .where(and(
        eq(externalUserPermissions.agencyId, agencyId),
        eq(externalUserPermissions.userId, userId),
        eq(externalUserPermissions.section, section),
        eq(externalUserPermissions.action, action)
      ));
  }

  async deleteAllExternalUserPermissions(agencyId: string, userId: string): Promise<void> {
    await db.delete(externalUserPermissions)
      .where(and(
        eq(externalUserPermissions.agencyId, agencyId),
        eq(externalUserPermissions.userId, userId)
      ));
  }

  // External Management System - Property operations
  async getExternalProperty(id: string): Promise<ExternalProperty | undefined> {
    const [property] = await db.select()
      .from(externalProperties)
      .where(eq(externalProperties.id, id))
      .limit(1);
    return property;
  }

  async getExternalPropertiesByAgency(agencyId: string, filters?: { status?: string }): Promise<ExternalProperty[]> {
    const conditions = [eq(externalProperties.agencyId, agencyId)];
    if (filters?.status) {
      conditions.push(eq(externalProperties.status, filters.status as any));
    }
    
    return await db.select()
      .from(externalProperties)
      .where(and(...conditions))
      .orderBy(desc(externalProperties.createdAt));
  }

  async createExternalProperty(property: InsertExternalProperty): Promise<ExternalProperty> {
    const [result] = await db.insert(externalProperties)
      .values(property)
      .returning();
    return result;
  }

  async updateExternalProperty(id: string, updates: Partial<InsertExternalProperty>): Promise<ExternalProperty> {
    const [result] = await db.update(externalProperties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalProperties.id, id))
      .returning();
    return result;
  }

  async linkExternalProperty(id: string, linkedPropertyId: string): Promise<ExternalProperty> {
    const [result] = await db.update(externalProperties)
      .set({ 
        linkedPropertyId, 
        status: 'linked',
        updatedAt: new Date() 
      })
      .where(eq(externalProperties.id, id))
      .returning();
    return result;
  }

  async deleteExternalProperty(id: string): Promise<void> {
    await db.delete(externalProperties)
      .where(eq(externalProperties.id, id));
  }

  // External Management System - Contract operations
  async getExternalRentalContract(id: string): Promise<ExternalRentalContract | undefined> {
    const [contract] = await db.select()
      .from(externalRentalContracts)
      .where(eq(externalRentalContracts.id, id))
      .limit(1);
    return contract;
  }

  async getExternalRentalContractsByAgency(agencyId: string, filters?: { status?: string }): Promise<ExternalRentalContract[]> {
    const conditions = [eq(externalRentalContracts.agencyId, agencyId)];
    if (filters?.status) {
      conditions.push(eq(externalRentalContracts.status, filters.status as any));
    }
    
    return await db.select()
      .from(externalRentalContracts)
      .where(and(...conditions))
      .orderBy(desc(externalRentalContracts.createdAt));
  }

  async getExternalRentalContractsByProperty(propertyId: string): Promise<ExternalRentalContract[]> {
    return await db.select()
      .from(externalRentalContracts)
      .where(eq(externalRentalContracts.propertyId, propertyId))
      .orderBy(desc(externalRentalContracts.createdAt));
  }

  async createExternalRentalContract(contract: InsertExternalRentalContract): Promise<ExternalRentalContract> {
    const [result] = await db.insert(externalRentalContracts)
      .values(contract)
      .returning();
    return result;
  }

  async updateExternalRentalContract(id: string, updates: Partial<InsertExternalRentalContract>): Promise<ExternalRentalContract> {
    const [result] = await db.update(externalRentalContracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalRentalContracts.id, id))
      .returning();
    return result;
  }

  async updateExternalContractStatus(id: string, status: string): Promise<ExternalRentalContract> {
    const [result] = await db.update(externalRentalContracts)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(externalRentalContracts.id, id))
      .returning();
    return result;
  }

  async deleteExternalRentalContract(id: string): Promise<void> {
    await db.delete(externalRentalContracts)
      .where(eq(externalRentalContracts.id, id));
  }

  // External Management System - Rental Notes operations
  async getExternalRentalNote(id: string): Promise<ExternalRentalNote | undefined> {
    const [note] = await db.select()
      .from(externalRentalNotes)
      .where(eq(externalRentalNotes.id, id))
      .limit(1);
    return note;
  }

  async getExternalRentalNotesByContract(contractId: string, filters?: { isArchived?: boolean; noteType?: string }): Promise<ExternalRentalNote[]> {
    const conditions = [eq(externalRentalNotes.contractId, contractId)];
    
    if (filters?.isArchived !== undefined) {
      conditions.push(eq(externalRentalNotes.isArchived, filters.isArchived));
    }
    
    if (filters?.noteType) {
      conditions.push(eq(externalRentalNotes.noteType, filters.noteType as any));
    }
    
    return await db.select()
      .from(externalRentalNotes)
      .where(and(...conditions))
      .orderBy(desc(externalRentalNotes.createdAt));
  }

  async createExternalRentalNote(note: InsertExternalRentalNote): Promise<ExternalRentalNote> {
    const [result] = await db.insert(externalRentalNotes)
      .values(note)
      .returning();
    return result;
  }

  async updateExternalRentalNote(id: string, updates: UpdateExternalRentalNote): Promise<ExternalRentalNote> {
    const [result] = await db.update(externalRentalNotes)
      .set(updates)
      .where(eq(externalRentalNotes.id, id))
      .returning();
    return result;
  }

  async getExternalMaintenanceTicketsByContract(contractId: string, filters?: { status?: string }): Promise<ExternalMaintenanceTicket[]> {
    // Get the contract to verify agency and extract metadata
    const contract = await this.getExternalRentalContract(contractId);
    if (!contract) return [];

    // Filter by contractId directly OR by unitId + agency + date range for tickets created before contractId was linked
    const conditions = [
      eq(externalMaintenanceTickets.agencyId, contract.agencyId), // Multi-tenant security
      or(
        eq(externalMaintenanceTickets.contractId, contractId), // Direct contract link
        and( // Legacy tickets linked by unit and date
          eq(externalMaintenanceTickets.unitId, contract.unitId),
          or(
            and( // Tickets with scheduledWindowStart within contract dates
              sql`${externalMaintenanceTickets.scheduledWindowStart} IS NOT NULL`,
              sql`${externalMaintenanceTickets.scheduledWindowStart} >= ${contract.startDate}`,
              sql`${externalMaintenanceTickets.scheduledWindowStart} <= ${contract.endDate}`
            ),
            and( // Tickets created within contract dates but no scheduled window
              sql`${externalMaintenanceTickets.scheduledWindowStart} IS NULL`,
              sql`${externalMaintenanceTickets.createdAt} >= ${contract.startDate}`,
              sql`${externalMaintenanceTickets.createdAt} <= ${contract.endDate}`
            )
          )
        )
      )
    ];
    
    if (filters?.status) {
      conditions.push(eq(externalMaintenanceTickets.status, filters.status as any));
    }
    
    return await db.select()
      .from(externalMaintenanceTickets)
      .where(and(...conditions))
      .orderBy(desc(externalMaintenanceTickets.createdAt));
  }

  // External Management System - Payment Schedule operations
  async getExternalPaymentSchedule(id: string): Promise<ExternalPaymentSchedule | undefined> {
    const [schedule] = await db.select()
      .from(externalPaymentSchedules)
      .where(eq(externalPaymentSchedules.id, id))
      .limit(1);
    return schedule;
  }

  async getExternalPaymentSchedulesByContract(contractId: string): Promise<ExternalPaymentSchedule[]> {
    return await db.select()
      .from(externalPaymentSchedules)
      .where(eq(externalPaymentSchedules.contractId, contractId))
      .orderBy(externalPaymentSchedules.dayOfMonth);
  }

  async getExternalPaymentSchedulesByAgency(agencyId: string, filters?: { isActive?: boolean }): Promise<ExternalPaymentSchedule[]> {
    const conditions = [eq(externalPaymentSchedules.agencyId, agencyId)];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(externalPaymentSchedules.isActive, filters.isActive));
    }
    
    return await db.select()
      .from(externalPaymentSchedules)
      .where(and(...conditions))
      .orderBy(externalPaymentSchedules.dayOfMonth);
  }

  async createExternalPaymentSchedule(schedule: InsertExternalPaymentSchedule): Promise<ExternalPaymentSchedule> {
    const [result] = await db.insert(externalPaymentSchedules)
      .values(schedule)
      .returning();
    return result;
  }

  async updateExternalPaymentSchedule(id: string, updates: Partial<InsertExternalPaymentSchedule>): Promise<ExternalPaymentSchedule> {
    const [result] = await db.update(externalPaymentSchedules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalPaymentSchedules.id, id))
      .returning();
    return result;
  }

  async toggleExternalPaymentScheduleActive(id: string, isActive: boolean): Promise<ExternalPaymentSchedule> {
    const [result] = await db.update(externalPaymentSchedules)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(externalPaymentSchedules.id, id))
      .returning();
    return result;
  }

  async deleteExternalPaymentSchedule(id: string): Promise<void> {
    await db.delete(externalPaymentSchedules)
      .where(eq(externalPaymentSchedules.id, id));
  }

  // External Management System - Payment operations
  async getExternalPayment(id: string): Promise<ExternalPayment | undefined> {
    const [payment] = await db.select()
      .from(externalPayments)
      .where(eq(externalPayments.id, id))
      .limit(1);
    return payment;
  }

  async getExternalPaymentsByContract(contractId: string, filters?: { status?: string }): Promise<ExternalPayment[]> {
    const conditions = [eq(externalPayments.contractId, contractId)];
    if (filters?.status) {
      conditions.push(eq(externalPayments.status, filters.status as any));
    }
    
    return await db.select()
      .from(externalPayments)
      .where(and(...conditions))
      .orderBy(desc(externalPayments.dueDate));
  }

  async getExternalPaymentsByAgency(agencyId: string, filters?: { status?: string; serviceType?: string }): Promise<ExternalPayment[]> {
    const conditions = [eq(externalPayments.agencyId, agencyId)];
    if (filters?.status) {
      conditions.push(eq(externalPayments.status, filters.status as any));
    }
    if (filters?.serviceType) {
      conditions.push(eq(externalPayments.serviceType, filters.serviceType as any));
    }
    
    return await db.select()
      .from(externalPayments)
      .where(and(...conditions))
      .orderBy(desc(externalPayments.dueDate));
  }

  async getUpcomingExternalPayments(agencyId: string, days: number): Promise<ExternalPayment[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await db.select()
      .from(externalPayments)
      .where(
        and(
          eq(externalPayments.agencyId, agencyId),
          eq(externalPayments.status, 'pending'),
          gte(externalPayments.dueDate, today),
          lte(externalPayments.dueDate, futureDate)
        )
      )
      .orderBy(externalPayments.dueDate);
  }

  async createExternalPayment(payment: InsertExternalPayment): Promise<ExternalPayment> {
    const [result] = await db.insert(externalPayments)
      .values(payment)
      .returning();
    return result;
  }

  async updateExternalPayment(id: string, updates: Partial<InsertExternalPayment>): Promise<ExternalPayment> {
    const [result] = await db.update(externalPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalPayments.id, id))
      .returning();
    return result;
  }

  async updateExternalPaymentStatus(id: string, status: string, paidDate?: Date): Promise<ExternalPayment> {
    const [result] = await db.update(externalPayments)
      .set({ 
        status: status as any, 
        paidDate: paidDate || null,
        updatedAt: new Date() 
      })
      .where(eq(externalPayments.id, id))
      .returning();
    return result;
  }

  async markExternalPaymentAsPaid(id: string, data: {
    paidBy: string;
    confirmedBy?: string;
    confirmedAt?: Date;
    paidDate: Date;
    paymentMethod?: string;
    paymentReference?: string;
    paymentProofUrl?: string;
    notes?: string;
  }): Promise<{ payment: ExternalPayment; transaction: ExternalFinancialTransaction }> {
    // Start a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // 1. Get the payment to access contract info
      const existingPayment = await tx.select()
        .from(externalPayments)
        .where(eq(externalPayments.id, id))
        .limit(1)
        .then(rows => rows[0]);

      if (!existingPayment) {
        throw new Error("Payment not found");
      }

      // 2. Get contract to access unit and owner info
      const contract = await tx.select()
        .from(externalRentalContracts)
        .where(eq(externalRentalContracts.id, existingPayment.contractId))
        .limit(1)
        .then(rows => rows[0]);

      if (!contract) {
        throw new Error("Contract not found");
      }

      // 3. Get unit info
      const unit = await tx.select()
        .from(externalUnits)
        .where(eq(externalUnits.id, contract.unitId!))
        .limit(1)
        .then(rows => rows[0]);

      // 4. Get active owner
      const owner = unit ? await tx.select()
        .from(externalUnitOwners)
        .where(
          and(
            eq(externalUnitOwners.unitId, unit.id),
            eq(externalUnitOwners.isActive, true)
          )
        )
        .limit(1)
        .then(rows => rows[0]) : undefined;

      // 5. Map serviceType to financial transaction category
      const categoryMap: Record<string, string> = {
        'rent': 'rent_income',
        'electricity': 'service_electricity',
        'water': 'service_water',
        'internet': 'service_internet',
        'gas': 'service_gas',
        'hoa': 'hoa_fee',
        'maintenance': 'maintenance_charge',
        'other': 'service_other',
        'special': 'service_other',
      };
      const category = categoryMap[existingPayment.serviceType] || 'service_other';

      // 6. Update payment with audit trail
      const [updatedPayment] = await tx.update(externalPayments)
        .set({
          status: 'paid',
          paidDate: data.paidDate,
          paidBy: data.paidBy,
          confirmedBy: data.confirmedBy,
          confirmedAt: data.confirmedAt,
          paymentMethod: data.paymentMethod || existingPayment.paymentMethod,
          paymentReference: data.paymentReference || existingPayment.paymentReference,
          paymentProofUrl: data.paymentProofUrl || existingPayment.paymentProofUrl,
          notes: data.notes || existingPayment.notes,
          updatedAt: new Date(),
        })
        .where(eq(externalPayments.id, id))
        .returning();

      // 7. Create or update financial transaction
      const existingTransaction = await tx.select()
        .from(externalFinancialTransactions)
        .where(eq(externalFinancialTransactions.paymentId, id))
        .limit(1)
        .then(rows => rows[0]);

      let financialTransaction: ExternalFinancialTransaction;

      if (existingTransaction) {
        // Update existing transaction
        [financialTransaction] = await tx.update(externalFinancialTransactions)
          .set({
            status: 'posted',
            performedDate: data.paidDate,
            paymentMethod: data.paymentMethod || existingTransaction.paymentMethod,
            paymentReference: data.paymentReference || existingTransaction.paymentReference,
            paymentProofUrl: data.paymentProofUrl || existingTransaction.paymentProofUrl,
            notes: data.notes || existingTransaction.notes,
            updatedAt: new Date(),
          })
          .where(eq(externalFinancialTransactions.id, existingTransaction.id))
          .returning();
      } else {
        // Create new transaction
        const grossAmount = parseFloat(existingPayment.amount);
        [financialTransaction] = await tx.insert(externalFinancialTransactions)
          .values({
            agencyId: existingPayment.agencyId,
            direction: 'inflow',
            category: category as any,
            status: 'posted',
            grossAmount: existingPayment.amount,
            fees: '0.00',
            netAmount: existingPayment.amount,
            currency: existingPayment.currency,
            dueDate: existingPayment.dueDate,
            performedDate: data.paidDate,
            payerRole: 'tenant',
            payeeRole: 'agency',
            ownerId: owner?.id,
            tenantName: contract.tenantName,
            contractId: contract.id,
            unitId: unit?.id,
            paymentId: id,
            scheduleId: existingPayment.scheduleId,
            paymentMethod: data.paymentMethod,
            paymentReference: data.paymentReference,
            paymentProofUrl: data.paymentProofUrl,
            description: `Payment: ${existingPayment.serviceType} - ${contract.tenantName}`,
            notes: data.notes,
            createdBy: data.paidBy,
          })
          .returning();
      }

      return {
        payment: updatedPayment,
        transaction: financialTransaction,
      };
    });
  }

  async markExternalPaymentReminderSent(id: string): Promise<ExternalPayment> {
    const [result] = await db.update(externalPayments)
      .set({ reminderSentAt: new Date(), updatedAt: new Date() })
      .where(eq(externalPayments.id, id))
      .returning();
    return result;
  }

  async deleteExternalPayment(id: string): Promise<void> {
    await db.delete(externalPayments)
      .where(eq(externalPayments.id, id));
  }

  async generateNextExternalPayment(paymentId: string, createdBy: string): Promise<ExternalPayment | null> {
    // Get the payment that was just paid
    const existingPayment = await this.getExternalPayment(paymentId);
    if (!existingPayment || !existingPayment.scheduleId) {
      return null;
    }

    // Get the payment schedule
    const schedule = await this.getExternalPaymentSchedule(existingPayment.scheduleId);
    if (!schedule || !schedule.isActive) {
      return null;
    }

    // Get the contract to verify it's active and check end date
    const contract = await this.getExternalRentalContract(existingPayment.contractId);
    if (!contract || contract.status !== 'active') {
      return null;
    }

    // Calculate next payment date
    const currentDueDate = new Date(existingPayment.dueDate);
    const nextMonth = currentDueDate.getMonth() + 1;
    const nextYear = nextMonth > 11 
      ? currentDueDate.getFullYear() + 1 
      : currentDueDate.getFullYear();
    const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
    
    // Get last day of next month to clamp dayOfMonth
    const lastDayOfMonth = new Date(nextYear, adjustedMonth + 1, 0).getDate();
    const clampedDay = Math.min(schedule.dayOfMonth, lastDayOfMonth);
    
    // Create next payment date at UTC midnight
    const nextPaymentDue = new Date(Date.UTC(nextYear, adjustedMonth, clampedDay, 0, 0, 0, 0));
    
    // Check if next payment would be within contract duration
    const contractEnd = new Date(contract.endDate);
    if (nextPaymentDue > contractEnd) {
      return null;
    }

    // Check if payment doesn't already exist
    const existingPayments = await db.select()
      .from(externalPayments)
      .where(
        and(
          eq(externalPayments.contractId, existingPayment.contractId),
          eq(externalPayments.scheduleId, existingPayment.scheduleId),
          eq(externalPayments.dueDate, nextPaymentDue)
        )
      )
      .limit(1);
    
    if (existingPayments.length > 0) {
      return null; // Payment already exists
    }

    // Create the next payment
    return await this.createExternalPayment({
      agencyId: existingPayment.agencyId,
      contractId: existingPayment.contractId,
      scheduleId: existingPayment.scheduleId,
      serviceType: schedule.serviceType,
      amount: schedule.amount,
      currency: schedule.currency,
      dueDate: nextPaymentDue,
      status: 'pending',
      createdBy: createdBy,
    });
  }

  // External Management System - Maintenance Ticket operations
  
  // Helper: Check if user can modify/close maintenance tickets
  canModifyMaintenanceTicket(userRole: string): boolean {
    const privilegedRoles = ['master', 'admin', 'admin_jr', 'external_agency_admin', 'external_agency_maintenance'];
    return privilegedRoles.includes(userRole);
  }

  async getExternalMaintenanceTicket(id: string): Promise<ExternalMaintenanceTicket | undefined> {
    const [ticket] = await db.select()
      .from(externalMaintenanceTickets)
      .where(eq(externalMaintenanceTickets.id, id))
      .limit(1);
    return ticket;
  }

  async getExternalMaintenanceTicketsByAgency(agencyId: string, filters?: { status?: string; priority?: string; category?: string; search?: string }): Promise<ExternalMaintenanceTicket[]> {
    const conditions = [eq(externalMaintenanceTickets.agencyId, agencyId)];
    if (filters?.status) {
      conditions.push(eq(externalMaintenanceTickets.status, filters.status as any));
    }
    if (filters?.priority) {
      conditions.push(eq(externalMaintenanceTickets.priority, filters.priority as any));
    }
    if (filters?.category) {
      conditions.push(eq(externalMaintenanceTickets.category, filters.category as any));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(externalMaintenanceTickets.title, `%${filters.search}%`),
          ilike(externalMaintenanceTickets.description, `%${filters.search}%`)
        ) as any
      );
    }
    
    return await db.select()
      .from(externalMaintenanceTickets)
      .where(and(...conditions))
      .orderBy(desc(externalMaintenanceTickets.createdAt));
  }

  async getExternalMaintenanceTicketsPaginated(agencyId: string, options: {
    limit: number;
    offset: number;
    search?: string;
    status?: string | string[];
    priority?: string;
    category?: string;
    condominiumId?: string;
    dateFilter?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: ExternalMaintenanceTicket[]; total: number }> {
    const { limit, offset, search, status, priority, category, condominiumId, dateFilter, sortField = 'createdAt', sortOrder = 'desc' } = options;
    
    // Build base conditions
    const conditions: SQL[] = [eq(externalMaintenanceTickets.agencyId, agencyId)];
    
    if (status && status !== 'all') {
      if (Array.isArray(status)) {
        conditions.push(inArray(externalMaintenanceTickets.status, status as any[]));
      } else {
        conditions.push(eq(externalMaintenanceTickets.status, status as any));
      }
    }
    if (priority && priority !== 'all') {
      conditions.push(eq(externalMaintenanceTickets.priority, priority as any));
    }
    if (category && category !== 'all') {
      conditions.push(eq(externalMaintenanceTickets.category, category as any));
    }
    
    // Filter by condominium (need to get units for that condo first)
    if (condominiumId && condominiumId !== 'all') {
      const condoUnits = await db.select({ id: externalUnits.id })
        .from(externalUnits)
        .where(eq(externalUnits.condominiumId, condominiumId));
      const unitIds = condoUnits.map(u => u.id);
      if (unitIds.length > 0) {
        conditions.push(inArray(externalMaintenanceTickets.unitId, unitIds));
      } else {
        // No units in this condo, return empty
        return { data: [], total: 0 };
      }
    }
    
    // Date filter: today means scheduled for today
    if (dateFilter === 'today') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      conditions.push(between(externalMaintenanceTickets.scheduledDate, startOfDay, endOfDay));
    }
    
    // Search filter - search in title, description
    if (search && search.trim()) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(externalMaintenanceTickets.title, searchLower),
          ilike(externalMaintenanceTickets.description, searchLower)
        )!
      );
    }
    
    const whereClause = and(...conditions);
    
    // Get total count
    const [countResult] = await db.select({ count: count() })
      .from(externalMaintenanceTickets)
      .where(whereClause);
    const total = countResult?.count || 0;
    
    // Build order by clause
    const sortFieldMap: Record<string, any> = {
      'title': externalMaintenanceTickets.title,
      'category': externalMaintenanceTickets.category,
      'priority': externalMaintenanceTickets.priority,
      'status': externalMaintenanceTickets.status,
      'created': externalMaintenanceTickets.createdAt,
      'createdAt': externalMaintenanceTickets.createdAt,
      'updated': externalMaintenanceTickets.updatedAt,
      'updatedAt': externalMaintenanceTickets.updatedAt,
      'scheduledAt': externalMaintenanceTickets.scheduledDate,
      'scheduledDate': externalMaintenanceTickets.scheduledDate,
    };
    
    const orderByField = sortFieldMap[sortField] || externalMaintenanceTickets.createdAt;
    const orderByClause = sortOrder === 'asc' ? asc(orderByField) : desc(orderByField);
    
    // Get paginated data
    const data = await db.select()
      .from(externalMaintenanceTickets)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
    
    return { data, total };
  }

  async getExternalMaintenanceTicketsByProperty(propertyId: string): Promise<ExternalMaintenanceTicket[]> {
    return await db.select()
      .from(externalMaintenanceTickets)
      .where(eq(externalMaintenanceTickets.propertyId, propertyId))
      .orderBy(desc(externalMaintenanceTickets.createdAt));
  }

  async getExternalMaintenanceTicketsByAssignee(assignedTo: string): Promise<ExternalMaintenanceTicket[]> {
    return await db.select()
      .from(externalMaintenanceTickets)
      .where(eq(externalMaintenanceTickets.assignedTo, assignedTo))
      .orderBy(desc(externalMaintenanceTickets.createdAt));
  }

  async createExternalMaintenanceTicket(ticket: InsertExternalMaintenanceTicket): Promise<ExternalMaintenanceTicket> {
    const [result] = await db.insert(externalMaintenanceTickets)
      .values(ticket)
      .returning();
    return result;
  }

  async updateExternalMaintenanceTicket(id: string, updates: Partial<InsertExternalMaintenanceTicket>): Promise<ExternalMaintenanceTicket> {
    const [result] = await db.update(externalMaintenanceTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalMaintenanceTickets.id, id))
      .returning();
    return result;
  }

  async updateExternalTicketStatus(id: string, status: string, resolvedDate?: Date): Promise<ExternalMaintenanceTicket> {
    const [result] = await db.update(externalMaintenanceTickets)
      .set({ 
        status: status as any, 
        resolvedDate: resolvedDate || null,
        updatedAt: new Date() 
      })
      .where(eq(externalMaintenanceTickets.id, id))
      .returning();
    return result;
  }

  async assignExternalTicket(id: string, assignedTo: string): Promise<ExternalMaintenanceTicket> {
    const [result] = await db.update(externalMaintenanceTickets)
      .set({ assignedTo, updatedAt: new Date() })
      .where(eq(externalMaintenanceTickets.id, id))
      .returning();
    return result;
  }

  async deleteExternalMaintenanceTicket(id: string): Promise<void> {
    await db.delete(externalMaintenanceTickets)
      .where(eq(externalMaintenanceTickets.id, id));
  }

  async getExternalMaintenanceTicketsByUnit(unitId: string): Promise<ExternalMaintenanceTicket[]> {
    return await db.select()
      .from(externalMaintenanceTickets)
      .where(eq(externalMaintenanceTickets.unitId, unitId))
      .orderBy(desc(externalMaintenanceTickets.createdAt));
  }

  // External Maintenance Updates implementation
  async getExternalMaintenanceUpdates(ticketId: string): Promise<ExternalMaintenanceUpdate[]> {
    // Join with ticket to verify agency ownership
    const results = await db.select({
      id: externalMaintenanceUpdates.id,
      ticketId: externalMaintenanceUpdates.ticketId,
      type: externalMaintenanceUpdates.type,
      notes: externalMaintenanceUpdates.notes,
      statusSnapshot: externalMaintenanceUpdates.statusSnapshot,
      prioritySnapshot: externalMaintenanceUpdates.prioritySnapshot,
      assignedToSnapshot: externalMaintenanceUpdates.assignedToSnapshot,
      createdBy: externalMaintenanceUpdates.createdBy,
      createdAt: externalMaintenanceUpdates.createdAt,
    })
      .from(externalMaintenanceUpdates)
      .innerJoin(
        externalMaintenanceTickets, 
        eq(externalMaintenanceUpdates.ticketId, externalMaintenanceTickets.id)
      )
      .where(eq(externalMaintenanceUpdates.ticketId, ticketId))
      .orderBy(desc(externalMaintenanceUpdates.createdAt));
    
    return results;
  }

  async createExternalMaintenanceUpdate(update: InsertExternalMaintenanceUpdate): Promise<ExternalMaintenanceUpdate> {
    // Verify ticket exists and belongs to user's agency
    const ticket = await this.getExternalMaintenanceTicket(update.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    const [newUpdate] = await db.insert(externalMaintenanceUpdates)
      .values(update)
      .returning();
    return newUpdate;
  }

  // External Maintenance Photos implementation
  async getExternalMaintenancePhotos(
    ticketId: string,
    filters?: { phase?: string; updateId?: string }
  ): Promise<ExternalMaintenancePhoto[]> {
    const conditions = [eq(externalMaintenancePhotos.ticketId, ticketId)];
    
    if (filters?.phase) {
      conditions.push(eq(externalMaintenancePhotos.phase, filters.phase));
    }
    
    if (filters?.updateId) {
      conditions.push(eq(externalMaintenancePhotos.updateId, filters.updateId));
    }

    // Join with ticket to verify agency ownership
    const results = await db.select({
      id: externalMaintenancePhotos.id,
      ticketId: externalMaintenancePhotos.ticketId,
      updateId: externalMaintenancePhotos.updateId,
      phase: externalMaintenancePhotos.phase,
      storageKey: externalMaintenancePhotos.storageKey,
      caption: externalMaintenancePhotos.caption,
      uploadedBy: externalMaintenancePhotos.uploadedBy,
      uploadedAt: externalMaintenancePhotos.uploadedAt,
    })
      .from(externalMaintenancePhotos)
      .innerJoin(
        externalMaintenanceTickets,
        eq(externalMaintenancePhotos.ticketId, externalMaintenanceTickets.id)
      )
      .where(and(...conditions))
      .orderBy(desc(externalMaintenancePhotos.uploadedAt));
    
    return results;
  }

  async createExternalMaintenancePhoto(photo: InsertExternalMaintenancePhoto): Promise<ExternalMaintenancePhoto> {
    // Verify ticket exists and belongs to user's agency
    const ticket = await this.getExternalMaintenanceTicket(photo.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    const [newPhoto] = await db.insert(externalMaintenancePhotos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async getExternalMaintenancePhoto(id: string): Promise<ExternalMaintenancePhoto | undefined> {
    const [result] = await db.select()
      .from(externalMaintenancePhotos)
      .where(eq(externalMaintenancePhotos.id, id))
      .limit(1);
    return result;
  }

  async updateExternalMaintenancePhoto(
    id: string,
    updates: Partial<Pick<InsertExternalMaintenancePhoto, 'phase' | 'caption'>>
  ): Promise<ExternalMaintenancePhoto> {
    const [result] = await db.update(externalMaintenancePhotos)
      .set(updates)
      .where(eq(externalMaintenancePhotos.id, id))
      .returning();
    
    if (!result) {
      throw new Error("Photo not found");
    }
    
    return result;
  }

  async deleteExternalMaintenancePhoto(id: string): Promise<void> {
    // Verify photo exists and ticket belongs to user's agency via join
    const [photo] = await db.select()
      .from(externalMaintenancePhotos)
      .innerJoin(
        externalMaintenanceTickets,
        eq(externalMaintenancePhotos.ticketId, externalMaintenanceTickets.id)
      )
      .where(eq(externalMaintenancePhotos.id, id))
      .limit(1);
    
    if (!photo) {
      throw new Error("Photo not found or access denied");
    }
    
    await db.delete(externalMaintenancePhotos)
      .where(eq(externalMaintenancePhotos.id, id));
  }

  // External Condominium operations
  async getExternalCondominium(id: string): Promise<ExternalCondominium | undefined> {
    const [result] = await db.select()
      .from(externalCondominiums)
      .where(eq(externalCondominiums.id, id));
    return result;
  }

  async getExternalCondominiumsByAgency(
    agencyId: string, 
    filters?: { isActive?: boolean; search?: string; sortField?: string; sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number }
  ): Promise<ExternalCondominium[]> {
    const conditions = [eq(externalCondominiums.agencyId, agencyId)];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(externalCondominiums.isActive, filters.isActive));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      // Sanitize search string: escape SQL LIKE wildcards and backslashes, limit length
      // Order matters: escape backslash first, then % and _
      const sanitized = filters.search
        .trim()
        .slice(0, 100); // Max 100 chars
      
      // Only add search condition if sanitized string is not empty after trimming
      if (sanitized.length > 0) {
        const escaped = sanitized
          .replace(/\\/g, '\\\\') // Escape backslashes first
          .replace(/%/g, '\\%')   // Then escape %
          .replace(/_/g, '\\_');   // Then escape _
        const searchPattern = `%${escaped}%`;
        
        // Use sql template to include ESCAPE clause for proper wildcard escaping
        const searchCondition = or(
          sql`${externalCondominiums.name} ILIKE ${searchPattern} ESCAPE '\\'`,
          sql`${externalCondominiums.address} ILIKE ${searchPattern} ESCAPE '\\'`
        );
        
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }
    
    // Filter by zone if provided
    if (filters?.zone && filters.zone.trim().length > 0) {
      conditions.push(eq(externalCondominiums.zone, filters.zone.trim()));
    }
    
    let query = db.select()
      .from(externalCondominiums)
      .where(and(...conditions));
    
    // Apply sorting
    const sortOrder = filters?.sortOrder || 'asc';
    const sortFn = sortOrder === 'asc' ? asc : desc;
    
    switch (filters?.sortField) {
      case 'name':
        query = query.orderBy(sortFn(externalCondominiums.name));
        break;
      case 'address':
        query = query.orderBy(sortFn(externalCondominiums.address));
        break;
      case 'totalUnits':
        query = query.orderBy(sortFn(externalCondominiums.totalUnits));
        break;
      case 'isActive':
        query = query.orderBy(sortFn(externalCondominiums.isActive));
        break;
      case 'createdAt':
        query = query.orderBy(sortFn(externalCondominiums.createdAt));
        break;
      default:
        query = query.orderBy(asc(externalCondominiums.name)); // Default sorting
    }
    
    // Apply pagination
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }
  
  async getExternalCondominiumsCountByAgency(
    agencyId: string,
    filters?: { isActive?: boolean; search?: string; zone?: string }
  ): Promise<number> {
    const conditions = [eq(externalCondominiums.agencyId, agencyId)];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(externalCondominiums.isActive, filters.isActive));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      // Sanitize search string: escape SQL LIKE wildcards and backslashes, limit length
      // Order matters: escape backslash first, then % and _
      const sanitized = filters.search
        .trim()
        .slice(0, 100); // Max 100 chars
      
      // Only add search condition if sanitized string is not empty after trimming
      if (sanitized.length > 0) {
        const escaped = sanitized
          .replace(/\\/g, '\\\\') // Escape backslashes first
          .replace(/%/g, '\\%')   // Then escape %
          .replace(/_/g, '\\_');   // Then escape _
        const searchPattern = `%${escaped}%`;
        
        // Use sql template to include ESCAPE clause for proper wildcard escaping
        const searchCondition = or(
          sql`${externalCondominiums.name} ILIKE ${searchPattern} ESCAPE '\\'`,
          sql`${externalCondominiums.address} ILIKE ${searchPattern} ESCAPE '\\'`
        );
        
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }
    // Filter by zone if provided
    if (filters?.zone && filters.zone.trim().length > 0) {
      conditions.push(eq(externalCondominiums.zone, filters.zone.trim()));
    }
    
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(externalCondominiums)
      .where(and(...conditions));
    
    return result[0]?.count || 0;
  }

  async getExternalDashboardSummary(agencyId: string): Promise<{
    totalCondominiums: number;
    totalUnits: number;
    activeRentals: number;
    rentalsEndingSoon: number;
    completedRentals: number;
    pendingPayments: number;
    overduePayments: number;
    paymentsNext7Days: number;
    openTickets: number;
    scheduledTicketsNext7Days: number;
    totalOwners: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    expectedMonthlyIncome: number;
    occupancyRate: number;
  }> {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      condominiumsCount,
      unitsCount,
      ownersCount,
      contractsStats,
      paymentsStats,
      ticketsStats,
      financialStats
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(externalCondominiums)
        .where(eq(externalCondominiums.agencyId, agencyId)),
      
      db.select({ count: sql<number>`count(*)::int` })
        .from(externalUnits)
        .where(eq(externalUnits.agencyId, agencyId)),
      
      db.select({ count: sql<number>`count(distinct ${externalUnitOwners.id})::int` })
        .from(externalUnitOwners)
        .innerJoin(externalUnits, eq(externalUnitOwners.unitId, externalUnits.id))
        .where(and(eq(externalUnits.agencyId, agencyId), eq(externalUnitOwners.isActive, true))),
      
      db.select({
        activeRentals: sql<number>`count(*) filter (where status = 'active' and ${sql.raw(`'${today.toISOString().split('T')[0]}'`)} between start_date and end_date)::int`,
        rentalsEndingSoon: sql<number>`count(*) filter (where status = 'active' and ${sql.raw(`'${today.toISOString().split('T')[0]}'`)} between start_date and end_date and end_date <= ${sql.raw(`'${next30Days.toISOString().split('T')[0]}'`)})::int`,
        completedRentals: sql<number>`count(*) filter (where end_date < ${sql.raw(`'${today.toISOString().split('T')[0]}'`)})::int`
      }).from(externalRentalContracts).where(eq(externalRentalContracts.agencyId, agencyId)),
      
      db.select({
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        overdue: sql<number>`count(*) filter (where status = 'overdue')::int`,
        next7Days: sql<number>`count(*) filter (where status = 'pending' and due_date >= ${sql.raw(`'${today.toISOString().split('T')[0]}'`)} and due_date <= ${sql.raw(`'${next7Days.toISOString().split('T')[0]}'`)})::int`
      }).from(externalPayments).where(eq(externalPayments.agencyId, agencyId)),
      
      db.select({
        open: sql<number>`count(*) filter (where status in ('open', 'in_progress'))::int`,
        scheduledNext7Days: sql<number>`count(*) filter (where status in ('open', 'in_progress') and scheduled_date >= ${sql.raw(`'${today.toISOString().split('T')[0]}'`)} and scheduled_date <= ${sql.raw(`'${next7Days.toISOString().split('T')[0]}'`)})::int`
      }).from(externalMaintenanceTickets).where(eq(externalMaintenanceTickets.agencyId, agencyId)),
      
      db.select({
        monthlyIncome: sql<number>`coalesce(sum(case when direction = 'inflow' and status in ('posted', 'reconciled') and due_date >= ${sql.raw(`'${monthStart.toISOString().split('T')[0]}'`)} and due_date <= ${sql.raw(`'${monthEnd.toISOString().split('T')[0]}'`)} then net_amount::numeric else 0 end), 0)::float`,
        monthlyExpenses: sql<number>`coalesce(sum(case when direction = 'outflow' and status in ('posted', 'reconciled') and due_date >= ${sql.raw(`'${monthStart.toISOString().split('T')[0]}'`)} and due_date <= ${sql.raw(`'${monthEnd.toISOString().split('T')[0]}'`)} then net_amount::numeric else 0 end), 0)::float`,
        expectedMonthlyIncome: sql<number>`coalesce(sum(case when direction = 'inflow' and due_date >= ${sql.raw(`'${monthStart.toISOString().split('T')[0]}'`)} and due_date <= ${sql.raw(`'${monthEnd.toISOString().split('T')[0]}'`)} then net_amount::numeric else 0 end), 0)::float`
      }).from(externalFinancialTransactions).where(eq(externalFinancialTransactions.agencyId, agencyId))
    ]);

    const totalUnits = unitsCount[0]?.count || 0;
    const activeRentals = contractsStats[0]?.activeRentals || 0;
    const occupancyRate = totalUnits > 0 ? Math.round((activeRentals / totalUnits) * 100) : 0;

    return {
      totalCondominiums: condominiumsCount[0]?.count || 0,
      totalUnits,
      activeRentals,
      rentalsEndingSoon: contractsStats[0]?.rentalsEndingSoon || 0,
      completedRentals: contractsStats[0]?.completedRentals || 0,
      pendingPayments: paymentsStats[0]?.pending || 0,
      overduePayments: paymentsStats[0]?.overdue || 0,
      paymentsNext7Days: paymentsStats[0]?.next7Days || 0,
      openTickets: ticketsStats[0]?.open || 0,
      scheduledTicketsNext7Days: ticketsStats[0]?.scheduledNext7Days || 0,
      totalOwners: ownersCount[0]?.count || 0,
      monthlyIncome: financialStats[0]?.monthlyIncome || 0,
      monthlyExpenses: financialStats[0]?.monthlyExpenses || 0,
      expectedMonthlyIncome: financialStats[0]?.expectedMonthlyIncome || 0,
      occupancyRate
    };
  }

  async createExternalCondominium(condominium: InsertExternalCondominium): Promise<ExternalCondominium> {
    const [result] = await db.insert(externalCondominiums)
      .values(condominium)
      .returning();
    return result;
  }

  async createCondominiumWithUnits(
    condominium: InsertExternalCondominium, 
    units: any[], 
    agencyId: string, 
    userId: string
  ): Promise<{ condominium: ExternalCondominium; units: ExternalUnit[] }> {
    return await db.transaction(async (tx) => {
      // Create condominium
      const [createdCondominium] = await tx.insert(externalCondominiums)
        .values({
          ...condominium,
          agencyId,
          createdBy: userId,
        })
        .returning();
      
      // Create all units for the condominium
      const createdUnits: ExternalUnit[] = [];
      if (units && units.length > 0) {
        const unitValues = units.map(unit => ({
          ...unit,
          condominiumId: createdCondominium.id,
          agencyId,
          createdBy: userId,
        }));
        
        const result = await tx.insert(externalUnits)
          .values(unitValues)
          .returning();
        createdUnits.push(...result);
      }
      
      return { condominium: createdCondominium, units: createdUnits };
    });
  }

  async addUnitsToCondominium(
    condominiumId: string,
    units: any[],
    agencyId: string,
    userId: string
  ): Promise<ExternalUnit[]> {
    return await db.transaction(async (tx) => {
      // Verify the condominium exists and belongs to the agency
      const [condominium] = await tx.select().from(externalCondominiums).where(
          and(
            eq(externalCondominiums.id, condominiumId),
            eq(externalCondominiums.agencyId, agencyId)
          )
        );
      
      if (!condominium) {
        throw new Error('Condominium not found or does not belong to this agency');
      }
      
      // Create all units for the existing condominium
      const createdUnits: ExternalUnit[] = [];
      if (units && units.length > 0) {
        const unitValues = units.map(unit => ({
          ...unit,
          condominiumId,
          agencyId,
          createdBy: userId,
        }));
        
        const result = await tx.insert(externalUnits)
          .values(unitValues)
          .returning();
        createdUnits.push(...result);
      }
      
      return createdUnits;
    });
  }

  async updateExternalCondominium(id: string, updates: Partial<InsertExternalCondominium>): Promise<ExternalCondominium> {
    const [result] = await db.update(externalCondominiums)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalCondominiums.id, id))
      .returning();
    return result;
  }

  async deleteExternalCondominium(id: string): Promise<void> {
    await db.delete(externalCondominiums)
      .where(eq(externalCondominiums.id, id));
  }

  // External Unit operations
  async getExternalUnit(id: string): Promise<ExternalUnit | undefined> {
    const [result] = await db.select()
      .from(externalUnits)
      .where(eq(externalUnits.id, id));
    return result;
  }

  async getExternalUnitsByAgency(agencyId: string, filters?: { isActive?: boolean; condominiumId?: string; search?: string; zone?: string; typology?: string; sortField?: string; sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number }): Promise<ExternalUnitWithCondominium[]> {
    const conditions: any[] = [eq(externalUnits.agencyId, agencyId)];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(externalUnits.isActive, filters.isActive));
    }
    if (filters?.condominiumId) {
      conditions.push(eq(externalUnits.condominiumId, filters.condominiumId));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const sanitized = filters.search.trim().slice(0, 100);
      if (sanitized.length > 0) {
        const escaped = sanitized
          .replace(/\\/g, '\\\\')
          .replace(/%/g, '\\%')
          .replace(/_/g, '\\_');
        const searchPattern = `%${escaped}%`;
        const searchCondition = or(
          sql`${externalUnits.unitNumber} ILIKE ${searchPattern} ESCAPE '\\'`,
          sql`${externalCondominiums.name} ILIKE ${searchPattern} ESCAPE '\\'`
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }

    // Filter by zone if provided
    if (filters?.zone && filters.zone.trim().length > 0) {
      conditions.push(eq(externalUnits.zone, filters.zone.trim()));
    }
    // Filter by typology if provided
    if (filters?.typology && filters.typology.trim().length > 0) {
      conditions.push(eq(externalUnits.typology, filters.typology.trim()));
    }
    let query = db.select({
      id: externalUnits.id,
      agencyId: externalUnits.agencyId,
      condominiumId: externalUnits.condominiumId,
      unitNumber: externalUnits.unitNumber,
      propertyType: externalUnits.propertyType,
      typology: externalUnits.typology,
      bedrooms: externalUnits.bedrooms,
      bathrooms: externalUnits.bathrooms,
      area: externalUnits.area,
      floor: externalUnits.floor,
      airbnbPhotosLink: externalUnits.airbnbPhotosLink,
      isActive: externalUnits.isActive,
      notes: externalUnits.notes,
      createdBy: externalUnits.createdBy,
      createdAt: externalUnits.createdAt,
      updatedAt: externalUnits.updatedAt,
      zone: externalUnits.zone,
      condominium: {
        id: externalCondominiums.id,
        name: externalCondominiums.name,
        address: externalCondominiums.address,
      }
    })
      .from(externalUnits)
      .leftJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
      .where(and(...conditions));
    
    // Apply sorting
    const sortOrder = filters?.sortOrder || 'asc';
    const sortFn = sortOrder === 'asc' ? asc : desc;
    
    switch (filters?.sortField) {
      case 'unitNumber':
        query = query.orderBy(sortFn(externalUnits.unitNumber));
        break;
      case 'condominium':
        query = query.orderBy(sortFn(externalCondominiums.name));
        break;
      case 'propertyType':
        query = query.orderBy(sortFn(externalUnits.propertyType));
        break;
      case 'isActive':
        query = query.orderBy(sortFn(externalUnits.isActive));
        break;
      default:
        query = query.orderBy(asc(externalCondominiums.name), asc(externalUnits.unitNumber));
    }
    
    // Apply pagination
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset);
    }
    
    const results = await query;
    return results as ExternalUnitWithCondominium[];
  }

  async getExternalUnitsCountByAgency(agencyId: string, filters?: { isActive?: boolean; condominiumId?: string; search?: string; zone?: string; typology?: string }): Promise<number> {
    const conditions: any[] = [eq(externalUnits.agencyId, agencyId)];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(externalUnits.isActive, filters.isActive));
    }
    if (filters?.condominiumId) {
      conditions.push(eq(externalUnits.condominiumId, filters.condominiumId));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const sanitized = filters.search.trim().slice(0, 100);
      if (sanitized.length > 0) {
        const escaped = sanitized
          .replace(/\\/g, '\\\\')
          .replace(/%/g, '\\%')
          .replace(/_/g, '\\_');
        const searchPattern = `%${escaped}%`;
        const searchCondition = or(
          sql`${externalUnits.unitNumber} ILIKE ${searchPattern} ESCAPE '\\'`,
          sql`${externalCondominiums.name} ILIKE ${searchPattern} ESCAPE '\\'`
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }
    if (filters?.zone) {
      conditions.push(eq(externalUnits.zone, filters.zone));
    }
    if (filters?.typology) {
      conditions.push(eq(externalUnits.typology, filters.typology));
    }
    
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(externalUnits)
      .leftJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
      .where(and(...conditions));
    
    return result[0]?.count || 0;
  }

  async getExternalUnitsByCondominium(condominiumId: string): Promise<ExternalUnit[]> {
    return await db.select()
      .from(externalUnits)
      .where(eq(externalUnits.condominiumId, condominiumId))
      .orderBy(externalUnits.unitNumber);
  }

  async createExternalUnit(unit: InsertExternalUnit): Promise<ExternalUnit> {
    const [result] = await db.insert(externalUnits)
      .values(unit)
      .returning();
    return result;
  }

  async updateExternalUnit(id: string, updates: Partial<InsertExternalUnit>): Promise<ExternalUnit> {
    const [result] = await db.update(externalUnits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalUnits.id, id))
      .returning();
    return result;
  }

  async deleteExternalUnit(id: string): Promise<void> {
    await db.delete(externalUnits)
      .where(eq(externalUnits.id, id));
  }

  // External Unit Owner operations
  async getExternalUnitOwner(id: string): Promise<ExternalUnitOwner | undefined> {
    const [result] = await db.select()
      .from(externalUnitOwners)
      .where(eq(externalUnitOwners.id, id));
    return result;
  }

  async getExternalUnitOwnersByUnit(unitId: string): Promise<ExternalUnitOwner[]> {
    return await db.select()
      .from(externalUnitOwners)
      .where(eq(externalUnitOwners.unitId, unitId))
      .orderBy(desc(externalUnitOwners.isActive), desc(externalUnitOwners.createdAt));
  }

  async getExternalOwnersByAgency(agencyId: string): Promise<any[]> {
    // Optimized: Single query to get all owners with their unit info for an agency
    const result = await db
      .select({
        owner: externalUnitOwners,
        unit: externalUnits,
      })
      .from(externalUnitOwners)
      .innerJoin(externalUnits, eq(externalUnitOwners.unitId, externalUnits.id))
      .where(eq(externalUnits.agencyId, agencyId))
      .orderBy(desc(externalUnitOwners.isActive), desc(externalUnitOwners.createdAt));
    
    // Flatten the result to match expected format
    return result.map(r => ({
      ...r.owner,
      unit: r.unit
    }));
  }

  async getActiveExternalUnitOwner(unitId: string): Promise<ExternalUnitOwner | undefined> {
    const [result] = await db.select()
      .from(externalUnitOwners)
      .where(and(
        eq(externalUnitOwners.unitId, unitId),
        eq(externalUnitOwners.isActive, true)
      ));
    return result;
  }

  async createExternalUnitOwner(owner: InsertExternalUnitOwner): Promise<ExternalUnitOwner> {
    const [result] = await db.insert(externalUnitOwners)
      .values(owner)
      .returning();
    return result;
  }

  async updateExternalUnitOwner(id: string, updates: Partial<InsertExternalUnitOwner>): Promise<ExternalUnitOwner> {
    const [result] = await db.update(externalUnitOwners)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalUnitOwners.id, id))
      .returning();
    return result;
  }

  async setActiveExternalUnitOwner(unitId: string, ownerId: string): Promise<ExternalUnitOwner> {
    // Deactivate all owners for this unit
    await db.update(externalUnitOwners)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(externalUnitOwners.unitId, unitId));

    // Activate the specified owner
    const [result] = await db.update(externalUnitOwners)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(externalUnitOwners.id, ownerId))
      .returning();
    return result;
  }

  async deleteExternalUnitOwner(id: string): Promise<void> {
    await db.delete(externalUnitOwners)
      .where(eq(externalUnitOwners.id, id));
  }

  // External Unit Access Control operations
  async getExternalUnitAccessControl(id: string): Promise<ExternalUnitAccessControl | undefined> {
    const [result] = await db.select()
      .from(externalUnitAccessControls)
      .where(eq(externalUnitAccessControls.id, id));
    return result;
  }

  async getExternalUnitAccessControlsByUnit(unitId: string, filters?: { isActive?: boolean }): Promise<ExternalUnitAccessControl[]> {
    const conditions: any[] = [eq(externalUnitAccessControls.unitId, unitId)];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(externalUnitAccessControls.isActive, filters.isActive));
    }

    return await db.select()
      .from(externalUnitAccessControls)
      .where(and(...conditions))
      .orderBy(externalUnitAccessControls.accessType);
  }

  async createExternalUnitAccessControl(control: InsertExternalUnitAccessControl): Promise<ExternalUnitAccessControl> {
    const [result] = await db.insert(externalUnitAccessControls)
      .values(control)
      .returning();
    return result;
  }

  async updateExternalUnitAccessControl(id: string, updates: Partial<InsertExternalUnitAccessControl>): Promise<ExternalUnitAccessControl> {
    const [result] = await db.update(externalUnitAccessControls)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalUnitAccessControls.id, id))
      .returning();
    return result;
  }

  async deleteExternalUnitAccessControl(id: string): Promise<void> {
    await db.delete(externalUnitAccessControls)
      .where(eq(externalUnitAccessControls.id, id));
  }

  // External Management System - Check-Out Report operations
  async getExternalCheckoutReport(id: string): Promise<ExternalCheckoutReport | undefined> {
    const [report] = await db.select()
      .from(externalCheckoutReports)
      .where(eq(externalCheckoutReports.id, id))
      .limit(1);
    return report;
  }

  async getExternalCheckoutReportByContract(contractId: string): Promise<ExternalCheckoutReport | undefined> {
    const [report] = await db.select()
      .from(externalCheckoutReports)
      .where(eq(externalCheckoutReports.contractId, contractId))
      .limit(1);
    return report;
  }

  async getExternalCheckoutReportsByAgency(agencyId: string, filters?: { status?: string }): Promise<ExternalCheckoutReport[]> {
    let query = db.select()
      .from(externalCheckoutReports)
      .where(eq(externalCheckoutReports.agencyId, agencyId))
      .orderBy(desc(externalCheckoutReports.createdAt));

    if (filters?.status) {
      query = query.where(eq(externalCheckoutReports.status, filters.status)) as any;
    }

    return await query;
  }

  async createExternalCheckoutReport(report: InsertExternalCheckoutReport): Promise<ExternalCheckoutReport> {
    const [result] = await db.insert(externalCheckoutReports)
      .values({
        ...report,
        id: crypto.randomUUID(),
      })
      .returning();
    return result;
  }

  async updateExternalCheckoutReport(id: string, updates: Partial<InsertExternalCheckoutReport>): Promise<ExternalCheckoutReport> {
    const [result] = await db.update(externalCheckoutReports)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(externalCheckoutReports.id, id))
      .returning();
    return result;
  }

  async completeExternalCheckoutReport(id: string): Promise<ExternalCheckoutReport> {
    const [result] = await db.update(externalCheckoutReports)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(externalCheckoutReports.id, id))
      .returning();
    return result;
  }

  async deleteExternalCheckoutReport(id: string): Promise<void> {
    await db.delete(externalCheckoutReports)
      .where(eq(externalCheckoutReports.id, id));
  }

  // External Client operations
  async getExternalClient(id: string): Promise<ExternalClient | undefined> {
    const [client] = await db.select()
      .from(externalClients)
      .where(eq(externalClients.id, id))
      .limit(1);
    return client;
  }

  async getExternalClientsByAgency(
    agencyId: string, 
    filters?: { status?: string; isVerified?: boolean; search?: string; sortField?: string; sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number }
  ): Promise<ExternalClient[]> {
    const conditions = [eq(externalClients.agencyId, agencyId)];
    
    if (filters?.status) {
      conditions.push(eq(externalClients.status, filters.status));
    }
    if (filters?.isVerified !== undefined) {
      conditions.push(eq(externalClients.isVerified, filters.isVerified));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      // Sanitize search string: escape SQL LIKE wildcards and backslashes, limit length
      // Normalize to lowercase once to match GIN trigram indexes
      const sanitized = filters.search
        .trim()
        .toLowerCase() // Normalize to lowercase
        .slice(0, 100) // Max 100 chars
        .replace(/\\/g, '\\\\') // Escape backslashes first
        .replace(/%/g, '\\%')   // Then escape %
        .replace(/_/g, '\\_');   // Then escape _
      const searchPattern = `%${sanitized}%`;
      conditions.push(
        or(
          sql`lower(${externalClients.firstName}) LIKE ${searchPattern} ESCAPE '\\'`,
          sql`lower(${externalClients.lastName}) LIKE ${searchPattern} ESCAPE '\\'`,
          sql`lower(${externalClients.email}) LIKE ${searchPattern} ESCAPE '\\'`,
          sql`lower(${externalClients.phone}) LIKE ${searchPattern} ESCAPE '\\'`
        )!
      );
    }
    
    let query = db.select()
      .from(externalClients)
      .where(and(...conditions));
    
    // Apply sorting
    const sortOrder = filters?.sortOrder || 'desc';
    const sortFn = sortOrder === 'asc' ? asc : desc;
    
    switch (filters?.sortField) {
      case 'name':
        query = query.orderBy(sortFn(externalClients.firstName), sortFn(externalClients.lastName));
        break;
      case 'email':
        query = query.orderBy(sortFn(externalClients.email));
        break;
      case 'phone':
        query = query.orderBy(sortFn(externalClients.phone));
        break;
      case 'status':
        query = query.orderBy(sortFn(externalClients.status));
        break;
      case 'createdAt':
      default:
        query = query.orderBy(sortFn(externalClients.createdAt));
        break;
    }
    
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }
  
  async getExternalClientsCountByAgency(
    agencyId: string,
    filters?: { status?: string; isVerified?: boolean; search?: string }
  ): Promise<number> {
    const conditions = [eq(externalClients.agencyId, agencyId)];
    
    if (filters?.status) {
      conditions.push(eq(externalClients.status, filters.status));
    }
    if (filters?.isVerified !== undefined) {
      conditions.push(eq(externalClients.isVerified, filters.isVerified));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      // Sanitize search string: escape SQL LIKE wildcards and backslashes, limit length
      // Normalize to lowercase once to match GIN trigram indexes
      const sanitized = filters.search
        .trim()
        .toLowerCase() // Normalize to lowercase
        .slice(0, 100) // Max 100 chars
        .replace(/\\/g, '\\\\') // Escape backslashes first
        .replace(/%/g, '\\%')   // Then escape %
        .replace(/_/g, '\\_');   // Then escape _
      const searchPattern = `%${sanitized}%`;
      conditions.push(
        or(
          sql`lower(${externalClients.firstName}) LIKE ${searchPattern} ESCAPE '\\'`,
          sql`lower(${externalClients.lastName}) LIKE ${searchPattern} ESCAPE '\\'`,
          sql`lower(${externalClients.email}) LIKE ${searchPattern} ESCAPE '\\'`,
          sql`lower(${externalClients.phone}) LIKE ${searchPattern} ESCAPE '\\'`
        )!
      );
    }
    
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(externalClients)
      .where(and(...conditions));
    
    return result[0]?.count || 0;
  }

  async createExternalClient(client: InsertExternalClient): Promise<ExternalClient> {
    const [result] = await db.insert(externalClients)
      .values({
        ...client,
        id: crypto.randomUUID(),
      })
      .returning();
    return result;
  }

  async updateExternalClient(id: string, updates: Partial<InsertExternalClient>): Promise<ExternalClient> {
    const [result] = await db.update(externalClients)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(externalClients.id, id))
      .returning();
    return result;
  }

  async deleteExternalClient(id: string): Promise<void> {
    await db.delete(externalClients)
      .where(eq(externalClients.id, id));
  }

  // External Leads operations
  async getExternalLead(id: string): Promise<ExternalLead | undefined> {
    const [lead] = await db.select()
      .from(externalLeads)
      .where(eq(externalLeads.id, id))
      .limit(1);
    return lead;
  }

  async getExternalLeadsByAgency(
    agencyId: string, 
    filters?: { status?: string; registrationType?: string; sellerId?: string; expiringDays?: number; search?: string; sortField?: string; sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number }
  ): Promise<ExternalLead[]> {
    const conditions = [eq(externalLeads.agencyId, agencyId)];
    
    if (filters?.status) {
      conditions.push(eq(externalLeads.status, filters.status));
    }
    if (filters?.registrationType) {
      conditions.push(eq(externalLeads.registrationType, filters.registrationType));
    }
    if (filters?.sellerId) {
      conditions.push(or(eq(externalLeads.sellerId, filters.sellerId), eq(externalLeads.assignedSellerId, filters.sellerId))!);
    }
    if (filters?.expiringDays) {
      const EXPIRY_DAYS = 90;
      const now = new Date();
      const expiryCheckDate = new Date(now.getTime() - (EXPIRY_DAYS - filters.expiringDays) * 24 * 60 * 60 * 1000);
      conditions.push(gte(externalLeads.createdAt, expiryCheckDate));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const sanitized = filters.search
        .trim()
        .slice(0, 100)
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      const searchPattern = `%${sanitized}%`;
      conditions.push(
        or(
          ilike(externalLeads.firstName, searchPattern),
          ilike(externalLeads.lastName, searchPattern),
          ilike(externalLeads.email, searchPattern),
          ilike(externalLeads.phone, searchPattern),
          ilike(externalLeads.phoneLast4, searchPattern)
        )!
      );
    }
    
    let query = db.select()
      .from(externalLeads)
      .where(and(...conditions));
    
    const sortOrder = filters?.sortOrder || 'desc';
    const sortFn = sortOrder === 'asc' ? asc : desc;
    
    switch (filters?.sortField) {
      case 'name':
        query = query.orderBy(sortFn(externalLeads.firstName), sortFn(externalLeads.lastName));
        break;
      case 'status':
        query = query.orderBy(sortFn(externalLeads.status));
        break;
      case 'registrationType':
        query = query.orderBy(sortFn(externalLeads.registrationType));
        break;
      case 'createdAt':
      default:
        query = query.orderBy(sortFn(externalLeads.createdAt));
        break;
    }
    
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }
  
  async getExternalLeadsCountByAgency(
    agencyId: string,
    filters?: { status?: string; registrationType?: string; sellerId?: string; expiringDays?: number; search?: string }
  ): Promise<number> {
    const conditions = [eq(externalLeads.agencyId, agencyId)];
    
    if (filters?.status) {
      conditions.push(eq(externalLeads.status, filters.status));
    }
    if (filters?.registrationType) {
      conditions.push(eq(externalLeads.registrationType, filters.registrationType));
    }
    if (filters?.sellerId) {
      conditions.push(or(eq(externalLeads.sellerId, filters.sellerId), eq(externalLeads.assignedSellerId, filters.sellerId))!);
    }
    if (filters?.expiringDays) {
      const EXPIRY_DAYS = 90;
      const now = new Date();
      const expiryCheckDate = new Date(now.getTime() - (EXPIRY_DAYS - filters.expiringDays) * 24 * 60 * 60 * 1000);
      conditions.push(gte(externalLeads.createdAt, expiryCheckDate));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const sanitized = filters.search
        .trim()
        .slice(0, 100)
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      const searchPattern = `%${sanitized}%`;
      conditions.push(
        or(
          ilike(externalLeads.firstName, searchPattern),
          ilike(externalLeads.lastName, searchPattern),
          ilike(externalLeads.email, searchPattern),
          ilike(externalLeads.phone, searchPattern),
          ilike(externalLeads.phoneLast4, searchPattern)
        )!
      );
    }
    
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(externalLeads)
      .where(and(...conditions));
    
    return result[0]?.count || 0;
  }
  async createExternalLead(lead: InsertExternalLead): Promise<ExternalLead> {
    const [result] = await db.insert(externalLeads)
      .values({
        ...lead,
        id: crypto.randomUUID(),
      })
      .returning();
    return result;
  }

  async updateExternalLead(id: string, updates: Partial<InsertExternalLead>): Promise<ExternalLead> {
    const [result] = await db.update(externalLeads)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(externalLeads.id, id))
      .returning();
    return result;
  }

  async deleteExternalLead(id: string): Promise<void> {
    await db.delete(externalLeads)
      .where(eq(externalLeads.id, id));
  }

  async convertLeadToClient(leadId: string, clientId: string): Promise<void> {
    await db.update(externalLeads)
      .set({
        status: 'converted',
        convertedToClientId: clientId,
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(externalLeads.id, leadId));
  }

  async checkExternalClientDuplicate(
    agencyId: string, 
    firstName: string, 
    lastName: string, 
    phone?: string | null, 
    excludeId?: string
  ): Promise<ExternalClient | null> {
    const { normalizeName, extractLast4Digits } = await import('./utils/duplicateDetection');
    
    const normalizedFirst = normalizeName(firstName);
    const normalizedLast = normalizeName(lastName);
    const last4 = extractLast4Digits(phone);
    
    if (!last4 || last4.length !== 4) {
      return null; // Can't check without valid phone last 4 digits
    }
    
    // Get all clients for this agency
    const clients = await db.select()
      .from(externalClients)
      .where(eq(externalClients.agencyId, agencyId));
    
    // Check for duplicates by comparing normalized names and last 4 digits
    for (const client of clients) {
      if (excludeId && client.id === excludeId) continue;
      
      const clientFirst = normalizeName(client.firstName);
      const clientLast = normalizeName(client.lastName);
      const clientLast4 = extractLast4Digits(client.phone);
      
      if (clientFirst === normalizedFirst && 
          clientLast === normalizedLast && 
          clientLast4 === last4) {
        return client;
      }
    }
    
    return null;
  }

  async checkExternalLeadDuplicate(
    agencyId: string, 
    firstName: string, 
    lastName: string, 
    phoneOrLast4?: string | null, 
    excludeId?: string
  ): Promise<ExternalLead | null> {
    const result = await this.checkExternalLeadDuplicateWithExpiry(agencyId, firstName, lastName, phoneOrLast4, excludeId);
    return result?.lead || null;
  }

  async checkExternalLeadDuplicateWithExpiry(
    agencyId: string, 
    firstName: string, 
    lastName: string, 
    phoneOrLast4?: string | null, 
    excludeId?: string
  ): Promise<{ lead: ExternalLead; isExpired: boolean; daysRemaining: number; sellerName: string | null; sellerId: string | null } | null> {
    const { normalizeName, extractLast4Digits } = await import('./utils/duplicateDetection');
    
    const normalizedFirst = normalizeName(firstName);
    const normalizedLast = normalizeName(lastName);
    const last4 = extractLast4Digits(phoneOrLast4);
    
    if (!last4 || last4.length !== 4) {
      return null;
    }
    
    const leads = await db.select()
      .from(externalLeads)
      .where(eq(externalLeads.agencyId, agencyId));
    
    const EXPIRY_DAYS = 90;
    const now = new Date();
    
    for (const lead of leads) {
      if (excludeId && lead.id === excludeId) continue;
      
      const leadFirst = normalizeName(lead.firstName);
      const leadLast = normalizeName(lead.lastName);
      const leadLast4 = lead.phoneLast4 || extractLast4Digits(lead.phone);
      
      if (leadFirst === normalizedFirst && 
          leadLast === normalizedLast && 
          leadLast4 === last4) {
        
        const createdAt = new Date(lead.createdAt);
        const expiryDate = new Date(createdAt.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
        const isExpired = now > expiryDate;
        
        let sellerName: string | null = null;
        if (lead.sellerId) {
          const seller = await db.select({ firstName: users.firstName, lastName: users.lastName })
            .from(users)
            .where(eq(users.id, lead.sellerId))
            .limit(1);
          if (seller.length > 0) {
            sellerName = `${seller[0].firstName} ${seller[0].lastName}`;
          }
        } else if (lead.sellerName) {
          sellerName = lead.sellerName;
        }
        
        return {
          lead,
          isExpired,
          daysRemaining,
          sellerName,
          sellerId: lead.sellerId,
        };
      }
    }
    
    return null;
  }

  // External Lead Registration Tokens operations
  async getExternalLeadRegistrationToken(token: string): Promise<ExternalLeadRegistrationToken | undefined> {
    const [result] = await db.select()
      .from(externalLeadRegistrationTokens)
      .where(eq(externalLeadRegistrationTokens.token, token))
      .limit(1);
    return result;
  }

  async getExternalLeadRegistrationTokensByAgency(agencyId: string): Promise<ExternalLeadRegistrationToken[]> {
    return await db.select()
      .from(externalLeadRegistrationTokens)
      .where(eq(externalLeadRegistrationTokens.agencyId, agencyId))
      .orderBy(desc(externalLeadRegistrationTokens.createdAt));
  }

  async createExternalLeadRegistrationToken(tokenData: InsertExternalLeadRegistrationToken): Promise<ExternalLeadRegistrationToken> {
    const [result] = await db.insert(externalLeadRegistrationTokens)
      .values({
        ...tokenData,
        id: crypto.randomUUID(),
      })
      .returning();
    return result;
  }

  async completeExternalLeadRegistrationToken(tokenId: string, leadId: string): Promise<void> {
    await db.update(externalLeadRegistrationTokens)
      .set({
        completedAt: new Date(),
        leadId,
        updatedAt: new Date(),
      })
      .where(eq(externalLeadRegistrationTokens.id, tokenId));
  }

  async deleteExternalLeadRegistrationToken(id: string): Promise<void> {
    await db.delete(externalLeadRegistrationTokens)
      .where(eq(externalLeadRegistrationTokens.id, id));
  }

  // External Client Documents operations
  async getExternalClientDocuments(clientId: string): Promise<ExternalClientDocument[]> {
    return await db.select()
      .from(externalClientDocuments)
      .where(eq(externalClientDocuments.clientId, clientId))
      .orderBy(desc(externalClientDocuments.uploadedAt));
  }

  async getExternalClientDocument(id: string): Promise<ExternalClientDocument | undefined> {
    const [document] = await db.select()
      .from(externalClientDocuments)
      .where(eq(externalClientDocuments.id, id))
      .limit(1);
    return document;
  }

  async createExternalClientDocument(document: InsertExternalClientDocument): Promise<ExternalClientDocument> {
    const [created] = await db.insert(externalClientDocuments)
      .values(document)
      .returning();
    return created;
  }

  async deleteExternalClientDocument(id: string): Promise<void> {
    await db.delete(externalClientDocuments)
      .where(eq(externalClientDocuments.id, id));
  }

  // External Client Incidents operations
  async getExternalClientIncidents(clientId: string, filters?: { severity?: string; status?: string }): Promise<ExternalClientIncident[]> {
    let query = db.select()
      .from(externalClientIncidents)
      .where(eq(externalClientIncidents.clientId, clientId));

    if (filters?.severity) {
      query = query.where(eq(externalClientIncidents.severity, filters.severity as any));
    }
    if (filters?.status) {
      query = query.where(eq(externalClientIncidents.status, filters.status as any));
    }

    return await query.orderBy(desc(externalClientIncidents.occurredAt));
  }

  async getExternalClientIncident(id: string): Promise<ExternalClientIncident | undefined> {
    const [incident] = await db.select()
      .from(externalClientIncidents)
      .where(eq(externalClientIncidents.id, id))
      .limit(1);
    return incident;
  }

  async createExternalClientIncident(incident: InsertExternalClientIncident): Promise<ExternalClientIncident> {
    const [created] = await db.insert(externalClientIncidents)
      .values(incident)
      .returning();
    return created;
  }

  async updateExternalClientIncident(id: string, updates: UpdateExternalClientIncident): Promise<ExternalClientIncident> {
    const [updated] = await db.update(externalClientIncidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalClientIncidents.id, id))
      .returning();
    return updated;
  }

  async deleteExternalClientIncident(id: string): Promise<void> {
    await db.delete(externalClientIncidents)
      .where(eq(externalClientIncidents.id, id));
  }

  // CRM - Lead Activities
  async getExternalLeadActivities(leadId: string): Promise<ExternalLeadActivity[]> {
    const activities = await db.select()
      .from(externalLeadActivities)
      .where(eq(externalLeadActivities.leadId, leadId))
      .orderBy(desc(externalLeadActivities.createdAt));
    return activities;
  }

  async createExternalLeadActivity(activity: InsertExternalLeadActivity): Promise<ExternalLeadActivity> {
    const [created] = await db.insert(externalLeadActivities)
      .values(activity)
      .returning();
    return created;
  }

  // CRM - Lead Status History
  async getExternalLeadStatusHistory(leadId: string): Promise<ExternalLeadStatusHistory[]> {
    const history = await db.select()
      .from(externalLeadStatusHistory)
      .where(eq(externalLeadStatusHistory.leadId, leadId))
      .orderBy(desc(externalLeadStatusHistory.changedAt));
    return history;
  }

  async createExternalLeadStatusHistory(history: InsertExternalLeadStatusHistory): Promise<ExternalLeadStatusHistory> {
    const [created] = await db.insert(externalLeadStatusHistory)
      .values(history)
      .returning();
    return created;
  }

  // CRM - Lead Showings
  async getExternalLeadShowings(leadId: string): Promise<ExternalLeadShowing[]> {
    const showings = await db.select()
      .from(externalLeadShowings)
      .where(eq(externalLeadShowings.leadId, leadId))
      .orderBy(desc(externalLeadShowings.scheduledAt));
    return showings;
  }

  async getExternalLeadShowing(id: string): Promise<ExternalLeadShowing | undefined> {
    const [showing] = await db.select()
      .from(externalLeadShowings)
      .where(eq(externalLeadShowings.id, id))
      .limit(1);
    return showing;
  }

  async getExternalLeadShowingsByAgency(agencyId: string, filters?: { status?: string; startDate?: Date; endDate?: Date }): Promise<ExternalLeadShowing[]> {
    const conditions: SQL[] = [eq(externalLeadShowings.agencyId, agencyId)];
    
    if (filters?.status) {
      conditions.push(eq(externalLeadShowings.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(externalLeadShowings.scheduledAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(externalLeadShowings.scheduledAt, filters.endDate));
    }
    
    const showings = await db.select()
      .from(externalLeadShowings)
      .where(and(...conditions))
      .orderBy(desc(externalLeadShowings.scheduledAt));
    return showings;
  }

  async createExternalLeadShowing(showing: InsertExternalLeadShowing): Promise<ExternalLeadShowing> {
    const [created] = await db.insert(externalLeadShowings)
      .values(showing)
      .returning();
    return created;
  }

  async updateExternalLeadShowing(id: string, updates: UpdateExternalLeadShowing): Promise<ExternalLeadShowing> {
    const [updated] = await db.update(externalLeadShowings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalLeadShowings.id, id))
      .returning();
    return updated;
  }

  async deleteExternalLeadShowing(id: string): Promise<void> {
    await db.delete(externalLeadShowings)
      .where(eq(externalLeadShowings.id, id));
  }

  // CRM - Client Activities
  async getExternalClientActivities(clientId: string): Promise<ExternalClientActivity[]> {
    const activities = await db.select()
      .from(externalClientActivities)
      .where(eq(externalClientActivities.clientId, clientId))
      .orderBy(desc(externalClientActivities.createdAt));
    return activities;
  }

  async createExternalClientActivity(activity: InsertExternalClientActivity): Promise<ExternalClientActivity> {
    const [created] = await db.insert(externalClientActivities)
      .values(activity)
      .returning();
    return created;
  }

  // CRM - Client Property History
  async getExternalClientPropertyHistory(clientId: string): Promise<ExternalClientPropertyHistory[]> {
    const history = await db.select()
      .from(externalClientPropertyHistory)
      .where(eq(externalClientPropertyHistory.clientId, clientId))
      .orderBy(desc(externalClientPropertyHistory.createdAt));
    return history;
  }

  async createExternalClientPropertyHistory(history: InsertExternalClientPropertyHistory): Promise<ExternalClientPropertyHistory> {
    const [created] = await db.insert(externalClientPropertyHistory)
      .values(history)
      .returning();
    return created;
  }

  // External Offer Token operations
  async getExternalOfferTokensByAgency(agencyId: string): Promise<any[]> {
    // Get all offer tokens that have externalUnitId (external system tokens)
    // and join with external units to filter by agency
    const tokens = await db
      .select({
        token: offerTokens,
        unit: externalUnits,
      })
      .from(offerTokens)
      .innerJoin(
        externalUnits,
        eq(offerTokens.externalUnitId, externalUnits.id)
      )
      .where(eq(externalUnits.agencyId, agencyId))
      .orderBy(desc(offerTokens.createdAt));

    return tokens.map(t => ({
      ...t.token,
      externalUnit: t.unit,
    }));
  }

  // Optimized: Get all offer token summaries with unit, condo, client, creator
  // Uses two separate queries for security: one for tokens with units (INNER JOINs), one for tokens without units
  async getExternalOfferTokenSummariesByAgency(agencyId: string): Promise<any[]> {
    // Query 1: Tokens WITH units - use INNER JOINs for strict agency filtering via condo
    const tokensWithUnits = await db
      .select({
        id: offerTokens.id,
        token: offerTokens.token,
        isUsed: offerTokens.isUsed,
        expiresAt: offerTokens.expiresAt,
        createdAt: offerTokens.createdAt,
        offerData: offerTokens.offerData,
        externalUnitId: offerTokens.externalUnitId,
        externalClientId: offerTokens.externalClientId,
        createdBy: offerTokens.createdBy,
        unitNumber: externalUnits.unitNumber,
        condoName: externalCondominiums.name,
        clientFirstName: externalClients.firstName,
        clientLastName: externalClients.lastName,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(offerTokens)
      .innerJoin(externalUnits, eq(offerTokens.externalUnitId, externalUnits.id))
      .innerJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
      .leftJoin(externalClients, eq(offerTokens.externalClientId, externalClients.id))
      .leftJoin(users, eq(offerTokens.createdBy, users.id))
      .where(eq(externalCondominiums.agencyId, agencyId));

    // Query 2: Tokens WITHOUT units - filter by creator's agency
    const tokensWithoutUnits = await db
      .select({
        id: offerTokens.id,
        token: offerTokens.token,
        isUsed: offerTokens.isUsed,
        expiresAt: offerTokens.expiresAt,
        createdAt: offerTokens.createdAt,
        offerData: offerTokens.offerData,
        externalUnitId: offerTokens.externalUnitId,
        externalClientId: offerTokens.externalClientId,
        createdBy: offerTokens.createdBy,
        unitNumber: sql<string | null>`NULL`.as('unitNumber'),
        condoName: sql<string | null>`NULL`.as('condoName'),
        clientFirstName: externalClients.firstName,
        clientLastName: externalClients.lastName,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(offerTokens)
      .innerJoin(users, eq(offerTokens.createdBy, users.id))
      .leftJoin(externalClients, eq(offerTokens.externalClientId, externalClients.id))
      .where(
        and(
          isNull(offerTokens.externalUnitId),
          eq(users.externalAgencyId, agencyId)
        )
      );

    // Combine and sort by createdAt
    const allResults = [...tokensWithUnits, ...tokensWithoutUnits]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    return allResults.map(r => ({
      id: r.id,
      token: r.token,
      isUsed: r.isUsed,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      offerData: r.offerData,
      externalUnitId: r.externalUnitId,
      externalClientId: r.externalClientId,
      createdBy: r.createdBy,
      propertyTitle: r.unitNumber 
        ? (r.condoName ? `${r.condoName} - Unidad ${r.unitNumber}` : `Unidad ${r.unitNumber}`)
        : 'Sin unidad asignada',
      clientName: r.clientFirstName ? `${r.clientFirstName} ${r.clientLastName || ''}`.trim() : '',
      creatorName: r.creatorFirstName ? `${r.creatorFirstName} ${r.creatorLastName || ''}`.trim() : '',
    }));
  }

  // External Rental Form Token operations
  async getExternalRentalFormTokensByAgency(agencyId: string): Promise<any[]> {
    // Get all rental form tokens that have externalUnitId (external system tokens)
    // and join with external units to filter by agency
    const tokens = await db
      .select({
        token: tenantRentalFormTokens,
        unit: externalUnits,
      })
      .from(tenantRentalFormTokens)
      .innerJoin(
        externalUnits,
        eq(tenantRentalFormTokens.externalUnitId, externalUnits.id)
      )
      .where(eq(externalUnits.agencyId, agencyId))
      .orderBy(desc(tenantRentalFormTokens.createdAt));

    return tokens.map(t => ({
      ...t.token,
      externalUnit: t.unit,
    }));
  }

  // Optimized: Get all rental form token summaries with unit, condo, client, creator
  // Uses two separate queries for security: one for tokens with units (INNER JOINs), one for tokens without units
  async getExternalRentalFormTokenSummariesByAgency(agencyId: string): Promise<any[]> {
    // Query 1: Tokens WITH units - use INNER JOINs for strict agency filtering via condo
    const tokensWithUnits = await db
      .select({
        id: tenantRentalFormTokens.id,
        token: tenantRentalFormTokens.token,
        isUsed: tenantRentalFormTokens.isUsed,
        expiresAt: tenantRentalFormTokens.expiresAt,
        createdAt: tenantRentalFormTokens.createdAt,
        formData: tenantRentalFormTokens.formData,
        recipientType: tenantRentalFormTokens.recipientType,
        externalUnitId: tenantRentalFormTokens.externalUnitId,
        externalClientId: tenantRentalFormTokens.externalClientId,
        externalOwnerId: tenantRentalFormTokens.externalOwnerId,
        linkedTokenId: tenantRentalFormTokens.linkedTokenId,
        createdBy: tenantRentalFormTokens.createdBy,
        unitNumber: externalUnits.unitNumber,
        condoName: externalCondominiums.name,
        clientFirstName: externalClients.firstName,
        clientLastName: externalClients.lastName,
        ownerFirstName: externalOwners.firstName,
        ownerLastName: externalOwners.lastName,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(tenantRentalFormTokens)
      .innerJoin(externalUnits, eq(tenantRentalFormTokens.externalUnitId, externalUnits.id))
      .innerJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
      .leftJoin(externalClients, eq(tenantRentalFormTokens.externalClientId, externalClients.id))
      .leftJoin(externalOwners, eq(tenantRentalFormTokens.externalOwnerId, externalOwners.id))
      .leftJoin(users, eq(tenantRentalFormTokens.createdBy, users.id))
      .where(eq(externalCondominiums.agencyId, agencyId));

    // Query 2: Tokens WITHOUT units - filter by creator's agency
    const tokensWithoutUnits = await db
      .select({
        id: tenantRentalFormTokens.id,
        token: tenantRentalFormTokens.token,
        isUsed: tenantRentalFormTokens.isUsed,
        expiresAt: tenantRentalFormTokens.expiresAt,
        createdAt: tenantRentalFormTokens.createdAt,
        formData: tenantRentalFormTokens.formData,
        recipientType: tenantRentalFormTokens.recipientType,
        externalUnitId: tenantRentalFormTokens.externalUnitId,
        externalClientId: tenantRentalFormTokens.externalClientId,
        externalOwnerId: tenantRentalFormTokens.externalOwnerId,
        linkedTokenId: tenantRentalFormTokens.linkedTokenId,
        createdBy: tenantRentalFormTokens.createdBy,
        unitNumber: sql<string | null>`NULL`.as('unitNumber'),
        condoName: sql<string | null>`NULL`.as('condoName'),
        clientFirstName: externalClients.firstName,
        clientLastName: externalClients.lastName,
        ownerFirstName: externalOwners.firstName,
        ownerLastName: externalOwners.lastName,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(tenantRentalFormTokens)
      .innerJoin(users, eq(tenantRentalFormTokens.createdBy, users.id))
      .leftJoin(externalClients, eq(tenantRentalFormTokens.externalClientId, externalClients.id))
      .leftJoin(externalOwners, eq(tenantRentalFormTokens.externalOwnerId, externalOwners.id))
      .where(
        and(
          isNull(tenantRentalFormTokens.externalUnitId),
          eq(users.externalAgencyId, agencyId)
        )
      );

    // Combine and sort by createdAt
    const allResults = [...tokensWithUnits, ...tokensWithoutUnits]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    return allResults.map(r => ({
      id: r.id,
      token: r.token,
      isUsed: r.isUsed,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      formData: r.formData,
      recipientType: r.recipientType,
      externalUnitId: r.externalUnitId,
      externalClientId: r.externalClientId,
      externalOwnerId: r.externalOwnerId,
      linkedTokenId: r.linkedTokenId,
      createdBy: r.createdBy,
      propertyTitle: r.unitNumber 
        ? (r.condoName ? `${r.condoName} - Unidad ${r.unitNumber}` : `Unidad ${r.unitNumber}`)
        : 'Sin unidad asignada',
      clientName: r.clientFirstName ? `${r.clientFirstName} ${r.clientLastName || ''}`.trim() : 
                  (r.ownerFirstName ? `${r.ownerFirstName} ${r.ownerLastName || ''}`.trim() : ''),
      creatorName: r.creatorFirstName ? `${r.creatorFirstName} ${r.creatorLastName || ''}`.trim() : '',
    }));
  }

  // External Financial Transaction operations
  async getExternalFinancialTransaction(id: string): Promise<ExternalFinancialTransaction | undefined> {
    const [transaction] = await db.select()
      .from(externalFinancialTransactions)
      .where(eq(externalFinancialTransactions.id, id));
    return transaction;
  }

  async getExternalFinancialTransactionsByAgency(
    agencyId: string,
    filters?: {
      direction?: string;
      category?: string;
      status?: string;
      ownerId?: string;
      contractId?: string;
      unitId?: string;
      condominiumId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<ExternalFinancialTransaction[]> {
    const conditions = [eq(externalFinancialTransactions.agencyId, agencyId)];

    if (filters?.direction) {
      conditions.push(eq(externalFinancialTransactions.direction, filters.direction as any));
    }
    if (filters?.category) {
      conditions.push(eq(externalFinancialTransactions.category, filters.category as any));
    }
    if (filters?.status) {
      conditions.push(eq(externalFinancialTransactions.status, filters.status as any));
    }
    if (filters?.ownerId) {
      conditions.push(eq(externalFinancialTransactions.ownerId, filters.ownerId));
    }
    if (filters?.contractId) {
      conditions.push(eq(externalFinancialTransactions.contractId, filters.contractId));
    }
    if (filters?.unitId) {
      conditions.push(eq(externalFinancialTransactions.unitId, filters.unitId));
    }
    if (filters?.condominiumId) {
      conditions.push(eq(externalFinancialTransactions.condominiumId, filters.condominiumId));
    }
    if (filters?.startDate) {
      conditions.push(gte(externalFinancialTransactions.dueDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(externalFinancialTransactions.dueDate, filters.endDate));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const sanitized = filters.search
        .trim()
        .slice(0, 100);
      
      if (sanitized.length > 0) {
        const escaped = sanitized
          .replace(/\\/g, '\\\\')
          .replace(/%/g, '\\%')
          .replace(/_/g, '\\_');
        const searchPattern = `%${escaped}%`;
        
        // Use sql template to include ESCAPE clause for proper wildcard escaping
        const searchCondition = or(
          sql`${externalFinancialTransactions.tenantName} ILIKE ${searchPattern} ESCAPE '\\'`,
          sql`${externalFinancialTransactions.paymentReference} ILIKE ${searchPattern} ESCAPE '\\'`
        );
        
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }

    let query = db.select()
      .from(externalFinancialTransactions)
      .where(and(...conditions));

    const sortOrder = filters?.sortOrder || 'desc';
    const sortFn = sortOrder === 'asc' ? asc : desc;

    switch (filters?.sortField) {
      case 'dueDate':
        query = query.orderBy(sortFn(externalFinancialTransactions.dueDate));
        break;
      case 'performedDate':
        query = query.orderBy(sortFn(externalFinancialTransactions.performedDate));
        break;
      case 'grossAmount':
        query = query.orderBy(sortFn(externalFinancialTransactions.grossAmount));
        break;
      case 'category':
        query = query.orderBy(sortFn(externalFinancialTransactions.category));
        break;
      case 'status':
        query = query.orderBy(sortFn(externalFinancialTransactions.status));
        break;
      default:
        query = query.orderBy(desc(externalFinancialTransactions.dueDate));
    }

    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async getExternalFinancialTransactionsCountByAgency(
    agencyId: string,
    filters?: {
      direction?: string;
      category?: string;
      status?: string;
      ownerId?: string;
      contractId?: string;
      unitId?: string;
      condominiumId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ): Promise<number> {
    const conditions = [eq(externalFinancialTransactions.agencyId, agencyId)];

    if (filters?.direction) {
      conditions.push(eq(externalFinancialTransactions.direction, filters.direction as any));
    }
    if (filters?.category) {
      conditions.push(eq(externalFinancialTransactions.category, filters.category as any));
    }
    if (filters?.status) {
      conditions.push(eq(externalFinancialTransactions.status, filters.status as any));
    }
    if (filters?.ownerId) {
      conditions.push(eq(externalFinancialTransactions.ownerId, filters.ownerId));
    }
    if (filters?.contractId) {
      conditions.push(eq(externalFinancialTransactions.contractId, filters.contractId));
    }
    if (filters?.unitId) {
      conditions.push(eq(externalFinancialTransactions.unitId, filters.unitId));
    }
    if (filters?.condominiumId) {
      conditions.push(eq(externalFinancialTransactions.condominiumId, filters.condominiumId));
    }
    if (filters?.startDate) {
      conditions.push(gte(externalFinancialTransactions.dueDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(externalFinancialTransactions.dueDate, filters.endDate));
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const sanitized = filters.search
        .trim()
        .slice(0, 100);
      
      if (sanitized.length > 0) {
        const escaped = sanitized
          .replace(/\\/g, '\\\\')
          .replace(/%/g, '\\%')
          .replace(/_/g, '\\_');
        const searchPattern = `%${escaped}%`;
        
        // Use sql template to include ESCAPE clause for proper wildcard escaping
        const searchCondition = or(
          sql`${externalFinancialTransactions.tenantName} ILIKE ${searchPattern} ESCAPE '\\'`,
          sql`${externalFinancialTransactions.paymentReference} ILIKE ${searchPattern} ESCAPE '\\'`
        );
        
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }

    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(externalFinancialTransactions)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  async createExternalFinancialTransaction(transaction: InsertExternalFinancialTransaction): Promise<ExternalFinancialTransaction> {
    const [result] = await db.insert(externalFinancialTransactions)
      .values({
        ...transaction,
        id: crypto.randomUUID(),
      })
      .returning();
    return result;
  }

  async updateExternalFinancialTransaction(id: string, updates: Partial<InsertExternalFinancialTransaction>): Promise<ExternalFinancialTransaction> {
    const [result] = await db.update(externalFinancialTransactions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(externalFinancialTransactions.id, id))
      .returning();
    return result;
  }

  async deleteExternalFinancialTransaction(id: string): Promise<void> {
    await db.delete(externalFinancialTransactions)
      .where(eq(externalFinancialTransactions.id, id));
  }

  async getExternalAccountingSummary(agencyId: string): Promise<{
    totalInflow: number;
    totalOutflow: number;
    netBalance: number;
    pendingInflow: number;
    pendingOutflow: number;
    reconciledInflow: number;
    reconciledOutflow: number;
  }> {
    // Get all transactions for the agency
    const transactions = await db.select()
      .from(externalFinancialTransactions)
      .where(eq(externalFinancialTransactions.agencyId, agencyId));

    // Calculate summary
    const summary = {
      totalInflow: 0,
      totalOutflow: 0,
      netBalance: 0,
      pendingInflow: 0,
      pendingOutflow: 0,
      reconciledInflow: 0,
      reconciledOutflow: 0,
    };

    transactions.forEach((tx) => {
      const amount = Number(tx.netAmount);

      if (tx.direction === 'inflow') {
        summary.totalInflow += amount;
        if (tx.status === 'pending') {
          summary.pendingInflow += amount;
        } else if (tx.status === 'reconciled') {
          summary.reconciledInflow += amount;
        }
      } else if (tx.direction === 'outflow') {
        summary.totalOutflow += amount;
        if (tx.status === 'pending') {
          summary.pendingOutflow += amount;
        } else if (tx.status === 'reconciled') {
          summary.reconciledOutflow += amount;
        }
      }
    });

    summary.netBalance = summary.totalInflow - summary.totalOutflow;

    return summary;
  }

  // ========== OPTIMIZED PUBLIC TOKEN ENDPOINTS ==========
  // Lightweight methods for public forms - minimal fields, single query

  async getOfferTokenDataLean(token: string) {
    // First, get the token data
    const [tokenData] = await db
      .select()
      .from(offerTokens)
      .where(eq(offerTokens.token, token))
      .limit(1);

    if (!tokenData) {
      return undefined;
    }

    // Get related data in parallel
    const [unit, client, creator] = await Promise.all([
      tokenData.externalUnitId
        ? db.select().from(externalUnits).where(eq(externalUnits.id, tokenData.externalUnitId)).limit(1)
        : Promise.resolve([undefined]),
      tokenData.externalClientId
        ? db.select().from(externalClients).where(eq(externalClients.id, tokenData.externalClientId)).limit(1)
        : Promise.resolve([undefined]),
      tokenData.createdBy
        ? db.select().from(users).where(eq(users.id, tokenData.createdBy)).limit(1)
        : Promise.resolve([undefined])
    ]);

    const unitData = unit?.[0];
    const clientData = client?.[0];
    const creatorData = creator?.[0];

    // If token requires an external unit but it's missing, treat as invalid
    if (tokenData.externalUnitId && !unitData) {
      return undefined;
    }

    // Get condominium and agency if unit exists
    let condoData, agencyData;
    if (unitData) {
      const [condo, agency] = await Promise.all([
        unitData.condominiumId
          ? db.select().from(externalCondominiums).where(eq(externalCondominiums.id, unitData.condominiumId)).limit(1)
          : Promise.resolve([undefined]),
        unitData.agencyId
          ? db.select().from(externalAgencies).where(eq(externalAgencies.id, unitData.agencyId)).limit(1)
          : Promise.resolve([undefined])
      ]);
      condoData = condo?.[0];
      agencyData = agency?.[0];
    }

    // Construct the result object
    return {
      tokenId: tokenData.id,
      token: tokenData.token,
      isUsed: tokenData.isUsed,
      expiresAt: tokenData.expiresAt,
      offerData: tokenData.offerData,
      createdBy: tokenData.createdBy,
      propertyId: tokenData.propertyId,
      externalUnitId: tokenData.externalUnitId,
      externalClientId: tokenData.externalClientId,
      leadId: tokenData.leadId,
      
      unitId: unitData?.id ?? null,
      unitNumber: unitData?.unitNumber ?? null,
      unitType: unitData?.propertyType ?? null,
      bedrooms: unitData?.bedrooms ?? null,
      bathrooms: unitData?.bathrooms ?? null,
      size: unitData?.area ?? null,
      description: unitData?.description ?? null,
      photos: unitData?.photos ?? null,
      monthlyRent: unitData?.monthlyRent ?? null,
      currency: unitData?.currency ?? null,
      includedServices: unitData?.includedServices ?? null,
      
      condoName: condoData?.name ?? null,
      condoAddress: condoData?.address ?? null,
      
      clientId: clientData?.id ?? null,
      clientFirstName: clientData?.firstName ?? null,
      clientLastName: clientData?.lastName ?? null,
      clientEmail: clientData?.email ?? null,
      clientPhone: clientData?.phone ?? null,
      
      agencyId: agencyData?.id ?? null,
      agencyName: agencyData?.name ?? null,
      agencyLogo: agencyData?.logoUrl ?? null,
      
      creatorId: creatorData?.id ?? null,
      creatorFirstName: creatorData?.firstName ?? null,
      creatorLastName: creatorData?.lastName ?? null,
      creatorProfilePic: creatorData?.profileImageUrl ?? null,
    };
  }

  async getRentalFormTokenDataLean(token: string) {
    // First, get the token data
    const [tokenData] = await db
      .select()
      .from(tenantRentalFormTokens)
      .where(eq(tenantRentalFormTokens.token, token))
      .limit(1);

    if (!tokenData) {
      return undefined;
    }

    // Get related data in parallel
    const [unit, client, creator] = await Promise.all([
      tokenData.externalUnitId
        ? db.select().from(externalUnits).where(eq(externalUnits.id, tokenData.externalUnitId)).limit(1)
        : Promise.resolve([undefined]),
      tokenData.externalClientId
        ? db.select().from(externalClients).where(eq(externalClients.id, tokenData.externalClientId)).limit(1)
        : Promise.resolve([undefined]),
      tokenData.createdBy
        ? db.select().from(users).where(eq(users.id, tokenData.createdBy)).limit(1)
        : Promise.resolve([undefined])
    ]);

    const unitData = unit?.[0];
    const clientData = client?.[0];
    const creatorData = creator?.[0];

    // If token requires an external unit but it's missing, treat as invalid
    if (tokenData.externalUnitId && !unitData) {
      return undefined;
    }

    // Get condominium and agency if unit exists
    let condoData, agencyData;
    if (unitData) {
      const [condo, agency] = await Promise.all([
        unitData.condominiumId
          ? db.select().from(externalCondominiums).where(eq(externalCondominiums.id, unitData.condominiumId)).limit(1)
          : Promise.resolve([undefined]),
        unitData.agencyId
          ? db.select().from(externalAgencies).where(eq(externalAgencies.id, unitData.agencyId)).limit(1)
          : Promise.resolve([undefined])
      ]);
      condoData = condo?.[0];
      agencyData = agency?.[0];
    }

    // Construct the result object
    return {
      tokenId: tokenData.id,
      token: tokenData.token,
      isUsed: tokenData.isUsed,
      expiresAt: tokenData.expiresAt,
      recipientType: tokenData.recipientType,
      rentalFormGroupId: tokenData.rentalFormGroupId,
      tenantData: tokenData.tenantData,
      ownerData: tokenData.ownerData,
      createdBy: tokenData.createdBy,
      propertyId: tokenData.propertyId,
      externalUnitId: tokenData.externalUnitId,
      externalClientId: tokenData.externalClientId,
      externalUnitOwnerId: tokenData.externalUnitOwnerId,
      leadId: tokenData.leadId,
      
      unitId: unitData?.id ?? null,
      unitNumber: unitData?.unitNumber ?? null,
      unitType: unitData?.propertyType ?? null,
      bedrooms: unitData?.bedrooms ?? null,
      bathrooms: unitData?.bathrooms ?? null,
      size: unitData?.area ?? null,
      monthlyRent: unitData?.monthlyRent ?? null,
      currency: unitData?.currency ?? null,
      
      condoName: condoData?.name ?? null,
      condoAddress: condoData?.address ?? null,
      
      clientFirstName: clientData?.firstName ?? null,
      clientLastName: clientData?.lastName ?? null,
      clientEmail: clientData?.email ?? null,
      clientPhone: clientData?.phone ?? null,
      
      agencyId: agencyData?.id ?? null,
      agencyName: agencyData?.name ?? null,
      agencyLogo: agencyData?.logoUrl ?? null,
      
      creatorId: creatorData?.id ?? null,
      creatorFirstName: creatorData?.firstName ?? null,
      creatorLastName: creatorData?.lastName ?? null,
      creatorProfilePic: creatorData?.profileImageUrl ?? null,
    };
  }

  async getLatestOfferForPrefill(externalClientId: string) {
    const [result] = await db
      .select({
        nombreCompleto: sql<string>`${offerTokens.offerData}->>'nombreCompleto'`,
        nacionalidad: sql<string>`${offerTokens.offerData}->>'nacionalidad'`,
        edad: sql<number>`(${offerTokens.offerData}->>'edad')::int`,
        trabajoPosicion: sql<string>`${offerTokens.offerData}->>'trabajoPosicion'`,
        companiaTrabaja: sql<string>`${offerTokens.offerData}->>'companiaTrabaja'`,
        ingresoMensualPromedio: sql<string>`${offerTokens.offerData}->>'ingresoMensualPromedio'`,
        numeroInquilinos: sql<number>`(${offerTokens.offerData}->>'numeroInquilinos')::int`,
        tieneMascotas: sql<string>`${offerTokens.offerData}->>'tieneMascotas'`,
        clientEmail: sql<string>`${offerTokens.offerData}->>'clientEmail'`,
        clientPhone: sql<string>`${offerTokens.offerData}->>'clientPhone'`,
        fechaIngreso: sql<string>`${offerTokens.offerData}->>'fechaIngreso'`,
        tiempoResidenciaTulum: sql<string>`${offerTokens.offerData}->>'tiempoResidenciaTulum'`,
      })
      .from(offerTokens)
      .where(
        and(
          eq(offerTokens.externalClientId, externalClientId),
          eq(offerTokens.isUsed, true)
        )
      )
      .orderBy(desc(offerTokens.updatedAt))
      .limit(1);

    return result;
  }

  async getOwnerForPrefill(externalUnitOwnerId: string) {
    const [result] = await db
      .select({
        ownerName: externalUnitOwners.ownerName,
        ownerEmail: externalUnitOwners.ownerEmail,
        ownerPhone: externalUnitOwners.ownerPhone,
      })
      .from(externalUnitOwners)
      .where(eq(externalUnitOwners.id, externalUnitOwnerId))
      .limit(1);

    return result;
  }

  // External Management System - Terms and Conditions operations
  async getExternalTermsAndConditions(agencyId: string, type?: 'tenant' | 'owner'): Promise<ExternalTermsAndConditions[]> {
    const conditions = [eq(externalTermsAndConditions.agencyId, agencyId)];
    if (type) {
      conditions.push(eq(externalTermsAndConditions.type, type));
    }

    return await db
      .select()
      .from(externalTermsAndConditions)
      .where(and(...conditions))
      .orderBy(desc(externalTermsAndConditions.createdAt));
  }

  async getExternalTermsAndConditionsById(id: string): Promise<ExternalTermsAndConditions | undefined> {
    const [result] = await db
      .select()
      .from(externalTermsAndConditions)
      .where(eq(externalTermsAndConditions.id, id));
    return result;
  }

  async getActiveExternalTermsAndConditions(agencyId: string, type: 'tenant' | 'owner'): Promise<ExternalTermsAndConditions | undefined> {
    const [result] = await db
      .select()
      .from(externalTermsAndConditions)
      .where(
        and(
          eq(externalTermsAndConditions.agencyId, agencyId),
          eq(externalTermsAndConditions.type, type),
          eq(externalTermsAndConditions.isActive, true)
        )
      )
      .limit(1);
    return result;
  }

  async createExternalTermsAndConditions(termsData: InsertExternalTermsAndConditions): Promise<ExternalTermsAndConditions> {
    const [result] = await db
      .insert(externalTermsAndConditions)
      .values(termsData)
      .returning();
    return result;
  }

  async updateExternalTermsAndConditions(id: string, updates: UpdateExternalTermsAndConditions): Promise<ExternalTermsAndConditions> {
    const [result] = await db
      .update(externalTermsAndConditions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalTermsAndConditions.id, id))
      .returning();
    return result;
  }

  async publishExternalTermsAndConditions(id: string, publishedBy: string): Promise<ExternalTermsAndConditions> {
    // First get the terms to unpublish others of the same type
    const terms = await this.getExternalTermsAndConditionsById(id);
    if (!terms) {
      throw new Error('Terms and conditions not found');
    }

    // Unpublish all active terms of the same type for this agency
    await db
      .update(externalTermsAndConditions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(externalTermsAndConditions.agencyId, terms.agencyId),
          eq(externalTermsAndConditions.type, terms.type),
          eq(externalTermsAndConditions.isActive, true)
        )
      );

    // Publish the selected terms
    const [result] = await db
      .update(externalTermsAndConditions)
      .set({
        isActive: true,
        publishedAt: new Date(),
        publishedBy,
        updatedAt: new Date()
      })
      .where(eq(externalTermsAndConditions.id, id))
      .returning();

    return result;
  }

  async unpublishExternalTermsAndConditions(id: string): Promise<ExternalTermsAndConditions> {
    const [result] = await db
      .update(externalTermsAndConditions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(externalTermsAndConditions.id, id))
      .returning();
    return result;
  }

  async deleteExternalTermsAndConditions(id: string): Promise<void> {
    await db
      .delete(externalTermsAndConditions)
      .where(eq(externalTermsAndConditions.id, id));
  }

  // External Management System - Quotations operations
  async getExternalQuotations(agencyId: string): Promise<ExternalQuotation[]> {
    return await db
      .select()
      .from(externalQuotations)
      .where(eq(externalQuotations.agencyId, agencyId))
      .orderBy(desc(externalQuotations.createdAt));
  }

  async getExternalQuotationById(id: string, agencyId: string): Promise<ExternalQuotation | undefined> {
    const [result] = await db
      .select()
      .from(externalQuotations)
      .where(
        and(
          eq(externalQuotations.id, id),
          eq(externalQuotations.agencyId, agencyId)
        )
      );
    return result;
  }

  async createExternalQuotation(quotationData: InsertExternalQuotation): Promise<ExternalQuotation> {
    const [result] = await db
      .insert(externalQuotations)
      .values(quotationData)
      .returning();
    return result;
  }

  async updateExternalQuotation(id: string, agencyId: string, updates: UpdateExternalQuotation): Promise<ExternalQuotation> {
    const [result] = await db
      .update(externalQuotations)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(externalQuotations.id, id),
          eq(externalQuotations.agencyId, agencyId)
        )
      )
      .returning();
    
    if (!result) {
      throw new NotFoundError('Quotation not found or does not belong to this agency');
    }
    
    return result;
  }

  async deleteExternalQuotation(id: string, agencyId: string): Promise<void> {
    const result = await db
      .delete(externalQuotations)
      .where(
        and(
          eq(externalQuotations.id, id),
          eq(externalQuotations.agencyId, agencyId)
        )
      )
      .returning();
    
    if (result.length === 0) {
      throw new NotFoundError('Quotation not found or does not belong to this agency');
    }
  }

  async updateExternalQuotationStatus(id: string, agencyId: string, status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'cancelled', timestamp?: Date): Promise<ExternalQuotation> {
    // Get current quotation to validate transition
    const current = await this.getExternalQuotationById(id, agencyId);
    if (!current) {
      throw new NotFoundError('Quotation not found or does not belong to this agency');
    }

    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      'draft': ['sent', 'cancelled'],
      'sent': ['approved', 'rejected', 'converted_to_ticket'],
      'approved': ['converted_to_ticket'],  // Can only cancel accepted quotations
      'rejected': [],  // Terminal state
      'cancelled': [],  // Terminal state
    };

    // Validate transition
    const allowedNextStates = validTransitions[current.status] || [];
    if (!allowedNextStates.includes(status)) {
      throw new Error(`Invalid status transition from ${current.status} to ${status}`);
    }

    // Clear all status timestamps and set only the appropriate one
    const updates: any = {
      status,
      sentAt: null,
      approvedAt: null,
      rejectedAt: null,
      cancelledAt: null,
      updatedAt: new Date()
    };
    
    // Set appropriate timestamp based on status (draft has no timestamp)
    if (status === 'sent') {
      updates.sentAt = timestamp || new Date();
    } else if (status === 'accepted') {
      updates.approvedAt = timestamp || new Date();
    } else if (status === 'rejected') {
      updates.rejectedAt = timestamp || new Date();
    } else if (status === 'cancelled') {
      updates.cancelledAt = timestamp || new Date();
    }

    const [result] = await db
      .update(externalQuotations)
      .set(updates)
      .where(
        and(
          eq(externalQuotations.id, id),
          eq(externalQuotations.agencyId, agencyId)
        )
      )
      .returning();
    
    if (!result) {
      throw new Error('Quotation not found or does not belong to this agency');
    }
    
    return result;
  }

  async createExternalQuotationToken(tokenData: InsertExternalQuotationToken): Promise<ExternalQuotationToken> {
    const [result] = await db
      .insert(externalQuotationTokens)
      .values(tokenData)
      .returning();
    return result;
  }

  async getExternalQuotationByToken(token: string): Promise<{ quotation: ExternalQuotation; token: ExternalQuotationToken } | undefined> {
    // First get the token and check expiration before joining
    const [tokenRecord] = await db
      .select()
      .from(externalQuotationTokens)
      .where(eq(externalQuotationTokens.token, token))
      .limit(1);

    if (!tokenRecord) return undefined;

    // Reject expired tokens immediately
    if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
      return undefined;
    }

    // Token is valid, get the quotation (no agency check for public access)
    const [quotation] = await db
      .select()
      .from(externalQuotations)
      .where(eq(externalQuotations.id, tokenRecord.quotationId))
      .limit(1);

    if (!quotation) return undefined;

    return {
      quotation,
      token: tokenRecord,
    };
  }

  async incrementQuotationTokenAccess(tokenId: string): Promise<void> {
    await db
      .update(externalQuotationTokens)
      .set({
        accessCount: sql`${externalQuotationTokens.accessCount} + 1`,
        lastAccessedAt: new Date(),
      })
      .where(eq(externalQuotationTokens.id, tokenId));
  }
}

export const storage = new DatabaseStorage();
