import { useQuery } from "@tanstack/react-query";

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
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
  });

  return {
    adminUser,
    isAdminAuthenticated: !!adminUser && !error,
    isLoading,
  };
}
