import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { language } = useLanguage();
  const [location, setLocation] = useLocation();
  const isSpanish = language === "es";

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md" data-testid="card-not-found">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2" data-testid="text-404-title">
            {isSpanish ? "Página no encontrada" : "Page Not Found"}
          </h1>
          
          <p className="text-muted-foreground mb-6" data-testid="text-404-message">
            {isSpanish 
              ? "Lo sentimos, la página que buscas no existe o ha sido movida."
              : "Sorry, the page you're looking for doesn't exist or has been moved."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              data-testid="button-go-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isSpanish ? "Volver atrás" : "Go Back"}
            </Button>
            
            <Link href="/">
              <Button data-testid="button-go-home">
                <Home className="h-4 w-4 mr-2" />
                {isSpanish ? "Ir al inicio" : "Go to Home"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
