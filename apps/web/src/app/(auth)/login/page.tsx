"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/login", { login, password });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Falha ao entrar.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-ink-muted">Login</label>
        <input
          className="input-field"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-muted">Senha</label>
        <input
          type="password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        <LogIn size={16} />
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-xs text-ink-faint">
        Não tem conta?{" "}
        <Link href="/register" className="text-neon-soft hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
