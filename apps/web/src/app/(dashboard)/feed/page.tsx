"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LogIn,
  LogOut,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Wifi,
  WifiOff,
  ArrowRightLeft,
  Skull,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { GuildEventType, type GuildFeedEventDto } from "@warfire/shared";

const ICONS: Record<string, typeof LogIn> = {
  [GuildEventType.JOIN]: LogIn,
  [GuildEventType.LEAVE]: LogOut,
  [GuildEventType.LEVEL_UP]: TrendingUp,
  [GuildEventType.PROMOTION]: ArrowUpCircle,
  [GuildEventType.DEMOTION]: ArrowDownCircle,
  [GuildEventType.ONLINE]: Wifi,
  [GuildEventType.OFFLINE]: WifiOff,
  [GuildEventType.TRANSFER]: ArrowRightLeft,
  [GuildEventType.DEATH]: Skull,
};

const COLORS: Record<string, string> = {
  [GuildEventType.JOIN]: "text-online",
  [GuildEventType.LEAVE]: "text-offline",
  [GuildEventType.LEVEL_UP]: "text-gold",
  [GuildEventType.PROMOTION]: "text-neon-soft",
  [GuildEventType.DEMOTION]: "text-orange-400",
  [GuildEventType.ONLINE]: "text-online",
  [GuildEventType.OFFLINE]: "text-ink-faint",
  [GuildEventType.TRANSFER]: "text-neon-soft",
  [GuildEventType.DEATH]: "text-offline",
};

export default function FeedPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["guild", "feed", "full"],
    queryFn: () => api.get<GuildFeedEventDto[]>("/guild/feed?limit=150"),
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-ink">Feed da Guild</h1>

      <div className="glass-panel p-4">
        {isLoading && <p className="text-xs text-ink-muted">Carregando...</p>}
        <div className="space-y-3">
          {events.map((e) => {
            const Icon = ICONS[e.type] ?? LogIn;
            return (
              <div key={e.id} className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0">
                <div className={`mt-0.5 ${COLORS[e.type] ?? "text-ink-muted"}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink">{e.message}</p>
                  <p className="text-[11px] text-ink-faint">{formatDateTime(e.occurredAt)}</p>
                </div>
              </div>
            );
          })}
          {!isLoading && events.length === 0 && (
            <p className="text-xs text-ink-faint">Nenhum evento registrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
