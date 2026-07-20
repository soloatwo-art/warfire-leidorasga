"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Wifi, WifiOff, TrendingUp, Crown, LogIn, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/lib/utils";
import type { GuildOverviewDto, GuildFeedEventDto } from "@warfire/shared";

export default function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ["guild", "overview"],
    queryFn: () => api.get<GuildOverviewDto>("/guild/overview"),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start"
      >
        {overview?.logoUrl && (
          <img
            src={overview.logoUrl}
            alt={overview.guildName}
            className="h-16 w-16 rounded-xl border border-white/10 shadow-glow"
          />
        )}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl font-bold text-ink">{overview?.guildName ?? "Warfire Leidorasga"}</h1>
          <p className="text-xs text-ink-faint">{overview?.world}</p>
          {overview?.description && (
            <p className="mt-2 whitespace-pre-line text-xs text-ink-muted">{overview.description}</p>
          )}
        </div>
        <div className="text-center sm:text-right">
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Última atualização</p>
          <p className="text-xs text-neon-soft">{formatDateTime(overview?.lastUpdatedAt)}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Membros" value={overview?.memberCount ?? "—"} icon={Users} accent="neon" />
        <StatCard label="Online" value={overview?.onlineCount ?? "—"} icon={Wifi} accent="online" />
        <StatCard label="Offline" value={overview?.offlineCount ?? "—"} icon={WifiOff} accent="offline" />
        <StatCard
          label="Level Médio"
          value={overview?.averageLevel ?? "—"}
          icon={TrendingUp}
          accent="neon"
        />
        <StatCard label="Maior Level" value={overview?.maxLevel ?? "—"} icon={Crown} accent="gold" />
        <StatCard
          label="Último a Entrar"
          value={overview?.lastMemberJoined?.name ?? "—"}
          icon={LogIn}
          accent="online"
          sublabel={overview?.lastMemberJoined ? formatDateTime(overview.lastMemberJoined.joinDate) : undefined}
        />
        <StatCard
          label="Último a Sair"
          value={overview?.lastMemberLeft?.name ?? "—"}
          icon={LogOut}
          accent="offline"
          sublabel={
            overview?.lastMemberLeft ? formatDateTime(overview.lastMemberLeft.occurredAt) : undefined
          }
        />
      </div>

      <MiniFeed />
    </div>
  );
}

function MiniFeed() {
  const { data: events = [] } = useQuery({
    queryKey: ["guild", "feed", "mini"],
    queryFn: () => api.get<GuildFeedEventDto[]>("/guild/feed?limit=8").catch(() => []),
    refetchInterval: 20_000,
  });

  return (
    <div className="glass-panel p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Atividade Recente
      </p>
      {events.length === 0 && <p className="text-xs text-ink-faint">Sem eventos recentes ainda.</p>}
      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between text-xs">
            <span className="text-ink">{e.message}</span>
            <span className="text-ink-faint">{formatDateTime(e.occurredAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
