import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "neon" | "gold" | "online" | "offline";
  sublabel?: string;
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  neon: "text-neon-soft",
  gold: "text-gold",
  online: "text-online",
  offline: "text-offline",
};

export function StatCard({ label, value, icon: Icon, accent = "neon", sublabel }: StatCardProps) {
  return (
    <div className="glass-card flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5",
          ACCENT_CLASSES[accent],
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="stat-label truncate">{label}</p>
        <p className="stat-value">{value}</p>
        {sublabel && <p className="text-[11px] text-ink-faint truncate">{sublabel}</p>}
      </div>
    </div>
  );
}
