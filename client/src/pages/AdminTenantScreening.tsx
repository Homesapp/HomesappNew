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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, AlertTriangle, CheckCircle, XCircle, Zap } from "lucide-react";

const screeningSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantEmail: z.string().email("Valid email is required"),
  monthlyIncome: z.coerce.number().min(1, "Monthly income must be at least 1"),
  employmentStatus: z.string().optional(),
  creditScore: z.preprocess((val) => (val === "" || val === null || val === undefined) ? undefined : Number(val), z.number().optional()),
  rentalHistory: z.string().optional()
});

type ScreeningForm = z.infer<typeof screeningSchema>;

export default function AdminTenantScreening() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ScreeningForm>({
    resolver: zodResolver(screeningSchema),
    defaultValues: {
      propertyId: "",
      applicantName: "",
      applicantEmail: "",
      monthlyIncome: 0,
      employmentStatus: "",
      creditScore: undefined,
      rentalHistory: ""
    }
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/admin/properties"]
  });

  const { data: screenings = [], isLoading } = useQuery({
    queryKey: ["/api/admin/tenant-screenings"]
  });

  const screenMutation = useMutation({
    mutationFn: (data: ScreeningForm) =>
      apiRequest("/api/admin/tenant-screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: `app-${Date.now()}`,
          applicantId: data.applicantEmail,
          propertyId: data.propertyId,
          applicationData: {
            name: data.applicantName,
            email: data.applicantEmail,
            monthlyIncome: data.monthlyIncome,
            employmentStatus: data.employmentStatus,
            creditScore: data.creditScore,
            rentalHistory: data.rentalHistory
          }
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenant-screenings"] });
      toast({ title: t("admin.screening.screeningComplete") });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t("errors.generic"), variant: "destructive" });
    }
  });

  const handleScreen = (data: ScreeningForm) => {
    screenMutation.mutate(data);
  };

  const riskColors = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
    critical: "bg-red-700"
  };

  const riskIcons = {
    low: CheckCircle,
    medium: AlertTriangle,
    high: XCircle,
    critical: XCircle
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            {t("admin.screening.title")}
          </h1>
          <p className="text-muted-foreground">{t("admin.screening.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-screen-tenant">
              <Zap className="h-4 w-4 mr-2" />
              {t("admin.screening.screenApplicant")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("admin.screening.newScreening")}</DialogTitle>
              <DialogDescription>
                {t("admin.screening.newScreeningDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleScreen)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.screening.selectProperty")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-screening-property">
                            <SelectValue placeholder={t("admin.screening.chooseProperty")} />
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
                    name="applicantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.screening.applicantName")} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan Pérez"
                            data-testid="input-applicant-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicantEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.screening.applicantEmail")} *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="juan@example.com"
                            data-testid="input-applicant-email"
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
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.screening.monthlyIncome")} *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25000"
                            data-testid="input-monthly-income"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employmentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.screening.employmentStatus")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full-time"
                            data-testid="input-employment-status"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="creditScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.screening.creditScore")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="700"
                          data-testid="input-credit-score"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.screening.rentalHistory")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("admin.screening.rentalHistoryPlaceholder")}
                          data-testid="input-rental-history"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={screenMutation.isPending}
                    data-testid="button-start-screening"
                  >
                    {screenMutation.isPending ? t("common.analyzing") : t("admin.screening.startScreening")}
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
            <CardTitle className="text-sm font-medium">{t("admin.screening.totalScreenings")}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-screenings">
              {screenings.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.screening.lowRisk")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-low-risk">
              {screenings.filter((s: any) => s.riskLevel === "low").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.screening.mediumRisk")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-medium-risk">
              {screenings.filter((s: any) => s.riskLevel === "medium").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.screening.highRisk")}</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-high-risk">
              {screenings.filter((s: any) => s.riskLevel === "high" || s.riskLevel === "critical").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.screening.screeningHistory")}</CardTitle>
          <CardDescription>{t("admin.screening.screeningHistoryDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {screenings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.screening.noScreenings")}
            </div>
          ) : (
            <div className="space-y-4">
              {screenings.map((screening: any) => {
                const property = properties.find((p: any) => p.id === screening.propertyId);
                const RiskIcon = riskIcons[screening.riskLevel as keyof typeof riskIcons] || AlertTriangle;
                return (
                  <div
                    key={screening.id}
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`screening-${screening.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <RiskIcon className="h-4 w-4" />
                          <span className="font-semibold">{screening.applicantId}</span>
                          <Badge className={riskColors[screening.riskLevel as keyof typeof riskColors]}>
                            {t(`admin.screening.risk.${screening.riskLevel}`)} ({screening.riskScore}/100)
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {property?.title || screening.propertyId}
                        </p>
                        <div className="bg-muted p-3 rounded-md mb-2">
                          <p className="text-sm font-medium mb-1">
                            {t("admin.screening.aiAnalysis")}:
                          </p>
                          <p className="text-sm">{screening.aiAnalysis}</p>
                        </div>
                        {screening.flags && screening.flags.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium mb-1">{t("admin.screening.flags")}:</p>
                            <div className="flex flex-wrap gap-1">
                              {screening.flags.map((flag: string, idx: number) => (
                                <Badge key={idx} variant="destructive" className="text-xs">
                                  {flag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {screening.recommendations && screening.recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">{t("admin.screening.recommendations")}:</p>
                            <ul className="text-sm space-y-1">
                              {screening.recommendations.map((rec: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-muted-foreground">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {screening.completedAt && new Date(screening.completedAt).toLocaleDateString()}
                      </div>
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
