import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Calendar,
  DollarSign,
  Wrench,
  MessageSquare,
  Users,
  FileText,
  Settings,
} from "lucide-react";

export function NotificationPreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery<any>({
    queryKey: ["/api/app-notification-preferences"],
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", "/api/app-notification-preferences", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-notification-preferences"] });
    },
  });

  const togglePreference = (category: string, channel: "inApp" | "email") => {
    if (!preferences) return;
    
    const currentChannels = preferences.categories?.[category] || { inApp: true, email: false };
    const updatedCategories = {
      ...preferences.categories,
      [category]: {
        ...currentChannels,
        [channel]: !currentChannels[channel],
      },
    };
    
    updateMutation.mutate({ categories: updatedCategories });
  };

  const categories = [
    { key: "appointment", label: "Citas", icon: Calendar },
    { key: "payment", label: "Pagos", icon: DollarSign },
    { key: "maintenance", label: "Mantenimiento", icon: Wrench },
    { key: "message", label: "Mensajes", icon: MessageSquare },
    { key: "lead", label: "Leads", icon: Users },
    { key: "contract", label: "Contratos", icon: FileText },
    { key: "system", label: "Sistema", icon: Settings },
  ];

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Cargando preferencias...</div>;
  }

  return (
    <div className="space-y-4" data-testid="notification-preferences">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5" />
        <h3 className="font-semibold">Preferencias de notificaciones</h3>
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const channelPrefs = preferences?.categories?.[category.key] || { inApp: true, email: false };

          return (
            <div
              key={category.key}
              className="flex items-center justify-between p-3 rounded-lg border"
              data-testid={`pref-row-${category.key}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{category.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={channelPrefs.inApp}
                    onChange={() => togglePreference(category.key, "inApp")}
                    className="rounded border-gray-300"
                    data-testid={`checkbox-inapp-${category.key}`}
                  />
                  En app
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={channelPrefs.email}
                    onChange={() => togglePreference(category.key, "email")}
                    className="rounded border-gray-300"
                    data-testid={`checkbox-email-${category.key}`}
                  />
                  Email
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences?.quietHoursEnabled ?? false}
            onChange={() => updateMutation.mutate({ quietHoursEnabled: !preferences?.quietHoursEnabled })}
            className="rounded border-gray-300"
            data-testid="checkbox-quiet-hours"
          />
          <div>
            <span className="text-sm font-medium">Horas silenciosas</span>
            <p className="text-xs text-muted-foreground">
              No recibir notificaciones entre 10pm y 8am
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
