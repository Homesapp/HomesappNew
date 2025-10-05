import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Property } from "@shared/schema";

export function useFavorites() {
  const { data: favorites = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/favorites"],
  });

  return { favorites, isLoading };
}

export function useFavoriteStatus(propertyId: string) {
  const { data: isFavorite = false, isLoading } = useQuery<boolean>({
    queryKey: ["/api/favorites", propertyId, "check"],
    queryFn: async () => {
      const response = await fetch(`/api/favorites/${propertyId}/check`);
      const data = await response.json();
      return data.isFavorite;
    },
    enabled: !!propertyId,
  });

  return { isFavorite, isLoading };
}

export function useToggleFavorite() {
  return useMutation({
    mutationFn: async ({ propertyId, isFavorite }: { propertyId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${propertyId}`);
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId });
      }
      return { propertyId, newFavoriteState: !isFavorite };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/favorites", data.propertyId, "check"] 
      });
    },
  });
}
