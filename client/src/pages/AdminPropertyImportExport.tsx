import { useState, Component, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, FileJson, AlertCircle, CheckCircle2, XCircle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error al cargar la página
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  <p className="font-semibold mb-2">
                    Ocurrió un error al cargar la página de Importar/Exportar propiedades.
                  </p>
                  <p className="text-sm">
                    {this.state.error?.message || "Error desconocido"}
                  </p>
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  data-testid="button-reload"
                >
                  Recargar página
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  data-testid="button-go-back"
                >
                  Volver atrás
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

function AdminPropertyImportExportContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Export state
  const [exportFilters, setExportFilters] = useState({
    approvalStatus: "all",
    active: "all",
    published: "all",
  });

  // Import state
  const [importData, setImportData] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (exportFilters.approvalStatus !== "all") params.append("approvalStatus", exportFilters.approvalStatus);
      if (exportFilters.active !== "all") params.append("active", exportFilters.active);
      if (exportFilters.published !== "all") params.append("published", exportFilters.published);

      const url = `/api/admin/properties/export${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Error al exportar propiedades");
      return response.json();
    },
    onSuccess: (data) => {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `properties-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${data.length} propiedades`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al exportar",
        description: error.message || "No se pudo exportar las propiedades",
        variant: "destructive",
      });
    },
  });

  // Validate import mutation
  const validateMutation = useMutation({
    mutationFn: async (properties: any[]) => {
      return apiRequest("POST", "/api/admin/properties/validate-import", { properties });
    },
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.valid) {
        toast({
          title: "Validación exitosa",
          description: "Los datos están listos para importar",
        });
      } else {
        const errorCount = data.errors?.length || 0;
        toast({
          title: "Errores de validación",
          description: errorCount > 0 ? `Se encontraron ${errorCount} errores` : "Se encontraron errores en la validación",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al validar",
        description: error.message || "No se pudo validar la importación",
        variant: "destructive",
      });
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!validationResult || !validationResult.valid) {
        throw new Error("Debe validar los datos antes de importar");
      }

      const properties = JSON.parse(importData);
      return apiRequest("POST", "/api/admin/properties/import", {
        properties,
        mappings: validationResult.mappings,
        options: importOptions,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Importación completada",
        description: `Creadas: ${data.created}, Actualizadas: ${data.updated}, Omitidas: ${data.skipped}`,
      });
      setImportData("");
      setValidationResult(null);
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al importar",
        description: error.message || "No se pudo importar las propiedades",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo JSON",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      setValidationResult(null);
      toast({
        title: "Archivo cargado",
        description: `${file.name} cargado exitosamente`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Error al leer archivo",
        description: "No se pudo leer el contenido del archivo",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleValidate = () => {
    try {
      const properties = JSON.parse(importData);
      if (!Array.isArray(properties)) {
        throw new Error("El JSON debe ser un array de propiedades");
      }
      validateMutation.mutate(properties);
    } catch (error: any) {
      toast({
        title: "JSON inválido",
        description: error.message || "El formato JSON no es válido",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-import-export">
          Importar / Exportar Propiedades
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la migración de propiedades entre ambientes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Section */}
        <Card data-testid="card-export">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportar Propiedades
            </CardTitle>
            <CardDescription>
              Descarga las propiedades de desarrollo en formato JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Estado de Aprobación</Label>
                <Select
                  value={exportFilters.approvalStatus}
                  onValueChange={(value) =>
                    setExportFilters({ ...exportFilters, approvalStatus: value })
                  }
                >
                  <SelectTrigger data-testid="select-approval-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="approved">Aprobadas</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="rejected">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado Activo</Label>
                <Select
                  value={exportFilters.active}
                  onValueChange={(value) =>
                    setExportFilters({ ...exportFilters, active: value })
                  }
                >
                  <SelectTrigger data-testid="select-active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="true">Activas</SelectItem>
                    <SelectItem value="false">Inactivas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado Publicado</Label>
                <Select
                  value={exportFilters.published}
                  onValueChange={(value) =>
                    setExportFilters({ ...exportFilters, published: value })
                  }
                >
                  <SelectTrigger data-testid="select-published">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="true">Publicadas</SelectItem>
                    <SelectItem value="false">No publicadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="w-full"
              data-testid="button-export"
            >
              <FileJson className="w-4 h-4 mr-2" />
              {exportMutation.isPending ? "Exportando..." : "Exportar a JSON"}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card data-testid="card-import">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importar Propiedades
            </CardTitle>
            <CardDescription>
              Carga propiedades desde un archivo JSON exportado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cargar archivo JSON</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    data-testid="input-file-upload"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O pega el contenido JSON manualmente en el área de texto
              </p>
            </div>

            <div className="space-y-2">
              <Label>Datos JSON</Label>
              <Textarea
                placeholder='[{"title": "Casa en Tulum", "price": 5000000, ...}]'
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  setValidationResult(null);
                }}
                rows={6}
                className="font-mono text-sm"
                data-testid="textarea-import-data"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipDuplicates"
                  checked={importOptions.skipDuplicates}
                  onCheckedChange={(checked) =>
                    setImportOptions({ ...importOptions, skipDuplicates: !!checked })
                  }
                  data-testid="checkbox-skip-duplicates"
                />
                <Label htmlFor="skipDuplicates" className="text-sm font-normal">
                  Omitir duplicados
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateExisting"
                  checked={importOptions.updateExisting}
                  onCheckedChange={(checked) =>
                    setImportOptions({ ...importOptions, updateExisting: !!checked })
                  }
                  data-testid="checkbox-update-existing"
                />
                <Label htmlFor="updateExisting" className="text-sm font-normal">
                  Actualizar existentes
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleValidate}
                disabled={!importData || validateMutation.isPending}
                variant="outline"
                className="flex-1"
                data-testid="button-validate"
              >
                {validateMutation.isPending ? "Validando..." : "Validar"}
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={!validationResult?.valid || importMutation.isPending}
                className="flex-1"
                data-testid="button-import"
              >
                {importMutation.isPending ? "Importando..." : "Importar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Card data-testid="card-validation-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Resultados de Validación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Errors */}
            {!validationResult.valid && (
              validationResult.errors && Array.isArray(validationResult.errors) && validationResult.errors.length > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      Errores ({validationResult.errors.length}):
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationResult.errors.slice(0, 10).map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <li className="text-muted-foreground">
                          ... y {validationResult.errors.length - 10} más
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      Validación fallida
                    </div>
                    <p className="text-sm">
                      Los datos no pasaron la validación. Por favor revisa el formato JSON y asegúrate de que todas las propiedades requeridas estén presentes.
                    </p>
                  </AlertDescription>
                </Alert>
              )
            )}

            {/* Warnings */}
            {validationResult.warnings && Array.isArray(validationResult.warnings) && validationResult.warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">
                    Advertencias ({validationResult.warnings.length}):
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationResult.warnings.slice(0, 10).map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                    {validationResult.warnings.length > 10 && (
                      <li className="text-muted-foreground">
                        ... y {validationResult.warnings.length - 10} más
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Mappings Summary */}
            {validationResult.mappings && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {validationResult.mappings.owners ? Object.keys(validationResult.mappings.owners).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {validationResult.mappings.owners ? Object.values(validationResult.mappings.owners).filter(Boolean).length : 0} encontrados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Colonias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {validationResult.mappings.colonies ? Object.keys(validationResult.mappings.colonies).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {validationResult.mappings.colonies ? Object.values(validationResult.mappings.colonies).filter(Boolean).length : 0} encontradas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Condominios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {validationResult.mappings.condominiums ? Object.keys(validationResult.mappings.condominiums).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {validationResult.mappings.condominiums ? Object.values(validationResult.mappings.condominiums).filter(Boolean).length : 0} encontrados
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">Exportar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Selecciona los filtros deseados (todas las propiedades por defecto)</li>
              <li>Haz clic en "Exportar a JSON"</li>
              <li>Se descargará un archivo JSON con las propiedades</li>
            </ol>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-1">Importar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Pega el contenido JSON exportado en el área de texto</li>
              <li>Haz clic en "Validar" para verificar los datos</li>
              <li>Revisa los resultados de validación</li>
              <li>Si es válido, haz clic en "Importar" para completar</li>
            </ol>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Los propietarios (ownerEmail) deben existir en la base de datos de producción.
              Las colonias y condominios se crearán automáticamente si no existen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// Export wrapped component with ErrorBoundary
export default function AdminPropertyImportExport() {
  return (
    <ErrorBoundary>
      <AdminPropertyImportExportContent />
    </ErrorBoundary>
  );
}
