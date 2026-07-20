import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { RubinotScraperService } from "../scraper/rubinot-scraper.service";
import { GuildSyncService } from "./guild-sync.service";

@Injectable()
export class GuildScrapeScheduler implements OnModuleInit {
  private readonly logger = new Logger(GuildScrapeScheduler.name);
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly scheduler: SchedulerRegistry,
    private readonly scraper: RubinotScraperService,
    private readonly guildSync: GuildSyncService,
  ) {}

  onModuleInit() {
    const cronExpression = this.config.get<string>("rubinot.guildScrapeCron")!;
    const job = new CronJob(cronExpression, () => this.runSync());
    this.scheduler.addCronJob("guild-scrape", job);
    job.start();
    this.logger.log(`Scraper da guild agendado com cron "${cronExpression}".`);

    // Run once on boot so the dashboard has data immediately, instead of
    // waiting for the first cron tick.
    void this.runSync();
  }

  async runSync() {
    if (this.running) {
      this.logger.warn("Sync anterior ainda em execução, pulando este ciclo.");
      return;
    }

    this.running = true;
    try {
      const parsed = await this.scraper.fetchGuildPage();
      if (parsed) {
        await this.guildSync.syncGuildSnapshot(parsed);
      }
    } catch (error) {
      this.logger.error(`Erro no ciclo de sync da guild: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
