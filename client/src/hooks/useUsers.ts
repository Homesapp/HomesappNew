import { useQuery, useMutation } from "@tanstack/react-query";
import type { User, AuditLog } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function usePendingUsers() {
  return useQuery<User[]>({
    queryKey: ["/api/users/pending"],
  });
}

export function useApprovedUsers() {
  return useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (users) => users.filter(user => user.status === "approved"),
  });
}

export function useUserAuditHistory(userId: string | null, limit: number = 100) {
  return useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs/user", userId, limit],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const res = await fetch(`/api/audit-logs/user/${userId}?limit=${limit}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch audit history");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useUsersByRole(role: string) {
  return useQuery<User[]>({
    queryKey: ["/api/users/role", role],
    enabled: !!role,
  });
}

export function useApproveUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useRejectUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useApproveAllUsers() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users/approve-all");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useUpdateUserRole() {
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
  });
}
