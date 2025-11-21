import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  File,
  FileImage,
  FileCode
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalClientDocument } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientDocumentsTabProps {
  clientId: string;
  documents: ExternalClientDocument[];
  isLoading: boolean;
  isError: boolean;
}

const documentTypes = [
  { value: "id", label: "Identificación Oficial" },
  { value: "passport", label: "Pasaporte" },
  { value: "visa", label: "Visa" },
  { value: "proof_of_address", label: "Comprobante de Domicilio" },
  { value: "proof_of_income", label: "Comprobante de Ingresos" },
  { value: "contract", label: "Contrato" },
  { value: "other", label: "Otro" },
];

export default function ClientDocumentsTab({ clientId, documents, isLoading, isError }: ClientDocumentsTabProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("id");
  const [notes, setNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      // Step 1: Get upload URL
      const { uploadURL } = await apiRequest("POST", `/api/external-clients/${clientId}/documents/upload-url`, {});

      // Step 2: Upload file directly to Object Storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Step 3: Create document record
      return apiRequest("POST", `/api/external-clients/${clientId}/documents`, {
        uploadURL,
        documentType,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients", clientId, "documents"] });
      toast({
        title: "Documento subido",
        description: "El documento se ha subido exitosamente.",
      });
      setSelectedFile(null);
      setDocumentType("id");
      setNotes("");
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el documento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest("DELETE", `/api/external-client-documents/${documentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients", clientId, "documents"] });
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado exitosamente.",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el documento",
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (mimeType.startsWith("application/pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subir Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Archivo</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*,.pdf"
              data-testid="input-file-upload"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos permitidos: PDF, imágenes (JPG, PNG). Máximo 10MB.
            </p>
          </div>

          <div>
            <Label htmlFor="document-type">Tipo de Documento</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" data-testid="select-document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre el documento..."
              data-testid="input-document-notes"
            />
          </div>

          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
            data-testid="button-upload-document"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">Error al cargar documentos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Por favor, intenta recargar la página
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No hay documentos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sube documentos usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium truncate">{doc.fileName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {documentTypes.find((t) => t.value === doc.documentType)?.label || doc.documentType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.fileSize)}
                              </span>
                            </div>
                            {doc.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{doc.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Subido el {format(new Date(doc.uploadedAt), "PPP", { locale: es })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(doc.id)}
                              data-testid={`button-delete-document-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
