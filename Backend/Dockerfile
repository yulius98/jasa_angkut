# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# Backend NestJS 12 + Prisma 7 (PostgreSQL)
# Target:
#   migrate  -> one-off job: prisma migrate deploy (+ seed), masih butuh devDeps
#   runner   -> image produksi finale (hanya production dependencies)
# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates openssl tini \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g pnpm@12.8.1
WORKDIR /app

# --- dependencies (dev + prod, dipakai build & migrate) --------------------
FROM base AS deps
# bcrypt/esbuild bisa perlu compile bila prebuilt tidak tersedia untuk platform ini.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- build -----------------------------------------------------------------
# src/generated/prisma tidak di-commit, jadi harus di-generate dulu.
FROM deps AS build
COPY . .
ARG DATABASE_URL="postgresql://build:build@postgres:5432/db_jasa_angkut?schema=public"
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm exec prisma generate \
 && pnpm build

# --- migrate + seed (dijalankan sekali oleh compose sebelum backend start) ---
FROM build AS migrate
ENV NODE_ENV=production
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && if [ \"${SEED_ON_START:-true}\" = \"true\" ]; then pnpm db:seed; fi"]

# --- production dependencies only -----------------------------------------
FROM base AS prod-deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- runtime ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3001 \
    UPLOAD_DIR=/app/uploads
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
EXPOSE 3001
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
