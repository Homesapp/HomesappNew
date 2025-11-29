import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Home, User, Key, Plus, Edit, Trash2, Eye, EyeOff, Copy, Check, FileText, Upload, Clock, Calendar, Wrench, Users, MapPin, Shield, ShieldCheck, ShieldX, ExternalLink, Link2, XCircle, Send, UserCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { 
  ExternalUnit, 
  ExternalCondominium, 
  ExternalUnitOwner, 
  ExternalUnitAccessControl,
  InsertExternalUnitOwner,
  InsertExternalUnitAccessControl,
  ExternalRentalContract,
  InsertExternalRentalContract
} from "@shared/schema";
import { insertExternalUnitOwnerSchema, insertExternalUnitAccessControlSchema, insertExternalRentalContractSchema } from "@shared/schema";
import { formatFloor, floorOptions } from "@/lib/unitHelpers";
import { UnitImageGallery } from "@/components/external/UnitImageGallery";
import { UnitAmenitiesSelector } from "@/components/external/UnitAmenitiesSelector";
import { PropertyPreviewDialog } from "@/components/external/PropertyPreviewDialog";

type OwnerFormData = z.infer<typeof insertExternalUnitOwnerSchema>;
type AccessControlFormData = z.infer<typeof insertExternalUnitAccessControlSchema>;
type RentalFormData = z.infer<typeof insertExternalRentalContractSchema>;

interface MaintenanceHistoryItem {
  id: string;
  title: string;
  category: string | null;
  priority: string | null;
  status: string;
  reportedBy: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  scheduledDate: string | null;
  closedAt: string | null;
  createdAt: string;
}

interface ShowingHistoryItem {
  id: string;
  leadId: string;
  scheduledAt: string;
  outcome: string | null;
  feedback: string | null;
  createdAt: string;
}

interface AvailableCondominium {
  id: string;
  name: string;
  address: string | null;
}

interface ConfigItem {
  id: string;
  name: string;
  agencyId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface UnitOverviewResponse {
  unit: ExternalUnit;
  condominium: ExternalCondominium | null;
  rentalHistory: ExternalRentalContract[];
  maintenanceHistory: MaintenanceHistoryItem[];
  showingsHistory: ShowingHistoryItem[];
  availableCondominiums: AvailableCondominium[];
}

const unitEditSchema = z.object({
  unitNumber: z.string().min(1, "Required"),
  condominiumId: z.string().nullable(),
  zone: z.string().nullable(),
  city: z.string().nullable(),
  propertyType: z.string().nullable(),
  floor: z.enum(["planta_baja", "primer_piso", "segundo_piso", "tercer_piso", "penthouse"]).nullable(),
  bedrooms: z.union([z.string(), z.number()]).transform(val => val === "" ? null : Number(val)).nullable(),
  bathrooms: z.union([z.string(), z.number()]).transform(val => val === "" ? null : String(val)).nullable(),
  area: z.union([z.string(), z.number()]).transform(val => val === "" ? null : String(val)).nullable(),
  photosDriveLink: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean().default(true),
  title: z.string().nullable(),
  description: z.string().nullable(),
  price: z.union([z.string(), z.number()]).transform(val => val === "" ? null : String(val)).nullable(),
  currency: z.string().nullable(),
  address: z.string().nullable(),
  googleMapsUrl: z.string().nullable(),
  virtualTourUrl: z.string().nullable(),
  latitude: z.union([z.string(), z.number()]).transform(val => val === "" ? null : String(val)).nullable(),
  longitude: z.union([z.string(), z.number()]).transform(val => val === "" ? null : String(val)).nullable(),
  petFriendly: z.boolean().default(false),
  publishToMain: z.boolean().default(false),
  primaryImages: z.array(z.string()).default([]),
  secondaryImages: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  includedServices: z.object({
    water: z.boolean().default(false),
    electricity: z.boolean().default(false),
    internet: z.boolean().default(false),
    gas: z.boolean().default(false),
  }).default({ water: false, electricity: false, internet: false, gas: false }),
  accessInfo: z.object({
    lockboxCode: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
  }).nullable(),
});

type UnitEditFormData = z.infer<typeof unitEditSchema>;

const accessTypeTranslations = {
  door_code: { es: "Código de Puerta", en: "Door Code" },
  wifi: { es: "WiFi", en: "WiFi" },
  gate: { es: "Portón", en: "Gate" },
  parking: { es: "Estacionamiento", en: "Parking" },
  elevator: { es: "Elevador", en: "Elevator" },
  pool: { es: "Piscina", en: "Pool" },
  gym: { es: "Gimnasio", en: "Gym" },
  other: { es: "Otro", en: "Other" },
};

const contractStatusTranslations = {
  pending_validation: { es: "Pendiente Validación", en: "Pending Validation" },
  documents_validated: { es: "Documentos Validados", en: "Documents Validated" },
  contract_uploaded: { es: "Contrato Subido", en: "Contract Uploaded" },
  active: { es: "Activo", en: "Active" },
  completed: { es: "Completado", en: "Completed" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
};

const ticketStatusTranslations = {
  open: { es: "Abierto", en: "Open" },
  in_progress: { es: "En Progreso", en: "In Progress" },
  resolved: { es: "Resuelto", en: "Resolved" },
  closed: { es: "Cerrado", en: "Closed" },
  on_hold: { es: "En Espera", en: "On Hold" },
};

const showingOutcomeTranslations = {
  interested: { es: "Interesado", en: "Interested" },
  not_interested: { es: "No Interesado", en: "Not Interested" },
  pending: { es: "Pendiente", en: "Pending" },
  cancelled: { es: "Cancelada", en: "Cancelled" },
  no_show: { es: "No Asistió", en: "No Show" },
};

export default function ExternalUnitDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, isLoading: isLoadingAuth } = useAuth();
  
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [showRentalDialog, setShowRentalDialog] = useState(false);
  const [showUnitEditDialog, setShowUnitEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showOwnerLinkDialog, setShowOwnerLinkDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [editingOwner, setEditingOwner] = useState<ExternalUnitOwner | null>(null);
  const [editingAccess, setEditingAccess] = useState<ExternalUnitAccessControl | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedUnitInfo, setCopiedUnitInfo] = useState(false);
  const [copiedAccessInfo, setCopiedAccessInfo] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);
  const [copiedOwnerLink, setCopiedOwnerLink] = useState(false);
  const [selectedOwnerForLink, setSelectedOwnerForLink] = useState<ExternalUnitOwner | null>(null);
  const [generatedOwnerLink, setGeneratedOwnerLink] = useState<string | null>(null);

  const { data: overviewData, isLoading: overviewLoading } = useQuery<UnitOverviewResponse>({
    queryKey: ['/api/external-units', id, 'overview'],
    queryFn: async () => {
      const res = await fetch(`/api/external-units/${id}/overview`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch unit overview');
      return res.json();
    },
    enabled: !!id,
  });

  const unit = overviewData?.unit;
  const condominium = overviewData?.condominium;
  const rentalHistory = overviewData?.rentalHistory || [];
  const maintenanceHistory = overviewData?.maintenanceHistory || [];
  const showingsHistory = overviewData?.showingsHistory || [];
  const availableCondominiums = overviewData?.availableCondominiums || [];

  const { data: owners, isLoading: ownersLoading } = useQuery<ExternalUnitOwner[]>({
    queryKey: [`/api/external-unit-owners/by-unit/${id}`],
    enabled: !!id,
  });

  const { data: accessControls, isLoading: accessLoading } = useQuery<ExternalUnitAccessControl[]>({
    queryKey: [`/api/external-unit-access-controls/by-unit/${id}`],
    enabled: !!id,
  });

  const { data: zonesConfig } = useQuery<ConfigItem[]>({
    queryKey: ['/api/external/config/zones'],
    queryFn: async () => {
      const res = await fetch('/api/external/config/zones', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch zones');
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: propertyTypesConfig } = useQuery<ConfigItem[]>({
    queryKey: ['/api/external/config/property-types'],
    queryFn: async () => {
      const res = await fetch('/api/external/config/property-types', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch property types');
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const activeZones = zonesConfig?.filter(z => z.isActive) || [];
  const activePropertyTypes = propertyTypesConfig?.filter(pt => pt.isActive) || [];

  const activeContract = rentalHistory?.find(c => c.status === 'active');

  const unitEditForm = useForm<UnitEditFormData>({
    resolver: zodResolver(unitEditSchema),
    defaultValues: {
      unitNumber: "",
      condominiumId: null,
      zone: null,
      city: null,
      propertyType: null,
      floor: null,
      bedrooms: null,
      bathrooms: null,
      area: null,
      photosDriveLink: null,
      notes: null,
      isActive: true,
      title: null,
      description: null,
      price: null,
      currency: "MXN",
      address: null,
      googleMapsUrl: null,
      virtualTourUrl: null,
      petFriendly: false,
      publishToMain: false,
    },
  });

  const ownerForm = useForm<OwnerFormData>({
    resolver: zodResolver(insertExternalUnitOwnerSchema),
    defaultValues: {
      unitId: id || "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      ownershipPercentage: "100.00",
      isActive: true,
      notes: "",
    },
  });

  const accessForm = useForm<AccessControlFormData>({
    resolver: zodResolver(insertExternalUnitAccessControlSchema),
    defaultValues: {
      unitId: id || "",
      accessType: "door_code",
      accessCode: "",
      description: "",
      isActive: true,
      canShareWithMaintenance: false,
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: async (data: UnitEditFormData) => {
      return await apiRequest('PATCH', `/api/external-units/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-units', id, 'overview'] });
      setShowUnitEditDialog(false);
      toast({
        title: language === "es" ? "Unidad actualizada" : "Unit updated",
        description: language === "es" ? "La unidad se actualizó exitosamente" : "The unit was updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async (data: { verificationStatus: string; verificationNotes?: string }) => {
      return await apiRequest('PATCH', `/api/external-units/${id}/verification`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-units', id, 'overview'] });
      setShowVerificationDialog(false);
      toast({
        title: language === "es" ? "Estado de verificación actualizado" : "Verification status updated",
        description: language === "es" ? "El estado de verificación se actualizó exitosamente" : "Verification status was updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/external-units/${id}`, {
        publishToMain: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-units', id, 'overview'] });
      setShowUnpublishDialog(false);
      toast({
        title: language === "es" ? "Publicación removida" : "Publication removed",
        description: language === "es" ? "El listado ya no está visible en el sitio público" : "The listing is no longer visible on the public site",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateOwnerLinkMutation = useMutation({
    mutationFn: async (ownerId: string) => {
      const res = await apiRequest('POST', `/api/external-rental-form-tokens`, {
        externalUnitId: id,
        externalUnitOwnerId: ownerId,
        recipientType: 'owner',
      });
      return res;
    },
    onSuccess: (data: any) => {
      const link = `${window.location.origin}/rental-form/${data.token}`;
      setGeneratedOwnerLink(link);
      toast({
        title: language === "es" ? "Enlace generado" : "Link generated",
        description: language === "es" ? "El enlace para el propietario ha sido creado" : "The owner intake link has been created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createOwnerMutation = useMutation({
    mutationFn: async (data: OwnerFormData) => {
      return await apiRequest('POST', '/api/external-unit-owners', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-unit-owners/by-unit/${id}`] });
      setShowOwnerDialog(false);
      ownerForm.reset();
      toast({
        title: language === "es" ? "Propietario agregado" : "Owner added",
        description: language === "es" ? "El propietario se agregó exitosamente" : "The owner was added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOwnerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OwnerFormData> }) => {
      return await apiRequest('PATCH', `/api/external-unit-owners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-unit-owners/by-unit/${id}`] });
      setShowOwnerDialog(false);
      setEditingOwner(null);
      ownerForm.reset();
      toast({
        title: language === "es" ? "Propietario actualizado" : "Owner updated",
        description: language === "es" ? "El propietario se actualizó exitosamente" : "The owner was updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOwnerMutation = useMutation({
    mutationFn: async (ownerId: string) => {
      return await apiRequest('DELETE', `/api/external-unit-owners/${ownerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-unit-owners/by-unit/${id}`] });
      toast({
        title: language === "es" ? "Propietario eliminado" : "Owner deleted",
        description: language === "es" ? "El propietario se eliminó exitosamente" : "The owner was deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAccessMutation = useMutation({
    mutationFn: async (data: AccessControlFormData) => {
      return await apiRequest('POST', '/api/external-unit-access-controls', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-unit-access-controls/by-unit/${id}`] });
      setShowAccessDialog(false);
      accessForm.reset();
      toast({
        title: language === "es" ? "Control de acceso agregado" : "Access control added",
        description: language === "es" ? "El control de acceso se agregó exitosamente" : "The access control was added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAccessMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AccessControlFormData> }) => {
      return await apiRequest('PATCH', `/api/external-unit-access-controls/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-unit-access-controls/by-unit/${id}`] });
      setShowAccessDialog(false);
      setEditingAccess(null);
      accessForm.reset();
      toast({
        title: language === "es" ? "Control actualizado" : "Access control updated",
        description: language === "es" ? "El control de acceso se actualizó exitosamente" : "The access control was updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccessMutation = useMutation({
    mutationFn: async (accessId: string) => {
      return await apiRequest('DELETE', `/api/external-unit-access-controls/${accessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-unit-access-controls/by-unit/${id}`] });
      toast({
        title: language === "es" ? "Control eliminado" : "Access control deleted",
        description: language === "es" ? "El control de acceso se eliminó exitosamente" : "The access control was deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rentalForm = useForm<RentalFormData>({
    resolver: zodResolver(insertExternalRentalContractSchema.omit({ agencyId: true, createdBy: true, propertyId: true })),
    defaultValues: {
      unitId: id || "",
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      monthlyRent: "0",
      currency: "MXN",
      securityDeposit: "0",
      rentalPurpose: "living",
      leaseDurationMonths: 12,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "active",
      leaseContractUrl: "",
      inventoryUrl: "",
      notes: "",
    },
  });

  const createRentalMutation = useMutation({
    mutationFn: async (data: RentalFormData) => {
      if (!unit || !unit.agencyId) {
        throw new Error(language === "es" 
          ? "Error: No se pudo obtener la información de la unidad. Por favor recargue la página." 
          : "Error: Could not get unit information. Please reload the page."
        );
      }
      
      const transformedData = {
        ...data,
        agencyId: unit.agencyId,
        monthlyRent: Number(data.monthlyRent),
        securityDeposit: data.securityDeposit ? Number(data.securityDeposit) : undefined,
      };
      return await apiRequest('POST', '/api/external-rental-contracts', transformedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-units', id, 'overview'] });
      setShowRentalDialog(false);
      rentalForm.reset();
      toast({
        title: language === "es" ? "Renta creada" : "Rental created",
        description: language === "es" ? "El contrato de renta se creó exitosamente" : "The rental contract was created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditUnit = () => {
    if (!unit) return;
    unitEditForm.reset({
      unitNumber: unit.unitNumber,
      condominiumId: unit.condominiumId ?? null,
      zone: unit.zone ?? null,
      city: unit.city ?? null,
      propertyType: unit.propertyType ?? null,
      floor: unit.floor as any ?? null,
      bedrooms: unit.bedrooms ?? null,
      bathrooms: unit.bathrooms ?? null,
      area: unit.area ?? null,
      photosDriveLink: unit.photosDriveLink ?? null,
      notes: unit.notes ?? null,
      isActive: unit.isActive ?? true,
      title: unit.title ?? null,
      description: unit.description ?? null,
      price: unit.price ?? null,
      currency: unit.currency ?? "MXN",
      address: unit.address ?? null,
      googleMapsUrl: unit.googleMapsUrl ?? null,
      virtualTourUrl: unit.virtualTourUrl ?? null,
      latitude: unit.latitude ?? null,
      longitude: unit.longitude ?? null,
      petFriendly: unit.petFriendly ?? false,
      publishToMain: unit.publishToMain ?? false,
      primaryImages: unit.primaryImages ?? [],
      secondaryImages: unit.secondaryImages ?? [],
      videos: unit.videos ?? [],
      amenities: unit.amenities ?? [],
      includedServices: {
        water: (unit.includedServices as any)?.water ?? false,
        electricity: (unit.includedServices as any)?.electricity ?? false,
        internet: (unit.includedServices as any)?.internet ?? false,
        gas: (unit.includedServices as any)?.gas ?? false,
      },
      accessInfo: unit.accessInfo as any ?? null,
    });
    setShowUnitEditDialog(true);
  };

  const handleSubmitUnitEdit = (data: UnitEditFormData) => {
    updateUnitMutation.mutate(data);
  };

  const handleAddOwner = () => {
    ownerForm.reset({
      unitId: id || "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      ownershipPercentage: "100.00",
      isActive: true,
      notes: "",
    });
    setEditingOwner(null);
    setShowOwnerDialog(true);
  };

  const handleEditOwner = (owner: ExternalUnitOwner) => {
    ownerForm.reset({
      unitId: owner.unitId,
      ownerName: owner.ownerName,
      ownerEmail: owner.ownerEmail || "",
      ownerPhone: owner.ownerPhone || "",
      ownershipPercentage: owner.ownershipPercentage || "100.00",
      isActive: owner.isActive,
      notes: owner.notes || "",
    });
    setEditingOwner(owner);
    setShowOwnerDialog(true);
  };

  const handleSubmitOwner = (data: OwnerFormData) => {
    if (editingOwner) {
      updateOwnerMutation.mutate({ id: editingOwner.id, data });
    } else {
      createOwnerMutation.mutate(data);
    }
  };

  const handleAddAccess = () => {
    accessForm.reset({
      unitId: id || "",
      accessType: "door_code",
      accessCode: "",
      description: "",
      isActive: true,
      canShareWithMaintenance: false,
    });
    setEditingAccess(null);
    setShowAccessDialog(true);
  };

  const handleEditAccess = (access: ExternalUnitAccessControl) => {
    accessForm.reset({
      unitId: access.unitId,
      accessType: access.accessType,
      accessCode: access.accessCode || "",
      description: access.description || "",
      isActive: access.isActive,
      canShareWithMaintenance: access.canShareWithMaintenance,
    });
    setEditingAccess(access);
    setShowAccessDialog(true);
  };

  const handleSubmitAccess = (data: AccessControlFormData) => {
    if (editingAccess) {
      updateAccessMutation.mutate({ id: editingAccess.id, data });
    } else {
      createAccessMutation.mutate(data);
    }
  };

  const handleAddRental = () => {
    rentalForm.reset({
      unitId: id || "",
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      monthlyRent: "0",
      currency: "MXN",
      leaseDurationMonths: 12,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "active",
      leaseContractUrl: "",
      inventoryUrl: "",
      notes: "",
    });
    setShowRentalDialog(true);
  };

  const handleSubmitRental = (data: RentalFormData) => {
    createRentalMutation.mutate(data);
  };

  const togglePasswordVisibility = (accessId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accessId)) {
        newSet.delete(accessId);
      } else {
        newSet.add(accessId);
      }
      return newSet;
    });
  };

  const copyUnitInfo = async () => {
    if (!unit || !condominium) return;
    
    let info = `${language === "es" ? "INFORMACIÓN DE UNIDAD" : "UNIT INFORMATION"}

${language === "es" ? "Condominio" : "Condominium"}: ${condominium.name}
${language === "es" ? "Unidad" : "Unit"}: ${unit.unitNumber}
`;
    
    if (unit.title) info += `${language === "es" ? "Título" : "Title"}: ${unit.title}\n`;
    if (unit.zone) info += `${language === "es" ? "Zona" : "Zone"}: ${unit.zone}\n`;
    if (unit.city) info += `${language === "es" ? "Ciudad" : "City"}: ${unit.city}\n`;
    if (unit.address) info += `${language === "es" ? "Dirección" : "Address"}: ${unit.address}\n`;
    if (unit.bedrooms) info += `${language === "es" ? "Recámaras" : "Bedrooms"}: ${unit.bedrooms}\n`;
    if (unit.bathrooms) info += `${language === "es" ? "Baños" : "Bathrooms"}: ${unit.bathrooms}\n`;
    if (unit.area) info += `${language === "es" ? "Área" : "Area"}: ${unit.area} m²\n`;
    if (unit.price) info += `${language === "es" ? "Precio Mensual" : "Monthly Price"}: $${Number(unit.price).toLocaleString()} ${unit.currency || "MXN"}\n`;
    if (unit.petFriendly) info += `${language === "es" ? "Acepta Mascotas" : "Pet Friendly"}: ✓\n`;
    if (unit.description) info += `\n${language === "es" ? "Descripción" : "Description"}:\n${unit.description}\n`;
    if (unit.photosDriveLink) info += `\n${language === "es" ? "Link Fotos" : "Photos Link"}: ${unit.photosDriveLink}\n`;
    if (unit.virtualTourUrl) info += `${language === "es" ? "Tour Virtual" : "Virtual Tour"}: ${unit.virtualTourUrl}\n`;
    if (unit.googleMapsUrl) info += `${language === "es" ? "Google Maps" : "Google Maps"}: ${unit.googleMapsUrl}\n`;

    try {
      await navigator.clipboard.writeText(info);
      setCopiedUnitInfo(true);
      setTimeout(() => setCopiedUnitInfo(false), 2000);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" 
          ? "Información de unidad copiada al portapapeles"
          : "Unit information copied to clipboard",
      });
    } catch (err) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo copiar al portapapeles"
          : "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyAccessInfo = async () => {
    if (!unit || !condominium || !accessControls || accessControls.length === 0) return;
    
    const activeAccesses = accessControls.filter(a => a.isActive);
    if (activeAccesses.length === 0) {
      toast({
        title: language === "es" ? "Sin accesos" : "No accesses",
        description: language === "es"
          ? "No hay accesos activos para compartir"
          : "No active accesses to share",
        variant: "default",
      });
      return;
    }

    let info = `${language === "es" ? "INFORMACIÓN DE ACCESO" : "ACCESS INFORMATION"}

${language === "es" ? "Condominio" : "Condominium"}: ${condominium.name}
${language === "es" ? "Unidad" : "Unit"}: ${unit.unitNumber}

${language === "es" ? "ACCESOS" : "ACCESSES"}:
`;

    activeAccesses.forEach((access) => {
      const typeLabel = (accessTypeTranslations as any)[access.accessType]?.[language] || access.accessType;
      info += `\n• ${typeLabel}`;
      if (access.accessCode) {
        info += `: ${access.accessCode}`;
      }
      if (access.description) {
        info += `\n  ${language === "es" ? "Descripción" : "Description"}: ${access.description}`;
      }
      info += '\n';
    });

    try {
      await navigator.clipboard.writeText(info);
      setCopiedAccessInfo(true);
      setTimeout(() => setCopiedAccessInfo(false), 2000);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" 
          ? "Información de acceso copiada al portapapeles"
          : "Access information copied to clipboard",
      });
    } catch (err) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo copiar al portapapeles"
          : "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString(language === "es" ? "es-MX" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  if (overviewLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium" data-testid="text-not-found">
              {language === "es" ? "Unidad no encontrada" : "Unit not found"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/external/condominiums")}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "es" ? "Volver" : "Go back"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getVerificationBadge = () => {
    const status = unit.verificationStatus || 'unverified';
    switch (status) {
      case 'verified':
        return (
          <Badge 
            variant="default" 
            className="bg-green-600 dark:bg-green-700 cursor-pointer" 
            onClick={() => setShowVerificationDialog(true)}
            data-testid="badge-verified"
          >
            <ShieldCheck className="mr-1 h-3 w-3" />
            {language === "es" ? "Verificado" : "Verified"}
          </Badge>
        );
      case 'pending_review':
        return (
          <Badge 
            variant="secondary" 
            className="bg-yellow-500 dark:bg-yellow-600 text-white cursor-pointer"
            onClick={() => setShowVerificationDialog(true)}
            data-testid="badge-pending-review"
          >
            <Shield className="mr-1 h-3 w-3" />
            {language === "es" ? "En Revisión" : "Pending Review"}
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => setShowVerificationDialog(true)}
            data-testid="badge-unverified"
          >
            <ShieldX className="mr-1 h-3 w-3" />
            {language === "es" ? "Sin Verificar" : "Unverified"}
          </Badge>
        );
    }
  };

  const getPublishStatusBadge = () => {
    const status = unit.publishStatus || 'draft';
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-blue-600 dark:bg-blue-700" data-testid="badge-published">
            {language === "es" ? "Publicado" : "Published"}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-orange-500 dark:bg-orange-600 text-white" data-testid="badge-pending-publish">
            {language === "es" ? "Pendiente Aprobación" : "Pending Approval"}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" data-testid="badge-rejected">
            {language === "es" ? "Rechazado" : "Rejected"}
          </Badge>
        );
      default:
        return null;
    }
  };

  const copyPublicLink = async () => {
    if (!unit.slug || unit.publishStatus !== 'approved') return;
    const agencySlug = user?.externalAgencySlug || '';
    const publicUrl = `${window.location.origin}/${agencySlug}/${unit.slug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 2000);
      toast({
        title: language === "es" ? "Enlace copiado" : "Link copied",
        description: language === "es" ? "El enlace público se copió al portapapeles" : "Public link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo copiar el enlace" : "Could not copy link",
        variant: "destructive",
      });
    }
  };

  const viewPublicListing = () => {
    if (!unit.slug || unit.publishStatus !== 'approved') return;
    const agencySlug = user?.externalAgencySlug || '';
    const publicUrl = `${window.location.origin}/${agencySlug}/${unit.slug}`;
    window.open(publicUrl, '_blank');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/external/condominiums")}
            data-testid="button-back-properties"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                {language === "es" ? "Detalle de Unidad" : "Unit Details"}
              </h1>
              {getVerificationBadge()}
              {getPublishStatusBadge()}
            </div>
            <p className="text-muted-foreground" data-testid="text-unit-info">
              {condominium?.name || ""} - {language === "es" ? "Unidad" : "Unit"} {unit.unitNumber}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unit.publishStatus === 'approved' && unit.slug && (
            <>
              <Button
                variant="outline"
                onClick={viewPublicListing}
                data-testid="button-view-public-listing"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {language === "es" ? "Ver Publicación" : "View Listing"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copyPublicLink}
                title={language === "es" ? "Copiar enlace público" : "Copy public link"}
                data-testid="button-copy-public-link"
              >
                {copiedPublicLink ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUnpublishDialog(true)}
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                data-testid="button-unpublish"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {language === "es" ? "Quitar Publicación" : "Unpublish"}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => setShowOwnerLinkDialog(true)}
            disabled={!owners || owners.length === 0}
            title={language === "es" ? "Enviar enlace al propietario" : "Send link to owner"}
            data-testid="button-owner-intake-link"
          >
            <Send className="mr-2 h-4 w-4" />
            {language === "es" ? "Link Propietario" : "Owner Link"}
          </Button>
          {activeContract && (
            <>
              <Badge variant="default" className="bg-green-600 dark:bg-green-700" data-testid="badge-active-rental">
                {language === "es" ? "Renta Activa" : "Active Rental"}
              </Badge>
              <Button
                variant="outline"
                onClick={() => navigate(`/external/contracts/${activeContract.id}`)}
                disabled={isLoadingAuth || !user}
                data-testid="button-view-contract"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {language === "es" ? "Ver Contrato y Pagos" : "View Contract & Payments"}
              </Button>
            </>
          )}
          <Button
            onClick={handleAddRental}
            disabled={isLoadingAuth || !user || !!activeContract || overviewLoading || !unit}
            data-testid="button-generate-rental"
          >
            <Plus className="mr-2 h-4 w-4" />
            {language === "es" ? "Generar Renta Activa" : "Generate Active Rental"}
          </Button>
        </div>
      </div>

      {/* Image Gallery - Full Width Hero Section */}
      <div className="space-y-6">
        <UnitImageGallery
          unitId={id}
          primaryImages={unit.primaryImages || []}
          secondaryImages={unit.secondaryImages || []}
          videos={unit.videos || []}
          virtualTourUrl={unit.virtualTourUrl}
          language={language}
          readOnly={!user}
          onUpdate={(data) => {
            updateUnitMutation.mutate({
              unitNumber: unit.unitNumber,
              ...data,
            });
          }}
        />
      </div>

      {/* Row 1: Unit Information (Left) + History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Unit Information */}
        <Card data-testid="card-unit-info" className="lg:row-span-1">
          <CardHeader>
            <div className="flex justify-between items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                {language === "es" ? "Información de la Unidad" : "Unit Information"}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPreviewDialog(true)}
                  title={language === "es" ? "Vista Previa de Publicación" : "Publication Preview"}
                  data-testid="button-preview-publication"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEditUnit}
                  disabled={isLoadingAuth || !user}
                  data-testid="button-edit-unit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyUnitInfo}
                  disabled={!unit || !condominium}
                  data-testid="button-copy-unit-info"
                >
                  {copiedUnitInfo ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  {language === "es" ? "Número de Unidad" : "Unit Number"}
                </Label>
                <p className="text-sm font-medium mt-1" data-testid="text-unit-number">{unit.unitNumber}</p>
              </div>
              {unit.propertyType && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {language === "es" ? "Tipo de Propiedad" : "Property Type"}
                  </Label>
                  <p className="text-sm font-medium mt-1" data-testid="text-property-type">{unit.propertyType}</p>
                </div>
              )}
            </div>

            {(unit.zone || unit.city) && (
              <div className="grid grid-cols-2 gap-4">
                {unit.zone && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {language === "es" ? "Zona / Colonia" : "Zone / Neighborhood"}
                    </Label>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1" data-testid="text-zone">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {unit.zone}
                    </p>
                  </div>
                )}
                {unit.city && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {language === "es" ? "Ciudad" : "City"}
                    </Label>
                    <p className="text-sm font-medium mt-1" data-testid="text-city">{unit.city}</p>
                  </div>
                )}
              </div>
            )}
            
            {unit.floor && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  {language === "es" ? "Piso" : "Floor"}
                </Label>
                <p className="text-sm font-medium mt-1" data-testid="text-floor">{formatFloor(unit.floor, language)}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {unit.bedrooms != null && unit.bedrooms > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {language === "es" ? "Recámaras" : "Bedrooms"}
                  </Label>
                  <p className="text-sm font-medium mt-1" data-testid="text-bedrooms">{unit.bedrooms}</p>
                </div>
              )}
              {unit.bathrooms != null && Number(unit.bathrooms) > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {language === "es" ? "Baños" : "Bathrooms"}
                  </Label>
                  <p className="text-sm font-medium mt-1" data-testid="text-bathrooms">{unit.bathrooms}</p>
                </div>
              )}
              {unit.area != null && Number(unit.area) > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {language === "es" ? "Área (m²)" : "Area (m²)"}
                  </Label>
                  <p className="text-sm font-medium mt-1" data-testid="text-area">{unit.area}</p>
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">
                {language === "es" ? "Estado" : "Status"}
              </Label>
              <div className="mt-1">
                <Badge variant={unit.isActive ? "default" : "secondary"} data-testid="badge-status">
                  {unit.isActive ? (language === "es" ? "Activa" : "Active") : (language === "es" ? "Inactiva" : "Inactive")}
                </Badge>
              </div>
            </div>

            {unit.photosDriveLink && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  {language === "es" ? "Link Fotos" : "Photos Link"}
                </Label>
                <a 
                  href={unit.photosDriveLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary hover:underline block mt-1 truncate" 
                  data-testid="link-photos"
                  title={unit.photosDriveLink}
                >
                  {language === "es" ? "Ver fotos →" : "View photos →"}
                </a>
              </div>
            )}
            
            {unit.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  {language === "es" ? "Notas" : "Notes"}
                </Label>
                <p className="text-sm mt-1 text-muted-foreground" data-testid="text-notes">{unit.notes}</p>
              </div>
            )}

            {/* Included Services */}
            {unit.includedServices && Object.values(unit.includedServices).some(v => v) && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  {language === "es" ? "Servicios Incluidos" : "Included Services"}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {(unit.includedServices as any).water && (
                    <Badge variant="outline" className="text-xs" data-testid="badge-service-water">
                      {language === "es" ? "Agua" : "Water"}
                    </Badge>
                  )}
                  {(unit.includedServices as any).electricity && (
                    <Badge variant="outline" className="text-xs" data-testid="badge-service-electricity">
                      {language === "es" ? "Electricidad" : "Electricity"}
                    </Badge>
                  )}
                  {(unit.includedServices as any).internet && (
                    <Badge variant="outline" className="text-xs" data-testid="badge-service-internet">
                      Internet
                    </Badge>
                  )}
                  {(unit.includedServices as any).gas && (
                    <Badge variant="outline" className="text-xs" data-testid="badge-service-gas">
                      Gas
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
            {unit.amenities && unit.amenities.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  {language === "es" ? "Amenidades" : "Amenities"}
                </Label>
                <div className="flex flex-wrap gap-1.5 max-w-full overflow-hidden">
                  {unit.amenities.slice(0, 8).map((amenity: string) => (
                    <Badge key={amenity} variant="secondary" className="text-xs max-w-[120px] truncate" data-testid={`badge-amenity-${amenity}`}>
                      {amenity}
                    </Badge>
                  ))}
                  {unit.amenities.length > 8 && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      +{unit.amenities.length - 8}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Marketing & Pricing Section */}
            {(unit.title || unit.description || unit.price || unit.address) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {language === "es" ? "Información de Marketing" : "Marketing Information"}
                  </p>
                  
                  {unit.title && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {language === "es" ? "Título del Listado" : "Listing Title"}
                      </Label>
                      <p className="text-sm font-medium mt-1" data-testid="text-title">{unit.title}</p>
                    </div>
                  )}
                  
                  {unit.description && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {language === "es" ? "Descripción" : "Description"}
                      </Label>
                      <p className="text-sm mt-1 text-muted-foreground" data-testid="text-description">{unit.description}</p>
                    </div>
                  )}
                  
                  {unit.price && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {language === "es" ? "Precio Mensual" : "Monthly Price"}
                        </Label>
                        <p className="text-sm font-medium mt-1" data-testid="text-price">
                          ${Number(unit.price).toLocaleString()} {unit.currency || "MXN"}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {unit.address && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {language === "es" ? "Dirección" : "Address"}
                      </Label>
                      <p className="text-sm mt-1 flex items-center gap-1" data-testid="text-address">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        {unit.address}
                      </p>
                    </div>
                  )}

                  {unit.googleMapsUrl && (
                    <div>
                      <a 
                        href={unit.googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1" 
                        data-testid="link-google-maps"
                      >
                        <MapPin className="h-3 w-3" />
                        {language === "es" ? "Ver en Google Maps →" : "View on Google Maps →"}
                      </a>
                    </div>
                  )}

                  {unit.virtualTourUrl && (
                    <div>
                      <a 
                        href={unit.virtualTourUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1" 
                        data-testid="link-virtual-tour"
                      >
                        <Eye className="h-3 w-3" />
                        {language === "es" ? "Tour Virtual 360° →" : "Virtual Tour 360° →"}
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {unit.petFriendly && (
                      <Badge variant="outline" data-testid="badge-pet-friendly">
                        🐕 {language === "es" ? "Acepta Mascotas" : "Pet Friendly"}
                      </Badge>
                    )}
                    {unit.publishToMain && (
                      <Badge variant="default" className="bg-blue-600 dark:bg-blue-700" data-testid="badge-publish-main">
                        {language === "es" ? "Publicar en HomesApp" : "Publish to HomesApp"}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* History with Tabs */}
        <Card data-testid="card-history">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {language === "es" ? "Historial" : "History"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="rentals" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rentals" className="flex items-center gap-1 text-xs" data-testid="tab-rentals">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{language === "es" ? "Rentas" : "Rentals"}</span>
                  {rentalHistory.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{rentalHistory.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center gap-1 text-xs" data-testid="tab-maintenance">
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{language === "es" ? "Mant." : "Maint."}</span>
                  {maintenanceHistory.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{maintenanceHistory.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="showings" className="flex items-center gap-1 text-xs" data-testid="tab-showings">
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{language === "es" ? "Visitas" : "Shows"}</span>
                  {showingsHistory.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{showingsHistory.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rentals" className="mt-3">
                {rentalHistory.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm" data-testid="text-no-rentals">
                    {language === "es" ? "No hay historial de rentas" : "No rental history"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rentalHistory.map(rental => (
                      <div
                        key={rental.id}
                        className={`p-2.5 rounded-lg border cursor-pointer hover-elevate ${rental.status === 'active' ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}
                        onClick={() => navigate(`/external/contracts/${rental.id}`)}
                        data-testid={`rental-history-${rental.id}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-sm font-medium truncate">{rental.tenantName}</span>
                              <Badge 
                                variant={rental.status === 'active' ? 'default' : 'secondary'} 
                                className="shrink-0 h-5 text-[10px]"
                              >
                                {(contractStatusTranslations as any)[rental.status]?.[language] || rental.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              <span>${Number(rental.monthlyRent).toLocaleString()}/{language === "es" ? "mes" : "mo"}</span>
                              <span>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="maintenance" className="mt-3">
                {maintenanceHistory.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm" data-testid="text-no-maintenance">
                    {language === "es" ? "No hay historial de mantenimiento" : "No maintenance history"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {maintenanceHistory.map(ticket => (
                      <div
                        key={ticket.id}
                        className="p-2.5 rounded-lg border cursor-pointer hover-elevate"
                        onClick={() => navigate(`/external/maintenance/${ticket.id}`)}
                        data-testid={`maintenance-history-${ticket.id}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-sm font-medium truncate">{ticket.title}</span>
                              <Badge 
                                variant={ticket.status === 'resolved' || ticket.status === 'closed' ? 'secondary' : 'default'} 
                                className="shrink-0 h-5 text-[10px]"
                              >
                                {(ticketStatusTranslations as any)[ticket.status]?.[language] || ticket.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              {ticket.category && <span>{ticket.category}</span>}
                              <span>{formatDate(ticket.createdAt)}</span>
                              {ticket.actualCost && <span>${ticket.actualCost}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="showings" className="mt-3">
                {showingsHistory.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm" data-testid="text-no-showings">
                    {language === "es" ? "No hay historial de visitas" : "No showings history"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {showingsHistory.map(showing => (
                      <div
                        key={showing.id}
                        className="p-2.5 rounded-lg border"
                        data-testid={`showing-history-${showing.id}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-sm font-medium">{formatDate(showing.scheduledAt)}</span>
                              {showing.outcome && (
                                <Badge 
                                  variant={showing.outcome === 'interested' ? 'default' : 'secondary'} 
                                  className="shrink-0 h-5 text-[10px]"
                                >
                                  {(showingOutcomeTranslations as any)[showing.outcome]?.[language] || showing.outcome}
                                </Badge>
                              )}
                            </div>
                            {showing.leadFeedback && (
                              <p className="text-xs text-muted-foreground truncate">{showing.leadFeedback}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Owner + Referrer (if applicable) + Access Control */}
      <div className={`grid grid-cols-1 gap-4 ${unit?.commissionType === 'referido' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {/* Owner Information */}
        <Card data-testid="card-owner-info">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {language === "es" ? "Propietario" : "Owner"}
              </CardTitle>
              <Button
                size="sm"
                onClick={handleAddOwner}
                disabled={isLoadingAuth || !user}
                data-testid="button-add-owner"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {ownersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !owners || owners.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm" data-testid="text-no-owners">
                {language === "es" ? "No hay propietarios registrados" : "No owners registered"}
              </div>
            ) : (
              <div className="space-y-2">
                {owners.map(owner => (
                  <div
                    key={owner.id}
                    className={`p-2.5 rounded-lg border ${owner.isActive ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}
                    data-testid={`owner-card-${owner.id}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <p className="text-sm font-medium truncate" data-testid={`text-owner-name-${owner.id}`}>
                            {owner.ownerName}
                          </p>
                          {owner.ownershipPercentage && (
                            <Badge variant="outline" className="shrink-0 h-5 text-[10px]" data-testid={`badge-percentage-${owner.id}`}>
                              {owner.ownershipPercentage}%
                            </Badge>
                          )}
                          {owner.isActive && (
                            <Badge variant="default" className="shrink-0 h-5 text-[10px]" data-testid={`badge-active-${owner.id}`}>
                              {language === "es" ? "Actual" : "Current"}
                            </Badge>
                          )}
                        </div>
                        {owner.ownerEmail && (
                          <p className="text-xs text-muted-foreground truncate" data-testid={`text-owner-email-${owner.id}`}>
                            {owner.ownerEmail}
                          </p>
                        )}
                        {owner.ownerPhone && (
                          <p className="text-xs text-muted-foreground" data-testid={`text-owner-phone-${owner.id}`}>
                            {owner.ownerPhone}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditOwner(owner)}
                          disabled={isLoadingAuth || !user}
                          data-testid={`button-edit-owner-${owner.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteOwnerMutation.mutate(owner.id)}
                          disabled={deleteOwnerMutation.isPending || isLoadingAuth || !user}
                          data-testid={`button-delete-owner-${owner.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrer Information - Only show if commission type is 'referido' */}
        {unit?.commissionType === 'referido' && (
          <Card data-testid="card-referrer-info">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === "es" ? "Referido" : "Referrer"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {unit?.referrerName ? (
                <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" data-testid="text-referrer-name">
                        {unit.referrerName}
                      </p>
                      <Badge variant="secondary" className="h-5 text-[10px]">
                        20%
                      </Badge>
                    </div>
                    {unit.referrerEmail && (
                      <p className="text-xs text-muted-foreground" data-testid="text-referrer-email">
                        {unit.referrerEmail}
                      </p>
                    )}
                    {unit.referrerPhone && (
                      <p className="text-xs text-muted-foreground" data-testid="text-referrer-phone">
                        {unit.referrerPhone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm" data-testid="text-no-referrer">
                  {language === "es" ? "Sin información del referido" : "No referrer information"}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Access Control */}
        <Card data-testid="card-access-controls">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {language === "es" ? "Control de Acceso" : "Access Control"}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyAccessInfo}
                  disabled={!accessControls || accessControls.filter(a => a.isActive).length === 0}
                  data-testid="button-copy-access-info"
                >
                  {copiedAccessInfo ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddAccess}
                  disabled={isLoadingAuth || !user}
                  data-testid="button-add-access"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {accessLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !accessControls || accessControls.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm" data-testid="text-no-access">
                {language === "es" ? "No hay controles de acceso registrados" : "No access controls registered"}
              </div>
            ) : (
              <div className="space-y-2">
                {accessControls.map(access => (
                  <div
                    key={access.id}
                    className={`p-2.5 rounded-lg border ${access.isActive ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-60"}`}
                    data-testid={`access-card-${access.id}`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] h-5" data-testid={`badge-access-type-${access.id}`}>
                          {(accessTypeTranslations as any)[access.accessType]?.[language] || access.accessType}
                        </Badge>
                        {!access.isActive && (
                          <Badge variant="secondary" className="text-[10px] h-5" data-testid={`badge-inactive-${access.id}`}>
                            {language === "es" ? "Inactivo" : "Inactive"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleEditAccess(access)}
                          disabled={isLoadingAuth || !user}
                          data-testid={`button-edit-access-${access.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => deleteAccessMutation.mutate(access.id)}
                          disabled={deleteAccessMutation.isPending || isLoadingAuth || !user}
                          data-testid={`button-delete-access-${access.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {access.accessCode && (
                      <div className="flex items-center gap-1">
                        <code 
                          className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded flex-1 truncate" 
                          data-testid={`text-access-code-${access.id}`}
                        >
                          {visiblePasswords.has(access.id) ? access.accessCode : "••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0"
                          onClick={() => togglePasswordVisibility(access.id)}
                          data-testid={`button-toggle-visibility-${access.id}`}
                        >
                          {visiblePasswords.has(access.id) ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                        </Button>
                      </div>
                    )}
                    {access.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate" data-testid={`text-access-description-${access.id}`}>
                        {access.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unit Edit Dialog */}
      <Dialog open={showUnitEditDialog} onOpenChange={setShowUnitEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-unit-edit">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {language === "es" ? "Editar Unidad" : "Edit Unit"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Modifique la información de la unidad" 
                : "Modify the unit information"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...unitEditForm}>
            <form onSubmit={unitEditForm.handleSubmit(handleSubmitUnitEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitEditForm.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Número de Unidad" : "Unit Number"} *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-edit-unit-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="condominiumId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Condominio" : "Condominium"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-condominium">
                            <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{language === "es" ? "Sin condominio" : "No condominium"}</SelectItem>
                          {availableCondominiums.map(condo => (
                            <SelectItem key={condo.id} value={condo.id}>
                              {condo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitEditForm.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Zona / Colonia" : "Zone / Neighborhood"}</FormLabel>
                      {activeZones.length > 0 ? (
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-zone">
                              <SelectValue placeholder={language === "es" ? "Seleccionar zona..." : "Select zone..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{language === "es" ? "Sin zona" : "No zone"}</SelectItem>
                            {activeZones.map(zone => (
                              <SelectItem key={zone.id} value={zone.name}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Ej: La Veleta" : "E.g.: La Veleta"} data-testid="input-edit-zone" />
                        </FormControl>
                      )}
                      {activeZones.length === 0 && (
                        <FormDescription>
                          {language === "es" 
                            ? "Puedes agregar zonas predefinidas en Configuración" 
                            : "You can add predefined zones in Configuration"}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Ciudad" : "City"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Ej: Tulum" : "E.g.: Tulum"} data-testid="input-edit-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitEditForm.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Tipo de Propiedad" : "Property Type"}</FormLabel>
                      {activePropertyTypes.length > 0 ? (
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-property-type">
                              <SelectValue placeholder={language === "es" ? "Seleccionar tipo..." : "Select type..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{language === "es" ? "Sin tipo" : "No type"}</SelectItem>
                            {activePropertyTypes.map(pt => (
                              <SelectItem key={pt.id} value={pt.name}>
                                {pt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Ej: Departamento" : "E.g.: Apartment"} data-testid="input-edit-property-type" />
                        </FormControl>
                      )}
                      {activePropertyTypes.length === 0 && (
                        <FormDescription>
                          {language === "es" 
                            ? "Puedes agregar tipos de propiedad en Configuración" 
                            : "You can add property types in Configuration"}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitEditForm.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Piso" : "Floor"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-floor">
                            <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{language === "es" ? "Sin especificar" : "Not specified"}</SelectItem>
                          {floorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {language === "es" ? opt.labelEs : opt.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Área (m²)" : "Area (m²)"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01" 
                          min="0"
                          value={field.value ?? ""} 
                          onChange={e => field.onChange(e.target.value)}
                          data-testid="input-edit-area" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitEditForm.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Recámaras" : "Bedrooms"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0"
                          value={field.value ?? ""} 
                          onChange={e => field.onChange(e.target.value)}
                          data-testid="input-edit-bedrooms" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Baños" : "Bathrooms"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.5" 
                          min="0"
                          value={field.value ?? ""} 
                          onChange={e => field.onChange(e.target.value)}
                          data-testid="input-edit-bathrooms" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={unitEditForm.control}
                name="photosDriveLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Link de Fotos (Drive/Airbnb)" : "Photos Link (Drive/Airbnb)"}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="url" placeholder="https://drive.google.com/... o https://airbnb.com/..." data-testid="input-edit-photos-link" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={unitEditForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} rows={3} placeholder={language === "es" ? "Notas adicionales..." : "Additional notes..."} data-testid="input-edit-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {language === "es" ? "Información de Marketing" : "Marketing Information"}
              </h4>

              <FormField
                control={unitEditForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Título del Listado" : "Listing Title"}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Ej: Hermoso departamento con vista al mar" : "E.g.: Beautiful apartment with ocean view"} data-testid="input-edit-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={unitEditForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} rows={4} placeholder={language === "es" ? "Descripción detallada de la propiedad..." : "Detailed property description..."} data-testid="input-edit-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitEditForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Precio Mensual" : "Monthly Price"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01" 
                          min="0"
                          value={field.value ?? ""} 
                          onChange={e => field.onChange(e.target.value)}
                          placeholder="25000"
                          data-testid="input-edit-price" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Moneda" : "Currency"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "MXN"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-currency">
                            <SelectValue placeholder="MXN" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MXN">MXN (Peso Mexicano)</SelectItem>
                          <SelectItem value="USD">USD (Dólar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {language === "es" ? "Ubicación" : "Location"}
              </h4>

              <FormField
                control={unitEditForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Dirección Completa" : "Full Address"}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Calle, número, colonia, ciudad" : "Street, number, neighborhood, city"} data-testid="input-edit-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={unitEditForm.control}
                name="googleMapsUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Link de Google Maps" : "Google Maps Link"}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="url" placeholder="https://maps.google.com/..." data-testid="input-edit-google-maps" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={unitEditForm.control}
                name="virtualTourUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Tour Virtual 360°" : "Virtual Tour 360°"}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="url" placeholder="https://..." data-testid="input-edit-virtual-tour" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitEditForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Latitud" : "Latitude"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.0000001"
                          value={field.value ?? ""} 
                          onChange={e => field.onChange(e.target.value)}
                          placeholder="20.2120000"
                          data-testid="input-edit-latitude" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Longitud" : "Longitude"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.0000001"
                          value={field.value ?? ""} 
                          onChange={e => field.onChange(e.target.value)}
                          placeholder="-87.4290000"
                          data-testid="input-edit-longitude" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {language === "es" ? "Servicios Incluidos" : "Included Services"}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={unitEditForm.control}
                  name="includedServices.water"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-water"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">{language === "es" ? "Agua" : "Water"}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="includedServices.electricity"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-electricity"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">{language === "es" ? "Electricidad" : "Electricity"}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="includedServices.internet"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-internet"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">{language === "es" ? "Internet" : "Internet"}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitEditForm.control}
                  name="includedServices.gas"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-gas"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">{language === "es" ? "Gas" : "Gas"}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {language === "es" ? "Características y Estado" : "Features and Status"}
              </h4>

              <FormField
                control={unitEditForm.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <UnitAmenitiesSelector
                      amenities={field.value || []}
                      language={language}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={unitEditForm.control}
                name="petFriendly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{language === "es" ? "Acepta Mascotas" : "Pet Friendly"}</FormLabel>
                      <FormDescription>
                        {field.value 
                          ? (language === "es" ? "Se permiten mascotas" : "Pets are allowed")
                          : (language === "es" ? "No se permiten mascotas" : "No pets allowed")
                        }
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-pet-friendly"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={unitEditForm.control}
                name="publishToMain"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{language === "es" ? "Publicar en Sitio Principal" : "Publish to Main Site"}</FormLabel>
                      <FormDescription>
                        {field.value 
                          ? (language === "es" ? "Se solicitará publicación en HomesApp" : "Will request publication on HomesApp")
                          : (language === "es" ? "Solo visible en gestión externa" : "Only visible in external management")
                        }
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-publish-to-main"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={unitEditForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{language === "es" ? "Estado de la Unidad" : "Unit Status"}</FormLabel>
                      <FormDescription>
                        {field.value 
                          ? (language === "es" ? "La unidad está activa y disponible" : "The unit is active and available")
                          : (language === "es" ? "La unidad está inactiva" : "The unit is inactive")
                        }
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUnitEditDialog(false)}
                  data-testid="button-cancel-edit-unit"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={updateUnitMutation.isPending}
                  data-testid="button-submit-edit-unit"
                >
                  {updateUnitMutation.isPending
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar Cambios" : "Save Changes")
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Owner Dialog */}
      <Dialog open={showOwnerDialog} onOpenChange={setShowOwnerDialog}>
        <DialogContent data-testid="dialog-owner-form">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {editingOwner 
                ? (language === "es" ? "Editar Propietario" : "Edit Owner")
                : (language === "es" ? "Agregar Propietario" : "Add Owner")
              }
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Ingrese la información del propietario de la unidad" 
                : "Enter the unit owner information"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...ownerForm}>
            <form onSubmit={ownerForm.handleSubmit(handleSubmitOwner)} className="space-y-4">
              <FormField
                control={ownerForm.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre" : "Name"} *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Nombre completo" : "Full name"} data-testid="input-owner-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={ownerForm.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Email" : "Email"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" placeholder="email@example.com" data-testid="input-owner-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ownerForm.control}
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="+52 123 456 7890" data-testid="input-owner-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={ownerForm.control}
                name="ownershipPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Porcentaje de Propiedad (%)" : "Ownership Percentage (%)"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        max="100" 
                        placeholder="100.00" 
                        data-testid="input-owner-percentage" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ownerForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} rows={2} placeholder={language === "es" ? "Notas adicionales..." : "Additional notes..."} data-testid="input-owner-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ownerForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">{language === "es" ? "Propietario Actual" : "Current Owner"}</FormLabel>
                      <div className="text-xs text-muted-foreground">
                        {language === "es" 
                          ? "Marcar como el propietario actual" 
                          : "Mark as the current owner"
                        }
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-owner-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowOwnerDialog(false);
                    setEditingOwner(null);
                    ownerForm.reset();
                  }}
                  data-testid="button-cancel-owner"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={createOwnerMutation.isPending || updateOwnerMutation.isPending}
                  data-testid="button-submit-owner"
                >
                  {(createOwnerMutation.isPending || updateOwnerMutation.isPending)
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (editingOwner ? (language === "es" ? "Actualizar" : "Update") : (language === "es" ? "Agregar" : "Add"))
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Access Control Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent data-testid="dialog-access-form">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {editingAccess 
                ? (language === "es" ? "Editar Control de Acceso" : "Edit Access Control")
                : (language === "es" ? "Agregar Control de Acceso" : "Add Access Control")
              }
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Ingrese la información del control de acceso" 
                : "Enter the access control information"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...accessForm}>
            <form onSubmit={accessForm.handleSubmit(handleSubmitAccess)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={accessForm.control}
                  name="accessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Tipo de Acceso" : "Access Type"} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-access-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(accessTypeTranslations).map(([key, translations]) => (
                            <SelectItem key={key} value={key}>
                              {(translations as any)[language]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={accessForm.control}
                  name="accessCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Código/Clave" : "Code/Password"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Código..." : "Code..."} data-testid="input-access-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={accessForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} rows={2} placeholder={language === "es" ? "Detalles adicionales..." : "Additional details..."} data-testid="input-access-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormField
                  control={accessForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">{language === "es" ? "Activo" : "Active"}</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          {language === "es" ? "Marcar si está activo" : "Mark if active"}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-access-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={accessForm.control}
                  name="canShareWithMaintenance"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">{language === "es" ? "Compartir con Mantenimiento" : "Share with Maintenance"}</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          {language === "es" ? "Permitir acceso a mantenimiento" : "Allow maintenance access"}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-share-maintenance"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAccessDialog(false);
                    setEditingAccess(null);
                    accessForm.reset();
                  }}
                  data-testid="button-cancel-access"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={createAccessMutation.isPending || updateAccessMutation.isPending}
                  data-testid="button-submit-access"
                >
                  {(createAccessMutation.isPending || updateAccessMutation.isPending)
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (editingAccess ? (language === "es" ? "Actualizar" : "Update") : (language === "es" ? "Agregar" : "Add"))
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Rental Contract Dialog */}
      <Dialog open={showRentalDialog} onOpenChange={setShowRentalDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-rental">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-rental-dialog-title">
              <Home className="h-5 w-5" />
              {language === "es" ? "Generar Renta Activa" : "Generate Active Rental"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Complete la información del contrato de renta y adjunte los documentos necesarios" 
                : "Complete the rental contract information and attach required documents"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...rentalForm}>
            <form onSubmit={rentalForm.handleSubmit(handleSubmitRental)} className="space-y-6">
              {/* Tenant Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{language === "es" ? "Información del Inquilino" : "Tenant Information"}</h3>
                </div>
                <Separator />
                <div className="grid gap-4">
                  <FormField
                    control={rentalForm.control}
                    name="tenantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Nombre del Inquilino" : "Tenant Name"} *</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Nombre completo..." : "Full name..."} data-testid="input-tenant-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={rentalForm.control}
                      name="tenantEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Email del Inquilino" : "Tenant Email"}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="email" placeholder="email@example.com" data-testid="input-tenant-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={rentalForm.control}
                      name="tenantPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Teléfono del Inquilino" : "Tenant Phone"}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="+52..." data-testid="input-tenant-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Contract Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{language === "es" ? "Detalles del Contrato" : "Contract Details"}</h3>
                </div>
                <Separator />
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={rentalForm.control}
                      name="monthlyRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Renta Mensual" : "Monthly Rent"} *</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="number" step="0.01" min="0" placeholder="0.00" data-testid="input-monthly-rent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={rentalForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Moneda" : "Currency"} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MXN">MXN</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={rentalForm.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Depósito de Seguridad" : "Security Deposit"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" step="0.01" min="0" placeholder="0.00" data-testid="input-security-deposit" />
                        </FormControl>
                        <FormDescription>
                          {language === "es" 
                            ? "Monto reembolsable al finalizar el contrato" 
                            : "Refundable amount at the end of the contract"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={rentalForm.control}
                      name="leaseDurationMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Duración (meses)" : "Duration (months)"} *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1" 
                              onChange={(e) => {
                                const months = parseInt(e.target.value) || 12;
                                field.onChange(months);
                                const startDate = rentalForm.getValues('startDate');
                                if (startDate) {
                                  const endDate = new Date(startDate);
                                  endDate.setMonth(endDate.getMonth() + months);
                                  rentalForm.setValue('endDate', endDate);
                                }
                              }}
                              data-testid="input-lease-duration" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={rentalForm.control}
                      name="rentalPurpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Propósito" : "Purpose"} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "living"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-rental-purpose-create">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="living">
                                {language === "es" ? "Para Vivir" : "For Living"}
                              </SelectItem>
                              <SelectItem value="sublease">
                                {language === "es" ? "Para Subarrendar" : "For Sublease"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={rentalForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Fecha de Inicio" : "Start Date"} *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="date" 
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const startDate = new Date(e.target.value);
                                field.onChange(startDate);
                                const months = rentalForm.getValues('leaseDurationMonths');
                                const endDate = new Date(startDate);
                                endDate.setMonth(endDate.getMonth() + months);
                                rentalForm.setValue('endDate', endDate);
                              }}
                              data-testid="input-start-date" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={rentalForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Fecha de Fin" : "End Date"} *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="date" 
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              data-testid="input-end-date" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{language === "es" ? "Documentos" : "Documents"}</h3>
                </div>
                <Separator />
                <div className="grid gap-4">
                  <FormField
                    control={rentalForm.control}
                    name="leaseContractUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "URL del Contrato" : "Contract URL"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="url" placeholder="https://..." data-testid="input-contract-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rentalForm.control}
                    name="inventoryUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "URL del Inventario" : "Inventory URL"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="url" placeholder="https://..." data-testid="input-inventory-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rentalForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} rows={3} placeholder={language === "es" ? "Notas adicionales..." : "Additional notes..."} data-testid="input-rental-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRentalDialog(false);
                    rentalForm.reset();
                  }}
                  data-testid="button-cancel-rental"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={createRentalMutation.isPending}
                  data-testid="button-submit-rental"
                >
                  {createRentalMutation.isPending
                    ? (language === "es" ? "Creando..." : "Creating...")
                    : (language === "es" ? "Crear Renta" : "Create Rental")
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Property Preview Dialog */}
      <PropertyPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        unit={{
          unitNumber: unit.unitNumber,
          title: unit.title,
          description: unit.description,
          price: unit.price,
          propertyType: unit.propertyType,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          area: unit.area,
          zone: unit.zone,
          city: unit.city,
          address: unit.address,
          primaryImages: unit.primaryImages || [],
          secondaryImages: unit.secondaryImages || [],
          videos: unit.videos || [],
          virtualTourUrl: unit.virtualTourUrl,
          googleMapsUrl: unit.googleMapsUrl,
          amenities: unit.amenities || [],
          includedServices: unit.includedServices,
          petFriendly: unit.petFriendly,
        }}
        condominiumName={condominium?.name}
        language={language}
      />

      {/* Unpublish Confirmation Dialog */}
      <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-unpublish">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              {language === "es" ? "Quitar de Publicación" : "Remove from Publication"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Esta acción removerá el listado del sitio público. Los visitantes ya no podrán ver esta propiedad."
                : "This action will remove the listing from the public site. Visitors will no longer be able to see this property."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUnpublishDialog(false)}
              data-testid="button-cancel-unpublish"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => unpublishMutation.mutate()}
              disabled={unpublishMutation.isPending}
              data-testid="button-confirm-unpublish"
            >
              {unpublishMutation.isPending
                ? (language === "es" ? "Removiendo..." : "Removing...")
                : (language === "es" ? "Sí, quitar publicación" : "Yes, unpublish")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Owner Link Generation Dialog */}
      <Dialog open={showOwnerLinkDialog} onOpenChange={(open) => {
        setShowOwnerLinkDialog(open);
        if (!open) {
          setSelectedOwnerForLink(null);
          setGeneratedOwnerLink(null);
        }
      }}>
        <DialogContent className="max-w-md" data-testid="dialog-owner-link">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              {language === "es" ? "Enlace para Propietario" : "Owner Intake Link"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Genera un enlace privado para que el propietario complete la información de su propiedad."
                : "Generate a private link for the owner to complete their property information."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!generatedOwnerLink ? (
              <>
                <div className="space-y-2">
                  <Label>{language === "es" ? "Seleccionar Propietario" : "Select Owner"}</Label>
                  <Select
                    value={selectedOwnerForLink?.id || ''}
                    onValueChange={(value) => {
                      const owner = owners?.find(o => o.id === value);
                      setSelectedOwnerForLink(owner || null);
                    }}
                    data-testid="select-owner-for-link"
                  >
                    <SelectTrigger className="min-h-[44px]" data-testid="trigger-owner-for-link">
                      <SelectValue placeholder={language === "es" ? "Selecciona un propietario" : "Select an owner"} />
                    </SelectTrigger>
                    <SelectContent>
                      {owners?.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id} data-testid={`option-owner-${owner.id}`}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {owner.ownerName}
                            {owner.isActive && (
                              <Badge variant="outline" className="text-xs ml-1">
                                {language === "es" ? "Principal" : "Primary"}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedOwnerForLink && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p><strong>{language === "es" ? "Email:" : "Email:"}</strong> {selectedOwnerForLink.ownerEmail || '-'}</p>
                    <p><strong>{language === "es" ? "Teléfono:" : "Phone:"}</strong> {selectedOwnerForLink.ownerPhone || '-'}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                    {language === "es" ? "Enlace generado exitosamente:" : "Link generated successfully:"}
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      value={generatedOwnerLink} 
                      readOnly 
                      className="text-xs"
                      data-testid="input-generated-owner-link"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(generatedOwnerLink);
                          setCopiedOwnerLink(true);
                          setTimeout(() => setCopiedOwnerLink(false), 2000);
                          toast({
                            title: language === "es" ? "Enlace copiado" : "Link copied",
                          });
                        } catch (err) {
                          toast({
                            title: language === "es" ? "Error al copiar" : "Copy failed",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-copy-owner-link"
                    >
                      {copiedOwnerLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "es" 
                    ? "Este enlace expira en 24 horas. Compártelo con el propietario por WhatsApp o email."
                    : "This link expires in 24 hours. Share it with the owner via WhatsApp or email."
                  }
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowOwnerLinkDialog(false);
                setSelectedOwnerForLink(null);
                setGeneratedOwnerLink(null);
              }}
              data-testid="button-close-owner-link"
            >
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
            {!generatedOwnerLink && (
              <Button
                onClick={() => {
                  if (selectedOwnerForLink) {
                    generateOwnerLinkMutation.mutate(selectedOwnerForLink.id);
                  }
                }}
                disabled={!selectedOwnerForLink || generateOwnerLinkMutation.isPending}
                data-testid="button-generate-owner-link"
              >
                {generateOwnerLinkMutation.isPending
                  ? (language === "es" ? "Generando..." : "Generating...")
                  : (language === "es" ? "Generar Enlace" : "Generate Link")
                }
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Status Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-verification">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {language === "es" ? "Verificación del Listing" : "Listing Verification"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Actualiza el estado de verificación interna para control de calidad"
                : "Update internal verification status for quality control"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "es" ? "Estado de Verificación" : "Verification Status"}</Label>
              <Select
                value={unit.verificationStatus || 'unverified'}
                onValueChange={(value) => {
                  updateVerificationMutation.mutate({
                    verificationStatus: value,
                    verificationNotes: unit.verificationNotes || undefined,
                  });
                }}
                data-testid="select-verification-status"
              >
                <SelectTrigger className="min-h-[44px]" data-testid="trigger-verification-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unverified" data-testid="option-unverified">
                    <div className="flex items-center gap-2">
                      <ShieldX className="h-4 w-4 text-muted-foreground" />
                      {language === "es" ? "Sin Verificar" : "Unverified"}
                    </div>
                  </SelectItem>
                  <SelectItem value="pending_review" data-testid="option-pending-review">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-yellow-500" />
                      {language === "es" ? "En Revisión" : "Pending Review"}
                    </div>
                  </SelectItem>
                  <SelectItem value="verified" data-testid="option-verified">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      {language === "es" ? "Verificado" : "Verified"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {unit.verifiedAt && (
              <div className="text-sm text-muted-foreground">
                {language === "es" ? "Verificado el" : "Verified on"}: {new Date(unit.verifiedAt).toLocaleDateString(language === "es" ? "es-MX" : "en-US")}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
              data-testid="button-close-verification"
            >
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
