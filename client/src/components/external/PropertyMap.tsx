import { useState, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Bed, Bath, Square, ExternalLink, Home, Loader2, Building2, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface PropertyLocation {
  id: string;
  title?: string;
  unitNumber: string;
  condominiumName?: string;
  latitude: number;
  longitude: number;
  price?: number | string;
  salePrice?: number | string;
  currency?: string;
  saleCurrency?: string;
  listingType?: string;
  bedrooms?: number;
  bathrooms?: number | string;
  area?: number | string;
  propertyType?: string;
  zone?: string;
  city?: string;
  primaryImages?: string[];
  slug?: string;
  agencySlug?: string;
}

interface LocationCluster {
  key: string;
  lat: number;
  lng: number;
  properties: PropertyLocation[];
  condominiumName?: string;
}

interface PropertyMapProps {
  properties: PropertyLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onPropertyClick?: (property: PropertyLocation) => void;
  showInfoWindow?: boolean;
  language?: "es" | "en";
  linkPrefix?: string;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 20.2119,
  lng: -87.4297,
};

const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

export function PropertyMap({
  properties,
  center,
  zoom = 13,
  height = "500px",
  onPropertyClick,
  showInfoWindow = true,
  language = "es",
  linkPrefix = "/public-unit",
}: PropertyMapProps) {
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyLocation | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const t = {
    es: {
      loading: "Cargando mapa...",
      noProperties: "No hay propiedades para mostrar en el mapa",
      viewDetails: "Ver detalles",
      rent: "Renta",
      sale: "Venta",
      rentSale: "Renta/Venta",
      bedrooms: "Recámaras",
      bathrooms: "Baños",
      area: "Área",
      mapError: "Error al cargar el mapa",
      noApiKey: "Configuración del mapa pendiente",
    },
    en: {
      loading: "Loading map...",
      noProperties: "No properties to display on the map",
      viewDetails: "View details",
      rent: "Rent",
      sale: "Sale",
      rentSale: "Rent/Sale",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      area: "Area",
      mapError: "Error loading map",
      noApiKey: "Map configuration pending",
    },
  };

  const labels = t[language];

  const validProperties = useMemo(() => {
    return properties.filter(
      (p) =>
        p.latitude &&
        p.longitude &&
        !isNaN(Number(p.latitude)) &&
        !isNaN(Number(p.longitude)) &&
        Number(p.latitude) !== 0 &&
        Number(p.longitude) !== 0
    );
  }, [properties]);

  // Group properties by location (cluster properties at same coordinates)
  const locationClusters = useMemo(() => {
    const clusters = new Map<string, LocationCluster>();
    
    for (const property of validProperties) {
      // Round to 5 decimal places to group very close properties
      const lat = Number(property.latitude).toFixed(5);
      const lng = Number(property.longitude).toFixed(5);
      const key = `${lat},${lng}`;
      
      if (!clusters.has(key)) {
        clusters.set(key, {
          key,
          lat: Number(property.latitude),
          lng: Number(property.longitude),
          properties: [],
          condominiumName: property.condominiumName,
        });
      }
      
      clusters.get(key)!.properties.push(property);
    }
    
    return Array.from(clusters.values());
  }, [validProperties]);

  const mapCenter = useMemo(() => {
    if (center) return center;
    if (validProperties.length === 0) return defaultCenter;

    const sumLat = validProperties.reduce((sum, p) => sum + Number(p.latitude), 0);
    const sumLng = validProperties.reduce((sum, p) => sum + Number(p.longitude), 0);

    return {
      lat: sumLat / validProperties.length,
      lng: sumLng / validProperties.length,
    };
  }, [center, validProperties]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleClusterClick = (cluster: LocationCluster) => {
    if (cluster.properties.length === 1) {
      // Single property - show property info directly
      setSelectedProperty(cluster.properties[0]);
      setSelectedCluster(null);
      if (onPropertyClick) {
        onPropertyClick(cluster.properties[0]);
      }
    } else {
      // Multiple properties - show cluster list
      setSelectedCluster(cluster);
      setSelectedProperty(null);
    }
  };

  const handlePropertySelect = (property: PropertyLocation) => {
    setSelectedProperty(property);
    setSelectedCluster(null);
    if (onPropertyClick) {
      onPropertyClick(property);
    }
  };

  const getClusterIcon = (count: number) => {
    if (count === 1) {
      // Single property marker
      return {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0C8.954 0 0 8.954 0 20c0 14.625 18.125 26.25 20 28 1.875-1.75 20-13.375 20-28C40 8.954 31.046 0 20 0z" fill="#4F46E5"/>
            <circle cx="20" cy="18" r="8" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40),
      };
    }
    // Cluster marker with count
    const size = count > 50 ? 52 : count > 20 ? 46 : count > 10 ? 42 : 38;
    const fontSize = count > 99 ? 11 : count > 9 ? 13 : 14;
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#4F46E5" stroke="white" stroke-width="3"/>
          <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${count}</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size/2, size/2),
    };
  };

  const formatPrice = (price: number | string | undefined, currency: string = "MXN") => {
    if (!price) return null;
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return null;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getPropertyLink = (property: PropertyLocation) => {
    if (property.slug && property.agencySlug) {
      return `/${property.agencySlug}/${property.slug}`;
    }
    return `${linkPrefix}/${property.id}`;
  };

  const getListingTypeLabel = (listingType?: string) => {
    if (!listingType) return null;
    switch (listingType) {
      case "rent":
        return labels.rent;
      case "sale":
        return labels.sale;
      case "both":
        return labels.rentSale;
      default:
        return null;
    }
  };

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{labels.noApiKey}</p>
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-destructive">
          <MapPin className="h-12 w-12 mx-auto mb-3" />
          <p>{labels.mapError}</p>
        </div>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{labels.loading}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (validProperties.length === 0) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-muted-foreground">
          <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{labels.noProperties}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {locationClusters.map((cluster) => (
          <Marker
            key={cluster.key}
            position={{
              lat: cluster.lat,
              lng: cluster.lng,
            }}
            onClick={() => handleClusterClick(cluster)}
            icon={getClusterIcon(cluster.properties.length)}
            title={cluster.properties.length > 1 
              ? `${cluster.properties.length} propiedades${cluster.condominiumName ? ` en ${cluster.condominiumName}` : ''}`
              : cluster.properties[0]?.title || cluster.properties[0]?.unitNumber
            }
          />
        ))}

        {/* Cluster InfoWindow - shows list of properties at same location */}
        {showInfoWindow && selectedCluster && selectedCluster.properties.length > 1 && (
          <InfoWindow
            position={{
              lat: selectedCluster.lat,
              lng: selectedCluster.lng,
            }}
            onCloseClick={() => setSelectedCluster(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -20),
              maxWidth: 320,
            }}
          >
            <div className="p-2 min-w-[280px]">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">
                    {selectedCluster.condominiumName || selectedCluster.properties[0]?.zone || "Ubicación"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedCluster.properties.length} {language === "es" ? "unidades disponibles" : "units available"}
                  </p>
                </div>
              </div>
              
              <ScrollArea className="max-h-[240px]">
                <div className="space-y-2 pr-2">
                  {selectedCluster.properties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer border"
                      onClick={() => handlePropertySelect(property)}
                      data-testid={`cluster-property-${property.id}`}
                    >
                      {property.primaryImages && property.primaryImages[0] ? (
                        <img
                          src={property.primaryImages[0]}
                          alt={property.unitNumber}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {property.title || `Unidad ${property.unitNumber}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {property.bedrooms && (
                            <span className="flex items-center gap-0.5">
                              <Bed className="h-3 w-3" />
                              {property.bedrooms}
                            </span>
                          )}
                          {property.bathrooms && (
                            <span className="flex items-center gap-0.5">
                              <Bath className="h-3 w-3" />
                              {property.bathrooms}
                            </span>
                          )}
                          {property.price && (
                            <span className="text-primary font-medium">
                              {formatPrice(property.price, property.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </InfoWindow>
        )}

        {/* Single property InfoWindow */}
        {showInfoWindow && selectedProperty && (
          <InfoWindow
            position={{
              lat: Number(selectedProperty.latitude),
              lng: Number(selectedProperty.longitude),
            }}
            onCloseClick={() => setSelectedProperty(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -40),
            }}
          >
            <div className="p-2 min-w-[200px] max-w-[280px]">
              {selectedProperty.primaryImages && selectedProperty.primaryImages[0] && (
                <div className="mb-2 rounded overflow-hidden">
                  <img
                    src={selectedProperty.primaryImages[0]}
                    alt={selectedProperty.title || selectedProperty.unitNumber}
                    className="w-full h-24 object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-1">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {selectedProperty.title || `Unidad ${selectedProperty.unitNumber}`}
                </h3>
                
                {selectedProperty.zone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedProperty.zone}
                    {selectedProperty.city && `, ${selectedProperty.city}`}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedProperty.listingType && (
                    <Badge variant="secondary" className="text-xs">
                      {getListingTypeLabel(selectedProperty.listingType)}
                    </Badge>
                  )}
                  {selectedProperty.price && (
                    <Badge variant="outline" className="text-xs">
                      {formatPrice(selectedProperty.price, selectedProperty.currency)}
                      {selectedProperty.listingType === "rent" && "/mes"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
                  {selectedProperty.bedrooms && (
                    <span className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      {selectedProperty.bedrooms}
                    </span>
                  )}
                  {selectedProperty.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" />
                      {selectedProperty.bathrooms}
                    </span>
                  )}
                  {selectedProperty.area && (
                    <span className="flex items-center gap-1">
                      <Square className="h-3 w-3" />
                      {selectedProperty.area} m²
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <Link href={getPropertyLink(selectedProperty)}>
                    <Button size="sm" className="w-full text-xs" data-testid={`btn-view-property-${selectedProperty.id}`}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {labels.viewDetails}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
