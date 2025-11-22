import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import ExternalGenerateOfferLinkDialog from "./ExternalGenerateOfferLinkDialog";

export default function ExternalOfferLinks() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: offerTokens, isLoading } = useQuery({
    queryKey: ["/api/external/offer-tokens"],
  });

  const filteredTokens = offerTokens?.filter((token: any) =>
    token.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {language === "es" ? "Ofertas de Renta Enviadas" : "Sent Rental Offers"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Links privados con duración para ofertas de renta"
                  : "Private links with duration for rental offers"}
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-create-offer-link">
              <Plus className="h-4 w-4 mr-2" />
              {language === "es" ? "Nueva Oferta" : "New Offer"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar por cliente o propiedad..." : "Search by client or property..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-offers"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "es" ? "Cargando..." : "Loading..."}
            </div>
          ) : filteredTokens?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "es" ? "No hay ofertas enviadas" : "No offers sent"}
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
                          onClick={() => window.open(`/public-offer/${token.token}`, "_blank")}
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
        </CardContent>
      </Card>

      <ExternalGenerateOfferLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
