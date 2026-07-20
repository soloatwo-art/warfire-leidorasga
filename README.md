# Warfire Leidorasga — Guild Control Center

Painel de gestão em tempo real para a guild **Warfire Leidorasga** (RubinOT, mundo Grimoria III).

## Como os dados chegam aqui

O RubinOT não tem API pública. As páginas `/guilds/{nome}` e `/characters?name=` carregam seu
conteúdo via chamadas internas do próprio site a `/api/...`, e o site bloqueia requisições HTTP
simples (sem navegador). Por isso o scraper (`apps/api/src/modules/scraper`) usa um **navegador
headless real (Playwright/Chromium)** para abrir essas páginas exatamente como um visitante normal
abriria — sem forjar cabeçalhos, sem resolver captcha, sem chamar `/api` diretamente. Ele só lê o
HTML que a própria página já renderiza para qualquer visitante.

Isso tem duas implicações práticas:

- **É preciso instalar o Chromium do Playwright** (`pnpm playwright:install` na raiz, ou o passo
  já incluso no Dockerfile da API).
- O scraper é deliberadamente lento/conservador (fila com concorrência 1, delay mínimo entre
  requisições, cache de 90s em Redis) — não adianta baixar o intervalo do cron para segundos.

**Limitações de dados conhecidas** (não são bugs, é o que o RubinOT expõe publicamente):
- Não existe Magic Level nem Skills nas páginas de personagem.
- Não há feed público de "bosses mortos" por mundo — não é possível derivar isso sem inventar dados.
- "Tempo online" é aproximado por contagem de sessões (transições online), não por duração real.
- TeamSpeak e x3tBot **não estão conectados de verdade** — os painéis em Admin > Integrações
  salvam configuração e ficam prontos para quando houver credenciais reais.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo.
- **Backend** (`apps/api`): NestJS, Prisma + PostgreSQL, Redis (cache), cron jobs, Socket.IO, Playwright.
- **Frontend** (`apps/web`): Next.js (App Router), Tailwind, Framer Motion, TanStack Table/Query,
  Recharts, Zustand, tema dark/glassmorphism/neon azul + dourado.
- **Pacotes compartilhados**: `packages/database` (schema Prisma), `packages/shared` (tipos/DTOs).

## Rodando localmente

### Pré-requisitos
- Node.js 20+ e pnpm (`corepack enable` já resolve o pnpm)
- PostgreSQL 16 e Redis (local ou via Docker)

### Passo a passo

```bash
pnpm install                 # também builda @warfire/database e @warfire/shared (postinstall)
cp .env.example .env         # ajuste DATABASE_URL / REDIS_URL se não for usar Docker
pnpm playwright:install      # baixa o Chromium usado pelo scraper (~300MB)

pnpm run db:migrate          # primeira vez: cria a migração inicial e aplica no Postgres
pnpm run db:seed             # cria o usuário MASTER (login/senha vêm do .env)

pnpm dev                     # sobe api (porta 3001) e web (porta 3000) em paralelo
```

Acesse `http://localhost:3000`. O usuário MASTER inicial (definido em `.env` como
`MASTER_LOGIN`/`MASTER_PASSWORD`, padrão `ryvzin` / `serv20589`) já entra aprovado e pode aprovar
os demais cadastros em **Admin > Aprovações**.

### Via Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

O container da API já roda `prisma db push` + seed automaticamente no boot (não precisa rodar
migração manualmente para o primeiro teste local). Quando o schema já estiver estável, troque para
`prisma migrate dev` + `migrate deploy` (ver comentário no `apps/api/Dockerfile`).

## Estrutura

```
apps/
  api/     # NestJS — auth, scraper, guild sync, stats, worlds, notifications, assistant...
  web/     # Next.js — dashboard, membros, perfil, estatísticas, leaderboards, mundos, feed...
packages/
  database/  # schema.prisma + client
  shared/    # tipos/DTOs e nomes de eventos de WebSocket compartilhados entre api e web
```

## Deploy na Cloudflare

Arquitetura: **frontend no Cloudflare Pages**, **backend + scraper num Cloudflare Container**
(Docker de verdade, produto mais novo da Cloudflare), **Postgres no Neon**, **Redis no Upstash**
(Cloudflare não hospeda banco/Redis nativamente).

> ⚠️ **Cloudflare Containers é um produto novo e em evolução rápida.** Os nomes de campos em
> `wrangler.jsonc` e a API do pacote `@cloudflare/containers` usados aqui (`apps/api/cloudflare/`)
> refletem meu conhecimento atual, mas confira a documentação oficial da Cloudflare antes de rodar
> — pode ter mudado. Também confirme que sua conta tem acesso a Containers (pode exigir plano
> pago/aceitar termos de um produto em beta).

Outro ponto importante: **Containers hibernam quando ficam ociosos**. O scraper não pode depender
só do cron interno do NestJS nesse caso — por isso criei endpoints internos
(`POST /internal/sync/guild` e `POST /internal/sync/worlds`, protegidos por um token compartilhado
`INTERNAL_SYNC_TOKEN`, não por login) que um **Cron Trigger da própria Cloudflare** chama
periodicamente para acordar o container e disparar a sincronização (`apps/api/cloudflare/src/worker.ts`).

### 1. Banco de dados (Neon)

1. Crie um projeto em [neon.tech](https://neon.tech) (você faz login, não eu).
2. Pegue duas connection strings no dashboard: a **pooled** (`...-pooler...`) e a **direct**
   (sem `-pooler`). Ambas terminam em `?sslmode=require`.
3. Guarde como `DATABASE_URL` (pooled) e `DIRECT_URL` (direct) — ver `.env.example`.

### 2. Redis (Upstash)

1. Crie um banco Redis em [upstash.com](https://upstash.com).
2. Copie a URL `rediss://default:<senha>@<endpoint>.upstash.io:6379` (TLS) como `REDIS_URL`.

### 3. Backend (Cloudflare Container)

```bash
cd apps/api/cloudflare
pnpm install                    # este subprojeto é isolado do workspace (roda em runtime diferente)
wrangler login                  # abre o navegador para você logar na Cloudflare

# Segredos (nunca vão para o wrangler.jsonc nem para o git):
wrangler secret put DATABASE_URL
wrangler secret put DIRECT_URL
wrangler secret put REDIS_URL
wrangler secret put JWT_ACCESS_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put INTERNAL_SYNC_TOKEN
wrangler secret put MASTER_LOGIN
wrangler secret put MASTER_PASSWORD
wrangler secret put CORS_ORIGIN         # URL do seu projeto no Cloudflare Pages
wrangler secret put COOKIE_DOMAIN       # seu domínio, se usar um customizado

pnpm run deploy                 # builda a imagem a partir de ../Dockerfile e publica
```

Depois do primeiro deploy, rode a migração e o seed contra o Neon (localmente, apontando
`DATABASE_URL`/`DIRECT_URL` do `.env` para o Neon):

```bash
pnpm run db:migrate:deploy   # aplica migrações existentes (ou db:migrate se ainda não gerou nenhuma)
pnpm run db:seed
```

### 4. Frontend (Cloudflare Pages)

```bash
cd apps/web
pnpm run pages:build
wrangler pages deploy .vercel/output/static --project-name warfire-leidorasga
```

No dashboard do Pages, configure as variáveis de ambiente `NEXT_PUBLIC_API_URL` e
`NEXT_PUBLIC_WS_URL` apontando para a URL pública do Worker/Container do passo 3.

### 5. Domínio customizado (opcional)

Configure em **Cloudflare Pages > Custom domains** para o frontend, e em **Workers & Pages >
seu Worker > Triggers > Custom domains** para o backend — assim `CORS_ORIGIN`/`COOKIE_DOMAIN`
podem apontar para domínios de verdade em vez das URLs `*.pages.dev`/`*.workers.dev`.

## Fora do escopo do MVP (estrutura pronta, sem integração real)

TeamSpeak Query Server, x3tBot, Metas da Guild, Calendário de Eventos + Presença, Conquistas
internas, PWA/push, assistente via LLM real (hoje é baseado em regras determinísticas sobre o
banco — ver `apps/api/src/modules/assistant`).
