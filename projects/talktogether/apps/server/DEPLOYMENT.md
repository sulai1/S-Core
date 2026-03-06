# Deployment Guide

This guide explains how to deploy the TalkTogether server to a remote Linux server using the included deploy.sh script.

## Prerequisites

### On your local machine:
- WSL (Windows Subsystem for Linux) if on Windows
- SSH client
- Node.js and npm

### On the target server:
- Linux operating system (Ubuntu, CentOS, etc.)
- Node.js (v16 or higher)
- npm
- systemd (for service management)
- SSH access with key-based authentication

## Setup SSH Key Authentication

1. Generate SSH key if you don't have one:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

2. Copy your public key to the server:
   ```bash
   ssh-copy-id user@your-server-ip
   ```

## Deployment

### Using the deploy script

Make the script executable (first time only):
```bash
chmod +x deploy.sh
```

Usage:
```bash
./deploy.sh <server_ip_or_hostname> [user] [identity_file] [--node-port N] [--db-user USER] [--host HOST] [--db-port PORT] [--db-password PWD] [--use-peer]
```

Notes:
- The first three positional arguments remain: server, optional user (defaults to root), optional SSH identity file.
- All database / port options after that are passed as named flags (long options). Flags accept both `--opt value` and `--opt=value` forms.
- Flag precedence: flag > environment variable > default.

Examples:
```bash
# Deploy to server with default user (root)
./deploy.sh 192.0.2.10

# Deploy as 'ubuntu' user
./deploy.sh myserver.com ubuntu

# Deploy using a specific SSH key and set DB host and port via flags
./deploy.sh myserver.com ubuntu ~/.ssh/id_rsa --node-port 3001 --db-user talktogether --host localhost --db-port 5432

# Use peer (Unix-socket) authentication for Postgres
./deploy.sh myserver.com ubuntu --use-peer
```

Supported flags:
- `--node-port`           : port the app will listen on (default: 3001)
- `--db-user`             : database username (default: talktogether)
- `--host` or `--db-host` : database host; use `peer` or `--use-peer` to enable Unix-socket/peer auth (default: peer)
- `--db-port`             : database TCP port (default: 5432)
- `--db-password`         : database password (used only in TCP mode)
- `--use-peer`            : force peer (Unix socket) authentication

### How flags interact with env vars and defaults

The script resolves configuration with the following precedence:
1. Command-line flags (the ones above)
2. Environment variables (NODE_PORT, DB_USER, DB_HOST, DB_PORT, DB_PASSWORD, DB_USE_PEER)
3. Built-in defaults

### What the deployment script does:

1. **Builds the project** - Compiles TypeScript to JavaScript
2. **Creates deployment package** - Bundles dist/, package.json, package-lock.json, migrations/, and images/ directory
3. **Transfers files** - Uses SCP to upload the package to the server
4. **Server deployment**:
   - Stops existing service (if running)
   - Backs up current deployment
   - Extracts new deployment
   - Installs production dependencies (uses `npm ci` if package-lock.json is available, falls back to `npm install`)
   - Creates/updates systemd service
   - Starts the service
5. **Configures database access**:
   - Writes database-related variables to an environment file at `/etc/talktogether/env`. This file contains newline-separated VAR=VALUE lines (no literal `\n` sequences). The systemd unit loads this file via `EnvironmentFile=/etc/talktogether/env`.

## Systemd unit details

The generated systemd service for `talktogether` contains:
- User: `talktogether` (a system user is created if missing)
- WorkingDirectory: `/opt/talktogether/current`
- Environment entries:
  - `NODE_ENV=production`
  - `PORT=<node_port>`
  - `EnvironmentFile=/etc/talktogether/env` (contains DB_* variables when applicable)
- ExecStart: the service script probes for common start files and runs `node` accordingly:
  - `dist/app.js`
  - `dist/server/app.js`
  - `dist/server/dist/app.js`

If none of the above start files are found the service will fail to start.

## Environment file format

The script writes `/etc/talktogether/env` with lines such as:
```
DB_USER=talktogether
DB_HOST=localhost
DB_NAME=talktogether
DB_PORT=5432
DB_PASSWORD=secret
PGPASSWORD=secret
```
- In peer mode (Unix socket) the file will contain:
```
DB_NAME=talktogether
DB_HOST=/var/run/postgresql
```
- The file is owned by root with mode 600.

## Troubleshooting

### Common Issues:

1. **SSH Connection Failed**
   - Verify SSH key authentication is set up
   - Check if the server is reachable
   - Ensure the user has appropriate permissions

2. **Build Failed**
   - Check for TypeScript compilation errors
   - Ensure all dependencies are installed locally

3. **Service Won't Start**
   - Check logs: `sudo journalctl -u talktogether -f`
   - Verify Node.js is installed on the server
   - Check file permissions in `/opt/talktogether/current`

4. **Permission Denied**
   - Ensure the deployment user has sudo privileges
   - Check file ownership and permissions

### Log Locations:
- Service logs: `sudo journalctl -u talktogether`
- System logs: `/var/log/syslog`

## Security Considerations

1. Use a dedicated deployment user instead of root when possible
2. Configure firewall to only allow necessary ports (3000, 22)
3. Keep the server updated with security patches
4. Use environment variables for sensitive configuration
5. Set up SSL/TLS termination (nginx/Apache proxy recommended)

## Rollback

If deployment fails or causes issues, you can quickly rollback:

```bash
# SSH to server
ssh user@server

# Stop current service
sudo systemctl stop talktogether

# Restore from backup (replace YYYYMMDD-HHMMSS with actual backup timestamp)
sudo rm -rf /opt/talktogether/current
sudo mv /opt/talktogether/backup-YYYYMMDD-HHMMSS /opt/talktogether/current

# Start service
sudo systemctl start talktogether
```