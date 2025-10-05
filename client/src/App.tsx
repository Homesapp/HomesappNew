import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { RoleSelector } from "@/components/RoleSelector";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { apiRequest } from "@/lib/queryClient";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import PropertySearch from "@/pages/PropertySearch";
import PropertyDetails from "@/pages/PropertyDetails";
import PropertyFullDetails from "@/pages/PropertyFullDetails";
import Favorites from "@/pages/Favorites";
import LeadsKanban from "@/pages/LeadsKanban";
import RentalsKanban from "@/pages/RentalsKanban";
import Dashboard from "@/pages/Dashboard";
import PublicDashboard from "@/components/PublicDashboard";
import Properties from "@/pages/Properties";
import Appointments from "@/pages/Appointments";
import Calendar from "@/pages/Calendar";
import Directory from "@/pages/Directory";
import PresentationCards from "@/pages/PresentationCards";
import Backoffice from "@/pages/Backoffice";
import Users from "@/pages/Users";
import Clients from "@/pages/Clients";
import Budgets from "@/pages/Budgets";
import Tasks from "@/pages/Tasks";
import MyOpportunities from "@/pages/MyOpportunities";
import MyProperties from "@/pages/MyProperties";
import OwnerPropertyDetails from "@/pages/OwnerPropertyDetails";
import EditOwnerProperty from "@/pages/EditOwnerProperty";
import AdminChangeRequests from "@/pages/AdminChangeRequests";
import AdminInspectionReports from "@/pages/AdminInspectionReports";
import AdminAgreementTemplates from "@/pages/AdminAgreementTemplates";
import AdminCondominiums from "@/pages/AdminCondominiums";
import AdminChatbotConfig from "@/pages/AdminChatbotConfig";
import PropertySubmissionWizard from "@/pages/PropertySubmissionWizard";
import OwnerAppointments from "@/pages/OwnerAppointments";
import OwnerDashboard from "@/pages/OwnerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import Notifications from "@/pages/Notifications";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import ProviderApplication from "@/pages/ProviderApplication";
import CreateUser from "@/pages/CreateUser";
import Referrals from "@/pages/Referrals";
import Feedback from "@/pages/Feedback";
import AdminFeedback from "@/pages/AdminFeedback";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const [_, setLocation] = useLocation();
  
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

  const style = {
    "--sidebar-width": "12rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
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
        <Route path="/buscar-propiedades" component={PropertySearch} />
        <Route path="/solicitud-proveedor" component={ProviderApplication} />
        <Route path="/propiedad/:id/completo" component={PropertyFullDetails} />
        <Route path="/propiedad/:id" component={PropertyDetails} />
        <Route path="/favoritos" component={Favorites} />
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
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <LanguageToggle />
              <ThemeToggle />
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
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={getHomeDashboard()} />
              <Route path="/mis-citas" component={ClientDashboard} />
              <Route path="/buscar-propiedades" component={PropertySearch} />
              <Route path="/propiedad/:id/completo" component={PropertyFullDetails} />
              <Route path="/propiedad/:id" component={PropertyDetails} />
              <Route path="/favoritos" component={Favorites} />
              <Route path="/mis-oportunidades" component={MyOpportunities} />
              <Route path="/owner/dashboard" component={OwnerDashboard} />
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/mis-propiedades" component={MyProperties} />
              <Route path="/owner/property/new" component={PropertySubmissionWizard} />
              <Route path="/owner/property/:id/edit" component={EditOwnerProperty} />
              <Route path="/owner/property/:id" component={OwnerPropertyDetails} />
              <Route path="/owner/appointments" component={OwnerAppointments} />
              <Route path="/admin/change-requests" component={AdminChangeRequests} />
              <Route path="/admin/inspection-reports" component={AdminInspectionReports} />
              <Route path="/admin/agreement-templates" component={AdminAgreementTemplates} />
              <Route path="/admin/condominiums" component={AdminCondominiums} />
              <Route path="/admin/chatbot-config" component={AdminChatbotConfig} />
              <Route path="/admin/create-user" component={CreateUser} />
              <Route path="/leads" component={LeadsKanban} />
              <Route path="/rentas" component={RentalsKanban} />
              <Route path="/properties" component={Properties} />
              <Route path="/appointments" component={Appointments} />
              <Route path="/calendario" component={Calendar} />
              <Route path="/directory" component={Directory} />
              <Route path="/presentation-cards" component={PresentationCards} />
              <Route path="/presupuestos" component={Budgets} />
              <Route path="/tareas" component={Tasks} />
              <Route path="/backoffice" component={Backoffice} />
              <Route path="/users" component={Users} />
              <Route path="/clientes" component={Clients} />
              <Route path="/notificaciones" component={Notifications} />
              <Route path="/chat" component={Chat} />
              <Route path="/perfil" component={Profile} />
              <Route path="/referidos" component={Referrals} />
              <Route path="/feedback" component={Feedback} />
              <Route path="/admin/feedback" component={AdminFeedback} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
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
  );
}

export default App;
