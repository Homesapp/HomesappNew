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
    "nav.favorites": "Favoritos",
    "nav.opportunities": "Oportunidades",
    "nav.appointments": "Citas",
    "nav.properties": "Mis Propiedades",
    "nav.appointmentsAdmin": "Gestión de Visitas",
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
    
    // Welcome Messages
    "welcome.client.title": "¡Bienvenido a HomesApp!",
    "welcome.client.subtitle": "Tu Panel Personal de Cliente",
    "welcome.client.description": "Este es tu espacio personal para gestionar todo lo relacionado con tu búsqueda de propiedades. Aquí podrás:",
    "welcome.client.feature1": "Explorar y guardar tus propiedades favoritas",
    "welcome.client.feature2": "Agendar citas para visitas presenciales o virtuales",
    "welcome.client.feature3": "Chatear directamente con propietarios y agentes",
    "welcome.client.feature4": "Gestionar tus oportunidades y ofertas",
    "welcome.client.dontShowAgain": "No volver a mostrar este mensaje",
    "welcome.client.button": "Comenzar a Explorar",
    "welcome.owner.title": "¡Bienvenido Propietario!",
    "welcome.owner.subtitle": "Tu Panel de Gestión de Propiedades",
    "welcome.owner.description": "Este es tu panel personal para gestionar todo lo que necesites de tu perfil y propiedades. Desde aquí podrás:",
    "welcome.owner.feature1": "Publicar y administrar tus propiedades",
    "welcome.owner.feature2": "Gestionar citas y visitas de potenciales clientes",
    "welcome.owner.feature3": "Conectar con proveedores de servicios confiables",
    "welcome.owner.feature4": "Ver reportes y estadísticas en tiempo real",
    "welcome.owner.dontShowAgain": "No volver a mostrar este mensaje",
    "welcome.owner.button": "Ir a Mi Panel",
    
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
    
    // Landing Page
    "landing.login": "Iniciar Sesión",
    "landing.register": "Registrarse",
    "landing.title": "HomesApp - Plataforma Completa de Gestión Inmobiliaria",
    "landing.subtitle": "Administra propiedades, coordina citas, gestiona clientes y servicios todo en un solo lugar",
    "landing.feature1.title": "Gestión de Propiedades",
    "landing.feature1.desc": "Administra tu portafolio completo con detalles, imágenes y estado",
    "landing.feature2.title": "Coordinación de Citas",
    "landing.feature2.desc": "Agenda visitas presenciales y videollamadas con Google Meet",
    "landing.feature3.title": "Multi-Rol",
    "landing.feature3.desc": "Sistema completo de roles para propietarios, vendedores y más",
    "landing.feature4.title": "Directorio de Servicios",
    "landing.feature4.desc": "Marketplace de proveedores para mantenimiento y servicios",
    "landing.createAccount": "Crear Cuenta Gratis",
    "landing.loginButton": "Iniciar Sesión",
    
    // Public Dashboard - Additional translations
    "public.searchPlaceholder": "Buscar por ubicación, colonia, condominio o descripción...",
    "public.searchButton": "Buscar",
    "public.filterPropertyType": "Tipo de Propiedad",
    "public.filterAllTypes": "Todos los tipos",
    "public.propertyType.house": "Casa",
    "public.propertyType.apartment": "Departamento",
    "public.propertyType.villa": "Villa",
    "public.propertyType.condo": "Condominio",
    "public.propertyType.penthouse": "Penthouse",
    "public.propertyType.studio": "Estudio",
    "public.propertyType.loft": "Loft",
    "public.propertyType.townhouse": "Casa adosada",
    "public.filterColony": "Colonia",
    "public.filterColonyPlaceholder": "Ej: La Veleta, Aldea Zama...",
    "public.filterCondo": "Condominio",
    "public.filterCondoPlaceholder": "Nombre del condominio...",
    "public.filterAllowsSubleasing": "Permite subarrendamiento",
    "public.clearFilters": "Limpiar filtros",
    
    // Owner Banner
    "public.ownerBanner.title": "¿Tienes una propiedad en Tulum?",
    "public.ownerBanner.subtitle": "Únete a nuestra plataforma y alcanza miles de clientes potenciales. Gestiona reservas, citas y mucho más desde un solo lugar.",
    "public.ownerBanner.benefit1": "Exposición a miles de clientes verificados",
    "public.ownerBanner.benefit2": "Herramientas de gestión profesionales",
    "public.ownerBanner.benefit3": "Sin comisiones ocultas",
    "public.ownerBanner.button": "Enlistar mi Propiedad",
    
    // Benefits Section
    "public.clientBenefits.title": "Para Clientes",
    "public.clientBenefits.subtitle": "Encuentra tu hogar perfecto en el paraíso",
    "public.clientBenefits.benefit1": "Acceso exclusivo a propiedades verificadas en Tulum",
    "public.clientBenefits.benefit2": "Agenda visitas virtuales o presenciales fácilmente",
    "public.clientBenefits.benefit3": "Chat directo con propietarios y agentes",
    "public.clientBenefits.benefit4": "Guarda tus favoritas y compáralas",
    "public.ownerBenefits.title": "Para Propietarios",
    "public.ownerBenefits.subtitle": "Maximiza el potencial de tu inversión",
    "public.ownerBenefits.benefit1": "Plataforma completa para gestionar tu propiedad",
    "public.ownerBenefits.benefit2": "Calendario integrado de citas y reservas",
    "public.ownerBenefits.benefit3": "Marketplace de proveedores de servicios confiables",
    "public.ownerBenefits.benefit4": "Reportes y análisis en tiempo real",
    
    // Service Provider Banner
    "public.serviceBanner.title": "¿Ofreces Servicios para Propiedades?",
    "public.serviceBanner.subtitle": "Únete a nuestra red de proveedores de servicios confiables. Conecta con propietarios que necesitan tus servicios profesionales.",
    "public.serviceBanner.benefit1": "Limpieza, mantenimiento, jardinería y más",
    "public.serviceBanner.benefit2": "Crea tu perfil profesional verificado",
    "public.serviceBanner.benefit3": "Recibe solicitudes de trabajo directamente",
    "public.serviceBanner.button": "Unirme como Proveedor",
    
    // Affiliate Banner
    "public.affiliateBanner.title": "Programa de Afiliados",
    "public.affiliateBanner.subtitle": "Gana comisiones recomendando propiedades. Únete a nuestro programa de afiliados y obtén ingresos pasivos por cada cliente que traigas.",
    "public.affiliateBanner.benefit1": "Comisiones competitivas por referencia",
    "public.affiliateBanner.benefit2": "Materiales de marketing profesionales",
    "public.affiliateBanner.benefit3": "Panel de seguimiento en tiempo real",
    "public.affiliateBanner.benefit4": "Soporte dedicado y capacitación continua",
    "public.affiliateBanner.button": "Convertirme en Afiliado",
    "public.affiliateBanner.imgAlt": "Programa de afiliados",
    
    // Property Card
    "property.status.rent": "En Renta",
    "property.status.sale": "En Venta",
    "property.status.both": "Renta y Venta",
    "property.perMonth": "/mes",
    "property.saleLabel": "Venta:",
    "property.viewButton": "Ver",
    "property.editButton": "Editar",
    "property.deleteButton": "Eliminar",
    "property.scheduleButton": "Agendar",
    
    // Property Display
    "property.bedrooms": "hab",
    "property.bathrooms": "baños",
    "property.area": "m²",
    
    // Image Alt Text
    "public.ownerBanner.imgAlt": "Lista tu propiedad en Tulum",
    "public.serviceBanner.imgAlt": "Proveedores de servicios",
    
    // Referrals
    "referrals.title": "Red de Referidos",
    "referrals.description": "Recomienda clientes y propietarios y gana comisiones",
    "referrals.totalReferrals": "Total de Referidos",
    "referrals.completedReferrals": "Referidos Completados",
    "referrals.totalEarnings": "Comisiones Ganadas",
    "referrals.clients": "clientes",
    "referrals.owners": "propietarios",
    "referrals.clientReferrals": "Referidos de Clientes",
    "referrals.ownerReferrals": "Referidos de Propietarios",
    "referrals.clientReferralsDesc": "Recomienda personas que buscan rentar propiedades",
    "referrals.ownerReferralsDesc": "Recomienda personas con propiedades para rentar",
    "referrals.addClientReferral": "Agregar Referido de Cliente",
    "referrals.addOwnerReferral": "Agregar Referido de Propietario",
    "referrals.addClientReferralDesc": "Recomienda una persona que busca rentar una propiedad",
    "referrals.addOwnerReferralDesc": "Recomienda una persona con propiedades para rentar",
    "referrals.noClientReferrals": "No tienes referidos de clientes aún",
    "referrals.noOwnerReferrals": "No tienes referidos de propietarios aún",
    "referrals.createdOn": "Creado el",
    "referrals.commissionEarned": "Comisión ganada",
    "referrals.clientReferralCreated": "Referido de cliente creado",
    "referrals.clientReferralCreatedDesc": "El referido ha sido creado exitosamente",
    "referrals.ownerReferralCreated": "Referido de propietario creado",
    "referrals.ownerReferralCreatedDesc": "El referido ha sido creado exitosamente",
    "referrals.createError": "No se pudo crear el referido",
    "referrals.loadError": "No se pudo cargar la información de referidos. Por favor, intenta de nuevo.",
    "referrals.whatsapp": "WhatsApp",
    "referrals.nationality": "Nacionalidad",
    "referrals.propertyType": "Tipo de Propiedad",
    "referrals.selectPropertyType": "Selecciona tipo",
    "referrals.condoName": "Nombre del Condominio",
    "referrals.unitNumber": "Número de Unidad",
    "referrals.unit": "Unidad",
    "common.firstName": "Nombre",
    "common.lastName": "Apellido",
    "common.email": "Correo electrónico",
    "common.phone": "Teléfono",
    "common.create": "Crear",
    "common.creating": "Creando...",
    "propertyTypes.house": "Casa",
    "propertyTypes.apartment": "Departamento",
    "propertyTypes.condo": "Condominio",
    "propertyTypes.villa": "Villa",
    "propertyTypes.studio": "Estudio",
    "propertyTypes.penthouse": "Penthouse",
    
    // Presentation Cards
    "presentationCard.deleteDialogTitle": "¿Eliminar tarjeta?",
    "presentationCard.deleteDialogDesc": "Esta acción no se puede deshacer. La tarjeta de presentación será eliminada permanentemente.",
    "presentationCard.deleteDialogCancel": "Cancelar",
    "presentationCard.deleteDialogConfirm": "Eliminar",
    "presentationCard.active": "Activa",
    "presentationCard.activate": "Activar",
    "presentationCard.deactivate": "Desactivar",
    "presentationCard.edit": "Editar",
    "presentationCard.delete": "Eliminar",
    "presentationCard.viewMatches": "Ver Coincidencias",
    "presentationCard.bedrooms": "recámaras",
    "presentationCard.bathrooms": "baños",
    "presentationCard.amenities": "Amenidades:",
    "presentationCard.match": "coincidencia",
    "presentationCard.matches": "coincidencias",
    "presentationCard.rent": "Renta",
    "presentationCard.sale": "Venta",
    "presentationCard.rentOrSale": "Renta o Venta",
    "presentationCard.title": "Tarjeta de Presentación",
    
    // Role Switching
    "role.owner": "Propietario",
    "role.client": "Cliente",
    "role.switchMode": "Cambiar modo",
    "role.ownerDesc": "Gestiona tus propiedades",
    "role.clientDesc": "Busca y renta propiedades",
    "role.updated": "Rol actualizado",
    "role.updatedDesc": "Tu rol ha sido cambiado exitosamente",
    "role.updateError": "No se pudo cambiar el rol",
    
    // Help & Tutorials
    "help.title": "Ayuda",
    "help.dialog.title": "HomesApp - Ayuda y Guías",
    "help.dialog.subtitle": "Información sobre la aplicación y tutoriales de uso",
    "help.about.title": "Acerca de HomesApp",
    "help.about.desc": "HomesApp es una plataforma integral de gestión inmobiliaria diseñada para facilitar la administración de propiedades, citas, ofertas y comunicación entre propietarios, clientes y personal de la agencia.",
    "help.tutorials.title": "Tutoriales Paso a Paso",
    "help.tutorials.search.title": "Buscar Propiedades",
    "help.tutorials.search.step1": "Ve a la sección 'Buscar Propiedades' desde el menú lateral",
    "help.tutorials.search.step2": "Usa los filtros para refinar tu búsqueda (precio, habitaciones, ubicación, etc.)",
    "help.tutorials.search.step3": "Explora las tarjetas de propiedades y haz clic en 'Ver' para ver detalles completos",
    "help.tutorials.search.step4": "Guarda tus propiedades favoritas haciendo clic en el ícono de corazón",
    "help.tutorials.appointments.title": "Agendar una Cita",
    "help.tutorials.appointments.step1": "Desde los detalles de una propiedad, haz clic en 'Agendar Cita'",
    "help.tutorials.appointments.step2": "Selecciona el tipo de cita (presencial o videollamada)",
    "help.tutorials.appointments.step3": "Elige fecha y hora disponible en el calendario",
    "help.tutorials.appointments.step4": "Confirma tu cita - recibirás una confirmación por email",
    "help.tutorials.favorites.title": "Gestionar Favoritos",
    "help.tutorials.favorites.step1": "Haz clic en el ícono de corazón en cualquier propiedad para guardarla",
    "help.tutorials.favorites.step2": "Accede a todas tus propiedades guardadas desde 'Favoritos' en el menú",
    "help.tutorials.favorites.step3": "Compara propiedades y elimina las que ya no te interesan",
    "help.tutorials.cards.title": "Crear Tarjeta de Presentación",
    "help.tutorials.cards.step1": "Ve a la sección 'Tarjetas' en el menú lateral",
    "help.tutorials.cards.step2": "Haz clic en 'Nueva Tarjeta' y completa tus preferencias",
    "help.tutorials.cards.step3": "Especifica presupuesto, número de habitaciones, ubicación deseada, etc.",
    "help.tutorials.cards.step4": "El sistema te mostrará automáticamente propiedades que coincidan con tu perfil",
    "help.tutorials.chat.title": "Usar el Chat",
    "help.tutorials.chat.step1": "Ve a 'Mensajes' en el menú lateral",
    "help.tutorials.chat.step2": "Selecciona una conversación existente o inicia una nueva",
    "help.tutorials.chat.step3": "Comunícate en tiempo real con propietarios, agentes o clientes",
    "help.tutorials.owner.title": "Gestión de Propiedades (Propietario)",
    "help.tutorials.owner.step1": "Publica nuevas propiedades desde 'Cargar Propiedad'",
    "help.tutorials.owner.step2": "Gestiona citas pendientes en 'Gestión de Visitas'",
    "help.tutorials.owner.step3": "Actualiza información de tus propiedades desde 'Mis Propiedades'",
    "help.tutorials.owner.step4": "Configura auto-aprobación de citas en tu perfil",
    "help.tutorials.admin.title": "Funciones de Administrador",
    "help.tutorials.admin.step1": "Aprueba o rechaza propiedades nuevas desde 'Propiedades'",
    "help.tutorials.admin.step2": "Gestiona usuarios y asigna roles desde 'Gestión Usuarios'",
    "help.tutorials.admin.step3": "Revisa solicitudes de cambio en propiedades",
    "help.tutorials.admin.step4": "Accede al Dashboard Admin para ver métricas y estadísticas",
    "help.features.title": "Características Principales",
    "help.features.item1": "Sistema de roles con permisos personalizados",
    "help.features.item2": "Chat en tiempo real entre usuarios",
    "help.features.item3": "Gestión de citas con integración de Google Calendar",
    "help.features.item4": "Sistema de ofertas y contrafertas",
    "help.features.item5": "Kanban para leads y rentas",
    "help.features.item6": "Presupuestos y gestión de servicios",
    "help.features.item7": "Sistema de notificaciones y reviews personalizable",
    "help.support.title": "Soporte",
    "help.support.desc": "¿Necesitas ayuda adicional? Contacta al equipo de soporte a través del sistema de mensajes o comunícate con tu administrador.",
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
    "nav.favorites": "Favorites",
    "nav.opportunities": "Opportunities",
    "nav.appointments": "Appointments",
    "nav.properties": "My Properties",
    "nav.appointmentsAdmin": "Appointments Management",
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
    
    // Welcome Messages
    "welcome.client.title": "Welcome to HomesApp!",
    "welcome.client.subtitle": "Your Personal Client Dashboard",
    "welcome.client.description": "This is your personal space to manage everything related to your property search. Here you can:",
    "welcome.client.feature1": "Explore and save your favorite properties",
    "welcome.client.feature2": "Schedule in-person or virtual visits",
    "welcome.client.feature3": "Chat directly with owners and agents",
    "welcome.client.feature4": "Manage your opportunities and offers",
    "welcome.client.dontShowAgain": "Don't show this message again",
    "welcome.client.button": "Start Exploring",
    "welcome.owner.title": "Welcome Property Owner!",
    "welcome.owner.subtitle": "Your Property Management Dashboard",
    "welcome.owner.description": "This is your personal dashboard to manage everything you need for your profile and properties. From here you can:",
    "welcome.owner.feature1": "Publish and manage your properties",
    "welcome.owner.feature2": "Manage appointments and client visits",
    "welcome.owner.feature3": "Connect with reliable service providers",
    "welcome.owner.feature4": "View reports and real-time analytics",
    "welcome.owner.dontShowAgain": "Don't show this message again",
    "welcome.owner.button": "Go to Dashboard",
    
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
    
    // Landing Page
    "landing.login": "Login",
    "landing.register": "Register",
    "landing.title": "HomesApp - Complete Real Estate Management Platform",
    "landing.subtitle": "Manage properties, coordinate appointments, manage clients and services all in one place",
    "landing.feature1.title": "Property Management",
    "landing.feature1.desc": "Manage your complete portfolio with details, images and status",
    "landing.feature2.title": "Appointment Coordination",
    "landing.feature2.desc": "Schedule in-person visits and video calls with Google Meet",
    "landing.feature3.title": "Multi-Role",
    "landing.feature3.desc": "Complete role system for owners, sellers and more",
    "landing.feature4.title": "Service Directory",
    "landing.feature4.desc": "Marketplace of providers for maintenance and services",
    "landing.createAccount": "Create Free Account",
    "landing.loginButton": "Login",
    
    // Public Dashboard - Additional translations
    "public.searchPlaceholder": "Search by location, colony, condominium or description...",
    "public.searchButton": "Search",
    "public.filterPropertyType": "Property Type",
    "public.filterAllTypes": "All types",
    "public.propertyType.house": "House",
    "public.propertyType.apartment": "Apartment",
    "public.propertyType.villa": "Villa",
    "public.propertyType.condo": "Condo",
    "public.propertyType.penthouse": "Penthouse",
    "public.propertyType.studio": "Studio",
    "public.propertyType.loft": "Loft",
    "public.propertyType.townhouse": "Townhouse",
    "public.filterColony": "Colony",
    "public.filterColonyPlaceholder": "E.g.: La Veleta, Aldea Zama...",
    "public.filterCondo": "Condominium",
    "public.filterCondoPlaceholder": "Condominium name...",
    "public.filterAllowsSubleasing": "Allows subleasing",
    "public.clearFilters": "Clear filters",
    
    // Owner Banner
    "public.ownerBanner.title": "Do you have a property in Tulum?",
    "public.ownerBanner.subtitle": "Join our platform and reach thousands of potential clients. Manage bookings, appointments and much more from one place.",
    "public.ownerBanner.benefit1": "Exposure to thousands of verified clients",
    "public.ownerBanner.benefit2": "Professional management tools",
    "public.ownerBanner.benefit3": "No hidden commissions",
    "public.ownerBanner.button": "List my Property",
    
    // Benefits Section
    "public.clientBenefits.title": "For Clients",
    "public.clientBenefits.subtitle": "Find your perfect home in paradise",
    "public.clientBenefits.benefit1": "Exclusive access to verified properties in Tulum",
    "public.clientBenefits.benefit2": "Schedule virtual or in-person visits easily",
    "public.clientBenefits.benefit3": "Direct chat with owners and agents",
    "public.clientBenefits.benefit4": "Save your favorites and compare them",
    "public.ownerBenefits.title": "For Owners",
    "public.ownerBenefits.subtitle": "Maximize your investment potential",
    "public.ownerBenefits.benefit1": "Complete platform to manage your property",
    "public.ownerBenefits.benefit2": "Integrated calendar of appointments and bookings",
    "public.ownerBenefits.benefit3": "Marketplace of reliable service providers",
    "public.ownerBenefits.benefit4": "Real-time reports and analytics",
    
    // Service Provider Banner
    "public.serviceBanner.title": "Do you offer Property Services?",
    "public.serviceBanner.subtitle": "Join our network of trusted service providers. Connect with property owners who need your professional services.",
    "public.serviceBanner.benefit1": "Cleaning, maintenance, gardening and more",
    "public.serviceBanner.benefit2": "Create your verified professional profile",
    "public.serviceBanner.benefit3": "Receive work requests directly",
    "public.serviceBanner.button": "Join as a Provider",
    
    // Affiliate Banner
    "public.affiliateBanner.title": "Affiliate Program",
    "public.affiliateBanner.subtitle": "Earn commissions recommending properties. Join our affiliate program and get passive income for every client you bring.",
    "public.affiliateBanner.benefit1": "Competitive referral commissions",
    "public.affiliateBanner.benefit2": "Professional marketing materials",
    "public.affiliateBanner.benefit3": "Real-time tracking dashboard",
    "public.affiliateBanner.benefit4": "Dedicated support and ongoing training",
    "public.affiliateBanner.button": "Become an Affiliate",
    "public.affiliateBanner.imgAlt": "Affiliate program",
    
    // Property Card
    "property.status.rent": "For Rent",
    "property.status.sale": "For Sale",
    "property.status.both": "Rent and Sale",
    "property.perMonth": "/month",
    "property.saleLabel": "Sale:",
    "property.viewButton": "View",
    "property.editButton": "Edit",
    "property.deleteButton": "Delete",
    "property.scheduleButton": "Schedule",
    
    // Property Display
    "property.bedrooms": "bed",
    "property.bathrooms": "bath",
    "property.area": "m²",
    
    // Image Alt Text
    "public.ownerBanner.imgAlt": "List your property in Tulum",
    "public.serviceBanner.imgAlt": "Service providers",
    
    // Referrals
    "referrals.title": "Referral Network",
    "referrals.description": "Refer clients and property owners and earn commissions",
    "referrals.totalReferrals": "Total Referrals",
    "referrals.completedReferrals": "Completed Referrals",
    "referrals.totalEarnings": "Earned Commissions",
    "referrals.clients": "clients",
    "referrals.owners": "property owners",
    "referrals.clientReferrals": "Client Referrals",
    "referrals.ownerReferrals": "Property Owner Referrals",
    "referrals.clientReferralsDesc": "Refer people looking to rent properties",
    "referrals.ownerReferralsDesc": "Refer people with properties to rent",
    "referrals.addClientReferral": "Add Client Referral",
    "referrals.addOwnerReferral": "Add Property Owner Referral",
    "referrals.addClientReferralDesc": "Refer someone looking to rent a property",
    "referrals.addOwnerReferralDesc": "Refer someone with properties to rent",
    "referrals.noClientReferrals": "You don't have any client referrals yet",
    "referrals.noOwnerReferrals": "You don't have any property owner referrals yet",
    "referrals.createdOn": "Created on",
    "referrals.commissionEarned": "Commission earned",
    "referrals.clientReferralCreated": "Client referral created",
    "referrals.clientReferralCreatedDesc": "The referral has been created successfully",
    "referrals.ownerReferralCreated": "Property owner referral created",
    "referrals.ownerReferralCreatedDesc": "The referral has been created successfully",
    "referrals.createError": "Could not create referral",
    "referrals.loadError": "Could not load referrals information. Please try again.",
    "referrals.whatsapp": "WhatsApp",
    "referrals.nationality": "Nationality",
    "referrals.propertyType": "Property Type",
    "referrals.selectPropertyType": "Select type",
    "referrals.condoName": "Condominium Name",
    "referrals.unitNumber": "Unit Number",
    "referrals.unit": "Unit",
    "common.firstName": "First Name",
    "common.lastName": "Last Name",
    "common.email": "Email",
    "common.phone": "Phone",
    "common.create": "Create",
    "common.creating": "Creating...",
    "propertyTypes.house": "House",
    "propertyTypes.apartment": "Apartment",
    "propertyTypes.condo": "Condominium",
    "propertyTypes.villa": "Villa",
    "propertyTypes.studio": "Studio",
    "propertyTypes.penthouse": "Penthouse",
    
    // Presentation Cards
    "presentationCard.deleteDialogTitle": "Delete card?",
    "presentationCard.deleteDialogDesc": "This action cannot be undone. The presentation card will be permanently deleted.",
    "presentationCard.deleteDialogCancel": "Cancel",
    "presentationCard.deleteDialogConfirm": "Delete",
    "presentationCard.active": "Active",
    "presentationCard.activate": "Activate",
    "presentationCard.deactivate": "Deactivate",
    "presentationCard.edit": "Edit",
    "presentationCard.delete": "Delete",
    "presentationCard.viewMatches": "View Matches",
    "presentationCard.bedrooms": "bedrooms",
    "presentationCard.bathrooms": "bathrooms",
    "presentationCard.amenities": "Amenities:",
    "presentationCard.match": "match",
    "presentationCard.matches": "matches",
    "presentationCard.rent": "Rent",
    "presentationCard.sale": "Sale",
    "presentationCard.rentOrSale": "Rent or Sale",
    "presentationCard.title": "Presentation Card",
    
    // Role Switching
    "role.owner": "Owner",
    "role.client": "Client",
    "role.switchMode": "Switch mode",
    "role.ownerDesc": "Manage your properties",
    "role.clientDesc": "Search and rent properties",
    "role.updated": "Role updated",
    "role.updatedDesc": "Your role has been changed successfully",
    "role.updateError": "Could not change role",
    
    // Help & Tutorials
    "help.title": "Help",
    "help.dialog.title": "HomesApp - Help & Guides",
    "help.dialog.subtitle": "Application information and usage tutorials",
    "help.about.title": "About HomesApp",
    "help.about.desc": "HomesApp is a comprehensive real estate management platform designed to facilitate property management, appointments, offers, and communication between owners, clients, and agency staff.",
    "help.tutorials.title": "Step-by-Step Tutorials",
    "help.tutorials.search.title": "Search for Properties",
    "help.tutorials.search.step1": "Go to the 'Search Properties' section from the sidebar menu",
    "help.tutorials.search.step2": "Use filters to refine your search (price, bedrooms, location, etc.)",
    "help.tutorials.search.step3": "Browse property cards and click 'View' to see full details",
    "help.tutorials.search.step4": "Save your favorite properties by clicking the heart icon",
    "help.tutorials.appointments.title": "Schedule an Appointment",
    "help.tutorials.appointments.step1": "From a property's details, click 'Schedule Appointment'",
    "help.tutorials.appointments.step2": "Select appointment type (in-person or video call)",
    "help.tutorials.appointments.step3": "Choose an available date and time from the calendar",
    "help.tutorials.appointments.step4": "Confirm your appointment - you'll receive an email confirmation",
    "help.tutorials.favorites.title": "Manage Favorites",
    "help.tutorials.favorites.step1": "Click the heart icon on any property to save it",
    "help.tutorials.favorites.step2": "Access all your saved properties from 'Favorites' in the menu",
    "help.tutorials.favorites.step3": "Compare properties and remove ones you're no longer interested in",
    "help.tutorials.cards.title": "Create Presentation Card",
    "help.tutorials.cards.step1": "Go to the 'Cards' section in the sidebar menu",
    "help.tutorials.cards.step2": "Click 'New Card' and complete your preferences",
    "help.tutorials.cards.step3": "Specify budget, number of bedrooms, desired location, etc.",
    "help.tutorials.cards.step4": "The system will automatically show you properties matching your profile",
    "help.tutorials.chat.title": "Use Chat",
    "help.tutorials.chat.step1": "Go to 'Messages' in the sidebar menu",
    "help.tutorials.chat.step2": "Select an existing conversation or start a new one",
    "help.tutorials.chat.step3": "Communicate in real-time with owners, agents, or clients",
    "help.tutorials.owner.title": "Property Management (Owner)",
    "help.tutorials.owner.step1": "List new properties from 'Upload Property'",
    "help.tutorials.owner.step2": "Manage pending appointments in 'Visit Management'",
    "help.tutorials.owner.step3": "Update your property information from 'My Properties'",
    "help.tutorials.owner.step4": "Configure auto-approval of appointments in your profile",
    "help.tutorials.admin.title": "Administrator Functions",
    "help.tutorials.admin.step1": "Approve or reject new properties from 'Properties'",
    "help.tutorials.admin.step2": "Manage users and assign roles from 'User Management'",
    "help.tutorials.admin.step3": "Review property change requests",
    "help.tutorials.admin.step4": "Access the Admin Dashboard to view metrics and statistics",
    "help.features.title": "Main Features",
    "help.features.item1": "Role-based system with custom permissions",
    "help.features.item2": "Real-time chat between users",
    "help.features.item3": "Appointment management with Google Calendar integration",
    "help.features.item4": "Offer and counteroffer system",
    "help.features.item5": "Kanban for leads and rentals",
    "help.features.item6": "Budget and service management",
    "help.features.item7": "Customizable notification and review system",
    "help.support.title": "Support",
    "help.support.desc": "Need additional help? Contact the support team through the messaging system or reach out to your administrator.",
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

  // Effect 1: Initial sync on login - prefer localStorage over user profile
  useEffect(() => {
    if (!user) return;
    
    const localStorageLang = localStorage.getItem("language") as Language;
    const userLang = user.preferredLanguage as Language;
    
    // Always prefer localStorage language (user's choice from before login)
    if (localStorageLang) {
      // Set UI to localStorage value
      if (localStorageLang !== language) {
        setLanguageState(localStorageLang);
      }
      // Sync backend if it differs
      if (localStorageLang !== userLang) {
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredLanguage: localStorageLang }),
        }).catch((error) => {
          console.error("Failed to sync language to backend on login:", error);
        });
      }
    } else if (userLang && userLang !== language) {
      // No localStorage: use user's profile preference
      setLanguageState(userLang);
    }
  }, [user?.id]); // Only run on login/logout
  
  // Effect 2: Update backend when authenticated user manually changes language
  useEffect(() => {
    if (!user) return;
    
    const userLang = user.preferredLanguage as Language;
    
    // If language changed and differs from backend, update backend
    if (language && language !== userLang) {
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: language }),
      }).catch((error) => {
        console.error("Failed to update language preference:", error);
      });
    }
  }, [language, user?.id]); // Run when language changes or user logs in
  
  // Effect 3: Save language to localStorage
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
