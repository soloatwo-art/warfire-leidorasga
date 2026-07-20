import * as cheerio from "cheerio";
import {
  ParsedAlternateCharacter,
  ParsedCharacterPage,
  ParsedDeath,
} from "../dto/parsed-character.dto";
import { getPageSections } from "./page-sections.util";
import { parsePortugueseDateTime } from "./date.util";

/**
 * Parses https://rubinot.com.br/characters?name={name}.
 *
 * Note: RubinOT does not publish Magic Level or Skills anywhere on this
 * page (unlike classic Tibia-based servers), so those fields simply don't
 * exist in the parsed output.
 */
export function parseCharacterPage(html: string): ParsedCharacterPage | null {
  const $ = cheerio.load(html);
  const sections = getPageSections($);

  const infoSection = sections.find((s) => s.heading.includes("Informações do Personagem"));
  if (!infoSection) return null;

  const info = parseKeyValueTable($, infoSection.$section.find("table").first());
  const name = info.get("Nome:")?.text ?? "";
  if (!name) return null;

  const guildCell = info.get("Guilda:")?.$cell;
  let guildName: string | null = null;
  let guildRank: string | null = null;
  if (guildCell && guildCell.find("a").length > 0) {
    guildName = guildCell.find("a").first().text().trim();
    guildRank = guildCell.clone().find("a").remove().end().text().trim() || null;
  }

  const accountSection = sections.find((s) => s.heading.includes("Informações da Conta"));
  const accountInfo = accountSection
    ? parseKeyValueTable($, accountSection.$section.find("table").first())
    : new Map();

  const deathsSection = sections.find((s) => s.heading.includes("Mortes do Personagem"));
  const deaths = deathsSection ? parseDeaths($, deathsSection.$section.find("table").first()) : [];

  const altsSection = sections.find((s) => s.heading.includes("Personagens nesta Conta"));
  const alternateCharacters = altsSection
    ? parseAlternateCharacters($, altsSection.$section.find("table").first())
    : [];

  const levelText = info.get("Nível:")?.text ?? "";
  const achievementText = accountInfo.get("Pontos de Conquista:")?.text ?? "";

  return {
    name,
    previousNames: info.get("Nomes Anteriores:")?.text ?? null,
    sex: info.get("Sexo:")?.text ?? null,
    vocation: info.get("Vocação:")?.text ?? null,
    level: levelText ? parseInt(levelText, 10) : null,
    world: info.get("Mundo:")?.text ?? null,
    residence: info.get("Residência:")?.text ?? null,
    guildName,
    guildRank,
    lastLoginAt: parsePortugueseDateTime(info.get("Último Login:")?.text ?? ""),
    accountStatus: info.get("Status da Conta:")?.text ?? null,
    loyaltyTitle: accountInfo.get("Título de Lealdade:")?.text ?? null,
    achievementPoints: achievementText ? parseInt(achievementText, 10) : null,
    accountCreatedAt: parsePortugueseDateTime(accountInfo.get("Criado em:")?.text ?? ""),
    deaths,
    alternateCharacters,
  };
}

interface CellEntry {
  text: string;
  $cell: cheerio.Cheerio<any>;
}

function parseKeyValueTable(
  $: cheerio.CheerioAPI,
  $table: cheerio.Cheerio<any>,
): Map<string, CellEntry> {
  const map = new Map<string, CellEntry>();
  $table.find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const label = $(cells.get(0)).text().trim();
    const $cell = $(cells.get(1));
    if (label) map.set(label, { text: $cell.text().trim(), $cell });
  });
  return map;
}

function parseDeaths($: cheerio.CheerioAPI, $table: cheerio.Cheerio<any>): ParsedDeath[] {
  const deaths: ParsedDeath[] = [];

  $table.find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const dateText = $(cells.get(0)).text().trim();
    const occurredAt = parsePortugueseDateTime(dateText);
    if (!occurredAt) return;

    const descriptionHtml = $(cells.get(1)).html() ?? "";
    const levelMatch = descriptionHtml.match(/level\s*<span[^>]*>(\d+)<\/span>/i);
    const level = levelMatch?.[1] ? parseInt(levelMatch[1], 10) : 0;

    const afterPor = descriptionHtml.replace(/^[\s\S]*?\spor\s/i, "");
    const [killerHtml, mostDamageHtml] = afterPor.split(/\(maior dano por/i);

    const killer = textFromFragment($, killerHtml) || "desconhecido";
    const mostDamageBy = mostDamageHtml
      ? textFromFragment($, mostDamageHtml.replace(/\)\s*$/, ""))
      : null;

    deaths.push({ occurredAt, level, killer, mostDamageBy });
  });

  return deaths;
}

function parseAlternateCharacters(
  $: cheerio.CheerioAPI,
  $table: cheerio.Cheerio<any>,
): ParsedAlternateCharacter[] {
  const alternates: ParsedAlternateCharacter[] = [];

  $table.find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const nameCell = $(cells.get(0));
    const name = nameCell.find("a").first().text().trim() || nameCell.text().trim();
    const vocation = $(cells.get(1)).text().trim();
    const level = parseInt($(cells.get(2)).text().trim(), 10);
    const world = $(cells.get(3)).text().trim();

    if (name) {
      alternates.push({ name, vocation, level: Number.isNaN(level) ? 0 : level, world });
    }
  });

  return alternates;
}

function textFromFragment($: cheerio.CheerioAPI, fragmentHtml: string | undefined): string {
  if (!fragmentHtml) return "";
  return cheerio.load(fragmentHtml).root().text().trim();
}
