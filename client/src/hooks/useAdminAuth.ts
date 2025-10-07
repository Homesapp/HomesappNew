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
  const { data: adminUser, isLoading, error } = useQuery<AdminUser>({
    queryKey: ["/api/auth/admin/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/admin/user", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      return response.json();
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
    isAdminAuthenticated: !!adminUser && !error,
    isLoading,
  };
}
