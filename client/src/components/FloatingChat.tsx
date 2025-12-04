import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, Send, Loader2, Home, ShoppingBag, Building2, Eye, Phone, Calendar, MapPin, Bed } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatbotMessage, QuickReply } from "@shared/schema";

interface FloatingChatProps {
  propertyId?: string;
  condominiumId?: string;
  sourcePage?: string;
}

const chatPrompts = [
  "Hola, escríbeme",
  "¿Buscas propiedad?",
  "Te ayudo a encontrar",
  "Agenda una cita",
  "¿Tienes dudas?",
];

const quickReplyIcons: Record<string, typeof Home> = {
  rent_long: Home,
  rent_short: Calendar,
  buy: ShoppingBag,
  list_property: Building2,
  other: Eye,
};

export function FloatingChat({ propertyId, condominiumId, sourcePage = "homepage" }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isMounted, setIsMounted] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<QuickReply[]>([]);
  const [currentInputType, setCurrentInputType] = useState<string>("text");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) return;
    
    const interval = setInterval(() => {
      setShowBubble(false);
      setTimeout(() => {
        setCurrentPromptIndex((prev) => (prev + 1) % chatPrompts.length);
        setShowBubble(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && currentInputType !== "none") {
      inputRef.current.focus();
    }
  }, [isOpen, currentInputType]);

  const startConversation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/public/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId,
          propertyId,
          condominiumId,
          sourcePage
        }),
      });

      if (!response.ok) throw new Error("Failed to start conversation");

      const data = await response.json();
      setConversationId(data.conversationId);
      
      const parsedMessages = (data.messages || []) as ChatbotMessage[];
      setMessages(parsedMessages);
      
      const lastMessage = parsedMessages[parsedMessages.length - 1];
      if (lastMessage) {
        setCurrentQuickReplies(lastMessage.quickReplies || []);
        setCurrentInputType(lastMessage.inputType || "text");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      setMessages([{
        role: "assistant",
        content: "👋 ¡Hola! Soy el asistente de Tulum Rental Homes.\n¿Me cuentas qué estás buscando?",
        timestamp: new Date().toISOString(),
        quickReplies: [
          { id: "rent_long", label: "Quiero rentar", value: "rent_long" },
          { id: "rent_short", label: "Renta temporal", value: "rent_short" },
          { id: "buy", label: "Quiero comprar", value: "buy" },
          { id: "list", label: "Soy propietario", value: "list_property" },
          { id: "other", label: "Solo estoy viendo", value: "other" },
        ],
        inputType: "none"
      }]);
      setCurrentQuickReplies([
        { id: "rent_long", label: "Quiero rentar", value: "rent_long" },
        { id: "rent_short", label: "Renta temporal", value: "rent_short" },
        { id: "buy", label: "Quiero comprar", value: "buy" },
        { id: "list", label: "Soy propietario", value: "list_property" },
        { id: "other", label: "Solo estoy viendo", value: "other" },
      ]);
      setCurrentInputType("none");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!conversationId && messages.length === 0) {
      startConversation();
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: ChatbotMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setCurrentQuickReplies([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/public/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          propertyId,
          condominiumId,
          sourcePage
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      const assistantMessage: ChatbotMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
        quickReplies: data.quickReplies,
        inputType: data.inputType
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentQuickReplies(data.quickReplies || []);
      setCurrentInputType(data.inputType || "text");
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatbotMessage = {
        role: "assistant",
        content: "Lo siento, hubo un problema. ¿Podrías intentar de nuevo?",
        timestamp: new Date().toISOString(),
        inputType: "text"
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentInputType("text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInputPlaceholder = () => {
    switch (currentInputType) {
      case "phone": return "+52 998 123 4567";
      case "date": return "Ej: En 2 semanas";
      case "number": return "Ej: 2";
      default: return "Escribe tu respuesta...";
    }
  };

  const getInputMode = (): "text" | "tel" | "numeric" => {
    switch (currentInputType) {
      case "phone": return "tel";
      case "number": return "numeric";
      default: return "text";
    }
  };

  if (!isMounted) return null;

  const chatContent = (
    <div className="fixed bottom-6 right-6 z-[9999]" style={{ position: 'fixed' }}>
      {!isOpen && (
        <div className="relative">
          <div 
            className={`absolute bottom-full right-0 mb-2 transition-all duration-300 ${
              showBubble ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="bg-white dark:bg-gray-800 text-foreground px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap border animate-bounce-gentle">
              <span>{chatPrompts[currentPromptIndex]}</span>
              <div className="absolute top-full right-5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-gray-800" />
            </div>
          </div>
          <button
            onClick={handleOpen}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover-elevate active-elevate-2 transition-transform animate-pulse-subtle"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            data-testid="button-open-chat"
            aria-label="Abrir chat"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
      )}

      {isOpen && (
        <div 
          className="w-[350px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-100px)] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          data-testid="container-chat"
        >
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Tulum Rental Homes</h3>
                <p className="text-xs opacity-80">Asistente Virtual</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-close-chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {currentQuickReplies.length > 0 && !isLoading && (
            <div className="px-3 pb-2">
              <div className="flex flex-wrap gap-2">
                {currentQuickReplies.map((reply) => {
                  const IconComponent = quickReplyIcons[reply.value] || MessageCircle;
                  return (
                    <Button
                      key={reply.id}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-8 gap-1.5"
                      onClick={() => handleQuickReply(reply)}
                      data-testid={`button-quick-reply-${reply.id}`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {reply.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {currentInputType !== "none" && (
            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type={currentInputType === "phone" ? "tel" : "text"}
                  inputMode={getInputMode()}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={getInputPlaceholder()}
                  className="flex-1 min-h-[44px] px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="min-w-[44px] min-h-[44px]"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(chatContent, document.body);
}

export default FloatingChat;
