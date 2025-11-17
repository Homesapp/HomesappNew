import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Home, Mail, Phone } from "lucide-react";

interface PropertySubmissionSuccessProps {
  language?: "es" | "en";
}

export default function PropertySubmissionSuccess({ language = "es" }: PropertySubmissionSuccessProps) {
  const [currentLang, setCurrentLang] = useState<"es" | "en">(language);

  const content = {
    es: {
      title: "¡Propiedad Enviada con Éxito!",
      thankYou: "Gracias por confiar en HomesApp",
      message: "Hemos recibido la información de tu propiedad correctamente.",
      teamContact: "Nuestro equipo revisará los datos y se pondrá en contacto contigo a la brevedad posible.",
      nextSteps: "Próximos Pasos:",
      step1: "Revisaremos la información proporcionada",
      step2: "Te contactaremos para confirmar los detalles",
      step3: "Programaremos una visita de inspección",
      step4: "Tu propiedad será publicada tras la aprobación",
      contact: "Si tienes alguna duda, no dudes en contactarnos:",
      email: "Email: contacto@homesapp.com",
      phone: "Teléfono: +52 (984) 123-4567",
      close: "Cerrar Ventana",
    },
    en: {
      title: "Property Submitted Successfully!",
      thankYou: "Thank you for trusting HomesApp",
      message: "We have successfully received your property information.",
      teamContact: "Our team will review the details and contact you shortly.",
      nextSteps: "Next Steps:",
      step1: "We will review the provided information",
      step2: "We will contact you to confirm details",
      step3: "We will schedule an inspection visit",
      step4: "Your property will be published after approval",
      contact: "If you have any questions, feel free to contact us:",
      email: "Email: contact@homesapp.com",
      phone: "Phone: +52 (984) 123-4567",
      close: "Close Window",
    },
  };

  const t = content[currentLang];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Language Toggle */}
        <div className="flex justify-end gap-2">
          <Button
            variant={currentLang === "es" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentLang("es")}
            data-testid="button-lang-es"
          >
            Español
          </Button>
          <Button
            variant={currentLang === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentLang("en")}
            data-testid="button-lang-en"
          >
            English
          </Button>
        </div>

        {/* Success Card */}
        <Card className="border-2 border-green-500" data-testid="card-success">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl font-bold" data-testid="heading-success-title">
              {t.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold" data-testid="text-thank-you">
                {t.thankYou}
              </p>
              <p className="text-muted-foreground" data-testid="text-message">
                {t.message}
              </p>
              <p className="text-base" data-testid="text-team-contact">
                {t.teamContact}
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg" data-testid="heading-next-steps">
                {t.nextSteps}
              </h3>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-muted-foreground" data-testid="text-step1">
                  {t.step1}
                </li>
                <li className="text-muted-foreground" data-testid="text-step2">
                  {t.step2}
                </li>
                <li className="text-muted-foreground" data-testid="text-step3">
                  {t.step3}
                </li>
                <li className="text-muted-foreground" data-testid="text-step4">
                  {t.step4}
                </li>
              </ol>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <p className="font-semibold text-center" data-testid="text-contact-header">
                {t.contact}
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span data-testid="text-email">{t.email}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span data-testid="text-phone">{t.phone}</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="text-center pt-4">
              <Button
                onClick={() => window.close()}
                variant="outline"
                data-testid="button-close"
              >
                <Home className="w-4 h-4 mr-2" />
                {t.close}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
