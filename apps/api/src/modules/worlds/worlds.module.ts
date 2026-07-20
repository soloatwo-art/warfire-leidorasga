import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ScraperModule } from "../scraper/scraper.module";
import { WorldsService } from "./worlds.service";
import { WorldsScheduler } from "./worlds.scheduler";
import { WorldsController } from "./worlds.controller";

@Module({
  imports: [ScheduleModule.forRoot(), ScraperModule],
  controllers: [WorldsController],
  providers: [WorldsService, WorldsScheduler],
  exports: [WorldsService, WorldsScheduler],
})
export class WorldsModule {}
