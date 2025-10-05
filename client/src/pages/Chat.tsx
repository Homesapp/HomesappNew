import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Paperclip, Key, Users, Headset, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import type { ChatConversation, ChatMessage } from "@shared/schema";

export default function Chat() {
  const { user } = useAuth();
  const { adminUser, isAdminAuthenticated } = useAdminAuth();
  const currentUser = isAdminAuthenticated ? adminUser : user;
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState(user?.role === "cliente" ? "appointment" : "rental");
  const [chatbotConversations, setChatbotConversations] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to WebSocket for real-time updates
  useChatWebSocket(selectedConversation);

  const { data: conversations = [], isLoading } = useQuery<ChatConversation[]>({
    queryKey: ["/api/chat/conversations", activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/chat/conversations?type=${activeTab}`);
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/conversations", selectedConversation, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/chat/conversations/${selectedConversation}/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  const startChatbotMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/chat/chatbot/start`, {});
    },
    onSuccess: (conversation) => {
      // Mark this conversation as a chatbot conversation in local state
      setChatbotConversations(prev => new Set(prev).add(conversation.id));
      setSelectedConversation(conversation.id);
      
      // Optimistically update the conversations cache
      queryClient.setQueryData(
        ["/api/chat/conversations", activeTab],
        (old: ChatConversation[] = []) => [conversation, ...old]
      );
      
      // Still invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", activeTab] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; message: string; senderId: string }) => {
      // Check local state first for chatbot conversations
      const isChatbotFromState = chatbotConversations.has(data.conversationId);
      
      // Fallback to checking conversation metadata if not in local state
      const conversation = conversations.find(c => c.id === data.conversationId);
      const isChatbotFromMeta = conversation?.isBot === true;
      
      const isChatbot = isChatbotFromState || isChatbotFromMeta;
      
      if (isChatbot) {
        // Use chatbot endpoint
        return await apiRequest("POST", `/api/chat/chatbot/message`, {
          conversationId: data.conversationId,
          message: data.message,
        });
      } else {
        // Use regular message endpoint
        return await apiRequest("POST", `/api/chat/messages`, data);
      }
    },
    onSuccess: () => {
      setMessage("");
    },
  });
  
  // Sync chatbot conversations from loaded conversations
  useEffect(() => {
    const chatbotConvIds = conversations
      .filter(c => c.isBot === true)
      .map(c => c.id);
    
    if (chatbotConvIds.length > 0) {
      setChatbotConversations(prev => {
        const updated = new Set(prev);
        chatbotConvIds.forEach(id => updated.add(id));
        return updated;
      });
    }
  }, [conversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedConversation || !currentUser?.id) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      message: message.trim(),
      senderId: currentUser.id,
    });
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      case "rental":
        return <Key className="h-4 w-4" />;
      case "internal":
        return <Users className="h-4 w-4" />;
      case "support":
        return <Headset className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-chat">Mensajes</h1>
          <p className="text-muted-foreground">
            Mantén conversaciones con inquilinos, equipo y soporte
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointment" className="flex items-center gap-2" data-testid="tab-appointment">
            <Calendar className="h-4 w-4" />
            Chat de Citas
          </TabsTrigger>
          <TabsTrigger value="rental" className="flex items-center gap-2" data-testid="tab-rental">
            <Key className="h-4 w-4" />
            Rentas en Curso
          </TabsTrigger>
          <TabsTrigger value="internal" className="flex items-center gap-2" data-testid="tab-internal">
            <Users className="h-4 w-4" />
            Chat Interno
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2" data-testid="tab-support">
            <Headset className="h-4 w-4" />
            HomesApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Conversaciones</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {/* Show chatbot button for clients in appointment tab */}
                  {activeTab === "appointment" && user?.role === "cliente" && (
                    <div className="p-4 border-b">
                      <Button 
                        onClick={() => startChatbotMutation.mutate()}
                        disabled={startChatbotMutation.isPending}
                        className="w-full"
                        variant="outline"
                        data-testid="button-start-chatbot"
                      >
                        <Headset className="h-4 w-4 mr-2" />
                        Iniciar Chat con Asistente Virtual
                      </Button>
                    </div>
                  )}
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No hay conversaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`w-full p-4 text-left hover-elevate transition-colors ${
                            selectedConversation === conversation.id ? "bg-accent" : ""
                          }`}
                          data-testid={`conversation-${conversation.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback>{getTabIcon(conversation.type)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{conversation.title}</p>
                                {conversation.lastMessageAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                      addSuffix: true,
                                      locale: es,
                                    })}
                                  </span>
                                )}
                              </div>
                              <Badge variant="outline" className="mt-1 capitalize">
                                {conversation.type === "appointment" && "Citas"}
                                {conversation.type === "rental" && "Renta"}
                                {conversation.type === "internal" && "Interno"}
                                {conversation.type === "support" && "Soporte"}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages Area */}
            <Card className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <CardTitle className="text-lg">
                      {conversations.find(c => c.id === selectedConversation)?.title || "Chat"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-12">
                            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No hay mensajes aún</p>
                            <p className="text-sm">Inicia la conversación</p>
                          </div>
                        ) : (
                          <>
                            {messages.map((msg) => {
                              const isBot = msg.isBot;
                              const isOwn = msg.senderId === currentUser?.id && !isBot;
                              
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                                  data-testid={`message-${msg.id}`}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className={isBot ? "bg-primary text-primary-foreground" : ""}>
                                      {isBot ? <Headset className="h-4 w-4" /> : getUserInitials(currentUser?.firstName || undefined)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                                    {isBot && (
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Asistente Virtual
                                      </p>
                                    )}
                                    <div
                                      className={`inline-block p-3 rounded-lg ${
                                        isOwn
                                          ? "bg-primary text-primary-foreground"
                                          : isBot
                                          ? "bg-accent text-accent-foreground border border-primary/20"
                                          : "bg-muted"
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatDistanceToNow(new Date(msg.createdAt), {
                                        addSuffix: true,
                                        locale: es,
                                      })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" data-testid="button-attach">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input
                          placeholder="Escribe un mensaje..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                          data-testid="input-message"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!message.trim() || sendMessageMutation.isPending}
                          data-testid="button-send"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Selecciona una conversación</p>
                    <p className="text-sm">Elige una conversación para empezar a chatear</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
