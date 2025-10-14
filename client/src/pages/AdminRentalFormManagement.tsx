import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, FileText, CheckCircle2, XCircle, Eye, Mail, Phone, Building2, User, Briefcase, Calendar, DollarSign } from "lucide-react";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminRentalFormManagement() {
  const { toast } = useToast();
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"aprobar" | "rechazar">("aprobar");
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch all rental form submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["/api/rental-forms"],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ formId, status, notes }: { formId: string; status: string; notes: string }) => {
      return apiRequest("PATCH", `/api/rental-forms/${formId}/review`, { status, adminNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-forms"] });
      setReviewDialogOpen(false);
      setAdminNotes("");
      toast({
        title: reviewAction === "aprobar" ? "Formulario aprobado" : "Formulario rechazado",
        description: "El cliente será notificado de la decisión.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al revisar formulario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReview = (action: "aprobar" | "rechazar") => {
    if (!selectedForm) return;
    
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const confirmReview = () => {
    if (!selectedForm) return;
    
    const status = reviewAction === "aprobar" ? "aprobado" : "rechazado";
    reviewMutation.mutate({
      formId: selectedForm.id,
      status,
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendiente: { label: "Pendiente", variant: "secondary" },
      en_revision: { label: "En Revisión", variant: "default" },
      aprobado: { label: "Aprobado", variant: "outline" },
      rechazado: { label: "Rechazado", variant: "destructive" },
    };
    
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const pendingForms = submissions?.filter((s: any) => s.status === "pendiente") || [];
  const inReviewForms = submissions?.filter((s: any) => s.status === "en_revision") || [];
  const approvedForms = submissions?.filter((s: any) => s.status === "aprobado") || [];
  const rejectedForms = submissions?.filter((s: any) => s.status === "rechazado") || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Formatos de Renta</h1>
        <p className="text-muted-foreground">
          Revisa y gestiona las solicitudes de renta de inquilinos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingForms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{inReviewForms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">{approvedForms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rechazados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-500">{rejectedForms.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendientes">
            Pendientes ({pendingForms.length})
          </TabsTrigger>
          <TabsTrigger value="en_revision">
            En Revisión ({inReviewForms.length})
          </TabsTrigger>
          <TabsTrigger value="aprobados">
            Aprobados ({approvedForms.length})
          </TabsTrigger>
          <TabsTrigger value="rechazados">
            Rechazados ({rejectedForms.length})
          </TabsTrigger>
        </TabsList>

        {[
          { key: "pendientes", forms: pendingForms },
          { key: "en_revision", forms: inReviewForms },
          { key: "aprobados", forms: approvedForms },
          { key: "rechazados", forms: rejectedForms },
        ].map(({ key, forms }) => (
          <TabsContent key={key} value={key} className="space-y-4">
            {forms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay formularios en esta categoría</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {forms.map((form: any) => (
                  <Card key={form.id} className="hover-elevate">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{form.fullName}</CardTitle>
                            {getStatusBadge(form.status)}
                          </div>
                          <CardDescription>
                            {form.property && getPropertyTitle(form.property)}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedForm(form);
                            setDetailsDialogOpen(true);
                          }}
                          data-testid={`button-view-details-${form.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{form.email}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">WhatsApp</p>
                            <p className="text-sm font-medium">{form.whatsappNumber}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Empresa</p>
                            <p className="text-sm font-medium">{form.companyName || "No especificado"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Ingreso Mensual</p>
                            <p className="text-sm font-medium">{form.monthlyIncome || "No especificado"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Fecha de Entrada</p>
                            <p className="text-sm font-medium">
                              {form.checkInDate
                                ? format(new Date(form.checkInDate), "dd MMM yyyy", { locale: es })
                                : "No especificado"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Núm. Inquilinos</p>
                            <p className="text-sm font-medium">{form.numberOfTenants || "1"}</p>
                          </div>
                        </div>
                      </div>

                      {form.createdAt && (
                        <div className="text-xs text-muted-foreground border-t pt-3">
                          Enviado: {format(new Date(form.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                        </div>
                      )}

                      {form.status === "pendiente" && (
                        <div className="flex gap-2 border-t pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedForm(form);
                              handleReview("rechazar");
                            }}
                            data-testid={`button-reject-${form.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedForm(form);
                              handleReview("aprobar");
                            }}
                            data-testid={`button-approve-${form.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aprobar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Formulario de Renta</DialogTitle>
            <DialogDescription>
              Información completa del solicitante
            </DialogDescription>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h3 className="font-semibold">{selectedForm.fullName}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedForm.property && getPropertyTitle(selectedForm.property)}
                </p>
                {getStatusBadge(selectedForm.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Datos Personales</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium">{selectedForm.email}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">WhatsApp</dt>
                      <dd className="font-medium">{selectedForm.whatsappNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Celular Alternativo</dt>
                      <dd className="font-medium">{selectedForm.cellphone || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Nacionalidad</dt>
                      <dd className="font-medium">{selectedForm.nationality || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Edad</dt>
                      <dd className="font-medium">{selectedForm.age || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Estado Civil</dt>
                      <dd className="font-medium">{selectedForm.maritalStatus || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tiempo en Tulum</dt>
                      <dd className="font-medium">{selectedForm.timeInTulum || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Dirección Actual</dt>
                      <dd className="font-medium">{selectedForm.address || "No especificado"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Información Laboral</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Puesto</dt>
                      <dd className="font-medium">{selectedForm.jobPosition || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Empresa</dt>
                      <dd className="font-medium">{selectedForm.companyName || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Ingreso Mensual</dt>
                      <dd className="font-medium">{selectedForm.monthlyIncome || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Antigüedad</dt>
                      <dd className="font-medium">{selectedForm.companyTenure || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Dirección del Trabajo</dt>
                      <dd className="font-medium">{selectedForm.workplaceAddress || "No especificado"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4 md:col-span-2">
                  <h4 className="font-semibold">Detalles de Renta</h4>
                  <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Fecha de Entrada</dt>
                      <dd className="font-medium">
                        {selectedForm.checkInDate
                          ? format(new Date(selectedForm.checkInDate), "dd MMM yyyy", { locale: es })
                          : "No especificado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Número de Inquilinos</dt>
                      <dd className="font-medium">{selectedForm.numberOfTenants || "1"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Método de Pago</dt>
                      <dd className="font-medium">{selectedForm.paymentMethod || "No especificado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Mascotas</dt>
                      <dd className="font-medium">{selectedForm.hasPets ? "Sí" : "No"}</dd>
                    </div>
                    {selectedForm.hasPets && selectedForm.petDetails && (
                      <div className="md:col-span-2">
                        <dt className="text-muted-foreground">Detalles de Mascotas</dt>
                        <dd className="font-medium">{selectedForm.petDetails}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {selectedForm.adminNotes && (
                  <div className="space-y-2 md:col-span-2 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm">Notas del Administrador</h4>
                    <p className="text-sm text-muted-foreground">{selectedForm.adminNotes}</p>
                  </div>
                )}
              </div>

              {selectedForm.status === "pendiente" && (
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleReview("rechazar");
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleReview("aprobar");
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "aprobar" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "aprobar"
                ? "El cliente será notificado de la aprobación."
                : "Proporciona una razón para el rechazo."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Notas / Comentarios</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  reviewAction === "aprobar"
                    ? "Notas opcionales sobre la aprobación..."
                    : "Explica la razón del rechazo..."
                }
                rows={4}
                data-testid="textarea-admin-notes"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={confirmReview}
                disabled={reviewMutation.isPending || (reviewAction === "rechazar" && !adminNotes)}
                data-testid="button-confirm-review"
              >
                {reviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
