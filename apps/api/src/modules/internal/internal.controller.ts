import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { InternalTokenGuard } from "../../common/guards/internal-token.guard";
import { GuildScrapeScheduler } from "../guild/guild-scrape.scheduler";
import { GuildSyncService } from "../guild/guild-sync.service";
import { WorldsScheduler } from "../worlds/worlds.scheduler";
import { IngestHtmlDto } from "./dto/ingest-html.dto";
import { parseGuildPage } from "../scraper/parsers/guild-page.parser";

/**
 * Endpoints for a trusted automated caller only — never for regular user
 * sessions. Gated by INTERNAL_SYNC_TOKEN (see InternalTokenGuard), not by
 * user login.
 *
 * Two different automated callers use this controller:
 *  - A Cloudflare Worker Cron Trigger (Containers deployment), which wakes
 *    the sleeping container and asks it to run its own Playwright scrape.
 *  - The rubinot-guild-sync userscript (Tampermonkey), running in an admin's
 *    own real, already-authenticated browser tab. RubinOT's Cloudflare bot
 *    management blocks our server-side headless browser outright, but never
 *    challenges a real human browsing normally — so the userscript grabs the
 *    already-rendered page HTML and posts it here instead of us fetching it
 *    ourselves. See scripts/rubinot-guild-sync.user.js.
 */
@Public()
@UseGuards(InternalTokenGuard)
@Controller("internal")
export class InternalController {
  constructor(
    private readonly guildScheduler: GuildScrapeScheduler,
    private readonly worldsScheduler: WorldsScheduler,
    private readonly guildSync: GuildSyncService,
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

  @Post("ingest/guild-html")
  async ingestGuildHtml(@Body() dto: IngestHtmlDto) {
    const parsed = parseGuildPage(dto.html);
    if (!parsed) {
      return { message: "HTML recebido não parece ser uma página de guild válida.", members: 0 };
    }

    await this.guildSync.syncGuildSnapshot(parsed);
    return { message: "Guild sync via userscript concluído.", members: parsed.members.length };
  }
}
