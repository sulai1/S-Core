ARG TARGETARCH
FROM node:20-bookworm AS builder
WORKDIR /app

# Copy dependency manifests first (better Docker layer cache)
COPY api/package*.json ./api/
COPY server/package*.json ./server/
COPY api/.npmrc ./api/.npmrc
COPY server/.npmrc ./server/.npmrc

# Install dependencies
RUN cd api && rm -f package-lock.json && npm install --no-audit --no-fund
RUN cd server && rm -f package-lock.json && npm install --no-audit --no-fund

# Copy full sources after dependencies are installed
COPY api ./api
COPY server ./server

# Build api and server
RUN cd api && npm run build
RUN cd server && npm run build
RUN cd server && npm prune --omit=dev --no-audit --no-fund

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# Install nginx and supervisor
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

# API package (required by server)
COPY --from=builder /app/api/package*.json ./api/
COPY --from=builder /app/api/node_modules ./api/node_modules
COPY --from=builder /app/api/dist ./api/dist

# Server runtime
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist/cjs ./server/dist/cjs
COPY --from=builder /app/server/vorlage.png ./server/
COPY --from=builder /app/server/images ./server/dist/cjs/server/images

# Client build output (pre-built SPA, built locally)
COPY client/dist/spa ./server/public

# Copy nginx config
COPY nginx.conf /etc/nginx/sites-available/default
RUN mkdir -p /var/log/supervisor

# Copy config generation script
COPY generate-config.sh /app/generate-config.sh
RUN chmod +x /app/generate-config.sh

# Copy supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80 3000
ENV NODE_PORT=3000
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
