import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Map, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchHeroProps {
  compact?: boolean;
  showFilters?: boolean;
  onSearch?: (query: string, type: string) => void;
}

export function SearchHero({ compact = false, showFilters = true, onSearch }: SearchHeroProps) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [operationType, setOperationType] = useState("all");

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery, operationType);
    } else {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (operationType !== "all") params.set("status", operationType);
      setLocation(`/mapa-interactivo?${params.toString()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row gap-2" data-testid="search-hero-compact">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search.placeholder") || "Buscar por ubicación, condominio..."}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="input-search-compact"
          />
        </div>
        <div className="flex gap-2">
          <Select value={operationType} onValueChange={setOperationType}>
            <SelectTrigger className="w-[120px]" data-testid="select-operation-type">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="rent">Renta</SelectItem>
              <SelectItem value="sale">Venta</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} data-testid="button-search">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setLocation("/mapa-interactivo")} data-testid="button-go-map">
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-2xl p-6 sm:p-8 border" data-testid="search-hero">
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          {t("search.title") || "Encuentra tu próximo hogar en Tulum"}
        </h2>
        <p className="text-muted-foreground text-center text-sm sm:text-base">
          {t("search.subtitle") || "Explora propiedades en renta y venta"}
        </p>
        
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("search.placeholder") || "Buscar por ubicación, colonia, condominio o descripción"}
              className="pl-12 h-12 text-base rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="input-search-main"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button
                variant={operationType === "rent" ? "default" : "outline"}
                className="flex-1 rounded-xl"
                onClick={() => setOperationType(operationType === "rent" ? "all" : "rent")}
                data-testid="button-filter-rent"
              >
                Renta
              </Button>
              <Button
                variant={operationType === "sale" ? "default" : "outline"}
                className="flex-1 rounded-xl"
                onClick={() => setOperationType(operationType === "sale" ? "all" : "sale")}
                data-testid="button-filter-sale"
              >
                Venta
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                className="flex-1 sm:flex-none rounded-xl h-10 px-6"
                data-testid="button-search-main"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/mapa-interactivo")}
                className="rounded-xl h-10"
                data-testid="button-open-map"
              >
                <Map className="h-4 w-4 mr-2" />
                Mapa
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
