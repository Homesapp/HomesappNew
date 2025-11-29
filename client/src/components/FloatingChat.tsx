import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ChatAction = {
  type: "lead" | "appointment" | "presentation" | null;
  data?: Record<string, unknown>;
};

const chatPrompts = [
  "Hola, escríbeme",
  "¿Buscas propiedad?",
  "Te ayudo a encontrar",
  "Agenda una cita",
  "¿Tienes dudas?",
];

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isMounted, setIsMounted] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Rotate prompts and show/hide bubble
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
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const startConversation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/public/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error("Failed to start conversation");

      const data = await response.json();
      setConversationId(data.conversationId);
      
      const parsedMessages = (data.messages || []).map((msg: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
      }));
      
      setMessages(parsedMessages);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "¡Hola! Soy tu asistente virtual de HomesApp. ¿Cómo puedo ayudarte hoy? Puedo recomendarte propiedades, programar citas o responder tus preguntas sobre el mercado inmobiliario en Tulum.",
        timestamp: new Date(),
      }]);
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

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/public/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: userMessage.content,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.action?.type) {
        handleChatAction(data.action);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAction = (action: ChatAction) => {
    if (!action.type) return;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isMounted) return null;

  const chatContent = (
    <div className="fixed bottom-6 right-6 z-[9999]" style={{ position: 'fixed' }}>
      {!isOpen && (
        <div className="relative">
          {/* Speech bubble with animation */}
          <div 
            className={`absolute bottom-full right-0 mb-2 transition-all duration-300 ${
              showBubble ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="bg-white dark:bg-gray-800 text-foreground px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap border animate-bounce-gentle">
              <span>{chatPrompts[currentPromptIndex]}</span>
              {/* Triangle pointer */}
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
          className="w-[350px] max-w-[calc(100vw-48px)] h-[480px] max-h-[calc(100vh-100px)] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          data-testid="container-chat"
        >
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">HomesApp</h3>
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

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                  data-testid={`message-${message.role}-${message.id}`}
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

          <div className="p-3 border-t">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                className="flex-1 min-h-[44px] px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="min-w-[44px] min-h-[44px]"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(chatContent, document.body);
}
