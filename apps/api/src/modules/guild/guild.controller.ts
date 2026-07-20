import { Controller, Get, Post, Query } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  GuildEventType,
  GuildFeedEventDto,
  GuildMemberDto,
  GuildOverviewDto,
  MarkerTag,
  UserRole,
} from "@warfire/shared";
import { computeActivity } from "../activity/activity.util";
import { Roles } from "../../common/decorators/roles.decorator";
import { GuildScrapeScheduler } from "./guild-scrape.scheduler";
import { describeGuildEvent } from "./guild-event-message.util";

@Controller("guild")
export class GuildController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: GuildScrapeScheduler,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Post("sync")
  async triggerSync() {
    await this.scheduler.runSync();
    return { message: "Sincronização manual disparada." };
  }

  @Get("overview")
  async overview(): Promise<GuildOverviewDto> {
    const members = await this.prisma.guildMember.findMany();
    const memberCount = members.length;
    const onlineCount = members.filter((m) => m.online).length;
    const totalLevel = members.reduce((sum, m) => sum + m.level, 0);
    const maxLevel = members.reduce((max, m) => Math.max(max, m.level), 0);

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
    const [latestSnapshot] = await this.prisma.guildSnapshot.findMany({
      orderBy: { capturedAt: "desc" },
      take: 1,
    });

    return {
      guildName: latestSnapshot?.guildName ?? "Warfire Leidorasga",
      world: latestSnapshot?.world ?? members[0]?.world ?? "Grimoria III",
      logoUrl: latestSnapshot?.logoUrl ?? null,
      description: latestSnapshot?.description ?? null,
      memberCount,
      onlineCount,
      offlineCount: memberCount - onlineCount,
      averageLevel: memberCount > 0 ? Math.round((totalLevel / memberCount) * 100) / 100 : 0,
      maxLevel,
      lastMemberJoined: lastJoin
        ? { name: lastJoin.characterName, joinDate: lastJoin.occurredAt.toISOString() }
        : null,
      lastMemberLeft: lastLeave
        ? { name: lastLeave.characterName, occurredAt: lastLeave.occurredAt.toISOString() }
        : null,
      lastUpdatedAt: (latestSnapshot?.capturedAt ?? new Date()).toISOString(),
    };
  }

  @Get("feed")
  async feed(@Query("limit") limit?: string): Promise<GuildFeedEventDto[]> {
    const events = await this.prisma.guildEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: limit ? parseInt(limit, 10) : 50,
    });

    return events.map((e) => ({
      id: e.id,
      type: e.type as GuildEventType,
      characterName: e.characterName,
      message: describeGuildEvent(e.type as GuildEventType, e.characterName, e.payload as Record<string, unknown>),
      occurredAt: e.occurredAt.toISOString(),
    }));
  }

  @Get("members")
  async members(): Promise<GuildMemberDto[]> {
    const [members, characters] = await Promise.all([
      this.prisma.guildMember.findMany({ orderBy: { level: "desc" } }),
      this.prisma.character.findMany(),
    ]);
    const characterByName = new Map(characters.map((c) => [c.name, c]));

    return members.map((m) => {
      const character = characterByName.get(m.characterName);
      const activity = computeActivity(m.lastSeenOnlineAt, m.lastLevelUpAt);

      return {
        characterName: m.characterName,
        rank: m.rank,
        vocation: m.vocation,
        level: m.level,
        world: m.world,
        joinDate: m.joinDate.toISOString(),
        online: m.online,
        lastSeenOnlineAt: m.lastSeenOnlineAt?.toISOString() ?? null,
        lastLevelUpAt: m.lastLevelUpAt?.toISOString() ?? null,
        markerTag: (character?.markerTag as MarkerTag | undefined) ?? null,
        isPrincipal: character?.isPrincipal ?? false,
        activityLevel: activity.level,
      };
    });
  }
}
