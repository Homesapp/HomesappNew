import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

export default function PublicOfferBySlug() {
  const { agencySlug, unitSlug } = useParams();
  const [, setLocation] = useLocation();

  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: ['/api/public/resolve-offer-token', agencySlug, unitSlug],
    queryFn: async () => {
      const res = await fetch(`/api/public/resolve-offer-token/${agencySlug}/${unitSlug}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Token no encontrado');
      }
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <img 
            src={logoPath} 
            alt="HomesApp" 
            className="h-16 mx-auto mb-6"
          />
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando oferta...</p>
        </div>
      </div>
    );
  }

  if (error || !tokenData?.token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <img 
              src={logoPath} 
              alt="HomesApp" 
              className="h-12 mx-auto mb-4"
            />
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Oferta No Disponible</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'No se encontró una oferta activa para esta propiedad.'}
            </p>
            <Button onClick={() => setLocation('/')} data-testid="button-go-home">
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  setLocation(`/offer/${tokenData.token}`);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}
