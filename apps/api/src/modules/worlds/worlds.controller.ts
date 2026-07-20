import { Controller, Get, Post } from "@nestjs/common";
import { WorldsService } from "./worlds.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@warfire/shared";

@Controller("worlds")
export class WorldsController {
  constructor(private readonly worldsService: WorldsService) {}

  @Get()
  async cards() {
    return this.worldsService.getWorldCards();
  }

  // Called by the NestJS internal cron when self-hosted, or by a Cloudflare
  // Worker Cron Trigger when the API runs in a Cloudflare Container (which
  // sleeps when idle, so it can't rely on its own in-process scheduler).
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Post("sync")
  async triggerSync() {
    await this.worldsService.syncWorlds();
    return { message: "Sincronização de mundos disparada." };
  }
}
