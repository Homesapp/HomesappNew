import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  FileText, 
  FilePlus, 
  ScrollText, 
  Search, 
  Filter, 
  XCircle, 
  LayoutGrid, 
  Table as TableIcon 
} from "lucide-react";
import ExternalOfferLinks from "@/components/ExternalOfferLinks";
import ExternalRentalFormLinks from "@/components/ExternalRentalFormLinks";
import ExternalContractProcesses from "@/components/ExternalContractProcesses";

export default function ExternalContracts() {
  const { language } = useLanguage();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState("offers");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);

  // Auto-switch view mode on genuine breakpoint transitions (only if no manual override)
  useEffect(() => {
    if (isMobile !== prevIsMobile) {
      setPrevIsMobile(isMobile);
      if (!manualViewModeOverride) {
        const preferredMode = isMobile ? "cards" : "table";
        setViewMode(preferredMode);
      }
    }
  }, [isMobile, prevIsMobile, manualViewModeOverride]);

  // Clear all filters function
  const clearFilters = () => {
    setStatusFilter(null);
    setSearchTerm("");
    setIsFiltersOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "es" ? "Contratos" : "Contracts"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es"
            ? "Gestiona ofertas de renta, formatos y procesos de contrato"
            : "Manage rental offers, forms and contract processes"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="offers" className="gap-2">
            <FileText className="h-4 w-4" />
            {language === "es" ? "Ofertas de Renta" : "Rental Offers"}
          </TabsTrigger>
          <TabsTrigger value="forms" className="gap-2">
            <FilePlus className="h-4 w-4" />
            {language === "es" ? "Formatos de Renta" : "Rental Forms"}
          </TabsTrigger>
          <TabsTrigger value="processes" className="gap-2">
            <ScrollText className="h-4 w-4" />
            {language === "es" ? "Procesos de Contrato" : "Contract Processes"}
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters - Shared across all tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "es" ? "Buscar..." : "Search..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-contracts"
                />
              </div>

              {/* Filter Button with Popover */}
              <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="relative flex-shrink-0"
                    data-testid="button-toggle-filters"
                  >
                    <Filter className="h-4 w-4" />
                    {statusFilter !== null && (
                      <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        1
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full" onClick={clearFilters}>
                      <XCircle className="mr-2 h-4 w-4" />
                      {language === "es" ? "Limpiar Filtros" : "Clear Filters"}
                    </Button>

                    {/* Status Filters */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {language === "es" ? "Estado" : "Status"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={statusFilter === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter(null)}
                          data-testid="button-filter-all"
                          className="flex-shrink-0"
                        >
                          {language === "es" ? "Todos" : "All"}
                        </Button>
                        <Button
                          variant={statusFilter === "active" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("active")}
                          data-testid="button-filter-active"
                          className="flex-shrink-0"
                        >
                          {language === "es" ? "Activos" : "Active"}
                        </Button>
                        <Button
                          variant={statusFilter === "completed" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("completed")}
                          data-testid="button-filter-completed"
                          className="flex-shrink-0"
                        >
                          {language === "es" ? "Completados" : "Completed"}
                        </Button>
                        <Button
                          variant={statusFilter === "expired" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("expired")}
                          data-testid="button-filter-expired"
                          className="flex-shrink-0"
                        >
                          {language === "es" ? "Expirados" : "Expired"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* View Toggle Buttons - Desktop Only */}
              {!isMobile && (
                <>
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="icon"
                    onClick={() => {
                      setViewMode("cards");
                      setManualViewModeOverride(false);
                    }}
                    className="flex-shrink-0"
                    data-testid="button-view-cards"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="icon"
                    onClick={() => {
                      setViewMode("table");
                      setManualViewModeOverride(true);
                    }}
                    className="flex-shrink-0"
                    data-testid="button-view-table"
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <TabsContent value="offers" className="flex-1 m-0">
          <ExternalOfferLinks searchTerm={searchTerm} statusFilter={statusFilter} viewMode={viewMode} />
        </TabsContent>

        <TabsContent value="forms" className="flex-1 m-0">
          <ExternalRentalFormLinks searchTerm={searchTerm} statusFilter={statusFilter || ""} viewMode={viewMode} />
        </TabsContent>

        <TabsContent value="processes" className="flex-1 m-0">
          <ExternalContractProcesses searchTerm={searchTerm} statusFilter={statusFilter || ""} viewMode={viewMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
