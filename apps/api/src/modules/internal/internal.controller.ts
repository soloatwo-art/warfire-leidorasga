import { Controller, Post, UseGuards } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { InternalTokenGuard } from "../../common/guards/internal-token.guard";
import { GuildScrapeScheduler } from "../guild/guild-scrape.scheduler";
import { WorldsScheduler } from "../worlds/worlds.scheduler";

/**
 * Endpoints for a trusted automated caller only (a Cloudflare Worker Cron
 * Trigger, in the Cloudflare Containers deployment) — never for browsers.
 * Gated by INTERNAL_SYNC_TOKEN (see InternalTokenGuard), not by user login.
 *
 * Why this exists: Cloudflare Containers sleep when idle, so the API's own
 * in-process cron (`@nestjs/schedule`, used for local/Docker/VPS deploys)
 * can't be trusted to fire on schedule there. A Workers Cron Trigger runs
 * independently of the container's sleep state and hits these routes to
 * wake it up and run a sync cycle.
 */
@Public()
@UseGuards(InternalTokenGuard)
@Controller("internal")
export class InternalController {
  constructor(
    private readonly guildScheduler: GuildScrapeScheduler,
    private readonly worldsScheduler: WorldsScheduler,
  ) {}

  @Post("sync/guild")
  async syncGuild() {
    await this.guildScheduler.runSync();
    return { message: "Guild sync (interno) concluído." };
  }

  @Post("sync/worlds")
  async syncWorlds() {
    await this.worldsScheduler.runSync();
    return { message: "Worlds sync (interno) concluído." };
  }
}
