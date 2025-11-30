import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  Check,
  Trash2,
  Edit2,
  AlertCircle,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  Users,
  Loader2,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface LeadRemindersTabProps {
  leadId: string;
  leadName: string;
}

const REMINDER_TYPES = [
  { value: "follow_up", labelEs: "Seguimiento", labelEn: "Follow-up", icon: Phone },
  { value: "call", labelEs: "Llamar", labelEn: "Call", icon: Phone },
  { value: "whatsapp", labelEs: "WhatsApp", labelEn: "WhatsApp", icon: MessageCircle },
  { value: "email", labelEs: "Correo", labelEn: "Email", icon: Mail },
  { value: "meeting", labelEs: "Reunión", labelEn: "Meeting", icon: Users },
  { value: "document", labelEs: "Documento", labelEn: "Document", icon: FileText },
  { value: "other", labelEs: "Otro", labelEn: "Other", icon: Bell },
];

const PRIORITIES = [
  { value: "low", labelEs: "Baja", labelEn: "Low", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "medium", labelEs: "Media", labelEn: "Medium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  { value: "high", labelEs: "Alta", labelEn: "High", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  { value: "urgent", labelEs: "Urgente", labelEn: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
];

const reminderFormSchema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  reminderDate: z.string().min(1, "Required"),
  reminderTime: z.string().optional(),
  reminderType: z.string().min(1, "Required"),
  priority: z.string().default("medium"),
  notifyBefore: z.number().optional(),
});

type ReminderFormData = z.infer<typeof reminderFormSchema>;

export default function LeadRemindersTab({ leadId, leadName }: LeadRemindersTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const locale = language === "es" ? es : enUS;
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: "",
      description: "",
      reminderDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      reminderTime: "09:00",
      reminderType: "follow_up",
      priority: "medium",
      notifyBefore: 30,
    },
  });

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["/api/external-leads", leadId, "reminders"],
    queryFn: async () => {
      const res = await fetch(`/api/external-leads/${leadId}/reminders`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      return apiRequest("POST", `/api/external-leads/${leadId}/reminders`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", leadId, "reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/reminders"] });
      toast({
        title: language === "es" ? "Recordatorio creado" : "Reminder created",
        description: language === "es" ? "El recordatorio se guardó correctamente" : "The reminder was saved successfully",
      });
      setShowForm(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo crear el recordatorio" : "Could not create reminder",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReminderFormData & { status?: string }> }) => {
      return apiRequest("PATCH", `/api/external-lead-reminders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", leadId, "reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/reminders"] });
      toast({
        title: language === "es" ? "Recordatorio actualizado" : "Reminder updated",
      });
      setEditingReminder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/external-lead-reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", leadId, "reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/reminders"] });
      toast({
        title: language === "es" ? "Recordatorio eliminado" : "Reminder deleted",
      });
      setDeleteConfirmId(null);
    },
  });

  const handleSubmit = (data: ReminderFormData) => {
    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleComplete = (reminder: any) => {
    updateMutation.mutate({
      id: reminder.id,
      data: { status: reminder.status === "completed" ? "pending" : "completed" },
    });
  };

  const openEdit = (reminder: any) => {
    setEditingReminder(reminder);
    form.reset({
      title: reminder.title,
      description: reminder.description || "",
      reminderDate: format(new Date(reminder.reminderDate), "yyyy-MM-dd"),
      reminderTime: reminder.reminderTime || "09:00",
      reminderType: reminder.reminderType,
      priority: reminder.priority || "medium",
      notifyBefore: reminder.notifyBefore || 30,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingReminder(null);
    form.reset({
      title: "",
      description: "",
      reminderDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      reminderTime: "09:00",
      reminderType: "follow_up",
      priority: "medium",
      notifyBefore: 30,
    });
    setShowForm(true);
  };

  const getReminderTypeInfo = (type: string) => {
    return REMINDER_TYPES.find((t) => t.value === type) || REMINDER_TYPES[6];
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITIES.find((p) => p.value === priority) || PRIORITIES[1];
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return language === "es" ? "Hoy" : "Today";
    if (isTomorrow(date)) return language === "es" ? "Mañana" : "Tomorrow";
    if (isPast(date)) return language === "es" ? "Vencido" : "Overdue";
    return format(date, "PP", { locale });
  };

  const getDateColor = (dateStr: string, status: string) => {
    if (status === "completed") return "text-muted-foreground";
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return "text-red-600 dark:text-red-400";
    if (isToday(date)) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  const pendingReminders = reminders.filter((r: any) => r.status === "pending");
  const completedReminders = reminders.filter((r: any) => r.status === "completed");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            {language === "es" ? "Recordatorios" : "Reminders"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === "es"
              ? `${pendingReminders.length} pendiente${pendingReminders.length !== 1 ? "s" : ""}`
              : `${pendingReminders.length} pending`}
          </p>
        </div>
        <Button onClick={openNew} className="min-h-[44px]" data-testid="button-add-reminder">
          <Plus className="h-4 w-4 mr-2" />
          {language === "es" ? "Nuevo" : "New"}
        </Button>
      </div>

      {pendingReminders.length === 0 && completedReminders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-muted-foreground">
              {language === "es" ? "Sin recordatorios" : "No reminders"}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "es"
                ? "Crea un recordatorio para dar seguimiento a este lead"
                : "Create a reminder to follow up with this lead"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={openNew}
              data-testid="button-add-first-reminder"
            >
              <Plus className="h-4 w-4 mr-1" />
              {language === "es" ? "Agregar recordatorio" : "Add reminder"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingReminders.length > 0 && (
            <div className="space-y-2">
              {pendingReminders.map((reminder: any) => {
                const typeInfo = getReminderTypeInfo(reminder.reminderType);
                const priorityInfo = getPriorityInfo(reminder.priority);
                const TypeIcon = typeInfo.icon;

                return (
                  <Card
                    key={reminder.id}
                    className={`${
                      isPast(new Date(reminder.reminderDate)) && !isToday(new Date(reminder.reminderDate))
                        ? "border-red-300 dark:border-red-800"
                        : ""
                    }`}
                    data-testid={`reminder-card-${reminder.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleComplete(reminder)}
                          className="mt-1 min-w-[20px] min-h-[20px]"
                          data-testid={`checkbox-complete-${reminder.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium leading-tight">{reminder.title}</p>
                              {reminder.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {reminder.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(reminder)}
                                className="min-h-[44px] min-w-[44px]"
                                data-testid={`button-edit-${reminder.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(reminder.id)}
                                className="min-h-[44px] min-w-[44px] text-destructive"
                                data-testid={`button-delete-${reminder.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="gap-1">
                              <TypeIcon className="h-3 w-3" />
                              {language === "es" ? typeInfo.labelEs : typeInfo.labelEn}
                            </Badge>
                            <Badge className={priorityInfo.color}>
                              {language === "es" ? priorityInfo.labelEs : priorityInfo.labelEn}
                            </Badge>
                            <span className={`text-sm flex items-center gap-1 ${getDateColor(reminder.reminderDate, reminder.status)}`}>
                              <Calendar className="h-3 w-3" />
                              {getDateLabel(reminder.reminderDate)}
                              {reminder.reminderTime && (
                                <>
                                  <Clock className="h-3 w-3 ml-1" />
                                  {reminder.reminderTime}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {completedReminders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Check className="h-4 w-4" />
                {language === "es" ? "Completados" : "Completed"}
                ({completedReminders.length})
              </h4>
              {completedReminders.slice(0, 5).map((reminder: any) => (
                <Card key={reminder.id} className="opacity-60" data-testid={`reminder-completed-${reminder.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleComplete(reminder)}
                        className="mt-1 min-w-[20px] min-h-[20px]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-through text-muted-foreground">{reminder.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reminder.completedAt
                            ? format(new Date(reminder.completedAt), "PPp", { locale })
                            : format(new Date(reminder.reminderDate), "PP", { locale })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingReminder
                ? language === "es"
                  ? "Editar recordatorio"
                  : "Edit reminder"
                : language === "es"
                ? "Nuevo recordatorio"
                : "New reminder"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? `Para: ${leadName}`
                : `For: ${leadName}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Título" : "Title"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={language === "es" ? "Ej: Llamar para seguimiento" : "E.g: Follow-up call"}
                        className="min-h-[44px]"
                        data-testid="input-reminder-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Descripción (opcional)" : "Description (optional)"}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={language === "es" ? "Notas adicionales..." : "Additional notes..."}
                        rows={2}
                        data-testid="input-reminder-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="reminderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Fecha" : "Date"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="min-h-[44px]"
                          data-testid="input-reminder-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Hora" : "Time"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="min-h-[44px]"
                          data-testid="input-reminder-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="reminderType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Tipo" : "Type"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-[44px]" data-testid="select-reminder-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REMINDER_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {language === "es" ? type.labelEs : type.labelEn}
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Prioridad" : "Priority"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-[44px]" data-testid="select-reminder-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {language === "es" ? p.labelEs : p.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="min-h-[44px]"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="min-h-[44px]"
                  data-testid="button-save-reminder"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {language === "es" ? "Guardar" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "es" ? "Eliminar recordatorio" : "Delete reminder"}</DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "¿Estás seguro de que deseas eliminar este recordatorio? Esta acción no se puede deshacer."
                : "Are you sure you want to delete this reminder? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="min-h-[44px]"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              className="min-h-[44px]"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Eliminar" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
