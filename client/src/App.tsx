import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { RoleSelector } from "@/components/RoleSelector";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UserProfileMenu } from "@/components/UserProfileMenu";
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
import OwnerAppointments from "@/pages/OwnerAppointments";
import OwnerDashboard from "@/pages/OwnerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
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
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
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
  
  const userRole = currentUser?.role || "owner";

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
              <Route path="/" component={Dashboard} />
              <Route path="/buscar-propiedades" component={PropertySearch} />
              <Route path="/propiedad/:id/completo" component={PropertyFullDetails} />
              <Route path="/propiedad/:id" component={PropertyDetails} />
              <Route path="/favoritos" component={Favorites} />
              <Route path="/mis-oportunidades" component={MyOpportunities} />
              <Route path="/owner/dashboard" component={OwnerDashboard} />
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/mis-propiedades" component={MyProperties} />
              <Route path="/owner/property/:id/edit" component={EditOwnerProperty} />
              <Route path="/owner/property/:id" component={OwnerPropertyDetails} />
              <Route path="/owner/appointments" component={OwnerAppointments} />
              <Route path="/admin/change-requests" component={AdminChangeRequests} />
              <Route path="/admin/inspection-reports" component={AdminInspectionReports} />
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
