import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MessagesSquare, 
  Bot, 
  Users, 
  Building2, 
  Wrench,
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  User,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ExternalMessages() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if user is a seller (not admin) - sellers only see team tab
  const isSeller = user?.role === "external_agency_seller";
  const isAdmin = user?.role === "external_agency_admin";
  
  // Set default tab based on role - sellers default to team, admins to chatbot
  const [activeTab, setActiveTab] = useState(isSeller ? "team" : "chatbot");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const locale = language === "es" ? es : enUS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);
  
  // Ensure sellers can only access team tab
  useEffect(() => {
    if (isSeller && activeTab !== "team") {
      setActiveTab("team");
    }
  }, [isSeller, activeTab]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/external/chatbot/message", {
        message,
        conversationHistory: chatMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });
      return response.json();
    },
    onSuccess: (data) => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date()
        }
      ]);
      setIsTyping(false);
    },
    onError: (error: Error) => {
      setIsTyping(false);
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);
    chatMutation.mutate(userMessage.content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const quickPrompts = language === "es" ? [
    "¿Cuáles son las propiedades disponibles?",
    "¿Cómo puedo programar una visita?",
    "Explícame el proceso de renta",
    "¿Cuáles son los requisitos para rentar?"
  ] : [
    "What properties are available?",
    "How can I schedule a visit?",
    "Explain the rental process",
    "What are the requirements to rent?"
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <MessagesSquare className="h-7 w-7 text-primary" />
            {language === "es" ? "Centro de Mensajes" : "Message Center"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "es" 
              ? "Gestiona conversaciones con tu equipo, clientes y el asistente IA"
              : "Manage conversations with your team, clients, and AI assistant"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Sellers only see the Team tab, admins see all tabs */}
          {isSeller ? (
            <TabsList className="grid w-full grid-cols-1 h-auto gap-1">
              <TabsTrigger value="team" className="min-h-[44px] flex items-center gap-2" data-testid="tab-team">
                <Users className="h-4 w-4" />
                <span>{language === "es" ? "Equipo" : "Team"}</span>
              </TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-1">
              <TabsTrigger value="chatbot" className="min-h-[44px] flex items-center gap-2" data-testid="tab-chatbot">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "es" ? "Chatbot IA" : "AI Chatbot"}</span>
                <span className="sm:hidden">IA</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="min-h-[44px] flex items-center gap-2" data-testid="tab-team">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "es" ? "Equipo" : "Team"}</span>
                <span className="sm:hidden">{language === "es" ? "Equipo" : "Team"}</span>
              </TabsTrigger>
              <TabsTrigger value="owners" className="min-h-[44px] flex items-center gap-2" data-testid="tab-owners">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "es" ? "Propietarios" : "Owners"}</span>
                <span className="sm:hidden">{language === "es" ? "Props" : "Owners"}</span>
              </TabsTrigger>
              <TabsTrigger value="tenants" className="min-h-[44px] flex items-center gap-2" data-testid="tab-tenants">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "es" ? "Inquilinos" : "Tenants"}</span>
                <span className="sm:hidden">{language === "es" ? "Inq" : "Ten"}</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="min-h-[44px] flex items-center gap-2" data-testid="tab-maintenance">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "es" ? "Servicios" : "Services"}</span>
                <span className="sm:hidden">{language === "es" ? "Serv" : "Serv"}</span>
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="chatbot" className="mt-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {language === "es" ? "Asistente HomesApp" : "HomesApp Assistant"}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" 
                          ? "Prueba el chatbot IA desde aquí"
                          : "Test the AI chatbot from here"}
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearChat}
                    className="min-h-[44px]"
                    data-testid="button-clear-chat"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === "es" ? "Nueva conversación" : "New conversation"}
                  </Button>
                </div>
              </CardHeader>
              
              <Separator />
              
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Bot className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {language === "es" ? "¡Hola! Soy el asistente de HomesApp" : "Hi! I'm the HomesApp assistant"}
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        {language === "es"
                          ? "Prueba el chatbot IA que tus clientes verán en el sitio público. Puedes hacer preguntas sobre propiedades, proceso de renta, y más."
                          : "Test the AI chatbot that your clients will see on the public site. You can ask questions about properties, rental process, and more."}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                        {quickPrompts.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] text-sm"
                            onClick={() => {
                              setChatInput(prompt);
                            }}
                            data-testid={`button-quick-prompt-${index}`}
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(message.timestamp, "HH:mm", { locale })}
                            </p>
                          </div>
                          {message.role === "user" && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-secondary">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                <div className="p-4 border-t bg-background/95 backdrop-blur">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={language === "es" ? "Escribe tu mensaje..." : "Type your message..."}
                      className="flex-1 min-h-[44px]"
                      disabled={isTyping}
                      data-testid="input-chat-message"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!chatInput.trim() || isTyping}
                      className="min-h-[44px] min-w-[44px]"
                      data-testid="button-send-message"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === "es" ? "Mensajes del Equipo" : "Team Messages"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Comunicación interna con tu equipo de trabajo"
                    : "Internal communication with your team"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    {language === "es" ? "Próximamente" : "Coming Soon"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {language === "es"
                      ? "Pronto podrás comunicarte con tu equipo directamente desde aquí. Recibirás notificaciones de nuevos mensajes."
                      : "Soon you'll be able to communicate with your team directly from here. You'll receive notifications for new messages."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owners" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {language === "es" ? "Mensajes de Propietarios" : "Owner Messages"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Comunicación con los propietarios de unidades"
                    : "Communication with unit owners"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    {language === "es" ? "Próximamente" : "Coming Soon"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {language === "es"
                      ? "Aquí podrás ver y responder mensajes de los propietarios que administras."
                      : "Here you'll be able to view and respond to messages from the owners you manage."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {language === "es" ? "Mensajes de Inquilinos" : "Tenant Messages"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Comunicación con inquilinos actuales y potenciales"
                    : "Communication with current and potential tenants"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    {language === "es" ? "Próximamente" : "Coming Soon"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {language === "es"
                      ? "Aquí podrás gestionar conversaciones con tus inquilinos sobre contratos, mantenimiento y más."
                      : "Here you'll be able to manage conversations with your tenants about contracts, maintenance, and more."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  {language === "es" ? "Mensajes de Servicios" : "Service Messages"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Comunicación con proveedores de servicios y mantenimiento"
                    : "Communication with service and maintenance providers"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    {language === "es" ? "Próximamente" : "Coming Soon"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {language === "es"
                      ? "Aquí podrás coordinar con proveedores de servicios sobre tickets de mantenimiento y reparaciones."
                      : "Here you'll be able to coordinate with service providers about maintenance tickets and repairs."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
