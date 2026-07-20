import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ScraperModule } from "../scraper/scraper.module";
import { GuildSyncService } from "./guild-sync.service";
import { GuildScrapeScheduler } from "./guild-scrape.scheduler";
import { GuildController } from "./guild.controller";

@Module({
  imports: [ScheduleModule.forRoot(), ScraperModule],
  controllers: [GuildController],
  providers: [GuildSyncService, GuildScrapeScheduler],
  exports: [GuildSyncService, GuildScrapeScheduler],
})
export class GuildModule {}
