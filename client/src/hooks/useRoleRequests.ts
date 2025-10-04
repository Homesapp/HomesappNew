import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RoleRequest } from "@shared/schema";

export function useRoleRequests(status?: string) {
  return useQuery<RoleRequest[]>({
    queryKey: ["/api/role-requests", status ? { status } : {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      return await fetch(`/api/role-requests?${params.toString()}`).then(res => {
        if (!res.ok) throw new Error("Failed to fetch role requests");
        return res.json();
      });
    },
  });
}

export function usePendingRoleRequests() {
  return useRoleRequests("pending");
}

export function useMyRoleRequests() {
  return useQuery<RoleRequest[]>({
    queryKey: ["/api/role-requests/my-requests"],
  });
}

export function useApproveRoleRequest() {
  return useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: string; reviewNotes?: string }) => {
      return await apiRequest("PATCH", `/api/role-requests/${id}/approve`, { reviewNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useRejectRoleRequest() {
  return useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: string; reviewNotes?: string }) => {
      return await apiRequest("PATCH", `/api/role-requests/${id}/reject`, { reviewNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-requests"] });
    },
  });
}

export function useCreateRoleRequest() {
  return useMutation({
    mutationFn: async (data: { requestedRole: string; reason?: string }) => {
      return await apiRequest("POST", "/api/role-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-requests"] });
    },
  });
}
