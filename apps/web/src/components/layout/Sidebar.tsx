"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Trophy,
  Globe2,
  Rss,
  Sparkles,
  UserCircle,
  ShieldCheck,
  Plug,
  ScrollText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@warfire/shared";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Membros", icon: Users },
  { href: "/stats", label: "Estatísticas", icon: BarChart3 },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/worlds", label: "Mundos", icon: Globe2 },
  { href: "/feed", label: "Feed da Guild", icon: Rss },
  { href: "/assistant", label: "Assistente", icon: Sparkles },
  { href: "/profile", label: "Meu Perfil", icon: UserCircle },
];

const ADMIN_ITEMS = [
  { href: "/admin/approvals", label: "Aprovações", icon: ShieldCheck },
  { href: "/admin/integrations", label: "Integrações", icon: Plug },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.MASTER;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-bg-surface/60 p-4 backdrop-blur-xl lg:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-neon to-neon-deep shadow-glow">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-ink">Warfire Leidorasga</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Guild Control Center</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={pathname?.startsWith(item.href)} />
        ))}

        {isAdmin && (
          <>
            <p className="mt-4 mb-1 px-3 text-[10px] uppercase tracking-widest text-ink-faint">
              Administração
            </p>
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={pathname?.startsWith(item.href)} />
            ))}
          </>
        )}
      </nav>

      <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-3 text-[11px] text-gold-soft">
        {user?.name ?? "—"}
        <p className="text-ink-faint">{user?.role}</p>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof LayoutDashboard };
  active?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-neon/10 text-neon-soft shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]"
          : "text-ink-muted hover:bg-white/5 hover:text-ink",
      )}
    >
      <Icon size={16} />
      {item.label}
    </Link>
  );
}
