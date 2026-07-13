# ── Backend Dockerfile ──────────────────────────────────────────────────────
FROM node:20-alpine

LABEL maintainer="MujCode"
LABEL description="MujCode Backend API"

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy source code
COPY src/ ./src/

# Create uploads directory
RUN mkdir -p uploads

# Expose the backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000 || exit 1

# Run the server
CMD ["node", "src/server.js"]
