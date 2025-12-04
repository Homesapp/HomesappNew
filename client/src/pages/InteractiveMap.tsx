import { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Home, MapPin, Bed, Bath, DollarSign, Filter, Building2, ChevronLeft,
  Search, SlidersHorizontal, RotateCcw, List, Eye, PawPrint, Calendar, Loader2, ChevronDown
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  price: number;
  salePrice: number | null;
  listingType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  title: string;
  zone: string;
  currency: string;
  saleCurrency: string;
  agencySlug: string;
  unitSlug: string;
  condominiumName: string | null;
  condominiumLogoUrl: string | null;
  condominiumColor: string | null;
  petsAllowed: boolean;
}

interface Filters {
  search: string;
  status: string;
  propertyType: string;
  zone: string;
  condominiumName: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  petFriendly: boolean;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const defaultFilters: Filters = {
  search: "",
  status: "all",
  propertyType: "all",
  zone: "all",
  condominiumName: "all",
  minPrice: 0,
  maxPrice: Infinity,
  bedrooms: "all",
  bathrooms: "all",
  petFriendly: false,
};

const defaultCenter = { lat: 20.2119, lng: -87.4297 };
const ITEMS_PER_PAGE = 30;
const DEBOUNCE_MS = 400;

const mapStyles = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const markerColors = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED', '#0891B2', '#DB2777', '#4338CA'];

function getInitials(name: string): string {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

function generateMarkerColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return markerColors[Math.abs(hash) % markerColors.length];
}

function formatPrice(price: number, currency: string = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function getPropertyLink(marker: MapMarker) {
  if (marker.unitSlug && marker.agencySlug) {
    return `/${marker.agencySlug}/${marker.unitSlug}`;
  }
  return `/public-unit/${marker.id}`;
}

const PropertyCard = memo(({ 
  marker, isSelected, isHovered, onHover, onClick, cardRef, language
}: { 
  marker: MapMarker; 
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (marker: MapMarker) => void;
  cardRef: (el: HTMLDivElement | null) => void;
  language: string;
}) => {
  const color = marker.condominiumColor || generateMarkerColor(marker.condominiumName || marker.title || 'default');
  
  const getListingTypeBadge = (listingType: string) => {
    switch (listingType) {
      case "rent": return language === "es" ? "Renta" : "Rent";
      case "sale": return language === "es" ? "Venta" : "Sale";
      case "both": return language === "es" ? "Renta/Venta" : "Rent/Sale";
      default: return null;
    }
  };
  
  return (
    <div
      ref={cardRef}
      className={`p-3 rounded-lg border cursor-pointer transition-all hover-elevate ${
        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 
        isHovered ? 'border-primary/50 bg-muted/50' : 'hover:bg-muted/30'
      }`}
      onMouseEnter={() => onHover(marker.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(marker)}
      data-testid={`card-property-${marker.id}`}
    >
      <div className="flex gap-3">
        {marker.condominiumLogoUrl ? (
          <div className="w-12 h-12 rounded-full border-2 border-muted overflow-hidden bg-background flex-shrink-0">
            <img src={marker.condominiumLogoUrl} alt={marker.condominiumName || ''} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: color }}>
            {marker.condominiumName ? getInitials(marker.condominiumName) : marker.propertyType?.[0]?.toUpperCase() || 'P'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1" data-testid={`text-title-${marker.id}`}>{marker.title}</h3>
              {marker.condominiumName && <p className="text-xs text-muted-foreground line-clamp-1">{marker.condominiumName}</p>}
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 flex-shrink-0">{getListingTypeBadge(marker.listingType)}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{marker.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{marker.bathrooms}</span>
            {marker.petsAllowed && <span className="flex items-center gap-1 text-green-600"><PawPrint className="h-3 w-3" /></span>}
            <span className="flex items-center gap-1 ml-auto"><MapPin className="h-3 w-3" />{marker.zone}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-primary" data-testid={`text-price-${marker.id}`}>
              {formatPrice(marker.price, marker.currency)}<span className="text-xs font-normal text-muted-foreground">/mes</span>
            </span>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" asChild>
              <a href={getPropertyLink(marker)} data-testid={`link-view-${marker.id}`}><Eye className="h-3 w-3" />{language === "es" ? "Ver" : "View"}</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
PropertyCard.displayName = 'PropertyCard';

export default function InteractiveMap() {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [detailProperty, setDetailProperty] = useState<MapMarker | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (mapBounds) {
      params.set('north', mapBounds.north.toString());
      params.set('south', mapBounds.south.toString());
      params.set('east', mapBounds.east.toString());
      params.set('west', mapBounds.west.toString());
    }
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.propertyType !== 'all') params.set('propertyType', filters.propertyType);
    if (filters.zone !== 'all') params.set('zone', filters.zone);
    if (filters.bedrooms !== 'all') params.set('bedrooms', filters.bedrooms);
    if (filters.bathrooms !== 'all') params.set('bathrooms', filters.bathrooms);
    if (filters.petFriendly) params.set('petFriendly', 'true');
    if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== Infinity && filters.maxPrice > 0) params.set('maxPrice', filters.maxPrice.toString());
    return params.toString();
  }, [mapBounds, filters]);

  const { data: markersResponse, isLoading, isFetching } = useQuery<{ markers: MapMarker[]; total: number }>({
    queryKey: ["/api/public/map-markers", queryParams],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!mapBounds,
  });

  const { data: zonesData } = useQuery<{ data: string[] }>({ queryKey: ["/api/public/zones"], staleTime: 5 * 60 * 1000 });
  const { data: condominiumsData } = useQuery<any>({ queryKey: ["/api/public/condominiums"], staleTime: 5 * 60 * 1000 });

  const allMarkers = useMemo(() => markersResponse?.markers || [], [markersResponse]);
  const rawZones = zonesData?.data || [];
  const condominiums = Array.isArray(condominiumsData) ? condominiumsData : (condominiumsData?.data || []);

  const datasetMaxPrice = useMemo(() => {
    if (allMarkers.length === 0) return 500000;
    const prices = allMarkers.map(p => p.price || 0).filter(p => p > 0);
    return Math.ceil(Math.max(...prices, 500000) / 50000) * 50000;
  }, [allMarkers]);

  const zones = useMemo(() => {
    const normalizedMap = new Map<string, string>();
    rawZones.forEach((zone: string) => {
      const key = zone.toLowerCase().trim();
      if (!normalizedMap.has(key)) normalizedMap.set(key, zone);
    });
    return Array.from(normalizedMap.values()).sort((a, b) => a.localeCompare(b, 'es'));
  }, [rawZones]);

  const filteredMarkers = useMemo(() => {
    return allMarkers.filter((marker) => {
      if (!marker.lat || !marker.lng) return false;
      if (filters.search?.trim()) {
        const searchTerm = filters.search.toLowerCase();
        if (!marker.title?.toLowerCase().includes(searchTerm) && 
            !marker.zone?.toLowerCase().includes(searchTerm) && 
            !marker.condominiumName?.toLowerCase().includes(searchTerm)) return false;
      }
      if (filters.condominiumName !== "all" && marker.condominiumName !== filters.condominiumName) return false;
      return true;
    });
  }, [allMarkers, filters.search, filters.condominiumName]);

  const visibleMarkers = useMemo(() => filteredMarkers.slice(0, visibleCount), [filteredMarkers, visibleCount]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "search" && value) return true;
      if (key === "status" && value !== "all") return true;
      if (key === "propertyType" && value !== "all") return true;
      if (key === "zone" && value !== "all") return true;
      if (key === "condominiumName" && value !== "all") return true;
      if (key === "minPrice" && value > 0) return true;
      if (key === "maxPrice" && value !== Infinity && value < datasetMaxPrice) return true;
      if (key === "bedrooms" && value !== "all") return true;
      if (key === "bathrooms" && value !== "all") return true;
      if (key === "petFriendly" && value) return true;
      return false;
    }).length;
  }, [filters, datasetMaxPrice]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  const handleBoundsChanged = useCallback(() => {
    if (!map) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        setMapBounds({ north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() });
      }
    }, DEBOUNCE_MS);
  }, [map]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setTimeout(() => {
      const bounds = mapInstance.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        setMapBounds({ north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() });
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (!map || !isLoaded) return;
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) clustererRef.current.clearMarkers();

    const newMarkers = filteredMarkers.map(marker => {
      const color = marker.condominiumColor || generateMarkerColor(marker.condominiumName || marker.title || 'default');
      const initials = marker.condominiumName ? getInitials(marker.condominiumName) : marker.propertyType?.[0]?.toUpperCase() || 'P';
      const isSelected = marker.id === selectedMarkerId;
      const isHovered = marker.id === hoveredMarkerId;
      const size = isSelected ? 48 : isHovered ? 44 : 40;
      
      const svgIcon = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="${isSelected ? 3 : 2}"/>
        <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${initials}</text>
      </svg>`;

      const gMarker = new google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
          scaledSize: new google.maps.Size(size, size),
          anchor: new google.maps.Point(size / 2, size / 2),
        },
        title: marker.title,
      });

      gMarker.addListener('click', () => {
        setSelectedMarkerId(marker.id);
        setDetailProperty(marker);
        setShowDetailPanel(true);
        const cardElement = cardRefs.current.get(marker.id);
        if (cardElement) cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      return gMarker;
    });

    markersRef.current = newMarkers;

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: newMarkers,
        renderer: {
          render: ({ count, position }) => {
            const size = Math.min(50, 30 + Math.floor(count / 10) * 2);
            return new google.maps.Marker({
              position,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#4F46E5" stroke="white" stroke-width="2"/>
                    <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${count}</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(size, size),
                anchor: new google.maps.Point(size / 2, size / 2),
              },
              zIndex: 1000,
            });
          },
        },
      });
    } else {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(newMarkers);
    }

    return () => { markersRef.current.forEach(marker => marker.setMap(null)); };
  }, [map, isLoaded, filteredMarkers, selectedMarkerId, hoveredMarkerId]);

  const handleCardClick = useCallback((marker: MapMarker) => {
    setSelectedMarkerId(marker.id);
    setDetailProperty(marker);
    setShowDetailPanel(true);
    if (map) {
      map.panTo({ lat: marker.lat, lng: marker.lng });
      if ((map.getZoom() || 13) < 15) map.setZoom(15);
    }
  }, [map]);

  const handleCardHover = useCallback((markerId: string | null) => setHoveredMarkerId(markerId), []);
  const loadMore = useCallback(() => setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredMarkers.length)), [filteredMarkers.length]);

  const getListingTypeBadge = useCallback((listingType: string) => {
    switch (listingType) {
      case "rent": return language === "es" ? "Renta" : "Rent";
      case "sale": return language === "es" ? "Venta" : "Sale";
      case "both": return language === "es" ? "Renta/Venta" : "Rent/Sale";
      default: return null;
    }
  }, [language]);

  const propertyTypes = useMemo(() => [
    { value: "all", label: language === "es" ? "Todos" : "All" },
    { value: "Departamento", label: language === "es" ? "Departamento" : "Apartment" },
    { value: "Casa", label: language === "es" ? "Casa" : "House" },
    { value: "Penthouse", label: "Penthouse" },
    { value: "Studio", label: "Studio" },
    { value: "Loft", label: "Loft" },
    { value: "Villa", label: "Villa" },
  ], [language]);

  const FiltersContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2"><Search className="h-4 w-4" />{language === "es" ? "Buscar" : "Search"}</Label>
        <Input placeholder={language === "es" ? "Nombre, ubicación..." : "Name, location..."} value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="h-9" data-testid="input-map-search" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{language === "es" ? "Operación" : "Type"}</Label>
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="h-9" data-testid="select-map-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
              <SelectItem value="rent">{language === "es" ? "Renta" : "Rent"}</SelectItem>
              <SelectItem value="sale">{language === "es" ? "Venta" : "Sale"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{language === "es" ? "Propiedad" : "Property"}</Label>
          <Select value={filters.propertyType} onValueChange={(value) => setFilters(prev => ({ ...prev, propertyType: value }))}>
            <SelectTrigger className="h-9" data-testid="select-map-property-type"><SelectValue /></SelectTrigger>
            <SelectContent>{propertyTypes.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" />{language === "es" ? "Zona" : "Zone"}</Label>
        <Select value={filters.zone} onValueChange={(value) => setFilters(prev => ({ ...prev, zone: value }))}>
          <SelectTrigger className="h-9" data-testid="select-map-zone"><SelectValue placeholder={language === "es" ? "Todas las zonas" : "All zones"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "es" ? "Todas" : "All"}</SelectItem>
            {zones.map((zone) => (<SelectItem key={zone} value={zone}>{zone}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2"><Building2 className="h-4 w-4" />{language === "es" ? "Condominio" : "Condominium"}</Label>
        <Select value={filters.condominiumName} onValueChange={(value) => setFilters(prev => ({ ...prev, condominiumName: value }))}>
          <SelectTrigger className="h-9" data-testid="select-map-condominium"><SelectValue placeholder={language === "es" ? "Todos" : "All"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
            {condominiums.map((condo: any) => (<SelectItem key={condo.id || condo.name} value={condo.name}>{condo.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2"><Bed className="h-4 w-4" />{language === "es" ? "Recámaras" : "Bedrooms"}</Label>
          <Select value={filters.bedrooms} onValueChange={(value) => setFilters(prev => ({ ...prev, bedrooms: value }))}>
            <SelectTrigger className="h-9" data-testid="select-map-bedrooms"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Cualquiera" : "Any"}</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4+">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2"><Bath className="h-4 w-4" />{language === "es" ? "Baños" : "Bathrooms"}</Label>
          <Select value={filters.bathrooms} onValueChange={(value) => setFilters(prev => ({ ...prev, bathrooms: value }))}>
            <SelectTrigger className="h-9" data-testid="select-map-bathrooms"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Cualquiera" : "Any"}</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3+">3+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" />{language === "es" ? "Precio" : "Price"}</Label>
          <span className="text-xs text-muted-foreground">{formatPrice(filters.minPrice)} - {filters.maxPrice === Infinity ? "∞" : formatPrice(filters.maxPrice)}</span>
        </div>
        <Slider value={[filters.minPrice, filters.maxPrice === Infinity ? datasetMaxPrice : filters.maxPrice]} min={0} max={datasetMaxPrice} step={5000} onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max >= datasetMaxPrice ? Infinity : max }))} className="py-4" data-testid="slider-map-price" />
      </div>
      <div className="flex items-center space-x-2 py-2">
        <Checkbox id="petFriendly" checked={filters.petFriendly} onCheckedChange={(checked) => setFilters(prev => ({ ...prev, petFriendly: !!checked }))} data-testid="checkbox-map-pets" />
        <label htmlFor="petFriendly" className="text-sm font-medium flex items-center gap-2 cursor-pointer"><PawPrint className="h-4 w-4 text-green-600" />{language === "es" ? "Acepta mascotas" : "Pet friendly"}</label>
      </div>
      {activeFiltersCount > 0 && (
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={resetFilters} data-testid="button-reset-filters">
          <RotateCcw className="h-4 w-4" />{language === "es" ? "Limpiar filtros" : "Clear filters"}<Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
        </Button>
      )}
    </div>
  );

  const DetailPanel = () => {
    if (!detailProperty) return null;
    const color = detailProperty.condominiumColor || generateMarkerColor(detailProperty.condominiumName || detailProperty.title || 'default');
    return (
      <Dialog open={showDetailPanel} onOpenChange={setShowDetailPanel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                {detailProperty.condominiumName ? getInitials(detailProperty.condominiumName) : detailProperty.propertyType?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <span className="line-clamp-1">{detailProperty.title}</span>
                {detailProperty.condominiumName && <p className="text-sm font-normal text-muted-foreground">{detailProperty.condominiumName}</p>}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{getListingTypeBadge(detailProperty.listingType)}</Badge>
              <Badge variant="outline" className="gap-1"><Bed className="h-3 w-3" />{detailProperty.bedrooms} {language === "es" ? "rec" : "bed"}</Badge>
              <Badge variant="outline" className="gap-1"><Bath className="h-3 w-3" />{detailProperty.bathrooms} {language === "es" ? "baños" : "bath"}</Badge>
              {detailProperty.petsAllowed && <Badge variant="outline" className="gap-1 text-green-600 border-green-200"><PawPrint className="h-3 w-3" />{language === "es" ? "Mascotas" : "Pets OK"}</Badge>}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{detailProperty.zone}</span></div>
            <div className="border-t pt-4">
              <div className="text-2xl font-bold text-primary">{formatPrice(detailProperty.price, detailProperty.currency)}<span className="text-sm font-normal text-muted-foreground">/mes</span></div>
              {detailProperty.salePrice && <div className="text-lg font-semibold text-muted-foreground mt-1">{language === "es" ? "Venta: " : "Sale: "}{formatPrice(detailProperty.salePrice, detailProperty.saleCurrency)}</div>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 gap-2" asChild><a href={getPropertyLink(detailProperty)} data-testid="button-view-detail"><Eye className="h-4 w-4" />{language === "es" ? "Ver detalles" : "View details"}</a></Button>
              <Button variant="outline" className="gap-2" asChild><a href={`${getPropertyLink(detailProperty)}#contact`} data-testid="button-contact"><Calendar className="h-4 w-4" />{language === "es" ? "Agendar" : "Schedule"}</a></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const LoadingSkeleton = () => (<div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => (<div key={i} className="p-3 rounded-lg border"><div className="flex gap-3"><Skeleton className="w-12 h-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><div className="flex gap-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /></div><Skeleton className="h-5 w-24" /></div></div></div>))}</div>);

  const MapSkeleton = () => (<div className="w-full h-full bg-muted animate-pulse flex items-center justify-center"><div className="text-center space-y-4"><img src={logoIcon} alt="HomesApp" className="h-16 w-auto mx-auto opacity-50" /><div className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div><div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div><div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div></div><p className="text-sm text-muted-foreground">{language === "es" ? "Cargando mapa..." : "Loading map..."}</p></div></div>);

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLocation("/")} data-testid="button-back-home"><ChevronLeft className="h-5 w-5" /></Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <img src={logoIcon} alt="HomesApp" className="h-8 w-auto" />
              <div className="hidden sm:block">
                <h1 className="font-semibold text-sm leading-tight">{language === "es" ? "Mapa Interactivo" : "Interactive Map"}</h1>
                <p className="text-xs text-muted-foreground">Tulum Rental Homes</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 hidden sm:flex">
              <MapPin className="h-3 w-3" />{filteredMarkers.length} {language === "es" ? "propiedades" : "properties"}
              {isFetching && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
            </Badge>
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-2" data-testid="button-mobile-filters">
                  <SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">{language === "es" ? "Filtros" : "Filters"}</span>
                  {activeFiltersCount > 0 && <Badge className="h-5 w-5 p-0 justify-center text-[10px]">{activeFiltersCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader className="pb-4 border-b"><SheetTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />{language === "es" ? "Filtros" : "Filters"}</SheetTitle></SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4"><FiltersContent /></ScrollArea>
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" className="lg:hidden gap-2" onClick={() => setMobileListOpen(true)} data-testid="button-mobile-list"><List className="h-4 w-4" /><span className="hidden sm:inline">{language === "es" ? "Lista" : "List"}</span></Button>
            <LanguageToggle />
          </div>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex">
          <aside className="hidden lg:block w-[272px] border-r bg-background p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><Filter className="h-4 w-4" />{language === "es" ? "Filtros" : "Filters"}</h2>
              {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
            </div>
            <FiltersContent />
          </aside>
          <div className="flex-1 relative">
            {!isLoaded || loadError ? (<MapSkeleton />) : (
              <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={defaultCenter} zoom={13} onLoad={onMapLoad} onIdle={handleBoundsChanged}
                options={{ styles: mapStyles, disableDefaultUI: false, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true, gestureHandling: "greedy" }} />
            )}
          </div>
          <aside className="hidden lg:flex flex-col w-[380px] border-l bg-background">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><Home className="h-4 w-4" />{language === "es" ? "Propiedades" : "Properties"}</h2>
              <Badge variant="outline">{visibleCount < filteredMarkers.length ? `${visibleCount}/${filteredMarkers.length}` : filteredMarkers.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isLoading ? (<LoadingSkeleton />) : filteredMarkers.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{language === "es" ? "No se encontraron propiedades" : "No properties found"}</p>
                    <Button variant="link" size="sm" onClick={resetFilters} className="mt-2">{language === "es" ? "Limpiar filtros" : "Clear filters"}</Button>
                  </div>
                ) : (
                  <>
                    {visibleMarkers.map((marker) => (
                      <PropertyCard key={marker.id} marker={marker} isSelected={selectedMarkerId === marker.id} isHovered={hoveredMarkerId === marker.id} onHover={handleCardHover} onClick={handleCardClick} language={language}
                        cardRef={(el) => { if (el) cardRefs.current.set(marker.id, el); else cardRefs.current.delete(marker.id); }} />
                    ))}
                    {visibleCount < filteredMarkers.length && (
                      <Button variant="outline" className="w-full gap-2" onClick={loadMore} data-testid="button-load-more">
                        <ChevronDown className="h-4 w-4" />{language === "es" ? `Cargar más (${filteredMarkers.length - visibleCount} restantes)` : `Load more (${filteredMarkers.length - visibleCount} remaining)`}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </aside>
        </main>
      </div>
      <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
          <SheetHeader className="pb-2 border-b"><SheetTitle className="flex items-center gap-2"><Home className="h-5 w-5" />{language === "es" ? "Propiedades" : "Properties"}<Badge variant="outline" className="ml-1">{filteredMarkers.length}</Badge></SheetTitle></SheetHeader>
          <ScrollArea className="h-[calc(70vh-80px)] mt-4">
            <div className="space-y-3 pb-6">
              {isLoading ? (<LoadingSkeleton />) : filteredMarkers.length === 0 ? (
                <div className="text-center py-8"><MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">{language === "es" ? "No se encontraron propiedades" : "No properties found"}</p><Button variant="link" size="sm" onClick={resetFilters} className="mt-2">{language === "es" ? "Limpiar filtros" : "Clear filters"}</Button></div>
              ) : (
                <>
                  {visibleMarkers.map((marker) => (<PropertyCard key={marker.id} marker={marker} isSelected={selectedMarkerId === marker.id} isHovered={hoveredMarkerId === marker.id} onHover={handleCardHover} onClick={handleCardClick} language={language} cardRef={(el) => { if (el) cardRefs.current.set(marker.id, el); else cardRefs.current.delete(marker.id); }} />))}
                  {visibleCount < filteredMarkers.length && (<Button variant="outline" className="w-full gap-2" onClick={loadMore} data-testid="button-load-more-mobile"><ChevronDown className="h-4 w-4" />{language === "es" ? `Cargar más (${filteredMarkers.length - visibleCount} restantes)` : `Load more (${filteredMarkers.length - visibleCount} remaining)`}</Button>)}
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <DetailPanel />
    </div>
  );
}
