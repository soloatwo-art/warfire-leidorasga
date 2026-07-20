import * as cheerio from "cheerio";
import { ParsedGlobalDeath } from "../dto/parsed-feed.dto";
import { parseEnglishDateTime } from "./date.util";

/** Parses the default (unfiltered) https://rubinot.com.br/deaths listing. */
export function parseDeathsPage(html: string): ParsedGlobalDeath[] {
  const $ = cheerio.load(html);
  const deaths: ParsedGlobalDeath[] = [];

  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const occurredAt = parseEnglishDateTime($(cells.get(0)).text().trim());
    const world = $(cells.get(1)).text().trim();
    const descriptionCell = $(cells.get(2));

    const characterName = descriptionCell.find("a").first().text().trim();
    const levelMatch = (descriptionCell.html() ?? "").match(/level\s*<strong>(\d+)<\/strong>/i);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : 0;

    const afterPor = (descriptionCell.html() ?? "").replace(/^[\s\S]*?\spor\s/i, "");
    const [killerHtml, mostDamageHtml] = afterPor.split(/\(maior dano por/i);
    const killer = textFromFragment($, killerHtml.replace(/\)?\.?\s*$/, "")) || "desconhecido";
    const mostDamageBy = mostDamageHtml
      ? textFromFragment($, mostDamageHtml.replace(/\)\.?\s*$/, ""))
      : null;

    if (characterName && occurredAt) {
      deaths.push({ characterName, level, killer, mostDamageBy, world, occurredAt });
    }
  });

  return deaths;
}

function textFromFragment($: cheerio.CheerioAPI, fragmentHtml: string | undefined): string {
  if (!fragmentHtml) return "";
  return cheerio.load(fragmentHtml).root().text().trim();
}
