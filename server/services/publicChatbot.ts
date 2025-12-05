import { storage } from "../storage";
import type { 
  ChatbotMessage, 
  PublicChatbotConversation, 
  ChatFlowStep, 
  QuickReply,
  ChatbotLeadData,
  ChatbotAppointmentData
} from "@shared/schema";

interface ConversationState {
  currentStep: ChatFlowStep;
  leadData: ChatbotLeadData;
  appointmentData: ChatbotAppointmentData;
  leadId?: string;
  appointmentId?: string;
  retryCount: number;
  flowType?: "rent_long" | "buy" | "owner_rent" | "owner_sale" | "other";
  brand?: "homesapp" | "trh";
}

interface ChatResponse {
  message: string;
  quickReplies?: QuickReply[];
  inputType?: "text" | "phone" | "select" | "date" | "number" | "none";
  action?: {
    type: "lead_created" | "appointment_created" | "complete";
    data?: any;
  };
  leadId?: string;
  appointmentId?: string;
}

const ZONES = [
  "Aldea Zama",
  "La Veleta", 
  "Región 15",
  "Centro",
  "Holistika",
  "Selva Zama",
  "Otro"
];

const RENT_BUDGET_RANGES = [
  { label: "Menos de $15,000", value: "0-15000" },
  { label: "$15,000 - $25,000", value: "15000-25000" },
  { label: "$25,000 - $40,000", value: "25000-40000" },
  { label: "$40,000 - $60,000", value: "40000-60000" },
  { label: "Más de $60,000", value: "60000+" },
];

const BUY_BUDGET_RANGES = [
  { label: "Menos de $2M MXN", value: "0-2000000" },
  { label: "$2M - $4M MXN", value: "2000000-4000000" },
  { label: "$4M - $6M MXN", value: "4000000-6000000" },
  { label: "$6M - $10M MXN", value: "6000000-10000000" },
  { label: "Más de $10M MXN", value: "10000000+" },
];

const PAYMENT_METHODS = [
  { label: "Contado", value: "cash" },
  { label: "Crédito hipotecario", value: "mortgage" },
  { label: "Aún no lo sé", value: "undecided" },
];

function getBrandName(sourcePage?: string): { name: string; brand: "homesapp" | "trh" } {
  if (sourcePage?.includes("trh") || sourcePage?.includes("tulum-rental")) {
    return { name: "Tulum Rental Homes", brand: "trh" };
  }
  return { name: "HomesApp", brand: "homesapp" };
}

function getStateFromMetadata(conversation: PublicChatbotConversation): ConversationState {
  const metadata = (conversation.metadata as ConversationState) || {};
  return {
    currentStep: metadata.currentStep || "greeting",
    leadData: metadata.leadData || {},
    appointmentData: metadata.appointmentData || {},
    leadId: metadata.leadId,
    appointmentId: metadata.appointmentId,
    retryCount: metadata.retryCount || 0,
    flowType: metadata.flowType,
    brand: metadata.brand
  };
}

function createQuickReply(id: string, label: string, value?: string): QuickReply {
  return { id, label, value: value || label };
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  return /^\+?[0-9]{10,15}$/.test(cleaned);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, "");
}

async function checkDuplicateLead(agencyId: string, phone: string): Promise<string | null> {
  try {
    const normalizedPhone = normalizePhone(phone);
    const existingLead = await storage.checkExternalLeadDuplicate(
      agencyId, 
      "", 
      "", 
      normalizedPhone
    );
    return existingLead?.id || null;
  } catch (error) {
    console.error("Error checking duplicate lead:", error);
    return null;
  }
}

function detectIntent(message: string): string | null {
  const lower = message.toLowerCase().trim();
  
  if (lower.includes("propietario") || lower.includes("tengo una propiedad") || 
      lower.includes("enlistar") || lower.includes("administren") || lower.includes("la renten")) {
    return "list_property";
  }
  if (lower.includes("comprar") || lower.includes("venta") || lower.includes("invertir") || 
      lower.includes("en venta") || lower.includes("quiero comprar")) {
    return "buy";
  }
  if (lower.includes("vacacional") || lower.includes("airbnb") || lower.includes("una semana") ||
      lower.includes("temporal") || lower.includes("corto plazo") || lower.includes("rent_short")) {
    return "rent_short";
  }
  if (lower.includes("rentar") || lower.includes("renta") || lower.includes("alquilar") ||
      lower.includes("departamento") || lower.includes("rent_long")) {
    return "rent_long";
  }
  if (lower.includes("duda") || lower.includes("pregunta") || lower.includes("información") ||
      lower.includes("other") || lower.includes("solo estoy viendo")) {
    return "other";
  }
  
  return null;
}

function getNextStep(currentStep: ChatFlowStep, userResponse: string, state: ConversationState): ChatFlowStep {
  const intent = detectIntent(userResponse);
  
  switch (currentStep) {
    case "greeting":
      if (intent === "list_property" || userResponse === "list_property") {
        return "owner_type";
      }
      if (intent === "buy" || userResponse === "buy") {
        return "buy_name";
      }
      if (intent === "rent_short" || userResponse === "rent_short") {
        return "no_vacation_redirect";
      }
      if (intent === "rent_long" || userResponse === "rent_long") {
        return "rent_name";
      }
      if (intent === "other" || userResponse === "other") {
        return "other_help";
      }
      return "operation_type";
      
    case "operation_type":
      if (intent === "list_property" || userResponse === "list_property") {
        return "owner_type";
      }
      if (intent === "buy" || userResponse === "buy") {
        return "buy_name";
      }
      if (intent === "rent_short" || userResponse === "rent_short") {
        return "no_vacation_redirect";
      }
      if (intent === "rent_long" || userResponse === "rent_long") {
        return "rent_name";
      }
      if (intent === "other" || userResponse === "other") {
        return "other_help";
      }
      return "rent_name";
      
    case "no_vacation_redirect":
      if (userResponse === "rent_long" || userResponse.toLowerCase().includes("renta")) {
        return "rent_name";
      }
      if (userResponse === "buy" || userResponse.toLowerCase().includes("compra")) {
        return "buy_name";
      }
      return "other_help";
      
    case "owner_type":
      if (userResponse === "owner_rent" || userResponse.toLowerCase().includes("renta")) {
        return "owner_rent_name";
      }
      if (userResponse === "owner_sale" || userResponse.toLowerCase().includes("venta")) {
        return "owner_sale_name";
      }
      return "owner_rent_name";
      
    case "owner_rent_name":
      return "owner_rent_phone";
    case "owner_rent_phone":
      if (!isValidPhone(userResponse) && state.retryCount < 2) {
        return "owner_rent_phone";
      }
      return "owner_rent_zone";
    case "owner_rent_zone":
      return "owner_rent_type";
    case "owner_rent_type":
      return "owner_rent_bedrooms";
    case "owner_rent_bedrooms":
      return "owner_rent_price";
    case "owner_rent_price":
      return "owner_rent_confirm";
    case "owner_rent_confirm":
      return "owner_complete";
      
    case "owner_sale_name":
      return "owner_sale_phone";
    case "owner_sale_phone":
      if (!isValidPhone(userResponse) && state.retryCount < 2) {
        return "owner_sale_phone";
      }
      return "owner_sale_zone";
    case "owner_sale_zone":
      return "owner_sale_type";
    case "owner_sale_type":
      return "owner_sale_price";
    case "owner_sale_price":
      return "owner_sale_confirm";
    case "owner_sale_confirm":
      return "owner_complete";
      
    case "rent_name":
      return "rent_phone";
    case "rent_phone":
      if (!isValidPhone(userResponse) && state.retryCount < 2) {
        return "rent_phone";
      }
      return "rent_budget";
    case "rent_budget":
      return "rent_zone";
    case "rent_zone":
      return "rent_move_date";
    case "rent_move_date":
      return "rent_bedrooms";
    case "rent_bedrooms":
      return "rent_pets";
    case "rent_pets":
      return "rent_confirm";
    case "rent_confirm":
      return "rent_complete";
      
    case "buy_name":
      return "buy_phone";
    case "buy_phone":
      if (!isValidPhone(userResponse) && state.retryCount < 2) {
        return "buy_phone";
      }
      return "buy_budget";
    case "buy_budget":
      return "buy_payment";
    case "buy_payment":
      return "buy_zone";
    case "buy_zone":
      return "buy_type";
    case "buy_type":
      return "buy_confirm";
    case "buy_confirm":
      return "buy_complete";
      
    case "other_help":
      return "complete";
      
    default:
      return "complete";
  }
}

function getStepResponse(step: ChatFlowStep, state: ConversationState, brandName: string): ChatResponse {
  const firstName = state.leadData.name?.split(" ")[0] || "";
  
  switch (step) {
    case "greeting":
      return {
        message: `Hola, soy el asistente de ${brandName}.\n\n¿En qué puedo ayudarte hoy?`,
        quickReplies: [
          createQuickReply("rent_long", "Quiero rentar", "rent_long"),
          createQuickReply("buy", "Quiero comprar", "buy"),
          createQuickReply("list", "Soy propietario", "list_property"),
          createQuickReply("other", "Tengo una duda", "other"),
        ],
        inputType: "none"
      };
      
    case "operation_type":
      return {
        message: "¿Qué te gustaría hacer?",
        quickReplies: [
          createQuickReply("rent_long", "Quiero rentar", "rent_long"),
          createQuickReply("buy", "Quiero comprar", "buy"),
          createQuickReply("list", "Soy propietario", "list_property"),
          createQuickReply("other", "Tengo una duda", "other"),
        ],
        inputType: "none"
      };
      
    case "no_vacation_redirect":
      return {
        message: "Por ahora nos especializamos en rentas a largo plazo (6 o 12 meses) y venta de propiedades.\n\nSi te interesa renta larga o comprar, te puedo ayudar con eso.\n\n¿Qué prefieres?",
        quickReplies: [
          createQuickReply("rent_long", "Renta a largo plazo", "rent_long"),
          createQuickReply("buy", "Comprar propiedad", "buy"),
        ],
        inputType: "none"
      };

    case "owner_type":
      return {
        message: "Perfecto, eres propietario. Te ayudo a enlistar tu propiedad.\n\n¿La quieres rentar a largo plazo con Tulum Rental Homes o la quieres vender con HomesApp?",
        quickReplies: [
          createQuickReply("owner_rent", "Renta a largo plazo", "owner_rent"),
          createQuickReply("owner_sale", "Venta", "owner_sale"),
        ],
        inputType: "none"
      };
      
    case "owner_rent_name":
      return {
        message: "Excelente, registraremos tu propiedad para renta.\n\nPara comenzar, ¿cuál es tu nombre completo?",
        inputType: "text"
      };
      
    case "owner_rent_phone":
      if (state.retryCount > 0) {
        return {
          message: "Por favor ingresa un número válido (10+ dígitos).\nEjemplo: +52 998 123 4567",
          inputType: "phone"
        };
      }
      return {
        message: `Mucho gusto${firstName ? `, ${firstName}` : ""}.\n\n¿Me compartes tu número de WhatsApp para contactarte?`,
        inputType: "phone"
      };
      
    case "owner_rent_zone":
      return {
        message: "¿En qué zona se ubica tu propiedad?",
        quickReplies: ZONES.map(z => createQuickReply(z, z, z)),
        inputType: "text"
      };
      
    case "owner_rent_type":
      return {
        message: "¿Qué tipo de propiedad es?",
        quickReplies: [
          createQuickReply("apartment", "Departamento", "departamento"),
          createQuickReply("house", "Casa", "casa"),
          createQuickReply("studio", "Estudio", "estudio"),
          createQuickReply("penthouse", "Penthouse", "penthouse"),
        ],
        inputType: "text"
      };
      
    case "owner_rent_bedrooms":
      return {
        message: "¿Cuántas recámaras tiene?",
        quickReplies: [
          createQuickReply("studio", "Estudio", "0"),
          createQuickReply("1", "1 recámara", "1"),
          createQuickReply("2", "2 recámaras", "2"),
          createQuickReply("3+", "3+ recámaras", "3+"),
        ],
        inputType: "number"
      };
      
    case "owner_rent_price":
      return {
        message: "¿Cuánto te gustaría cobrar de renta mensual? (en pesos MXN)",
        inputType: "text"
      };
      
    case "owner_rent_confirm":
      const ownerRentSummary = `Confirmemos los datos de tu propiedad:\n\n` +
        `• Propietario: ${state.leadData.name || "No proporcionado"}\n` +
        `• WhatsApp: ${state.leadData.phone || "No proporcionado"}\n` +
        `• Zona: ${state.leadData.zone || "No especificada"}\n` +
        `• Tipo: ${state.leadData.propertyType || "No especificado"}\n` +
        `• Recámaras: ${state.leadData.bedrooms || "No especificado"}\n` +
        `• Renta deseada: ${state.leadData.desiredPrice || "No especificado"}\n\n` +
        `¿Es correcta la información?`;
      return {
        message: ownerRentSummary,
        quickReplies: [
          createQuickReply("confirm", "Sí, todo correcto", "confirm"),
          createQuickReply("restart", "Corregir datos", "restart"),
        ],
        inputType: "none"
      };
      
    case "owner_sale_name":
      return {
        message: "Excelente, registraremos tu propiedad para venta con HomesApp.\n\nPara comenzar, ¿cuál es tu nombre completo?",
        inputType: "text"
      };
      
    case "owner_sale_phone":
      if (state.retryCount > 0) {
        return {
          message: "Por favor ingresa un número válido (10+ dígitos).\nEjemplo: +52 998 123 4567",
          inputType: "phone"
        };
      }
      return {
        message: `Mucho gusto${firstName ? `, ${firstName}` : ""}.\n\n¿Me compartes tu número de WhatsApp para contactarte?`,
        inputType: "phone"
      };
      
    case "owner_sale_zone":
      return {
        message: "¿En qué zona se ubica tu propiedad?",
        quickReplies: ZONES.map(z => createQuickReply(z, z, z)),
        inputType: "text"
      };
      
    case "owner_sale_type":
      return {
        message: "¿Qué tipo de propiedad es?",
        quickReplies: [
          createQuickReply("apartment", "Departamento", "departamento"),
          createQuickReply("house", "Casa", "casa"),
          createQuickReply("land", "Terreno", "terreno"),
          createQuickReply("penthouse", "Penthouse", "penthouse"),
        ],
        inputType: "text"
      };
      
    case "owner_sale_price":
      return {
        message: "¿Cuál es el precio de venta deseado? (en pesos MXN o USD)",
        inputType: "text"
      };
      
    case "owner_sale_confirm":
      const ownerSaleSummary = `Confirmemos los datos de tu propiedad:\n\n` +
        `• Propietario: ${state.leadData.name || "No proporcionado"}\n` +
        `• WhatsApp: ${state.leadData.phone || "No proporcionado"}\n` +
        `• Zona: ${state.leadData.zone || "No especificada"}\n` +
        `• Tipo: ${state.leadData.propertyType || "No especificado"}\n` +
        `• Precio venta: ${state.leadData.desiredPrice || "No especificado"}\n\n` +
        `¿Es correcta la información?`;
      return {
        message: ownerSaleSummary,
        quickReplies: [
          createQuickReply("confirm", "Sí, todo correcto", "confirm"),
          createQuickReply("restart", "Corregir datos", "restart"),
        ],
        inputType: "none"
      };
      
    case "owner_complete":
      const ownerBrandMsg = state.flowType === "owner_sale" 
        ? "Un asesor de ventas de HomesApp te contactará pronto."
        : "Un asesor de Tulum Rental Homes te contactará pronto.";
      return {
        message: `Listo, registramos tu propiedad.\n\n${ownerBrandMsg}\n\n¿Te puedo ayudar con algo más?`,
        quickReplies: [
          createQuickReply("more", "Sí, tengo otra duda", "other"),
          createQuickReply("done", "No, gracias", "done"),
        ],
        inputType: "none",
        action: { type: "lead_created", data: { leadId: state.leadId } }
      };

    case "rent_name":
      return {
        message: "Perfecto, te ayudaré a encontrar tu próximo hogar en Tulum.\n\n¿Cuál es tu nombre?",
        inputType: "text"
      };
      
    case "rent_phone":
      if (state.retryCount > 0) {
        return {
          message: "Por favor ingresa un número válido (10+ dígitos).\nEjemplo: +52 998 123 4567",
          inputType: "phone"
        };
      }
      return {
        message: `Mucho gusto${firstName ? `, ${firstName}` : ""}.\n\n¿Me compartes tu número de WhatsApp para contactarte?`,
        inputType: "phone"
      };
      
    case "rent_budget":
      return {
        message: "¿Cuál es tu presupuesto mensual aproximado?",
        quickReplies: RENT_BUDGET_RANGES.map(b => createQuickReply(b.value, b.label, b.value)),
        inputType: "text"
      };
      
    case "rent_zone":
      return {
        message: "¿En qué zona te gustaría vivir?",
        quickReplies: ZONES.map(z => createQuickReply(z, z, z)),
        inputType: "text"
      };
      
    case "rent_move_date":
      return {
        message: "¿Para cuándo estás buscando mudarte?",
        quickReplies: [
          createQuickReply("immediate", "Inmediato", "Inmediato"),
          createQuickReply("1month", "En 1 mes", "En 1 mes"),
          createQuickReply("2-3months", "2-3 meses", "2-3 meses"),
          createQuickReply("flexible", "Flexible", "Flexible"),
        ],
        inputType: "text"
      };
      
    case "rent_bedrooms":
      return {
        message: "¿Cuántas recámaras necesitas?",
        quickReplies: [
          createQuickReply("studio", "Estudio", "0"),
          createQuickReply("1", "1 recámara", "1"),
          createQuickReply("2", "2 recámaras", "2"),
          createQuickReply("3+", "3+ recámaras", "3+"),
        ],
        inputType: "number"
      };
      
    case "rent_pets":
      return {
        message: "¿Tienes mascotas?",
        quickReplies: [
          createQuickReply("yes", "Sí", "yes"),
          createQuickReply("no", "No", "no"),
        ],
        inputType: "none"
      };
      
    case "rent_confirm":
      const rentSummary = `Confirmemos tu búsqueda:\n\n` +
        `• Nombre: ${state.leadData.name || "No proporcionado"}\n` +
        `• WhatsApp: ${state.leadData.phone || "No proporcionado"}\n` +
        `• Presupuesto: ${state.leadData.budget || "No especificado"}\n` +
        `• Zona: ${state.leadData.zone || "No especificada"}\n` +
        `• Mudanza: ${state.leadData.moveDate || "No especificada"}\n` +
        `• Recámaras: ${state.leadData.bedrooms || "No especificado"}\n` +
        `• Mascotas: ${state.leadData.hasPets ? "Sí" : "No"}\n\n` +
        `¿Es correcta la información?`;
      return {
        message: rentSummary,
        quickReplies: [
          createQuickReply("confirm", "Sí, todo correcto", "confirm"),
          createQuickReply("restart", "Corregir datos", "restart"),
        ],
        inputType: "none"
      };
      
    case "rent_complete":
      return {
        message: `Listo, ${firstName || "amigo"}, registramos tu búsqueda de renta.\n\nUn asesor de Tulum Rental Homes te contactará pronto con opciones que se ajusten a tu perfil.\n\n¿Te puedo ayudar con algo más?`,
        quickReplies: [
          createQuickReply("more", "Sí, tengo otra duda", "other"),
          createQuickReply("done", "No, gracias", "done"),
        ],
        inputType: "none",
        action: { type: "lead_created", data: { leadId: state.leadId } }
      };

    case "buy_name":
      return {
        message: "Excelente, te ayudaré a encontrar tu propiedad ideal en Tulum.\n\n¿Cuál es tu nombre?",
        inputType: "text"
      };
      
    case "buy_phone":
      if (state.retryCount > 0) {
        return {
          message: "Por favor ingresa un número válido (10+ dígitos).\nEjemplo: +52 998 123 4567",
          inputType: "phone"
        };
      }
      return {
        message: `Mucho gusto${firstName ? `, ${firstName}` : ""}.\n\n¿Me compartes tu número de WhatsApp para contactarte?`,
        inputType: "phone"
      };
      
    case "buy_budget":
      return {
        message: "¿Cuál es tu presupuesto aproximado de compra?",
        quickReplies: BUY_BUDGET_RANGES.map(b => createQuickReply(b.value, b.label, b.value)),
        inputType: "text"
      };
      
    case "buy_payment":
      return {
        message: "¿Cómo planeas pagar?",
        quickReplies: PAYMENT_METHODS.map(p => createQuickReply(p.value, p.label, p.value)),
        inputType: "none"
      };
      
    case "buy_zone":
      return {
        message: "¿En qué zona te gustaría comprar?",
        quickReplies: ZONES.map(z => createQuickReply(z, z, z)),
        inputType: "text"
      };
      
    case "buy_type":
      return {
        message: "¿Qué tipo de propiedad buscas?",
        quickReplies: [
          createQuickReply("apartment", "Departamento", "departamento"),
          createQuickReply("house", "Casa", "casa"),
          createQuickReply("land", "Terreno", "terreno"),
          createQuickReply("penthouse", "Penthouse", "penthouse"),
        ],
        inputType: "text"
      };
      
    case "buy_confirm":
      const buySummary = `Confirmemos tu búsqueda:\n\n` +
        `• Nombre: ${state.leadData.name || "No proporcionado"}\n` +
        `• WhatsApp: ${state.leadData.phone || "No proporcionado"}\n` +
        `• Presupuesto: ${state.leadData.budget || "No especificado"}\n` +
        `• Forma de pago: ${state.leadData.paymentMethod || "No especificada"}\n` +
        `• Zona: ${state.leadData.zone || "No especificada"}\n` +
        `• Tipo: ${state.leadData.propertyType || "No especificado"}\n\n` +
        `¿Es correcta la información?`;
      return {
        message: buySummary,
        quickReplies: [
          createQuickReply("confirm", "Sí, todo correcto", "confirm"),
          createQuickReply("restart", "Corregir datos", "restart"),
        ],
        inputType: "none"
      };
      
    case "buy_complete":
      return {
        message: `Perfecto, ${firstName || "amigo"}, registramos tu búsqueda de compra.\n\nUn asesor de HomesApp te contactará para mostrarte las mejores opciones.\n\n¿Te puedo ayudar con algo más?`,
        quickReplies: [
          createQuickReply("more", "Sí, tengo otra duda", "other"),
          createQuickReply("done", "No, gracias", "done"),
        ],
        inputType: "none",
        action: { type: "lead_created", data: { leadId: state.leadId } }
      };

    case "other_help":
      return {
        message: `¿En qué puedo ayudarte?\n\nPuedes contactarnos directamente:\nWhatsApp: +52 998 XXX XXXX\nHorario: Lunes a Viernes 9am - 6pm\n\n¿O prefieres que te ayude con alguna de estas opciones?`,
        quickReplies: [
          createQuickReply("rent_long", "Buscar renta", "rent_long"),
          createQuickReply("buy", "Buscar para comprar", "buy"),
          createQuickReply("list", "Enlistar propiedad", "list_property"),
        ],
        inputType: "text"
      };
      
    case "complete":
      return {
        message: `Perfecto, ${firstName || "amigo"}.\n\nCualquier duda extra puedes escribirme aquí. ¡Que tengas excelente día!`,
        inputType: "none",
        action: { type: "complete" }
      };
      
    default:
      return {
        message: "¿En qué más puedo ayudarte?",
        quickReplies: [
          createQuickReply("rent_long", "Buscar renta", "rent_long"),
          createQuickReply("buy", "Buscar para comprar", "buy"),
          createQuickReply("list", "Enlistar propiedad", "list_property"),
        ],
        inputType: "text"
      };
  }
}

function processUserInput(step: ChatFlowStep, input: string, state: ConversationState): ConversationState {
  const newState = { ...state };
  
  switch (step) {
    case "greeting":
    case "operation_type":
      const intent = detectIntent(input) || input;
      newState.leadData.operationType = intent as any;
      if (intent === "list_property") {
        newState.flowType = undefined;
      } else if (intent === "buy") {
        newState.flowType = "buy";
      } else if (intent === "rent_long") {
        newState.flowType = "rent_long";
      }
      break;
      
    case "owner_type":
      if (input === "owner_rent" || input.toLowerCase().includes("renta")) {
        newState.flowType = "owner_rent";
      } else {
        newState.flowType = "owner_sale";
      }
      break;
      
    case "owner_rent_name":
    case "owner_sale_name":
    case "rent_name":
    case "buy_name":
      newState.leadData.name = input.trim();
      break;
      
    case "owner_rent_phone":
    case "owner_sale_phone":
    case "rent_phone":
    case "buy_phone":
      if (isValidPhone(input)) {
        newState.leadData.phone = normalizePhone(input);
        newState.retryCount = 0;
      } else {
        newState.retryCount = (newState.retryCount || 0) + 1;
      }
      break;
      
    case "owner_rent_zone":
    case "owner_sale_zone":
    case "rent_zone":
    case "buy_zone":
      newState.leadData.zone = input;
      break;
      
    case "owner_rent_type":
    case "owner_sale_type":
    case "buy_type":
      newState.leadData.propertyType = input;
      break;
      
    case "owner_rent_bedrooms":
    case "rent_bedrooms":
      newState.leadData.bedrooms = input;
      break;
      
    case "owner_rent_price":
    case "owner_sale_price":
      newState.leadData.desiredPrice = input;
      break;
      
    case "rent_budget":
    case "buy_budget":
      newState.leadData.budget = input;
      break;
      
    case "buy_payment":
      newState.leadData.paymentMethod = input;
      break;
      
    case "rent_move_date":
      newState.leadData.moveDate = input;
      break;
      
    case "rent_pets":
      newState.leadData.hasPets = input.toLowerCase() === "yes" || input.toLowerCase() === "sí";
      break;
  }
  
  return newState;
}

async function createLeadFromChat(
  agencyId: string,
  conversationId: string,
  state: ConversationState
): Promise<string | null> {
  try {
    if (!state.leadData.name || !state.leadData.phone) {
      console.log("Cannot create lead: missing required fields");
      return null;
    }

    const existingLeadId = await checkDuplicateLead(agencyId, state.leadData.phone);
    if (existingLeadId) {
      console.log("Duplicate lead found:", existingLeadId);
      return existingLeadId;
    }

    const nameParts = state.leadData.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const flowTypeLabels: Record<string, string> = {
      rent_long: "Inquilino - Renta larga",
      buy: "Comprador",
      owner_rent: "Propietario - Renta larga",
      owner_sale: "Propietario - Venta",
      other: "Información general"
    };

    const registrationType = state.flowType?.startsWith("owner") ? "seller" : "seller";
    const purpose = state.flowType === "buy" ? "comprador" : 
                    state.flowType === "rent_long" ? "cliente" :
                    state.flowType?.startsWith("owner") ? "propietario" : "cliente";

    const notesLines = [
      `Capturado via chatbot público.`,
      `Tipo: ${flowTypeLabels[state.flowType || ""] || "No especificado"}`,
    ];
    
    if (state.leadData.budget) notesLines.push(`Presupuesto: ${state.leadData.budget}`);
    if (state.leadData.zone) notesLines.push(`Zona: ${state.leadData.zone}`);
    if (state.leadData.propertyType) notesLines.push(`Tipo propiedad: ${state.leadData.propertyType}`);
    if (state.leadData.bedrooms) notesLines.push(`Recámaras: ${state.leadData.bedrooms}`);
    if (state.leadData.moveDate) notesLines.push(`Fecha mudanza: ${state.leadData.moveDate}`);
    if (state.leadData.desiredPrice) notesLines.push(`Precio deseado: ${state.leadData.desiredPrice}`);
    if (state.leadData.paymentMethod) notesLines.push(`Forma de pago: ${state.leadData.paymentMethod}`);
    if (state.leadData.hasPets !== undefined) notesLines.push(`Mascotas: ${state.leadData.hasPets ? "Sí" : "No"}`);
    if (state.leadData.sourcePage) notesLines.push(`Página origen: ${state.leadData.sourcePage}`);
    if (state.leadData.propertyId) notesLines.push(`Propiedad de interés: ${state.leadData.propertyId}`);
    notesLines.push(`Conversación ID: ${conversationId}`);

    const lead = await storage.createExternalLead({
      agencyId,
      firstName,
      lastName,
      phone: state.leadData.phone,
      email: state.leadData.email || null,
      registrationType: registrationType,
      purpose: purpose,
      status: "nuevo_lead",
      source: "chatbot_homesapp",
      notes: notesLines.join("\n"),
      desiredNeighborhood: state.leadData.zone || null,
      bedroomsText: state.leadData.bedrooms || null,
      checkInDateText: state.leadData.moveDate || null,
      interestedUnitIds: state.leadData.propertyId ? [state.leadData.propertyId] : null,
      interestedCondominiumIds: state.leadData.condominiumId ? [state.leadData.condominiumId] : null,
      hasPets: state.leadData.hasPets ? "yes" : "",
    });

    return lead.id;
  } catch (error) {
    console.error("Error creating lead from chat:", error);
    return null;
  }
}

function shouldCreateLead(step: ChatFlowStep): boolean {
  return [
    "owner_rent_confirm",
    "owner_sale_confirm", 
    "rent_confirm",
    "buy_confirm"
  ].includes(step);
}

export async function processPublicChatMessage(
  conversationId: string,
  userMessage: string,
  agencyId: string,
  context?: { propertyId?: string; condominiumId?: string; sourcePage?: string }
): Promise<ChatResponse> {
  try {
    const conversation = await storage.getPublicChatbotConversation(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const messages = (conversation.messages as ChatbotMessage[]) || [];
    let state = getStateFromMetadata(conversation);
    
    if (context?.propertyId) state.leadData.propertyId = context.propertyId;
    if (context?.condominiumId) state.leadData.condominiumId = context.condominiumId;
    if (context?.sourcePage) state.leadData.sourcePage = context.sourcePage;
    
    if (!state.brand) {
      const { brand } = getBrandName(context?.sourcePage);
      state.brand = brand;
    }

    state = processUserInput(state.currentStep, userMessage, state);

    const nextStep = getNextStep(state.currentStep, userMessage, state);
    
    if (shouldCreateLead(state.currentStep) && userMessage.toLowerCase().includes("confirm")) {
      if (!state.leadId) {
        const leadId = await createLeadFromChat(agencyId, conversationId, state);
        state.leadId = leadId || undefined;
      }
    }
    
    state.currentStep = nextStep;

    const { name: brandName } = getBrandName(context?.sourcePage);
    const response = getStepResponse(nextStep, state, brandName);

    const newUserMessage: ChatbotMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
      metadata: { step: state.currentStep }
    };
    
    const newAssistantMessage: ChatbotMessage = {
      role: "assistant",
      content: response.message,
      timestamp: new Date().toISOString(),
      quickReplies: response.quickReplies,
      inputType: response.inputType,
      metadata: { 
        step: nextStep,
        leadId: state.leadId,
        flowType: state.flowType
      }
    };

    const updatedMessages = [...messages, newUserMessage, newAssistantMessage];
    
    await storage.updatePublicChatbotConversation(conversationId, {
      messages: updatedMessages,
      metadata: state,
      lastMessageAt: new Date(),
      convertedToLeadId: state.leadId || null,
      visitorName: state.leadData.name,
      visitorPhone: state.leadData.phone,
      visitorEmail: state.leadData.email
    });

    return {
      ...response,
      leadId: state.leadId
    };
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    return {
      message: "Lo siento, hubo un problema. ¿Podrías intentar de nuevo?",
      inputType: "text"
    };
  }
}

export async function getWelcomeMessage(sourcePage?: string): Promise<ChatbotMessage> {
  const { name: brandName, brand } = getBrandName(sourcePage);
  
  const initialState: ConversationState = {
    currentStep: "greeting",
    leadData: {},
    appointmentData: {},
    retryCount: 0,
    brand
  };
  
  const response = getStepResponse("greeting", initialState, brandName);
  
  return {
    role: "assistant",
    content: response.message,
    timestamp: new Date().toISOString(),
    quickReplies: response.quickReplies,
    inputType: response.inputType,
    metadata: { step: "greeting", brand }
  };
}

export async function createPublicChatConversation(
  agencyId: string, 
  sessionId: string,
  context?: { propertyId?: string; condominiumId?: string; sourcePage?: string }
): Promise<PublicChatbotConversation> {
  const welcomeMessage = await getWelcomeMessage(context?.sourcePage);
  const { brand } = getBrandName(context?.sourcePage);
  
  const initialState: ConversationState = {
    currentStep: "greeting",
    leadData: {
      propertyId: context?.propertyId,
      condominiumId: context?.condominiumId,
      sourcePage: context?.sourcePage || "homepage"
    },
    appointmentData: {},
    retryCount: 0,
    brand
  };

  const conversation = await storage.createPublicChatbotConversation({
    agencyId,
    sessionId,
    messages: [welcomeMessage],
    metadata: initialState,
    status: "active",
    lastMessageAt: new Date()
  });

  return conversation;
}
