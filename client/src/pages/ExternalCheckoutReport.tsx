import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2, X, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import type { 
  ExternalRentalContract,
  ExternalCheckoutReport,
  InsertExternalCheckoutReport
} from "@shared/schema";
import { insertExternalCheckoutReportSchema } from "@shared/schema";

type CheckoutFormData = z.infer<typeof insertExternalCheckoutReportSchema>;

interface InventoryItem {
  item: string;
  condition: string;
  notes?: string;
}

interface MaintenanceIssue {
  description: string;
  cost: number;
  notes?: string;
}

interface CleaningArea {
  area: string;
  status: string;
  notes?: string;
}

export default function ExternalCheckoutReport() {
  const { contractId } = useParams();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("inventory");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>([]);
  const [cleaningAreas, setCleaningAreas] = useState<CleaningArea[]>([]);
  const [newInventoryItem, setNewInventoryItem] = useState({ item: "", condition: "", notes: "" });
  const [newMaintenanceIssue, setNewMaintenanceIssue] = useState({ description: "", cost: 0, notes: "" });
  const [newCleaningArea, setNewCleaningArea] = useState({ area: "", status: "", notes: "" });
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const { data: contract, isLoading: contractLoading } = useQuery<ExternalRentalContract>({
    queryKey: [`/api/external-rental-contracts/${contractId}`],
    enabled: !!contractId,
  });

  const { data: existingReport, isLoading: reportLoading } = useQuery<ExternalCheckoutReport | null>({
    queryKey: [`/api/external-checkout-reports/contract/${contractId}`],
    enabled: !!contractId,
  });

  useEffect(() => {
    if (existingReport) {
      setInventoryItems(existingReport.inventoryItems || []);
      setMaintenanceIssues(existingReport.maintenanceIssues || []);
      setCleaningAreas(existingReport.cleaningAreas || []);
    }
  }, [existingReport]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertExternalCheckoutReport>) => {
      return await apiRequest(`/api/external-checkout-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-checkout-reports/contract/${contractId}`] });
      toast({
        title: language === "es" ? "Reporte creado" : "Report created",
        description: language === "es" ? "El reporte de check-out ha sido creado exitosamente" : "The checkout report has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo crear el reporte" : "Failed to create report"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertExternalCheckoutReport>) => {
      return await apiRequest(`/api/external-checkout-reports/${existingReport?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-checkout-reports/contract/${contractId}`] });
      toast({
        title: language === "es" ? "Reporte actualizado" : "Report updated",
        description: language === "es" ? "El reporte de check-out ha sido actualizado exitosamente" : "The checkout report has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo actualizar el reporte" : "Failed to update report"),
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/external-checkout-reports/${existingReport?.id}/complete`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-checkout-reports/contract/${contractId}`] });
      toast({
        title: language === "es" ? "Reporte completado" : "Report completed",
        description: language === "es" ? "El reporte de check-out ha sido completado" : "The checkout report has been completed",
      });
      setShowCompleteDialog(false);
      navigate(`/external/rentals/${contractId}`);
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo completar el reporte" : "Failed to complete report"),
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    if (!contract) return;

    const totalDeductions = maintenanceIssues.reduce((sum, issue) => sum + (Number(issue.cost) || 0), 0);
    const securityDeposit = Number(contract.securityDeposit) || 0;
    const refundAmount = Math.max(0, securityDeposit - totalDeductions);

    const reportData = {
      contractId: contractId!,
      inventoryItems,
      maintenanceIssues,
      cleaningAreas,
      totalDeductions,
      refundAmount,
      status: "draft" as const,
    };

    if (existingReport) {
      await updateMutation.mutateAsync(reportData);
    } else {
      await createMutation.mutateAsync(reportData);
    }
  };

  const handleComplete = () => {
    setShowCompleteDialog(true);
  };

  const addInventoryItem = () => {
    if (!newInventoryItem.item || !newInventoryItem.condition) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Por favor completa todos los campos requeridos" : "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }
    setInventoryItems([...inventoryItems, { ...newInventoryItem }]);
    setNewInventoryItem({ item: "", condition: "", notes: "" });
  };

  const removeInventoryItem = (index: number) => {
    setInventoryItems(inventoryItems.filter((_, i) => i !== index));
  };

  const addMaintenanceIssue = () => {
    if (!newMaintenanceIssue.description || !newMaintenanceIssue.cost) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Por favor completa todos los campos requeridos" : "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }
    setMaintenanceIssues([...maintenanceIssues, { ...newMaintenanceIssue }]);
    setNewMaintenanceIssue({ description: "", cost: 0, notes: "" });
  };

  const removeMaintenanceIssue = (index: number) => {
    setMaintenanceIssues(maintenanceIssues.filter((_, i) => i !== index));
  };

  const addCleaningArea = () => {
    if (!newCleaningArea.area || !newCleaningArea.status) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Por favor completa todos los campos requeridos" : "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }
    setCleaningAreas([...cleaningAreas, { ...newCleaningArea }]);
    setNewCleaningArea({ area: "", status: "", notes: "" });
  };

  const removeCleaningArea = (index: number) => {
    setCleaningAreas(cleaningAreas.filter((_, i) => i !== index));
  };

  if (contractLoading || reportLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {language === "es" ? "Contrato no encontrado" : "Contract not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDeductions = maintenanceIssues.reduce((sum, issue) => sum + (Number(issue.cost) || 0), 0);
  const securityDeposit = Number(contract.securityDeposit) || 0;
  const refundAmount = Math.max(0, securityDeposit - totalDeductions);
  const isCompleted = existingReport?.status === "completed";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/external/rentals/${contractId}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {language === "es" ? "Reporte de Check-Out" : "Check-Out Report"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contract.tenantName} - {contract.unitNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existingReport?.status === "draft" && (
            <>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-draft"
              >
                <Save className="h-4 w-4 mr-2" />
                {language === "es" ? "Guardar Borrador" : "Save Draft"}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                variant="default"
                data-testid="button-complete"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {language === "es" ? "Completar" : "Complete"}
              </Button>
            </>
          )}
          {!existingReport && (
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending}
              data-testid="button-create"
            >
              <Save className="h-4 w-4 mr-2" />
              {language === "es" ? "Crear Reporte" : "Create Report"}
            </Button>
          )}
          {isCompleted && (
            <Badge variant="default" data-testid="badge-completed">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {language === "es" ? "Completado" : "Completed"}
            </Badge>
          )}
        </div>
      </div>

      <Card data-testid="card-summary">
        <CardHeader>
          <CardTitle>{language === "es" ? "Resumen Financiero" : "Financial Summary"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{language === "es" ? "Depósito de Seguridad:" : "Security Deposit:"}</span>
            <span className="font-medium" data-testid="text-security-deposit">
              ${Number.isFinite(securityDeposit) ? securityDeposit.toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{language === "es" ? "Total Deducciones:" : "Total Deductions:"}</span>
            <span className="font-medium text-destructive" data-testid="text-total-deductions">
              ${Number.isFinite(totalDeductions) ? totalDeductions.toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">{language === "es" ? "Monto a Reembolsar:" : "Refund Amount:"}</span>
            <span className="font-bold text-lg" data-testid="text-refund-amount">
              ${Number.isFinite(refundAmount) ? refundAmount.toFixed(2) : "0.00"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            {language === "es" ? "Inventario" : "Inventory"} ({inventoryItems.length})
          </TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-maintenance">
            {language === "es" ? "Mantenimiento" : "Maintenance"} ({maintenanceIssues.length})
          </TabsTrigger>
          <TabsTrigger value="cleaning" data-testid="tab-cleaning">
            {language === "es" ? "Limpieza" : "Cleaning"} ({cleaningAreas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card data-testid="card-inventory">
            <CardHeader>
              <CardTitle>{language === "es" ? "Inventario de Salida" : "Exit Inventory"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/50">
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Artículo" : "Item"} *</Label>
                    <Input
                      value={newInventoryItem.item}
                      onChange={(e) => setNewInventoryItem({ ...newInventoryItem, item: e.target.value })}
                      placeholder={language === "es" ? "Ej: Refrigerador" : "E.g: Refrigerator"}
                      data-testid="input-inventory-item"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Condición" : "Condition"} *</Label>
                    <Input
                      value={newInventoryItem.condition}
                      onChange={(e) => setNewInventoryItem({ ...newInventoryItem, condition: e.target.value })}
                      placeholder={language === "es" ? "Ej: Buen estado" : "E.g: Good condition"}
                      data-testid="input-inventory-condition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Notas" : "Notes"}</Label>
                    <Input
                      value={newInventoryItem.notes || ""}
                      onChange={(e) => setNewInventoryItem({ ...newInventoryItem, notes: e.target.value })}
                      placeholder={language === "es" ? "Notas adicionales" : "Additional notes"}
                      data-testid="input-inventory-notes"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addInventoryItem} className="w-full" data-testid="button-add-inventory">
                      <Plus className="h-4 w-4 mr-2" />
                      {language === "es" ? "Agregar" : "Add"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {inventoryItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {language === "es" ? "No hay artículos en el inventario" : "No inventory items"}
                  </p>
                ) : (
                  inventoryItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md" data-testid={`inventory-item-${index}`}>
                      <div className="flex-1">
                        <p className="font-medium">{item.item}</p>
                        <p className="text-sm text-muted-foreground">{item.condition}</p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                      </div>
                      {!isCompleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInventoryItem(index)}
                          data-testid={`button-remove-inventory-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card data-testid="card-maintenance">
            <CardHeader>
              <CardTitle>{language === "es" ? "Problemas de Mantenimiento" : "Maintenance Issues"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/50">
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Descripción" : "Description"} *</Label>
                    <Input
                      value={newMaintenanceIssue.description}
                      onChange={(e) => setNewMaintenanceIssue({ ...newMaintenanceIssue, description: e.target.value })}
                      placeholder={language === "es" ? "Ej: Puerta dañada" : "E.g: Damaged door"}
                      data-testid="input-maintenance-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Costo" : "Cost"} *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMaintenanceIssue.cost || ""}
                      onChange={(e) => setNewMaintenanceIssue({ ...newMaintenanceIssue, cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      data-testid="input-maintenance-cost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Notas" : "Notes"}</Label>
                    <Input
                      value={newMaintenanceIssue.notes || ""}
                      onChange={(e) => setNewMaintenanceIssue({ ...newMaintenanceIssue, notes: e.target.value })}
                      placeholder={language === "es" ? "Notas adicionales" : "Additional notes"}
                      data-testid="input-maintenance-notes"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addMaintenanceIssue} className="w-full" data-testid="button-add-maintenance">
                      <Plus className="h-4 w-4 mr-2" />
                      {language === "es" ? "Agregar" : "Add"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {maintenanceIssues.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {language === "es" ? "No hay problemas de mantenimiento" : "No maintenance issues"}
                  </p>
                ) : (
                  maintenanceIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md" data-testid={`maintenance-issue-${index}`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{issue.description}</p>
                          <Badge variant="destructive" data-testid={`badge-maintenance-cost-${index}`}>
                            ${Number.isFinite(issue.cost) ? issue.cost.toFixed(2) : "0.00"}
                          </Badge>
                        </div>
                        {issue.notes && <p className="text-xs text-muted-foreground mt-1">{issue.notes}</p>}
                      </div>
                      {!isCompleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMaintenanceIssue(index)}
                          data-testid={`button-remove-maintenance-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning" className="space-y-4">
          <Card data-testid="card-cleaning">
            <CardHeader>
              <CardTitle>{language === "es" ? "Verificación de Limpieza" : "Cleaning Verification"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/50">
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Área" : "Area"} *</Label>
                    <Input
                      value={newCleaningArea.area}
                      onChange={(e) => setNewCleaningArea({ ...newCleaningArea, area: e.target.value })}
                      placeholder={language === "es" ? "Ej: Cocina" : "E.g: Kitchen"}
                      data-testid="input-cleaning-area"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Estado" : "Status"} *</Label>
                    <Input
                      value={newCleaningArea.status}
                      onChange={(e) => setNewCleaningArea({ ...newCleaningArea, status: e.target.value })}
                      placeholder={language === "es" ? "Ej: Limpio" : "E.g: Clean"}
                      data-testid="input-cleaning-status"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "es" ? "Notas" : "Notes"}</Label>
                    <Input
                      value={newCleaningArea.notes || ""}
                      onChange={(e) => setNewCleaningArea({ ...newCleaningArea, notes: e.target.value })}
                      placeholder={language === "es" ? "Notas adicionales" : "Additional notes"}
                      data-testid="input-cleaning-notes"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addCleaningArea} className="w-full" data-testid="button-add-cleaning">
                      <Plus className="h-4 w-4 mr-2" />
                      {language === "es" ? "Agregar" : "Add"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {cleaningAreas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {language === "es" ? "No hay áreas de limpieza verificadas" : "No cleaning areas verified"}
                  </p>
                ) : (
                  cleaningAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md" data-testid={`cleaning-area-${index}`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{area.area}</p>
                          <Badge variant="secondary" data-testid={`badge-cleaning-status-${index}`}>{area.status}</Badge>
                        </div>
                        {area.notes && <p className="text-xs text-muted-foreground mt-1">{area.notes}</p>}
                      </div>
                      {!isCompleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCleaningArea(index)}
                          data-testid={`button-remove-cleaning-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent data-testid="dialog-complete">
          <DialogHeader>
            <DialogTitle>{language === "es" ? "Completar Reporte de Check-Out" : "Complete Check-Out Report"}</DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "¿Estás seguro de que deseas completar este reporte? Una vez completado, no podrás realizar más cambios."
                : "Are you sure you want to complete this report? Once completed, you won't be able to make any more changes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>
                {language === "es" 
                  ? "Se reembolsarán $" + refundAmount.toFixed(2) + " al inquilino"
                  : "$" + refundAmount.toFixed(2) + " will be refunded to the tenant"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              data-testid="button-cancel-complete"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              data-testid="button-confirm-complete"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {language === "es" ? "Completar" : "Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
