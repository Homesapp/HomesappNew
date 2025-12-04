import { useQuery, useMutation, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property, InsertProperty } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { logError, getErrorMessage } from "@/lib/errorHandling";

interface PropertyFilters {
  status?: string;
  ownerId?: string;
  active?: boolean;
}

export function useProperties(filters?: PropertyFilters): UseQueryResult<Property[], Error> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") {
    params.append("status", filters.status);
  }
  if (filters?.ownerId) {
    params.append("ownerId", filters.ownerId);
  }
  if (filters?.active !== undefined) {
    params.append("active", filters.active.toString());
  }

  const queryString = params.toString();
  const url = queryString ? `/api/properties?${queryString}` : "/api/properties";

  return useQuery<Property[], Error>({
    queryKey: ["/api/properties", filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
  });
}

export function useProperty(id: string): UseQueryResult<Property, Error> {
  return useQuery<Property, Error>({
    queryKey: ["/api/properties", id],
    enabled: !!id,
  });
}

export function useSearchProperties(query: string): UseQueryResult<Property[], Error> {
  return useQuery<Property[], Error>({
    queryKey: ["/api/properties/search", query],
    queryFn: async () => {
      if (!query.trim()) {
        return [];
      }
      const res = await fetch(`/api/properties/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    enabled: !!query.trim(),
  });
}

export function useCreateProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProperty) => {
      const res = await apiRequest("POST", "/api/properties", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Propiedad creada",
        description: "La propiedad ha sido creada exitosamente",
      });
    },
    onError: (error: unknown) => {
      logError("useCreateProperty", error);
      toast({
        title: "Error al crear propiedad",
        description: getErrorMessage(error, "es"),
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProperty> }) => {
      const res = await apiRequest("PATCH", `/api/properties/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.id] });
      toast({
        title: "Propiedad actualizada",
        description: "La propiedad ha sido actualizada exitosamente",
      });
    },
    onError: (error: unknown) => {
      logError("useUpdateProperty", error);
      toast({
        title: "Error al actualizar propiedad",
        description: getErrorMessage(error, "es"),
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Propiedad eliminada",
        description: "La propiedad ha sido eliminada exitosamente",
      });
    },
    onError: (error: unknown) => {
      logError("useDeleteProperty", error);
      toast({
        title: "Error al eliminar propiedad",
        description: getErrorMessage(error, "es"),
        variant: "destructive",
      });
    },
  });
}
