"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Zap, Trophy, Crown } from "lucide-react";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";

const COLORS = ["#3b82f6", "#60a5fa", "#d4af37", "#22c55e", "#a855f7", "#ef4444", "#f0d78c"];

const CHART_TOOLTIP_STYLE = {
  background: "rgba(10,14,26,0.9)",
  border: "1px solid rgba(59,130,246,0.3)",
  borderRadius: 8,
  fontSize: 12,
};

export default function StatsPage() {
  const { data: vocations = [] } = useQuery({
    queryKey: ["stats", "vocations"],
    queryFn: () => api.get<{ vocation: string; count: number }[]>("/stats/charts/vocations"),
  });
  const { data: worlds = [] } = useQuery({
    queryKey: ["stats", "worlds"],
    queryFn: () => api.get<{ world: string; count: number }[]>("/stats/charts/worlds"),
  });
  const { data: onlineToday = [] } = useQuery({
    queryKey: ["stats", "online-today"],
    queryFn: () => api.get<{ hour: number; onlineCount: number }[]>("/stats/charts/online-today"),
  });
  const { data: weekHistory = [] } = useQuery({
    queryKey: ["stats", "history", "week"],
    queryFn: () =>
      api.get<{ date: string; memberCount: number; onlineCount: number; averageLevel: number }[]>(
        "/stats/history/week",
      ),
  });
  const { data: guildPower } = useQuery({
    queryKey: ["stats", "guild-power"],
    queryFn: () =>
      api.get<{ totalLevels: number; memberCount: number; totalLevelGainsThisMonth: number }>(
        "/stats/guild-power",
      ),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-ink">Estatísticas</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Guild Power" value={guildPower?.totalLevels ?? "—"} icon={Zap} accent="gold" />
        <StatCard
          label="Levels Ganhos (mês)"
          value={guildPower?.totalLevelGainsThisMonth ?? "—"}
          icon={Trophy}
          accent="neon"
        />
        <StatCard label="Membros" value={guildPower?.memberCount ?? "—"} icon={Crown} accent="neon" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Players por Vocação">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={vocations}
                dataKey="count"
                nameKey="vocation"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {vocations.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Players por Mundo">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={worlds}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="world" stroke="#5b6577" fontSize={10} />
              <YAxis stroke="#5b6577" fontSize={10} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Online ao Longo do Dia (hoje)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={onlineToday}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="hour" stroke="#5b6577" fontSize={10} tickFormatter={(h) => `${h}h`} />
              <YAxis stroke="#5b6577" fontSize={10} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="onlineCount" stroke="#60a5fa" fill="url(#onlineGradient)" />
              <defs>
                <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Histórico Semanal (level médio)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weekHistory}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="#5b6577" fontSize={10} />
              <YAxis stroke="#5b6577" fontSize={10} domain={["dataMin - 10", "dataMax + 10"]} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="averageLevel" stroke="#d4af37" fill="url(#goldGradient)" />
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
      {children}
    </div>
  );
}
