import { Module } from "@nestjs/common";
import { ScraperModule } from "../scraper/scraper.module";
import { CharactersService } from "./characters.service";
import { CharactersController } from "./characters.controller";

@Module({
  imports: [ScraperModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
