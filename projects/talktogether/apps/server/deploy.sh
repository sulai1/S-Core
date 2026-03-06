#!/usr/bin/env bash

# Deploy script for TalkTogether server
# Usage: ./deploy.sh <server_ip_or_hostname> [user] [identity_file] [--node-port N] [--db-user USER] [--host HOST] [--db-port PORT] [--db-password PWD] [--use-peer]"

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_USER="root"
REMOTE_PATH="/opt/talktogether"
SERVICE_NAME="talktogether"

# Function to print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check arguments
if [ $# -lt 1 ]; then
    print_error "Usage: $0 <server_ip_or_hostname> [user] [identity_file] [--node-port N] [--db-user USER] [--host HOST] [--db-port PORT] [--db-password PWD] [--use-peer]"
    print_error "Example: $0 192.168.1.100"
    print_error "Example: $0 myserver.com ubuntu"
    print_error "Example: $0 myserver.com ubuntu /path/to/key"
    print_error "Example: $0 myserver.com ubuntu /path/to/key --node-port 3001 --db-user talktogether --host localhost --db-port 5432"
    exit 1
fi

SERVER=$1
USER=${2:-$DEFAULT_USER}
IDENTITY=${3:-}

print_status "Starting deployment to ${USER}@${SERVER}"

# If no SSH agent is available and no identity was given, try a sensible default
if [ -z "${IDENTITY}" ] && [ -z "${SSH_AUTH_SOCK:-}" ]; then
    if [ -f "$HOME/.ssh/world4you" ]; then
        IDENTITY="$HOME/.ssh/world4you"
        print_status "No SSH agent detected; defaulting to identity $IDENTITY"
    fi
fi

# Build SSH/SCP option strings
SSH_TEST_OPTS="-o ConnectTimeout=10 -o BatchMode=yes"
SSH_OPTS="-o ConnectTimeout=10"
SCP_OPTS="-o ConnectTimeout=10"
if [ -n "${IDENTITY}" ]; then
    SSH_TEST_OPTS="$SSH_TEST_OPTS -i ${IDENTITY}"
    SSH_OPTS="$SSH_OPTS -i ${IDENTITY}"
    SCP_OPTS="$SCP_OPTS -i ${IDENTITY}"
fi

# Defaults for node and DB settings. These can be provided as flags
# after the identity parameter, or via environment variables. Precedence:
# flag > environment variable > default.
DEFAULT_NODE_PORT=3001
DEFAULT_DB_USER="talktogether"
DEFAULT_DB_HOST="peer"
DEFAULT_DB_PORT=5432

# Remove old positional args usage and parse named flags instead.
# Shift off the first three args (SERVER USER IDENTITY) so we only process flags.
NODE_PORT_ARG=""
DB_USER_ARG=""
DB_HOST_ARG=""
DB_PORT_ARG=""
DB_PASSWORD_ARG=""
DB_USE_PEER_ARG=""

shift 3 || true
while [ $# -gt 0 ]; do
    case "$1" in
        --node-port)
            NODE_PORT_ARG="${2:-}"
            shift 2
            ;;
        --node-port=*)
            NODE_PORT_ARG="${1#*=}"
            shift
            ;;
        --db-user)
            DB_USER_ARG="${2:-}"
            shift 2
            ;;
        --db-user=*)
            DB_USER_ARG="${1#*=}"
            shift
            ;;
        --host|--db-host)
            DB_HOST_ARG="${2:-}"
            shift 2
            ;;
        --host=*|--db-host=*)
            DB_HOST_ARG="${1#*=}"
            shift
            ;;
        --db-port)
            DB_PORT_ARG="${2:-}"
            shift 2
            ;;
        --db-port=*)
            DB_PORT_ARG="${1#*=}"
            shift
            ;;
        --db-password)
            DB_PASSWORD_ARG="${2:-}"
            shift 2
            ;;
        --db-password=*)
            DB_PASSWORD_ARG="${1#*=}"
            shift
            ;;
        --use-peer)
            DB_USE_PEER_ARG="1"
            shift
            ;;
        --help|-h)
            print_status "Usage: $0 <server_ip_or_hostname> [user] [identity_file] [--node-port N] [--db-user USER] [--host HOST] [--db-port PORT] [--db-password PWD] [--use-peer]"
            exit 0
            ;;
        *)
            print_warning "Unknown option: $1"
            shift
            ;;
    esac
done

# Environment variable fallbacks (if set)
ENV_NODE_PORT=${NODE_PORT:-}
ENV_DB_USER=${DB_USER:-}
ENV_DB_HOST=${DB_HOST:-}
ENV_DB_PORT=${DB_PORT:-}
ENV_DB_PASSWORD=${DB_PASSWORD:-}
ENV_DB_USE_PEER=${DB_USE_PEER:-}

# Resolve final values: flag > env var > default
if [ -n "${NODE_PORT_ARG}" ]; then
    NODE_PORT="${NODE_PORT_ARG}"
elif [ -n "${ENV_NODE_PORT}" ]; then
    NODE_PORT="${ENV_NODE_PORT}"
else
    NODE_PORT="${DEFAULT_NODE_PORT}"
fi

if [ -n "${DB_USER_ARG}" ]; then
    DB_USER="${DB_USER_ARG}"
elif [ -n "${ENV_DB_USER}" ]; then
    DB_USER="${ENV_DB_USER}"
else
    DB_USER="${DEFAULT_DB_USER}"
fi

if [ -n "${DB_HOST_ARG}" ]; then
    DB_HOST="${DB_HOST_ARG}"
elif [ -n "${ENV_DB_HOST}" ]; then
    DB_HOST="${ENV_DB_HOST}"
else
    DB_HOST="${DEFAULT_DB_HOST}"
fi

if [ -n "${DB_PORT_ARG}" ]; then
    DB_PORT="${DB_PORT_ARG}"
elif [ -n "${ENV_DB_PORT}" ]; then
    DB_PORT="${ENV_DB_PORT}"
else
    DB_PORT="${DEFAULT_DB_PORT}"
fi

# Resolve DB password (do not print the password to logs)
if [ -n "${DB_PASSWORD_ARG}" ]; then
    DB_PASSWORD="${DB_PASSWORD_ARG}"
elif [ -n "${ENV_DB_PASSWORD}" ]; then
    DB_PASSWORD="${ENV_DB_PASSWORD}"
else
    DB_PASSWORD=""
fi

# Determine whether to use peer (Unix socket) authentication.
# Conditions: DB_HOST empty OR DB_HOST == 'peer' OR env DB_USE_PEER=1/true OR --use-peer flag
PEER_MODE=0
if [ -z "${DB_HOST}" ] || [ "${DB_HOST}" = "peer" ] || [ "${ENV_DB_USE_PEER}" = "1" ] || [ "${ENV_DB_USE_PEER}" = "true" ] || [ "${DB_USE_PEER_ARG}" = "1" ]; then
    PEER_MODE=1
fi

# Build the Environment lines to inject into the systemd unit. We keep DB_PASSWORD out
# of printed logs; it will be included in the unit only in non-peer mode.
SERVICE_ENV_FILE="/etc/${SERVICE_NAME}/env"
if [ "${PEER_MODE}" -eq 1 ]; then
    # Use an EnvironmentFile with PGHOST set to the socket so peer auth works.
    SERVICE_DB_ENV="EnvironmentFile=${SERVICE_ENV_FILE}"
    SERVICE_ENV_CONTENT="DB_NAME=${SERVICE_NAME}
DB_HOST=/var/run/postgresql"
    print_status "Using peer auth (Unix socket). Service will connect via PGHOST=/var/run/postgresql"
else
    # For TCP mode write DB credentials to the EnvironmentFile to avoid systemd
    # interpreting special characters in inline Environment= lines.
    SERVICE_DB_ENV="EnvironmentFile=${SERVICE_ENV_FILE}"
    # Build env content; DB_PASSWORD may be empty which is acceptable.
    SERVICE_ENV_CONTENT="DB_USER=${DB_USER}
DB_HOST=${DB_HOST}
DB_NAME=talktogether
DB_PORT=${DB_PORT}
DB_PASSWORD=${DB_PASSWORD}
PGPASSWORD=${DB_PASSWORD}"
    print_status "Using TCP auth for Postgres (host=${DB_HOST}). DB credentials will be placed in ${SERVICE_ENV_FILE}."
fi

print_status "Using NODE_PORT=${NODE_PORT}, DB_USER=${DB_USER}, DB_HOST=${DB_HOST}, DB_PORT=${DB_PORT}"

# Remove existing dist folder before building
print_status "Cleaning previous build artifacts..."
rm -rf dist

print_status "Testing SSH connection (non-interactive)..."
print_status "Building TypeScript project..."
npm run build
print_success "Build completed"

# Create deployment package
print_status "Creating deployment package..."
TEMP_DIR=$(mktemp -d)
PACKAGE_NAME="talktogether-$(date +%Y%m%d-%H%M%S).tar.gz"

# Copy necessary files
cp -r dist "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/" 2>/dev/null || print_warning "No package-lock.json found, will use npm install instead"
cp "vorlage.png" "$TEMP_DIR/" 2>/dev/null || print_warning "No vorlage.png found"
cp -r migrations "$TEMP_DIR/" 2>/dev/null || print_warning "No migrations directory found"

# Ensure images directory exists
mkdir -p "$TEMP_DIR/images"

# Create the archive
cd "$TEMP_DIR"
tar -czf "/tmp/$PACKAGE_NAME" .
cd - > /dev/null
rm -rf "$TEMP_DIR"
print_success "Package created: $PACKAGE_NAME"

# Transfer files to server
print_status "Transferring files to server..."
scp ${SCP_OPTS} "/tmp/$PACKAGE_NAME" "${USER}@${SERVER}:/tmp/"
if [ $? -ne 0 ]; then
    print_error "File transfer failed"
    exit 1
fi
print_success "Files transferred"

# Deploy on server
print_status "Deploying on server..."
BACKUP_DIR="${REMOTE_PATH}/backup-$(date +%Y%m%d-%H%M%S)"
ssh ${SSH_OPTS} ${USER}@${SERVER} << EOF
set -e

# Create application directory
sudo mkdir -p ${REMOTE_PATH}

# Stop existing service if running
if systemctl is-active --quiet ${SERVICE_NAME} 2>/dev/null; then
    echo "Stopping existing service..."
    sudo systemctl stop ${SERVICE_NAME}
fi

# Backup existing deployment
if [ -d "${REMOTE_PATH}/current" ]; then
    echo "Backing up existing deployment (excluding images)..."
    sudo mkdir -p "$BACKUP_DIR"
    # Move everything except images to backup
    sudo sh -c "find '${REMOTE_PATH}/current/dist/server' -mindepth 1 -maxdepth 1 ! -name images -exec mv {} '$BACKUP_DIR/' \;" || true
    # Leave images folder in place
fi

echo "Extracting new deployment..."
sudo mkdir -p ${REMOTE_PATH}/current
cd ${REMOTE_PATH}/current
sudo tar -xzf /tmp/${PACKAGE_NAME}
    # Ensure a service group exists and set group ownership so both the
    # service user and the deploy (SSH) user can write files.
    # Create a system group for the service if missing
    if ! getent group ${SERVICE_NAME} >/dev/null 2>&1; then
        echo "Creating system group ${SERVICE_NAME}..."
        sudo groupadd --system ${SERVICE_NAME} || true
    fi

    # Ensure the service user exists and has the service group as primary group
    if ! id -u ${SERVICE_NAME} >/dev/null 2>&1; then
        echo "Creating system user ${SERVICE_NAME}..."
        sudo useradd --system --no-create-home --gid ${SERVICE_NAME} --shell /usr/sbin/nologin ${SERVICE_NAME} || true
    else
        # make sure primary group is the service group
        sudo usermod -g ${SERVICE_NAME} ${SERVICE_NAME} >/dev/null 2>&1 || true
    fi

    # Add the deploy user (SSH user) to the service group so it can write files
    if id -u ${USER} >/dev/null 2>&1; then
        echo "Adding deploy user ${USER} to group ${SERVICE_NAME}..."
        sudo usermod -a -G ${SERVICE_NAME} ${USER} || true
    fi

    # Set ownership: keep the deploy user as the owner, set group to service group
    # so both the deploy user and the service user (via group) can write.
    sudo chown -R ${USER}:${SERVICE_NAME} ${REMOTE_PATH}/current || true

    # Set directory permissions: setgid so new files inherit the group, and make
    # directories group-writable and files group-writable.
    sudo find ${REMOTE_PATH}/current -type d -exec chmod 2775 {} + || true
    sudo find ${REMOTE_PATH}/current -type f -exec chmod 0664 {} + || true

echo "Ensuring images directory exists..."
sudo mkdir -p ${REMOTE_PATH}/current/dist/server/images

echo "Installing production dependencies..."
if [ -f "package-lock.json" ]; then
    echo "Using npm ci with package-lock.json..."
    if ! npm ci --omit=dev; then
        echo "npm ci failed, falling back to npm install..."
        npm install --omit=dev
    fi
else
    echo "No package-lock.json found, using npm install..."
    npm install --omit=dev
fi

if [ $? -ne 0 ]; then
    echo "Failed to install dependencies"
    exit 1
fi

[ -f "/etc/systemd/system/${SERVICE_NAME}.service" ] && sudo rm -f /etc/systemd/system/${SERVICE_NAME}.service || true
    # Create config dir and write environment file with restricted permissions
    sudo mkdir -p /etc/${SERVICE_NAME}
    sudo tee ${SERVICE_ENV_FILE} > /dev/null << ENV_EOF
${SERVICE_ENV_CONTENT}
ENV_EOF
    sudo chown root:root ${SERVICE_ENV_FILE}
    sudo chmod 600 ${SERVICE_ENV_FILE}

sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << SERVICE_EOF
[Unit]
Description=TalkTogether Server
After=network.target

[Service]
Type=simple
User=${SERVICE_NAME}
WorkingDirectory=${REMOTE_PATH}/current
Environment=NODE_ENV=production
Environment=PORT=${NODE_PORT}
${SERVICE_DB_ENV}
ExecStart=/bin/sh -c 'if [ -f "${REMOTE_PATH}/current/dist/app.js" ]; then exec /usr/bin/node dist/app.js; elif [ -f "${REMOTE_PATH}/current/dist/server/app.js" ]; then exec /usr/bin/node dist/server/app.js; elif [ -f "${REMOTE_PATH}/current/dist/server/dist/app.js" ]; then exec /usr/bin/node dist/server/dist/app.js; else echo "No start file found"; exit 1; fi'
Restart=always
RestartSec=10
# Use systemd journal (default); avoid obsolete 'syslog' target
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
SERVICE_EOF

    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}

echo "Starting service..."
sudo systemctl start ${SERVICE_NAME}

sleep 2
if systemctl is-active --quiet ${SERVICE_NAME}; then
    echo "Service started successfully"
    echo "Last 100 journal lines for ${SERVICE_NAME}:"
    sudo journalctl -u ${SERVICE_NAME} -n 100 --no-pager -l || true
else
    echo "Service failed to start"
    echo "Last 200 journal lines for ${SERVICE_NAME}:"
    sudo journalctl -u ${SERVICE_NAME} -n 200 --no-pager -l || true
    exit 1
fi

# Cleanup remote package
rm -f /tmp/${PACKAGE_NAME}
EOF

if [ $? -ne 0 ]; then
    print_error "Deployment failed on server"
    exit 1
fi

# Cleanup local temp file
rm -f "/tmp/$PACKAGE_NAME"

print_success "Deployment completed successfully!"
print_status "Service is running on ${SERVER}:${NODE_PORT}"
print_status "You can check the logs with: ssh ${USER}@${SERVER} 'sudo journalctl -u ${SERVICE_NAME} -f'"
print_status "You can check the status with: ssh ${USER}@${SERVER} 'sudo systemctl status ${SERVICE_NAME}'"