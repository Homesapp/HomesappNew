import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { RoleSelector } from "@/components/RoleSelector";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useGlobalErrorHandler } from "@/hooks/useGlobalErrorHandler";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { apiRequest } from "@/lib/queryClient";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import PropertySearch from "@/pages/PropertySearch";
import PropertyDetails from "@/pages/PropertyDetails";
import PropertyFullDetails from "@/pages/PropertyFullDetails";
import Favorites from "@/pages/Favorites";
import LeadsKanban from "@/pages/LeadsKanban";
import RentalsKanban from "@/pages/RentalsKanban";
import Dashboard from "@/pages/Dashboard";
import SellerDashboard from "@/pages/SellerDashboard";
import PublicDashboard from "@/components/PublicDashboard";
import Properties from "@/pages/Properties";
import Appointments from "@/pages/Appointments";
import Calendar from "@/pages/Calendar";
import AdminCalendar from "@/pages/AdminCalendar";
import AdminBusinessHours from "@/pages/AdminBusinessHours";
import AdminPropertyAssignment from "@/pages/AdminPropertyAssignment";
import AdminAppointmentManagement from "@/pages/AdminAppointmentManagement";
import AdminSellerManagement from "@/pages/AdminSellerManagement";
import AdminPropertyManagement from "@/pages/AdminPropertyManagement";
import AdminTaskManagement from "@/pages/AdminTaskManagement";
import AdminIntegrationsControl from "@/pages/AdminIntegrationsControl";
import AdminContractManagement from "@/pages/AdminContractManagement";
import ConciergeSchedule from "@/pages/ConciergeSchedule";
import Directory from "@/pages/Directory";
import PresentationCards from "@/pages/PresentationCards";
import Backoffice from "@/pages/Backoffice";
import Users from "@/pages/Users";
import UserManagement from "@/pages/UserManagement";
import Clients from "@/pages/Clients";
import Budgets from "@/pages/Budgets";
import Tasks from "@/pages/Tasks";
import MyOpportunities from "@/pages/MyOpportunities";
import RentalOfferForm from "@/pages/RentalOfferForm";
import MyProperties from "@/pages/MyProperties";
import OwnerPropertyDetails from "@/pages/OwnerPropertyDetails";
import EditOwnerProperty from "@/pages/EditOwnerProperty";
import PropertyDocuments from "@/pages/PropertyDocuments";
import OwnerFinancialReport from "@/pages/OwnerFinancialReport";
import AdminChangeRequests from "@/pages/AdminChangeRequests";
import AdminPropertyLimitRequests from "@/pages/AdminPropertyLimitRequests";
import AdminInspectionReports from "@/pages/AdminInspectionReports";
import AdminAgreementTemplates from "@/pages/AdminAgreementTemplates";
import AdminCondominiums from "@/pages/AdminCondominiums";
import CondominiumDetails from "@/pages/CondominiumDetails";
import AdminSuggestions from "@/pages/AdminSuggestions";
import AdminChatbotConfig from "@/pages/AdminChatbotConfig";
import PropertySubmissionWizard from "@/pages/PropertySubmissionWizard";
import OwnerAppointments from "@/pages/OwnerAppointments";
import OwnerOffers from "@/pages/OwnerOffers";
import OwnerDashboard from "@/pages/OwnerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProfile from "@/pages/AdminProfile";
import ClientDashboard from "@/pages/ClientDashboard";
import Changelog from "@/pages/Changelog";
import Notifications from "@/pages/Notifications";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import ProviderApplication from "@/pages/ProviderApplication";
import Apply from "@/pages/Apply";
import CreateUser from "@/pages/CreateUser";
import Referrals from "@/pages/Referrals";
import AdminReferrals from "@/pages/AdminReferrals";
import ActiveRentals from "@/pages/ActiveRentals";
import OwnerActiveRentals from "@/pages/OwnerActiveRentals";
import Feedback from "@/pages/Feedback";
import AdminFeedback from "@/pages/AdminFeedback";
import AccountantIncome from "@/pages/AccountantIncome";
import AdminIncome from "@/pages/AdminIncome";
import MyIncome from "@/pages/MyIncome";
import Permissions from "@/pages/Permissions";
import AdminSLAConfig from "@/pages/AdminSLAConfig";
import AdminLeadScoring from "@/pages/AdminLeadScoring";
import Contracts from "@/pages/Contracts";
import RoleRequests from "@/pages/RoleRequests";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Help from "@/pages/Help";
import SellerCommissions from "@/pages/SellerCommissions";
import SellerAppointmentManagement from "@/pages/SellerAppointmentManagement";
import AdminPredictiveAnalytics from "@/pages/AdminPredictiveAnalytics";
import AdminLegalDocuments from "@/pages/AdminLegalDocuments";
import AdminTenantScreening from "@/pages/AdminTenantScreening";
import AdminMarketingCampaigns from "@/pages/AdminMarketingCampaigns";
import AdminRentalOpportunityRequests from "@/pages/AdminRentalOpportunityRequests";
import ContractView from "@/pages/ContractView";
import ContractTenantForm from "@/pages/ContractTenantForm";
import ContractOwnerForm from "@/pages/ContractOwnerForm";
import LawyerDashboard from "@/pages/LawyerDashboard";
import ContractLegalReview from "@/pages/ContractLegalReview";
import CheckInManagement from "@/pages/CheckInManagement";
import HoaManagement from "@/pages/HoaManagement";
import OwnerHoaPortal from "@/pages/OwnerHoaPortal";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const [_, setLocation] = useLocation();
  
  // Enable global error handler
  useGlobalErrorHandler();
  
  const { isAuthenticated, isLoading, user } = useAuth();
  const { adminUser, isAdminAuthenticated, isLoading: isAdminLoading } = useAdminAuth();

  const adminLogoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/admin/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin-login");
    },
  });
  
  // Enable auto-logout after 5 minutes of inactivity for authenticated users
  useAutoLogout({
    enabled: isAuthenticated || isAdminAuthenticated,
    onLogout: isAdminAuthenticated ? () => adminLogoutMutation.mutate() : undefined,
  });

  const style = {
    "--sidebar-width": "12rem",
    "--sidebar-width-icon": "3rem",
  };

  // Wait for both auth checks to complete
  if (isLoading || isAdminLoading) {
    return <LoadingScreen className="h-screen" />;
  }

  // If not authenticated, show public pages
  if (!isAuthenticated && !isAdminAuthenticated) {
    return (
      <Switch>
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/buscar-propiedades" component={PropertySearch} />
        <Route path="/solicitud-proveedor" component={ProviderApplication} />
        <Route path="/aplicar" component={Apply} />
        <Route path="/propiedad/:id/completo" component={PropertyFullDetails} />
        <Route path="/propiedad/:id" component={PropertyDetails} />
        <Route path="/favoritos" component={Favorites} />
        <Route path="/terminos" component={Terms} />
        <Route path="/privacidad" component={Privacy} />
        <Route path="/" component={PublicDashboard} />
        <Route component={PublicDashboard} />
      </Switch>
    );
  }

  // Determine which user is authenticated
  const currentUser = isAdminAuthenticated ? adminUser : user;
  const userName = currentUser?.firstName && currentUser?.lastName 
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : currentUser?.email || (isAdminAuthenticated && adminUser ? adminUser.username : undefined) || "Usuario";
  
  // Determine user role - admin authenticated users get 'admin' fallback, others get undefined
  const userRole = isAdminAuthenticated 
    ? (currentUser?.role || "admin") 
    : currentUser?.role;

  // Determine home dashboard based on authentication type and role
  const getHomeDashboard = () => {
    // Admin authenticated users always see AdminDashboard
    if (isAdminAuthenticated) {
      return AdminDashboard;
    }
    
    // Route based on user role
    switch (userRole) {
      case "cliente":
        return ClientDashboard;
      case "owner":
        return OwnerDashboard;
      case "master":
      case "admin":
      case "admin_jr":
        return AdminDashboard;
      case "seller":
        return SellerDashboard;
      case "management":
      case "concierge":
      case "provider":
      default:
        // Users without a defined role or with unrecognized roles get generic Dashboard
        return Dashboard;
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole={userRole}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationBell />
              <LanguageToggle />
              {isAdminAuthenticated && adminUser ? (
                <UserProfileMenu
                  user={adminUser as any}
                  isAdmin={true}
                  onLogout={() => adminLogoutMutation.mutate()}
                />
              ) : user ? (
                <UserProfileMenu user={user} />
              ) : null}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <Switch>
              <Route path="/" component={getHomeDashboard()} />
              <Route path="/mis-citas" component={Appointments} />
              <Route path="/buscar-propiedades" component={PropertySearch} />
              <Route path="/aplicar" component={Apply} />
              <Route path="/propiedad/:id/completo" component={PropertyFullDetails} />
              <Route path="/propiedad/:id" component={PropertyDetails} />
              <Route path="/favoritos" component={Favorites} />
              <Route path="/mis-oportunidades" component={MyOpportunities} />
              <Route path="/rental-offer/:propertyId" component={RentalOfferForm} />
              <Route path="/contract/:contractId" component={ContractView} />
              <Route path="/contract-tenant-form/:contractId" component={ContractTenantForm} />
              <Route path="/contract-owner-form/:contractId" component={ContractOwnerForm} />
              <Route path="/contract/:contractId/legal-review" component={ContractLegalReview} />
              <Route path="/lawyer/dashboard" component={LawyerDashboard} />
              <Route path="/admin/check-in" component={CheckInManagement} />
              <Route path="/owner/dashboard" component={OwnerDashboard} />
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/profile" component={AdminProfile} />
              <Route path="/mis-propiedades" component={MyProperties} />
              <Route path="/my-properties" component={MyProperties} />
              <Route path="/owner/property/new" component={PropertySubmissionWizard} />
              <Route path="/owner/property/:id/edit" component={EditOwnerProperty} />
              <Route path="/owner/property/:id/documents" component={PropertyDocuments} />
              <Route path="/owner/property/:id" component={OwnerPropertyDetails} />
              <Route path="/owner/appointments" component={OwnerAppointments} />
              <Route path="/owner/offers" component={OwnerOffers} />
              <Route path="/owner/financial-report" component={OwnerFinancialReport} />
              <Route path="/owner/hoa" component={OwnerHoaPortal} />
              <Route path="/admin/appointments" component={AdminAppointmentManagement} />
              <Route path="/admin/sellers" component={AdminSellerManagement} />
              <Route path="/admin/properties" component={AdminPropertyManagement} />
              <Route path="/admin/tasks" component={AdminTaskManagement} />
              <Route path="/admin/integrations" component={AdminIntegrationsControl} />
              <Route path="/admin/contracts" component={AdminContractManagement} />
              <Route path="/admin/change-requests" component={AdminChangeRequests} />
              <Route path="/admin/property-limit-requests" component={AdminPropertyLimitRequests} />
              <Route path="/admin/inspection-reports" component={AdminInspectionReports} />
              <Route path="/admin/agreement-templates" component={AdminAgreementTemplates} />
              <Route path="/admin/condominiums/:id" component={CondominiumDetails} />
              <Route path="/admin/condominiums" component={AdminCondominiums} />
              <Route path="/admin/hoa" component={HoaManagement} />
              <Route path="/admin/chatbot-config" component={AdminChatbotConfig} />
              <Route path="/admin/create-user" component={CreateUser} />
              <Route path="/admin/income" component={AdminIncome} />
              <Route path="/admin/changelog" component={Changelog} />
              <Route path="/accountant/income" component={AccountantIncome} />
              <Route path="/mis-ingresos" component={MyIncome} />
              <Route path="/leads" component={LeadsKanban} />
              <Route path="/rentas" component={RentalsKanban} />
              <Route path="/properties" component={Properties} />
              <Route path="/appointments" component={Appointments} />
              <Route path="/calendario" component={Calendar} />
              <Route path="/admin/calendario" component={AdminCalendar} />
              <Route path="/admin/horarios" component={AdminBusinessHours} />
              <Route path="/admin/asignar-propiedades" component={AdminPropertyAssignment} />
              <Route path="/concierge/horarios" component={ConciergeSchedule} />
              <Route path="/directory" component={Directory} />
              <Route path="/presentation-cards" component={PresentationCards} />
              <Route path="/cards" component={PresentationCards} />
              <Route path="/presupuestos" component={Budgets} />
              <Route path="/tareas" component={Tasks} />
              <Route path="/backoffice" component={Backoffice} />
              <Route path="/admin/users" component={UserManagement} />
              <Route path="/users" component={Users} />
              <Route path="/clientes" component={Clients} />
              <Route path="/notificaciones" component={Notifications} />
              <Route path="/chat" component={Chat} />
              <Route path="/perfil" component={Profile} />
              <Route path="/referidos" component={Referrals} />
              <Route path="/admin/referidos" component={AdminReferrals} />
              <Route path="/rentas-activas" component={ActiveRentals} />
              <Route path="/owner/rentas-activas" component={OwnerActiveRentals} />
              <Route path="/feedback" component={Feedback} />
              <Route path="/admin/feedback" component={AdminFeedback} />
              <Route path="/admin/role-requests" component={RoleRequests} />
              <Route path="/admin/sla-config" component={AdminSLAConfig} />
              <Route path="/admin/lead-scoring" component={AdminLeadScoring} />
              <Route path="/permissions" component={Permissions} />
              <Route path="/contratos" component={Contracts} />
              <Route path="/seller/commissions" component={SellerCommissions} />
              <Route path="/seller/appointments" component={SellerAppointmentManagement} />
              <Route path="/admin/predictive-analytics" component={AdminPredictiveAnalytics} />
              <Route path="/admin/legal-documents" component={AdminLegalDocuments} />
              <Route path="/admin/tenant-screening" component={AdminTenantScreening} />
              <Route path="/admin/marketing-campaigns" component={AdminMarketingCampaigns} />
              <Route path="/admin/rental-opportunity-requests" component={AdminRentalOpportunityRequests} />
              <Route path="/ayuda" component={Help} />
              <Route path="/terminos" component={Terms} />
              <Route path="/privacidad" component={Privacy} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
      {/* Onboarding Tour - shows for authenticated users who haven't completed it (except admin and master roles) */}
      {currentUser && currentUser.role !== "admin" && currentUser.role !== "master" && (
        <OnboardingTour
          userRole={currentUser.role || "cliente"}
          onboardingCompleted={currentUser.onboardingCompleted || false}
          onboardingSteps={currentUser.onboardingSteps as Record<string, boolean> | undefined}
        />
      )}
    </SidebarProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <AuthenticatedApp />
              <Toaster />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
