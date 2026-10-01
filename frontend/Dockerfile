# ── Frontend Dockerfile — Multi-Stage Production Build ───────────────────────

# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Cache node_modules layer separately
COPY package.json package-lock.json* ./
RUN npm ci --omit=optional && npm cache clean --force

COPY . .

# VITE_API_URL baked into bundle at build time
# Leave empty to use nginx reverse proxy (recommended for Docker deployments)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build optimized production bundle
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

LABEL maintainer="MujCode"
LABEL description="MujCode Frontend — React + Vite + TailwindCSS"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy production build from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
