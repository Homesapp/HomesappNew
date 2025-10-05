import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

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
    "common.error": "Error",
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
    
    // Profile Page
    "profile.title": "Mi Perfil",
    "profile.personalInfo": "Información Personal",
    "profile.conversations": "Conversaciones",
    "profile.firstName": "Nombre",
    "profile.lastName": "Apellido",
    "profile.email": "Email",
    "profile.emailCannotChange": "El email no se puede cambiar",
    "profile.phone": "Teléfono",
    "profile.bio": "Biografía",
    "profile.bioPlaceholder": "Cuéntanos un poco sobre ti...",
    "profile.uploadPhoto": "Subir Foto",
    "profile.removePhoto": "Quitar Foto",
    "profile.imageFormats": "Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 2MB",
    "profile.deleteAccount": "Eliminar Cuenta",
    "profile.deleting": "Eliminando...",
    "profile.saveChanges": "Guardar Cambios",
    "profile.saving": "Guardando...",
    "profile.deleteConfirmTitle": "¿Estás seguro?",
    "profile.deleteConfirmDesc": "Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta y todos tus datos asociados.",
    "profile.profileUpdated": "Perfil actualizado",
    "profile.profileUpdatedDesc": "Tu perfil ha sido actualizado exitosamente",
    "profile.updateError": "No se pudo actualizar el perfil",
    "profile.imageError": "Por favor selecciona un archivo de imagen válido",
    "profile.imageSizeError": "La imagen debe ser menor a 2MB",
    "profile.accountDeleted": "Cuenta eliminada",
    "profile.accountDeletedDesc": "Tu cuenta ha sido eliminada exitosamente",
    "profile.deleteError": "No se pudo eliminar la cuenta",
    "profile.recentConversations": "Conversaciones Recientes",
    "profile.noConversations": "No tienes conversaciones aún",
    "profile.viewAllChats": "Ver Todas las Conversaciones",
    "profile.bot": "Bot",
  },
  en: {
    // Header
    "header.search": "Search properties",
    "header.switchToOwner": "Switch to Owner",
    "header.switchToClient": "Switch to Client",
    "header.logout": "Log out",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
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
    
    // Profile Page
    "profile.title": "My Profile",
    "profile.personalInfo": "Personal Information",
    "profile.conversations": "Conversations",
    "profile.firstName": "First Name",
    "profile.lastName": "Last Name",
    "profile.email": "Email",
    "profile.emailCannotChange": "Email cannot be changed",
    "profile.phone": "Phone",
    "profile.bio": "Bio",
    "profile.bioPlaceholder": "Tell us a little about yourself...",
    "profile.uploadPhoto": "Upload Photo",
    "profile.removePhoto": "Remove Photo",
    "profile.imageFormats": "Allowed formats: JPG, PNG, GIF. Maximum size: 2MB",
    "profile.deleteAccount": "Delete Account",
    "profile.deleting": "Deleting...",
    "profile.saveChanges": "Save Changes",
    "profile.saving": "Saving...",
    "profile.deleteConfirmTitle": "Are you sure?",
    "profile.deleteConfirmDesc": "This action cannot be undone. This will permanently delete your account and all your associated data.",
    "profile.profileUpdated": "Profile updated",
    "profile.profileUpdatedDesc": "Your profile has been updated successfully",
    "profile.updateError": "Could not update profile",
    "profile.imageError": "Please select a valid image file",
    "profile.imageSizeError": "Image must be smaller than 2MB",
    "profile.accountDeleted": "Account deleted",
    "profile.accountDeletedDesc": "Your account has been deleted successfully",
    "profile.deleteError": "Could not delete account",
    "profile.recentConversations": "Recent Conversations",
    "profile.noConversations": "You don't have any conversations yet",
    "profile.viewAllChats": "View All Conversations",
    "profile.bot": "Bot",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "es";
  });

  // Update language when user data loads
  useEffect(() => {
    if (user?.preferredLanguage) {
      const userLang = user.preferredLanguage as Language;
      if (userLang !== language) {
        setLanguageState(userLang);
      }
    }
  }, [user?.preferredLanguage]);

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
