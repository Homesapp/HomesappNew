import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ExternalLink, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import ExternalGenerateOfferLinkDialog from "./ExternalGenerateOfferLinkDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ExternalOfferLinks() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: offerTokens, isLoading } = useQuery({
    queryKey: ["/api/external/offer-tokens"],
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const response = await apiRequest("POST", `/api/offer-tokens/${tokenId}/regenerate`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/offer-tokens"] });
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

  const filteredTokens = offerTokens?.filter((token: any) =>
    token.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    if (now > expiry) {
      return language === "es" ? "Expirado" : "Expired";
    }
    
    return formatDistanceToNow(expiry, {
      addSuffix: true,
      locale: language === "es" ? es : enUS,
    });
  };

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
                    <TableHead>{language === "es" ? "Tiempo Restante" : "Time Remaining"}</TableHead>
                    <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTokens?.map((token: any) => {
                    const isExpired = new Date(token.expiresAt) < new Date();
                    const canRegenerate = !token.isUsed; // Se puede regenerar si no está completado
                    
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
                          {token.expiresAt ? getTimeRemaining(token.expiresAt) : "-"}
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
                            {canRegenerate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => regenerateTokenMutation.mutate(token.id)}
                                disabled={regenerateTokenMutation.isPending}
                                title={language === "es" ? "Regenerar link" : "Regenerate link"}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/offer/${token.token}`, "_blank")}
                              title={language === "es" ? "Abrir link" : "Open link"}
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
        </CardContent>
      </Card>

      <ExternalGenerateOfferLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
