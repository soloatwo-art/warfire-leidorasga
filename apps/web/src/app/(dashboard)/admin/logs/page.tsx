"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  action: string;
  target: string | null;
  createdAt: string;
  actor: { name: string; login: string } | null;
}

export default function LogsPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () => api.get<AuditLogEntry[]>("/logs"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-ink">Logs de Auditoria</h1>
      <div className="glass-panel overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 text-left text-ink-faint">
              <th className="p-3">Data</th>
              <th className="p-3">Ação</th>
              <th className="p-3">Ator</th>
              <th className="p-3">Alvo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="p-3 text-ink-muted">
                  Carregando...
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 text-ink-faint">{formatDateTime(log.createdAt)}</td>
                <td className="p-3 text-neon-soft">{log.action}</td>
                <td className="p-3">{log.actor?.name ?? "—"}</td>
                <td className="p-3 text-ink-faint">{log.target ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
