# ── Backend Dockerfile ──────────────────────────────────────────────────────
FROM node:20-alpine

LABEL maintainer="MujCode"
LABEL description="MujCode Backend API"

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (tsx is needed at runtime for TypeScript support)
RUN npm install --production=false && npm cache clean --force

# Copy source code and compiler module
COPY src/ ./src/
COPY compiler/ ./compiler/

# Create uploads directory and non-root user
RUN mkdir -p uploads && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

# Expose the backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000 || exit 1

# Set production environment
ENV NODE_ENV=production

# Run the server with tsx for TypeScript support
CMD ["npx", "tsx", "src/server.js"]
