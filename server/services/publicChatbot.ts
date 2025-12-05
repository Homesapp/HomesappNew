import { storage } from "../storage";
import type { 
  ChatbotMessage, 
  PublicChatbotConversation, 
  ChatFlowStep, 
  QuickReply,
  ChatbotLeadData,
  ChatbotAppointmentData
} from "@shared/schema";

type Language = "es" | "en";

interface ConversationState {
  currentStep: ChatFlowStep;
  leadData: ChatbotLeadData;
  appointmentData: ChatbotAppointmentData;
  leadId?: string;
  appointmentId?: string;
  retryCount: number;
  flowType?: "rent_long" | "buy" | "owner_rent" | "owner_sale" | "other";
  brand?: "homesapp" | "trh";
  language: Language;
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
];

const RENT_BUDGET_RANGES_ES = [
  { label: "Menos de $15,000", value: "0-15000" },
  { label: "$15,000 - $25,000", value: "15000-25000" },
  { label: "$25,000 - $40,000", value: "25000-40000" },
  { label: "$40,000 - $60,000", value: "40000-60000" },
  { label: "Más de $60,000", value: "60000+" },
];

const RENT_BUDGET_RANGES_EN = [
  { label: "Less than $15,000", value: "0-15000" },
  { label: "$15,000 - $25,000", value: "15000-25000" },
  { label: "$25,000 - $40,000", value: "25000-40000" },
  { label: "$40,000 - $60,000", value: "40000-60000" },
  { label: "More than $60,000", value: "60000+" },
];

const BUY_BUDGET_RANGES_ES = [
  { label: "Menos de $2M MXN", value: "0-2000000" },
  { label: "$2M - $4M MXN", value: "2000000-4000000" },
  { label: "$4M - $6M MXN", value: "4000000-6000000" },
  { label: "$6M - $10M MXN", value: "6000000-10000000" },
  { label: "Más de $10M MXN", value: "10000000+" },
];

const BUY_BUDGET_RANGES_EN = [
  { label: "Less than $2M MXN", value: "0-2000000" },
  { label: "$2M - $4M MXN", value: "2000000-4000000" },
  { label: "$4M - $6M MXN", value: "4000000-6000000" },
  { label: "$6M - $10M MXN", value: "6000000-10000000" },
  { label: "More than $10M MXN", value: "10000000+" },
];

const MESSAGES: Record<Language, Record<string, any>> = {
  es: {
    greeting: {
      homesapp: "Hola, soy el asistente de HomesApp.\n\n¿Quieres rentar, comprar o enlistar tu propiedad?",
      trh: "Hola, soy el asistente de Tulum Rental Homes.\n\nTe ayudo con rentas a largo plazo."
    },
    quickReplies: {
      rent: "Quiero rentar",
      buy: "Quiero comprar",
      owner: "Soy propietario",
      other: "Tengo una duda",
      ownerRent: "Renta a largo plazo",
      ownerSale: "Venta",
      confirm: "Sí, todo correcto",
      restart: "Corregir datos",
      more: "Sí, tengo otra duda",
      done: "No, gracias",
      yes: "Sí",
      no: "No",
      immediate: "Inmediato",
      oneMonth: "En 1 mes",
      twoThreeMonths: "2-3 meses",
      flexible: "Flexible",
      studio: "Estudio",
      oneBed: "1 recámara",
      twoBeds: "2 recámaras",
      threePlusBeds: "3+ recámaras",
      apartment: "Departamento",
      house: "Casa",
      land: "Terreno",
      penthouse: "Penthouse",
      cash: "Contado",
      mortgage: "Crédito hipotecario",
      undecided: "Aún no lo sé",
      changeLang: "Change to English",
      otherZone: "Otra zona"
    },
    noVacation: "Por ahora nos especializamos en rentas a largo plazo (6 o 12 meses) y venta de propiedades.\n\nSi te interesa renta larga o comprar, te puedo ayudar.\n\n¿Qué prefieres?",
    ownerType: "Perfecto, eres propietario. Te ayudo a enlistar tu propiedad.\n\n¿La quieres rentar a largo plazo con Tulum Rental Homes o la quieres vender con HomesApp?",
    ownerRentName: "Excelente, registraremos tu propiedad para renta.\n\nPara comenzar, ¿cuál es tu nombre completo?",
    ownerSaleName: "Excelente, registraremos tu propiedad para venta con HomesApp.\n\nPara comenzar, ¿cuál es tu nombre completo?",
    phoneAsk: (name: string) => `Mucho gusto${name ? `, ${name}` : ""}.\n\n¿Me compartes tu número de WhatsApp para contactarte?`,
    phoneRetry: "Por favor ingresa un número válido (10+ dígitos).\nEjemplo: +52 998 123 4567",
    zoneAsk: "¿En qué zona se ubica tu propiedad?",
    propertyTypeAsk: "¿Qué tipo de propiedad es?",
    bedroomsAsk: "¿Cuántas recámaras tiene?",
    rentPriceAsk: "¿Cuánto te gustaría cobrar de renta mensual? (en pesos MXN)",
    salePriceAsk: "¿Cuál es el precio de venta deseado? (en pesos MXN o USD)",
    ownerRentConfirm: (data: any) => `Confirmemos los datos de tu propiedad:\n\n• Propietario: ${data.name || "No proporcionado"}\n• WhatsApp: ${data.phone || "No proporcionado"}\n• Zona: ${data.zone || "No especificada"}\n• Tipo: ${data.propertyType || "No especificado"}\n• Recámaras: ${data.bedrooms || "No especificado"}\n• Renta deseada: ${data.desiredPrice || "No especificado"}\n\n¿Es correcta la información?`,
    ownerSaleConfirm: (data: any) => `Confirmemos los datos de tu propiedad:\n\n• Propietario: ${data.name || "No proporcionado"}\n• WhatsApp: ${data.phone || "No proporcionado"}\n• Zona: ${data.zone || "No especificada"}\n• Tipo: ${data.propertyType || "No especificado"}\n• Precio venta: ${data.desiredPrice || "No especificado"}\n\n¿Es correcta la información?`,
    ownerComplete: {
      rent: "Listo, registramos tu propiedad.\n\nUn asesor de Tulum Rental Homes te contactará pronto.\n\n¿Te puedo ayudar con algo más?",
      sale: "Listo, registramos tu propiedad.\n\nUn asesor de ventas de HomesApp te contactará pronto.\n\n¿Te puedo ayudar con algo más?"
    },
    rentName: "Perfecto, te ayudaré a encontrar tu próximo hogar en Tulum.\n\n¿Cuál es tu nombre?",
    rentBudget: "¿Cuál es tu presupuesto mensual aproximado?",
    rentZone: "¿En qué zona te gustaría vivir?",
    rentMoveDate: "¿Para cuándo estás buscando mudarte?",
    rentBedrooms: "¿Cuántas recámaras necesitas?",
    rentPets: "¿Tienes mascotas?",
    rentConfirm: (data: any) => `Confirmemos tu búsqueda:\n\n• Nombre: ${data.name || "No proporcionado"}\n• WhatsApp: ${data.phone || "No proporcionado"}\n• Presupuesto: ${data.budget || "No especificado"}\n• Zona: ${data.zone || "No especificada"}\n• Mudanza: ${data.moveDate || "No especificada"}\n• Recámaras: ${data.bedrooms || "No especificado"}\n• Mascotas: ${data.hasPets ? "Sí" : "No"}\n\n¿Es correcta la información?`,
    rentComplete: (name: string) => `Listo, ${name || "amigo"}, registramos tu búsqueda de renta.\n\nUn asesor de Tulum Rental Homes te contactará pronto con opciones que se ajusten a tu perfil.\n\n¿Te puedo ayudar con algo más?`,
    buyName: "Excelente, te ayudaré a encontrar tu propiedad ideal en Tulum.\n\n¿Cuál es tu nombre?",
    buyBudget: "¿Cuál es tu presupuesto aproximado de compra?",
    buyPayment: "¿Cómo planeas pagar?",
    buyZone: "¿En qué zona te gustaría comprar?",
    buyType: "¿Qué tipo de propiedad buscas?",
    buyConfirm: (data: any) => `Confirmemos tu búsqueda:\n\n• Nombre: ${data.name || "No proporcionado"}\n• WhatsApp: ${data.phone || "No proporcionado"}\n• Presupuesto: ${data.budget || "No especificado"}\n• Forma de pago: ${data.paymentMethod || "No especificada"}\n• Zona: ${data.zone || "No especificada"}\n• Tipo: ${data.propertyType || "No especificado"}\n\n¿Es correcta la información?`,
    buyComplete: (name: string) => `Perfecto, ${name || "amigo"}, registramos tu búsqueda de compra.\n\nUn asesor de HomesApp te contactará para mostrarte las mejores opciones.\n\n¿Te puedo ayudar con algo más?`,
    otherHelp: "¿En qué puedo ayudarte?\n\nPuedes contactarnos directamente:\nWhatsApp: +52 998 XXX XXXX\nHorario: Lunes a Viernes 9am - 6pm\n\n¿O prefieres que te ayude con alguna de estas opciones?",
    complete: (name: string) => `Perfecto, ${name || "amigo"}.\n\nCualquier duda extra puedes escribirme aquí. ¡Que tengas excelente día!`,
    error: "Lo siento, hubo un problema. ¿Podrías intentar de nuevo?",
    default: "¿En qué más puedo ayudarte?"
  },
  en: {
    greeting: {
      homesapp: "Hi! I'm the HomesApp assistant.\n\nAre you looking to rent, buy, or list your property?",
      trh: "Hi! I'm the Tulum Rental Homes assistant.\n\nI can help you with long-term rentals."
    },
    quickReplies: {
      rent: "I want to rent",
      buy: "I want to buy",
      owner: "I'm an owner",
      other: "I have a question",
      ownerRent: "Long-term rental",
      ownerSale: "Sale",
      confirm: "Yes, all correct",
      restart: "Edit info",
      more: "Yes, I have another question",
      done: "No, thanks",
      yes: "Yes",
      no: "No",
      immediate: "Immediately",
      oneMonth: "In 1 month",
      twoThreeMonths: "2-3 months",
      flexible: "Flexible",
      studio: "Studio",
      oneBed: "1 bedroom",
      twoBeds: "2 bedrooms",
      threePlusBeds: "3+ bedrooms",
      apartment: "Apartment",
      house: "House",
      land: "Land",
      penthouse: "Penthouse",
      cash: "Cash",
      mortgage: "Mortgage",
      undecided: "Not sure yet",
      changeLang: "Cambiar a español",
      otherZone: "Other area"
    },
    noVacation: "Right now we specialize in long-term rentals (6-12 months) and property sales.\n\nIf you're interested in those, I can help you.\n\nWould you like to rent long-term or buy?",
    ownerType: "Great, you're a property owner. I'll help you list your property.\n\nWould you like to rent it long-term with Tulum Rental Homes or sell it with HomesApp?",
    ownerRentName: "Excellent, we'll register your property for long-term rental.\n\nTo get started, what's your full name?",
    ownerSaleName: "Excellent, we'll register your property for sale with HomesApp.\n\nTo get started, what's your full name?",
    phoneAsk: (name: string) => `Nice to meet you${name ? `, ${name}` : ""}.\n\nCan you share your WhatsApp number so we can contact you?`,
    phoneRetry: "Please enter a valid number (10+ digits).\nExample: +52 998 123 4567",
    zoneAsk: "In which area is your property located?",
    propertyTypeAsk: "What type of property is it?",
    bedroomsAsk: "How many bedrooms does it have?",
    rentPriceAsk: "How much would you like to charge for monthly rent? (in MXN pesos)",
    salePriceAsk: "What's your desired sale price? (in MXN pesos or USD)",
    ownerRentConfirm: (data: any) => `Let's confirm your property details:\n\n• Owner: ${data.name || "Not provided"}\n• WhatsApp: ${data.phone || "Not provided"}\n• Area: ${data.zone || "Not specified"}\n• Type: ${data.propertyType || "Not specified"}\n• Bedrooms: ${data.bedrooms || "Not specified"}\n• Desired rent: ${data.desiredPrice || "Not specified"}\n\nIs this information correct?`,
    ownerSaleConfirm: (data: any) => `Let's confirm your property details:\n\n• Owner: ${data.name || "Not provided"}\n• WhatsApp: ${data.phone || "Not provided"}\n• Area: ${data.zone || "Not specified"}\n• Type: ${data.propertyType || "Not specified"}\n• Sale price: ${data.desiredPrice || "Not specified"}\n\nIs this information correct?`,
    ownerComplete: {
      rent: "Done! We've registered your property.\n\nA Tulum Rental Homes advisor will contact you soon.\n\nCan I help you with anything else?",
      sale: "Done! We've registered your property.\n\nA HomesApp sales advisor will contact you soon.\n\nCan I help you with anything else?"
    },
    rentName: "Great! I'll help you find your next home in Tulum.\n\nWhat's your name?",
    rentBudget: "What's your approximate monthly budget?",
    rentZone: "Which area would you like to live in?",
    rentMoveDate: "When are you looking to move in?",
    rentBedrooms: "How many bedrooms do you need?",
    rentPets: "Do you have pets?",
    rentConfirm: (data: any) => `Let's confirm your search:\n\n• Name: ${data.name || "Not provided"}\n• WhatsApp: ${data.phone || "Not provided"}\n• Budget: ${data.budget || "Not specified"}\n• Area: ${data.zone || "Not specified"}\n• Move-in: ${data.moveDate || "Not specified"}\n• Bedrooms: ${data.bedrooms || "Not specified"}\n• Pets: ${data.hasPets ? "Yes" : "No"}\n\nIs this information correct?`,
    rentComplete: (name: string) => `Done, ${name || "friend"}! We've registered your rental search.\n\nA Tulum Rental Homes advisor will contact you soon with options that match your profile.\n\nCan I help you with anything else?`,
    buyName: "Excellent! I'll help you find your ideal property in Tulum.\n\nWhat's your name?",
    buyBudget: "What's your approximate purchase budget?",
    buyPayment: "How do you plan to pay?",
    buyZone: "Which area would you like to buy in?",
    buyType: "What type of property are you looking for?",
    buyConfirm: (data: any) => `Let's confirm your search:\n\n• Name: ${data.name || "Not provided"}\n• WhatsApp: ${data.phone || "Not provided"}\n• Budget: ${data.budget || "Not specified"}\n• Payment method: ${data.paymentMethod || "Not specified"}\n• Area: ${data.zone || "Not specified"}\n• Type: ${data.propertyType || "Not specified"}\n\nIs this information correct?`,
    buyComplete: (name: string) => `Perfect, ${name || "friend"}! We've registered your purchase search.\n\nA HomesApp advisor will contact you to show you the best options.\n\nCan I help you with anything else?`,
    otherHelp: "How can I help you?\n\nYou can contact us directly:\nWhatsApp: +52 998 XXX XXXX\nHours: Monday to Friday 9am - 6pm\n\nOr would you like me to help you with one of these options?",
    complete: (name: string) => `Perfect, ${name || "friend"}.\n\nIf you have any other questions, feel free to write here. Have a great day!`,
    error: "Sorry, there was a problem. Could you try again?",
    default: "How else can I help you?"
  }
};

function detectLanguage(message: string): Language {
  const englishPatterns = [
    /\bi\s*(want|need|am|have|'m)\b/i,
    /\b(looking|search|find|rent|buy|sell|list|property|apartment|house|owner)\b/i,
    /\b(hello|hi|hey|yes|no|thanks|please|help)\b/i,
    /\b(bedroom|bathroom|budget|price|area|zone)\b/i,
    /\b(vacation|short-term|airbnb|long-term|invest)\b/i
  ];
  
  const spanishPatterns = [
    /\b(quiero|necesito|soy|tengo|busco)\b/i,
    /\b(rentar|comprar|vender|enlistar|propiedad|departamento|casa|propietario)\b/i,
    /\b(hola|sí|si|no|gracias|por favor|ayuda)\b/i,
    /\b(recámara|baño|presupuesto|precio|zona)\b/i,
    /\b(vacacional|temporal|corto plazo|largo plazo|invertir)\b/i
  ];
  
  let englishScore = 0;
  let spanishScore = 0;
  
  for (const pattern of englishPatterns) {
    if (pattern.test(message)) englishScore++;
  }
  
  for (const pattern of spanishPatterns) {
    if (pattern.test(message)) spanishScore++;
  }
  
  return englishScore > spanishScore ? "en" : "es";
}

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
    brand: metadata.brand,
    language: metadata.language || "es"
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
  
  if (lower.includes("change to english") || lower.includes("english")) {
    return "lang_en";
  }
  if (lower.includes("cambiar a español") || lower.includes("español")) {
    return "lang_es";
  }
  
  if (lower.includes("propietario") || lower.includes("tengo una propiedad") || 
      lower.includes("enlistar") || lower.includes("administren") || lower.includes("la renten") ||
      lower.includes("i'm an owner") || lower.includes("i have a property") || 
      lower.includes("list my property") || lower.includes("i am an owner")) {
    return "list_property";
  }
  if (lower.includes("comprar") || lower.includes("venta") || lower.includes("invertir") || 
      lower.includes("en venta") || lower.includes("quiero comprar") ||
      lower.includes("want to buy") || lower.includes("looking to buy") || 
      lower.includes("invest in") || lower.includes("buy a condo") || lower.includes("purchase")) {
    return "buy";
  }
  if (lower.includes("vacacional") || lower.includes("airbnb") || lower.includes("una semana") ||
      lower.includes("temporal") || lower.includes("corto plazo") || lower.includes("rent_short") ||
      lower.includes("vacation rental") || lower.includes("short-term") || lower.includes("short term") ||
      lower.includes("weekly") || lower.includes("airbnb")) {
    return "rent_short";
  }
  if (lower.includes("rentar") || lower.includes("renta") || lower.includes("alquilar") ||
      lower.includes("departamento") || lower.includes("rent_long") ||
      lower.includes("want to rent") || lower.includes("looking for") || lower.includes("need a rental") ||
      lower.includes("long-term") || lower.includes("long term") || lower.includes("apartment to rent")) {
    return "rent_long";
  }
  if (lower.includes("duda") || lower.includes("pregunta") || lower.includes("información") ||
      lower.includes("other") || lower.includes("solo estoy viendo") ||
      lower.includes("question") || lower.includes("just looking") || lower.includes("help")) {
    return "other";
  }
  
  return null;
}

function getNextStep(currentStep: ChatFlowStep, userResponse: string, state: ConversationState): ChatFlowStep {
  const intent = detectIntent(userResponse);
  
  if (intent === "lang_en" || intent === "lang_es") {
    return state.currentStep;
  }
  
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
      if (userResponse === "rent_long" || userResponse.toLowerCase().includes("rent") || userResponse.toLowerCase().includes("renta")) {
        return "rent_name";
      }
      if (userResponse === "buy" || userResponse.toLowerCase().includes("buy") || userResponse.toLowerCase().includes("compra")) {
        return "buy_name";
      }
      return "other_help";
      
    case "owner_type":
      if (userResponse === "owner_rent" || userResponse.toLowerCase().includes("rent") || userResponse.toLowerCase().includes("renta")) {
        return "owner_rent_name";
      }
      if (userResponse === "owner_sale" || userResponse.toLowerCase().includes("sale") || userResponse.toLowerCase().includes("venta")) {
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
      if (userResponse === "restart" || userResponse.toLowerCase().includes("corregir") || userResponse.toLowerCase().includes("edit")) {
        return "owner_rent_name";
      }
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
      if (userResponse === "restart" || userResponse.toLowerCase().includes("corregir") || userResponse.toLowerCase().includes("edit")) {
        return "owner_sale_name";
      }
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
      if (userResponse === "restart" || userResponse.toLowerCase().includes("corregir") || userResponse.toLowerCase().includes("edit")) {
        return "rent_name";
      }
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
      if (userResponse === "restart" || userResponse.toLowerCase().includes("corregir") || userResponse.toLowerCase().includes("edit")) {
        return "buy_name";
      }
      return "buy_complete";
      
    case "other_help":
      return "complete";
      
    default:
      return "complete";
  }
}

function getQuickReplies(lang: Language, type: string): QuickReply[] {
  const m = MESSAGES[lang].quickReplies;
  
  switch (type) {
    case "main":
      return [
        createQuickReply("rent_long", m.rent, "rent_long"),
        createQuickReply("buy", m.buy, "buy"),
        createQuickReply("list", m.owner, "list_property"),
        createQuickReply("other", m.other, "other"),
      ];
    case "noVacation":
      return [
        createQuickReply("rent_long", lang === "es" ? "Renta a largo plazo" : "Long-term rental", "rent_long"),
        createQuickReply("buy", lang === "es" ? "Comprar propiedad" : "Buy property", "buy"),
      ];
    case "ownerType":
      return [
        createQuickReply("owner_rent", m.ownerRent, "owner_rent"),
        createQuickReply("owner_sale", m.ownerSale, "owner_sale"),
      ];
    case "confirm":
      return [
        createQuickReply("confirm", m.confirm, "confirm"),
        createQuickReply("restart", m.restart, "restart"),
      ];
    case "more":
      return [
        createQuickReply("more", m.more, "other"),
        createQuickReply("done", m.done, "done"),
      ];
    case "yesNo":
      return [
        createQuickReply("yes", m.yes, "yes"),
        createQuickReply("no", m.no, "no"),
      ];
    case "moveDate":
      return [
        createQuickReply("immediate", m.immediate, lang === "es" ? "Inmediato" : "Immediately"),
        createQuickReply("1month", m.oneMonth, lang === "es" ? "En 1 mes" : "In 1 month"),
        createQuickReply("2-3months", m.twoThreeMonths, "2-3 months"),
        createQuickReply("flexible", m.flexible, lang === "es" ? "Flexible" : "Flexible"),
      ];
    case "bedrooms":
      return [
        createQuickReply("studio", m.studio, "0"),
        createQuickReply("1", m.oneBed, "1"),
        createQuickReply("2", m.twoBeds, "2"),
        createQuickReply("3+", m.threePlusBeds, "3+"),
      ];
    case "propertyType":
      return [
        createQuickReply("apartment", m.apartment, lang === "es" ? "departamento" : "apartment"),
        createQuickReply("house", m.house, lang === "es" ? "casa" : "house"),
        createQuickReply("penthouse", m.penthouse, "penthouse"),
      ];
    case "propertyTypeSale":
      return [
        createQuickReply("apartment", m.apartment, lang === "es" ? "departamento" : "apartment"),
        createQuickReply("house", m.house, lang === "es" ? "casa" : "house"),
        createQuickReply("land", m.land, lang === "es" ? "terreno" : "land"),
        createQuickReply("penthouse", m.penthouse, "penthouse"),
      ];
    case "payment":
      return [
        createQuickReply("cash", m.cash, "cash"),
        createQuickReply("mortgage", m.mortgage, "mortgage"),
        createQuickReply("undecided", m.undecided, "undecided"),
      ];
    case "zones":
      return [
        ...ZONES.map(z => createQuickReply(z, z, z)),
        createQuickReply("other", m.otherZone, lang === "es" ? "Otro" : "Other")
      ];
    case "rentBudget":
      return (lang === "es" ? RENT_BUDGET_RANGES_ES : RENT_BUDGET_RANGES_EN)
        .map(b => createQuickReply(b.value, b.label, b.value));
    case "buyBudget":
      return (lang === "es" ? BUY_BUDGET_RANGES_ES : BUY_BUDGET_RANGES_EN)
        .map(b => createQuickReply(b.value, b.label, b.value));
    default:
      return [];
  }
}

function getStepResponse(step: ChatFlowStep, state: ConversationState, brandName: string): ChatResponse {
  const lang = state.language;
  const m = MESSAGES[lang];
  const firstName = state.leadData.name?.split(" ")[0] || "";
  const brand = state.brand || "homesapp";
  
  const langSwitch = createQuickReply("lang", m.quickReplies.changeLang, lang === "es" ? "lang_en" : "lang_es");
  
  switch (step) {
    case "greeting":
      return {
        message: m.greeting[brand],
        quickReplies: [...getQuickReplies(lang, "main"), langSwitch],
        inputType: "none"
      };
      
    case "operation_type":
      return {
        message: lang === "es" ? "¿Qué te gustaría hacer?" : "What would you like to do?",
        quickReplies: [...getQuickReplies(lang, "main"), langSwitch],
        inputType: "none"
      };
      
    case "no_vacation_redirect":
      return {
        message: m.noVacation,
        quickReplies: getQuickReplies(lang, "noVacation"),
        inputType: "none"
      };

    case "owner_type":
      return {
        message: m.ownerType,
        quickReplies: getQuickReplies(lang, "ownerType"),
        inputType: "none"
      };
      
    case "owner_rent_name":
      return {
        message: m.ownerRentName,
        inputType: "text"
      };
      
    case "owner_rent_phone":
      if (state.retryCount > 0) {
        return { message: m.phoneRetry, inputType: "phone" };
      }
      return { message: m.phoneAsk(firstName), inputType: "phone" };
      
    case "owner_rent_zone":
      return {
        message: m.zoneAsk,
        quickReplies: getQuickReplies(lang, "zones"),
        inputType: "text"
      };
      
    case "owner_rent_type":
      return {
        message: m.propertyTypeAsk,
        quickReplies: getQuickReplies(lang, "propertyType"),
        inputType: "text"
      };
      
    case "owner_rent_bedrooms":
      return {
        message: m.bedroomsAsk,
        quickReplies: getQuickReplies(lang, "bedrooms"),
        inputType: "number"
      };
      
    case "owner_rent_price":
      return { message: m.rentPriceAsk, inputType: "text" };
      
    case "owner_rent_confirm":
      return {
        message: m.ownerRentConfirm(state.leadData),
        quickReplies: getQuickReplies(lang, "confirm"),
        inputType: "none"
      };
      
    case "owner_sale_name":
      return { message: m.ownerSaleName, inputType: "text" };
      
    case "owner_sale_phone":
      if (state.retryCount > 0) {
        return { message: m.phoneRetry, inputType: "phone" };
      }
      return { message: m.phoneAsk(firstName), inputType: "phone" };
      
    case "owner_sale_zone":
      return {
        message: m.zoneAsk,
        quickReplies: getQuickReplies(lang, "zones"),
        inputType: "text"
      };
      
    case "owner_sale_type":
      return {
        message: m.propertyTypeAsk,
        quickReplies: getQuickReplies(lang, "propertyTypeSale"),
        inputType: "text"
      };
      
    case "owner_sale_price":
      return { message: m.salePriceAsk, inputType: "text" };
      
    case "owner_sale_confirm":
      return {
        message: m.ownerSaleConfirm(state.leadData),
        quickReplies: getQuickReplies(lang, "confirm"),
        inputType: "none"
      };
      
    case "owner_complete":
      const ownerMsg = state.flowType === "owner_sale" ? m.ownerComplete.sale : m.ownerComplete.rent;
      return {
        message: ownerMsg,
        quickReplies: getQuickReplies(lang, "more"),
        inputType: "none",
        action: { type: "lead_created", data: { leadId: state.leadId } }
      };

    case "rent_name":
      return { message: m.rentName, inputType: "text" };
      
    case "rent_phone":
      if (state.retryCount > 0) {
        return { message: m.phoneRetry, inputType: "phone" };
      }
      return { message: m.phoneAsk(firstName), inputType: "phone" };
      
    case "rent_budget":
      return {
        message: m.rentBudget,
        quickReplies: getQuickReplies(lang, "rentBudget"),
        inputType: "text"
      };
      
    case "rent_zone":
      return {
        message: m.rentZone,
        quickReplies: getQuickReplies(lang, "zones"),
        inputType: "text"
      };
      
    case "rent_move_date":
      return {
        message: m.rentMoveDate,
        quickReplies: getQuickReplies(lang, "moveDate"),
        inputType: "text"
      };
      
    case "rent_bedrooms":
      return {
        message: m.rentBedrooms,
        quickReplies: getQuickReplies(lang, "bedrooms"),
        inputType: "number"
      };
      
    case "rent_pets":
      return {
        message: m.rentPets,
        quickReplies: getQuickReplies(lang, "yesNo"),
        inputType: "none"
      };
      
    case "rent_confirm":
      return {
        message: m.rentConfirm(state.leadData),
        quickReplies: getQuickReplies(lang, "confirm"),
        inputType: "none"
      };
      
    case "rent_complete":
      return {
        message: m.rentComplete(firstName),
        quickReplies: getQuickReplies(lang, "more"),
        inputType: "none",
        action: { type: "lead_created", data: { leadId: state.leadId } }
      };

    case "buy_name":
      return { message: m.buyName, inputType: "text" };
      
    case "buy_phone":
      if (state.retryCount > 0) {
        return { message: m.phoneRetry, inputType: "phone" };
      }
      return { message: m.phoneAsk(firstName), inputType: "phone" };
      
    case "buy_budget":
      return {
        message: m.buyBudget,
        quickReplies: getQuickReplies(lang, "buyBudget"),
        inputType: "text"
      };
      
    case "buy_payment":
      return {
        message: m.buyPayment,
        quickReplies: getQuickReplies(lang, "payment"),
        inputType: "none"
      };
      
    case "buy_zone":
      return {
        message: m.buyZone,
        quickReplies: getQuickReplies(lang, "zones"),
        inputType: "text"
      };
      
    case "buy_type":
      return {
        message: m.buyType,
        quickReplies: getQuickReplies(lang, "propertyTypeSale"),
        inputType: "text"
      };
      
    case "buy_confirm":
      return {
        message: m.buyConfirm(state.leadData),
        quickReplies: getQuickReplies(lang, "confirm"),
        inputType: "none"
      };
      
    case "buy_complete":
      return {
        message: m.buyComplete(firstName),
        quickReplies: getQuickReplies(lang, "more"),
        inputType: "none",
        action: { type: "lead_created", data: { leadId: state.leadId } }
      };

    case "other_help":
      return {
        message: m.otherHelp,
        quickReplies: getQuickReplies(lang, "main"),
        inputType: "text"
      };
      
    case "complete":
      return {
        message: m.complete(firstName),
        inputType: "none",
        action: { type: "complete" }
      };
      
    default:
      return {
        message: m.default,
        quickReplies: getQuickReplies(lang, "main"),
        inputType: "text"
      };
  }
}

function processUserInput(step: ChatFlowStep, input: string, state: ConversationState): ConversationState {
  const newState = { ...state };
  const intent = detectIntent(input);
  
  if (intent === "lang_en") {
    newState.language = "en";
    return newState;
  }
  if (intent === "lang_es") {
    newState.language = "es";
    return newState;
  }
  
  const detectedLang = detectLanguage(input);
  if (detectedLang !== state.language && !state.leadData.operationType) {
    newState.language = detectedLang;
  }
  
  switch (step) {
    case "greeting":
    case "operation_type":
      const opIntent = detectIntent(input) || input;
      newState.leadData.operationType = opIntent as any;
      if (opIntent === "list_property") {
        newState.flowType = undefined;
      } else if (opIntent === "buy") {
        newState.flowType = "buy";
      } else if (opIntent === "rent_long") {
        newState.flowType = "rent_long";
      }
      break;
      
    case "owner_type":
      if (input === "owner_rent" || input.toLowerCase().includes("rent") || input.toLowerCase().includes("renta")) {
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
      newState.leadData.hasPets = input.toLowerCase() === "yes" || input.toLowerCase() === "sí" || input.toLowerCase() === "si";
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
      rent_long: state.language === "en" ? "Tenant - Long-term rental" : "Inquilino - Renta larga",
      buy: state.language === "en" ? "Buyer" : "Comprador",
      owner_rent: state.language === "en" ? "Owner - Long-term rental" : "Propietario - Renta larga",
      owner_sale: state.language === "en" ? "Owner - Sale" : "Propietario - Venta",
      other: state.language === "en" ? "General inquiry" : "Información general"
    };

    const registrationType = state.flowType?.startsWith("owner") ? "seller" : "seller";
    const purpose = state.flowType === "buy" ? "comprador" : 
                    state.flowType === "rent_long" ? "cliente" :
                    state.flowType?.startsWith("owner") ? "propietario" : "cliente";

    const notesLines = [
      `Captured via public chatbot.`,
      `Type: ${flowTypeLabels[state.flowType || ""] || "Not specified"}`,
      `Language: ${state.language === "en" ? "English" : "Spanish"}`,
    ];
    
    if (state.leadData.budget) notesLines.push(`Budget: ${state.leadData.budget}`);
    if (state.leadData.zone) notesLines.push(`Zone: ${state.leadData.zone}`);
    if (state.leadData.propertyType) notesLines.push(`Property type: ${state.leadData.propertyType}`);
    if (state.leadData.bedrooms) notesLines.push(`Bedrooms: ${state.leadData.bedrooms}`);
    if (state.leadData.moveDate) notesLines.push(`Move-in date: ${state.leadData.moveDate}`);
    if (state.leadData.desiredPrice) notesLines.push(`Desired price: ${state.leadData.desiredPrice}`);
    if (state.leadData.paymentMethod) notesLines.push(`Payment method: ${state.leadData.paymentMethod}`);
    if (state.leadData.hasPets !== undefined) notesLines.push(`Pets: ${state.leadData.hasPets ? "Yes" : "No"}`);
    if (state.leadData.sourcePage) notesLines.push(`Source page: ${state.leadData.sourcePage}`);
    if (state.leadData.propertyId) notesLines.push(`Property of interest: ${state.leadData.propertyId}`);
    notesLines.push(`Conversation ID: ${conversationId}`);

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
      preferredLanguage: state.language,
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

    const prevStep = state.currentStep;
    state = processUserInput(state.currentStep, userMessage, state);
    
    const intent = detectIntent(userMessage);
    if (intent === "lang_en" || intent === "lang_es") {
      const { name: brandName } = getBrandName(context?.sourcePage);
      const response = getStepResponse(state.currentStep, state, brandName);
      
      const newUserMessage: ChatbotMessage = {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
        metadata: { step: state.currentStep }
      };
      
      const langChangedMsg = state.language === "en" 
        ? "Language changed to English. How can I help you?"
        : "Idioma cambiado a español. ¿En qué puedo ayudarte?";
      
      const newAssistantMessage: ChatbotMessage = {
        role: "assistant",
        content: langChangedMsg,
        timestamp: new Date().toISOString(),
        quickReplies: response.quickReplies,
        inputType: response.inputType,
        metadata: { step: state.currentStep, language: state.language }
      };

      const updatedMessages = [...messages, newUserMessage, newAssistantMessage];
      
      await storage.updatePublicChatbotConversation(conversationId, {
        messages: updatedMessages,
        metadata: state,
        lastMessageAt: new Date()
      });

      return {
        message: langChangedMsg,
        quickReplies: response.quickReplies,
        inputType: response.inputType
      };
    }

    const nextStep = getNextStep(prevStep, userMessage, state);
    
    if (shouldCreateLead(prevStep) && (userMessage.toLowerCase().includes("confirm") || userMessage.toLowerCase().includes("correcto") || userMessage === "confirm")) {
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
      metadata: { step: prevStep }
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
        flowType: state.flowType,
        language: state.language
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
    const lang = "es";
    return {
      message: MESSAGES[lang].error,
      inputType: "text"
    };
  }
}

export async function getWelcomeMessage(sourcePage?: string, language: Language = "es"): Promise<ChatbotMessage> {
  const { name: brandName, brand } = getBrandName(sourcePage);
  
  const initialState: ConversationState = {
    currentStep: "greeting",
    leadData: {},
    appointmentData: {},
    retryCount: 0,
    brand,
    language
  };
  
  const response = getStepResponse("greeting", initialState, brandName);
  
  return {
    role: "assistant",
    content: response.message,
    timestamp: new Date().toISOString(),
    quickReplies: response.quickReplies,
    inputType: response.inputType,
    metadata: { step: "greeting", brand, language }
  };
}

export async function createPublicChatConversation(
  agencyId: string, 
  sessionId: string,
  context?: { propertyId?: string; condominiumId?: string; sourcePage?: string; language?: Language }
): Promise<PublicChatbotConversation> {
  const language = context?.language || "es";
  const welcomeMessage = await getWelcomeMessage(context?.sourcePage, language);
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
    brand,
    language
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
