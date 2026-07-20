"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface PendingUser {
  id: string;
  name: string;
  login: string;
  discordTag: string | null;
  createdAt: string;
  characters: { name: string; world: string; isPrincipal: boolean; markerTag: string }[];
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["auth", "pending"],
    queryFn: () => api.get<PendingUser[]>("/auth/pending"),
  });

  async function act(userId: string, action: "approve" | "reject") {
    try {
      await api.post(`/auth/${action}/${userId}`);
      toast.success(action === "approve" ? "Usuário aprovado." : "Usuário rejeitado.");
      queryClient.invalidateQueries({ queryKey: ["auth", "pending"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha na operação.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-ink">Aprovações Pendentes</h1>

      {isLoading && <p className="text-sm text-ink-muted">Carregando...</p>}
      {!isLoading && pending.length === 0 && (
        <div className="glass-card text-sm text-ink-muted">Nenhum cadastro pendente.</div>
      )}

      <div className="grid gap-3">
        {pending.map((u) => (
          <div key={u.id} className="glass-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ink">{u.name}</p>
                <p className="text-xs text-ink-faint">
                  login: {u.login} {u.discordTag && `· discord: ${u.discordTag}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {u.characters.map((c) => (
                    <span key={c.name} className="badge border-neon/30 text-neon-soft">
                      {c.name} ({c.world}) {c.isPrincipal && "· principal"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => act(u.id, "approve")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-online/40 text-online hover:bg-online/10"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => act(u.id, "reject")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-offline/40 text-offline hover:bg-offline/10"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
