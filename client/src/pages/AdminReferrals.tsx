import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Users, Home, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { ClientReferral, OwnerReferral, ReferralConfig } from "@shared/schema";

interface ReferralUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  profileImageUrl?: string | null;
}

interface UserReferrals {
  user: ReferralUser;
  clientReferrals: ClientReferral[];
  ownerReferrals: OwnerReferral[];
}

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
  switch (status) {
    case "completado":
    case "aprobado":
    case "pagado":
      return "default";
    case "pendiente_confirmacion":
    case "confirmado":
    case "en_revision":
      return "secondary";
    case "rechazado":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    pendiente_confirmacion: "Pendiente Confirmación",
    confirmado: "Confirmado",
    en_revision: "En Revisión",
    completado: "Completado",
    rechazado: "Rechazado",
    aprobado: "Aprobado",
    pagado: "Pagado",
  };
  return labels[status] || status;
};

export default function AdminReferrals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { data: config } = useQuery<ReferralConfig>({
    queryKey: ["/api/referrals/config"],
  });

  const { data: referralsByUser = [], isLoading, isError } = useQuery<UserReferrals[]>({
    queryKey: ["/api/admin/referrals/all", { type: typeFilter === "all" ? undefined : typeFilter, status: statusFilter === "all" ? undefined : statusFilter }],
  });

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const filteredReferrals = referralsByUser.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userName = `${item.user.firstName || ""} ${item.user.lastName || ""}`.toLowerCase();
    const userEmail = item.user.email.toLowerCase();
    return userName.includes(query) || userEmail.includes(query);
  });

  const totalClientReferrals = referralsByUser.reduce((sum, item) => sum + item.clientReferrals.length, 0);
  const totalOwnerReferrals = referralsByUser.reduce((sum, item) => sum + item.ownerReferrals.length, 0);
  
  const completedClientReferrals = referralsByUser.reduce((sum, item) => 
    sum + item.clientReferrals.filter(r => r.status === "completado").length, 0
  );
  const completedOwnerReferrals = referralsByUser.reduce((sum, item) => 
    sum + item.ownerReferrals.filter(r => r.status === "aprobado" || r.status === "pagado").length, 0
  );

  const totalEarnings = referralsByUser.reduce((sum, item) => {
    const clientEarnings = item.clientReferrals
      .filter(r => r.status === "completado")
      .reduce((s, r) => s + parseFloat(r.commissionAmount || "0"), 0);
    const ownerEarnings = item.ownerReferrals
      .filter(r => r.status === "aprobado" || r.status === "pagado")
      .reduce((s, r) => s + parseFloat(r.commissionAmount || "0"), 0);
    return sum + clientEarnings + ownerEarnings;
  }, 0);

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-referrals-title">
            Gestión de Referidos
          </h1>
          <p className="text-secondary-foreground mt-2">
            Vista administrativa de todos los referidos del sistema
          </p>
        </div>
        
        <Alert variant="destructive" data-testid="alert-referrals-error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudo cargar la información de referidos. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Referidos</h1>
          <p className="text-secondary-foreground mt-2">
            Vista administrativa de todos los referidos del sistema
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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

        <Card>
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
        <h1 className="text-3xl font-bold" data-testid="text-admin-referrals-title">
          Gestión de Referidos
        </h1>
        <p className="text-secondary-foreground mt-2">
          Vista administrativa de todos los referidos del sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Referidos</CardTitle>
            <Users className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-referrals">
              {totalClientReferrals + totalOwnerReferrals}
            </div>
            <p className="text-xs text-secondary-foreground">
              {totalClientReferrals} clientes · {totalOwnerReferrals} propietarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referidos Completados</CardTitle>
            <Home className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-referrals">
              {completedClientReferrals + completedOwnerReferrals}
            </div>
            <p className="text-xs text-secondary-foreground">
              {completedClientReferrals} clientes · {completedOwnerReferrals} propietarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-earnings">
              ${totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-secondary-foreground">
              {config?.clientReferralCommissionPercent}% clientes · {config?.ownerReferralCommissionPercent}% propietarios
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra referidos por usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                <SelectValue placeholder="Tipo de referido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="client">Solo clientes</SelectItem>
                <SelectItem value="owner">Solo propietarios</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente_confirmacion">Pendiente Confirmación</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="en_revision">En Revisión</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredReferrals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-secondary-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron referidos</h3>
              <p className="text-secondary-foreground">
                {searchQuery ? "Intenta con otros términos de búsqueda" : "No hay referidos registrados en el sistema"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReferrals.map((item) => {
            const isExpanded = expandedUsers.has(item.user.id);
            const userName = item.user.firstName && item.user.lastName 
              ? `${item.user.firstName} ${item.user.lastName}`
              : item.user.email;
            const initials = item.user.firstName && item.user.lastName
              ? `${item.user.firstName[0]}${item.user.lastName[0]}`
              : item.user.email[0].toUpperCase();

            return (
              <Card key={item.user.id} data-testid={`card-user-${item.user.id}`}>
                <CardHeader className="cursor-pointer hover-elevate active-elevate-2" onClick={() => toggleUserExpanded(item.user.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={item.user.profileImageUrl || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{userName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>{item.user.email}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.user.role}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {item.clientReferrals.length + item.ownerReferrals.length} referidos
                        </div>
                        <div className="text-xs text-secondary-foreground">
                          {item.clientReferrals.length} clientes · {item.ownerReferrals.length} propietarios
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`button-toggle-${item.user.id}`}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <Tabs defaultValue="clients" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="clients" className="flex-1" data-testid={`tab-clients-${item.user.id}`}>
                          Referidos de Clientes
                          <Badge variant="secondary" className="ml-2">
                            {item.clientReferrals.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="owners" className="flex-1" data-testid={`tab-owners-${item.user.id}`}>
                          Referidos de Propietarios
                          <Badge variant="secondary" className="ml-2">
                            {item.ownerReferrals.length}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="clients" className="space-y-3 mt-4">
                        {item.clientReferrals.length === 0 ? (
                          <p className="text-center text-secondary-foreground py-8">
                            No hay referidos de clientes
                          </p>
                        ) : (
                          item.clientReferrals.map((referral) => (
                            <div
                              key={referral.id}
                              className="border rounded-md p-4 hover-elevate"
                              data-testid={`client-referral-${referral.id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">
                                      {referral.firstName} {referral.lastName}
                                    </h4>
                                    <Badge variant={getStatusBadgeVariant(referral.status)}>
                                      {getStatusLabel(referral.status)}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-secondary-foreground space-y-1">
                                    <p>Email: {referral.email}</p>
                                    {referral.phone && <p>Teléfono: {referral.phone}</p>}
                                    {referral.notes && <p className="mt-2">Notas: {referral.notes}</p>}
                                    {referral.commissionAmount && (
                                      <p className="font-medium text-green-600 dark:text-green-400 mt-2">
                                        Comisión: ${parseFloat(referral.commissionAmount).toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="owners" className="space-y-3 mt-4">
                        {item.ownerReferrals.length === 0 ? (
                          <p className="text-center text-secondary-foreground py-8">
                            No hay referidos de propietarios
                          </p>
                        ) : (
                          item.ownerReferrals.map((referral) => (
                            <div
                              key={referral.id}
                              className="border rounded-md p-4 hover-elevate"
                              data-testid={`owner-referral-${referral.id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">
                                      {referral.firstName} {referral.lastName}
                                    </h4>
                                    <Badge variant={getStatusBadgeVariant(referral.status)}>
                                      {getStatusLabel(referral.status)}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-secondary-foreground space-y-1">
                                    <p>Email: {referral.email}</p>
                                    {referral.phone && <p>Teléfono: {referral.phone}</p>}
                                    {referral.propertyAddress && (
                                      <p>Dirección de propiedad: {referral.propertyAddress}</p>
                                    )}
                                    {referral.notes && <p className="mt-2">Notas: {referral.notes}</p>}
                                    {referral.commissionAmount && (
                                      <p className="font-medium text-green-600 dark:text-green-400 mt-2">
                                        Comisión: ${parseFloat(referral.commissionAmount).toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
