import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Header
    "header.search": "Buscar propiedades",
    "header.switchToOwner": "Cambiar a Propietario",
    "header.switchToClient": "Cambiar a Cliente",
    "header.logout": "Cerrar sesión",
    
    // Common
    "common.loading": "Cargando...",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.approve": "Aprobar",
    "common.reject": "Rechazar",
    "common.pending": "Pendiente",
    "common.approved": "Aprobado",
    "common.rejected": "Rechazado",
    
    // Navigation
    "nav.home": "Inicio",
    "nav.dashboard": "Dashboard",
    "nav.search": "Buscar Propiedades",
    "nav.favorites": "Mis Favoritos",
    "nav.opportunities": "Mis Oportunidades",
    "nav.properties": "Mis Propiedades",
    "nav.appointments": "Gestión de Visitas",
    "nav.leads": "CRM - Leads",
    "nav.rentals": "Kanban - Rentas",
    "nav.calendar": "Calendario",
    
    // Public Dashboard
    "public.hero.title": "Encuentra tu hogar ideal en Tulum",
    "public.hero.subtitle": "Propiedades exclusivas en Tulum, Quintana Roo",
    "public.search.placeholder": "Busca por zona en Tulum, tipo de propiedad...",
    "public.search.button": "Buscar",
    "public.filter.rent": "En Renta",
    "public.filter.sale": "En Venta",
    "public.filter.featured": "Destacadas",
    "public.featured.title": "Propiedades Destacadas",
    "public.featured.viewAll": "Ver todas",
    "public.explore.title": "Explora Propiedades",
    "public.cta.title": "¿Listo para encontrar tu hogar?",
    "public.cta.subtitle": "Regístrate hoy y accede a miles de propiedades exclusivas",
    "public.cta.button": "Comenzar Ahora",
    "public.login": "Iniciar Sesión",
    "public.register": "Registrarse",
  },
  en: {
    // Header
    "header.search": "Search properties",
    "header.switchToOwner": "Switch to Owner",
    "header.switchToClient": "Switch to Client",
    "header.logout": "Log out",
    
    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.approve": "Approve",
    "common.reject": "Reject",
    "common.pending": "Pending",
    "common.approved": "Approved",
    "common.rejected": "Rejected",
    
    // Navigation
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.search": "Search Properties",
    "nav.favorites": "My Favorites",
    "nav.opportunities": "My Opportunities",
    "nav.properties": "My Properties",
    "nav.appointments": "Appointments Management",
    "nav.leads": "CRM - Leads",
    "nav.rentals": "Kanban - Rentals",
    "nav.calendar": "Calendar",
    
    // Public Dashboard
    "public.hero.title": "Find your ideal home in Tulum",
    "public.hero.subtitle": "Exclusive properties in Tulum, Quintana Roo",
    "public.search.placeholder": "Search by area in Tulum, property type...",
    "public.search.button": "Search",
    "public.filter.rent": "For Rent",
    "public.filter.sale": "For Sale",
    "public.filter.featured": "Featured",
    "public.featured.title": "Featured Properties",
    "public.featured.viewAll": "View all",
    "public.explore.title": "Explore Properties",
    "public.cta.title": "Ready to find your home?",
    "public.cta.subtitle": "Register today and access thousands of exclusive properties",
    "public.cta.button": "Get Started",
    "public.login": "Login",
    "public.register": "Register",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "es";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
