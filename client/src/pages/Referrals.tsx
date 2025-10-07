import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Users, Home, TrendingUp, AlertCircle } from "lucide-react";
import { CreateClientReferralDialog } from "@/components/referrals/CreateClientReferralDialog";
import { CreateOwnerReferralDialog } from "@/components/referrals/CreateOwnerReferralDialog";
import { ReferralsList } from "@/components/referrals/ReferralsList";
import type { ClientReferral, OwnerReferral, ReferralConfig } from "@shared/schema";

export default function Referrals() {
  const { t } = useLanguage();
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);

  const { data: config, isLoading: configLoading, isError: configError } = useQuery<ReferralConfig>({
    queryKey: ["/api/referrals/config"],
  });

  const { data: clientReferrals = [], isLoading: clientsLoading, isError: clientsError } = useQuery<ClientReferral[]>({
    queryKey: ["/api/referrals/clients"],
  });

  const { data: ownerReferrals = [], isLoading: ownersLoading, isError: ownersError } = useQuery<OwnerReferral[]>({
    queryKey: ["/api/referrals/owners"],
  });

  const isLoading = configLoading || clientsLoading || ownersLoading;
  const hasError = configError || clientsError || ownersError;

  const completedClientReferrals = clientReferrals.filter(r => r.status === "completado");
  const completedOwnerReferrals = ownerReferrals.filter(r => r.status === "aprobado" || r.status === "pagado");

  const totalEarnings = [
    ...completedClientReferrals.map(r => parseFloat(r.commissionAmount || "0")),
    ...completedOwnerReferrals.map(r => parseFloat(r.commissionAmount || "0")),
  ].reduce((sum, amount) => sum + amount, 0);

  if (hasError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-referrals-title">
            {t("referrals.title", "Red de Referidos")}
          </h1>
          <p className="text-secondary-foreground mt-2" data-testid="text-referrals-description">
            {t("referrals.description", "Recomienda clientes y propietarios y gana comisiones")}
          </p>
        </div>
        
        <Alert variant="destructive" data-testid="alert-referrals-error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("common.error", "Error")}</AlertTitle>
          <AlertDescription>
            {t("referrals.loadError", "No se pudo cargar la información de referidos. Por favor, intenta de nuevo.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-referrals-title">
            {t("referrals.title", "Red de Referidos")}
          </h1>
          <p className="text-secondary-foreground mt-2" data-testid="text-referrals-description">
            {t("referrals.description", "Recomienda clientes y propietarios y gana comisiones")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3" data-testid="loading-stats">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card data-testid="loading-referrals">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-referrals-title">
          {t("referrals.title", "Red de Referidos")}
        </h1>
        <p className="text-secondary-foreground mt-2" data-testid="text-referrals-description">
          {t("referrals.description", "Recomienda clientes y propietarios y gana comisiones")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("referrals.totalReferrals", "Total de Referidos")}
            </CardTitle>
            <Users className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-referrals">
              {clientReferrals.length + ownerReferrals.length}
            </div>
            <p className="text-xs text-secondary-foreground">
              {clientReferrals.length} {t("referrals.clients", "clientes")} · {ownerReferrals.length} {t("referrals.owners", "propietarios")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("referrals.completedReferrals", "Referidos Completados")}
            </CardTitle>
            <Home className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-referrals">
              {completedClientReferrals.length + completedOwnerReferrals.length}
            </div>
            <p className="text-xs text-secondary-foreground">
              {completedClientReferrals.length} {t("referrals.clients", "clientes")} · {completedOwnerReferrals.length} {t("referrals.owners", "propietarios")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("referrals.totalEarnings", "Comisiones Ganadas")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-earnings">
              ${totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-secondary-foreground">
              {config?.clientReferralCommissionPercent}% {t("referrals.clients", "clientes")} · {config?.ownerReferralCommissionPercent}% {t("referrals.owners", "propietarios")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients" data-testid="tab-client-referrals">
            <Users className="h-4 w-4 mr-2" />
            {t("referrals.clientReferrals", "Referidos de Clientes")}
            <Badge variant="secondary" className="ml-2">
              {clientReferrals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="owners" data-testid="tab-owner-referrals">
            <Home className="h-4 w-4 mr-2" />
            {t("referrals.ownerReferrals", "Referidos de Propietarios")}
            <Badge variant="secondary" className="ml-2">
              {ownerReferrals.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {t("referrals.clientReferrals", "Referidos de Clientes")}
              </h2>
              <p className="text-sm text-secondary-foreground">
                {t("referrals.clientReferralsDesc", "Recomienda personas que buscan rentar propiedades")}
              </p>
            </div>
            <Button onClick={() => setShowClientDialog(true)} data-testid="button-add-client-referral">
              <Plus className="h-4 w-4 mr-2" />
              {t("referrals.addClientReferral", "Agregar Referido")}
            </Button>
          </div>

          <ReferralsList type="client" referrals={clientReferrals} />
        </TabsContent>

        <TabsContent value="owners" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {t("referrals.ownerReferrals", "Referidos de Propietarios")}
              </h2>
              <p className="text-sm text-secondary-foreground">
                {t("referrals.ownerReferralsDesc", "Recomienda personas con propiedades para rentar")}
              </p>
            </div>
            <Button onClick={() => setShowOwnerDialog(true)} data-testid="button-add-owner-referral">
              <Plus className="h-4 w-4 mr-2" />
              {t("referrals.addOwnerReferral", "Agregar Referido")}
            </Button>
          </div>

          <ReferralsList type="owner" referrals={ownerReferrals} />
        </TabsContent>
      </Tabs>

      <CreateClientReferralDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
      />

      <CreateOwnerReferralDialog
        open={showOwnerDialog}
        onOpenChange={setShowOwnerDialog}
      />
    </div>
  );
}
