# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm turbo
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# Pastikan semua node_modules workspace ter-link dengan benar
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @beritakarya/api run db:generate
RUN pnpm turbo run build --filter=@beritakarya/api

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 apiuser

# Copy compiled output
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist         ./dist
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/prisma       ./prisma

# Create upload directory
RUN mkdir -p /app/uploads/thumbs && chown -R apiuser:nodejs /app/uploads

USER apiuser
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
