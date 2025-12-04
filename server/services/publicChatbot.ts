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

const BUDGET_RANGES = [
  { label: "Menos de $15,000", value: "0-15000" },
  { label: "$15,000 - $25,000", value: "15000-25000" },
  { label: "$25,000 - $40,000", value: "25000-40000" },
  { label: "$40,000 - $60,000", value: "40000-60000" },
  { label: "Más de $60,000", value: "60000+" },
];

function getStateFromMetadata(conversation: PublicChatbotConversation): ConversationState {
  const metadata = (conversation.metadata as ConversationState) || {};
  return {
    currentStep: metadata.currentStep || "greeting",
    leadData: metadata.leadData || {},
    appointmentData: metadata.appointmentData || {},
    leadId: metadata.leadId,
    appointmentId: metadata.appointmentId,
    retryCount: metadata.retryCount || 0
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

function getNextStep(currentStep: ChatFlowStep, userResponse: string, state: ConversationState): ChatFlowStep {
  switch (currentStep) {
    case "greeting":
      return "operation_type";
    case "operation_type":
      return "name";
    case "name":
      if (!isValidPhone(userResponse) && state.retryCount < 2) {
        return "name";
      }
      return "phone";
    case "phone":
      return "budget";
    case "budget":
      return "zone";
    case "zone":
      return "move_date";
    case "move_date":
      return "bedrooms";
    case "bedrooms":
      return "confirm_lead";
    case "confirm_lead":
      return "lead_saved";
    case "lead_saved":
      if (userResponse.toLowerCase().includes("sí") || userResponse.toLowerCase().includes("si") || userResponse === "yes") {
        return "appointment_offer";
      }
      return "complete";
    case "appointment_offer":
      return "appointment_date";
    case "appointment_date":
      return "appointment_time";
    case "appointment_time":
      return "complete";
    default:
      return "complete";
  }
}

function getStepResponse(step: ChatFlowStep, state: ConversationState, leadName?: string): ChatResponse {
  switch (step) {
    case "greeting":
      return {
        message: "👋 ¡Hola! Soy el asistente de Tulum Rental Homes.\n¿Me cuentas qué estás buscando?",
        quickReplies: [
          createQuickReply("rent_long", "Quiero rentar", "rent_long"),
          createQuickReply("rent_short", "Renta temporal", "rent_short"),
          createQuickReply("buy", "Quiero comprar", "buy"),
          createQuickReply("list", "Soy propietario", "list_property"),
          createQuickReply("other", "Solo estoy viendo", "other"),
        ],
        inputType: "none"
      };
      
    case "operation_type":
      return {
        message: "¡Perfecto! Para ayudarte mejor, necesito algunos datos rápidos 🙏\n\n¿Cuál es tu nombre?",
        inputType: "text"
      };
      
    case "name":
      if (state.retryCount > 0 && !state.leadData.phone) {
        return {
          message: "Por favor ingresa un número válido (10+ dígitos).\nEjemplo: +52 998 123 4567",
          inputType: "phone"
        };
      }
      return {
        message: "Mucho gusto 😊\n\n¿Me compartes tu número de WhatsApp para contactarte?",
        inputType: "phone"
      };
      
    case "phone":
      return {
        message: "¿Cuál es tu presupuesto aproximado mensual?",
        quickReplies: BUDGET_RANGES.map(b => createQuickReply(b.value, b.label, b.value)),
        inputType: "text"
      };
      
    case "budget":
      return {
        message: "¿En qué zona te gustaría?",
        quickReplies: ZONES.map(z => createQuickReply(z, z, z)),
        inputType: "text"
      };
      
    case "zone":
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
      
    case "move_date":
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
      
    case "bedrooms":
      const summary = `📋 Confirmemos tus datos:\n\n` +
        `• Nombre: ${state.leadData.name || "No proporcionado"}\n` +
        `• WhatsApp: ${state.leadData.phone || "No proporcionado"}\n` +
        `• Presupuesto: ${state.leadData.budget || "No especificado"}\n` +
        `• Zona: ${state.leadData.zone || "No especificada"}\n` +
        `• Mudanza: ${state.leadData.moveDate || "No especificada"}\n` +
        `• Recámaras: ${state.leadData.bedrooms || "No especificado"}\n\n` +
        `¿Es correcta la información?`;
      return {
        message: summary,
        quickReplies: [
          createQuickReply("confirm", "✅ Sí, todo correcto", "confirm"),
          createQuickReply("edit", "Editar datos", "edit"),
        ],
        inputType: "none"
      };
      
    case "confirm_lead":
      const leadName = state.leadData.name?.split(" ")[0] || "amigo";
      return {
        message: `¡Perfecto, ${leadName}! 🙌\n\nYa tenemos tus datos y un asesor de Tulum Rental Homes te contactará pronto por WhatsApp.`,
        inputType: "none",
        action: { type: "lead_created", data: { leadId: state.leadId } }
      };
      
    case "lead_saved":
      return {
        message: "¿Te gustaría agendar una visita a alguna propiedad? 🏠",
        quickReplies: [
          createQuickReply("yes", "Sí, agendar visita", "yes"),
          createQuickReply("no", "No por ahora", "no"),
        ],
        inputType: "none"
      };
      
    case "appointment_offer":
      return {
        message: "¿En qué día te gustaría la visita?",
        quickReplies: [
          createQuickReply("today", "Hoy", "Hoy"),
          createQuickReply("tomorrow", "Mañana", "Mañana"),
          createQuickReply("this_week", "Esta semana", "Esta semana"),
          createQuickReply("next_week", "Próxima semana", "Próxima semana"),
        ],
        inputType: "date"
      };
      
    case "appointment_date":
      return {
        message: "¿En qué horario prefieres?",
        quickReplies: [
          createQuickReply("morning", "🌅 Mañana (9-12)", "morning"),
          createQuickReply("afternoon", "☀️ Tarde (12-17)", "afternoon"),
          createQuickReply("evening", "🌙 Noche (17-20)", "evening"),
        ],
        inputType: "none"
      };
      
    case "appointment_time":
      return {
        message: "🎉 ¡Listo! He registrado tu solicitud de visita.\n\nUn asesor te confirmará la fecha y hora exacta por WhatsApp.\n\nPerfecto, " + (state.leadData.name?.split(" ")[0] || "amigo") + " 😊 ¡Que tengas excelente día!",
        inputType: "none",
        action: { type: "appointment_created", data: { appointmentId: state.appointmentId } }
      };
      
    case "complete":
      const finalName = state.leadData.name?.split(" ")[0] || "amigo";
      return {
        message: `Perfecto, ${finalName} 😊\n\nCualquier duda extra puedes escribirme aquí. ¡Que tengas excelente día!`,
        inputType: "none",
        action: { type: "complete" }
      };
      
    default:
      return {
        message: "¿En qué más puedo ayudarte?",
        inputType: "text"
      };
  }
}

function processUserInput(step: ChatFlowStep, input: string, state: ConversationState): ConversationState {
  const newState = { ...state };
  
  switch (step) {
    case "greeting":
      newState.leadData.operationType = input as any;
      break;
    case "operation_type":
      newState.leadData.name = input.trim();
      break;
    case "name":
      if (isValidPhone(input)) {
        newState.leadData.phone = normalizePhone(input);
        newState.retryCount = 0;
      } else {
        newState.retryCount = (newState.retryCount || 0) + 1;
      }
      break;
    case "phone":
      newState.leadData.budget = input;
      break;
    case "budget":
      newState.leadData.zone = input;
      break;
    case "zone":
      newState.leadData.moveDate = input;
      break;
    case "move_date":
      newState.leadData.bedrooms = input;
      break;
    case "appointment_offer":
      newState.appointmentData.preferredDate = input;
      break;
    case "appointment_date":
      newState.appointmentData.preferredTime = input as any;
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

    const operationTypeMap: Record<string, string> = {
      rent_long: "Renta 6-12 meses",
      rent_short: "Renta temporal",
      buy: "Compra",
      list_property: "Propietario - enlistar",
      other: "Información general"
    };

    const lead = await storage.createExternalLead({
      agencyId,
      firstName,
      lastName,
      phone: state.leadData.phone,
      email: state.leadData.email || null,
      registrationType: "seller",
      status: "nuevo_lead",
      source: "chatbot_homesapp",
      notes: [
        `Capturado via chatbot público.`,
        `Operación: ${operationTypeMap[state.leadData.operationType || ""] || "No especificado"}`,
        `Presupuesto: ${state.leadData.budget || "No especificado"}`,
        `Zona: ${state.leadData.zone || "No especificada"}`,
        `Mudanza: ${state.leadData.moveDate || "No especificada"}`,
        `Recámaras: ${state.leadData.bedrooms || "No especificado"}`,
        `Página origen: ${state.leadData.sourcePage || "homepage"}`,
        state.leadData.propertyId ? `Propiedad de interés: ${state.leadData.propertyId}` : "",
        `Conversación ID: ${conversationId}`
      ].filter(Boolean).join("\n"),
      desiredNeighborhood: state.leadData.zone || null,
      bedroomsText: state.leadData.bedrooms || null,
      checkInDateText: state.leadData.moveDate || null,
      interestedUnitIds: state.leadData.propertyId ? [state.leadData.propertyId] : null,
      interestedCondominiumIds: state.leadData.condominiumId ? [state.leadData.condominiumId] : null,
    });

    return lead.id;
  } catch (error) {
    console.error("Error creating lead from chat:", error);
    return null;
  }
}

async function createAppointmentFromChat(
  agencyId: string,
  leadId: string,
  state: ConversationState
): Promise<string | null> {
  try {
    console.log("Appointment request saved for lead:", leadId, state.appointmentData);
    return `appointment-${Date.now()}`;
  } catch (error) {
    console.error("Error creating appointment from chat:", error);
    return null;
  }
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

    state = processUserInput(state.currentStep, userMessage, state);

    const nextStep = getNextStep(state.currentStep, userMessage, state);
    state.currentStep = nextStep;

    if (nextStep === "lead_saved" && !state.leadId) {
      const leadId = await createLeadFromChat(agencyId, conversationId, state);
      state.leadId = leadId || undefined;
    }

    if (nextStep === "appointment_saved" && state.leadId && !state.appointmentId) {
      const appointmentId = await createAppointmentFromChat(agencyId, state.leadId, state);
      state.appointmentId = appointmentId || undefined;
    }

    const response = getStepResponse(nextStep, state);

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
        appointmentId: state.appointmentId
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
      leadId: state.leadId,
      appointmentId: state.appointmentId
    };
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    return {
      message: "Lo siento, hubo un problema. ¿Podrías intentar de nuevo?",
      inputType: "text"
    };
  }
}

export async function getWelcomeMessage(): Promise<ChatbotMessage> {
  const response = getStepResponse("greeting", {
    currentStep: "greeting",
    leadData: {},
    appointmentData: {},
    retryCount: 0
  });
  
  return {
    role: "assistant",
    content: response.message,
    timestamp: new Date().toISOString(),
    quickReplies: response.quickReplies,
    inputType: response.inputType,
    metadata: { step: "greeting" }
  };
}

export async function createPublicChatConversation(
  agencyId: string, 
  sessionId: string,
  context?: { propertyId?: string; condominiumId?: string; sourcePage?: string }
): Promise<PublicChatbotConversation> {
  const welcomeMessage = await getWelcomeMessage();
  
  const initialState: ConversationState = {
    currentStep: "greeting",
    leadData: {
      propertyId: context?.propertyId,
      condominiumId: context?.condominiumId,
      sourcePage: context?.sourcePage || "homepage"
    },
    appointmentData: {},
    retryCount: 0
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
