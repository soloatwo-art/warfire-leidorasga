import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GuildEventType, LeaderboardEntryDto } from "@warfire/shared";
import { getPeriodStart, StatsPeriod } from "./period.util";
import { computeActivity } from "../activity/activity.util";

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async vocationBreakdown() {
    const grouped = await this.prisma.guildMember.groupBy({
      by: ["vocation"],
      _count: { vocation: true },
    });
    return grouped.map((g) => ({ vocation: g.vocation, count: g._count.vocation }));
  }

  async worldBreakdown() {
    const grouped = await this.prisma.guildMember.groupBy({
      by: ["world"],
      _count: { world: true },
    });
    return grouped.map((g) => ({ world: g.world, count: g._count.world }));
  }

  async onlineTimelineToday() {
    const start = getPeriodStart("day");
    const snapshots = await this.prisma.guildSnapshot.findMany({
      where: { capturedAt: { gte: start } },
      orderBy: { capturedAt: "asc" },
    });

    const byHour = new Map<number, { sum: number; count: number }>();
    for (const snap of snapshots) {
      const hour = snap.capturedAt.getHours();
      const bucket = byHour.get(hour) ?? { sum: 0, count: 0 };
      bucket.sum += snap.onlineCount;
      bucket.count += 1;
      byHour.set(hour, bucket);
    }

    return Array.from({ length: 24 }, (_, hour) => {
      const bucket = byHour.get(hour);
      return { hour, onlineCount: bucket ? Math.round(bucket.sum / bucket.count) : 0 };
    });
  }

  async history(period: Extract<StatsPeriod, "week" | "month">) {
    const start = getPeriodStart(period);
    const snapshots = await this.prisma.guildSnapshot.findMany({
      where: { capturedAt: { gte: start } },
      orderBy: { capturedAt: "asc" },
    });

    const byDay = new Map<string, (typeof snapshots)[number]>();
    for (const snap of snapshots) {
      const dayKey = snap.capturedAt.toISOString().slice(0, 10);
      byDay.set(dayKey, snap); // last write per day wins -> end-of-day snapshot
    }

    return Array.from(byDay.entries()).map(([date, snap]) => ({
      date,
      memberCount: snap.memberCount,
      onlineCount: snap.onlineCount,
      averageLevel: Math.round(snap.avgLevel * 100) / 100,
      maxLevel: snap.maxLevel,
    }));
  }

  async levelGainLeaderboard(period: StatsPeriod, limit = 20): Promise<LeaderboardEntryDto[]> {
    const periodStart = getPeriodStart(period);
    const rows = await this.prisma.levelHistory.findMany({
      orderBy: [{ characterName: "asc" }, { recordedAt: "asc" }],
    });

    const byCharacter = new Map<string, { baseline: number; current: number }>();
    for (const row of rows) {
      const entry = byCharacter.get(row.characterName);
      if (!entry) {
        byCharacter.set(row.characterName, { baseline: row.level, current: row.level });
        continue;
      }
      entry.current = row.level;
      if (row.recordedAt <= periodStart) {
        entry.baseline = row.level;
      }
    }

    const memberInfo = await this.guildMemberInfoMap();

    return Array.from(byCharacter.entries())
      .map(([characterName, { baseline, current }]) => ({
        characterName,
        value: current - baseline,
        world: memberInfo.get(characterName)?.world ?? "",
        vocation: memberInfo.get(characterName)?.vocation ?? "",
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async deathsLeaderboard(period: StatsPeriod, limit = 20): Promise<LeaderboardEntryDto[]> {
    const periodStart = getPeriodStart(period);
    const grouped = await this.prisma.death.groupBy({
      by: ["characterName"],
      where: { occurredAt: { gte: periodStart } },
      _count: { characterName: true },
      orderBy: { _count: { characterName: "desc" } },
      take: limit,
    });

    const memberInfo = await this.guildMemberInfoMap();
    return grouped.map((g, i) => ({
      characterName: g.characterName,
      value: g._count.characterName,
      world: memberInfo.get(g.characterName)?.world ?? "",
      vocation: memberInfo.get(g.characterName)?.vocation ?? "",
      rank: i + 1,
    }));
  }

  async transfersLeaderboard(period: StatsPeriod, limit = 20): Promise<LeaderboardEntryDto[]> {
    const periodStart = getPeriodStart(period);
    const grouped = await this.prisma.transfer.groupBy({
      by: ["characterName"],
      where: { occurredAt: { gte: periodStart } },
      _count: { characterName: true },
      orderBy: { _count: { characterName: "desc" } },
      take: limit,
    });

    const memberInfo = await this.guildMemberInfoMap();
    return grouped.map((g, i) => ({
      characterName: g.characterName,
      value: g._count.characterName,
      world: memberInfo.get(g.characterName)?.world ?? "",
      vocation: memberInfo.get(g.characterName)?.vocation ?? "",
      rank: i + 1,
    }));
  }

  /**
   * Approximates "most time online" by counting ONLINE transition events in
   * the period. RubinOT doesn't expose session duration publicly, so this
   * counts login sessions rather than minutes played.
   */
  async mostOnlineSessionsLeaderboard(period: StatsPeriod, limit = 20): Promise<LeaderboardEntryDto[]> {
    const periodStart = getPeriodStart(period);
    const grouped = await this.prisma.guildEvent.groupBy({
      by: ["characterName"],
      where: { type: GuildEventType.ONLINE, occurredAt: { gte: periodStart } },
      _count: { characterName: true },
      orderBy: { _count: { characterName: "desc" } },
      take: limit,
    });

    const memberInfo = await this.guildMemberInfoMap();
    return grouped.map((g, i) => ({
      characterName: g.characterName,
      value: g._count.characterName,
      world: memberInfo.get(g.characterName)?.world ?? "",
      vocation: memberInfo.get(g.characterName)?.vocation ?? "",
      rank: i + 1,
    }));
  }

  async highestLevelLeaderboard(limit = 20): Promise<LeaderboardEntryDto[]> {
    const members = await this.prisma.guildMember.findMany({
      orderBy: { level: "desc" },
      take: limit,
    });
    return members.map((m, i) => ({
      characterName: m.characterName,
      value: m.level,
      world: m.world,
      vocation: m.vocation,
      rank: i + 1,
    }));
  }

  async guildPower() {
    const members = await this.prisma.guildMember.findMany();
    const totalLevels = members.reduce((sum, m) => sum + m.level, 0);
    const levelGainsThisMonth = await this.levelGainLeaderboard("month", 10000);
    const totalGainsThisMonth = levelGainsThisMonth.reduce((sum, r) => sum + r.value, 0);

    return {
      totalLevels,
      memberCount: members.length,
      totalLevelGainsThisMonth: totalGainsThisMonth,
    };
  }

  async hallOfFame() {
    const [highestLevel, oldestMembers, topGainsAllTime] = await Promise.all([
      this.highestLevelLeaderboard(5),
      this.prisma.guildMember.findMany({ orderBy: { joinDate: "asc" }, take: 5 }),
      this.levelGainLeaderboard("all", 5),
    ]);

    return {
      highestLevel,
      longestInGuild: oldestMembers.map((m, i) => ({
        characterName: m.characterName,
        value: Math.floor((Date.now() - m.joinDate.getTime()) / (1000 * 60 * 60 * 24)),
        world: m.world,
        vocation: m.vocation,
        rank: i + 1,
      })),
      topLevelGainsAllTime: topGainsAllTime,
    };
  }

  /** Members with no detected activity in the last 7+ days, most stale first. */
  async inactivityRadar(limit = 30) {
    const members = await this.prisma.guildMember.findMany();

    return members
      .map((m) => {
        const activity = computeActivity(m.lastSeenOnlineAt, m.lastLevelUpAt);
        return {
          characterName: m.characterName,
          world: m.world,
          vocation: m.vocation,
          level: m.level,
          activityLevel: activity.level,
          daysSinceLastActivity: activity.daysSinceLastActivity,
        };
      })
      .filter((m) => m.daysSinceLastActivity === null || m.daysSinceLastActivity >= 7)
      .sort((a, b) => (b.daysSinceLastActivity ?? 9999) - (a.daysSinceLastActivity ?? 9999))
      .slice(0, limit);
  }

  private async guildMemberInfoMap() {
    const members = await this.prisma.guildMember.findMany();
    return new Map(members.map((m) => [m.characterName, { world: m.world, vocation: m.vocation }]));
  }
}
