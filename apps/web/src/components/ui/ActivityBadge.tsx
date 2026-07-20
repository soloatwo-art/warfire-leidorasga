import { ActivityLevel } from "@warfire/shared";
import { cn } from "@/lib/utils";

const STYLES: Record<ActivityLevel, { label: string; className: string }> = {
  [ActivityLevel.MUITO_ATIVO]: {
    label: "Muito Ativo",
    className: "text-online border-online/40 bg-online/10",
  },
  [ActivityLevel.ATIVO]: {
    label: "Ativo",
    className: "text-neon-soft border-neon/40 bg-neon/10",
  },
  [ActivityLevel.POUCO_ATIVO]: {
    label: "Pouco Ativo",
    className: "text-gold border-gold/40 bg-gold/10",
  },
  [ActivityLevel.INATIVO]: {
    label: "Inativo",
    className: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  },
  [ActivityLevel.SEM_ATIVIDADE]: {
    label: "Sem Atividade",
    className: "text-offline border-offline/40 bg-offline/10",
  },
};

export function ActivityBadge({ level }: { level: ActivityLevel }) {
  const style = STYLES[level];
  return <span className={cn("badge", style.className)}>{style.label}</span>;
}
