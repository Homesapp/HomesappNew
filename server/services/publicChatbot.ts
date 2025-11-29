import OpenAI from "openai";
import { storage } from "../storage";
import type { ChatbotMessage, PublicChatbotConversation, ExternalUnit, ExternalLead } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o-mini"; // Using mini for cost efficiency on high-volume public chat

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const SYSTEM_PROMPT = `Eres MAYA, la asistente virtual de Tulum Rental Homes, una agencia inmobiliaria especializada en propiedades de lujo en Tulum, Quintana Roo, México.

Tu personalidad:
- Amable, profesional y conocedora del mercado inmobiliario de Tulum
- Respondes en español por defecto, pero puedes cambiar a inglés si el cliente lo prefiere
- Eres concisa pero informativa
- Muestras entusiasmo genuino por ayudar a encontrar la propiedad perfecta

Tus capacidades:
1. RECOMENDAR PROPIEDADES: Puedes buscar y recomendar propiedades según las preferencias del cliente (presupuesto, tipo, número de recámaras, zona, etc.)
2. CAPTURAR LEADS: Puedes recopilar información de contacto del cliente para seguimiento
3. AGENDAR CITAS: Puedes coordinar citas para ver propiedades
4. GENERAR TARJETAS: Puedes crear tarjetas de presentación personalizadas con propiedades seleccionadas

Reglas importantes:
- Si el cliente pregunta por propiedades, pide sus preferencias (presupuesto, tipo, zona)
- Siempre intenta obtener el nombre y contacto del cliente de forma natural
- Sugiere agendar una cita si hay interés real
- Mantén respuestas cortas (máximo 3-4 oraciones)
- Si no sabes algo específico, ofrece conectar al cliente con un agente humano

Zonas disponibles en Tulum:
- Aldea Zama: Exclusiva zona residencial con acceso a cenotes
- Holistika: Desarrollo ecológico y wellness
- Veleta: Zona en crecimiento con excelente inversión
- La Veleta: Área residencial tranquila
- Región 15: Zona emergente con precios accesibles
- Centro: Corazón del pueblo mágico

Cuando el usuario proporcione información de contacto o muestre interés claro, responde con un JSON en el siguiente formato al final de tu mensaje:
{"action": "capture_lead", "name": "nombre", "email": "email", "phone": "telefono", "preferences": "preferencias"}

Cuando el usuario quiera ver propiedades específicas, responde con:
{"action": "recommend_properties", "filters": {"minPrice": 0, "maxPrice": 0, "bedrooms": 0, "zone": "zona", "type": "rent|sale"}}

Cuando el usuario quiera agendar una cita, responde con:
{"action": "schedule_appointment", "date": "YYYY-MM-DD", "time": "HH:MM", "propertyId": "id"}`;

interface ChatResponse {
  message: string;
  action?: {
    type: "recommend_properties" | "capture_lead" | "schedule_appointment" | "generate_card";
    data?: any;
  };
  properties?: any[];
  leadId?: string;
  appointmentId?: string;
}

export async function processPublicChatMessage(
  conversationId: string,
  userMessage: string,
  agencyId: string
): Promise<ChatResponse> {
  try {
    const conversation = await storage.getPublicChatbotConversation(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const messages = (conversation.messages as ChatbotMessage[]) || [];
    
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: ChatbotMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content
      })),
      { role: "user", content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu mensaje. ¿Podrías intentar de nuevo?";
    
    const newUserMessage: ChatbotMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    const newAssistantMessage: ChatbotMessage = {
      role: "assistant",
      content: assistantMessage,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, newUserMessage, newAssistantMessage];
    
    await storage.updatePublicChatbotConversation(conversationId, {
      messages: updatedMessages,
      lastMessageAt: new Date()
    });

    const response: ChatResponse = {
      message: assistantMessage
    };

    const actionMatch = assistantMessage.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[0]);
        
        if (actionData.action === "recommend_properties") {
          const properties = await getPropertyRecommendations(agencyId, actionData.filters || {});
          response.properties = properties;
          response.action = { type: "recommend_properties", data: actionData.filters };
          response.message = assistantMessage.replace(actionMatch[0], "").trim();
        }
        
        if (actionData.action === "capture_lead") {
          const leadResult = await captureLeadFromChat(agencyId, conversationId, actionData);
          if (leadResult) {
            response.leadId = leadResult.id;
            response.action = { type: "capture_lead", data: { leadId: leadResult.id } };
            
            await storage.updatePublicChatbotConversation(conversationId, {
              convertedToLeadId: leadResult.id,
              visitorName: actionData.name,
              visitorEmail: actionData.email,
              visitorPhone: actionData.phone
            });
          }
          response.message = assistantMessage.replace(actionMatch[0], "").trim();
        }
        
        if (actionData.action === "schedule_appointment") {
          response.action = { type: "schedule_appointment", data: actionData };
          response.message = assistantMessage.replace(actionMatch[0], "").trim();
        }
      } catch (parseError) {
        console.log("Action JSON parse error (non-critical):", parseError);
      }
    }

    return response;
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    throw error;
  }
}

async function getPropertyRecommendations(agencyId: string, filters: any): Promise<any[]> {
  try {
    const result = await storage.getExternalUnits({
      agencyId,
      status: "active",
      publishToMain: true,
      publishStatus: "approved",
      limit: 6,
      offset: 0
    });

    return (result.data || []).map((unit: ExternalUnit) => ({
      id: unit.id,
      title: unit.unitNumber ? `${unit.condominiumName || ""} - ${unit.unitNumber}` : (unit.condominiumName || "Propiedad"),
      location: unit.zone || "Tulum",
      price: unit.rentPrice || unit.salePrice || 0,
      bedrooms: unit.bedrooms || 0,
      bathrooms: unit.bathrooms || 0,
      type: unit.rentPrice ? "rent" : "sale",
      image: unit.photos?.[0] || null
    }));
  } catch (error) {
    console.error("Error getting property recommendations:", error);
    return [];
  }
}

async function captureLeadFromChat(
  agencyId: string, 
  conversationId: string, 
  data: { name?: string; email?: string; phone?: string; preferences?: string }
): Promise<ExternalLead | null> {
  try {
    if (!data.name && !data.email && !data.phone) {
      return null;
    }

    const lead = await storage.createExternalLead({
      agencyId,
      name: data.name || "Visitante Web",
      email: data.email || null,
      phone: data.phone || null,
      source: "chatbot",
      status: "new",
      type: "buyer",
      notes: `Capturado via chatbot. Preferencias: ${data.preferences || "No especificadas"}. Conversación ID: ${conversationId}`,
      budget: null,
      preferredZone: null,
      preferredPropertyType: null,
      assignedSellerId: null
    });

    return lead;
  } catch (error) {
    console.error("Error capturing lead from chat:", error);
    return null;
  }
}

export async function getWelcomeMessage(): Promise<string> {
  return "¡Hola! Soy Maya, tu asistente virtual de Tulum Rental Homes. ¿Estás buscando rentar o comprar una propiedad en Tulum? Cuéntame qué tipo de propiedad te interesa y te ayudo a encontrar las mejores opciones.";
}

export async function createPublicChatConversation(agencyId: string, sessionId: string): Promise<PublicChatbotConversation> {
  const welcomeMessage = await getWelcomeMessage();
  
  const initialMessages: ChatbotMessage[] = [{
    role: "assistant",
    content: welcomeMessage,
    timestamp: new Date().toISOString()
  }];

  const conversation = await storage.createPublicChatbotConversation({
    agencyId,
    sessionId,
    messages: initialMessages,
    status: "active",
    lastMessageAt: new Date()
  });

  return conversation;
}
