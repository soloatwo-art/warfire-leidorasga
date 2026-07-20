"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { MARKER_TAG_LABELS, MarkerTag } from "@warfire/shared";

interface SecondaryCharacterForm {
  name: string;
  world: string;
  markerTag: MarkerTag;
}

const MARKER_OPTIONS = Object.values(MarkerTag);

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    discordTag: "",
    login: "",
    password: "",
    mainCharacterName: "",
    world: "",
    isMainMarker: false,
  });
  const [secondaries, setSecondaries] = useState<SecondaryCharacterForm[]>([]);

  function addSecondary() {
    setSecondaries((prev) => [...prev, { name: "", world: "", markerTag: MarkerTag.MARKER }]);
  }

  function updateSecondary(index: number, patch: Partial<SecondaryCharacterForm>) {
    setSecondaries((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeSecondary(index: number) {
    setSecondaries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", {
        ...form,
        secondaryCharacters: secondaries.filter((s) => s.name && s.world),
      });
      toast.success("Cadastro enviado! Aguarde a aprovação de um administrador.");
      router.push("/pending");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Falha ao cadastrar.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome">
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </Field>
        <Field label="Discord (opcional)">
          <input
            className="input-field"
            value={form.discordTag}
            onChange={(e) => setForm((f) => ({ ...f, discordTag: e.target.value }))}
            placeholder="usuario#0000"
          />
        </Field>
        <Field label="Login">
          <input
            className="input-field"
            value={form.login}
            onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
            required
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            minLength={6}
            required
          />
        </Field>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Personagem Principal
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome do Personagem">
            <input
              className="input-field"
              value={form.mainCharacterName}
              onChange={(e) => setForm((f) => ({ ...f, mainCharacterName: e.target.value }))}
              required
            />
          </Field>
          <Field label="Mundo">
            <input
              className="input-field"
              value={form.world}
              onChange={(e) => setForm((f) => ({ ...f, world: e.target.value }))}
              placeholder="Grimoria III"
              required
            />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={form.isMainMarker}
            onChange={(e) => setForm((f) => ({ ...f, isMainMarker: e.target.checked }))}
            className="h-4 w-4 rounded border-white/20 bg-bg-surface accent-neon"
          />
          Este personagem é Marker Principal?
        </label>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Personagens Secundários
          </p>
          <button type="button" onClick={addSecondary} className="btn-ghost text-xs">
            <Plus size={14} /> Adicionar Character
          </button>
        </div>

        <div className="space-y-2">
          {secondaries.map((sec, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 p-2">
              <input
                className="input-field"
                placeholder="Nome"
                value={sec.name}
                onChange={(e) => updateSecondary(i, { name: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="Mundo"
                value={sec.world}
                onChange={(e) => updateSecondary(i, { world: e.target.value })}
              />
              <select
                className="input-field"
                value={sec.markerTag}
                onChange={(e) => updateSecondary(i, { markerTag: e.target.value as MarkerTag })}
              >
                {MARKER_OPTIONS.map((tag) => (
                  <option key={tag} value={tag}>
                    {MARKER_TAG_LABELS[tag]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeSecondary(i)}
                className="shrink-0 text-ink-faint hover:text-offline"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        <UserPlus size={16} />
        {loading ? "Enviando..." : "Cadastrar"}
      </button>

      <p className="text-center text-xs text-ink-faint">
        Já tem conta?{" "}
        <Link href="/login" className="text-neon-soft hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-ink-muted">{label}</label>
      {children}
    </div>
  );
}
