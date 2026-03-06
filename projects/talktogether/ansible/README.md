# TalkTogether Ansible Deployment

This Ansible playbook automates the deployment of the TalkTogether application to remote servers.

## Prerequisites

- Ansible installed on your control machine (the machine running the deployment)
- Docker with buildx support on your control machine for cross-platform builds
- Target server(s) with:
  - Docker installed and running
  - SSH access configured
  - PostgreSQL database accessible

## Architecture Support

The playbook supports building for different architectures using Docker Buildx:
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, e.g., Raspberry Pi 4/5)

Set `target_platform` in your hosts.yml to specify the target architecture.

## Configuration

### 1. Update Inventory

Edit `hosts.yml` to configure your target servers:

```yaml
control:
  hosts:
    server:
      ansible_ssh_port: 22
      ansible_become_method: sudo
      ansible_connection: ssh
      target_platform: "linux/amd64"
  vars:
    ansible_host: "your_server_ip"
    ansible_become_password: "your_root_password"
    ansible_user: "your_username"
    ansible_ssh_pass: "your_ssh_password"
```

### 2. Configure Host Variables

Create/edit `host_vars/server.yml` with your configuration:

```bash
# Copy the example file
cp host_vars/server.yml.example host_vars/server.yml

# Edit the file with your settings
nano host_vars/server.yml

# Encrypt with Ansible Vault
ansible-vault encrypt host_vars/server.yml
```

Required variables in `host_vars/server.yml`:
- `db_name`: Database name
- `db_user`: Database user
- `db_password`: Database password
- `db_host`: Database server IP/hostname
- `db_port`: Database port (default: 5432)

Optional variables:
- `node_port`: Backend port (default: 3000)
- `api_base_url`: Custom API URL (leave empty for same-origin)
- `talktogether_build_context`: Path to project directory
- `talktogether_image`: Docker image name
- `container_name`: Container name
- `talktogether_data_dir`: Data directory path
- `talktogether_images_dir`: Images directory path

## Deployment

### Deploy to all servers:

```bash
ansible-playbook -i hosts.yml main.yml --ask-vault-pass
```

### Deploy to specific host:

```bash
ansible-playbook -i hosts.yml main.yml --limit server --ask-vault-pass
```

### Override variables:

```bash
ansible-playbook -i hosts.yml main.yml --ask-vault-pass \
  -e "db_host=192.168.0.220" \
  -e "db_password=mypassword"
```

## What the Playbook Does

1. **Build**: Builds the Docker image locally for the specified platform (e.g., ARM64) using Docker Buildx
2. **Export**: Saves the image as a compressed tar.gz archive
3. **Transfer**: Copies the image archive to the target server(s)
4. **Load**: Loads the Docker image on the target server
5. **Deploy**: Stops any existing container and starts the new one with proper configuration

## Container Configuration

The deployed container will:
- Expose port 80 (frontend + API via nginx)
- Run with automatic restart policy
- Mount persistent volumes for data and images
- Connect to your PostgreSQL database
- Use environment variables for configuration

## Troubleshooting

### Docker Buildx issues:
If you encounter buildx errors, ensure buildx is properly set up:
```bash
docker buildx version
docker buildx ls
```

For ARM64 builds, Docker Desktop on Windows/Mac should work automatically with QEMU emulation.

### Check container logs:
```bash
ssh user@server
docker logs talktogether
```

### Check supervisor logs inside container:
```bash
docker exec -it talktogether tail -f /var/log/supervisor/node.err.log
docker exec -it talktogether tail -f /var/log/supervisor/nginx.err.log
```

### Rebuild and redeploy:
```bash
ansible-playbook -i hosts.yml main.yml --ask-vault-pass --tags build
```

## Network Configuration

By default, the container joins the `mynetwork` Docker network. Make sure this network exists or update the playbook to match your network configuration.

## Security Notes

- Always use Ansible Vault to encrypt sensitive variables
- Use secure passwords for database and SSH access
- Configure firewall rules to restrict access to port 80
- Consider using SSH key authentication instead of passwords
