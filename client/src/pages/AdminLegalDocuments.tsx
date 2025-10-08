import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileText, Download, CheckCircle, XCircle, Clock } from "lucide-react";

const generateContractSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  landlordName: z.string().min(1, "Landlord name is required"),
  tenantName: z.string().min(1, "Tenant name is required"),
  monthlyRent: z.coerce.number().min(1, "Monthly rent must be at least 1"),
  deposit: z.coerce.number().min(0, "Deposit cannot be negative")
});

type GenerateContractForm = z.infer<typeof generateContractSchema>;

export default function AdminLegalDocuments() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<GenerateContractForm>({
    resolver: zodResolver(generateContractSchema),
    defaultValues: {
      propertyId: "",
      landlordName: "",
      tenantName: "",
      monthlyRent: 0,
      deposit: 0
    }
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/admin/properties"]
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/legal-documents"]
  });

  const generateMutation = useMutation({
    mutationFn: (data: GenerateContractForm) =>
      apiRequest("/api/admin/legal-documents/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: data.propertyId,
          parties: {
            landlord: data.landlordName,
            tenant: data.tenantName
          },
          monthlyRent: data.monthlyRent,
          deposit: data.deposit
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      toast({ title: t("admin.legal.documentGenerated") });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t("errors.generic"), variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/api/admin/legal-documents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      toast({ title: t("admin.legal.statusUpdated") });
    }
  });

  const handleGenerate = (data: GenerateContractForm) => {
    generateMutation.mutate(data);
  };

  const statusColors = {
    draft: "bg-gray-500",
    review: "bg-yellow-500",
    approved: "bg-green-500",
    signed: "bg-blue-500"
  };

  const statusIcons = {
    draft: Clock,
    review: Clock,
    approved: CheckCircle,
    signed: CheckCircle
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {t("admin.legal.title")}
          </h1>
          <p className="text-muted-foreground">{t("admin.legal.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-contract">
              <FileText className="h-4 w-4 mr-2" />
              {t("admin.legal.generateContract")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("admin.legal.newContract")}</DialogTitle>
              <DialogDescription>
                {t("admin.legal.newContractDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.legal.selectProperty")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contract-property">
                            <SelectValue placeholder={t("admin.legal.chooseProperty")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map((property: any) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="landlordName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.legal.landlordName")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan Pérez"
                            data-testid="input-landlord-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tenantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.legal.tenantName")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="María García"
                            data-testid="input-tenant-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.legal.monthlyRent")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15000"
                            data-testid="input-monthly-rent"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.legal.deposit")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30000"
                            data-testid="input-deposit"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={generateMutation.isPending}
                    data-testid="button-start-generation"
                  >
                    {generateMutation.isPending ? t("common.generating") : t("admin.legal.generate")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.legal.totalDocuments")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-documents">
              {documents.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.legal.drafts")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-count">
              {documents.filter((d: any) => d.status === "draft").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.legal.approved")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-approved-count">
              {documents.filter((d: any) => d.status === "approved").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.legal.signed")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-signed-count">
              {documents.filter((d: any) => d.status === "signed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.legal.documentList")}</CardTitle>
          <CardDescription>{t("admin.legal.documentListDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.legal.noDocuments")}
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc: any) => {
                const property = properties.find((p: any) => p.id === doc.propertyId);
                const StatusIcon = statusIcons[doc.status as keyof typeof statusIcons] || FileText;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`document-${doc.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-semibold">{property?.title || doc.propertyId}</span>
                        <Badge className={statusColors[doc.status as keyof typeof statusColors]}>
                          {t(`admin.legal.status.${doc.status}`)}
                        </Badge>
                        <Badge variant="outline">
                          {t(`admin.legal.type.${doc.type}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {doc.parties?.landlord} → {doc.parties?.tenant}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(doc.content)}`, '_blank')}
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t("admin.legal.view")}
                      </Button>
                      {doc.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: doc.id, status: "approved" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-approve-${doc.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t("admin.legal.approve")}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
