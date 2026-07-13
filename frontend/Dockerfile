# ── Frontend Dockerfile ─────────────────────────────────────────────────────
# Pre-build the frontend on host with: npm run build
# Then this Dockerfile simply serves the dist/ folder via nginx

FROM nginx:alpine

LABEL maintainer="MujCode"
LABEL description="MujCode Frontend"

# Copy pre-built assets (build on host first with: npm run build)
COPY dist/ /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"]
