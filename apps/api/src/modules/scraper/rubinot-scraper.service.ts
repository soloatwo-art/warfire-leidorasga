import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RubinotHttpClient } from "./rubinot-http.client";
import { parseGuildPage } from "./parsers/guild-page.parser";
import { parseCharacterPage } from "./parsers/character-page.parser";
import { parseWorldsPage } from "./parsers/worlds-page.parser";
import { parseTransfersPage } from "./parsers/transfers-page.parser";
import { parseDeathsPage } from "./parsers/deaths-page.parser";
import { ParsedGuildPage } from "./dto/parsed-guild.dto";
import { ParsedCharacterPage } from "./dto/parsed-character.dto";
import { ParsedWorld } from "./dto/parsed-world.dto";
import { ParsedGlobalDeath, ParsedTransfer } from "./dto/parsed-feed.dto";

@Injectable()
export class RubinotScraperService {
  private readonly logger = new Logger(RubinotScraperService.name);
  private readonly guildName: string;

  constructor(
    private readonly http: RubinotHttpClient,
    private readonly config: ConfigService,
  ) {
    this.guildName = this.config.get<string>("rubinot.guildName")!;
  }

  async fetchGuildPage(guildName = this.guildName): Promise<ParsedGuildPage | null> {
    try {
      const html = await this.http.getHtml(`/guilds/${encodeURIComponent(guildName)}`, {
        skipCache: true,
      });
      const parsed = parseGuildPage(html);
      if (!parsed) {
        this.logger.warn(`Guild "${guildName}" não encontrada no RubinOT.`);
      }
      return parsed;
    } catch (error) {
      this.logger.error(`Falha ao buscar página da guild: ${(error as Error).message}`);
      return null;
    }
  }

  async fetchCharacterPage(characterName: string): Promise<ParsedCharacterPage | null> {
    try {
      const html = await this.http.getHtml(
        `/characters?name=${encodeURIComponent(characterName)}`,
      );
      return parseCharacterPage(html);
    } catch (error) {
      this.logger.error(
        `Falha ao buscar personagem "${characterName}": ${(error as Error).message}`,
      );
      return null;
    }
  }

  async fetchWorlds(): Promise<ParsedWorld[]> {
    try {
      const html = await this.http.getHtml("/worlds");
      return parseWorldsPage(html);
    } catch (error) {
      this.logger.error(`Falha ao buscar lista de mundos: ${(error as Error).message}`);
      return [];
    }
  }

  async fetchRecentTransfers(): Promise<ParsedTransfer[]> {
    try {
      const html = await this.http.getHtml("/transfers");
      return parseTransfersPage(html);
    } catch (error) {
      this.logger.error(`Falha ao buscar transferências recentes: ${(error as Error).message}`);
      return [];
    }
  }

  async fetchRecentDeaths(): Promise<ParsedGlobalDeath[]> {
    try {
      const html = await this.http.getHtml("/deaths");
      return parseDeathsPage(html);
    } catch (error) {
      this.logger.error(`Falha ao buscar mortes recentes: ${(error as Error).message}`);
      return [];
    }
  }
}
