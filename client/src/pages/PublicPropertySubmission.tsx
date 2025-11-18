import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import PropertySubmissionWizard from "./PropertySubmissionWizard";

type Language = "es" | "en";

export default function PublicPropertySubmission() {
  const [, params] = useRoute("/submit-property/:token");
  const [, setLocation] = useLocation();
  const token = params?.token;
  const [language, setLanguage] = useState<Language>("es");

  const translations = {
    es: {
      invalidLink: "Enlace Inválido",
      invalidLinkDesc: "El enlace que intentas acceder no es válido.",
      goHome: "Ir al Inicio",
      linkNotAvailable: "Enlace No Disponible",
      linkExpiredDesc: "Este enlace ha expirado. Los enlaces de invitación son válidos por 24 horas.",
      linkUsedDesc: "Este enlace ya fue utilizado para subir una propiedad.",
      requestNewLink: "Por favor, solicita un nuevo enlace de invitación a tu administrador.",
      welcome: "Bienvenido",
      welcomeDesc: "Has sido invitado a subir tu propiedad a HomesApp. Completa el siguiente formulario para enviar tu propiedad para aprobación.",
    },
    en: {
      invalidLink: "Invalid Link",
      invalidLinkDesc: "The link you are trying to access is not valid.",
      goHome: "Go to Home",
      linkNotAvailable: "Link Not Available",
      linkExpiredDesc: "This link has expired. Invitation links are valid for 24 hours.",
      linkUsedDesc: "This link has already been used to submit a property.",
      requestNewLink: "Please request a new invitation link from your administrator.",
      welcome: "Welcome",
      welcomeDesc: "You have been invited to submit your property to HomesApp. Complete the following form to send your property for approval.",
    },
  };

  const t = translations[language];

  // Validate token
  const { data: validation, isLoading, error } = useQuery({
    queryKey: ["/api/property-tokens", token, "validate"],
    queryFn: async () => {
      const response = await fetch(`/api/property-tokens/${token}/validate`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Token inválido");
      }
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <div className="w-full max-w-md space-y-4">
          {/* Language Toggle */}
          <div className="flex justify-end gap-2">
            <Button
              variant={language === "es" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("es")}
              data-testid="button-lang-es"
            >
              Español
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
              data-testid="button-lang-en"
            >
              English
            </Button>
          </div>
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <CardTitle>{t.invalidLink}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t.invalidLinkDesc}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !validation?.valid) {
    const errorMessage = error?.message || validation?.message || "Token inválido o expirado";
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <div className="w-full max-w-md space-y-4">
          {/* Language Toggle */}
          <div className="flex justify-end gap-2">
            <Button
              variant={language === "es" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("es")}
              data-testid="button-lang-es"
            >
              Español
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
              data-testid="button-lang-en"
            >
              English
            </Button>
          </div>
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle>{t.linkNotAvailable}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                {errorMessage.includes("expirado") || errorMessage.includes("expired")
                  ? t.linkExpiredDesc
                  : errorMessage.includes("utilizado") || errorMessage.includes("used")
                  ? t.linkUsedDesc
                  : t.requestNewLink}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Token is valid - show the wizard
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl py-8">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            <Button
              variant={language === "es" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("es")}
              data-testid="button-lang-es"
            >
              Español
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
              data-testid="button-lang-en"
            >
              English
            </Button>
          </div>
        </div>

        {/* Welcome Banner */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <CardTitle>{t.welcome}{validation.inviteeName ? `, ${validation.inviteeName}` : ""}</CardTitle>
            </div>
            <CardDescription>
              {t.welcomeDesc}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Property Submission Wizard */}
        <PropertySubmissionWizard 
          invitationToken={token}
          inviteeEmail={validation.inviteeEmail}
          inviteePhone={validation.inviteePhone}
          inviteeName={validation.inviteeName}
          language={language}
        />
      </div>
    </div>
  );
}
