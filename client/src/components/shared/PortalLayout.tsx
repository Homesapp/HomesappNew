import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Home, 
  FileText, 
  CreditCard, 
  Wrench, 
  MessageSquare,
  Building2,
  Phone,
  Mail,
  Calendar,
  User,
  Key
} from "lucide-react";

interface PortalTab {
  id: string;
  label: string;
  icon: typeof Home;
  content: ReactNode;
  badge?: string | number;
}

interface ContractInfo {
  propertyTitle: string;
  propertyAddress?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  currency: string;
  status: string;
  agencyName?: string;
  agencyPhone?: string;
  agencyEmail?: string;
  tenantName?: string;
  ownerName?: string;
}

interface PortalLayoutProps {
  portalType: "tenant" | "owner";
  title: string;
  contractInfo: ContractInfo;
  tabs: PortalTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children?: ReactNode;
}

export function PortalLayout({
  portalType,
  title,
  contractInfo,
  tabs,
  activeTab,
  onTabChange,
  onLogout,
  children,
}: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {portalType === "tenant" ? (
                  <Key className="h-5 w-5 text-primary" />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h1 className="font-semibold text-lg" data-testid="text-portal-title">
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {contractInfo.propertyTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                className={
                  contractInfo.status === "active" 
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : contractInfo.status === "pending"
                      ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      : "bg-muted text-muted-foreground"
                }
              >
                {contractInfo.status === "active" ? "Contrato Activo" : 
                 contractInfo.status === "pending" ? "Pendiente" : contractInfo.status}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onLogout}
                className="text-muted-foreground"
                data-testid="button-portal-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
        
        <Tabs value={activeTab} onValueChange={onTabChange} className="mt-6">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex-1 min-w-[100px] gap-1.5"
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== undefined && (
                  <Badge variant="secondary" className="text-[10px] h-4 min-w-4 px-1">
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}

interface PortalOverviewProps {
  summaryCards: ReactNode;
  quickActions?: {
    label: string;
    icon: typeof Home;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  }[];
  recentActivity?: ReactNode;
  contractDetails?: ReactNode;
}

export function PortalOverview({
  summaryCards,
  quickActions,
  recentActivity,
  contractDetails,
}: PortalOverviewProps) {
  return (
    <div className="space-y-6">
      {summaryCards}

      {quickActions && quickActions.length > 0 && (
        <Card data-testid="card-quick-actions">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={action.onClick}
                  data-testid={`button-quick-action-${index}`}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentActivity}
      
      {contractDetails}
    </div>
  );
}

interface ContractDetailsCardProps {
  contract: ContractInfo;
  showTenant?: boolean;
  showOwner?: boolean;
}

export function ContractDetailsCard({ contract, showTenant, showOwner }: ContractDetailsCardProps) {
  return (
    <Card data-testid="card-contract-details">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Detalles del Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Propiedad</p>
              <p className="font-medium">{contract.propertyTitle}</p>
              {contract.propertyAddress && (
                <p className="text-sm text-muted-foreground">{contract.propertyAddress}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="text-sm">
                {new Date(contract.startDate).toLocaleDateString("es-MX")} - 
                {new Date(contract.endDate).toLocaleDateString("es-MX")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Renta Mensual</p>
              <p className="font-semibold text-primary">
                ${contract.monthlyRent.toLocaleString()} {contract.currency}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {contract.agencyName && (
              <div>
                <p className="text-xs text-muted-foreground">Agencia</p>
                <p className="font-medium">{contract.agencyName}</p>
                {contract.agencyPhone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {contract.agencyPhone}
                  </p>
                )}
                {contract.agencyEmail && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {contract.agencyEmail}
                  </p>
                )}
              </div>
            )}
            {showTenant && contract.tenantName && (
              <div>
                <p className="text-xs text-muted-foreground">Inquilino</p>
                <p className="font-medium flex items-center gap-1">
                  <User className="h-3 w-3" /> {contract.tenantName}
                </p>
              </div>
            )}
            {showOwner && contract.ownerName && (
              <div>
                <p className="text-xs text-muted-foreground">Propietario</p>
                <p className="font-medium flex items-center gap-1">
                  <User className="h-3 w-3" /> {contract.ownerName}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
