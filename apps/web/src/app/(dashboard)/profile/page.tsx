"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { MarkerBadge } from "@/components/ui/MarkerBadge";
import { MARKER_TAG_LABELS, MarkerTag } from "@warfire/shared";

interface MyCharacter {
  id: string;
  name: string;
  world: string;
  isPrincipal: boolean;
  markerTag: MarkerTag;
  level: number | null;
  vocation: string | null;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", world: "", markerTag: MarkerTag.MARKER });
  const [adding, setAdding] = useState(false);

  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["characters", "mine"],
    queryFn: () => api.get<MyCharacter[]>("/characters/mine"),
  });

  async function addCharacter(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.world) return;
    setAdding(true);
    try {
      await api.post("/characters", form);
      toast.success("Personagem adicionado.");
      setForm({ name: "", world: "", markerTag: MarkerTag.MARKER });
      queryClient.invalidateQueries({ queryKey: ["characters", "mine"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao adicionar.");
    } finally {
      setAdding(false);
    }
  }

  async function removeCharacter(id: string) {
    try {
      await api.delete(`/characters/${id}`);
      queryClient.invalidateQueries({ queryKey: ["characters", "mine"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao remover.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-ink">Meu Perfil</h1>

      <div className="glass-panel p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Meus Personagens
        </p>
        {isLoading && <p className="text-xs text-ink-muted">Carregando...</p>}
        <div className="space-y-2">
          {characters.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-white/10 p-3"
            >
              <div>
                <Link href={`/members/${encodeURIComponent(c.name)}`} className="font-medium text-ink hover:text-neon-soft">
                  {c.name}
                </Link>
                <p className="text-xs text-ink-faint">
                  {c.vocation ?? "?"} · {c.level ?? "?"} · {c.world}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MarkerBadge tag={c.markerTag} />
                {c.isPrincipal && <span className="badge border-gold/40 text-gold">Principal</span>}
                {!c.isPrincipal && (
                  <button
                    onClick={() => removeCharacter(c.id)}
                    className="text-ink-faint hover:text-offline"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={addCharacter} className="glass-panel p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Adicionar Character
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className="input-field flex-1"
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input-field flex-1"
            placeholder="Mundo"
            value={form.world}
            onChange={(e) => setForm((f) => ({ ...f, world: e.target.value }))}
          />
          <select
            className="input-field"
            value={form.markerTag}
            onChange={(e) => setForm((f) => ({ ...f, markerTag: e.target.value as MarkerTag }))}
          >
            {Object.values(MarkerTag).map((tag) => (
              <option key={tag} value={tag}>
                {MARKER_TAG_LABELS[tag]}
              </option>
            ))}
          </select>
          <button type="submit" disabled={adding} className="btn-primary">
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </form>
    </div>
  );
}
