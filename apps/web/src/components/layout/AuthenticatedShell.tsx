"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtime } from "@/hooks/useRealtime";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading } = useCurrentUser();
  const { user, hydrated } = useAuthStore();
  useRealtime();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (isLoading || !hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
