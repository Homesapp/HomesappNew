import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalClient, ExternalClientDocument, ExternalClientIncident } from "@shared/schema";

// Summary Tab Component
import ClientSummaryTab from "@/components/external/ClientSummaryTab";
// Documents Tab Component
import ClientDocumentsTab from "@/components/external/ClientDocumentsTab";
// Incidents Tab Component
import ClientIncidentsTab from "@/components/external/ClientIncidentsTab";

export default function ExternalClientEdit() {
  const [, params] = useRoute("/external/clients/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");

  const clientId = params?.id;

  const clientQuery = useQuery<ExternalClient>({
    queryKey: ["/api/external-clients", clientId],
    enabled: !!clientId,
  });

  const documentsQuery = useQuery<ExternalClientDocument[]>({
    queryKey: ["/api/external-clients", clientId, "documents"],
    enabled: !!clientId && clientQuery.status === "success",
  });

  const incidentsQuery = useQuery<ExternalClientIncident[]>({
    queryKey: ["/api/external-clients", clientId, "incidents"],
    enabled: !!clientId && clientQuery.status === "success",
  });

  const { data: client, isLoading: isLoadingClient, isError: isClientError } = clientQuery;
  const { data: documents = [], isLoading: isLoadingDocuments, isFetching: isFetchingDocuments, isError: isDocumentsError } = documentsQuery;
  const { data: incidents = [], isLoading: isLoadingIncidents, isFetching: isFetchingIncidents, isError: isIncidentsError } = incidentsQuery;

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isClientError || !client) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                {isClientError ? "Error al cargar el cliente" : "Cliente no encontrado"}
              </p>
              <Button onClick={() => navigate("/external/clients")} className="mt-4">
                Volver a Clientes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/external/clients")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-muted-foreground">
            {client.email || client.phone || "Sin información de contacto"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" data-testid="tab-summary">
            <User className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FileText className="h-4 w-4 mr-2" />
            Documentos{" "}
            {isFetchingDocuments ? (
              <Loader2 className="h-3 w-3 ml-1 animate-spin" />
            ) : (
              <>({documents.length})</>
            )}
          </TabsTrigger>
          <TabsTrigger value="incidents" data-testid="tab-incidents">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Incidencias{" "}
            {isFetchingIncidents ? (
              <Loader2 className="h-3 w-3 ml-1 animate-spin" />
            ) : (
              <>({incidents.length})</>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <ClientSummaryTab client={client} />
        </TabsContent>

        <TabsContent value="documents">
          <ClientDocumentsTab 
            clientId={clientId!} 
            documents={documents} 
            isLoading={isLoadingDocuments}
            isError={isDocumentsError}
          />
        </TabsContent>

        <TabsContent value="incidents">
          <ClientIncidentsTab 
            clientId={clientId!} 
            incidents={incidents} 
            isLoading={isLoadingIncidents}
            isError={isIncidentsError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
