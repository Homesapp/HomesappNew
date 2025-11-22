import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ExternalLink, RefreshCw, FileDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import ExternalGenerateRentalFormLinkDialog from "./ExternalGenerateRentalFormLinkDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExternalRentalFormLinksProps {
  searchTerm: string;
  statusFilter: string;
  viewMode: string;
}

export default function ExternalRentalFormLinks({ searchTerm, statusFilter, viewMode }: ExternalRentalFormLinksProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: formTokens, isLoading } = useQuery({
    queryKey: ["/api/external/rental-form-tokens"],
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const response = await apiRequest("POST", `/api/rental-form-tokens/${tokenId}/regenerate`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/rental-form-tokens"] });
      toast({
        title: language === "es" ? "Link regenerado" : "Link regenerated",
        description: language === "es" ? "Se ha generado un nuevo link" : "A new link has been generated",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo regenerar el link" : "Could not regenerate link"),
        variant: "destructive",
      });
    },
  });

  const filteredTokens = formTokens?.filter((token: any) => {
    // Apply search filter
    const matchesSearch = !searchTerm || 
      token.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = !token.isUsed && new Date(token.expiresAt) >= new Date();
    } else if (statusFilter === "completed") {
      matchesStatus = token.isUsed;
    } else if (statusFilter === "expired") {
      matchesStatus = !token.isUsed && new Date(token.expiresAt) < new Date();
    }
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            {language === "es" ? "Formatos de Renta Enviados" : "Sent Rental Forms"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {language === "es"
              ? "Links privados con duración para formatos de renta"
              : "Private links with duration for rental forms"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-form-link">
          <Plus className="h-4 w-4 mr-2" />
          {language === "es" ? "Nuevo Formato" : "New Form"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {language === "es" ? "Cargando..." : "Loading..."}
        </div>
      ) : filteredTokens?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {language === "es" ? "No hay formatos enviados" : "No forms sent"}
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredTokens?.map((token: any) => {
            const isExpired = new Date(token.expiresAt) < new Date();
            const canRegenerate = !token.isUsed;
            
            return (
              <Card key={token.id} className="hover-elevate" data-testid={`card-form-${token.id}`}>
                <CardHeader>
                  <CardTitle className="text-base">{token.clientName || "-"}</CardTitle>
                  <CardDescription>{token.propertyTitle || "-"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === "es" ? "Enviado" : "Sent"}
                    </span>
                    <span>
                      {token.createdAt
                        ? format(new Date(token.createdAt), "dd/MM/yyyy", {
                            locale: language === "es" ? es : enUS,
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === "es" ? "Expira" : "Expires"}
                    </span>
                    <span>
                      {token.expiresAt
                        ? format(new Date(token.expiresAt), "dd/MM/yyyy", {
                            locale: language === "es" ? es : enUS,
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {language === "es" ? "Estado" : "Status"}
                    </span>
                    {token.isUsed ? (
                      <Badge variant="default">{language === "es" ? "Completado" : "Completed"}</Badge>
                    ) : isExpired ? (
                      <Badge variant="destructive">{language === "es" ? "Expirado" : "Expired"}</Badge>
                    ) : (
                      <Badge variant="outline">{language === "es" ? "Activo" : "Active"}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    {token.isUsed && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(`/api/external/rental-contracts/${token.contractId}/pdf`, "_blank")}
                        className="flex-1"
                        data-testid="button-download-form-pdf"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        {language === "es" ? "PDF" : "PDF"}
                      </Button>
                    )}
                    {canRegenerate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateTokenMutation.mutate(token.id)}
                        disabled={regenerateTokenMutation.isPending}
                        className="flex-1"
                        data-testid="button-regenerate-form"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {language === "es" ? "Regenerar" : "Regenerate"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/public-rental-form/${token.token}`, "_blank")}
                      className="flex-1"
                      data-testid="button-open-form-link"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {language === "es" ? "Abrir Link" : "Open Link"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "es" ? "Cliente" : "Client"}</TableHead>
                <TableHead>{language === "es" ? "Propiedad" : "Property"}</TableHead>
                <TableHead>{language === "es" ? "Enviado" : "Sent"}</TableHead>
                <TableHead>{language === "es" ? "Expira" : "Expires"}</TableHead>
                <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTokens?.map((token: any) => {
                const isExpired = new Date(token.expiresAt) < new Date();
                const canRegenerate = !token.isUsed;
                
                return (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium">{token.clientName || "-"}</TableCell>
                    <TableCell>{token.propertyTitle || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {token.createdAt
                        ? format(new Date(token.createdAt), "dd/MM/yyyy", {
                            locale: language === "es" ? es : enUS,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {token.expiresAt
                        ? format(new Date(token.expiresAt), "dd/MM/yyyy", {
                            locale: language === "es" ? es : enUS,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {token.isUsed ? (
                        <Badge variant="default">{language === "es" ? "Completado" : "Completed"}</Badge>
                      ) : isExpired ? (
                        <Badge variant="destructive">{language === "es" ? "Expirado" : "Expired"}</Badge>
                      ) : (
                        <Badge variant="outline">{language === "es" ? "Activo" : "Active"}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {token.isUsed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/api/external/rental-contracts/${token.contractId}/pdf`, "_blank")}
                            title={language === "es" ? "Descargar PDF" : "Download PDF"}
                            data-testid="button-download-form-pdf"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        )}
                        {canRegenerate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => regenerateTokenMutation.mutate(token.id)}
                            disabled={regenerateTokenMutation.isPending}
                            title={language === "es" ? "Regenerar link" : "Regenerate link"}
                            data-testid="button-regenerate-form"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/public-rental-form/${token.token}`, "_blank")}
                          title={language === "es" ? "Abrir link" : "Open link"}
                          data-testid="button-open-form-link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ExternalGenerateRentalFormLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
