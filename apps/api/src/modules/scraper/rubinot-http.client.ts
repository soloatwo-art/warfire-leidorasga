import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { chromium, Browser } from "playwright";
import PQueue from "p-queue";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../../common/redis/redis.module";

/**
 * RubinOT's public site occasionally shows an automated security check
 * (Cloudflare-style) before serving content. We never attempt to solve or
 * bypass it — we just back off and retry later. If it persists, the caller
 * should treat the fetch as failed for this cycle.
 */
const SECURITY_CHECK_MARKER = "Verificação de Segurança";

// robots.txt disallows these prefixes — the client refuses to ever touch them
// directly. Note: /guilds/{name} and /characters?name= are allowed pages,
// but their data loads via internal client-side calls to /api/* once the
// page runs its own JavaScript. We never call /api ourselves; we only ever
// navigate to allowed page paths and let the page do what it already does
// for any normal visitor, then read the rendered result.
const DISALLOWED_PREFIXES = [
  "/admin",
  "/account",
  "/api",
  "/login",
  "/register",
  "/recover",
  "/tickets",
  "/_next",
  "/shop/checkout",
  "/shop/success",
];

const CACHE_TTL_SECONDS = 90;
const NAVIGATION_TIMEOUT_MS = 25_000;

@Injectable()
export class RubinotHttpClient implements OnModuleDestroy {
  private readonly logger = new Logger(RubinotHttpClient.name);
  private readonly queue = new PQueue({ concurrency: 1 });
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly minDelayMs: number;
  private lastRequestAt = 0;
  private browserPromise: Promise<Browser> | null = null;

  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.baseUrl = this.config.get<string>("rubinot.baseUrl")!;
    this.userAgent = this.config.get<string>("rubinot.userAgent")!;
    this.minDelayMs = this.config.get<number>("rubinot.minDelayMs")!;
  }

  async onModuleDestroy() {
    if (this.browserPromise) {
      const browser = await this.browserPromise;
      await browser.close().catch(() => undefined);
    }
  }

  /**
   * Loads a RubinOT page with a real (headless) browser — exactly like any
   * normal visitor would — with a shared single-flight queue (concurrency 1
   * + minimum delay between navigations) and a short Redis cache so bursts
   * of internal callers never hammer the site.
   */
  async getHtml(path: string, options?: { skipCache?: boolean }): Promise<string> {
    this.assertAllowedPath(path);

    const cacheKey = `rubinot:page:${path}`;
    if (!options?.skipCache) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached;
    }

    // p-queue's `.add()` types its result as `T | void` (a paused/cleared
    // queue could resolve without running the task) — we never pause this
    // queue, so the task's promise always settles with a string here.
    const html = (await this.queue.add(() => this.fetchWithThrottle(path))) as string;
    await this.redis.set(cacheKey, html, "EX", CACHE_TTL_SECONDS);
    return html;
  }

  private assertAllowedPath(path: string) {
    if (DISALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      throw new Error(`Recusando buscar caminho bloqueado pelo robots.txt: ${path}`);
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = chromium.launch({ headless: true });
    }
    return this.browserPromise;
  }

  private async fetchWithThrottle(path: string): Promise<string> {
    const waitMs = this.minDelayMs - (Date.now() - this.lastRequestAt);
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    const url = `${this.baseUrl}${path}`;
    this.logger.debug(`Carregando ${url} em navegador headless`);

    const browser = await this.getBrowser();
    const context = await browser.newContext({ userAgent: this.userAgent });
    const page = await context.newPage();

    try {
      // "networkidle" never fires here: the page keeps polling small
      // background endpoints (outfits, boosted creature, etc.) forever, so
      // there's never 500ms of true silence. Wait for DOM parse instead,
      // then give the client-side fetch (which populates the actual guild
      // /character data) a short fixed grace period to land and render.
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });

      if (response && response.status() >= 500) {
        throw new Error(`RubinOT retornou status ${response.status()} para ${path}`);
      }

      // The guild table has ~900+ rows and takes longer than a fixed grace
      // period to fetch+render for every page shape, so wait for an actual
      // table to show up (client-side fetch done) instead of a blind delay.
      // Pages with no table (e.g. "not found") just fall through after the
      // timeout — parsers handle empty content fine.
      await page.waitForSelector("table", { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      const html = await page.content();

      if (html.includes(SECURITY_CHECK_MARKER)) {
        this.logger.warn(
          `Verificação de segurança detectada em ${path}; nenhuma tentativa de burlar será feita, aguardando próximo ciclo.`,
        );
        throw new Error("Bloqueado por verificação de segurança do RubinOT");
      }

      return html;
    } finally {
      this.lastRequestAt = Date.now();
      await context.close().catch(() => undefined);
    }
  }
}
