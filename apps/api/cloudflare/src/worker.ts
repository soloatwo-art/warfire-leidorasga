import { Container, getContainer } from "@cloudflare/containers";

/**
 * Durable Object wrapping the NestJS API container. `@cloudflare/containers`
 * proxies whatever the Worker forwards to it (HTTP and WebSocket alike)
 * straight to this port inside the container, so Socket.IO's upgrade
 * requests pass through unmodified.
 *
 * `sleepAfter` controls how long the container stays warm with no traffic.
 * Because this container also owns cron-driven scraping (guild/world sync),
 * don't rely on it staying awake by itself — see cron() in this file, which
 * the Workers Cron Trigger below calls on a schedule to both wake the
 * container and run a sync cycle via /internal/sync/*.
 */
export class ApiContainer extends Container {
  defaultPort = 3001;
  sleepAfter = "15m";

  // Forwards the Worker's secrets/vars into the container process's
  // environment. NOTE: confirm this against Cloudflare's current Containers
  // docs before relying on it — `envVars` is this SDK's mechanism as of
  // writing, but this product is newer and evolves quickly.
  envVars = {
    DATABASE_URL: this.env.DATABASE_URL,
    DIRECT_URL: this.env.DIRECT_URL,
    REDIS_URL: this.env.REDIS_URL,
    JWT_ACCESS_SECRET: this.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: this.env.JWT_REFRESH_SECRET,
    INTERNAL_SYNC_TOKEN: this.env.INTERNAL_SYNC_TOKEN,
    MASTER_LOGIN: this.env.MASTER_LOGIN,
    MASTER_PASSWORD: this.env.MASTER_PASSWORD,
    CORS_ORIGIN: this.env.CORS_ORIGIN,
    COOKIE_DOMAIN: this.env.COOKIE_DOMAIN,
    RUBINOT_BASE_URL: this.env.RUBINOT_BASE_URL,
    RUBINOT_GUILD_NAME: this.env.RUBINOT_GUILD_NAME,
    RUBINOT_SCRAPER_USER_AGENT: this.env.RUBINOT_SCRAPER_USER_AGENT,
  };
}

export interface Env {
  API_CONTAINER: DurableObjectNamespace<ApiContainer>;
  INTERNAL_SYNC_TOKEN: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  MASTER_LOGIN: string;
  MASTER_PASSWORD: string;
  CORS_ORIGIN: string;
  COOKIE_DOMAIN: string;
  RUBINOT_BASE_URL: string;
  RUBINOT_GUILD_NAME: string;
  RUBINOT_SCRAPER_USER_AGENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.API_CONTAINER);
    return container.fetch(request);
  },

  // Workers Cron Trigger (configured in wrangler.jsonc) — fires on a
  // schedule independent of the container's sleep state, waking it and
  // running a sync cycle through the internal-token-gated endpoints.
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const container = getContainer(env.API_CONTAINER);
    const headers = { "x-internal-token": env.INTERNAL_SYNC_TOKEN };

    await container.fetch(
      new Request("https://internal/internal/sync/guild", { method: "POST", headers }),
    );
    await container.fetch(
      new Request("https://internal/internal/sync/worlds", { method: "POST", headers }),
    );
  },
};
