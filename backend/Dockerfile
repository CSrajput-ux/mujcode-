# ── Backend Dockerfile ──────────────────────────────────────────────────────
FROM node:20-alpine

LABEL maintainer="MujCode"
LABEL description="MujCode Backend API"

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (tsx is needed at runtime for TypeScript ESM support)
RUN npm ci --omit=optional && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY compiler/ ./compiler/

# Create uploads directory and non-root user
RUN mkdir -p uploads && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000 || exit 1

CMD ["node", "--import", "tsx/esm", "src/server.js"]
