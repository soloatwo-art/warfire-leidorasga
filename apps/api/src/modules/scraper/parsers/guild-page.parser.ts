import * as cheerio from "cheerio";
import { ParsedGuildMember, ParsedGuildPage } from "../dto/parsed-guild.dto";
import { parseEnglishShortDate } from "./date.util";

/**
 * Parses https://rubinot.com.br/guilds/{name}.
 *
 * The site has no public API, so this reads the rendered HTML directly.
 * Selectors are anchored on stable text labels ("Members", "Guild Hall",
 * "Description") and table column order rather than the site's hashed
 * CSS-module class names, which can change between deploys.
 */
export function parseGuildPage(html: string): ParsedGuildPage | null {
  const $ = cheerio.load(html);

  if ($("body").text().includes("Guild not found") || $("body").text().includes("Guild Not Found")) {
    return null;
  }

  const logoUrl = $("img[alt]").first().attr("src") ?? null;
  const guildName = $("h2.font-bold").first().text().trim();

  const infoLine = findTextStartingWith($, "p", "World:");
  const worldMatch = infoLine?.match(/World:\s*([^|]+)\s*\|\s*Founded:\s*(.+)/);
  const world = worldMatch?.[1]?.trim() ?? "";
  const foundedAt = worldMatch?.[2] ? new Date(worldMatch[2].trim()) : null;

  const description = findLabelValue($, "Description") ?? "";
  const memberCountText = findLabelValue($, "Members") ?? "0";
  const guildHallName = findLabelFirstLine($, "Guild Hall");
  const guildHallCity = findLabelSecondLine($, "Guild Hall");

  const members: ParsedGuildMember[] = [];
  let currentRank = "";

  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const rankText = $(cells.get(0)).text().trim();
    if (rankText) currentRank = rankText;

    const nameCell = $(cells.get(1));
    const characterName = nameCell.find("a").first().text().trim();
    if (!characterName) return;

    const titleRaw = nameCell
      .find("span")
      .filter((_i, el) => /^\(.*\)$/.test($(el).text().trim()))
      .first()
      .text()
      .trim();
    const title = titleRaw ? titleRaw.replace(/^\(|\)$/g, "") : null;

    const vocation = $(cells.get(2)).text().trim();
    const level = parseInt($(cells.get(3)).text().trim(), 10);
    const joinDateRaw = $(cells.get(4)).text().trim();
    const joinDate = parseEnglishShortDate(joinDateRaw) ?? new Date(0);
    const statusSpan = $(cells.get(5)).find("span").first();
    const online = statusSpan.hasClass("text-green-500");

    members.push({
      rank: currentRank,
      characterName,
      title,
      vocation,
      level: Number.isNaN(level) ? 0 : level,
      joinDate,
      online,
    });
  });

  return {
    guildName,
    world,
    foundedAt,
    description,
    logoUrl,
    guildHallName,
    guildHallCity,
    memberCount: parseInt(memberCountText.replace(/\D/g, ""), 10) || members.length,
    members,
  };
}

function findTextStartingWith(
  $: cheerio.CheerioAPI,
  selector: string,
  prefix: string,
): string | undefined {
  let found: string | undefined;
  $(selector).each((_, el) => {
    const text = $(el).text().trim();
    if (!found && text.startsWith(prefix)) found = text;
  });
  return found;
}

/** Finds `<p>Label</p>` followed by a sibling holding the value, anywhere in the tree. */
function findLabelValue($: cheerio.CheerioAPI, label: string): string | null {
  let value: string | null = null;
  $("p").each((_, el) => {
    if (value !== null) return;
    if ($(el).text().trim() === label) {
      const sibling = $(el).next();
      value = sibling.text().trim();
    }
  });
  return value;
}

function findLabelFirstLine($: cheerio.CheerioAPI, label: string): string | null {
  let value: string | null = null;
  $("p").each((_, el) => {
    if (value !== null) return;
    if ($(el).text().trim() === label) {
      const sibling = $(el).next();
      value = sibling.find("p").first().text().trim() || sibling.text().trim();
    }
  });
  return value;
}

function findLabelSecondLine($: cheerio.CheerioAPI, label: string): string | null {
  let value: string | null = null;
  $("p").each((_, el) => {
    if (value !== null) return;
    if ($(el).text().trim() === label) {
      const sibling = $(el).next();
      const secondP = sibling.find("p").eq(1);
      value = secondP.length ? secondP.text().trim() : null;
    }
  });
  return value;
}
