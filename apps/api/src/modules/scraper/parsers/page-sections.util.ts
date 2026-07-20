import * as cheerio from "cheerio";

export interface PageSection {
  heading: string;
  $section: cheerio.Cheerio<any>;
}

/**
 * RubinOT renders every content block on `/guilds` and `/characters` pages as
 * a `PageHeader` (with an `<h2>` title) followed by a `PageBody` containing
 * the actual table/content. The wrapper class names are hashed CSS-module
 * identifiers that can change between deploys, so we walk the section
 * structure by position instead of relying on those class names.
 */
export function getPageSections($: cheerio.CheerioAPI): PageSection[] {
  const root = $("main > div").first();
  const sections: PageSection[] = [];

  root.children().each((_, el) => {
    const $section = $(el);
    const heading = $section.find("h2").first().text().trim();
    sections.push({ heading, $section });
  });

  return sections;
}

export function findSection(sections: PageSection[], predicate: (heading: string) => boolean) {
  return sections.find((s) => predicate(s.heading));
}
