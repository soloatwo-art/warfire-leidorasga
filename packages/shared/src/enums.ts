export enum UserRole {
  PENDING = "PENDING",
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  MASTER = "MASTER",
}

export enum UserStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum MarkerTag {
  MAIN = "MAIN",
  MARKER = "MARKER",
  MAKER = "MAKER",
  FARM = "FARM",
  PK = "PK",
  SUPPORT = "SUPPORT",
}

export enum GuildEventType {
  JOIN = "JOIN",
  LEAVE = "LEAVE",
  PROMOTION = "PROMOTION",
  DEMOTION = "DEMOTION",
  LEVEL_UP = "LEVEL_UP",
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  TRANSFER = "TRANSFER",
  DEATH = "DEATH",
}

export enum NotificationType {
  LEVEL_UP = "LEVEL_UP",
  TRANSFER = "TRANSFER",
  NEW_MEMBER = "NEW_MEMBER",
  MEMBER_LEFT = "MEMBER_LEFT",
  BOSS = "BOSS",
  RANK_CHANGE = "RANK_CHANGE",
  PROMOTION = "PROMOTION",
}

export enum ActivityLevel {
  MUITO_ATIVO = "MUITO_ATIVO",
  ATIVO = "ATIVO",
  POUCO_ATIVO = "POUCO_ATIVO",
  INATIVO = "INATIVO",
  SEM_ATIVIDADE = "SEM_ATIVIDADE",
}

export const MARKER_TAG_LABELS: Record<MarkerTag, string> = {
  [MarkerTag.MAIN]: "Main",
  [MarkerTag.MARKER]: "Marker",
  [MarkerTag.MAKER]: "Maker",
  [MarkerTag.FARM]: "Farm",
  [MarkerTag.PK]: "PK",
  [MarkerTag.SUPPORT]: "Support",
};

export const MARKER_TAG_COLORS: Record<MarkerTag, string> = {
  [MarkerTag.MAIN]: "#d4af37",
  [MarkerTag.MARKER]: "#3b82f6",
  [MarkerTag.MAKER]: "#22d3ee",
  [MarkerTag.FARM]: "#84cc16",
  [MarkerTag.PK]: "#ef4444",
  [MarkerTag.SUPPORT]: "#a855f7",
};
