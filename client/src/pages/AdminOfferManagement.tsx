import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Download, FileText, Clock, CheckCircle2, Mail, User } from "lucide-react";

export default function AdminOfferManagement() {
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "used" | "pending">("all");

  const { data: offers, isLoading } = useQuery({
    queryKey: ["/api/offer-tokens", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const url = `/api/offer-tokens${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar ofertas");
      return response.json();
    },
    enabled: true,
  });

  const handleDownloadPDF = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/pdf`);
      if (!response.ok) throw new Error("Error al generar PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `oferta-${offerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (offer: any) => {
    const isExpired = new Date() > new Date(offer.expiresAt);
    if (offer.isUsed) {
      return <Badge variant="default" className="bg-green-600">Completada</Badge>;
    } else if (isExpired) {
      return <Badge variant="destructive">Expirada</Badge>;
    } else {
      return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const pendingOffers = offers?.filter((o: any) => !o.isUsed && new Date() <= new Date(o.expiresAt)) || [];
  const completedOffers = offers?.filter((o: any) => o.isUsed) || [];
  const expiredOffers = offers?.filter((o: any) => !o.isUsed && new Date() > new Date(o.expiresAt)) || [];

  const getFilteredOffers = () => {
    if (statusFilter === "pending") return pendingOffers;
    if (statusFilter === "used") return completedOffers;
    return offers || [];
  };

  const filteredOffers = getFilteredOffers();

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Gestión de Ofertas
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra las ofertas recibidas a través de links privados
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOffers.length}</div>
              <p className="text-xs text-muted-foreground">
                Links activos esperando oferta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOffers.length}</div>
              <p className="text-xs text-muted-foreground">
                Ofertas recibidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredOffers.length}</div>
              <p className="text-xs text-muted-foreground">
                Links no utilizados
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-offers">
              Todas ({offers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-offers">
              Pendientes ({pendingOffers.length})
            </TabsTrigger>
            <TabsTrigger value="used" data-testid="tab-completed-offers">
              Completadas ({completedOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ofertas Recibidas</CardTitle>
                <CardDescription>
                  Lista de todas las ofertas generadas y recibidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredOffers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {statusFilter === "all" ? "No hay ofertas registradas" : 
                     statusFilter === "pending" ? "No hay ofertas pendientes" : 
                     "No hay ofertas completadas"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Propiedad</TableHead>
                          <TableHead>Creado por</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha creación</TableHead>
                          <TableHead>Expira</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOffers.map((offer: any) => (
                          <TableRow key={offer.id} data-testid={`row-offer-${offer.id}`}>
                            <TableCell className="font-medium">
                              {offer.property?.title || "Sin título"}
                              <div className="text-xs text-muted-foreground">
                                {offer.property?.address}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {offer.creator?.firstName} {offer.creator?.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(offer)}</TableCell>
                            <TableCell className="text-sm">
                              {formatDate(offer.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(offer.expiresAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {offer.isUsed && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedOffer(offer)}
                                      data-testid={`button-view-${offer.id}`}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Ver
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleDownloadPDF(offer.id)}
                                      data-testid={`button-download-${offer.id}`}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      PDF
                                    </Button>
                                  </>
                                )}
                                {!offer.isUsed && new Date() <= new Date(offer.expiresAt) && (
                                  <Badge variant="secondary" className="cursor-default">
                                    Esperando respuesta
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Oferta</DialogTitle>
              <DialogDescription>
                Información completa de la oferta recibida
              </DialogDescription>
            </DialogHeader>

            {selectedOffer && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Propiedad</h3>
                  <p className="text-sm">{selectedOffer.property?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOffer.property?.address}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Información del Solicitante</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nombre</p>
                      <p className="font-medium">{selectedOffer.offerData?.fullName || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedOffer.offerData?.email || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{selectedOffer.offerData?.phone || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nacionalidad</p>
                      <p className="font-medium">{selectedOffer.offerData?.nationality || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ocupación</p>
                      <p className="font-medium">{selectedOffer.offerData?.occupation || "No especificado"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Detalles de la Oferta</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tipo de Uso</p>
                      <p className="font-medium">
                        {selectedOffer.offerData?.usageType === "vivienda" ? "Vivienda" : selectedOffer.offerData?.usageType === "subarrendamiento" ? "Subarrendamiento" : "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Renta Mensual</p>
                      <p className="font-medium">
                        ${selectedOffer.offerData?.monthlyRent || "0"} {selectedOffer.offerData?.currency || "USD"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duración del Contrato</p>
                      <p className="font-medium">{selectedOffer.offerData?.contractDuration || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha de Ingreso</p>
                      <p className="font-medium">
                        {selectedOffer.offerData?.moveInDate ? 
                          new Date(selectedOffer.offerData.moveInDate).toLocaleDateString("es-MX") : 
                          "No especificada"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ocupantes</p>
                      <p className="font-medium">{selectedOffer.offerData?.numberOfOccupants || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Costo de Contrato</p>
                      <p className="font-medium">
                        ${selectedOffer.offerData?.contractCost || "0"} MXN
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Depósito de Seguridad</p>
                      <p className="font-medium">
                        ${selectedOffer.offerData?.securityDeposit || "0"} {selectedOffer.offerData?.currency || "USD"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedOffer.offerData?.offeredServices && selectedOffer.offerData.offeredServices.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Servicios Ofrecidos</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {selectedOffer.offerData.offeredServices.map((service: string, idx: number) => (
                        <li key={idx}>{service}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedOffer.offerData?.propertyRequiredServices && selectedOffer.offerData.propertyRequiredServices.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Servicios Requeridos por la Propiedad</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {selectedOffer.offerData.propertyRequiredServices.map((service: string, idx: number) => (
                        <li key={idx}>{service}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedOffer.offerData?.pets === "yes" && (
                  <div>
                    <h3 className="font-semibold mb-2">Mascotas</h3>
                    <p className="text-sm">{selectedOffer.offerData?.petDetails || "Tiene mascotas"}</p>
                    {selectedOffer.offerData?.petPhotos && selectedOffer.offerData.petPhotos.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {selectedOffer.offerData.petPhotos.map((photoUrl: string, idx: number) => (
                          <img key={idx} src={photoUrl} alt={`Mascota ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedOffer.offerData?.additionalComments && (
                  <div>
                    <h3 className="font-semibold mb-2">Comentarios Adicionales</h3>
                    <p className="text-sm">{selectedOffer.offerData.additionalComments}</p>
                  </div>
                )}

                {selectedOffer.offerData?.signature && (
                  <div>
                    <h3 className="font-semibold mb-2">Firma Digital</h3>
                    <div className="border rounded-lg p-2 bg-white dark:bg-slate-950">
                      <img 
                        src={selectedOffer.offerData.signature} 
                        alt="Firma del cliente" 
                        className="max-h-24 mx-auto"
                      />
                    </div>
                  </div>
                )}

                {selectedOffer.offerData?.submittedAt && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Oferta enviada el: {new Date(selectedOffer.offerData.submittedAt).toLocaleString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleDownloadPDF(selectedOffer.id)}
                    className="flex-1"
                    data-testid="button-download-pdf-modal"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOffer(null)}
                    className="flex-1"
                    data-testid="button-close-modal"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
