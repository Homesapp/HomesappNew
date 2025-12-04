import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CompareProperty {
  id: string;
  title: string;
  image?: string;
  price: number;
  salePrice?: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: string;
  zone?: string;
  condoName?: string;
  unitNumber?: string;
  status: "rent" | "sale" | "both";
  petFriendly?: boolean;
  furnished?: boolean;
  rentalType?: string;
  amenities?: string[];
  hoaIncluded?: boolean;
  virtualTourUrl?: string;
}

interface ComparePropertiesContextType {
  selectedProperties: CompareProperty[];
  addProperty: (property: CompareProperty) => boolean;
  removeProperty: (id: string) => void;
  clearAll: () => void;
  isSelected: (id: string) => boolean;
  canAdd: boolean;
  maxProperties: number;
}

const ComparePropertiesContext = createContext<ComparePropertiesContextType | undefined>(undefined);

const MAX_COMPARE_PROPERTIES = 4;

export function ComparePropertiesProvider({ children }: { children: ReactNode }) {
  const [selectedProperties, setSelectedProperties] = useState<CompareProperty[]>([]);

  const addProperty = useCallback((property: CompareProperty): boolean => {
    if (selectedProperties.length >= MAX_COMPARE_PROPERTIES) {
      return false;
    }
    if (selectedProperties.some(p => p.id === property.id)) {
      return false;
    }
    setSelectedProperties(prev => [...prev, property]);
    return true;
  }, [selectedProperties]);

  const removeProperty = useCallback((id: string) => {
    setSelectedProperties(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedProperties([]);
  }, []);

  const isSelected = useCallback((id: string): boolean => {
    return selectedProperties.some(p => p.id === id);
  }, [selectedProperties]);

  const canAdd = selectedProperties.length < MAX_COMPARE_PROPERTIES;

  return (
    <ComparePropertiesContext.Provider
      value={{
        selectedProperties,
        addProperty,
        removeProperty,
        clearAll,
        isSelected,
        canAdd,
        maxProperties: MAX_COMPARE_PROPERTIES,
      }}
    >
      {children}
    </ComparePropertiesContext.Provider>
  );
}

export function useCompareProperties() {
  const context = useContext(ComparePropertiesContext);
  if (context === undefined) {
    throw new Error("useCompareProperties must be used within a ComparePropertiesProvider");
  }
  return context;
}
