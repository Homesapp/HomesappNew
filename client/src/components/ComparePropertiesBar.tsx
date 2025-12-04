import { useState } from "react";
import { useCompareProperties, CompareProperty } from "@/contexts/ComparePropertiesContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  GitCompareArrows,
  X,
  Trash2,
  Bed,
  Bath,
  Square,
  MapPin,
  PawPrint,
  Armchair,
  Building2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Video,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";

const TRANSLATIONS = {
  es: {
    compare: "Comparar",
    compareProperties: "Comparar propiedades",
    clearAll: "Limpiar todo",
    noProperties: "Selecciona propiedades para comparar",
    maxReached: "Máximo alcanzado",
    property: "Propiedad",
    zone: "Zona",
    price: "Precio",
    salePrice: "Precio venta",
    perMonth: "/mes",
    bedrooms: "Recámaras",
    bathrooms: "Baños",
    area: "Área",
    rentalType: "Tipo de renta",
    furnished: "Amueblado",
    petFriendly: "Acepta mascotas",
    hoaIncluded: "HOA incluido",
    amenities: "Amenidades",
    virtualTour: "Tour virtual",
    yes: "Sí",
    no: "No",
    remove: "Quitar",
    viewTour: "Ver tour",
    rent: "Renta",
    sale: "Venta",
    both: "Renta/Venta",
    monthly12: "12 meses",
    monthly6: "6 meses",
    vacation: "Vacacional",
    previousProperty: "Propiedad anterior",
    nextProperty: "Siguiente propiedad",
    propertyNavigation: "Navegación de propiedades",
  },
  en: {
    compare: "Compare",
    compareProperties: "Compare properties",
    clearAll: "Clear all",
    noProperties: "Select properties to compare",
    maxReached: "Max reached",
    property: "Property",
    zone: "Zone",
    price: "Price",
    salePrice: "Sale price",
    perMonth: "/month",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    area: "Area",
    rentalType: "Rental type",
    furnished: "Furnished",
    petFriendly: "Pet friendly",
    hoaIncluded: "HOA included",
    amenities: "Amenities",
    virtualTour: "Virtual tour",
    yes: "Yes",
    no: "No",
    remove: "Remove",
    viewTour: "View tour",
    rent: "Rent",
    sale: "Sale",
    both: "Rent/Sale",
    monthly12: "12 months",
    monthly6: "6 months",
    vacation: "Vacation",
    previousProperty: "Previous property",
    nextProperty: "Next property",
    propertyNavigation: "Property navigation",
  },
};

export function ComparePropertiesBar() {
  const { selectedProperties, removeProperty, clearAll, maxProperties } = useCompareProperties();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.es;

  if (selectedProperties.length === 0) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg">
            <GitCompareArrows className="h-5 w-5" />
            <span className="font-medium">{t.compare}</span>
            <Badge variant="secondary" className="rounded-full">
              {selectedProperties.length}/{maxProperties}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full ml-2"
              onClick={() => setIsModalOpen(true)}
              data-testid="button-open-compare"
            >
              {t.compareProperties}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/20"
              onClick={clearAll}
              data-testid="button-clear-compare"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      <CompareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        properties={selectedProperties}
        onRemove={removeProperty}
        onClearAll={() => {
          clearAll();
          setIsModalOpen(false);
        }}
        t={t}
      />
    </>
  );
}

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: CompareProperty[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  t: typeof TRANSLATIONS.es;
}

function CompareModal({ isOpen, onClose, properties, onRemove, onClearAll, t }: CompareModalProps) {
  const [mobileIndex, setMobileIndex] = useState(0);

  const statusLabels = {
    rent: t.rent,
    sale: t.sale,
    both: t.both,
  };

  const rentalTypeLabels: Record<string, string> = {
    monthly_12: t.monthly12,
    monthly_6: t.monthly6,
    vacation: t.vacation,
  };

  const goNext = () => {
    if (mobileIndex < properties.length - 1) {
      setMobileIndex(mobileIndex + 1);
    }
  };

  const goPrev = () => {
    if (mobileIndex > 0) {
      setMobileIndex(mobileIndex - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between gap-2 space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5" />
            {t.compareProperties} ({properties.length})
          </DialogTitle>
          <Button variant="outline" size="sm" onClick={onClearAll} data-testid="button-clear-all-compare">
            <Trash2 className="h-4 w-4 mr-1" />
            {t.clearAll}
          </Button>
        </DialogHeader>

        {properties.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <GitCompareArrows className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t.noProperties}</p>
          </div>
        ) : (
          <>
            {/* Desktop view - Table */}
            <div className="hidden md:block">
              <ScrollArea className="w-full">
                <div className="p-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 border-b font-medium text-muted-foreground w-32"></th>
                        {properties.map((prop) => (
                          <th key={prop.id} className="p-2 border-b min-w-[200px]">
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                                onClick={() => onRemove(prop.id)}
                                data-testid={`button-remove-compare-${prop.id}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              {prop.image ? (
                                <img
                                  src={prop.image}
                                  alt={prop.title}
                                  className="w-full h-32 object-cover rounded-lg mb-2"
                                />
                              ) : (
                                <div className="w-full h-32 bg-muted rounded-lg mb-2 flex items-center justify-center">
                                  <Building2 className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <p className="font-semibold text-sm line-clamp-2">{prop.title}</p>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <CompareRow label={t.zone} icon={<MapPin className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b">
                            <span className="text-sm">{prop.zone || prop.location}</span>
                          </td>
                        ))}
                      </CompareRow>

                      <CompareRow label={t.price} icon={<DollarSign className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b">
                            <div className="font-semibold text-primary">
                              ${prop.price.toLocaleString()} {prop.currency}
                              {prop.status !== "sale" && <span className="text-xs font-normal">{t.perMonth}</span>}
                            </div>
                            {prop.salePrice && (
                              <div className="text-sm text-muted-foreground">
                                {t.salePrice}: ${prop.salePrice.toLocaleString()} {prop.currency}
                              </div>
                            )}
                          </td>
                        ))}
                      </CompareRow>

                      <CompareRow label={t.rentalType} icon={<Building2 className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b">
                            <Badge variant="outline">
                              {statusLabels[prop.status]}
                            </Badge>
                            {prop.rentalType && (
                              <span className="text-sm ml-1">
                                ({rentalTypeLabels[prop.rentalType] || prop.rentalType})
                              </span>
                            )}
                          </td>
                        ))}
                      </CompareRow>

                      <CompareRow label={t.bedrooms} icon={<Bed className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b text-center">
                            <span className="font-medium">{prop.bedrooms}</span>
                          </td>
                        ))}
                      </CompareRow>

                      <CompareRow label={t.bathrooms} icon={<Bath className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b text-center">
                            <span className="font-medium">{prop.bathrooms}</span>
                          </td>
                        ))}
                      </CompareRow>

                      <CompareRow label={t.area} icon={<Square className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b text-center">
                            <span className="font-medium">{prop.area} m²</span>
                          </td>
                        ))}
                      </CompareRow>

                      <CompareRow label={t.furnished} icon={<Armchair className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b text-center">
                            {prop.furnished ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        ))}
                      </CompareRow>

                      <CompareRow label={t.petFriendly} icon={<PawPrint className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b text-center">
                            {prop.petFriendly ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        ))}
                      </CompareRow>

                      <CompareRow label={t.hoaIncluded} icon={<Building2 className="h-4 w-4" />}>
                        {properties.map((prop) => (
                          <td key={prop.id} className="p-2 border-b text-center">
                            {prop.hoaIncluded ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        ))}
                      </CompareRow>

                      {properties.some(p => p.amenities && p.amenities.length > 0) && (
                        <CompareRow label={t.amenities} icon={<Building2 className="h-4 w-4" />}>
                          {properties.map((prop) => (
                            <td key={prop.id} className="p-2 border-b">
                              <div className="flex flex-wrap gap-1">
                                {prop.amenities?.slice(0, 5).map((amenity, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                                {prop.amenities && prop.amenities.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{prop.amenities.length - 5}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          ))}
                        </CompareRow>
                      )}

                      {properties.some(p => p.virtualTourUrl) && (
                        <CompareRow label={t.virtualTour} icon={<Video className="h-4 w-4" />}>
                          {properties.map((prop) => (
                            <td key={prop.id} className="p-2 border-b text-center">
                              {prop.virtualTourUrl ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(prop.virtualTourUrl, "_blank")}
                                  data-testid={`button-view-tour-${prop.id}`}
                                >
                                  <Video className="h-4 w-4 mr-1" />
                                  {t.viewTour}
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                        </CompareRow>
                      )}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            {/* Mobile view - Carousel */}
            <div className="md:hidden" role="region" aria-label={t.compareProperties}>
              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goPrev}
                    disabled={mobileIndex === 0}
                    aria-label={t.previousProperty || "Propiedad anterior"}
                    data-testid="button-compare-prev"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div 
                    className="flex gap-1" 
                    role="tablist" 
                    aria-label={t.propertyNavigation || "Navegación de propiedades"}
                  >
                    {properties.map((prop, idx) => (
                      <button
                        key={idx}
                        role="tab"
                        aria-selected={idx === mobileIndex}
                        aria-label={`${t.property} ${idx + 1}: ${prop.title}`}
                        className={`h-2 w-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          idx === mobileIndex ? "bg-primary" : "bg-muted"
                        }`}
                        onClick={() => setMobileIndex(idx)}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goNext}
                    disabled={mobileIndex === properties.length - 1}
                    aria-label={t.nextProperty || "Siguiente propiedad"}
                    data-testid="button-compare-next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <ScrollArea className="h-[60vh]">
                  <div className="p-4">
                    {properties[mobileIndex] && (
                      <MobilePropertyCard
                        property={properties[mobileIndex]}
                        onRemove={() => {
                          onRemove(properties[mobileIndex].id);
                          if (mobileIndex > 0) setMobileIndex(mobileIndex - 1);
                        }}
                        t={t}
                        statusLabels={statusLabels}
                        rentalTypeLabels={rentalTypeLabels}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CompareRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td className="p-2 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
      </td>
      {children}
    </tr>
  );
}

interface MobilePropertyCardProps {
  property: CompareProperty;
  onRemove: () => void;
  t: typeof TRANSLATIONS.es;
  statusLabels: Record<string, string>;
  rentalTypeLabels: Record<string, string>;
}

function MobilePropertyCard({ property, onRemove, t, statusLabels, rentalTypeLabels }: MobilePropertyCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="relative">
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={onRemove}
            data-testid={`button-remove-mobile-${property.id}`}
          >
            <X className="h-4 w-4 mr-1" />
            {t.remove}
          </Button>
          {property.image ? (
            <img
              src={property.image}
              alt={property.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-lg">{property.title}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{property.zone || property.location}</span>
          </div>
        </div>

        <div className="text-2xl font-bold text-primary">
          ${property.price.toLocaleString()} {property.currency}
          {property.status !== "sale" && <span className="text-sm font-normal">{t.perMonth}</span>}
        </div>
        {property.salePrice && (
          <div className="text-sm text-muted-foreground">
            {t.salePrice}: ${property.salePrice.toLocaleString()} {property.currency}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Badge variant="outline">{statusLabels[property.status]}</Badge>
          {property.rentalType && (
            <Badge variant="secondary">
              {rentalTypeLabels[property.rentalType] || property.rentalType}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <Bed className="h-5 w-5 mx-auto text-muted-foreground" />
            <div className="font-medium">{property.bedrooms}</div>
            <div className="text-xs text-muted-foreground">{t.bedrooms}</div>
          </div>
          <div>
            <Bath className="h-5 w-5 mx-auto text-muted-foreground" />
            <div className="font-medium">{property.bathrooms}</div>
            <div className="text-xs text-muted-foreground">{t.bathrooms}</div>
          </div>
          <div>
            <Square className="h-5 w-5 mx-auto text-muted-foreground" />
            <div className="font-medium">{property.area} m²</div>
            <div className="text-xs text-muted-foreground">{t.area}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Armchair className="h-4 w-4" />
              {t.furnished}
            </span>
            {property.furnished ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <PawPrint className="h-4 w-4" />
              {t.petFriendly}
            </span>
            {property.petFriendly ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t.hoaIncluded}
            </span>
            {property.hoaIncluded ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-2">{t.amenities}</div>
            <div className="flex flex-wrap gap-1">
              {property.amenities.map((amenity, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {property.virtualTourUrl && (
          <Button
            className="w-full"
            onClick={() => window.open(property.virtualTourUrl, "_blank")}
            data-testid={`button-view-tour-mobile-${property.id}`}
          >
            <Video className="h-4 w-4 mr-2" />
            {t.viewTour}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
