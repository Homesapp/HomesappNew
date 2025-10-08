import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DollarSign, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const requestAdvanceSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  reason: z.string().min(10, "Reason must be at least 10 characters")
});

type RequestAdvanceForm = z.infer<typeof requestAdvanceSchema>;

export default function SellerCommissions() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<RequestAdvanceForm>({
    resolver: zodResolver(requestAdvanceSchema),
    defaultValues: {
      amount: 0,
      reason: ""
    }
  });

  const { data: advances = [], isLoading } = useQuery({
    queryKey: ["/api/seller/commission-advances"]
  });

  const requestMutation = useMutation({
    mutationFn: (data: RequestAdvanceForm) =>
      apiRequest("/api/seller/commission-advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/commission-advances"] });
      toast({ title: t("seller.commissions.advanceRequested") });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t("errors.generic"), variant: "destructive" });
    }
  });

  const handleSubmit = (data: RequestAdvanceForm) => {
    requestMutation.mutate(data);
  };

  const statusColors = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    disbursed: "bg-blue-500"
  };

  const totalAdvances = advances.reduce((sum: number, adv: any) => 
    adv.status === "approved" || adv.status === "disbursed" ? sum + Number(adv.amount) : sum, 0
  );

  const pendingAdvances = advances.filter((adv: any) => adv.status === "pending").length;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("seller.commissions.title")}</h1>
          <p className="text-muted-foreground">{t("seller.commissions.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-request-advance">
              <DollarSign className="h-4 w-4 mr-2" />
              {t("seller.commissions.requestAdvance")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("seller.commissions.requestAdvance")}</DialogTitle>
              <DialogDescription>
                {t("seller.commissions.requestAdvanceDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("seller.commissions.amount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000"
                          data-testid="input-advance-amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("seller.commissions.reason")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("seller.commissions.reasonPlaceholder")}
                          data-testid="input-advance-reason"
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
                    disabled={requestMutation.isPending}
                    data-testid="button-submit-advance"
                  >
                    {requestMutation.isPending ? t("common.submitting") : t("common.submit")}
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
            <CardTitle className="text-sm font-medium">{t("seller.commissions.totalAdvances")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-advances">
              {formatCurrency(totalAdvances)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("seller.commissions.pendingRequests")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">
              {pendingAdvances}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("seller.commissions.totalRequests")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-requests">
              {advances.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("seller.commissions.advanceHistory")}</CardTitle>
          <CardDescription>{t("seller.commissions.advanceHistoryDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {advances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("seller.commissions.noAdvances")}
            </div>
          ) : (
            <div className="space-y-4">
              {advances.map((advance: any) => (
                <div
                  key={advance.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`advance-${advance.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{formatCurrency(advance.amount)}</span>
                      <Badge className={statusColors[advance.status as keyof typeof statusColors]}>
                        {t(`seller.commissions.status.${advance.status}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{advance.reason}</p>
                    {advance.adminNotes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>{t("seller.commissions.adminNotes")}:</strong> {advance.adminNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(advance.requestedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
