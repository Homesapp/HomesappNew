import OpenAI from "openai";
import type { Property, User, PresentationCard, ChatbotConfig } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatbotContext {
  user: User;
  presentationCards?: PresentationCard[];
  availableProperties: Property[];
  config?: ChatbotConfig;
}

export interface ChatbotResponse {
  message: string;
  suggestedProperties?: Property[];
  actions?: {
    type: 'create_appointment' | 'suggest_property' | 'create_auto_suggestion';
    data: any;
  }[];
}

export async function processChatbotMessage(
  userMessage: string,
  context: ChatbotContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ChatbotResponse> {
  
  // Determine chatbot name based on user's preferred language
  const userLanguage = context.user.preferredLanguage || 'es';
  const chatbotName = userLanguage === 'en' ? 'Marco-AI' : 'Marco-IA';
  
  // Use custom system prompt from config if available, otherwise use default
  const defaultSystemPromptES = `Eres ${chatbotName}, el asistente virtual de HomesApp especializado en ayudar a clientes a encontrar su propiedad ideal en Tulum. Eres amigable, profesional y conversas de manera natural paso a paso.

Tu objetivo es:
1. Presentarte de manera cálida y preguntar el nombre del cliente
2. Entender qué tipo de propiedad busca (casa, departamento, villa, etc.)
3. Averiguar su presupuesto y preferencias (número de habitaciones, ubicación, amenidades)
4. Sugerir si quiere usar alguna de sus tarjetas de presentación existentes para recibir recomendaciones personalizadas
5. Ayudar a coordinar citas para ver propiedades que le interesen

Siempre sé conversacional, haz preguntas de una en una para que el cliente no se sienta abrumado, y muestra empatía. Cuando el cliente comparta información, confirma que la entendiste antes de pasar a la siguiente pregunta.`;

  const defaultSystemPromptEN = `You are ${chatbotName}, HomesApp's virtual assistant specialized in helping clients find their ideal property in Tulum. You are friendly, professional, and converse naturally step by step.

Your goal is to:
1. Introduce yourself warmly and ask for the client's name
2. Understand what type of property they're looking for (house, apartment, villa, etc.)
3. Find out their budget and preferences (number of bedrooms, location, amenities)
4. Suggest if they want to use any of their existing presentation cards to receive personalized recommendations
5. Help coordinate appointments to view properties they're interested in

Always be conversational, ask questions one at a time so the client doesn't feel overwhelmed, and show empathy. When the client shares information, confirm that you understood it before moving to the next question.`;

  const defaultSystemPrompt = userLanguage === 'en' ? defaultSystemPromptEN : defaultSystemPromptES;
  const baseSystemPrompt = context.config?.systemPrompt || defaultSystemPrompt;

  const systemPrompt = `${baseSystemPrompt}

Contexto del cliente:
- Nombre: ${context.user.firstName} ${context.user.lastName}
- Email: ${context.user.email}

${context.presentationCards && context.presentationCards.length > 0 ? `
Preferencias del cliente (Presentation Cards):
${context.presentationCards.map(card => `
- Presupuesto: ${card.minPrice} - ${card.maxPrice} MXN
- Recámaras: ${card.bedrooms || 'No especificado'}
- Baños: ${card.bathrooms || 'No especificado'}
- Ubicación preferida: ${card.location}
- Tipo de propiedad: ${card.propertyType}
- Modalidad: ${card.modality === 'rent' ? 'Renta' : card.modality === 'sale' ? 'Venta' : 'Renta o Venta'}
- Amenidades deseadas: ${card.amenities?.join(', ') || 'Ninguna especificada'}
- Requisitos adicionales: ${card.additionalRequirements || 'Ninguno'}
- Tiene mascotas: ${card.hasPets ? 'Sí' : 'No'}
`).join('\n')}
` : ''}

Propiedades disponibles (${context.availableProperties.length}):
${context.availableProperties.slice(0, 10).map(prop => `
- ID: ${prop.id}
- Título: ${prop.title}
- Precio: ${prop.price} ${prop.currency || 'MXN'}
- Ubicación: ${prop.colonyName ? `${prop.colonyName}, Tulum` : prop.location}
- Recámaras: ${prop.bedrooms}, Baños: ${prop.bathrooms}
- Área: ${prop.area} m²
- Amenidades: ${prop.amenities?.join(', ') || 'No especificadas'}
- Estado: ${prop.status === 'rent' ? 'En Renta' : prop.status === 'sale' ? 'En Venta' : 'Renta y Venta'}
${prop.description ? `- Descripción: ${prop.description.substring(0, 100)}...` : ''}
`).join('\n')}
${context.availableProperties.length > 10 ? `\n... y ${context.availableProperties.length - 10} propiedades más` : ''}

Instrucciones:
- Sé amigable, profesional y servicial
- Proporciona respuestas concisas y útiles
- Cuando sugieras propiedades, menciona por qué se ajustan a las necesidades del cliente
- Si el cliente quiere agendar una cita, confirma los detalles y ofrece ayuda
- Usa un tono conversacional y cercano
- Responde SIEMPRE en ${userLanguage === 'en' ? 'inglés' : 'español'}
- Si sugieres propiedades, proporciona los IDs en tu respuesta en formato JSON al final del mensaje usando esta estructura:
  SUGGESTED_PROPERTIES: [id1, id2, id3]

${userLanguage === 'en' 
  ? `Example response with suggestions:
"Hi! I found 3 properties that might interest you based on your preferences. The first is an apartment in Aldea Zama with 2 bedrooms, pool and parking. The second... [description]. Would you like to schedule a visit?

SUGGESTED_PROPERTIES: ["prop-id-1", "prop-id-2", "prop-id-3"]"`
  : `Ejemplo de respuesta con sugerencias:
"¡Hola! Encontré 3 propiedades que podrían interesarte según tus preferencias. La primera es un departamento en Aldea Zama con 2 recámaras, alberca y estacionamiento. La segunda... [descripción]. ¿Te gustaría agendar una visita?

SUGGESTED_PROPERTIES: ["prop-id-1", "prop-id-2", "prop-id-3"]"`}
`;

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 2048,
    });

    const assistantMessage = response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
    
    // Extract suggested properties from the response
    const suggestedPropertyIds: string[] = [];
    const propertyMatch = assistantMessage.match(/SUGGESTED_PROPERTIES:\s*\[(.*?)\]/);
    
    if (propertyMatch) {
      const idsString = propertyMatch[1];
      const ids = idsString.split(',').map(id => id.trim().replace(/"/g, '').replace(/'/g, ''));
      suggestedPropertyIds.push(...ids);
    }

    // Clean the message by removing the SUGGESTED_PROPERTIES tag
    const cleanMessage = assistantMessage.replace(/SUGGESTED_PROPERTIES:\s*\[.*?\]/, '').trim();

    // Get the actual property objects
    const suggestedProperties = context.availableProperties.filter(prop => 
      suggestedPropertyIds.includes(prop.id)
    );

    const actions: ChatbotResponse['actions'] = [];

    // If we have suggested properties, create an action to store them
    if (suggestedProperties.length > 0) {
      actions.push({
        type: 'suggest_property',
        data: {
          propertyIds: suggestedProperties.map(p => p.id)
        }
      });
    }

    return {
      message: cleanMessage,
      suggestedProperties,
      actions
    };

  } catch (error) {
    console.error('Error processing chatbot message:', error);
    return {
      message: "Disculpa, tuve un problema procesando tu mensaje. Por favor, intenta de nuevo.",
      suggestedProperties: [],
      actions: []
    };
  }
}

export async function generatePropertyRecommendations(
  presentationCard: PresentationCard,
  availableProperties: Property[]
): Promise<{ propertyId: string; matchScore: number; matchReasons: string[] }[]> {
  
  const systemPrompt = `Eres un experto en matching de propiedades inmobiliarias. Tu tarea es analizar las preferencias de un cliente y sugerir las mejores propiedades que se ajusten a sus necesidades.

Preferencias del cliente:
- Presupuesto: ${presentationCard.minPrice} - ${presentationCard.maxPrice} MXN
- Recámaras: ${presentationCard.bedrooms || 'No especificado'}
- Baños: ${presentationCard.bathrooms || 'No especificado'}
- Ubicación preferida: ${presentationCard.location}
- Tipo de propiedad: ${presentationCard.propertyType}
- Modalidad: ${presentationCard.modality === 'rent' ? 'Renta' : presentationCard.modality === 'sale' ? 'Venta' : 'Renta o Venta'}
- Amenidades deseadas: ${presentationCard.amenities?.join(', ') || 'Ninguna'}
- Requisitos adicionales: ${presentationCard.additionalRequirements || 'Ninguno'}
- Tiene mascotas: ${presentationCard.hasPets ? 'Sí' : 'No'}

Propiedades disponibles:
${availableProperties.map(prop => `
ID: ${prop.id}
Título: ${prop.title}
Precio: ${prop.price} ${prop.currency || 'MXN'}
Ubicación: ${prop.colonyName || prop.location}
Recámaras: ${prop.bedrooms}, Baños: ${prop.bathrooms}
Área: ${prop.area} m²
Amenidades: ${prop.amenities?.join(', ') || 'No especificadas'}
`).join('\n---\n')}

Analiza cada propiedad y devuelve un JSON con las siguientes propiedades que mejor se ajustan (máximo 5):
{
  "recommendations": [
    {
      "propertyId": "id-de-la-propiedad",
      "matchScore": 85,
      "matchReasons": ["Precio dentro del presupuesto", "Tiene las amenidades deseadas", "Ubicación en colonia preferida"]
    }
  ]
}

El matchScore debe ser un número del 0 al 100 indicando qué tan bien se ajusta la propiedad.
Ordena las recomendaciones de mayor a menor matchScore.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Por favor, analiza las propiedades y dame las mejores recomendaciones.' }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recommendations":[]}');
    return result.recommendations || [];

  } catch (error) {
    console.error('Error generating property recommendations:', error);
    return [];
  }
}
