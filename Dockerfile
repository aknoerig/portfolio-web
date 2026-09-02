# syntax=docker/dockerfile:1

# ── Stage 1: install production dependencies ──────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# --ignore-scripts: the keystone fork (github:aknoerig/keystone-classic) pulls in
# chromedriver as a test dependency; its postinstall script only supports Mac x64
# and fails elsewhere. Safe to skip — no native add-ons need to compile.
# See docs/DEVELOP.md for details.
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2: runtime image ─────────────────────────────────────────────────────
FROM node:18-alpine

# tini forwards signals correctly so `docker stop` / SIGTERM shut Keystone down
# cleanly instead of leaving the container to be killed after the grace period.
RUN apk add --no-cache tini

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
# Mirrors the "start" script in package.json (node --preserve-symlinks keystone.js).
CMD ["node", "--preserve-symlinks", "keystone.js"]
