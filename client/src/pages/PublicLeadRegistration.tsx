import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Building2, Calendar as CalendarIcon, Home, Sparkles } from "lucide-react";

export default function PublicLeadRegistration() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneLast4: "",
    checkInDate: "",
    allowsPets: false,
    estimatedRentCost: "",
    bedroomsDesired: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

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
        throw new Error(errorData.message || "Failed to fetch registration form");
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
          // Selected characteristics and amenities
          desiredCharacteristics: selectedCharacteristics,
          desiredAmenities: selectedAmenities,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit registration");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitSuccess(true);
    },
    onError: (error: any) => {
      setErrors({ submit: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (formInfo?.registrationType === "seller") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required for sellers";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone is required for sellers";
      }
    } else if (formInfo?.registrationType === "broker") {
      if (!formData.phoneLast4.trim()) {
        newErrors.phoneLast4 = "Last 4 digits of phone are required for brokers";
      } else if (!/^\d{4}$/.test(formData.phoneLast4)) {
        newErrors.phoneLast4 = "Must be exactly 4 digits";
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
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Invalid Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {(error as Error).message || "This registration link is invalid or has expired."}
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
              <CardTitle>Registration Successful</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for registering! We will contact you shortly at the information you provided.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-6 w-6" />
            <Badge variant="outline">{formInfo?.agencyName}</Badge>
          </div>
          <CardTitle className="text-2xl">
            {formInfo?.registrationType === "seller" ? "Seller Registration" : "Broker Registration"}
          </CardTitle>
          <CardDescription>
            Please provide your information below. This form will expire on{" "}
            {formInfo?.expiresAt ? new Date(formInfo.expiresAt).toLocaleDateString() : "N/A"}.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* First and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  data-testid="input-firstname"
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  data-testid="input-lastname"
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            {/* Seller-specific fields */}
            {formInfo?.registrationType === "seller" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    data-testid="input-email"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    data-testid="input-phone"
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
              </>
            )}

            {/* Broker-specific fields */}
            {formInfo?.registrationType === "broker" && (
              <div className="space-y-2">
                <Label htmlFor="phoneLast4">Last 4 Digits of Phone *</Label>
                <Input
                  id="phoneLast4"
                  type="text"
                  maxLength={4}
                  value={formData.phoneLast4}
                  onChange={(e) => setFormData({ ...formData, phoneLast4: e.target.value.replace(/\D/g, "") })}
                  placeholder="1234"
                  data-testid="input-phone-last4"
                />
                {errors.phoneLast4 && <p className="text-sm text-destructive">{errors.phoneLast4}</p>}
              </div>
            )}

            {/* Optional fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedRentCost">Rent Budget (MXN)</Label>
                <Input
                  id="estimatedRentCost"
                  value={formData.estimatedRentCost}
                  onChange={(e) => setFormData({ ...formData, estimatedRentCost: e.target.value })}
                  placeholder="E.g: 18-25 mil"
                  data-testid="input-rent-budget"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedroomsDesired">Bedrooms</Label>
                <Input
                  id="bedroomsDesired"
                  value={formData.bedroomsDesired}
                  onChange={(e) => setFormData({ ...formData, bedroomsDesired: e.target.value })}
                  placeholder="E.g: 1-2, 2+"
                  data-testid="input-bedrooms"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkInDate">Desired Check-in Date</Label>
              <Input
                id="checkInDate"
                type="date"
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                data-testid="input-check-in-date"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowsPets"
                checked={formData.allowsPets}
                onCheckedChange={(checked) => setFormData({ ...formData, allowsPets: checked as boolean })}
                data-testid="checkbox-allows-pets"
              />
              <Label htmlFor="allowsPets" className="font-normal">
                I have pets
              </Label>
            </div>

            {/* Property Characteristics & Amenities */}
            {(activeCharacteristics.length > 0 || activeAmenities.length > 0) && (
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span>Desired Features (Optional)</span>
                </div>

                {/* Unit Characteristics */}
                {activeCharacteristics.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      Unit Characteristics
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
                          {char.nameEn || char.name}
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
                      Development Amenities
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
                          {amenity.nameEn || amenity.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information you'd like to share..."
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
              {submitMutation.isPending ? "Submitting..." : "Submit Registration"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
