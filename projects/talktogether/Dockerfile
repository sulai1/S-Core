ARG TARGETARCH
FROM node:20-bookworm-slim
WORKDIR /app

# Install nginx and supervisor
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

# Copy entire workspace
COPY . .

# Install only backend-related workspaces for server build.
RUN rm -f package-lock.json
RUN NODE_ENV=development npm install --package-lock=false --include-workspace-root \
  --workspace packages/client \
  --workspace packages/core \
  --workspace packages/server \
  --workspace packages/talktogether \
  --workspace projects/talktogether/apps/server
RUN cd /app/projects/talktogether/apps/server && npm run build && npm run postbuild
RUN cd /app/projects/talktogether/apps/server && npm prune --omit=dev

# Set production environment for runtime
ENV NODE_ENV=production

# Prepare server runtime directory
WORKDIR /app/server
RUN mkdir -p images && \
  cp -r /app/projects/talktogether/apps/server/dist/* . && \
  cp /app/projects/talktogether/apps/server/vorlage.png . 2>/dev/null || true && \
  cp -r /app/projects/talktogether/apps/server/images/* images/ 2>/dev/null || true && \
  cp -r /app/projects/talktogether/apps/client/dist/spa public && \
  cp -r /app/node_modules . && \
  printf '{\n  "type": "commonjs"\n}\n' > /app/server/package.json

# Copy nginx and supervisor configs
COPY projects/talktogether/nginx.conf /etc/nginx/sites-available/default
COPY projects/talktogether/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY projects/talktogether/generate-config.sh /app/generate-config.sh
RUN chmod +x /app/generate-config.sh && mkdir -p /var/log/supervisor

EXPOSE 80 3000
ENV NODE_PORT=3000
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
