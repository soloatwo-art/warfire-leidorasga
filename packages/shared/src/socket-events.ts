export const SOCKET_EVENTS = {
  GUILD_EVENT: "guild:event",
  GUILD_OVERVIEW_UPDATED: "guild:overview_updated",
  MEMBER_ONLINE: "guild:member_online",
  MEMBER_OFFLINE: "guild:member_offline",
  MEMBER_LEVEL_UP: "guild:member_level_up",
  MEMBER_JOINED: "guild:member_joined",
  MEMBER_LEFT: "guild:member_left",
  MEMBER_RANK_CHANGED: "guild:member_rank_changed",
  MEMBER_TRANSFER: "guild:member_transfer",
  NOTIFICATION: "notification:new",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
