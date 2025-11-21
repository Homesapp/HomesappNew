import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, DollarSign, Bell, Search, Plus, Calendar, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import type { ExternalUnitOwner, ExternalOwnerCharge, ExternalOwnerNotification } from "@shared/schema";

interface OwnerWithUnit extends ExternalUnitOwner {
  unit?: {
    id: string;
    unitNumber: string;
    condominium: {
      id: string;
      name: string;
    };
  };
}

export default function ExternalOwners() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<OwnerWithUnit | null>(null);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [bulkNotificationDialogOpen, setBulkNotificationDialogOpen] = useState(false);
  
  // Pagination state (3 rows x 3 cols = 9 cards per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch owners
  const { data: owners = [], isLoading } = useQuery<OwnerWithUnit[]>({
    queryKey: ["/api/external/owners"],
  });

  // Fetch charges
  const { data: charges = [] } = useQuery<ExternalOwnerCharge[]>({
    queryKey: ["/api/external/owner-charges"],
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<ExternalOwnerNotification[]>({
    queryKey: ["/api/external/owner-notifications"],
  });

  // Create charge mutation
  const createChargeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/external/owner-charges", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/owner-charges"] });
      toast({
        title: "Cobro creado",
        description: "El cobro se ha enviado correctamente al propietario.",
      });
      setChargeDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/external/owner-notifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/owner-notifications"] });
      toast({
        title: "Notificación enviada",
        description: "La notificación se ha enviado correctamente.",
      });
      setNotificationDialogOpen(false);
      setBulkNotificationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter owners
  const filteredOwners = owners?.filter(
    (owner) =>
      (owner.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (owner.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (owner.phone ?? "").includes(searchTerm)
  ) || [];

  // Paginate owners (3 rows x 3 cols = 9 cards per page)
  const totalPages = Math.max(1, Math.ceil(filteredOwners.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOwners = filteredOwners.slice(startIndex, endIndex);

  // Clamp page when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredOwners.length]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Propietarios
          </h1>
          <p className="text-muted-foreground">
            Gestiona propietarios, cobros y notificaciones
          </p>
        </div>
        <Button
          onClick={() => setBulkNotificationDialogOpen(true)}
          data-testid="button-bulk-notification"
        >
          <Bell className="mr-2 h-4 w-4" />
          Notificación Masiva
        </Button>
      </div>

      <Tabs defaultValue="owners" className="w-full">
        <TabsList>
          <TabsTrigger value="owners" data-testid="tab-owners">
            <Users className="mr-2 h-4 w-4" />
            Propietarios
          </TabsTrigger>
          <TabsTrigger value="charges" data-testid="tab-charges">
            <DollarSign className="mr-2 h-4 w-4" />
            Cobros
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* Owners Tab */}
        <TabsContent value="owners" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-owners"
            />
          </div>

          {/* Owners Grid */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando propietarios...
            </div>
          ) : filteredOwners.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No se encontraron propietarios
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedOwners.map((owner) => (
                <Card key={owner.id} className="hover-elevate" data-testid={`card-owner-${owner.id}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{owner.name}</CardTitle>
                    <CardDescription>
                      {owner.unit?.condominium.name} - Unidad {owner.unit?.unitNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {owner.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{owner.email}</span>
                      </div>
                    )}
                    {owner.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{owner.phone}</span>
                      </div>
                    )}
                    <Badge variant={owner.ownerType === "nacional" ? "default" : "secondary"}>
                      {owner.ownerType === "nacional" ? "Nacional" : "Internacional"}
                    </Badge>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedOwner(owner);
                          setChargeDialogOpen(true);
                        }}
                        data-testid={`button-charge-${owner.id}`}
                      >
                        <DollarSign className="mr-1 h-3 w-3" />
                        Cobro
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedOwner(owner);
                          setNotificationDialogOpen(true);
                        }}
                        data-testid={`button-notify-${owner.id}`}
                      >
                        <Bell className="mr-1 h-3 w-3" />
                        Notificar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              {filteredOwners.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1}-{Math.min(endIndex, filteredOwners.length)} de {filteredOwners.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      data-testid="button-owners-first-page"
                    >
                      Primera
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-owners-prev-page"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-owners-next-page"
                    >
                      Siguiente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      data-testid="button-owners-last-page"
                    >
                      Última
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Charges Tab */}
        <TabsContent value="charges" className="space-y-4">
          {charges.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay cobros registrados
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {charges.map((charge) => {
                const owner = owners.find((o) => o.id === charge.ownerId);
                return (
                  <Card key={charge.id} data-testid={`card-charge-${charge.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{charge.description}</CardTitle>
                          <CardDescription>{owner?.name}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            charge.status === "paid"
                              ? "default"
                              : charge.status === "overdue"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {charge.status === "paid"
                            ? "Pagado"
                            : charge.status === "overdue"
                            ? "Vencido"
                            : "Pendiente"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monto:</span>
                        <span className="font-semibold">
                          {charge.currency} ${parseFloat(charge.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fecha límite:</span>
                        <span>{format(new Date(charge.dueDate), "dd/MM/yyyy")}</span>
                      </div>
                      {charge.paidDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pagado el:</span>
                          <span>{format(new Date(charge.paidDate), "dd/MM/yyyy")}</span>
                        </div>
                      )}
                      {charge.notes && (
                        <p className="text-sm text-muted-foreground pt-2">{charge.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay notificaciones registradas
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notification) => {
                const owner = owners.find((o) => o.id === notification.ownerId);
                return (
                  <Card key={notification.id} data-testid={`card-notification-${notification.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle>{notification.title}</CardTitle>
                          <CardDescription>{owner?.name || "Notificación general"}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            notification.priority === "urgent"
                              ? "destructive"
                              : notification.priority === "high"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {notification.priority === "urgent"
                            ? "Urgente"
                            : notification.priority === "high"
                            ? "Alta"
                            : notification.priority === "normal"
                            ? "Normal"
                            : "Baja"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        <span>
                          Tipo:{" "}
                          {notification.type === "work"
                            ? "Trabajo"
                            : notification.type === "failure"
                            ? "Falla"
                            : notification.type === "emergency"
                            ? "Emergencia"
                            : "General"}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Charge Dialog */}
      <ChargeDialog
        open={chargeDialogOpen}
        onOpenChange={setChargeDialogOpen}
        owner={selectedOwner}
        onSubmit={(data) => createChargeMutation.mutate(data)}
        isPending={createChargeMutation.isPending}
      />

      {/* Create Notification Dialog */}
      <NotificationDialog
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
        owner={selectedOwner}
        onSubmit={(data) => createNotificationMutation.mutate(data)}
        isPending={createNotificationMutation.isPending}
      />

      {/* Bulk Notification Dialog */}
      <BulkNotificationDialog
        open={bulkNotificationDialogOpen}
        onOpenChange={setBulkNotificationDialogOpen}
        owners={owners}
        onSubmit={(data) => createNotificationMutation.mutate(data)}
        isPending={createNotificationMutation.isPending}
      />
    </div>
  );
}

// Charge Dialog Component
interface ChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: OwnerWithUnit | null;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

function ChargeDialog({ open, onOpenChange, owner, onSubmit, isPending }: ChargeDialogProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    currency: "MXN",
    dueDate: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner?.unit?.id || !owner.id) return;

    onSubmit({
      ownerId: owner.id,
      unitId: owner.unit.id,
      description: formData.description,
      amount: formData.amount,
      currency: formData.currency,
      dueDate: new Date(formData.dueDate).toISOString(),
      notes: formData.notes || undefined,
      status: "pending",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Cobro</DialogTitle>
            <DialogDescription>
              Enviar cobro a {owner?.name} - Unidad {owner?.unit?.unitNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                required
                placeholder="Mantenimiento mensual, reparación, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-charge-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  data-testid="input-charge-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency" data-testid="select-charge-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha Límite</Label>
              <Input
                id="dueDate"
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                data-testid="input-charge-due-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="textarea-charge-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel-charge"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit-charge">
              {isPending ? "Enviando..." : "Enviar Cobro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Notification Dialog Component
interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: OwnerWithUnit | null;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

function NotificationDialog({
  open,
  onOpenChange,
  owner,
  onSubmit,
  isPending,
}: NotificationDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
    priority: "normal",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    onSubmit({
      ownerId: owner.id,
      unitId: owner.unit?.id || undefined,
      condominiumId: owner.unit?.condominium.id || undefined,
      title: formData.title,
      message: formData.message,
      type: formData.type,
      priority: formData.priority,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enviar Notificación</DialogTitle>
            <DialogDescription>
              Notificar a {owner?.name} - Unidad {owner?.unit?.unitNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                required
                placeholder="Título de la notificación"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-notification-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                required
                placeholder="Detalles de la notificación..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                data-testid="textarea-notification-message"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type" data-testid="select-notification-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="work">Trabajo</SelectItem>
                    <SelectItem value="failure">Falla</SelectItem>
                    <SelectItem value="emergency">Emergencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority" data-testid="select-notification-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel-notification"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit-notification">
              {isPending ? "Enviando..." : "Enviar Notificación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Notification Dialog Component
interface BulkNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: OwnerWithUnit[];
  onSubmit: (data: any) => void;
  isPending: boolean;
}

function BulkNotificationDialog({
  open,
  onOpenChange,
  owners,
  onSubmit,
  isPending,
}: BulkNotificationDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
    priority: "normal",
    target: "all",
    condominiumId: "",
  });

  // Get unique condominiums
  const condominiums = Array.from(
    new Set(owners.map((o) => o.unit?.condominium).filter(Boolean))
  ).map((c) => ({ id: c!.id, name: c!.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      condominiumId: formData.target === "condominium" ? formData.condominiumId : undefined,
      title: formData.title,
      message: formData.message,
      type: formData.type,
      priority: formData.priority,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Notificación Masiva</DialogTitle>
            <DialogDescription>Enviar notificación a múltiples propietarios</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="target">Destino</Label>
              <Select
                value={formData.target}
                onValueChange={(value) => setFormData({ ...formData, target: value })}
              >
                <SelectTrigger id="target" data-testid="select-bulk-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los propietarios</SelectItem>
                  <SelectItem value="condominium">Condominio específico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.target === "condominium" && (
              <div className="space-y-2">
                <Label htmlFor="condominium">Condominio</Label>
                <Select
                  value={formData.condominiumId}
                  onValueChange={(value) => setFormData({ ...formData, condominiumId: value })}
                >
                  <SelectTrigger id="condominium" data-testid="select-bulk-condominium">
                    <SelectValue placeholder="Seleccionar condominio" />
                  </SelectTrigger>
                  <SelectContent>
                    {condominiums.map((condo) => (
                      <SelectItem key={condo.id} value={condo.id}>
                        {condo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="bulk-title">Título</Label>
              <Input
                id="bulk-title"
                required
                placeholder="Título de la notificación"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-bulk-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-message">Mensaje</Label>
              <Textarea
                id="bulk-message"
                required
                placeholder="Detalles de la notificación..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                data-testid="textarea-bulk-message"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="bulk-type" data-testid="select-bulk-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="work">Trabajo</SelectItem>
                    <SelectItem value="failure">Falla</SelectItem>
                    <SelectItem value="emergency">Emergencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-priority">Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="bulk-priority" data-testid="select-bulk-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel-bulk"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit-bulk">
              {isPending ? "Enviando..." : "Enviar Notificación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
