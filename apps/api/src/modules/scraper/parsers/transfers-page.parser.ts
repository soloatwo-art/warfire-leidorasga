import * as cheerio from "cheerio";
import { ParsedTransfer } from "../dto/parsed-feed.dto";
import { parseSlashDateTime } from "./date.util";

/** Parses the default (unfiltered) https://rubinot.com.br/transfers listing. */
export function parseTransfersPage(html: string): ParsedTransfer[] {
  const $ = cheerio.load(html);
  const transfers: ParsedTransfer[] = [];

  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const occurredAt = parseSlashDateTime($(cells.get(0)).text().trim());
    const characterName = $(cells.get(1)).find("a").first().text().trim();
    const level = parseInt($(cells.get(2)).text().trim(), 10);
    const fromWorld = $(cells.get(3)).text().trim();
    const toWorld = $(cells.get(5)).text().trim();

    if (characterName && occurredAt) {
      transfers.push({
        characterName,
        level: Number.isNaN(level) ? 0 : level,
        fromWorld,
        toWorld,
        occurredAt,
      });
    }
  });

  return transfers;
}
