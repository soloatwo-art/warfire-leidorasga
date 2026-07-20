"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface MeResponse {
  id: string;
  name: string;
  login: string;
  role: string;
}

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<MeResponse>("/auth/me"),
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess) {
      setUser(query.data as any);
      setHydrated(true);
    }
    if (query.isError) {
      setUser(null);
      setHydrated(true);
    }
  }, [query.isSuccess, query.isError, query.data, setUser, setHydrated]);

  return query;
}
