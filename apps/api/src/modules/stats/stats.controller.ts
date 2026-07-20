import { Controller, Get, Param, Query } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { StatsPeriod } from "./period.util";

@Controller("stats")
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get("charts/vocations")
  vocations() {
    return this.stats.vocationBreakdown();
  }

  @Get("charts/worlds")
  worlds() {
    return this.stats.worldBreakdown();
  }

  @Get("charts/online-today")
  onlineToday() {
    return this.stats.onlineTimelineToday();
  }

  @Get("history/:period")
  history(@Param("period") period: "week" | "month") {
    return this.stats.history(period);
  }

  @Get("guild-power")
  guildPower() {
    return this.stats.guildPower();
  }

  @Get("hall-of-fame")
  hallOfFame() {
    return this.stats.hallOfFame();
  }

  @Get("inactivity-radar")
  inactivityRadar() {
    return this.stats.inactivityRadar();
  }

  @Get("leaderboard/:type")
  leaderboard(
    @Param("type") type: "level-gain" | "deaths" | "transfers" | "online-sessions" | "highest-level",
    @Query("period") period: StatsPeriod = "week",
  ) {
    switch (type) {
      case "level-gain":
        return this.stats.levelGainLeaderboard(period);
      case "deaths":
        return this.stats.deathsLeaderboard(period);
      case "transfers":
        return this.stats.transfersLeaderboard(period);
      case "online-sessions":
        return this.stats.mostOnlineSessionsLeaderboard(period);
      case "highest-level":
      default:
        return this.stats.highestLevelLeaderboard();
    }
  }
}
