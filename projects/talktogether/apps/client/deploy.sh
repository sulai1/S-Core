#!/usr/bin/env bash
# Simple deploy script: sync built SPA to remote /var/www and set owner/permissions
# Usage example:
#   REMOTE_HOST=example.com REMOTE_USER=sulai REMOTE_DIR=/var/www/talktogether ./deploy_to_var_www.sh
# To do a dry run add DRY_RUN=true

set -euo pipefail

# --- configuration (can be overridden as env vars) ---
REMOTE_HOST="${REMOTE_HOST:-world4you}"
REMOTE_USER="${REMOTE_USER:-sulai}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/talktogether}"
LOCAL_DIR="${LOCAL_DIR:-dist/spa}"
REMOTE_OWNER="${REMOTE_OWNER:-talktogether}"
REMOTE_GROUP="${REMOTE_GROUP:-talktogether}"
DRY_RUN="${DRY_RUN:-false}"

SSH_CMD="ssh -p ${REMOTE_PORT}"
RSYNC_OPTS="-az --delete --links --copy-unsafe-links"
if [ "${DRY_RUN}" = "true" ]; then
  RSYNC_OPTS="${RSYNC_OPTS} --dry-run"
  echo "DRY RUN enabled: rsync will not transfer files"
fi

echo "Local dir: ${LOCAL_DIR}"
echo "Remote: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR} (port ${REMOTE_PORT})"

if [ ! -d "${LOCAL_DIR}" ]; then
  echo "ERROR: local build directory not found: ${LOCAL_DIR}"
  echo "Make sure you built the SPA (e.g. run 'npm run build' or the quasar build command) and set LOCAL_DIR if different."
  exit 2
fi

# Clean and rebuild the SPA
echo "Deleting ${LOCAL_DIR}..."
rm -rf "${LOCAL_DIR}"
echo "Rebuilding SPA..."
npm run build

# Ensure remote directory exists (uses sudo because /var/www likely needs it)
echo "Ensuring remote directory exists and is writable (may prompt for sudo password)..."
${SSH_CMD} ${REMOTE_USER}@${REMOTE_HOST} "sudo mkdir -p '${REMOTE_DIR}' || true"

# Rsync files
echo "Starting rsync..."
rsync ${RSYNC_OPTS} -e "${SSH_CMD}" "${LOCAL_DIR%/}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR%/}/"

# Set ownership and permissions on remote side
echo "Setting owner to ${REMOTE_OWNER}:${REMOTE_GROUP} and permissions (dirs 755, files 644)..."
${SSH_CMD} ${REMOTE_USER}@${REMOTE_HOST} "sudo find '${REMOTE_DIR}' -type d -exec chmod 755 {} \; && sudo find '${REMOTE_DIR}' -type f -exec chmod 644 {} \;"

echo "Deploy finished."
exit 0
