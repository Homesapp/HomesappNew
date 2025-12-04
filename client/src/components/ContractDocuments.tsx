import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  FileText,
  Image,
  File,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Users,
  User,
  ExternalLink,
  X,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ContractDocument } from "@shared/schema";

interface ContractDocumentsProps {
  contractId: string;
  readOnly?: boolean;
}

interface DocumentUpload {
  fileUrl: string;
  fileName: string;
  documentType: string;
  title: string;
  description: string;
  visibleToTenant: boolean;
  visibleToOwner: boolean;
}

const DOCUMENT_TYPES = [
  { value: "ine_tenant", label: "INE del inquilino", category: "required", icon: User },
  { value: "ine_owner", label: "INE del propietario", category: "required", icon: User },
  { value: "contract_signed", label: "Contrato firmado", category: "required", icon: FileText },
  { value: "deposit_receipt", label: "Comprobante de depósito", category: "required", icon: FileText },
  { value: "inventory", label: "Inventario", category: "required", icon: FileText },
  { value: "photos_checkin", label: "Fotos de check-in", category: "optional", icon: Image },
  { value: "photos_checkout", label: "Fotos de check-out", category: "optional", icon: Image },
  { value: "addendum", label: "Adendum", category: "optional", icon: FileText },
  { value: "payment_receipt", label: "Comprobante de pago", category: "optional", icon: FileText },
  { value: "service_bill", label: "Recibo de servicio", category: "optional", icon: FileText },
  { value: "income_proof", label: "Comprobante de ingresos", category: "optional", icon: FileText },
  { value: "reference_letter", label: "Carta de referencia", category: "optional", icon: FileText },
  { value: "other", label: "Otro documento", category: "optional", icon: File },
];

const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES.filter(d => d.category === "required").map(d => d.value);

export default function ContractDocuments({ contractId, readOnly = false }: ContractDocumentsProps) {
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<ContractDocument | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [uploadData, setUploadData] = useState<DocumentUpload>({
    fileUrl: "",
    fileName: "",
    documentType: "",
    title: "",
    description: "",
    visibleToTenant: false,
    visibleToOwner: true,
  });

  const { data: documents = [], isLoading, isError, refetch } = useQuery<ContractDocument[]>({
    queryKey: ["/api/contract-documents", contractId],
    enabled: !!contractId,
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: {
      documentType: string;
      title: string;
      description?: string;
      fileUrl: string;
      fileName?: string;
      visibleToTenant: boolean;
      visibleToOwner: boolean;
    }) => {
      return apiRequest(`/api/contract-documents/${contractId}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-documents", contractId] });
      setIsUploadOpen(false);
      resetUploadForm();
      toast({
        title: "Documento subido",
        description: "El documento se ha subido correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al subir",
        description: "No se pudo subir el documento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/api/contract-documents/${contractId}/${documentId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-documents", contractId] });
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/api/contract-documents/${contractId}/${documentId}`, {
        method: "PATCH",
        body: JSON.stringify({ isVerified: true }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-documents", contractId] });
      toast({
        title: "Documento verificado",
        description: "El documento ha sido marcado como verificado",
      });
    },
    onError: () => {
      toast({
        title: "Error al verificar",
        description: "No se pudo verificar el documento",
        variant: "destructive",
      });
    },
  });

  const resetUploadForm = () => {
    setUploadData({
      fileUrl: "",
      fileName: "",
      documentType: "",
      title: "",
      description: "",
      visibleToTenant: false,
      visibleToOwner: true,
    });
  };

  const handleOpenUploadDialog = () => {
    resetUploadForm();
    setIsUploadOpen(true);
  };

  const handleUpload = () => {
    if (!uploadData.fileUrl || !uploadData.documentType) {
      toast({
        title: "Datos incompletos",
        description: "Ingresa la URL del documento y selecciona un tipo",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      documentType: uploadData.documentType,
      title: uploadData.title || uploadData.fileName || "Documento",
      description: uploadData.description,
      fileUrl: uploadData.fileUrl,
      fileName: uploadData.fileName,
      visibleToTenant: uploadData.visibleToTenant,
      visibleToOwner: uploadData.visibleToOwner,
    });
  };

  const getDocumentIcon = (mimeType?: string | null, documentType?: string) => {
    if (mimeType?.startsWith("image/")) return Image;
    if (mimeType?.includes("pdf")) return FileText;
    const docConfig = DOCUMENT_TYPES.find(d => d.value === documentType);
    return docConfig?.icon || File;
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(d => d.value === type)?.label || type;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getRequiredDocumentStatus = () => {
    const uploadedTypes = new Set(documents.map(d => d.documentType));
    return REQUIRED_DOCUMENT_TYPES.map(type => ({
      type,
      label: getDocumentTypeLabel(type),
      uploaded: uploadedTypes.has(type),
      verified: documents.find(d => d.documentType === type)?.isVerified || false,
    }));
  };

  const filteredDocuments = filterType === "all" 
    ? documents 
    : documents.filter(d => d.documentType === filterType);

  const requiredStatus = getRequiredDocumentStatus();
  const completedRequired = requiredStatus.filter(s => s.uploaded).length;
  const totalRequired = requiredStatus.length;

  return (
    <div className="space-y-4">
      {/* Required Documents Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Documentos Requeridos
            </CardTitle>
            <Badge variant={completedRequired === totalRequired ? "default" : "secondary"}>
              {completedRequired}/{totalRequired} completados
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {requiredStatus.map((status) => (
              <div
                key={status.type}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  status.verified 
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                    : status.uploaded 
                      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                      : "bg-muted/50 border-muted"
                }`}
              >
                {status.verified ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : status.uploaded ? (
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs truncate">{status.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area & Document List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos del Contrato
              </CardTitle>
              <CardDescription>
                {documents.length} documento{documents.length !== 1 ? "s" : ""} subido{documents.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!readOnly && (
                <Button 
                  onClick={() => setIsUploadOpen(true)}
                  data-testid="button-upload-document"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Document Zone */}
          {!readOnly && documents.length === 0 && (
            <div className="border-2 border-dashed rounded-lg p-6 text-center border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-2">
                Agrega documentos usando enlaces de Google Drive, Dropbox u otros servicios
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Comparte el enlace del documento para agregarlo al contrato
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenUploadDialog}
                data-testid="button-add-document"
              >
                Agregar Documento
              </Button>
            </div>
          )}

          {/* Document List */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {filterType !== "all" 
                  ? "No hay documentos de este tipo" 
                  : "No hay documentos subidos aún"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => {
                const Icon = getDocumentIcon(doc.mimeType, doc.documentType);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors group"
                    data-testid={`document-${doc.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${
                        doc.isVerified 
                          ? "bg-green-100 dark:bg-green-950" 
                          : "bg-muted"
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          doc.isVerified 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{doc.title}</p>
                          {doc.isVerified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{getDocumentTypeLabel(doc.documentType)}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{format(new Date(doc.createdAt), "dd/MM/yyyy")}</span>
                          {(doc.visibleToTenant || doc.visibleToOwner) && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {doc.visibleToTenant && doc.visibleToOwner 
                                  ? "Visible ambos" 
                                  : doc.visibleToTenant 
                                    ? "Visible inquilino" 
                                    : "Visible propietario"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setIsPreviewOpen(true);
                        }}
                        data-testid={`button-preview-${doc.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(doc.fileUrl, "_blank")}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir en nueva pestaña
                            </DropdownMenuItem>
                            {!doc.isVerified && (
                              <DropdownMenuItem onClick={() => verifyMutation.mutate(doc.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar como verificado
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDocumentToDelete(doc);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => {
        setIsUploadOpen(open);
        if (!open) resetUploadForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
            <DialogDescription>
              Completa la información del documento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileUrl">URL del documento *</Label>
              <Input
                id="fileUrl"
                type="url"
                value={uploadData.fileUrl}
                onChange={(e) => setUploadData(prev => ({ ...prev, fileUrl: e.target.value }))}
                placeholder="https://ejemplo.com/documento.pdf"
                data-testid="input-document-url"
              />
              <p className="text-xs text-muted-foreground">
                Ingresa la URL del documento (Google Drive, Dropbox, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de documento *</Label>
              <Select
                value={uploadData.documentType}
                onValueChange={(value) => setUploadData(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger data-testid="select-document-type">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nombre del documento"
                data-testid="input-document-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Notas o descripción adicional"
                data-testid="input-document-description"
              />
            </div>

            <div className="space-y-3">
              <Label>Visibilidad en portal</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Visible para inquilino</span>
                  </div>
                  <Switch
                    checked={uploadData.visibleToTenant}
                    onCheckedChange={(checked) => setUploadData(prev => ({ ...prev, visibleToTenant: checked }))}
                    data-testid="switch-visible-tenant"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Visible para propietario</span>
                  </div>
                  <Switch
                    checked={uploadData.visibleToOwner}
                    onCheckedChange={(checked) => setUploadData(prev => ({ ...prev, visibleToOwner: checked }))}
                    data-testid="switch-visible-owner"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!uploadData.file || !uploadData.documentType || uploadMutation.isPending}
              data-testid="button-confirm-upload"
            >
              {uploadMutation.isPending ? "Subiendo..." : "Subir Documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            <DialogDescription>
              {selectedDocument && getDocumentTypeLabel(selectedDocument.documentType)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedDocument?.mimeType?.startsWith("image/") ? (
              <img
                src={selectedDocument.fileUrl}
                alt={selectedDocument.title}
                className="max-w-full h-auto rounded-lg"
              />
            ) : selectedDocument?.mimeType?.includes("pdf") ? (
              <iframe
                src={selectedDocument.fileUrl}
                className="w-full h-[60vh] rounded-lg"
                title={selectedDocument.title}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <File className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Vista previa no disponible para este tipo de archivo
                </p>
                <Button onClick={() => window.open(selectedDocument?.fileUrl, "_blank")}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar archivo
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{documentToDelete?.title}"? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => documentToDelete && deleteMutation.mutate(documentToDelete.id)}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
