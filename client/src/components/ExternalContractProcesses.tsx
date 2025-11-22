import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import RentalWizard from "./RentalWizard";

export default function ExternalContractProcesses() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  // This would query contract processes in the future
  const contractProcesses: any[] = [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {language === "es" ? "Procesos de Contrato" : "Contract Processes"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Gestiona el proceso completo desde la oferta hasta la activación de la renta"
                  : "Manage the complete process from offer to rental activation"}
              </CardDescription>
            </div>
            <Button onClick={() => setWizardOpen(true)} data-testid="button-create-contract-process">
              <Plus className="h-4 w-4 mr-2" />
              {language === "es" ? "Nuevo Contrato" : "New Contract"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar por cliente o propiedad..." : "Search by client or property..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-processes"
              />
            </div>
          </div>

          {contractProcesses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === "es" ? "No hay procesos de contrato" : "No contract processes"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === "es"
                  ? "Comienza un nuevo proceso para crear un contrato de renta"
                  : "Start a new process to create a rental contract"}
              </p>
              <Button onClick={() => setWizardOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {language === "es" ? "Crear Primer Contrato" : "Create First Contract"}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "es" ? "Cliente" : "Client"}</TableHead>
                    <TableHead>{language === "es" ? "Propiedad" : "Property"}</TableHead>
                    <TableHead>{language === "es" ? "Creado" : "Created"}</TableHead>
                    <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractProcesses.map((process: any) => (
                    <TableRow key={process.id}>
                      <TableCell className="font-medium">{process.clientName}</TableCell>
                      <TableCell>{process.propertyTitle}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(process.createdAt), "dd/MM/yyyy", {
                          locale: language === "es" ? es : enUS,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={process.status === "completed" ? "default" : "outline"}>
                          {process.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          {language === "es" ? "Ver" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RentalWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
