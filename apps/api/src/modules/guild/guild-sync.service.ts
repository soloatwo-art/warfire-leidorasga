import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { ParsedGuildPage, ParsedGuildMember } from "../scraper/dto/parsed-guild.dto";
import { GuildEventType, NotificationType } from "@warfire/shared";
import { isPromotion } from "./rank-order.util";

interface PendingEvent {
  type: GuildEventType;
  characterName: string;
  payload: Record<string, unknown>;
}

interface PendingNotification {
  type: NotificationType;
  message: string;
}

@Injectable()
export class GuildSyncService {
  private readonly logger = new Logger(GuildSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async syncGuildSnapshot(parsed: ParsedGuildPage): Promise<void> {
    const existing = await this.prisma.guildMember.findMany();
    const existingByName = new Map(existing.map((m) => [m.characterName, m]));
    const stillPresent = new Set<string>();

    const events: PendingEvent[] = [];
    const notifications: PendingNotification[] = [];

    for (const parsedMember of parsed.members) {
      stillPresent.add(parsedMember.characterName);
      const current = existingByName.get(parsedMember.characterName);

      if (!current) {
        await this.handleNewMember(parsedMember, events, notifications);
        continue;
      }

      await this.handleExistingMember(current, parsedMember, events, notifications);
    }

    for (const [name, member] of existingByName) {
      if (stillPresent.has(name)) continue;
      events.push({
        type: GuildEventType.LEAVE,
        characterName: name,
        payload: { rank: member.rank },
      });
      notifications.push({
        type: NotificationType.MEMBER_LEFT,
        message: `${name} saiu da guild.`,
      });
      await this.prisma.guildMember.delete({ where: { characterName: name } });
    }

    if (events.length > 0) {
      await this.prisma.guildEvent.createMany({
        data: events.map((e) => ({ type: e.type, characterName: e.characterName, payload: e.payload })),
      });
      for (const event of events) {
        this.realtime.emitGuildEvent({ ...event, occurredAt: new Date().toISOString() });
      }
    }

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({
        data: notifications.map((n) => ({ type: n.type, message: n.message })),
      });
      for (const notification of notifications) {
        this.realtime.emitNotification({ ...notification, createdAt: new Date().toISOString() });
      }
    }

    const overview = await this.persistSnapshotAndOverview(parsed);
    this.realtime.emitOverviewUpdated(overview);

    this.logger.log(
      `Sync concluído: ${parsed.members.length} membros, ${events.length} eventos.`,
    );
  }

  private async handleNewMember(
    parsedMember: ParsedGuildMember,
    events: PendingEvent[],
    notifications: PendingNotification[],
  ) {
    await this.prisma.guildMember.create({
      data: {
        characterName: parsedMember.characterName,
        rank: parsedMember.rank,
        vocation: parsedMember.vocation,
        level: parsedMember.level,
        world: "", // filled in by caller via parsed.world at snapshot time
        joinDate: parsedMember.joinDate,
        online: parsedMember.online,
        lastSeenOnlineAt: parsedMember.online ? new Date() : null,
      },
    });

    events.push({
      type: GuildEventType.JOIN,
      characterName: parsedMember.characterName,
      payload: { rank: parsedMember.rank, level: parsedMember.level },
    });
    notifications.push({
      type: NotificationType.NEW_MEMBER,
      message: `${parsedMember.characterName} entrou na guild.`,
    });

    await this.prisma.levelHistory.create({
      data: { characterName: parsedMember.characterName, level: parsedMember.level },
    });
  }

  private async handleExistingMember(
    current: { characterName: string; rank: string; vocation: string; level: number; world: string; online: boolean },
    parsedMember: ParsedGuildMember,
    events: PendingEvent[],
    notifications: PendingNotification[],
  ) {
    const updates: Record<string, unknown> = {};

    if (current.online !== parsedMember.online) {
      events.push({
        type: parsedMember.online ? GuildEventType.ONLINE : GuildEventType.OFFLINE,
        characterName: parsedMember.characterName,
        payload: {},
      });
      updates.online = parsedMember.online;
      if (parsedMember.online) updates.lastSeenOnlineAt = new Date();
    }

    if (parsedMember.level > current.level) {
      events.push({
        type: GuildEventType.LEVEL_UP,
        characterName: parsedMember.characterName,
        payload: { from: current.level, to: parsedMember.level },
      });
      notifications.push({
        type: NotificationType.LEVEL_UP,
        message: `${parsedMember.characterName} subiu para o level ${parsedMember.level}.`,
      });
      updates.level = parsedMember.level;
      updates.lastLevelUpAt = new Date();
      await this.prisma.levelHistory.create({
        data: { characterName: parsedMember.characterName, level: parsedMember.level },
      });
    } else if (parsedMember.level !== current.level) {
      updates.level = parsedMember.level;
    }

    if (current.rank !== parsedMember.rank) {
      const promoted = isPromotion(current.rank, parsedMember.rank);
      events.push({
        type: promoted ? GuildEventType.PROMOTION : GuildEventType.DEMOTION,
        characterName: parsedMember.characterName,
        payload: { from: current.rank, to: parsedMember.rank },
      });
      notifications.push({
        type: NotificationType.RANK_CHANGE,
        message: promoted
          ? `${parsedMember.characterName} foi promovido para ${parsedMember.rank}.`
          : `${parsedMember.characterName} foi rebaixado para ${parsedMember.rank}.`,
      });
      updates.rank = parsedMember.rank;
    }

    if (current.vocation !== parsedMember.vocation) {
      updates.vocation = parsedMember.vocation;
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.guildMember.update({
        where: { characterName: parsedMember.characterName },
        data: updates,
      });
    }
  }

  private async persistSnapshotAndOverview(parsed: ParsedGuildPage) {
    // Backfill world on every member row (the guild page only reports a
    // single world for the whole guild; per-member world only diverges via
    // the character-detail sync queue, which owns Character.world instead).
    await this.prisma.guildMember.updateMany({
      where: { world: "" },
      data: { world: parsed.world },
    });

    const memberCount = parsed.members.length;
    const onlineCount = parsed.members.filter((m) => m.online).length;
    const totalLevel = parsed.members.reduce((sum, m) => sum + m.level, 0);
    const maxLevel = parsed.members.reduce((max, m) => Math.max(max, m.level), 0);
    const averageLevel = memberCount > 0 ? totalLevel / memberCount : 0;

    await this.prisma.guildSnapshot.create({
      data: {
        guildName: parsed.guildName,
        world: parsed.world,
        logoUrl: parsed.logoUrl,
        description: parsed.description,
        memberCount,
        onlineCount,
        avgLevel: averageLevel,
        maxLevel,
        raw: parsed.members as unknown as object,
      },
    });

    const [lastJoin] = await this.prisma.guildEvent.findMany({
      where: { type: GuildEventType.JOIN },
      orderBy: { occurredAt: "desc" },
      take: 1,
    });
    const [lastLeave] = await this.prisma.guildEvent.findMany({
      where: { type: GuildEventType.LEAVE },
      orderBy: { occurredAt: "desc" },
      take: 1,
    });

    return {
      guildName: parsed.guildName,
      world: parsed.world,
      memberCount,
      onlineCount,
      offlineCount: memberCount - onlineCount,
      averageLevel: Math.round(averageLevel * 100) / 100,
      maxLevel,
      lastMemberJoined: lastJoin
        ? { name: lastJoin.characterName, joinDate: lastJoin.occurredAt.toISOString() }
        : null,
      lastMemberLeft: lastLeave
        ? { name: lastLeave.characterName, occurredAt: lastLeave.occurredAt.toISOString() }
        : null,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}
