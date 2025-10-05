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
    
    // Login Page
    "login.title": "Iniciar Sesión",
    "login.subtitle": "Ingresa con tu cuenta de HomesApp",
    "login.email": "Email",
    "login.password": "Contraseña",
    "login.submit": "Entrar",
    "login.submitting": "Entrando...",
    "login.noAccount": "¿No tienes una cuenta?",
    "login.registerLink": "Regístrate aquí",
    "login.orContinueWith": "O inicia sesión con",
    "login.continueWithReplit": "Continuar con Replit",
    "login.error": "Error al iniciar sesión",
    "login.errorDesc": "Credenciales inválidas. Verifica tu email y contraseña.",
    
    // Register Page
    "register.title": "Crear Cuenta",
    "register.subtitle": "Únete a HomesApp",
    "register.firstName": "Nombre",
    "register.lastName": "Apellido",
    "register.email": "Email",
    "register.phone": "Teléfono",
    "register.phoneOptional": "Teléfono (opcional)",
    "register.password": "Contraseña",
    "register.confirmPassword": "Confirmar Contraseña",
    "register.preferredLanguage": "Idioma Preferido",
    "register.languageSpanish": "Español",
    "register.languageEnglish": "English",
    "register.submit": "Crear Cuenta",
    "register.submitting": "Creando cuenta...",
    "register.hasAccount": "¿Ya tienes cuenta?",
    "register.loginLink": "Inicia sesión aquí",
    "register.success": "¡Registro exitoso!",
    "register.successDesc": "Te hemos enviado un email de verificación. Por favor revisa tu bandeja de entrada.",
    "register.error": "Error al registrarse",
    "register.errorDesc": "No se pudo crear tu cuenta. Inténtalo de nuevo.",
    "register.passwordMismatch": "Las contraseñas no coinciden",
    "register.confirmPasswordRequired": "Por favor confirma tu contraseña",
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
    
    // Login Page
    "login.title": "Login",
    "login.subtitle": "Enter your HomesApp account",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Login",
    "login.submitting": "Logging in...",
    "login.noAccount": "Don't have an account?",
    "login.registerLink": "Register here",
    "login.orContinueWith": "Or continue with",
    "login.continueWithReplit": "Continue with Replit",
    "login.error": "Login error",
    "login.errorDesc": "Invalid credentials. Check your email and password.",
    
    // Register Page
    "register.title": "Create Account",
    "register.subtitle": "Join HomesApp",
    "register.firstName": "First Name",
    "register.lastName": "Last Name",
    "register.email": "Email",
    "register.phone": "Phone",
    "register.phoneOptional": "Phone (optional)",
    "register.password": "Password",
    "register.confirmPassword": "Confirm Password",
    "register.preferredLanguage": "Preferred Language",
    "register.languageSpanish": "Español",
    "register.languageEnglish": "English",
    "register.submit": "Create Account",
    "register.submitting": "Creating account...",
    "register.hasAccount": "Already have an account?",
    "register.loginLink": "Login here",
    "register.success": "Registration successful!",
    "register.successDesc": "We've sent you a verification email. Please check your inbox.",
    "register.error": "Registration error",
    "register.errorDesc": "Could not create your account. Please try again.",
    "register.passwordMismatch": "Passwords do not match",
    "register.confirmPasswordRequired": "Please confirm your password",
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

  // Sync language between localStorage and user profile
  useEffect(() => {
    const syncLanguage = async () => {
      if (user) {
        const localStorageLang = localStorage.getItem("language") as Language;
        const userLang = user.preferredLanguage as Language;
        
        // If user has a language preference in localStorage that differs from their profile,
        // update the backend with the localStorage value (user chose this before/after login)
        if (localStorageLang && localStorageLang !== userLang) {
          try {
            await fetch("/api/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ preferredLanguage: localStorageLang }),
            });
            // Keep the localStorage language active
            if (localStorageLang !== language) {
              setLanguageState(localStorageLang);
            }
          } catch (error) {
            console.error("Failed to sync language to backend:", error);
            // If sync fails, fall back to user's saved preference
            if (userLang && userLang !== language) {
              setLanguageState(userLang);
            }
          }
        } else if (userLang && userLang !== language && !localStorageLang) {
          // User has a preference in DB but not in localStorage, use DB preference
          setLanguageState(userLang);
        }
      }
    };
    
    syncLanguage();
  }, [user?.id]); // Only run when user changes (login/logout)

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
