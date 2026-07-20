export interface ParsedDeath {
  occurredAt: Date;
  level: number;
  killer: string;
  mostDamageBy: string | null;
}

export interface ParsedAlternateCharacter {
  name: string;
  vocation: string;
  level: number;
  world: string;
}

export interface ParsedCharacterPage {
  name: string;
  previousNames: string | null;
  sex: string | null;
  vocation: string | null;
  level: number | null;
  world: string | null;
  residence: string | null;
  guildName: string | null;
  guildRank: string | null;
  lastLoginAt: Date | null;
  accountStatus: string | null;
  loyaltyTitle: string | null;
  achievementPoints: number | null;
  accountCreatedAt: Date | null;
  deaths: ParsedDeath[];
  alternateCharacters: ParsedAlternateCharacter[];
}
