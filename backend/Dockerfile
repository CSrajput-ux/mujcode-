# ── Backend Dockerfile — Production Optimized ────────────────────────────────
# Multi-stage build: lean final image, no dev tools leaked

# ── Stage 1: Install dependencies & build native addons (bcrypt) ────────────
FROM node:22-alpine AS deps

WORKDIR /app

# python3, make, g++ needed to compile bcrypt native addon on Alpine musl libc
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./

RUN npm ci --omit=optional \
    && npm cache clean --force

# ── Stage 2: Final production image ──────────────────────────────────────────
FROM node:22-alpine AS runner

LABEL maintainer="MujCode"
LABEL description="MujCode High-Performance Backend API"
LABEL version="1.0.0"

WORKDIR /app

# Only wget needed (for HEALTHCHECK) + dumb-init for proper signal handling
RUN apk add --no-cache wget dumb-init

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy node_modules from deps stage
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup package.json ./
COPY --chown=appuser:appgroup src/ ./src/

# Create required dirs with correct ownership
RUN mkdir -p uploads src/data \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

ENV NODE_ENV=production
# Node.js V8 heap tuning for container environment
ENV NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=64"

HEALTHCHECK --interval=20s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/ || exit 1

# dumb-init: proper PID 1 — forwards signals correctly to Node.js cluster
# Without this, SIGTERM from Docker won't reach Node worker processes
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
