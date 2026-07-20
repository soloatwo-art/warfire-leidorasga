import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RubinotScraperService } from "../scraper/rubinot-scraper.service";
import { WorldCardDto } from "@warfire/shared";

@Injectable()
export class WorldsService {
  private readonly logger = new Logger(WorldsService.name);
  private readonly monitoredWorlds: string[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraper: RubinotScraperService,
    private readonly config: ConfigService,
  ) {
    this.monitoredWorlds = this.config.get<string[]>("rubinot.monitoredWorlds")!;
  }

  async syncWorlds(): Promise<void> {
    const [worlds, transfers, deaths] = await Promise.all([
      this.scraper.fetchWorlds(),
      this.scraper.fetchRecentTransfers(),
      this.scraper.fetchRecentDeaths(),
    ]);

    if (worlds.length > 0) {
      await this.prisma.worldSnapshot.createMany({
        data: worlds.map((w) => ({ world: w.name, onlineCount: w.onlineCount })),
      });
    }

    if (transfers.length > 0) {
      await this.prisma.transfer.createMany({
        data: transfers.map((t) => ({
          characterName: t.characterName,
          fromWorld: t.fromWorld,
          toWorld: t.toWorld,
          occurredAt: t.occurredAt,
        })),
        skipDuplicates: true,
      });
    }

    if (deaths.length > 0) {
      await this.prisma.death.createMany({
        data: deaths.map((d) => ({
          characterName: d.characterName,
          level: d.level,
          killer: d.killer,
          mostDamageBy: d.mostDamageBy,
          world: d.world,
          occurredAt: d.occurredAt,
        })),
        skipDuplicates: true,
      });
    }

    this.logger.log(
      `Sync de mundos concluído: ${worlds.length} mundos, ${transfers.length} transfers, ${deaths.length} mortes.`,
    );
  }

  async getWorldCards(): Promise<WorldCardDto[]> {
    return Promise.all(this.monitoredWorlds.map((world) => this.buildWorldCard(world)));
  }

  private async buildWorldCard(world: string): Promise<WorldCardDto> {
    const [latestSnapshot, guildMembersOnline, recentTransfers, recentDeaths] = await Promise.all([
      this.prisma.worldSnapshot.findFirst({
        where: { world },
        orderBy: { capturedAt: "desc" },
      }),
      this.prisma.guildMember.count({ where: { world, online: true } }),
      this.prisma.transfer.findMany({
        where: { toWorld: world },
        orderBy: { occurredAt: "desc" },
        take: 10,
      }),
      this.prisma.death.findMany({
        where: { world },
        orderBy: { occurredAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      world,
      onlineCount: latestSnapshot?.onlineCount ?? 0,
      guildMembersOnline,
      recentTransfers: recentTransfers.map((t) => ({
        characterName: t.characterName,
        fromWorld: t.fromWorld,
        toWorld: t.toWorld,
        occurredAt: t.occurredAt.toISOString(),
      })),
      recentDeaths: recentDeaths.map((d) => ({
        characterName: d.characterName,
        level: d.level,
        killer: d.killer,
        occurredAt: d.occurredAt.toISOString(),
      })),
    };
  }
}
