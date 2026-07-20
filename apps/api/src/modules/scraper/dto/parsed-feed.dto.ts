export interface ParsedTransfer {
  characterName: string;
  level: number;
  fromWorld: string;
  toWorld: string;
  occurredAt: Date;
}

export interface ParsedGlobalDeath {
  characterName: string;
  level: number;
  killer: string;
  mostDamageBy: string | null;
  world: string;
  occurredAt: Date;
}
