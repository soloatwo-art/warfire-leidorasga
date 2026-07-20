"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SOCKET_EVENTS, GuildEventType } from "@warfire/shared";
import { getSocket } from "@/lib/socket";

const EVENT_LABELS: Record<string, string> = {
  [GuildEventType.JOIN]: "entrou na guild",
  [GuildEventType.LEAVE]: "saiu da guild",
  [GuildEventType.LEVEL_UP]: "subiu de level",
  [GuildEventType.PROMOTION]: "foi promovido",
  [GuildEventType.DEMOTION]: "foi rebaixado",
  [GuildEventType.ONLINE]: "ficou online",
  [GuildEventType.OFFLINE]: "ficou offline",
  [GuildEventType.TRANSFER]: "mudou de mundo",
  [GuildEventType.DEATH]: "morreu",
};

/**
 * Wires the shared Socket.IO connection to toast popups + React Query cache
 * invalidation, so every dashboard page reflects guild events without a
 * page reload. Mount once near the root of the authenticated layout.
 */
export function useRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    const onGuildEvent = (payload: { type: string; characterName: string }) => {
      const label = EVENT_LABELS[payload.type] ?? payload.type;
      if (payload.type !== GuildEventType.OFFLINE) {
        toast(`${payload.characterName} ${label}`);
      }
      queryClient.invalidateQueries({ queryKey: ["guild"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    };

    const onOverviewUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["guild", "overview"] });
    };

    const onNotification = (payload: { message: string }) => {
      toast.info(payload.message);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    socket.on(SOCKET_EVENTS.GUILD_EVENT, onGuildEvent);
    socket.on(SOCKET_EVENTS.GUILD_OVERVIEW_UPDATED, onOverviewUpdated);
    socket.on(SOCKET_EVENTS.NOTIFICATION, onNotification);

    return () => {
      socket.off(SOCKET_EVENTS.GUILD_EVENT, onGuildEvent);
      socket.off(SOCKET_EVENTS.GUILD_OVERVIEW_UPDATED, onOverviewUpdated);
      socket.off(SOCKET_EVENTS.NOTIFICATION, onNotification);
    };
  }, [queryClient]);
}
