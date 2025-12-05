import { 
  Search, Calendar, Users, Building2, FileText, DollarSign, 
  ClipboardList, Settings, MessageCircle, Heart, Star,
  Home, Shield, Headphones, BarChart3, Wrench, Key,
  CheckCircle2, ArrowRight, Target, UserCheck, Scale,
  Upload, Eye, Phone, Mail
} from "lucide-react";

export type RoleType = 
  | "seller" 
  | "broker" 
  | "owner" 
  | "tenant" 
  | "admin"
  | "external_agency_admin"
  | "external_agency_seller";

export interface HelpStep {
  title: string;
  description: string;
}

export interface HelpFaq {
  question: string;
  answer: string;
}

export interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  icon: any;
}

export interface HelpSection {
  title: string;
  description: string;
  icon: any;
  steps?: HelpStep[];
}

export interface RoleHelpContent {
  roleTitle: string;
  roleDescription: string;
  whatCanIDo: string[];
  firstSteps: HelpStep[];
  workflow: WorkflowStep[];
  sections: HelpSection[];
  faqs: HelpFaq[];
}

export const helpContent: Record<RoleType, RoleHelpContent> = {
  seller: {
    roleTitle: "Vendedor / Agente TRH",
    roleDescription: "Como vendedor o agente de TRH, tu rol principal es conectar clientes con propiedades, gestionar leads y cerrar rentas o ventas exitosamente.",
    whatCanIDo: [
      "Gestionar y dar seguimiento a leads de clientes potenciales",
      "Buscar propiedades que coincidan con las necesidades de tus clientes",
      "Agendar y coordinar visitas a propiedades",
      "Crear y gestionar ofertas de renta o venta",
      "Ver tu pipeline de rentas en vista Kanban",
      "Consultar tus comisiones e ingresos",
      "Compartir propiedades por WhatsApp a tus leads",
      "Acceder al chat de equipo con otros vendedores"
    ],
    firstSteps: [
      {
        title: "Revisa tus leads asignados",
        description: "Ve a la sección de Leads para ver los clientes potenciales que te han asignado o que has capturado."
      },
      {
        title: "Explora el catálogo de propiedades",
        description: "Familiarízate con las propiedades disponibles para poder recomendar las mejores opciones a tus clientes."
      },
      {
        title: "Configura tu perfil",
        description: "Asegúrate de tener tu foto de perfil y datos de contacto actualizados para generar confianza."
      },
      {
        title: "Conoce el tablero Kanban",
        description: "El tablero Kanban te ayuda a visualizar en qué etapa está cada proceso de renta."
      },
      {
        title: "Revisa el chat de equipo",
        description: "Mantente conectado con otros vendedores para compartir tips y actualizaciones."
      }
    ],
    workflow: [
      { step: 1, title: "Recibir Lead", description: "Un nuevo lead llega por registro, chatbot o asignación manual", icon: Users },
      { step: 2, title: "Contactar Cliente", description: "Llama o envía WhatsApp para entender sus necesidades", icon: Phone },
      { step: 3, title: "Buscar Propiedades", description: "Encuentra opciones que coincidan con su búsqueda", icon: Search },
      { step: 4, title: "Agendar Visitas", description: "Coordina citas para mostrar las propiedades", icon: Calendar },
      { step: 5, title: "Crear Oferta", description: "Genera una oferta formal cuando el cliente esté interesado", icon: FileText },
      { step: 6, title: "Cerrar Contrato", description: "Formaliza el contrato y cobra tu comisión", icon: CheckCircle2 }
    ],
    sections: [
      {
        title: "Gestión de Leads",
        description: "Aprende a gestionar tus leads de manera efectiva",
        icon: Users,
        steps: [
          { title: "Vista Kanban", description: "Arrastra y suelta leads entre columnas para cambiar su estado (Nuevo, Contactado, Calificado, etc.)" },
          { title: "Detalles del Lead", description: "Haz clic en un lead para ver su historial de actividad, notas y propiedades enviadas" },
          { title: "Registrar Actividad", description: "Añade llamadas, emails, reuniones y notas para mantener un historial completo" }
        ]
      },
      {
        title: "Catálogo de Propiedades",
        description: "Cómo usar el catálogo para encontrar la propiedad ideal",
        icon: Building2,
        steps: [
          { title: "Filtros Avanzados", description: "Usa los filtros para buscar por zona, precio, recámaras, amenidades y más" },
          { title: "Compartir por WhatsApp", description: "Selecciona un lead y envía propiedades directamente a su WhatsApp" },
          { title: "Favoritos", description: "Marca propiedades como favoritas para acceder rápidamente a ellas" }
        ]
      },
      {
        title: "Pipeline de Rentas",
        description: "Visualiza y gestiona tus procesos de renta",
        icon: ClipboardList,
        steps: [
          { title: "Estados del Pipeline", description: "Las rentas pasan por: Prospección → Documentación → Revisión → Firma → Activo" },
          { title: "Mover Tarjetas", description: "Arrastra las tarjetas entre columnas para actualizar el estado" },
          { title: "Ver Detalles", description: "Haz clic en una tarjeta para ver documentos, pagos y más información" }
        ]
      },
      {
        title: "Mis Comisiones",
        description: "Consulta tus ingresos y comisiones pendientes",
        icon: DollarSign,
        steps: [
          { title: "Comisiones Pendientes", description: "Ve las comisiones que aún no se han pagado" },
          { title: "Historial de Pagos", description: "Consulta el historial de pagos recibidos" },
          { title: "Proyecciones", description: "Ve cuánto puedes ganar con los deals en proceso" }
        ]
      }
    ],
    faqs: [
      { question: "¿Cómo me asignan nuevos leads?", answer: "Los leads se asignan automáticamente según disponibilidad y zona, o manualmente por un administrador. Recibirás una notificación cuando tengas un nuevo lead." },
      { question: "¿Puedo ver propiedades de otras agencias?", answer: "Sí, en el catálogo puedes ver propiedades compartidas de la red TRH. Estas tienen comisiones compartidas según los acuerdos de referidos." },
      { question: "¿Cuándo se pagan mis comisiones?", answer: "Las comisiones se pagan después de que el contrato esté firmado y el primer pago del inquilino se haya procesado, generalmente dentro de los primeros 15 días del mes siguiente." },
      { question: "¿Cómo registro una llamada o actividad?", answer: "Entra al detalle del lead, haz clic en 'Agregar Actividad' y selecciona el tipo (llamada, email, reunión, WhatsApp, etc.)." },
      { question: "¿Qué hago si un lead no responde?", answer: "Intenta contactarlo por diferentes canales. Si después de 3 intentos no hay respuesta, puedes moverlo a 'Perdido' con una nota explicando la situación." }
    ]
  },
  broker: {
    roleTitle: "Admin de Agencia Externa (Broker)",
    roleDescription: "Como administrador de agencia externa, gestionas tu equipo de vendedores, propiedades y la operación general de tu agencia dentro de la plataforma.",
    whatCanIDo: [
      "Gestionar usuarios y vendedores de tu agencia",
      "Administrar el catálogo de propiedades de tu agencia",
      "Ver reportes de actividad y desempeño del equipo",
      "Configurar comisiones y estructura de pagos",
      "Gestionar leads y su asignación a vendedores",
      "Acceder a contratos y documentos de rentas",
      "Configurar integraciones y automatizaciones",
      "Ver el dashboard financiero de la agencia"
    ],
    firstSteps: [
      {
        title: "Configura tu agencia",
        description: "Ve a Configuración para establecer el nombre, logo y datos de contacto de tu agencia."
      },
      {
        title: "Invita a tu equipo",
        description: "Agrega vendedores y asigna roles desde la sección de Usuarios."
      },
      {
        title: "Carga tus propiedades",
        description: "Añade las propiedades que tu agencia administra al catálogo."
      },
      {
        title: "Configura comisiones",
        description: "Establece la estructura de comisiones para tu equipo."
      },
      {
        title: "Revisa el dashboard",
        description: "Familiarízate con las métricas y reportes disponibles."
      }
    ],
    workflow: [
      { step: 1, title: "Configurar Agencia", description: "Establece la identidad y configuración de tu agencia", icon: Settings },
      { step: 2, title: "Cargar Propiedades", description: "Añade las propiedades al catálogo con fotos y detalles", icon: Upload },
      { step: 3, title: "Gestionar Equipo", description: "Invita vendedores y asigna permisos", icon: Users },
      { step: 4, title: "Asignar Leads", description: "Distribuye leads entre tu equipo de vendedores", icon: Target },
      { step: 5, title: "Supervisar Operación", description: "Monitorea el progreso y desempeño del equipo", icon: BarChart3 },
      { step: 6, title: "Revisar Finanzas", description: "Consulta ingresos, comisiones y pagos", icon: DollarSign }
    ],
    sections: [
      {
        title: "Gestión de Usuarios",
        description: "Administra tu equipo de vendedores",
        icon: Users,
        steps: [
          { title: "Invitar Usuario", description: "Usa el botón 'Agregar Usuario' e ingresa el email del vendedor" },
          { title: "Asignar Rol", description: "Elige entre vendedor, asistente, contador u otros roles" },
          { title: "Gestionar Permisos", description: "Configura qué secciones puede ver cada usuario" }
        ]
      },
      {
        title: "Catálogo de Propiedades",
        description: "Gestiona las propiedades de tu agencia",
        icon: Building2,
        steps: [
          { title: "Agregar Propiedad", description: "Completa el wizard con información, fotos y amenidades" },
          { title: "Editar Propiedades", description: "Actualiza precios, disponibilidad y detalles" },
          { title: "Estados de Publicación", description: "Controla qué propiedades están visibles al público" }
        ]
      },
      {
        title: "Dashboard y Reportes",
        description: "Monitorea el desempeño de tu agencia",
        icon: BarChart3,
        steps: [
          { title: "KPIs Principales", description: "Ve leads, citas, rentas cerradas y ocupación" },
          { title: "Desempeño por Vendedor", description: "Compara métricas entre miembros del equipo" },
          { title: "Exportar Reportes", description: "Descarga reportes en Excel o PDF" }
        ]
      },
      {
        title: "Configuración",
        description: "Personaliza la operación de tu agencia",
        icon: Settings,
        steps: [
          { title: "Datos de la Agencia", description: "Logo, nombre, dirección y datos fiscales" },
          { title: "Comisiones", description: "Estructura de comisiones por tipo de operación" },
          { title: "Integraciones", description: "Conecta con Google Calendar, email y otras herramientas" }
        ]
      }
    ],
    faqs: [
      { question: "¿Cuántos usuarios puedo agregar?", answer: "El límite depende de tu plan. Puedes ver el límite actual en Configuración > Plan." },
      { question: "¿Puedo ver las conversaciones de mis vendedores?", answer: "Sí, como admin puedes acceder al historial de actividad de cada lead para supervisar la comunicación." },
      { question: "¿Cómo configuro las comisiones?", answer: "Ve a Configuración > Comisiones y establece porcentajes por tipo de operación (renta larga, renta corta, venta)." },
      { question: "¿Puedo integrar mi calendario de Google?", answer: "Sí, en Configuración > Integraciones puedes conectar Google Calendar para sincronizar citas." },
      { question: "¿Cómo reasigno un lead a otro vendedor?", answer: "Entra al detalle del lead, haz clic en 'Cambiar Asignación' y selecciona el nuevo vendedor." }
    ]
  },
  owner: {
    roleTitle: "Propietario (Portal Owner)",
    roleDescription: "Como propietario, tienes acceso completo a la información de tus propiedades, contratos activos, pagos y documentos a través de tu portal personalizado.",
    whatCanIDo: [
      "Ver el estado de todas tus propiedades",
      "Consultar contratos activos y su historial",
      "Ver reportes de pagos e ingresos",
      "Descargar documentos y comprobantes",
      "Aprobar o rechazar visitas a tus propiedades",
      "Comunicarte con el equipo de administración",
      "Ver el calendario de disponibilidad",
      "Solicitar servicios de mantenimiento"
    ],
    firstSteps: [
      {
        title: "Explora tu dashboard",
        description: "El dashboard muestra un resumen de todas tus propiedades, ocupación y próximos pagos."
      },
      {
        title: "Revisa tus propiedades",
        description: "Ve el estado de cada propiedad: disponible, ocupada o en proceso de renta."
      },
      {
        title: "Configura notificaciones",
        description: "Elige cómo quieres recibir actualizaciones sobre tus propiedades."
      },
      {
        title: "Conoce el calendario",
        description: "El calendario te muestra citas programadas y disponibilidad."
      }
    ],
    workflow: [
      { step: 1, title: "Revisar Dashboard", description: "Ve el resumen de tus propiedades y métricas", icon: Home },
      { step: 2, title: "Ver Propiedades", description: "Consulta el estado de cada unidad", icon: Building2 },
      { step: 3, title: "Gestionar Citas", description: "Aprueba o rechaza solicitudes de visita", icon: Calendar },
      { step: 4, title: "Revisar Contratos", description: "Consulta contratos activos y documentos", icon: FileText },
      { step: 5, title: "Ver Finanzas", description: "Revisa pagos recibidos y pendientes", icon: DollarSign },
      { step: 6, title: "Solicitar Servicios", description: "Pide mantenimiento o servicios adicionales", icon: Wrench }
    ],
    sections: [
      {
        title: "Mis Propiedades",
        description: "Vista general de todas tus propiedades",
        icon: Building2,
        steps: [
          { title: "Lista de Propiedades", description: "Ve todas tus propiedades con su estado actual" },
          { title: "Detalles de Unidad", description: "Haz clic para ver fotos, amenidades y documentos" },
          { title: "Historial de Rentas", description: "Consulta inquilinos anteriores y valoraciones" }
        ]
      },
      {
        title: "Contratos y Documentos",
        description: "Accede a todos los documentos legales",
        icon: FileText,
        steps: [
          { title: "Contratos Activos", description: "Ve los contratos vigentes con fechas y términos" },
          { title: "Descargar Documentos", description: "Baja contratos, identificaciones y comprobantes" },
          { title: "Historial", description: "Accede a contratos anteriores y su documentación" }
        ]
      },
      {
        title: "Finanzas",
        description: "Reportes de ingresos y pagos",
        icon: DollarSign,
        steps: [
          { title: "Resumen Mensual", description: "Ve cuánto has recibido este mes por cada propiedad" },
          { title: "Próximos Pagos", description: "Consulta las fechas de los próximos depósitos" },
          { title: "Exportar Reportes", description: "Descarga reportes para tu contabilidad" }
        ]
      },
      {
        title: "Citas y Visitas",
        description: "Gestiona las visitas a tus propiedades",
        icon: Calendar,
        steps: [
          { title: "Solicitudes Pendientes", description: "Aprueba o rechaza solicitudes de visita" },
          { title: "Calendario", description: "Ve las citas programadas" },
          { title: "Auto-aprobación", description: "Configura aprobación automática si lo deseas" }
        ]
      }
    ],
    faqs: [
      { question: "¿Cuándo recibo el pago de la renta?", answer: "Los pagos se depositan entre el día 1 y 5 de cada mes, después de descontar la comisión de administración." },
      { question: "¿Puedo ver quién visita mi propiedad?", answer: "Sí, recibirás una notificación antes de cada visita con los datos del prospecto. Puedes aprobarla o rechazarla." },
      { question: "¿Cómo solicito mantenimiento?", answer: "Ve a la sección de Servicios y crea una nueva solicitud describiendo el problema. Te contactaremos para coordinar." },
      { question: "¿Puedo cambiar el precio de renta?", answer: "Sí, contacta a tu administrador para solicitar un cambio de precio. El cambio aplicará para nuevos contratos." },
      { question: "¿Dónde veo el contrato con mi inquilino?", answer: "En la sección de Contratos puedes ver y descargar todos los documentos del contrato vigente." }
    ]
  },
  tenant: {
    roleTitle: "Inquilino (Portal Tenant)",
    roleDescription: "Como inquilino, puedes acceder a toda la información de tu contrato, hacer pagos, reportar problemas y comunicarte con el equipo de administración.",
    whatCanIDo: [
      "Ver los detalles de tu contrato de renta",
      "Consultar el historial de pagos",
      "Reportar problemas o solicitar mantenimiento",
      "Descargar documentos y recibos",
      "Comunicarte con soporte",
      "Ver información de tu unidad",
      "Consultar el reglamento del condominio",
      "Solicitar la renovación de tu contrato"
    ],
    firstSteps: [
      {
        title: "Revisa tu contrato",
        description: "Familiarízate con los términos, fechas y condiciones de tu contrato."
      },
      {
        title: "Conoce tu unidad",
        description: "Ve las amenidades incluidas y el inventario de la propiedad."
      },
      {
        title: "Configura tus pagos",
        description: "Revisa las fechas de pago y métodos disponibles."
      },
      {
        title: "Guarda los contactos importantes",
        description: "Ten a la mano los números de emergencia y soporte."
      }
    ],
    workflow: [
      { step: 1, title: "Ver Mi Contrato", description: "Revisa términos, fechas y condiciones", icon: FileText },
      { step: 2, title: "Consultar Pagos", description: "Ve historial y próximos pagos", icon: DollarSign },
      { step: 3, title: "Reportar Problemas", description: "Crea tickets de mantenimiento", icon: Wrench },
      { step: 4, title: "Descargar Documentos", description: "Baja contratos y recibos", icon: FileText },
      { step: 5, title: "Contactar Soporte", description: "Comunícate con el equipo", icon: Headphones },
      { step: 6, title: "Renovar Contrato", description: "Solicita renovación cuando aplique", icon: CheckCircle2 }
    ],
    sections: [
      {
        title: "Mi Contrato",
        description: "Información completa de tu contrato de renta",
        icon: FileText,
        steps: [
          { title: "Datos del Contrato", description: "Ve fechas de inicio, fin, monto y depósito" },
          { title: "Términos y Condiciones", description: "Consulta las reglas y obligaciones" },
          { title: "Documentos", description: "Descarga el contrato firmado y anexos" }
        ]
      },
      {
        title: "Pagos",
        description: "Historial y estado de tus pagos",
        icon: DollarSign,
        steps: [
          { title: "Próximo Pago", description: "Ve la fecha límite y monto a pagar" },
          { title: "Historial", description: "Consulta todos los pagos realizados" },
          { title: "Recibos", description: "Descarga comprobantes de pago" }
        ]
      },
      {
        title: "Mantenimiento",
        description: "Reporta problemas en tu unidad",
        icon: Wrench,
        steps: [
          { title: "Crear Reporte", description: "Describe el problema y adjunta fotos" },
          { title: "Seguimiento", description: "Ve el estado de tus reportes" },
          { title: "Historial", description: "Consulta reportes anteriores y sus resoluciones" }
        ]
      },
      {
        title: "Soporte",
        description: "Obtén ayuda cuando la necesites",
        icon: Headphones,
        steps: [
          { title: "Chat con IA", description: "Resuelve dudas rápidas con nuestro asistente" },
          { title: "Contacto Directo", description: "Comunícate con el equipo de administración" },
          { title: "Emergencias", description: "Números de contacto para emergencias 24/7" }
        ]
      }
    ],
    faqs: [
      { question: "¿Cuándo debo pagar la renta?", answer: "El pago debe realizarse antes del día 5 de cada mes. Recibirás un recordatorio unos días antes." },
      { question: "¿Cómo reporto un problema de mantenimiento?", answer: "Ve a la sección de Mantenimiento, haz clic en 'Nuevo Reporte' y describe el problema con fotos si es posible." },
      { question: "¿Puedo renovar mi contrato?", answer: "Sí, 60 días antes de que termine tu contrato te contactaremos para discutir la renovación." },
      { question: "¿Qué pasa si pago tarde?", answer: "Se aplican cargos por mora según lo establecido en tu contrato. Contacta a soporte si tienes dificultades." },
      { question: "¿Cómo termino mi contrato anticipadamente?", answer: "Debes notificar con 60 días de anticipación. Revisa las penalizaciones en tu contrato o contacta a soporte." }
    ]
  },
  admin: {
    roleTitle: "Admin TRH / HomesApp",
    roleDescription: "Como administrador de la plataforma, tienes acceso completo a todas las funciones del sistema para gestionar propiedades, usuarios, contratos y la operación general.",
    whatCanIDo: [
      "Gestionar todos los usuarios y roles del sistema",
      "Administrar propiedades y catálogos",
      "Supervisar todos los contratos y rentas",
      "Acceder a reportes financieros completos",
      "Configurar el sistema y permisos",
      "Gestionar agencias externas",
      "Revisar y aprobar solicitudes",
      "Acceder a todas las funciones de la plataforma"
    ],
    firstSteps: [
      {
        title: "Conoce el dashboard principal",
        description: "El dashboard muestra KPIs clave: leads, citas, rentas activas e ingresos."
      },
      {
        title: "Revisa la gestión de usuarios",
        description: "Desde aquí puedes crear, editar y gestionar permisos de todos los usuarios."
      },
      {
        title: "Explora los reportes",
        description: "Accede a reportes detallados de operación y finanzas."
      },
      {
        title: "Configura el sistema",
        description: "Ajusta configuraciones globales, integraciones y permisos."
      },
      {
        title: "Supervisa las agencias externas",
        description: "Gestiona las agencias que operan bajo la plataforma."
      }
    ],
    workflow: [
      { step: 1, title: "Dashboard", description: "Revisa métricas y KPIs del día", icon: BarChart3 },
      { step: 2, title: "Gestionar Usuarios", description: "Administra usuarios, roles y permisos", icon: Users },
      { step: 3, title: "Supervisar Propiedades", description: "Revisa y aprueba propiedades", icon: Building2 },
      { step: 4, title: "Monitorear Contratos", description: "Supervisa contratos y renovaciones", icon: FileText },
      { step: 5, title: "Revisar Finanzas", description: "Consulta ingresos y comisiones", icon: DollarSign },
      { step: 6, title: "Configurar Sistema", description: "Ajusta configuraciones globales", icon: Settings }
    ],
    sections: [
      {
        title: "Gestión de Usuarios",
        description: "Administra todos los usuarios del sistema",
        icon: Users,
        steps: [
          { title: "Crear Usuario", description: "Agrega nuevos usuarios con roles específicos" },
          { title: "Editar Permisos", description: "Configura qué puede ver y hacer cada usuario" },
          { title: "Gestionar Agencias", description: "Administra agencias externas y sus usuarios" }
        ]
      },
      {
        title: "Propiedades",
        description: "Supervisión del catálogo de propiedades",
        icon: Building2,
        steps: [
          { title: "Aprobar Propiedades", description: "Revisa y aprueba nuevas propiedades" },
          { title: "Verificar Información", description: "Valida que los datos sean correctos" },
          { title: "Gestionar Estados", description: "Cambia disponibilidad y publicación" }
        ]
      },
      {
        title: "Contratos",
        description: "Gestión de todos los contratos del sistema",
        icon: FileText,
        steps: [
          { title: "Pipeline de Rentas", description: "Ve todos los procesos de renta en curso" },
          { title: "Contratos Activos", description: "Supervisa contratos vigentes" },
          { title: "Renovaciones", description: "Gestiona renovaciones próximas" }
        ]
      },
      {
        title: "Configuración",
        description: "Ajustes globales del sistema",
        icon: Settings,
        steps: [
          { title: "Permisos por Rol", description: "Configura qué puede ver cada tipo de usuario" },
          { title: "Integraciones", description: "Gestiona conexiones con servicios externos" },
          { title: "Plantillas", description: "Administra plantillas de contratos y documentos" }
        ]
      }
    ],
    faqs: [
      { question: "¿Cómo creo un nuevo rol personalizado?", answer: "Ve a Configuración > Roles y haz clic en 'Nuevo Rol'. Define los permisos y secciones visibles." },
      { question: "¿Puedo ver la actividad de cualquier usuario?", answer: "Sí, en el detalle de cada usuario puedes ver su historial de actividad y acciones recientes." },
      { question: "¿Cómo integro una nueva agencia externa?", answer: "Ve a Agencias Externas > Agregar Agencia. Completa los datos y se enviará una invitación al admin de la agencia." },
      { question: "¿Dónde veo los reportes financieros completos?", answer: "En la sección de Finanzas tienes acceso a todos los reportes de ingresos, comisiones y pagos." },
      { question: "¿Cómo configuro las plantillas de contratos?", answer: "Ve a Configuración > Plantillas de Contratos. Puedes editar el texto y tokens de sustitución." }
    ]
  },
  external_agency_admin: {
    roleTitle: "Admin de Agencia Externa",
    roleDescription: "Como administrador de agencia externa, gestionas tu equipo de vendedores, propiedades y la operación general de tu agencia dentro de la plataforma.",
    whatCanIDo: [
      "Gestionar usuarios y vendedores de tu agencia",
      "Administrar el catálogo de propiedades de tu agencia",
      "Ver reportes de actividad y desempeño del equipo",
      "Configurar comisiones y estructura de pagos",
      "Gestionar leads y su asignación a vendedores",
      "Acceder a contratos y documentos de rentas",
      "Configurar integraciones y automatizaciones",
      "Ver el dashboard financiero de la agencia"
    ],
    firstSteps: [
      {
        title: "Configura tu agencia",
        description: "Ve a Configuración para establecer el nombre, logo y datos de contacto de tu agencia."
      },
      {
        title: "Invita a tu equipo",
        description: "Agrega vendedores y asigna roles desde la sección de Usuarios."
      },
      {
        title: "Carga tus propiedades",
        description: "Añade las propiedades que tu agencia administra al catálogo."
      },
      {
        title: "Configura comisiones",
        description: "Establece la estructura de comisiones para tu equipo."
      },
      {
        title: "Revisa el dashboard",
        description: "Familiarízate con las métricas y reportes disponibles."
      }
    ],
    workflow: [
      { step: 1, title: "Configurar Agencia", description: "Establece la identidad y configuración de tu agencia", icon: Settings },
      { step: 2, title: "Cargar Propiedades", description: "Añade las propiedades al catálogo con fotos y detalles", icon: Upload },
      { step: 3, title: "Gestionar Equipo", description: "Invita vendedores y asigna permisos", icon: Users },
      { step: 4, title: "Asignar Leads", description: "Distribuye leads entre tu equipo de vendedores", icon: Target },
      { step: 5, title: "Supervisar Operación", description: "Monitorea el progreso y desempeño del equipo", icon: BarChart3 },
      { step: 6, title: "Revisar Finanzas", description: "Consulta ingresos, comisiones y pagos", icon: DollarSign }
    ],
    sections: [
      {
        title: "Gestión de Usuarios",
        description: "Administra tu equipo de vendedores",
        icon: Users,
        steps: [
          { title: "Invitar Usuario", description: "Usa el botón 'Agregar Usuario' e ingresa el email del vendedor" },
          { title: "Asignar Rol", description: "Elige entre vendedor, asistente, contador u otros roles" },
          { title: "Gestionar Permisos", description: "Configura qué secciones puede ver cada usuario" }
        ]
      },
      {
        title: "Catálogo de Propiedades",
        description: "Gestiona las propiedades de tu agencia",
        icon: Building2,
        steps: [
          { title: "Agregar Propiedad", description: "Completa el wizard con información, fotos y amenidades" },
          { title: "Editar Propiedades", description: "Actualiza precios, disponibilidad y detalles" },
          { title: "Estados de Publicación", description: "Controla qué propiedades están visibles al público" }
        ]
      },
      {
        title: "Dashboard y Reportes",
        description: "Monitorea el desempeño de tu agencia",
        icon: BarChart3,
        steps: [
          { title: "KPIs Principales", description: "Ve leads, citas, rentas cerradas y ocupación" },
          { title: "Desempeño por Vendedor", description: "Compara métricas entre miembros del equipo" },
          { title: "Exportar Reportes", description: "Descarga reportes en Excel o PDF" }
        ]
      },
      {
        title: "Configuración",
        description: "Personaliza la operación de tu agencia",
        icon: Settings,
        steps: [
          { title: "Datos de la Agencia", description: "Logo, nombre, dirección y datos fiscales" },
          { title: "Comisiones", description: "Estructura de comisiones por tipo de operación" },
          { title: "Integraciones", description: "Conecta con Google Calendar, email y otras herramientas" }
        ]
      }
    ],
    faqs: [
      { question: "¿Cuántos usuarios puedo agregar?", answer: "El límite depende de tu plan. Puedes ver el límite actual en Configuración > Plan." },
      { question: "¿Puedo ver las conversaciones de mis vendedores?", answer: "Sí, como admin puedes acceder al historial de actividad de cada lead para supervisar la comunicación." },
      { question: "¿Cómo configuro las comisiones?", answer: "Ve a Configuración > Comisiones y establece porcentajes por tipo de operación (renta larga, renta corta, venta)." },
      { question: "¿Puedo integrar mi calendario de Google?", answer: "Sí, en Configuración > Integraciones puedes conectar Google Calendar para sincronizar citas." },
      { question: "¿Cómo reasigno un lead a otro vendedor?", answer: "Entra al detalle del lead, haz clic en 'Cambiar Asignación' y selecciona el nuevo vendedor." }
    ]
  },
  external_agency_seller: {
    roleTitle: "Vendedor de Agencia Externa",
    roleDescription: "Como vendedor de agencia externa, tu rol principal es conectar clientes con propiedades, gestionar leads y cerrar rentas o ventas exitosamente.",
    whatCanIDo: [
      "Gestionar y dar seguimiento a leads de clientes potenciales",
      "Buscar propiedades que coincidan con las necesidades de tus clientes",
      "Agendar y coordinar visitas a propiedades",
      "Crear y gestionar ofertas de renta o venta",
      "Ver tu pipeline de rentas en vista Kanban",
      "Consultar tus comisiones e ingresos",
      "Compartir propiedades por WhatsApp a tus leads"
    ],
    firstSteps: [
      {
        title: "Revisa tus leads asignados",
        description: "Ve a la sección de Leads para ver los clientes potenciales que te han asignado o que has capturado."
      },
      {
        title: "Explora el catálogo de propiedades",
        description: "Familiarízate con las propiedades disponibles para poder recomendar las mejores opciones a tus clientes."
      },
      {
        title: "Configura tu perfil",
        description: "Asegúrate de tener tu foto de perfil y datos de contacto actualizados para generar confianza."
      },
      {
        title: "Conoce el tablero Kanban",
        description: "El tablero Kanban te ayuda a visualizar en qué etapa está cada proceso de renta."
      }
    ],
    workflow: [
      { step: 1, title: "Recibir Lead", description: "Un nuevo lead llega por registro, chatbot o asignación manual", icon: Users },
      { step: 2, title: "Contactar Cliente", description: "Llama o envía WhatsApp para entender sus necesidades", icon: Phone },
      { step: 3, title: "Buscar Propiedades", description: "Encuentra opciones que coincidan con su búsqueda", icon: Search },
      { step: 4, title: "Agendar Visitas", description: "Coordina citas para mostrar las propiedades", icon: Calendar },
      { step: 5, title: "Crear Oferta", description: "Genera una oferta formal cuando el cliente esté interesado", icon: FileText },
      { step: 6, title: "Cerrar Contrato", description: "Formaliza el contrato y cobra tu comisión", icon: CheckCircle2 }
    ],
    sections: [
      {
        title: "Gestión de Leads",
        description: "Aprende a gestionar tus leads de manera efectiva",
        icon: Users,
        steps: [
          { title: "Vista Kanban", description: "Arrastra y suelta leads entre columnas para cambiar su estado (Nuevo, Contactado, Calificado, etc.)" },
          { title: "Detalles del Lead", description: "Haz clic en un lead para ver su historial de actividad, notas y propiedades enviadas" },
          { title: "Registrar Actividad", description: "Añade llamadas, emails, reuniones y notas para mantener un historial completo" }
        ]
      },
      {
        title: "Catálogo de Propiedades",
        description: "Cómo usar el catálogo para encontrar la propiedad ideal",
        icon: Building2,
        steps: [
          { title: "Filtros Avanzados", description: "Usa los filtros para buscar por zona, precio, recámaras, amenidades y más" },
          { title: "Compartir por WhatsApp", description: "Selecciona un lead y envía propiedades directamente a su WhatsApp" },
          { title: "Favoritos", description: "Marca propiedades como favoritas para acceder rápidamente a ellas" }
        ]
      },
      {
        title: "Pipeline de Rentas",
        description: "Visualiza y gestiona tus procesos de renta",
        icon: ClipboardList,
        steps: [
          { title: "Estados del Pipeline", description: "Las rentas pasan por: Prospección → Documentación → Revisión → Firma → Activo" },
          { title: "Mover Tarjetas", description: "Arrastra las tarjetas entre columnas para actualizar el estado" },
          { title: "Ver Detalles", description: "Haz clic en una tarjeta para ver documentos, pagos y más información" }
        ]
      },
      {
        title: "Mis Comisiones",
        description: "Consulta tus ingresos y comisiones pendientes",
        icon: DollarSign,
        steps: [
          { title: "Comisiones Pendientes", description: "Ve las comisiones que aún no se han pagado" },
          { title: "Historial de Pagos", description: "Consulta el historial de pagos recibidos" },
          { title: "Proyecciones", description: "Ve cuánto puedes ganar con los deals en proceso" }
        ]
      }
    ],
    faqs: [
      { question: "¿Cómo me asignan nuevos leads?", answer: "Los leads se asignan automáticamente según disponibilidad y zona, o manualmente por tu administrador. Recibirás una notificación cuando tengas un nuevo lead." },
      { question: "¿Puedo ver propiedades de otras agencias?", answer: "Depende de la configuración de tu agencia. Algunas propiedades compartidas de la red pueden estar disponibles." },
      { question: "¿Cuándo se pagan mis comisiones?", answer: "Las comisiones se pagan después de que el contrato esté firmado y el primer pago del inquilino se haya procesado." },
      { question: "¿Cómo registro una llamada o actividad?", answer: "Entra al detalle del lead, haz clic en 'Agregar Actividad' y selecciona el tipo (llamada, email, reunión, WhatsApp, etc.)." },
      { question: "¿Qué hago si un lead no responde?", answer: "Intenta contactarlo por diferentes canales. Si después de 3 intentos no hay respuesta, puedes moverlo a 'Perdido' con una nota explicando la situación." }
    ]
  }
};

export function getRoleHelpContent(role: string): RoleHelpContent {
  // Map various role names to our help content types
  // This ensures all possible system roles get appropriate help content
  const roleMapping: Record<string, RoleType> = {
    // Direct mappings
    seller: "seller",
    broker: "broker",
    owner: "owner",
    tenant: "tenant",
    admin: "admin",
    
    // External agency roles
    external_agency_seller: "external_agency_seller",
    external_agency_admin: "external_agency_admin",
    
    // Admin variations map to admin
    master: "admin",
    admin_jr: "admin",
    management: "admin",
    
    // Sales roles map to seller
    sales_agent: "seller",
    agent: "seller",
    
    // Client/tenant variations
    cliente: "tenant",
    inquilino: "tenant",
    renter: "tenant",
    
    // Service provider roles map to seller (basic guidance)
    provider: "seller",
    concierge: "seller",
    service_provider: "seller",
    
    // Owner variations
    propietario: "owner",
    landlord: "owner",
  };
  
  // Default to seller for any unmapped roles - provides basic guidance
  const mappedRole = roleMapping[role?.toLowerCase()] || "seller";
  return helpContent[mappedRole];
}
