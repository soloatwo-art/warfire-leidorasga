export interface ParsedGuildMember {
  rank: string;
  characterName: string;
  title: string | null;
  vocation: string;
  level: number;
  joinDate: Date;
  online: boolean;
}

export interface ParsedGuildPage {
  guildName: string;
  world: string;
  foundedAt: Date | null;
  description: string;
  logoUrl: string | null;
  guildHallName: string | null;
  guildHallCity: string | null;
  memberCount: number;
  members: ParsedGuildMember[];
}
