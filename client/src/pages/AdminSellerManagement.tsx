import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Users, 
  TrendingUp, 
  FileText, 
  Home,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SellerData {
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
    phone?: string;
  };
  stats: {
    totalAssignedLeads: number;
    totalRegisteredLeads: number;
    totalRecommendations: number;
    leadsByStatus: {
      nuevo: number;
      contactado: number;
      calificado: number;
      propuesta: number;
      negociacion: number;
      ganado: number;
      perdido: number;
    };
  };
  assignedLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
    source?: string;
    createdAt: string;
  }>;
  registeredLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
    source?: string;
    createdAt: string;
  }>;
  recentRecommendations: Array<{
    id: string;
    propertyId: string;
    clientId: string;
    message?: string;
    isRead: boolean;
    isInterested?: boolean;
    createdAt: string;
    property?: {
      id: string;
      title: string;
      location: string;
    };
  }>;
}

export default function AdminSellerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<SellerData | null>(null);

  const { data: sellersData = [], isLoading } = useQuery<SellerData[]>({
    queryKey: ["/api/admin/sellers/all"],
  });

  const filteredSellers = sellersData.filter(seller =>
    `${seller.seller.firstName} ${seller.seller.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.seller.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      nuevo: "outline",
      contactado: "secondary",
      calificado: "default",
      propuesta: "default",
      negociacion: "default",
      ganado: "default",
      perdido: "destructive",
    };
    return variants[status] || "outline";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      nuevo: "Nuevo",
      contactado: "Contactado",
      calificado: "Calificado",
      propuesta: "Propuesta",
      negociacion: "Negociación",
      ganado: "Ganado",
      perdido: "Perdido",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Gestión de Vendedores
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Supervisa el desempeño y actividad de todos los vendedores
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-sellers"
          />
        </div>
        <Badge variant="outline" data-testid="badge-seller-count">
          {filteredSellers.length} vendedores
        </Badge>
      </div>

      {!selectedSeller ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSellers.map((sellerData) => {
            const { seller, stats } = sellerData;
            return (
              <Card 
                key={seller.id} 
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedSeller(sellerData)}
                data-testid={`card-seller-${seller.id}`}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <Avatar className="h-12 w-12">
                    {seller.profileImageUrl && (
                      <AvatarImage src={seller.profileImageUrl} />
                    )}
                    <AvatarFallback>
                      {getInitials(seller.firstName, seller.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {seller.firstName} {seller.lastName}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {seller.email}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold" data-testid={`text-assigned-${seller.id}`}>
                        {stats.totalAssignedLeads}
                      </div>
                      <div className="text-xs text-muted-foreground">Asignados</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid={`text-registered-${seller.id}`}>
                        {stats.totalRegisteredLeads}
                      </div>
                      <div className="text-xs text-muted-foreground">Registrados</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid={`text-recommendations-${seller.id}`}>
                        {stats.totalRecommendations}
                      </div>
                      <div className="text-xs text-muted-foreground">Propiedades</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Object.entries(stats.leadsByStatus).map(([status, count]) => {
                      if (count === 0) return null;
                      return (
                        <Badge 
                          key={status} 
                          variant={getStatusBadgeVariant(status)}
                          className="text-xs"
                          data-testid={`badge-status-${status}-${seller.id}`}
                        >
                          {getStatusLabel(status)}: {count}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedSeller(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
              data-testid="button-back"
            >
              ← Volver a lista
            </button>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <Avatar className="h-16 w-16">
                {selectedSeller.seller.profileImageUrl && (
                  <AvatarImage src={selectedSeller.seller.profileImageUrl} />
                )}
                <AvatarFallback>
                  {getInitials(selectedSeller.seller.firstName, selectedSeller.seller.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">
                  {selectedSeller.seller.firstName} {selectedSeller.seller.lastName}
                </CardTitle>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{selectedSeller.seller.email}</span>
                  </div>
                  {selectedSeller.seller.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{selectedSeller.seller.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Leads Asignados
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedSeller.stats.totalAssignedLeads}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Leads Registrados
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedSeller.stats.totalRegisteredLeads}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recomendaciones
                </CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedSeller.stats.totalRecommendations}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasa de Éxito
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedSeller.stats.totalAssignedLeads > 0
                    ? Math.round(
                        (selectedSeller.stats.leadsByStatus.ganado /
                          selectedSeller.stats.totalAssignedLeads) *
                          100
                      )
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="assigned" className="space-y-4">
            <TabsList>
              <TabsTrigger value="assigned" data-testid="tab-assigned">
                Leads Asignados ({selectedSeller.assignedLeads.length})
              </TabsTrigger>
              <TabsTrigger value="registered" data-testid="tab-registered">
                Leads Registrados ({selectedSeller.registeredLeads.length})
              </TabsTrigger>
              <TabsTrigger value="recommendations" data-testid="tab-recommendations">
                Recomendaciones ({selectedSeller.recentRecommendations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assigned" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leads Asignados</CardTitle>
                  <CardDescription>
                    Leads asignados a este vendedor para dar seguimiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSeller.assignedLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay leads asignados
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fuente</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSeller.assignedLeads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                              {lead.firstName} {lead.lastName}
                            </TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.phone || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(lead.status)}>
                                {getStatusLabel(lead.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{lead.source || "-"}</TableCell>
                            <TableCell>
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registered" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leads Registrados</CardTitle>
                  <CardDescription>
                    Leads registrados por este vendedor en el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSeller.registeredLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay leads registrados
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fuente</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSeller.registeredLeads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                              {lead.firstName} {lead.lastName}
                            </TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.phone || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(lead.status)}>
                                {getStatusLabel(lead.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{lead.source || "-"}</TableCell>
                            <TableCell>
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Propiedades Recomendadas</CardTitle>
                  <CardDescription>
                    Propiedades que este vendedor ha ofrecido a sus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSeller.recentRecommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay recomendaciones recientes
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Propiedad</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Mensaje</TableHead>
                          <TableHead>Leído</TableHead>
                          <TableHead>Interés</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSeller.recentRecommendations.map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell className="font-medium">
                              {rec.property?.title || "Propiedad eliminada"}
                            </TableCell>
                            <TableCell>
                              {rec.property?.location || "-"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {rec.message || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={rec.isRead ? "secondary" : "outline"}>
                                {rec.isRead ? "Sí" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {rec.isInterested === null ? (
                                <Badge variant="outline">Sin respuesta</Badge>
                              ) : rec.isInterested ? (
                                <Badge variant="default">Interesado</Badge>
                              ) : (
                                <Badge variant="destructive">No interesado</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(rec.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
