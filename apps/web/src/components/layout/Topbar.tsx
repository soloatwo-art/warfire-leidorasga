"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { formatRelative, cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { NotificationDto } from "@warfire/shared";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<NotificationDto[]>("/notifications"),
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleLogout() {
    await api.post("/auth/logout");
    setUser(null);
    queryClient.clear();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 bg-bg-surface/40 px-4 backdrop-blur-xl lg:px-6">
      <div className="text-sm text-ink-muted">
        Painel em tempo real <span className="text-online">●</span> ao vivo
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-ink-muted hover:text-ink"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-offline px-1 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="glass-panel absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto p-2">
              {notifications.length === 0 && (
                <p className="p-3 text-xs text-ink-faint">Sem notificações ainda.</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-lg p-2 text-xs",
                    n.read ? "text-ink-faint" : "text-ink",
                  )}
                >
                  <p>{n.message}</p>
                  <p className="text-[10px] text-ink-faint">{formatRelative(n.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-ink-muted hover:border-offline/40 hover:text-offline"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </header>
  );
}
