import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

export default function ExternalCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-calendar-title">
            <CalendarIcon className="h-8 w-8" />
            {language === "es" ? "Calendario" : "Calendar"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Visualiza pagos, mantenimientos y eventos importantes" 
              : "View payments, maintenance, and important events"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{language === "es" ? "Calendario" : "Calendar"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={language === "es" ? es : enUS}
              className="rounded-md border"
              data-testid="calendar-main"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, language === "es" ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", { 
                    locale: language === "es" ? es : enUS 
                  })
                : language === "es" ? "Selecciona una fecha" : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? "No hay eventos para esta fecha" 
                  : "No events for this date"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "es" ? "Pagos Pendientes" : "Pending Payments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-payments">0</div>
            <Badge variant="secondary" className="mt-2">
              {language === "es" ? "Próximos 30 días" : "Next 30 days"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "es" ? "Mantenimientos" : "Maintenance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-maintenance-count">0</div>
            <Badge variant="secondary" className="mt-2">
              {language === "es" ? "Programados" : "Scheduled"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "es" ? "Eventos" : "Events"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-events-count">0</div>
            <Badge variant="secondary" className="mt-2">
              {language === "es" ? "Este mes" : "This month"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
