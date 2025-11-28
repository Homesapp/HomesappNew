import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Home, 
  Bed, 
  Bath, 
  DollarSign, 
  MapPin, 
  Share2, 
  MessageCircle,
  Users,
  Check,
  Copy,
  ExternalLink,
  Building2,
  SlidersHorizontal,
  X
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface Unit {
  id: string;
  name: string;
  zone: string | null;
  unitType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  monthlyRent: number | null;
  currency: string | null;
  status: string | null;
  images: string[] | null;
  amenities: string[] | null;
  condominiumId: string | null;
}

interface MatchingLead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  matchScore: number;
  matchReasons: string[];
}

export default function SellerPropertyCatalog() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    zone: "",
    propertyType: "",
    status: "active",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [matchingLeadsOpen, setMatchingLeadsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedLead, setSelectedLead] = useState<MatchingLead | null>(null);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
    if (filters.zone) params.append("zone", filters.zone);
    if (filters.propertyType) params.append("propertyType", filters.propertyType);
    if (filters.status) params.append("status", filters.status);
    return params.toString();
  };

  const { data: catalogData, isLoading } = useQuery<{ data: Unit[]; total: number }>({
    queryKey: ["/api/external-seller/property-catalog", search, filters],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/external-seller/property-catalog?${qs}`);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
  });

  const { data: matchingLeads, isLoading: matchingLoading } = useQuery<MatchingLead[]>({
    queryKey: ["/api/external-seller/matching-leads", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit) return [];
      const res = await fetch(`/api/external-seller/matching-leads/${selectedUnit.id}`);
      if (!res.ok) throw new Error("Failed to fetch matching leads");
      return res.json();
    },
    enabled: !!selectedUnit && matchingLeadsOpen,
  });

  const { data: zones } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external/config/zones"],
  });

  const { data: propertyTypes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external/config/property-types"],
  });

  const sharePropertyMutation = useMutation({
    mutationFn: async (data: { leadId: string; unitId: string; message?: string }) => {
      const res = await apiRequest("POST", "/api/external-seller/share-property", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
      toast({
        title: t("sellerCatalog.shareSent", "Propiedad compartida"),
        description: t("sellerCatalog.shareSuccess", "Se abrió WhatsApp para enviar el mensaje"),
      });
      setShareDialogOpen(false);
      setSelectedLead(null);
      setCustomMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/metrics"] });
    },
    onError: () => {
      toast({
        title: t("common.error", "Error"),
        description: t("sellerCatalog.shareError", "No se pudo compartir la propiedad"),
        variant: "destructive",
      });
    },
  });

  const units = catalogData?.data || [];

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== "active");

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      zone: "",
      propertyType: "",
      status: "active",
    });
    setSearch("");
  };

  const generateDefaultMessage = (unit: Unit) => {
    return (
      `¡Hola! Te comparto esta propiedad que puede interesarte:\n\n` +
      `📍 ${unit.name}\n` +
      `🏠 ${unit.unitType || "Propiedad"} - ${unit.bedrooms || 0} recámaras\n` +
      `💰 $${unit.monthlyRent?.toLocaleString() || "Consultar"} ${unit.currency || "MXN"}/mes\n` +
      `📍 ${unit.zone || ""}\n\n` +
      `¿Te gustaría agendar una visita?`
    );
  };

  const handleShareClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setCustomMessage(generateDefaultMessage(unit));
    setShareDialogOpen(true);
  };

  const handleFindMatches = (unit: Unit) => {
    setSelectedUnit(unit);
    setMatchingLeadsOpen(true);
  };

  const handleShareWithLead = (lead: MatchingLead) => {
    setSelectedLead(lead);
    if (selectedUnit) {
      setCustomMessage(generateDefaultMessage(selectedUnit).replace("¡Hola!", `¡Hola ${lead.firstName}!`));
    }
    setMatchingLeadsOpen(false);
    setShareDialogOpen(true);
  };

  const handleSendShare = () => {
    if (!selectedUnit || !selectedLead) return;
    sharePropertyMutation.mutate({
      leadId: selectedLead.id,
      unitId: selectedUnit.id,
      message: customMessage,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customMessage);
    toast({
      title: t("common.copied", "Copiado"),
      description: t("sellerCatalog.messageCopied", "Mensaje copiado al portapapeles"),
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {t("sellerCatalog.title", "Catálogo de Propiedades")}
          </h1>
          <p className="text-muted-foreground">
            {t("sellerCatalog.subtitle", "Encuentra y comparte propiedades con tus leads")}
          </p>
        </div>
        <Badge variant="secondary" className="self-start">
          {catalogData?.total || 0} {t("sellerCatalog.properties", "propiedades")}
        </Badge>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("sellerCatalog.searchPlaceholder", "Buscar por nombre, zona, tipo...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-filters">
              <SlidersHorizontal className="h-4 w-4" />
              {t("sellerCatalog.filters", "Filtros")}
              {hasActiveFilters && (
                <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {Object.values(filters).filter((v) => v && v !== "active").length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{t("sellerCatalog.filterProperties", "Filtrar propiedades")}</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-3 w-3" />
                    {t("common.clear", "Limpiar")}
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">{t("sellerCatalog.minPrice", "Precio mín")}</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      data-testid="input-min-price"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("sellerCatalog.maxPrice", "Precio máx")}</Label>
                    <Input
                      type="number"
                      placeholder="100000"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      data-testid="input-max-price"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">{t("sellerCatalog.bedrooms", "Recámaras")}</Label>
                  <Select
                    value={filters.bedrooms}
                    onValueChange={(v) => setFilters({ ...filters, bedrooms: v })}
                  >
                    <SelectTrigger data-testid="select-bedrooms">
                      <SelectValue placeholder={t("sellerCatalog.any", "Cualquiera")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("sellerCatalog.any", "Cualquiera")}</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">{t("sellerCatalog.zone", "Zona")}</Label>
                  <Select
                    value={filters.zone}
                    onValueChange={(v) => setFilters({ ...filters, zone: v })}
                  >
                    <SelectTrigger data-testid="select-zone">
                      <SelectValue placeholder={t("sellerCatalog.allZones", "Todas las zonas")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("sellerCatalog.allZones", "Todas las zonas")}</SelectItem>
                      {zones?.map((zone) => (
                        <SelectItem key={zone.id} value={zone.name}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">{t("sellerCatalog.propertyType", "Tipo de propiedad")}</Label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(v) => setFilters({ ...filters, propertyType: v })}
                  >
                    <SelectTrigger data-testid="select-property-type">
                      <SelectValue placeholder={t("sellerCatalog.allTypes", "Todos los tipos")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("sellerCatalog.allTypes", "Todos los tipos")}</SelectItem>
                      {propertyTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">{t("sellerCatalog.status", "Estado")}</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(v) => setFilters({ ...filters, status: v })}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("sellerCatalog.active", "Disponible")}</SelectItem>
                      <SelectItem value="rented">{t("sellerCatalog.rented", "Rentada")}</SelectItem>
                      <SelectItem value="">{t("sellerCatalog.all", "Todas")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => setFiltersOpen(false)} className="w-full">
                {t("sellerCatalog.applyFilters", "Aplicar filtros")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : units.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">
            {t("sellerCatalog.noProperties", "No se encontraron propiedades")}
          </h3>
          <p className="text-muted-foreground">
            {t("sellerCatalog.tryAdjusting", "Intenta ajustar los filtros de búsqueda")}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <Card key={unit.id} className="overflow-hidden" data-testid={`card-property-${unit.id}`}>
              <div className="relative h-48 bg-muted">
                {unit.images && unit.images.length > 0 ? (
                  <img
                    src={unit.images[0]}
                    alt={unit.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Home className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
                <Badge
                  className="absolute right-2 top-2"
                  variant={unit.status === "active" ? "default" : "secondary"}
                >
                  {unit.status === "active"
                    ? t("sellerCatalog.available", "Disponible")
                    : t("sellerCatalog.rented", "Rentada")}
                </Badge>
              </div>

              <CardContent className="p-4">
                <h3 className="mb-1 line-clamp-1 font-semibold" data-testid={`text-unit-name-${unit.id}`}>
                  {unit.name}
                </h3>
                <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{unit.zone || t("sellerCatalog.noZone", "Sin zona")}</span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {unit.unitType && (
                    <Badge variant="outline" className="gap-1">
                      <Home className="h-3 w-3" />
                      {unit.unitType}
                    </Badge>
                  )}
                  {unit.bedrooms && (
                    <Badge variant="outline" className="gap-1">
                      <Bed className="h-3 w-3" />
                      {unit.bedrooms}
                    </Badge>
                  )}
                  {unit.bathrooms && (
                    <Badge variant="outline" className="gap-1">
                      <Bath className="h-3 w-3" />
                      {unit.bathrooms}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-lg font-bold text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {unit.monthlyRent?.toLocaleString() || "—"} {unit.currency || "MXN"}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">/mes</span>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 border-t p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleFindMatches(unit)}
                  data-testid={`button-find-matches-${unit.id}`}
                >
                  <Users className="h-4 w-4" />
                  {t("sellerCatalog.findMatches", "Leads")}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleShareClick(unit)}
                  data-testid={`button-share-${unit.id}`}
                >
                  <SiWhatsapp className="h-4 w-4" />
                  {t("sellerCatalog.share", "Compartir")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={matchingLeadsOpen} onOpenChange={setMatchingLeadsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("sellerCatalog.matchingLeads", "Leads compatibles")}
            </DialogTitle>
            <DialogDescription>
              {selectedUnit?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {matchingLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : matchingLeads && matchingLeads.length > 0 ? (
              matchingLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-pointer transition-colors hover-elevate"
                  onClick={() => handleShareWithLead(lead)}
                  data-testid={`card-matching-lead-${lead.id}`}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{lead.phone}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {lead.matchReasons.map((reason, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={lead.matchScore >= 50 ? "default" : "secondary"}>
                        {lead.matchScore}%
                      </Badge>
                      <SiWhatsapp className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {t("sellerCatalog.noMatchingLeads", "No se encontraron leads compatibles")}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              {t("sellerCatalog.shareViaWhatsApp", "Compartir por WhatsApp")}
            </DialogTitle>
            <DialogDescription>
              {selectedUnit?.name}
              {selectedLead && ` → ${selectedLead.firstName} ${selectedLead.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedLead && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t("sellerCatalog.selectLeadFirst", "Primero selecciona un lead desde la lista de 'Leads compatibles'")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setShareDialogOpen(false);
                    setMatchingLeadsOpen(true);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t("sellerCatalog.selectLead", "Seleccionar lead")}
                </Button>
              </div>
            )}

            <div>
              <Label>{t("sellerCatalog.message", "Mensaje")}</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={8}
                className="mt-1 font-mono text-sm"
                data-testid="textarea-share-message"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1">
                <Copy className="h-4 w-4" />
                {t("common.copy", "Copiar")}
              </Button>
              {selectedUnit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomMessage(generateDefaultMessage(selectedUnit))}
                  className="gap-1"
                >
                  {t("sellerCatalog.resetMessage", "Restaurar")}
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              onClick={handleSendShare}
              disabled={!selectedLead || sharePropertyMutation.isPending}
              className="gap-2"
              data-testid="button-send-share"
            >
              <SiWhatsapp className="h-4 w-4" />
              {sharePropertyMutation.isPending
                ? t("common.sending", "Enviando...")
                : t("sellerCatalog.openWhatsApp", "Abrir WhatsApp")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
