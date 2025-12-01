import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  Clock,
  Image as ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  X,
  Play,
  Pause,
  Trophy,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  FileText,
  Home,
  Gift,
  Award,
  ChevronRight,
  Activity
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface ChatMessage {
  id: string;
  agencyId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatarUrl: string | null;
  messageType: 'text' | 'image' | 'audio' | 'file' | 'system_activity';
  content: string | null;
  activityLogId: string | null;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  attachments?: ChatAttachment[];
}

interface ChatAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  publicUrl: string | null;
  audioDuration: number | null;
  imageWidth: number | null;
  imageHeight: number | null;
}

interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actionType: string;
  subjectType: string;
  subjectId: string;
  subjectName: string;
  subjectInfo: any;
  pointsAwarded: number;
  createdAt: string;
}

interface SellerPoints {
  sellerId: string;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  leadsRegistered: number;
  offersSent: number;
  rentalFormsSent: number;
  ownersRegistered: number;
  rentalsCompleted: number;
  currentRank: number;
  sellerName?: string;
  sellerEmail?: string;
  sellerAvatar?: string;
}

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture: string;
  role: string;
  status: string;
  createdAt: string;
  points: {
    totalPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    leadsRegistered: number;
    offersSent: number;
    rentalFormsSent: number;
    ownersRegistered: number;
    rentalsCompleted: number;
    currentRank: number;
  } | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ExternalMessages() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isSeller = user?.role === "external_agency_seller";
  const isAdmin = user?.role === "external_agency_admin";
  
  const [activeTab, setActiveTab] = useState(isSeller ? "team" : "chatbot");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [teamChatInput, setTeamChatInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const teamMessagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const locale = language === "es" ? es : enUS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollTeamToBottom = () => {
    teamMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (isSeller && activeTab !== "team") {
      setActiveTab("team");
    }
  }, [isSeller, activeTab]);

  // Fetch team chat messages with polling
  const { data: teamMessages, isLoading: loadingTeamMessages } = useQuery<ChatMessage[]>({
    queryKey: ['/api/external/chat/messages'],
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: activeTab === 'team',
  });

  useEffect(() => {
    if (teamMessages) {
      scrollTeamToBottom();
    }
  }, [teamMessages]);

  // Fetch leaderboard
  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery<SellerPoints[]>({
    queryKey: ['/api/external/chat/points/leaderboard'],
    enabled: showLeaderboard,
  });

  // Fetch sellers list (admin only)
  const { data: sellers } = useQuery<Seller[]>({
    queryKey: ['/api/external/chat/sellers'],
    enabled: isAdmin,
  });

  // Fetch my points
  const { data: myPoints } = useQuery<SellerPoints>({
    queryKey: ['/api/external/chat/points/my-points'],
    enabled: activeTab === 'team',
  });

  // Send team chat message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; messageType?: string }) => {
      const response = await apiRequest("POST", "/api/external/chat/messages", data);
      return response.json();
    },
    onSuccess: () => {
      setTeamChatInput("");
      queryClient.invalidateQueries({ queryKey: ['/api/external/chat/messages'] });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Upload attachment
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/external/chat/attachments', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      setSelectedImage(null);
      setImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ['/api/external/chat/messages'] });
      toast({
        title: language === "es" ? "Archivo enviado" : "File sent",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // AI Chatbot mutation
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

  const handleSendTeamMessage = () => {
    if (!teamChatInput.trim()) return;
    sendMessageMutation.mutate({ content: teamChatInput.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTeamKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendTeamMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: language === "es" ? "Archivo muy grande" : "File too large",
          description: language === "es" ? "El límite es 10MB" : "Limit is 10MB",
          variant: "destructive"
        });
        return;
      }
      
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
      } else if (file.type.startsWith('audio/')) {
        uploadAttachmentMutation.mutate(file);
      }
    }
  };

  const handleSendImage = () => {
    if (selectedImage) {
      uploadAttachmentMutation.mutate(selectedImage);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        uploadAttachmentMutation.mutate(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo acceder al micrófono" : "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'lead_registered':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'offer_sent':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'rental_form_sent':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'owner_registered':
        return <Home className="h-4 w-4 text-orange-500" />;
      case 'rental_completed':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityMessage = (msg: ChatMessage) => {
    const content = msg.content || '';
    if (content.includes('registró')) {
      return content;
    }
    
    const actionMessages: Record<string, { es: string; en: string }> = {
      lead_registered: { es: 'registró un nuevo lead', en: 'registered a new lead' },
      offer_sent: { es: 'envió una oferta', en: 'sent an offer' },
      rental_form_sent: { es: 'envió un formato de renta', en: 'sent a rental form' },
      owner_registered: { es: 'registró un nuevo propietario', en: 'registered a new owner' },
      rental_completed: { es: 'completó una renta', en: 'completed a rental' },
    };
    
    return content || (language === 'es' ? 'realizó una acción' : 'performed an action');
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, { es: string; en: string }> = {
      'external_agency_admin': { es: 'Admin', en: 'Admin' },
      'external_agency_seller': { es: 'Vendedor', en: 'Seller' },
      'external_agency_staff': { es: 'Staff', en: 'Staff' },
    };
    return roles[role]?.[language] || role;
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

  // Render team chat message
  const renderTeamMessage = (message: ChatMessage) => {
    const isOwnMessage = message.senderId === user?.id;
    const isSystemMessage = message.messageType === 'system_activity';

    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-3">
          <div className="bg-muted/50 rounded-full px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span className="font-medium">{message.senderName}</span>
            <span>{getActivityMessage(message)}</span>
            {message.activityLogId && (
              <Badge variant="secondary" className="ml-1 text-xs">
                +{10} pts
              </Badge>
            )}
          </div>
        </div>
      );
    }

    return (
      <div 
        key={message.id} 
        className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      >
        {!isOwnMessage && (
          <Avatar 
            className="h-9 w-9 cursor-pointer hover-elevate" 
            onClick={() => {
              if (isAdmin && sellers) {
                const seller = sellers.find(s => s.id === message.senderId);
                if (seller) {
                  setSelectedSeller(seller);
                  setShowSellerProfile(true);
                }
              }
            }}
          >
            {message.senderAvatarUrl ? (
              <AvatarImage src={message.senderAvatarUrl} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              {message.senderName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{message.senderName}</span>
              <Badge variant="outline" className="text-xs py-0">
                {getRoleLabel(message.senderRole)}
              </Badge>
            </div>
          )}
          
          <div className={`rounded-lg p-3 ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            {message.messageType === 'image' && message.attachments?.[0] && (
              <img 
                src={message.attachments[0].publicUrl || ''} 
                alt={message.attachments[0].fileName}
                className="max-w-full rounded-md mb-2 cursor-pointer"
                onClick={() => window.open(message.attachments![0].publicUrl || '', '_blank')}
              />
            )}
            
            {message.messageType === 'audio' && message.attachments?.[0] && (
              <audio 
                controls 
                className="w-full"
                src={message.attachments[0].publicUrl || ''}
              />
            )}
            
            {message.messageType === 'text' && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
            
            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {format(new Date(message.createdAt), "HH:mm", { locale })}
            </p>
          </div>
        </div>
        
        {isOwnMessage && (
          <Avatar className="h-9 w-9">
            {user?.profilePicture ? (
              <AvatarImage src={user.profilePicture} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

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
                <span>{language === "es" ? "Equipo" : "Team"}</span>
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

          {/* AI Chatbot Tab */}
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
                          ? "Prueba el chatbot IA que tus clientes verán en el sitio público."
                          : "Test the AI chatbot that your clients will see on the public site."}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                        {quickPrompts.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] text-sm"
                            onClick={() => setChatInput(prompt)}
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

          {/* Team Chat Tab */}
          <TabsContent value="team" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Main Chat Area */}
              <Card className="lg:col-span-3 h-[600px] flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {language === "es" ? "Chat del Equipo" : "Team Chat"}
                        </CardTitle>
                        <CardDescription>
                          {language === "es" 
                            ? "Comunicación en tiempo real con tu equipo"
                            : "Real-time communication with your team"}
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowLeaderboard(true)}
                      className="min-h-[44px] gap-2"
                      data-testid="button-leaderboard"
                    >
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="hidden sm:inline">{language === "es" ? "Ranking" : "Leaderboard"}</span>
                    </Button>
                  </div>
                </CardHeader>
                
                <Separator />
                
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    {loadingTeamMessages ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-16 w-64" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : teamMessages && teamMessages.length > 0 ? (
                      <div className="space-y-4">
                        {[...teamMessages].reverse().map(renderTeamMessage)}
                        <div ref={teamMessagesEndRef} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                          {language === "es" ? "¡Bienvenido al chat del equipo!" : "Welcome to team chat!"}
                        </h3>
                        <p className="text-muted-foreground max-w-md">
                          {language === "es"
                            ? "Aquí puedes comunicarte con todos los vendedores y administradores de la agencia. Los mensajes son visibles para todo el equipo."
                            : "Here you can communicate with all sellers and admins of the agency. Messages are visible to the entire team."}
                        </p>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="p-4 border-t bg-muted/50">
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-h-32 rounded-md"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleSendImage}
                          disabled={uploadAttachmentMutation.isPending}
                        >
                          {uploadAttachmentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          {language === "es" ? "Enviar imagen" : "Send image"}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Message Input */}
                  <div className="p-4 border-t bg-background/95 backdrop-blur">
                    {isRecording ? (
                      <div className="flex items-center gap-4 bg-red-500/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-500">
                          <Mic className="h-5 w-5 animate-pulse" />
                          <span className="font-mono">{formatRecordingTime(recordingTime)}</span>
                        </div>
                        <div className="flex-1">
                          <Progress value={(recordingTime % 60) / 60 * 100} className="h-2" />
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={stopRecording}
                        >
                          <MicOff className="h-4 w-4 mr-2" />
                          {language === "es" ? "Detener" : "Stop"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="min-h-[44px] min-w-[44px] shrink-0"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-attach-image"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="min-h-[44px] min-w-[44px] shrink-0"
                          onClick={startRecording}
                          data-testid="button-record-audio"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Input
                          value={teamChatInput}
                          onChange={(e) => setTeamChatInput(e.target.value)}
                          onKeyDown={handleTeamKeyPress}
                          placeholder={language === "es" ? "Escribe un mensaje..." : "Type a message..."}
                          className="flex-1 min-h-[44px]"
                          disabled={sendMessageMutation.isPending}
                          data-testid="input-team-message"
                        />
                        <Button 
                          onClick={handleSendTeamMessage} 
                          disabled={!teamChatInput.trim() || sendMessageMutation.isPending}
                          className="min-h-[44px] min-w-[44px]"
                          data-testid="button-send-team-message"
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Points & Stats Sidebar */}
              <div className="space-y-4">
                {/* My Points Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {language === "es" ? "Mis Puntos" : "My Points"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myPoints ? (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {myPoints.totalPoints}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {language === "es" ? "puntos totales" : "total points"}
                          </p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <div className="font-semibold">{myPoints.weeklyPoints}</div>
                            <p className="text-xs text-muted-foreground">
                              {language === "es" ? "Esta semana" : "This week"}
                            </p>
                          </div>
                          <div>
                            <div className="font-semibold">{myPoints.monthlyPoints}</div>
                            <p className="text-xs text-muted-foreground">
                              {language === "es" ? "Este mes" : "This month"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Skeleton className="h-8 w-16 mx-auto mb-2" />
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                {myPoints && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        {language === "es" ? "Mi Actividad" : "My Activity"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {language === "es" ? "Leads" : "Leads"}
                        </span>
                        <Badge variant="secondary">{myPoints.leadsRegistered}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {language === "es" ? "Ofertas" : "Offers"}
                        </span>
                        <Badge variant="secondary">{myPoints.offersSent}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {language === "es" ? "Formatos" : "Forms"}
                        </span>
                        <Badge variant="secondary">{myPoints.rentalFormsSent}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {language === "es" ? "Propietarios" : "Owners"}
                        </span>
                        <Badge variant="secondary">{myPoints.ownersRegistered}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {language === "es" ? "Rentas" : "Rentals"}
                        </span>
                        <Badge variant="secondary">{myPoints.rentalsCompleted}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin: Online Sellers */}
                {isAdmin && sellers && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {language === "es" ? "Vendedores" : "Sellers"}
                        <Badge variant="outline" className="ml-auto">
                          {sellers.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {sellers.map((seller) => (
                            <div 
                              key={seller.id}
                              className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer"
                              onClick={() => {
                                setSelectedSeller(seller);
                                setShowSellerProfile(true);
                              }}
                            >
                              <Avatar className="h-8 w-8">
                                {seller.profilePicture ? (
                                  <AvatarImage src={seller.profilePicture} />
                                ) : null}
                                <AvatarFallback className="text-xs">
                                  {seller.firstName?.[0]}{seller.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {seller.firstName} {seller.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {seller.points?.totalPoints || 0} pts
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Other tabs - Coming Soon */}
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
                      ? "Aquí podrás gestionar conversaciones con tus inquilinos."
                      : "Here you'll be able to manage conversations with your tenants."}
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
                    ? "Comunicación con proveedores de servicios"
                    : "Communication with service providers"}
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
                      ? "Aquí podrás coordinar con proveedores de servicios."
                      : "Here you'll be able to coordinate with service providers."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Leaderboard Dialog */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {language === "es" ? "Ranking de Vendedores" : "Seller Leaderboard"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Los vendedores con más puntos este período"
                : "Top sellers by points this period"}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {loadingLeaderboard ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((seller, index) => (
                  <div 
                    key={seller.sellerId}
                    className={`flex items-center gap-3 p-2 rounded-md ${
                      index < 3 ? 'bg-yellow-500/10' : ''
                    }`}
                  >
                    <div className="w-8 text-center font-bold text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </div>
                    <Avatar className="h-10 w-10">
                      {seller.sellerAvatar ? (
                        <AvatarImage src={seller.sellerAvatar} />
                      ) : null}
                      <AvatarFallback>
                        {seller.sellerName?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{seller.sellerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Nivel" : "Level"} {seller.currentRank}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {seller.totalPoints} pts
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {language === "es" ? "No hay datos disponibles" : "No data available"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Seller Profile Dialog */}
      <Dialog open={showSellerProfile} onOpenChange={setShowSellerProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {language === "es" ? "Perfil del Vendedor" : "Seller Profile"}
            </DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {selectedSeller.profilePicture ? (
                    <AvatarImage src={selectedSeller.profilePicture} />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {selectedSeller.firstName?.[0]}{selectedSeller.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedSeller.firstName} {selectedSeller.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedSeller.email}</p>
                  {selectedSeller.phone && (
                    <p className="text-sm text-muted-foreground">{selectedSeller.phone}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {selectedSeller.points?.totalPoints || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Puntos" : "Points"}
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {selectedSeller.points?.leadsRegistered || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedSeller.points?.rentalsCompleted || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Rentas" : "Rentals"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  {language === "es" ? "Estadísticas Detalladas" : "Detailed Stats"}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">{language === "es" ? "Ofertas" : "Offers"}</span>
                    <span className="font-medium">{selectedSeller.points?.offersSent || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">{language === "es" ? "Formatos" : "Forms"}</span>
                    <span className="font-medium">{selectedSeller.points?.rentalFormsSent || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">{language === "es" ? "Propietarios" : "Owners"}</span>
                    <span className="font-medium">{selectedSeller.points?.ownersRegistered || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">{language === "es" ? "Semana" : "Week"}</span>
                    <span className="font-medium">{selectedSeller.points?.weeklyPoints || 0} pts</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                {language === "es" ? "Miembro desde" : "Member since"}{" "}
                {format(new Date(selectedSeller.createdAt), "MMMM yyyy", { locale })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
