import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ExternalLink, RefreshCw, FileDown, Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import ExternalGenerateOfferLinkDialog from "./ExternalGenerateOfferLinkDialog";
import ExternalEditOfferDialog from "./ExternalEditOfferDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";

interface ExternalOfferLinksProps {
  searchTerm: string;
  statusFilter: string | null;
  viewMode: "cards" | "table";
}

export default function ExternalOfferLinks({ searchTerm, statusFilter, viewMode }: ExternalOfferLinksProps) {
  const { language } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Helper function to download PDF with authentication
  const downloadOfferPDF = async (offerId: string) => {
    try {
      const response = await fetch(`/api/external/offers/${offerId}/pdf`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oferta-${offerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo descargar el PDF" : "Could not download PDF",
        variant: "destructive",
      });
    }
  };

  // Helper function to view PDF with authentication
  const viewOfferPDF = async (offerId: string) => {
    try {
      const response = await fetch(`/api/external/offers/${offerId}/pdf`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to load PDF');
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create blob URL and open in new tab
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup after a delay to ensure the PDF loads
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo visualizar el PDF" : "Could not view PDF",
        variant: "destructive",
      });
    }
  };

  const { data: offerTokens, isLoading } = useQuery({
    queryKey: ["/api/external/offer-tokens"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/external/offer-tokens");
      return res.json();
    },
    staleTime: 0, // Consider data stale immediately
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
    refetchInterval: 10000, // Auto-refresh every 10 seconds while tab is active
    refetchIntervalInBackground: false, // Pause polling when tab is hidden (80% traffic reduction)
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

  const filteredTokens = useMemo(() => {
    if (!offerTokens) return [];
    
    return offerTokens.filter((token: any) => {
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
  }, [offerTokens, searchTerm, statusFilter]);

  // Sorted tokens
  const sortedTokens = useMemo(() => {
    if (!filteredTokens || !sortColumn) return filteredTokens;
    
    return [...filteredTokens].sort((a: any, b: any) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      // Handle date columns
      if (sortColumn === 'createdAt' || sortColumn === 'expiresAt') {
        const aDate = aVal ? new Date(aVal).getTime() : 0;
        const bDate = bVal ? new Date(bVal).getTime() : 0;
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }
      
      // Handle string columns
      if (typeof aVal === "string" || typeof bVal === "string") {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTokens, sortColumn, sortDirection]);

  // Paginated tokens
  const paginatedTokens = useMemo(() => {
    if (!sortedTokens) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedTokens.slice(startIndex, endIndex);
  }, [sortedTokens, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((sortedTokens?.length || 0) / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Clamp currentPage to valid range when totalPages changes
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            {language === "es" ? "Ofertas de Renta Enviadas" : "Sent Rental Offers"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {language === "es"
              ? "Links privados con duración para ofertas de renta"
              : "Private links with duration for rental offers"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-offer-link">
          <Plus className="h-4 w-4 mr-2" />
          {language === "es" ? "Nueva Oferta" : "New Offer"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {language === "es" ? "Cargando..." : "Loading..."}
        </div>
      ) : filteredTokens?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {language === "es" ? "No hay ofertas enviadas" : "No offers sent"}
        </div>
      ) : viewMode === "cards" ? (
        <>
        <ExternalPaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          language={language}
        />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {paginatedTokens?.map((token: any) => {
            const isExpired = new Date(token.expiresAt) < new Date();
            const canRegenerate = !token.isUsed;
            
            return (
              <Card key={token.id} className="hover-elevate" data-testid={`card-offer-${token.id}`}>
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
                      {language === "es" ? "Tiempo restante" : "Time remaining"}
                    </span>
                    <span className="text-muted-foreground">
                      {token.expiresAt ? getTimeRemaining(token.expiresAt) : "-"}
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
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOffer(token);
                            setEditDialogOpen(true);
                          }}
                          className="flex-1"
                          data-testid="button-edit-offer"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          {language === "es" ? "Editar" : "Edit"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewOfferPDF(token.id)}
                          className="flex-1"
                          data-testid="button-view-offer-pdf"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {language === "es" ? "Ver" : "View"}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => downloadOfferPDF(token.id)}
                          className="flex-1"
                          data-testid="button-download-offer-pdf"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          {language === "es" ? "Descargar" : "Download"}
                        </Button>
                      </>
                    )}
                    {canRegenerate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateTokenMutation.mutate(token.id)}
                        disabled={regenerateTokenMutation.isPending}
                        className="flex-1"
                        data-testid="button-regenerate-offer"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {language === "es" ? "Regenerar" : "Regenerate"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`${window.location.origin}/offer/${token.token}`, "_blank")}
                      className="flex-1"
                      data-testid="button-open-offer-link"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {language === "es" ? "Abrir" : "Open"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </>
      ) : (
        <>
        <ExternalPaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          language={language}
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover-elevate"
                  onClick={() => handleSort("clientName")}
                >
                  <div className="flex items-center gap-2">
                    {language === "es" ? "Cliente" : "Client"}
                    {getSortIcon("clientName")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover-elevate"
                  onClick={() => handleSort("propertyTitle")}
                >
                  <div className="flex items-center gap-2">
                    {language === "es" ? "Propiedad" : "Property"}
                    {getSortIcon("propertyTitle")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover-elevate"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-2">
                    {language === "es" ? "Enviado" : "Sent"}
                    {getSortIcon("createdAt")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover-elevate"
                  onClick={() => handleSort("expiresAt")}
                >
                  <div className="flex items-center gap-2">
                    {language === "es" ? "Tiempo Restante" : "Time Remaining"}
                    {getSortIcon("expiresAt")}
                  </div>
                </TableHead>
                <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTokens?.map((token: any) => {
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
                        {token.isUsed && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingOffer(token);
                                setEditDialogOpen(true);
                              }}
                              title={language === "es" ? "Editar oferta" : "Edit offer"}
                              data-testid="button-edit-offer"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewOfferPDF(token.id)}
                              title={language === "es" ? "Ver PDF" : "View PDF"}
                              data-testid="button-view-offer-pdf"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadOfferPDF(token.id)}
                              title={language === "es" ? "Descargar PDF" : "Download PDF"}
                              data-testid="button-download-offer-pdf"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {canRegenerate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => regenerateTokenMutation.mutate(token.id)}
                            disabled={regenerateTokenMutation.isPending}
                            title={language === "es" ? "Regenerar link" : "Regenerate link"}
                            data-testid="button-regenerate-offer"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`${window.location.origin}/offer/${token.token}`, "_blank")}
                          title={language === "es" ? "Abrir link" : "Open link"}
                          data-testid="button-open-offer-link"
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
        </>
      )}

      <ExternalGenerateOfferLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ExternalEditOfferDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        offerToken={editingOffer}
      />
    </>
  );
}
