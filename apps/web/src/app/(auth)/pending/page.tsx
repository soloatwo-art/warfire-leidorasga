import { Clock } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
        <Clock size={26} />
      </div>
      <h2 className="text-base font-semibold text-ink">Cadastro pendente de aprovação</h2>
      <p className="text-sm text-ink-muted">
        Seu cadastro foi recebido. Um administrador da guild precisa aprová-lo antes que você
        possa acessar o painel. Volte e tente entrar novamente mais tarde.
      </p>
    </div>
  );
}
