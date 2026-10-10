# ==============================================================================
# MUJCODE Compiler Engine — Minimalist 7-Language Execution Sandbox
# ==============================================================================
# Supported languages strictly: C, C++, Java, Python, JavaScript, Go, SQL
# Base: Debian 12 (Bookworm) Slim + Node.js 22 LTS
# ==============================================================================

FROM node:22-bookworm-slim AS node-base

FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=2359
ENV SANDBOX_WORK_DIR=/tmp/mujbox

# Copy Node.js 22 LTS runtime directly from official image (native node:sqlite support)
COPY --from=node-base /usr/local/bin/node /usr/local/bin/node
COPY --from=node-base /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install strictly the seven required compilers and runtimes:
# 1. C & C++: gcc, g++, libc6-dev
# 2. Java: openjdk-17-jdk-headless
# 3. Python: python3
# 4. Go: golang-go
# 5. SQL: sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libc6-dev \
    openjdk-17-jdk-headless \
    python3 \
    golang-go \
    sqlite3 \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/* /usr/share/man/*

# Create dedicated non-root execution user
RUN groupadd -g 1001 compilerbox && \
    useradd -u 1001 -g compilerbox -m -s /bin/bash compilerbox

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY src/ ./src/

RUN mkdir -p /tmp/mujbox && chown -R compilerbox:compilerbox /tmp/mujbox /app

USER compilerbox

EXPOSE 2359

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD curl -f http://127.0.0.1:2359/health || exit 1

CMD ["node", "src/server.js"]
