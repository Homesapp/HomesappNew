import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Building2, Calendar as CalendarIcon, Home, Sparkles, MapPin, Clock, PawPrint } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  es: {
    loading: "Cargando...",
    invalidLink: "Enlace Inválido",
    invalidLinkDesc: "Este enlace de registro es inválido o ha expirado.",
    fetchError: "Error al cargar el formulario de registro",
    successTitle: "¡Registro Exitoso!",
    successDescription: "¡Gracias por registrarte! Nos pondremos en contacto contigo pronto con la información proporcionada.",
    clientSuccessDescription: "¡Gracias por completar tus requisitos! Un agente se pondrá en contacto contigo para ayudarte a encontrar la propiedad ideal.",
    sellerRegistration: "Registro de Vendedor",
    brokerRegistration: "Registro de Broker",
    clientRegistration: "Registro de Cliente",
    clientFormDescription: "Complete sus datos y preferencias de búsqueda para que podamos ayudarle a encontrar la propiedad ideal.",
    formExpires: "Este formulario expira el",
    notAvailable: "N/D",
    firstName: "Nombre",
    lastName: "Apellido",
    firstNamePlaceholder: "Juan",
    lastNamePlaceholder: "Pérez",
    email: "Correo Electrónico",
    emailPlaceholder: "juan@ejemplo.com",
    phone: "Número de Teléfono",
    phonePlaceholder: "+52 (998) 123-4567",
    phoneLast4: "Últimos 4 dígitos del Teléfono",
    phoneLast4Placeholder: "1234",
    searchPreferences: "Preferencias de Búsqueda",
    propertyType: "Tipo de Propiedad",
    selectTypes: "Seleccionar tipos...",
    searchType: "Buscar tipo...",
    noTypesFound: "No se encontraron tipos.",
    zoneArea: "Zona / Área",
    selectAreas: "Seleccionar áreas...",
    searchArea: "Buscar área...",
    noAreasFound: "No se encontraron áreas.",
    rentBudget: "Presupuesto de Renta (MXN)",
    budgetPlaceholder: "Ej: 18-25 mil",
    bedrooms: "Recámaras",
    bedroomsPlaceholder: "Ej: 1-2, 2+",
    contractDuration: "Duración del Contrato",
    selectDuration: "Seleccionar duración...",
    search: "Buscar...",
    notFound: "No encontrado.",
    months6: "6 meses",
    year1: "1 año",
    years2: "2 años",
    years3Plus: "3+ años",
    checkInDate: "Fecha de Check-in Deseada",
    hasPets: "¿Tiene Mascotas?",
    selectOption: "Seleccionar...",
    petNo: "No",
    petDog: "Sí - Perro",
    petCat: "Sí - Gato",
    petOther: "Sí - Otro",
    numberOfPets: "Número de Mascotas",
    desiredFeatures: "Características Deseadas (Opcional)",
    unitCharacteristics: "Características de la Unidad",
    developmentAmenities: "Amenidades del Desarrollo",
    additionalNotes: "Notas Adicionales",
    notesPlaceholder: "Cualquier información adicional que desee compartir...",
    submitting: "Enviando...",
    submitRegistration: "Enviar Registro",
    required: "*",
    errFirstName: "El nombre es requerido",
    errLastName: "El apellido es requerido",
    errEmailRequired: "El correo electrónico es requerido",
    errEmailInvalid: "Formato de correo electrónico inválido",
    errPhoneRequired: "El teléfono es requerido",
    errPhoneLast4Required: "Los últimos 4 dígitos del teléfono son requeridos para brokers",
    errPhoneLast4Format: "Deben ser exactamente 4 dígitos",
    submitError: "Error al enviar el registro",
    propApartment: "Departamento",
    propHouse: "Casa",
    propStudio: "Estudio",
    propPenthouse: "PH / Penthouse",
    propVilla: "Villa",
    zoneAldeaZama: "Aldea Zama",
    zoneLaVeleta: "La Veleta",
    zoneCentro: "Centro",
    zoneOther: "Otro",
  },
  en: {
    loading: "Loading...",
    invalidLink: "Invalid Link",
    invalidLinkDesc: "This registration link is invalid or has expired.",
    fetchError: "Failed to fetch registration form",
    successTitle: "Registration Successful!",
    successDescription: "Thank you for registering! We will contact you shortly at the information you provided.",
    clientSuccessDescription: "Thank you for completing your requirements! An agent will contact you soon to help you find the ideal property.",
    sellerRegistration: "Seller Registration",
    brokerRegistration: "Broker Registration",
    clientRegistration: "Client Registration",
    clientFormDescription: "Complete your details and search preferences so we can help you find the ideal property.",
    formExpires: "This form will expire on",
    notAvailable: "N/A",
    firstName: "First Name",
    lastName: "Last Name",
    firstNamePlaceholder: "John",
    lastNamePlaceholder: "Doe",
    email: "Email",
    emailPlaceholder: "john@example.com",
    phone: "Phone Number",
    phonePlaceholder: "+1 (555) 123-4567",
    phoneLast4: "Last 4 Digits of Phone",
    phoneLast4Placeholder: "1234",
    searchPreferences: "Search Preferences",
    propertyType: "Property Type",
    selectTypes: "Select types...",
    searchType: "Search type...",
    noTypesFound: "No types found.",
    zoneArea: "Zone / Area",
    selectAreas: "Select areas...",
    searchArea: "Search area...",
    noAreasFound: "No areas found.",
    rentBudget: "Rent Budget (MXN)",
    budgetPlaceholder: "E.g: 18-25 mil",
    bedrooms: "Bedrooms",
    bedroomsPlaceholder: "E.g: 1-2, 2+",
    contractDuration: "Contract Duration",
    selectDuration: "Select duration...",
    search: "Search...",
    notFound: "Not found.",
    months6: "6 months",
    year1: "1 year",
    years2: "2 years",
    years3Plus: "3+ years",
    checkInDate: "Desired Check-in Date",
    hasPets: "Has Pets?",
    selectOption: "Select...",
    petNo: "No",
    petDog: "Yes - Dog",
    petCat: "Yes - Cat",
    petOther: "Yes - Other",
    numberOfPets: "Number of Pets",
    desiredFeatures: "Desired Features (Optional)",
    unitCharacteristics: "Unit Characteristics",
    developmentAmenities: "Development Amenities",
    additionalNotes: "Additional Notes",
    notesPlaceholder: "Any additional information you'd like to share...",
    submitting: "Submitting...",
    submitRegistration: "Submit Registration",
    required: "*",
    errFirstName: "First name is required",
    errLastName: "Last name is required",
    errEmailRequired: "Email is required",
    errEmailInvalid: "Invalid email format",
    errPhoneRequired: "Phone is required",
    errPhoneLast4Required: "Last 4 digits of phone are required for brokers",
    errPhoneLast4Format: "Must be exactly 4 digits",
    submitError: "Failed to submit registration",
    propApartment: "Apartment",
    propHouse: "House",
    propStudio: "Studio",
    propPenthouse: "PH / Penthouse",
    propVilla: "Villa",
    zoneAldeaZama: "Aldea Zama",
    zoneLaVeleta: "La Veleta",
    zoneCentro: "Centro",
    zoneOther: "Other",
  }
};

export default function PublicLeadRegistration() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const { language } = useLanguage();
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneLast4: "",
    checkInDate: "",
    hasPets: "",
    petQuantity: 1,
    estimatedRentCost: "",
    bedroomsDesired: "",
    contractDuration: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  // Fetch registration form data
  const { data: formInfo, isLoading, error } = useQuery<{
    agencyName: string;
    registrationType: "seller" | "broker";
    expiresAt: string;
    agencyId?: string;
  }>({
    queryKey: [`/api/leads/${token}`],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.fetchError);
      }
      return response.json();
    },
    retry: false,
  });

  // Fetch characteristics and amenities for the agency
  const { data: characteristicsData = [] } = useQuery<Array<{id: string; name: string; nameEn?: string; category?: string; isActive: boolean}>>({
    queryKey: [`/api/leads/${token}/characteristics`],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${token}/characteristics`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!token && !!formInfo,
  });
  const activeCharacteristics = characteristicsData.filter(c => c.isActive);

  const { data: amenitiesData = [] } = useQuery<Array<{id: string; name: string; nameEn?: string; category?: string; isActive: boolean}>>({
    queryKey: [`/api/leads/${token}/amenities`],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${token}/amenities`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!token && !!formInfo,
  });
  const activeAmenities = amenitiesData.filter(a => a.isActive);

  // Fetch property types for the agency
  const { data: propertyTypesData = [] } = useQuery<Array<{id: string; name: string; nameEn?: string; isActive: boolean}>>({
    queryKey: [`/api/leads/${token}/property-types`],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${token}/property-types`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!token && !!formInfo,
  });
  const activePropertyTypes = propertyTypesData.filter(pt => pt.isActive);

  // Fetch zones for the agency
  const { data: zonesData = [] } = useQuery<Array<{id: string; name: string; nameEn?: string; isActive: boolean}>>({
    queryKey: [`/api/leads/${token}/zones`],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${token}/zones`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!token && !!formInfo,
  });
  const activeZones = zonesData.filter(z => z.isActive);

  // Default options when API doesn't return data - using translated labels
  const defaultPropertyTypes = [
    { value: "Departamento", label: t.propApartment },
    { value: "Casa", label: t.propHouse },
    { value: "Estudio", label: t.propStudio },
    { value: "PH / Penthouse", label: t.propPenthouse },
    { value: "Villa", label: t.propVilla },
  ];

  const defaultZones = [
    { value: "Aldea Zama", label: t.zoneAldeaZama },
    { value: "La Veleta", label: t.zoneLaVeleta },
    { value: "Centro", label: t.zoneCentro },
    { value: "Otro", label: t.zoneOther },
  ];

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Helper: parse budget text to extract numeric value (in pesos)
      const parseBudgetText = (text?: string): number | undefined => {
        if (!text) return undefined;
        const cleanText = text.toLowerCase().replace(/,/g, '').replace(/\$/g, '').trim();
        const match = cleanText.match(/(\d+(?:\.\d+)?)/);
        if (!match) return undefined;
        let num = parseFloat(match[1]);
        if (cleanText.includes('mil') || cleanText.includes('k') || num < 100) {
          num = num * 1000;
        }
        return Math.round(num);
      };
      
      // Helper: parse bedrooms text to extract numeric value
      const parseBedroomsText = (text?: string): number | undefined => {
        if (!text) return undefined;
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : undefined;
      };
      
      // Parse numeric values from text fields
      const numericBudget = parseBudgetText(data.estimatedRentCost);
      const numericBedrooms = parseBedroomsText(data.bedroomsDesired);
      
      const response = await fetch(`/api/leads/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // Text fields for display
          estimatedRentCostText: data.estimatedRentCost,
          bedroomsText: data.bedroomsDesired,
          // Numeric fields for filtering (parsed from text)
          estimatedRentCost: numericBudget,
          bedrooms: numericBedrooms,
          // Contract duration
          contractDuration: data.contractDuration,
          // Pets information
          hasPets: data.hasPets,
          petQuantity: data.hasPets && data.hasPets !== "No" ? data.petQuantity : null,
          // Property preferences
          desiredUnitType: selectedPropertyTypes.join(", "),
          desiredNeighborhood: selectedZones.join(", "),
          // Selected characteristics and amenities
          desiredCharacteristics: selectedCharacteristics,
          desiredAmenities: selectedAmenities,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.submitError);
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitSuccess(true);
    },
    onError: (error: any) => {
      setErrors({ submit: error.message || t.submitError });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t.errFirstName;
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t.errLastName;
    }

    if (formInfo?.registrationType === "seller" || formInfo?.registrationType === "client") {
      if (!formData.email.trim()) {
        newErrors.email = t.errEmailRequired;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t.errEmailInvalid;
      }
      if (!formData.phone.trim()) {
        newErrors.phone = t.errPhoneRequired;
      }
    } else if (formInfo?.registrationType === "broker") {
      if (!formData.phoneLast4.trim()) {
        newErrors.phoneLast4 = t.errPhoneLast4Required;
      } else if (!/^\d{4}$/.test(formData.phoneLast4)) {
        newErrors.phoneLast4 = t.errPhoneLast4Format;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <div className="text-muted-foreground">{t.loading}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md relative">
          <div className="absolute right-4 top-4">
            <LanguageToggle />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>{t.invalidLink}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {(error as Error).message || t.invalidLinkDesc}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>{t.successTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {formInfo?.registrationType === "client" 
                ? t.clientSuccessDescription 
                : t.successDescription}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl relative">
        <div className="absolute right-4 top-4">
          <LanguageToggle />
        </div>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-6 w-6" />
            <Badge variant="outline">{formInfo?.agencyName}</Badge>
          </div>
          <CardTitle className="text-2xl">
            {formInfo?.registrationType === "client" 
              ? t.clientRegistration 
              : formInfo?.registrationType === "seller" 
                ? t.sellerRegistration 
                : t.brokerRegistration}
          </CardTitle>
          <CardDescription>
            {formInfo?.registrationType === "client" 
              ? t.clientFormDescription
              : `${t.formExpires} ${formInfo?.expiresAt ? new Date(formInfo.expiresAt).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US') : t.notAvailable}.`}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* First and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t.firstName} {t.required}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder={t.firstNamePlaceholder}
                  data-testid="input-firstname"
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t.lastName} {t.required}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder={t.lastNamePlaceholder}
                  data-testid="input-lastname"
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            {/* Seller and Client fields - require email and phone */}
            {(formInfo?.registrationType === "seller" || formInfo?.registrationType === "client") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email} {t.required}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t.emailPlaceholder}
                    data-testid="input-email"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phone} {t.required}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t.phonePlaceholder}
                    data-testid="input-phone"
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
              </>
            )}

            {/* Broker-specific fields */}
            {formInfo?.registrationType === "broker" && (
              <div className="space-y-2">
                <Label htmlFor="phoneLast4">{t.phoneLast4} {t.required}</Label>
                <Input
                  id="phoneLast4"
                  type="text"
                  maxLength={4}
                  value={formData.phoneLast4}
                  onChange={(e) => setFormData({ ...formData, phoneLast4: e.target.value.replace(/\D/g, "") })}
                  placeholder={t.phoneLast4Placeholder}
                  data-testid="input-phone-last4"
                />
                {errors.phoneLast4 && <p className="text-sm text-destructive">{errors.phoneLast4}</p>}
              </div>
            )}

            {/* Search Preferences Section */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>{t.searchPreferences}</span>
              </div>

              {/* Property Type & Zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.propertyType}
                  </Label>
                  <SearchableMultiSelect
                    value={selectedPropertyTypes}
                    onValueChange={setSelectedPropertyTypes}
                    options={activePropertyTypes.length > 0 
                      ? activePropertyTypes.map(pt => ({ value: pt.name, label: language === 'es' ? pt.name : (pt.nameEn || pt.name) }))
                      : defaultPropertyTypes
                    }
                    placeholder={t.selectTypes}
                    searchPlaceholder={t.searchType}
                    emptyMessage={t.noTypesFound}
                    showSelectedBelow={false}
                    data-testid="multiselect-property-type"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.zoneArea}
                  </Label>
                  <SearchableMultiSelect
                    value={selectedZones}
                    onValueChange={setSelectedZones}
                    options={activeZones.length > 0 
                      ? activeZones.map(z => ({ value: z.name, label: language === 'es' ? z.name : (z.nameEn || z.name) }))
                      : defaultZones
                    }
                    placeholder={t.selectAreas}
                    searchPlaceholder={t.searchArea}
                    emptyMessage={t.noAreasFound}
                    showSelectedBelow={false}
                    data-testid="multiselect-zone"
                  />
                </div>
              </div>

              {/* Budget & Bedrooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedRentCost">{t.rentBudget}</Label>
                  <Input
                    id="estimatedRentCost"
                    value={formData.estimatedRentCost}
                    onChange={(e) => setFormData({ ...formData, estimatedRentCost: e.target.value })}
                    placeholder={t.budgetPlaceholder}
                    data-testid="input-rent-budget"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedroomsDesired">{t.bedrooms}</Label>
                  <Input
                    id="bedroomsDesired"
                    value={formData.bedroomsDesired}
                    onChange={(e) => setFormData({ ...formData, bedroomsDesired: e.target.value })}
                    placeholder={t.bedroomsPlaceholder}
                    data-testid="input-bedrooms"
                  />
                </div>
              </div>

              {/* Contract Duration & Check-in Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.contractDuration}
                  </Label>
                  <SearchableSelect
                    value={formData.contractDuration}
                    onValueChange={(value) => setFormData({ ...formData, contractDuration: value })}
                    options={[
                      { value: "6 meses", label: t.months6 },
                      { value: "1 año", label: t.year1 },
                      { value: "2 años", label: t.years2 },
                      { value: "3+ años", label: t.years3Plus },
                    ]}
                    placeholder={t.selectDuration}
                    searchPlaceholder={t.search}
                    emptyMessage={t.notFound}
                    data-testid="select-contract-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkInDate" className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.checkInDate}
                  </Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    min={`${new Date().getFullYear()}-01-01`}
                    max={`${new Date().getFullYear() + 3}-12-31`}
                    value={formData.checkInDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const year = parseInt(val.split('-')[0]);
                        const minYear = new Date().getFullYear();
                        const maxYear = minYear + 3;
                        if (year >= minYear && year <= maxYear) {
                          setFormData({ ...formData, checkInDate: val });
                        }
                      } else {
                        setFormData({ ...formData, checkInDate: "" });
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const year = parseInt(val.split('-')[0]);
                        const minYear = new Date().getFullYear();
                        const maxYear = minYear + 3;
                        if (year < minYear || year > maxYear) {
                          setFormData({ ...formData, checkInDate: "" });
                        }
                      }
                    }}
                    data-testid="input-check-in-date"
                  />
                </div>
              </div>

              {/* Pets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.hasPets}
                  </Label>
                  <SearchableSelect
                    value={formData.hasPets}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        hasPets: value,
                        petQuantity: value === "No" ? 0 : (formData.petQuantity === 0 ? 1 : formData.petQuantity)
                      });
                    }}
                    options={[
                      { value: "No", label: t.petNo },
                      { value: "Sí - Perro", label: t.petDog },
                      { value: "Sí - Gato", label: t.petCat },
                      { value: "Sí - Otro", label: t.petOther },
                    ]}
                    placeholder={t.selectOption}
                    searchPlaceholder={t.search}
                    emptyMessage={t.notFound}
                    data-testid="select-pets"
                  />
                </div>
                {formData.hasPets && formData.hasPets !== "No" && (
                  <div className="space-y-2">
                    <Label htmlFor="petQuantity" className="flex items-center gap-2">
                      <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.numberOfPets}
                    </Label>
                    <Input
                      id="petQuantity"
                      type="number"
                      min={1}
                      max={10}
                      value={formData.petQuantity}
                      onChange={(e) => setFormData({ ...formData, petQuantity: parseInt(e.target.value) || 1 })}
                      data-testid="input-pet-quantity"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Property Characteristics & Amenities */}
            {(activeCharacteristics.length > 0 || activeAmenities.length > 0) && (
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span>{t.desiredFeatures}</span>
                </div>

                {/* Unit Characteristics */}
                {activeCharacteristics.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.unitCharacteristics}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {activeCharacteristics.map((char) => (
                        <Button
                          key={char.id}
                          type="button"
                          variant={selectedCharacteristics.includes(char.id) ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedCharacteristics(prev => 
                              prev.includes(char.id) 
                                ? prev.filter(id => id !== char.id)
                                : [...prev, char.id]
                            );
                          }}
                          data-testid={`toggle-char-${char.id}`}
                        >
                          {language === 'es' ? char.name : (char.nameEn || char.name)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {activeAmenities.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.developmentAmenities}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {activeAmenities.map((amenity) => (
                        <Button
                          key={amenity.id}
                          type="button"
                          variant={selectedAmenities.includes(amenity.id) ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedAmenities(prev => 
                              prev.includes(amenity.id) 
                                ? prev.filter(id => id !== amenity.id)
                                : [...prev, amenity.id]
                            );
                          }}
                          data-testid={`toggle-amenity-${amenity.id}`}
                        >
                          {language === 'es' ? amenity.name : (amenity.nameEn || amenity.name)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t.additionalNotes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t.notesPlaceholder}
                rows={4}
                data-testid="input-notes"
              />
            </div>

            {errors.submit && (
              <Alert variant="destructive">
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitMutation.isPending}
              data-testid="button-submit"
            >
              {submitMutation.isPending ? t.submitting : t.submitRegistration}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
