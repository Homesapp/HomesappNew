import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, CheckCircle2, XCircle, AlertCircle, Trash2, Edit, Save, FileText, Users } from "lucide-react";
import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";

type ParsedContact = {
  ownerName: string;
  condominiumName: string;
  unitNumber: string;
  referralName?: string;
  phoneNumber?: string;
  email?: string;
  rawName: string;
  parseSuccess: boolean;
  parseError?: string;
  matchedProperty?: any;
  matchConfidence: number;
};

type ContactWithEdit = ParsedContact & {
  id: string;
  isEditing: boolean;
  selectedPropertyId?: string;
};

export default function AdminContactImport() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactWithEdit[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all properties for manual assignment
  const { data: allProperties = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/properties"],
    enabled: contacts.length > 0,
  });

  // CSV Upload and Parse
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          // Send CSV data to backend for parsing
          const response = await apiRequest("POST", "/api/admin/contacts/parse-csv", {
            csvData: results.data,
          });

          // Add unique IDs and editing state
          const contactsWithIds = response.contacts.map((contact: ParsedContact, index: number) => ({
            ...contact,
            id: `contact-${index}`,
            isEditing: false,
            selectedPropertyId: contact.matchedProperty?.id,
          }));

          setContacts(contactsWithIds);
          setSummary(response.summary);
          setShowPreview(true);

          toast({
            title: "CSV Procesado",
            description: `${response.valid} contactos válidos de ${response.total} totales`,
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Error al procesar CSV",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        toast({
          title: "Error",
          description: `Error al leer CSV: ${error.message}`,
          variant: "destructive",
        });
      },
    });
  };

  // Edit contact
  const handleEditContact = (contactId: string, field: string, value: string) => {
    setContacts(contacts.map(c => 
      c.id === contactId ? { ...c, [field]: value } : c
    ));
  };

  // Toggle edit mode
  const toggleEdit = (contactId: string) => {
    setContacts(contacts.map(c => 
      c.id === contactId ? { ...c, isEditing: !c.isEditing } : c
    ));
  };

  // Remove contact
  const removeContact = (contactId: string) => {
    setContacts(contacts.filter(c => c.id !== contactId));
  };

  // Batch update mutation
  const batchUpdateMutation = useMutation({
    mutationFn: async () => {
      // Filter contacts that have a selected property
      const updates = contacts
        .filter(c => c.selectedPropertyId)
        .map(c => ({
          propertyId: c.selectedPropertyId,
          ownerFirstName: c.ownerName.split(' ')[0],
          ownerLastName: c.ownerName.split(' ').slice(1).join(' '),
          ownerPhone: c.phoneNumber,
          ownerEmail: c.email || null,
          referredByName: c.referralName ? c.referralName.split(' ')[0] : null,
          referredByLastName: c.referralName ? c.referralName.split(' ').slice(1).join(' ') : null,
          referredByPhone: null, // Not available in this format
          referredByEmail: null,
        }));

      return apiRequest("POST", "/api/admin/contacts/batch-update", { updates });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      toast({
        title: "Importación Exitosa",
        description: `${data.success} propiedades actualizadas. ${data.failed} fallidas.`,
      });
      if (data.failed === 0) {
        setContacts([]);
        setShowPreview(false);
        setSummary(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al importar contactos",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importar Contactos de Propietarios</h1>
          <p className="text-muted-foreground mt-2">
            Sube un archivo CSV exportado desde tu celular con el formato: "Nombre dueño Condominio 101 ref María"
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Cargar Archivo CSV
          </CardTitle>
          <CardDescription>
            Selecciona un archivo CSV exportado desde tus contactos. El sistema parseará automáticamente los nombres y buscará propiedades coincidentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              data-testid="input-csv-file"
            />
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/ejemplo-contactos.csv';
                link.download = 'ejemplo-contactos.csv';
                link.click();
              }}
              data-testid="button-download-example"
            >
              <FileText className="w-4 h-4 mr-2" />
              Descargar Ejemplo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Formato esperado:</strong> El nombre del contacto debe seguir el patrón:<br />
            "Juan Pérez dueño Aldea Zama 101 ref María González"
          </p>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Contactos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contacts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Auto-Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.autoMatched}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Match Parcial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.partialMatches}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Sin Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.noMatches}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact List */}
      {showPreview && contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Contactos Parseados ({contacts.length})
            </CardTitle>
            <CardDescription>
              Revisa y edita los contactos antes de importar. Asigna manualmente las propiedades que no tienen match automático.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Condominio</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Referido</TableHead>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                      <TableCell>
                        {contact.matchConfidence === 100 ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Match
                          </Badge>
                        ) : contact.matchConfidence > 0 ? (
                          <Badge variant="default" className="bg-yellow-500">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Parcial
                          </Badge>
                        ) : contact.parseSuccess ? (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Sin Match
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.isEditing ? (
                          <Input
                            value={contact.ownerName}
                            onChange={(e) => handleEditContact(contact.id, 'ownerName', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <span>{contact.ownerName || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.isEditing ? (
                          <Input
                            value={contact.condominiumName}
                            onChange={(e) => handleEditContact(contact.id, 'condominiumName', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <span>{contact.condominiumName || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.isEditing ? (
                          <Input
                            value={contact.unitNumber}
                            onChange={(e) => handleEditContact(contact.id, 'unitNumber', e.target.value)}
                            className="w-20"
                          />
                        ) : (
                          <span>{contact.unitNumber || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>{contact.phoneNumber || '-'}</TableCell>
                      <TableCell className="text-sm">{contact.email || '-'}</TableCell>
                      <TableCell className="text-sm">{contact.referralName || '-'}</TableCell>
                      <TableCell>
                        {contact.parseSuccess ? (
                          <Select
                            value={contact.selectedPropertyId}
                            onValueChange={(value) => handleEditContact(contact.id, 'selectedPropertyId', value)}
                          >
                            <SelectTrigger className="w-[200px]" data-testid={`select-property-${contact.id}`}>
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allProperties.map((prop) => (
                                <SelectItem key={prop.id} value={prop.id}>
                                  {prop.condoName} {prop.unitNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground">{contact.parseError}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleEdit(contact.id)}
                            data-testid={`button-edit-${contact.id}`}
                          >
                            {contact.isEditing ? (
                              <Save className="w-4 h-4" />
                            ) : (
                              <Edit className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeContact(contact.id)}
                            data-testid={`button-remove-${contact.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                {contacts.filter(c => c.selectedPropertyId).length} contactos listos para importar
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setContacts([]);
                    setShowPreview(false);
                    setSummary(null);
                  }}
                  data-testid="button-cancel-import"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => batchUpdateMutation.mutate()}
                  disabled={
                    batchUpdateMutation.isPending || 
                    contacts.filter(c => c.selectedPropertyId).length === 0
                  }
                  data-testid="button-confirm-import"
                >
                  {batchUpdateMutation.isPending ? "Importando..." : "Confirmar Importación"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
