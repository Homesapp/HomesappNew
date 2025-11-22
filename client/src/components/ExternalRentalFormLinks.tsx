import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import ExternalGenerateRentalFormLinkDialog from "./ExternalGenerateRentalFormLinkDialog";

interface ExternalRentalFormLinksProps {
  searchTerm: string;
  statusFilter: string;
  viewMode: string;
}

export default function ExternalRentalFormLinks({ searchTerm, statusFilter, viewMode }: ExternalRentalFormLinksProps) {
  const { language } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: formTokens, isLoading } = useQuery({
    queryKey: ["/api/external/rental-form-tokens"],
  });

  const filteredTokens = formTokens?.filter((token: any) => {
    // Apply search filter
    const matchesSearch = !searchTerm || 
      token.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = token.status !== "completed" && new Date(token.expiresAt) >= new Date();
    } else if (statusFilter === "completed") {
      matchesStatus = token.status === "completed";
    } else if (statusFilter === "expired") {
      matchesStatus = token.status !== "completed" && new Date(token.expiresAt) < new Date();
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
              {filteredTokens?.map((token: any) => (
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
                    {token.status === "completed" ? (
                      <Badge variant="default">{language === "es" ? "Completado" : "Completed"}</Badge>
                    ) : new Date(token.expiresAt) < new Date() ? (
                      <Badge variant="destructive">{language === "es" ? "Expirado" : "Expired"}</Badge>
                    ) : (
                      <Badge variant="outline">{language === "es" ? "Activo" : "Active"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/public-rental-form/${token.token}`, "_blank")}
                      title={language === "es" ? "Abrir link" : "Open link"}
                      data-testid="button-open-form-link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ExternalGenerateRentalFormLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
