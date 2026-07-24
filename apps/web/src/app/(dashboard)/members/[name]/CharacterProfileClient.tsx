"use client";

import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skull, Users2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { MarkerBadge } from "@/components/ui/MarkerBadge";
import { ActivityBadge } from "@/components/ui/ActivityBadge";
import { formatDateTime } from "@/lib/utils";
import type { CharacterProfileDto } from "@warfire/shared";

export function CharacterProfileClient({ name }: { name: string }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["character", name],
    queryFn: () => api.get<CharacterProfileDto>(`/characters/${encodeURIComponent(name)}/profile`),
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Carregando...</p>;
  if (!profile) return <p className="text-sm text-ink-muted">Personagem não encontrado.</p>;

  const chartData = profile.levelHistory.map((l) => ({
    date: new Date(l.recordedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    level: l.level,
  }));

  return (
    <div className="space-y-4">
      <div className="glass-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-ink">{profile.name}</h1>
          <p className="text-xs text-ink-faint">
            {profile.vocation} · {profile.world} · Level {profile.level ?? "?"}
          </p>
          {profile.guildName && (
            <p className="text-xs text-ink-faint">
              {profile.guildRank} da {profile.guildName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MarkerBadge tag={profile.markerTag} />
          <ActivityBadge level={profile.activityLevel} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel p-4 lg:col-span-2">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <TrendingUp size={14} /> Histórico de Level
          </p>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#5b6577" fontSize={10} />
                <YAxis stroke="#5b6577" fontSize={10} domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,14,26,0.9)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="level" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-ink-faint">
              Ainda não há histórico suficiente para o gráfico. Volte depois de alguns ciclos de
              sincronização.
            </p>
          )}
        </div>

        <div className="glass-panel p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Informações
          </p>
          <dl className="space-y-1.5 text-xs">
            <Row label="Residência" value={profile.residence ?? "—"} />
            <Row label="Último Login" value={formatDateTime(profile.lastLoginAt)} />
            <Row label="Título de Lealdade" value={profile.loyaltyTitle ?? "—"} />
            <Row label="Pontos de Conquista" value={profile.achievementPoints ?? "—"} />
            <Row label="Magic Level / Skills" value="Não disponível publicamente no RubinOT" muted />
          </dl>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Skull size={14} /> Últimas Mortes
          </p>
          {profile.deaths.length === 0 && <p className="text-xs text-ink-faint">Sem mortes registradas.</p>}
          <div className="space-y-2">
            {profile.deaths.map((d, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-ink">
                  Level {d.level} por <span className="text-offline">{d.killer}</span>
                </span>
                <span className="text-ink-faint">{formatDateTime(d.occurredAt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Users2 size={14} /> Outros Personagens da Conta
          </p>
          {profile.alternateCharacters.length === 0 && (
            <p className="text-xs text-ink-faint">Nenhum outro personagem visível.</p>
          )}
          <div className="space-y-1.5">
            {profile.alternateCharacters.map((alt) => (
              <div key={alt.name} className="flex justify-between text-xs">
                <span className="text-ink">{alt.name}</span>
                <span className="text-ink-faint">
                  {alt.vocation} · {alt.level} · {alt.world}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string | number; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-faint">{label}</dt>
      <dd className={muted ? "text-ink-faint italic" : "text-ink"}>{value}</dd>
    </div>
  );
}
