import { Module } from "@nestjs/common";
import { RubinotHttpClient } from "./rubinot-http.client";
import { RubinotScraperService } from "./rubinot-scraper.service";

@Module({
  providers: [RubinotHttpClient, RubinotScraperService],
  exports: [RubinotScraperService],
})
export class ScraperModule {}
