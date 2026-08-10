# Next.js frontend image. Build context is this directory:
#   docker build -t upscaler-ai-frontend .
#
# NEXT_PUBLIC_* variables are inlined into the client bundle at BUILD time,
# not read at runtime — so the API URL has to be a build arg, and an image
# built for one environment cannot be repointed at another by changing env
# vars on the container. Build one image per environment.

# ---- deps: install with the lockfile, in its own layer ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# xlsx resolves to a tarball on cdn.sheetjs.com (see package.json's //xlsx
# note) rather than the npm registry, so this stage needs outbound network
# access to that host as well as to the registry.
RUN npm ci

# ---- build: compile the app into .next/standalone ----
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- runtime: standalone server only ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# `next` writes nothing at runtime here, so this user needs no write access
# to /app at all — unlike node-api, which creates uploads/ on boot.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# The base image bundles npm/npx/yarn/corepack, but the runtime CMD only
# ever calls `node server.js` — removing them drops the CVEs Trivy flags in
# npm's own vendored deps (brace-expansion, ip-address, tar, undici), which
# never execute here anyway.
RUN rm -rf /usr/local/lib/node_modules/npm \
  /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/corepack \
  /opt/yarn-v*

# `standalone` omits static assets and public/ by design — both have to be
# copied alongside it or every CSS/JS chunk and image 404s at runtime.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
