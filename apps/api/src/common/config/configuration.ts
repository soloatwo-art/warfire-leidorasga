export default () => ({
  port: parseInt(process.env.API_PORT ?? "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  cookieDomain: process.env.COOKIE_DOMAIN ?? "localhost",
  // Shared secret for the Cloudflare Worker Cron Trigger to call the
  // manual /guild/sync and /worlds/sync endpoints when self-hosted cron
  // can't be relied on (Cloudflare Containers sleep when idle).
  internalSyncToken: process.env.INTERNAL_SYNC_TOKEN,

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },

  rubinot: {
    baseUrl: process.env.RUBINOT_BASE_URL ?? "https://rubinot.com.br",
    guildName: process.env.RUBINOT_GUILD_NAME ?? "Warfire Leidorasga",
    userAgent:
      process.env.RUBINOT_SCRAPER_USER_AGENT ??
      "WarfireLeidorasgaGuildTool/1.0",
    minDelayMs: parseInt(process.env.RUBINOT_SCRAPER_MIN_DELAY_MS ?? "1500", 10),
    guildScrapeCron: process.env.GUILD_SCRAPE_CRON ?? "*/3 * * * *",
    worldScrapeCron: process.env.WORLD_SCRAPE_CRON ?? "*/5 * * * *",
    monitoredWorlds: (
      process.env.WORLDS_MONITORED ?? "Grimoria I,Grimoria II,Grimoria III,Grimoria IV"
    )
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean),
  },

  master: {
    login: process.env.MASTER_LOGIN ?? "ryvzin",
  },
});
