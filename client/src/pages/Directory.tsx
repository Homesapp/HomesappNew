import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ServiceProviderCard } from "@/components/ServiceProviderCard";
import { ServiceProviderFormDialog } from "@/components/ServiceProviderFormDialog";
import { ServiceFormDialog } from "@/components/ServiceFormDialog";
import { HireServiceDialog } from "@/components/HireServiceDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";
import { useServiceProviders, useServicesByProvider } from "@/hooks/useServiceProviders";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function ProviderCardWithServices({ provider, onHire }: { provider: any; onHire: (providerId: string, providerName: string) => void }) {
  const { data: services, isLoading: servicesLoading } = useServicesByProvider(provider.id);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const fullName = `${provider.user.firstName || ""} ${provider.user.lastName || ""}`.trim();
      
      const conversation = await apiRequest("POST", "/api/chat/conversations", {
        type: "internal",
        title: `Chat con ${fullName || provider.specialty}`,
        createdById: provider.userId,
      });
      
      await apiRequest("POST", "/api/chat/participants", {
        conversationId: conversation.id,
        userId: provider.userId,
      });
      
      return conversation;
    },
    onSuccess: (conversation) => {
      setLocation("/chat");
      toast({
        title: "Chat iniciado",
        description: `Ahora puedes enviar mensajes al proveedor`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar el chat",
        variant: "destructive",
      });
    },
  });

  const handleMessage = () => {
    createConversationMutation.mutate();
  };

  const handleCall = () => {
    const fullName = `${provider.user.firstName || ""} ${provider.user.lastName || ""}`.trim();
    toast({
      title: "Contacto del proveedor",
      description: `Para contactar a ${fullName}, utiliza el chat o envía una solicitud de servicio.`,
    });
  };

  const handleHire = () => {
    const fullName = `${provider.user.firstName || ""} ${provider.user.lastName || ""}`.trim();
    onHire(provider.id, fullName || "Sin nombre");
  };

  const formattedServices = useMemo(() => {
    if (!services) return [];
    return services.map(service => ({
      name: service.name,
      price: Number(service.price),
      description: service.description,
    }));
  }, [services]);

  const fullName = `${provider.user.firstName || ""} ${provider.user.lastName || ""}`.trim();

  return (
    <ServiceProviderCard
      id={provider.id}
      name={fullName || "Sin nombre"}
      avatar={provider.user.profileImageUrl || undefined}
      specialty={provider.specialty}
      rating={Number(provider.rating) || 0}
      reviewCount={provider.reviewCount || 0}
      services={formattedServices}
      available={provider.available}
      onMessage={handleMessage}
      onCall={handleCall}
      onHire={handleHire}
    />
  );
}

export default function Directory() {
  const { user } = useAuth();
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [availableFilter, setAvailableFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [selectedProviderForHire, setSelectedProviderForHire] = useState<{ id: string; name: string } | null>(null);

  const filters = useMemo(() => {
    const f: { specialty?: string; available?: boolean } = {};
    if (specialtyFilter !== "all") f.specialty = specialtyFilter;
    if (availableFilter === "available") f.available = true;
    if (availableFilter === "unavailable") f.available = false;
    return f;
  }, [specialtyFilter, availableFilter]);

  const { data: providers, isLoading, error } = useServiceProviders(filters);

  const filteredProviders = useMemo(() => {
    if (!providers) return [];
    if (!searchQuery) return providers;
    
    const query = searchQuery.toLowerCase();
    return providers.filter((p) => {
      const fullName = `${p.user.firstName || ""} ${p.user.lastName || ""}`.toLowerCase();
      return (
        fullName.includes(query) ||
        p.specialty.toLowerCase().includes(query)
      );
    });
  }, [providers, searchQuery]);

  const specialties = useMemo(() => {
    if (!providers) return [];
    return Array.from(new Set(providers.map((p) => p.specialty)));
  }, [providers]);

  const userIsProvider = useMemo(() => {
    if (!user || !providers) return false;
    return providers.some(p => p.userId === user.id);
  }, [user, providers]);

  const canRegisterAsProvider = user?.role === "provider" || user?.role === "admin" || user?.role === "master";

  const handleHireProvider = (providerId: string, providerName: string) => {
    setSelectedProviderForHire({ id: providerId, name: providerName });
    setHireDialogOpen(true);
  };

  const selectedProviderServices = useMemo(() => {
    if (!selectedProviderForHire || !providers) return [];
    const provider = providers.find(p => p.id === selectedProviderForHire.id);
    return provider?.services || [];
  }, [selectedProviderForHire, providers]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Directorio de Servicios</h1>
          <p className="text-muted-foreground">
            Encuentra proveedores de servicios para tus propiedades
          </p>
        </div>
        <div className="text-center py-12 text-destructive">
          Error al cargar los proveedores. Por favor, intenta de nuevo.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Directorio de Servicios</h1>
          <p className="text-muted-foreground">
            Encuentra proveedores de servicios para tus propiedades
          </p>
        </div>
        {canRegisterAsProvider && !userIsProvider && (
          <Button onClick={() => setProviderFormOpen(true)} data-testid="button-register-provider">
            <Plus className="h-4 w-4 mr-2" />
            Registrarse como Proveedor
          </Button>
        )}
      </div>

      <ServiceProviderFormDialog
        open={providerFormOpen}
        onOpenChange={setProviderFormOpen}
        mode="create"
      />

      <ServiceFormDialog
        open={serviceFormOpen}
        onOpenChange={setServiceFormOpen}
        providerId={selectedProviderId}
      />

      {selectedProviderForHire && (
        <HireServiceDialog
          open={hireDialogOpen}
          onOpenChange={setHireDialogOpen}
          providerId={selectedProviderForHire.id}
          providerName={selectedProviderForHire.name}
          services={selectedProviderServices.map(s => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            description: s.description,
          }))}
        />
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o especialidad..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-providers"
          />
        </div>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-specialty-filter">
            <SelectValue placeholder="Especialidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las especialidades</SelectItem>
            {specialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availableFilter} onValueChange={setAvailableFilter}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-availability-filter">
            <SelectValue placeholder="Disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="available">Disponibles</SelectItem>
            <SelectItem value="unavailable">No disponibles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <ProviderCardWithServices 
                key={provider.id} 
                provider={provider} 
                onHire={handleHireProvider}
              />
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron proveedores
            </div>
          )}
        </>
      )}
    </div>
  );
}
