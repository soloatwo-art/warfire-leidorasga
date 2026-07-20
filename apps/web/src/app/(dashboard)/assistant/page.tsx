"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface Exchange {
  question: string;
  answer: string;
}

const SUGGESTIONS = [
  "Quem mais upou hoje?",
  "Quem está inativo?",
  "Quem está online?",
  "Quem mais morreu essa semana?",
  "Quem entrou recentemente?",
];

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion("");
    try {
      const res = await api.post<{ answer: string }>("/assistant/ask", { question: q });
      setHistory((h) => [...h, { question: q, answer: res.answer }]);
    } catch {
      setHistory((h) => [...h, { question: q, answer: "Erro ao consultar o assistente." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <h1 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Sparkles size={18} className="text-neon-soft" /> Assistente da Guild
      </h1>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} className="btn-ghost text-xs">
            {s}
          </button>
        ))}
      </div>

      <div className="glass-panel flex-1 space-y-3 overflow-y-auto p-4">
        {history.length === 0 && (
          <p className="text-xs text-ink-faint">
            Pergunte algo sobre a guild — respostas vêm direto dos dados reais coletados, não de um
            LLM (por enquanto).
          </p>
        )}
        {history.map((h, i) => (
          <div key={i} className="space-y-1">
            <p className="text-xs font-semibold text-neon-soft">Você: {h.question}</p>
            <p className="whitespace-pre-line rounded-lg bg-white/[0.03] p-3 text-xs text-ink">
              {h.answer}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2"
      >
        <input
          className="input-field flex-1"
          placeholder="Pergunte algo..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
