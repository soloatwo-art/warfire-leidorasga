FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
RUN pnpm install --no-frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm run db:generate
RUN pnpm --filter @warfire/database build
RUN pnpm --filter @warfire/shared build
RUN pnpm --filter @warfire/api build

FROM base AS runner
ENV NODE_ENV=production
# Playwright needs its own OS-level dependencies for headless Chromium —
# the scraper loads real RubinOT pages in a real (headless) browser because
# the site blocks plain HTTP clients.
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
WORKDIR /app
RUN pnpm --filter @warfire/api exec playwright install --with-deps chromium
WORKDIR /app
EXPOSE 3001
# `db push` (not `migrate deploy`) on purpose: no migration files are
# committed yet (never ran with a live Postgres to generate one), so this
# syncs the schema directly — good enough for local/dev Docker. Once you
# start evolving the schema for real, switch to `prisma migrate dev` +
# commit the migration, and this can become `migrate deploy`.
CMD ["sh", "-c", "pnpm --filter @warfire/database exec prisma db push --skip-generate && pnpm --filter @warfire/database seed && node apps/api/dist/main.js"]
