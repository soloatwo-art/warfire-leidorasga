import * as cheerio from "cheerio";
import { ParsedWorld } from "../dto/parsed-world.dto";

/** Parses https://rubinot.com.br/worlds. */
export function parseWorldsPage(html: string): ParsedWorld[] {
  const $ = cheerio.load(html);
  const worlds: ParsedWorld[] = [];

  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const name = $(cells.get(0)).find("a").first().text().trim();
    const onlineText = $(cells.get(1)).text().trim();
    const onlineCount = parseInt(onlineText.replace(/\D/g, ""), 10);

    if (name) {
      worlds.push({ name, onlineCount: Number.isNaN(onlineCount) ? 0 : onlineCount });
    }
  });

  return worlds;
}
