import type {
  ActivityLevel,
  GuildEventType,
  MarkerTag,
  NotificationType,
  UserRole,
  UserStatus,
} from "./enums";

export interface GuildOverviewDto {
  guildName: string;
  world: string;
  logoUrl: string | null;
  description: string | null;
  memberCount: number;
  onlineCount: number;
  offlineCount: number;
  averageLevel: number;
  maxLevel: number;
  lastMemberJoined: { name: string; joinDate: string } | null;
  lastMemberLeft: { name: string; occurredAt: string } | null;
  lastUpdatedAt: string;
}

export interface GuildMemberDto {
  characterName: string;
  rank: string;
  vocation: string;
  level: number;
  world: string;
  joinDate: string;
  online: boolean;
  lastSeenOnlineAt: string | null;
  lastLevelUpAt: string | null;
  markerTag: MarkerTag | null;
  isPrincipal: boolean;
  activityLevel: ActivityLevel;
}

export interface CharacterInputDto {
  name: string;
  world: string;
  markerTag: MarkerTag;
  isPrincipal?: boolean;
}

export interface RegisterUserDto {
  name: string;
  discordTag?: string;
  login: string;
  password: string;
  mainCharacterName: string;
  world: string;
  isMainMarker: boolean;
  secondaryCharacters: CharacterInputDto[];
}

export interface LoginDto {
  login: string;
  password: string;
}

export interface UserSummaryDto {
  id: string;
  name: string;
  login: string;
  discordTag: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface LeaderboardEntryDto {
  characterName: string;
  world: string;
  vocation: string;
  value: number;
  rank: number;
}

export interface GuildFeedEventDto {
  id: string;
  type: GuildEventType;
  characterName: string;
  message: string;
  occurredAt: string;
}

export interface WorldCardDto {
  world: string;
  onlineCount: number;
  guildMembersOnline: number;
  recentTransfers: { characterName: string; fromWorld: string; toWorld: string; occurredAt: string }[];
  recentDeaths: { characterName: string; level: number; killer: string; occurredAt: string }[];
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CharacterProfileDto {
  name: string;
  vocation: string | null;
  level: number | null;
  world: string;
  residence: string | null;
  guildName: string | null;
  guildRank: string | null;
  lastLoginAt: string | null;
  loyaltyTitle: string | null;
  achievementPoints: number | null;
  markerTag: MarkerTag;
  isPrincipal: boolean;
  activityLevel: ActivityLevel;
  levelHistory: { level: number; recordedAt: string }[];
  deaths: { level: number; killer: string; occurredAt: string }[];
  alternateCharacters: { name: string; vocation: string; level: number; world: string }[];
}

export interface AssistantQueryDto {
  question: string;
}

export interface AssistantAnswerDto {
  answer: string;
  data?: unknown;
}
