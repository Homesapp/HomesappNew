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
import { insertMarketingCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Megaphone, Mail, Send, Clock, CheckCircle, XCircle } from "lucide-react";

type CampaignForm = z.infer<typeof insertMarketingCampaignSchema>;

export default function AdminMarketingCampaigns() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<CampaignForm>({
    resolver: zodResolver(insertMarketingCampaignSchema),
    defaultValues: {
      targetAudience: "all_clients",
      campaignType: "email",
      messageTemplate: "",
      scheduledDate: new Date().toISOString().split('T')[0],
      status: "draft"
    }
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/admin/marketing-campaigns"]
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/marketing-campaigns/stats"]
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignForm) =>
      apiRequest("/api/admin/marketing-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing-campaigns/stats"] });
      toast({ title: t("admin.marketing.campaignCreated") });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t("errors.generic"), variant: "destructive" });
    }
  });

  const handleSubmit = (data: CampaignForm) => {
    createMutation.mutate(data);
  };

  const statusColors = {
    draft: "bg-gray-500",
    scheduled: "bg-blue-500",
    sent: "bg-green-500",
    cancelled: "bg-red-500"
  };

  const statusIcons = {
    draft: Clock,
    scheduled: Clock,
    sent: CheckCircle,
    cancelled: XCircle
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            {t("admin.marketing.title")}
          </h1>
          <p className="text-muted-foreground">{t("admin.marketing.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-campaign">
              <Send className="h-4 w-4 mr-2" />
              {t("admin.marketing.createCampaign")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("admin.marketing.newCampaign")}</DialogTitle>
              <DialogDescription>
                {t("admin.marketing.newCampaignDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.marketing.targetAudience")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-target-audience">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all_clients">{t("admin.marketing.audience.allClients")}</SelectItem>
                            <SelectItem value="active_owners">{t("admin.marketing.audience.activeOwners")}</SelectItem>
                            <SelectItem value="potential_buyers">{t("admin.marketing.audience.potentialBuyers")}</SelectItem>
                            <SelectItem value="inactive_users">{t("admin.marketing.audience.inactiveUsers")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="campaignType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.marketing.campaignType")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-campaign-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">{t("admin.marketing.type.email")}</SelectItem>
                            <SelectItem value="push">{t("admin.marketing.type.push")}</SelectItem>
                            <SelectItem value="sms">{t("admin.marketing.type.sms")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="messageTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.marketing.messageTemplate")} *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("admin.marketing.messageTemplatePlaceholder")}
                          data-testid="input-message-template"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.marketing.scheduledDate")} *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            data-testid="input-scheduled-date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.marketing.status")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">{t("admin.marketing.status.draft")}</SelectItem>
                            <SelectItem value="scheduled">{t("admin.marketing.status.scheduled")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-save-campaign"
                  >
                    {createMutation.isPending ? t("common.saving") : t("admin.marketing.saveCampaign")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.marketing.totalCampaigns")}</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-campaigns">
                {stats.total || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.marketing.scheduled")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-scheduled-campaigns">
                {stats.scheduled || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.marketing.sent")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-sent-campaigns">
                {stats.sent || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.marketing.avgOpenRate")}</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-open-rate">
                {stats.avgOpenRate ? `${stats.avgOpenRate.toFixed(1)}%` : "0%"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.marketing.campaignList")}</CardTitle>
          <CardDescription>{t("admin.marketing.campaignListDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.marketing.noCampaigns")}
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign: any) => {
                const StatusIcon = statusIcons[campaign.status as keyof typeof statusIcons] || Clock;
                return (
                  <div
                    key={campaign.id}
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`campaign-${campaign.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className="h-4 w-4" />
                          <span className="font-semibold">{t(`admin.marketing.audience.${campaign.targetAudience}`)}</span>
                          <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                            {t(`admin.marketing.status.${campaign.status}`)}
                          </Badge>
                          <Badge variant="outline">
                            {t(`admin.marketing.type.${campaign.campaignType}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {campaign.messageTemplate.substring(0, 150)}
                          {campaign.messageTemplate.length > 150 && "..."}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{t("admin.marketing.scheduled")}: {new Date(campaign.scheduledDate).toLocaleDateString()}</span>
                          {campaign.sentDate && (
                            <span>{t("admin.marketing.sent")}: {new Date(campaign.sentDate).toLocaleDateString()}</span>
                          )}
                          {campaign.recipientCount !== null && (
                            <span>{t("admin.marketing.recipients")}: {campaign.recipientCount}</span>
                          )}
                        </div>
                        {campaign.openRate !== null && campaign.clickRate !== null && (
                          <div className="flex items-center gap-4 text-sm mt-2">
                            <Badge variant="secondary">
                              {t("admin.marketing.openRate")}: {campaign.openRate}%
                            </Badge>
                            <Badge variant="secondary">
                              {t("admin.marketing.clickRate")}: {campaign.clickRate}%
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
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
