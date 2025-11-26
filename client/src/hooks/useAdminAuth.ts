import { useQuery } from "@tanstack/react-query";

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  onboardingCompleted?: boolean;
  onboardingSteps?: Record<string, any>;
}

export function useAdminAuth() {
  const { data: adminUser, isLoading, error } = useQuery<AdminUser | null>({
    queryKey: ["/api/auth/admin/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/admin/user", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      const data = await response.json();
      // Return null if no admin user (instead of throwing error)
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    // Don't refetch on every mount - this causes 1s+ delay on every navigation
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Cache for 5 minutes - invalidation still works via queryClient.invalidateQueries
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    adminUser,
    // Check both adminUser and absence of error to handle:
    // - No admin session: adminUser=null, error=undefined → false
    // - Admin session: adminUser=data, error=undefined → true  
    // - Network error: error=present → false (prevents stale data)
    isAdminAuthenticated: !!adminUser && !error,
    isLoading,
  };
}
