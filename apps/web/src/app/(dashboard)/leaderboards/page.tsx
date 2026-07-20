"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown, Radar } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { LeaderboardEntryDto } from "@warfire/shared";

const TYPES = [
  { value: "level-gain", label: "Mais Upou" },
  { value: "deaths", label: "Mais Mortes" },
  { value: "transfers", label: "Mais Transferências" },
  { value: "online-sessions", label: "Mais Sessões Online" },
  { value: "highest-level", label: "Maior Level" },
] as const;

const PERIODS = [
  { value: "day", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "all", label: "Geral" },
] as const;

export default function LeaderboardsPage() {
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("level-gain");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("week");

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["stats", "leaderboard", type, period],
    queryFn: () => api.get<LeaderboardEntryDto[]>(`/stats/leaderboard/${type}?period=${period}`),
  });

  const { data: hallOfFame } = useQuery({
    queryKey: ["stats", "hall-of-fame"],
    queryFn: () =>
      api.get<{
        highestLevel: LeaderboardEntryDto[];
        longestInGuild: LeaderboardEntryDto[];
        topLevelGainsAllTime: LeaderboardEntryDto[];
      }>("/stats/hall-of-fame"),
  });

  const { data: inactivityRadar = [] } = useQuery({
    queryKey: ["stats", "inactivity-radar"],
    queryFn: () =>
      api.get<{ characterName: string; daysSinceLastActivity: number | null }[]>(
        "/stats/inactivity-radar",
      ),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-ink">Leaderboards</h1>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={cn("btn-ghost text-xs", type === t.value && "border-neon/40 text-neon-soft")}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px]",
                period === p.value ? "bg-neon/15 text-neon-soft" : "text-ink-faint hover:text-ink",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        {isLoading && <p className="text-xs text-ink-muted">Carregando...</p>}
        <div className="space-y-1.5">
          {leaderboard.map((entry) => (
            <div
              key={entry.characterName}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                    entry.rank === 1
                      ? "bg-gold/20 text-gold"
                      : entry.rank === 2
                        ? "bg-white/10 text-ink"
                        : entry.rank === 3
                          ? "bg-orange-700/20 text-orange-300"
                          : "bg-white/5 text-ink-faint",
                  )}
                >
                  {entry.rank}
                </span>
                <span className="font-medium text-ink">{entry.characterName}</span>
                <span className="text-ink-faint">
                  {entry.vocation} · {entry.world}
                </span>
              </div>
              <span className="font-semibold text-neon-soft">{entry.value}</span>
            </div>
          ))}
          {!isLoading && leaderboard.length === 0 && (
            <p className="text-xs text-ink-faint">Sem dados para este período ainda.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold">
            <Crown size={14} /> Hall da Fama
          </p>
          <MiniList title="Maior Level" items={hallOfFame?.highestLevel ?? []} />
          <MiniList title="Mais Tempo de Guild (dias)" items={hallOfFame?.longestInGuild ?? []} className="mt-3" />
          <MiniList
            title="Mais Levels Ganhos (geral)"
            items={hallOfFame?.topLevelGainsAllTime ?? []}
            className="mt-3"
          />
        </div>

        <div className="glass-panel p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-offline">
            <Radar size={14} /> Radar de Inatividade
          </p>
          <div className="space-y-1.5">
            {inactivityRadar.map((m) => (
              <div key={m.characterName} className="flex justify-between text-xs">
                <span className="text-ink">{m.characterName}</span>
                <span className="text-ink-faint">
                  {m.daysSinceLastActivity ?? "?"} dias sem atividade
                </span>
              </div>
            ))}
            {inactivityRadar.length === 0 && (
              <p className="text-xs text-ink-faint">Ninguém inativo — guild agitada!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniList({
  title,
  items,
  className,
}: {
  title: string;
  items: LeaderboardEntryDto[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 flex items-center gap-1 text-[11px] text-ink-faint">
        <Trophy size={11} /> {title}
      </p>
      <div className="space-y-1">
        {items.slice(0, 5).map((item) => (
          <div key={item.characterName} className="flex justify-between text-xs">
            <span className="text-ink">{item.characterName}</span>
            <span className="text-gold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
