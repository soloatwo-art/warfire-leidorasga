"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Bot } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface IntegrationStatus {
  key: "TEAMSPEAK" | "X3T_BOT";
  enabled: boolean;
  configured: boolean;
  status: string;
  updatedAt: string | null;
}

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.get<IntegrationStatus[]>("/integrations"),
  });

  const teamspeak = integrations.find((i) => i.key === "TEAMSPEAK");
  const bot = integrations.find((i) => i.key === "X3T_BOT");

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-ink">Integrações</h1>
      <p className="text-sm text-ink-muted">
        Nenhuma credencial real foi configurada ainda — os painéis abaixo salvam a configuração e
        ficam prontos para conectar assim que houver acesso ao TeamSpeak Query Server e ao x3tBot.
      </p>

      <IntegrationForm
        title="TeamSpeak"
        icon={MessageSquare}
        integrationKey="TEAMSPEAK"
        status={teamspeak}
        fields={["host", "port", "queryUsername", "queryPassword"]}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["integrations"] })}
      />

      <IntegrationForm
        title="x3tBot"
        icon={Bot}
        integrationKey="X3T_BOT"
        status={bot}
        fields={["endpoint", "username", "password", "token"]}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["integrations"] })}
      />
    </div>
  );
}

function IntegrationForm({
  title,
  icon: Icon,
  integrationKey,
  status,
  fields,
  onSaved,
}: {
  title: string;
  icon: typeof MessageSquare;
  integrationKey: "TEAMSPEAK" | "X3T_BOT";
  status?: IntegrationStatus;
  fields: string[];
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/integrations/${integrationKey}`, { enabled: false, config: values });
      toast.success(`${title}: configuração salva (aguardando credenciais reais para conectar).`);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-neon-soft" />
          <p className="font-semibold text-ink">{title}</p>
        </div>
        <span className="badge border-offline/40 text-offline">
          {status?.status === "not_implemented" ? "Não conectado" : "Desconhecido"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((field) => (
          <input
            key={field}
            placeholder={field}
            type={field.toLowerCase().includes("password") ? "password" : "text"}
            className="input-field"
            value={values[field] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
          />
        ))}
      </div>
      <button onClick={save} disabled={saving} className="btn-ghost mt-3 text-xs">
        {saving ? "Salvando..." : "Salvar configuração"}
      </button>
    </div>
  );
}
