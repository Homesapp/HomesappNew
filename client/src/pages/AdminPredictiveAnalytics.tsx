import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Brain, TrendingUp, Sparkles } from "lucide-react";

const analyzeSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  analysisType: z.enum(["rental_probability", "price_recommendation"])
});

type AnalyzeForm = z.infer<typeof analyzeSchema>;

export default function AdminPredictiveAnalytics() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<AnalyzeForm>({
    resolver: zodResolver(analyzeSchema),
    defaultValues: {
      propertyId: "",
      analysisType: "rental_probability"
    }
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/admin/properties"]
  });

  const { data: analytics = [], isLoading } = useQuery({
    queryKey: ["/api/admin/predictive-analytics"]
  });

  const analyzeMutation = useMutation({
    mutationFn: (data: AnalyzeForm) =>
      apiRequest(`/api/admin/predictive-analytics/${data.analysisType === "rental_probability" ? "rental-probability" : "price-recommendation"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: data.propertyId })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/predictive-analytics"] });
      toast({ title: t("admin.analytics.analysisComplete") });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t("errors.generic"), variant: "destructive" });
    }
  });

  const handleAnalyze = (data: AnalyzeForm) => {
    analyzeMutation.mutate(data);
  };

  const confidenceColors = {
    high: "bg-green-500",
    medium: "bg-yellow-500",
    low: "bg-red-500"
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            {t("admin.analytics.title")}
          </h1>
          <p className="text-muted-foreground">{t("admin.analytics.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-run-analysis">
              <Sparkles className="h-4 w-4 mr-2" />
              {t("admin.analytics.runAnalysis")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.analytics.newAnalysis")}</DialogTitle>
              <DialogDescription>
                {t("admin.analytics.newAnalysisDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAnalyze)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.analytics.selectProperty")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property">
                            <SelectValue placeholder={t("admin.analytics.chooseProperty")} />
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
                <FormField
                  control={form.control}
                  name="analysisType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.analytics.analysisType")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-analysis-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rental_probability">
                            {t("admin.analytics.rentalProbability")}
                          </SelectItem>
                          <SelectItem value="price_recommendation">
                            {t("admin.analytics.priceRecommendation")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={analyzeMutation.isPending}
                    data-testid="button-start-analysis"
                  >
                    {analyzeMutation.isPending ? t("common.analyzing") : t("admin.analytics.startAnalysis")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.analytics.totalAnalyses")}</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-analyses">
              {analytics.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.analytics.highConfidence")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-high-confidence">
              {analytics.filter((a: any) => a.confidence === "high").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.analytics.activeInsights")}</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-insights">
              {analytics.filter((a: any) => new Date(a.validUntil) > new Date()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.analytics.recentAnalyses")}</CardTitle>
          <CardDescription>{t("admin.analytics.recentAnalysesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.analytics.noAnalyses")}
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.slice(0, 10).map((analysis: any) => {
                const property = properties.find((p: any) => p.id === analysis.propertyId);
                return (
                  <div
                    key={analysis.id}
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`analysis-${analysis.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{property?.title || analysis.propertyId}</span>
                          <Badge variant={analysis.type === "rental_probability" ? "default" : "secondary"}>
                            {t(`admin.analytics.type.${analysis.type}`)}
                          </Badge>
                          <Badge className={confidenceColors[analysis.confidence as keyof typeof confidenceColors]}>
                            {t(`admin.analytics.confidence.${analysis.confidence}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{analysis.prediction}</p>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">
                            {t("admin.analytics.recommendedAction")}:
                          </p>
                          <p className="text-sm">{analysis.recommendedAction}</p>
                        </div>
                        {analysis.factors && analysis.factors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">{t("admin.analytics.keyFactors")}:</p>
                            <div className="flex flex-wrap gap-1">
                              {analysis.factors.map((factor: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{new Date(analysis.createdAt).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {new Date(analysis.validUntil) > new Date() ? (
                            <Badge variant="outline" className="text-xs">
                              {t("admin.analytics.valid")}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              {t("admin.analytics.expired")}
                            </Badge>
                          )}
                        </div>
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
