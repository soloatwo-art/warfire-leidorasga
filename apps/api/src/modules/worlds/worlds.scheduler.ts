import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { WorldsService } from "./worlds.service";

@Injectable()
export class WorldsScheduler implements OnModuleInit {
  private readonly logger = new Logger(WorldsScheduler.name);
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly scheduler: SchedulerRegistry,
    private readonly worldsService: WorldsService,
  ) {}

  onModuleInit() {
    const cronExpression = this.config.get<string>("rubinot.worldScrapeCron")!;
    const job = new CronJob(cronExpression, () => this.runSync());
    this.scheduler.addCronJob("worlds-scrape", job);
    job.start();
    this.logger.log(`Scraper de mundos agendado com cron "${cronExpression}".`);

    void this.runSync();
  }

  async runSync() {
    if (this.running) return;
    this.running = true;
    try {
      await this.worldsService.syncWorlds();
    } catch (error) {
      this.logger.error(`Erro no ciclo de sync de mundos: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
