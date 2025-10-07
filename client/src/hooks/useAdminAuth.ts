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
    // Allow refetch on mount so onboarding changes are picked up
    refetchOnMount: true,
    refetchOnReconnect: false,
    // Remove staleTime: Infinity to allow cache invalidation to work
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
