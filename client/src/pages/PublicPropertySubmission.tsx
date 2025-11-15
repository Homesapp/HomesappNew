import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertCircle, Home } from "lucide-react";
import PropertySubmissionWizard from "./PropertySubmissionWizard";

export default function PublicPropertySubmission() {
  const [, params] = useRoute("/submit-property/:token");
  const [, setLocation] = useLocation();
  const token = params?.token;

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
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <CardTitle>Enlace Inválido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              El enlace que intentas acceder no es válido.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
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
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle>Enlace No Disponible</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground mb-4">
              {errorMessage.includes("expirado") 
                ? "Este enlace ha expirado. Los enlaces de invitación son válidos por 24 horas."
                : errorMessage.includes("utilizado")
                ? "Este enlace ya fue utilizado para subir una propiedad."
                : "Por favor, solicita un nuevo enlace de invitación a tu administrador."}
            </p>
            <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token is valid - show the wizard
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl py-8">
        {/* Welcome Banner */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <CardTitle>Bienvenido{validation.inviteeName ? `, ${validation.inviteeName}` : ""}</CardTitle>
            </div>
            <CardDescription>
              Has sido invitado a subir tu propiedad a HomesApp. Completa el siguiente formulario para enviar tu propiedad para aprobación.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Property Submission Wizard */}
        <PropertySubmissionWizard 
          invitationToken={token}
          inviteeEmail={validation.inviteeEmail}
          inviteePhone={validation.inviteePhone}
          inviteeName={validation.inviteeName}
        />
      </div>
    </div>
  );
}
