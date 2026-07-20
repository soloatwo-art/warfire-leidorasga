import { GuildEventType } from "@warfire/shared";

export function describeGuildEvent(
  type: GuildEventType,
  characterName: string,
  payload: Record<string, unknown>,
): string {
  switch (type) {
    case GuildEventType.JOIN:
      return `${characterName} entrou na guild.`;
    case GuildEventType.LEAVE:
      return `${characterName} saiu da guild.`;
    case GuildEventType.ONLINE:
      return `${characterName} ficou online.`;
    case GuildEventType.OFFLINE:
      return `${characterName} ficou offline.`;
    case GuildEventType.LEVEL_UP:
      return `${characterName} subiu para o level ${payload.to ?? "?"}.`;
    case GuildEventType.PROMOTION:
      return `${characterName} foi promovido para ${payload.to ?? "?"}.`;
    case GuildEventType.DEMOTION:
      return `${characterName} foi rebaixado para ${payload.to ?? "?"}.`;
    case GuildEventType.TRANSFER:
      return `${characterName} transferiu de mundo.`;
    case GuildEventType.DEATH:
      return `${characterName} morreu.`;
    default:
      return `${characterName}: evento ${type}.`;
  }
}
