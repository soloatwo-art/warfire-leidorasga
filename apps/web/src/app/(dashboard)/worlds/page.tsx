"use client";

import { useQuery } from "@tanstack/react-query";
import { Globe2, ArrowRightLeft, Skull } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { WorldCardDto } from "@warfire/shared";

export default function WorldsPage() {
  const { data: worlds = [], isLoading } = useQuery({
    queryKey: ["worlds"],
    queryFn: () => api.get<WorldCardDto[]>("/worlds"),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-ink">Monitoramento de Mundos</h1>
      {isLoading && <p className="text-xs text-ink-muted">Carregando...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {worlds.map((world) => (
          <div key={world.world} className="glass-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <Globe2 size={16} className="text-neon-soft" />
                {world.world}
              </p>
              <div className="text-right text-xs">
                <p className="text-online font-semibold">{world.onlineCount} online</p>
                <p className="text-ink-faint">{world.guildMembersOnline} da guild</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 flex items-center gap-1 text-[11px] text-ink-faint">
                  <ArrowRightLeft size={11} /> Últimos Transfers
                </p>
                <div className="space-y-1">
                  {world.recentTransfers.slice(0, 5).map((t, i) => (
                    <div key={i} className="text-[11px] text-ink-muted">
                      {t.characterName}{" "}
                      <span className="text-ink-faint">
                        ({t.fromWorld} → {t.toWorld})
                      </span>
                    </div>
                  ))}
                  {world.recentTransfers.length === 0 && (
                    <p className="text-[11px] text-ink-faint">Nenhum recente.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-1 flex items-center gap-1 text-[11px] text-ink-faint">
                  <Skull size={11} /> Últimas Mortes
                </p>
                <div className="space-y-1">
                  {world.recentDeaths.slice(0, 5).map((d, i) => (
                    <div key={i} className="text-[11px] text-ink-muted">
                      {d.characterName}{" "}
                      <span className="text-ink-faint">
                        (lvl {d.level} por {d.killer})
                      </span>
                    </div>
                  ))}
                  {world.recentDeaths.length === 0 && (
                    <p className="text-[11px] text-ink-faint">Nenhuma recente.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
