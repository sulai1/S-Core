# TalkTogether

web application with api to manage salesman, ids, items and transactions.

It includes:

- Frontend: `projects/talktogether/apps/client` (Quasar + Vue)
- Backend: `projects/talktogether/apps/server` (Node.js + TypeScript)
- Deployment: `projects/talktogether/ansible` (remote Docker deployment)

## Prerequisites

- Node.js + npm
- Docker (on target host)
- Ansible (on control machine for deployment)

## Local Development

Run commands from workspace root (`CoreWS`).

Install dependencies:

```bash
npm install
```

Build frontend:

```bash
npm run build --workspace projects/talktogether/apps/client
```

Build backend:

```bash
npm run build --workspace projects/talktogether/apps/server
```

Run backend locally:

```bash
npm run dev --workspace projects/talktogether/apps/server
```

## Deployment (Ansible)

Run from `projects/talktogether`:

```bash
ansible-playbook -i ansible/hosts.yml ansible/main.yml --ask-vault-pass --ask-pass
```

## Container Overview

The playbook builds `projects/talktogether/Dockerfile` on the target host and runs a single container that serves both frontend and backend.

- Container image: `talktogether:latest` (default)
- Container name: `talktogether` (default)
- Exposed ports:
- `80` inside container for nginx/frontend
- `3000` inside container for Node backend (mapped from `backend_port`)
- Volumes:
- `talktogether_data_dir` -> `/app/data`
- `talktogether_images_dir` -> `/app/server/images`
- `talktogether_images_dir` -> `/app/server/public`
- Network: joins Docker network `mynetwork`
- Restart policy: `unless-stopped`

The container receives these runtime env vars from Ansible: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `NODE_PORT`, `NODE_ENV`, `API_BASE_URL`, `CORS_ORIGINS`, `COOKIE_SECURE`.

## Playbook Variables

Set these in `ansible/hosts.yml`, inventory host vars, vault vars, or with `-e`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `talktogether_image` | `talktogether:latest` | Docker image tag to build/run |
| `talktogether_build_context` | `{{ playbook_dir + '/../../..' }}` | Source root used for build/sync |
| `talktogether_build_dir` | `/tmp/talktogether-build` | Remote temp build directory |
| `talktogether_data_dir` | `/opt/talktogether/data` | Persistent app data on host |
| `talktogether_images_dir` | `/opt/talktogether/images` | Persistent image storage on host |
| `container_name` | `talktogether` | Running container name |
| `db_name` | `talktogether` | PostgreSQL database name |
| `db_user` | `postgres` | PostgreSQL user |
| `db_password` | `""` | PostgreSQL password |
| `db_host` | `localhost` | PostgreSQL host |
| `db_port` | `5432` | PostgreSQL port |
| `frontend_port` | `80` | Host port mapped to container `80` |
| `backend_port` | `3033` | Host port mapped to `node_port` |
| `node_port` | `3000` | Backend listen port inside container |
| `frontend_origin` | Computed from host + `frontend_port` | Value for `CORS_ORIGINS` |
| `api_base_url` | Computed from host + `backend_port` | Value for `API_BASE_URL` |
| `ansible_host` | inventory host | SSH target IP/FQDN |
| `ansible_user` | inventory value | SSH user |
| `ansible_ssh_port` | `22` | SSH port |

Useful tag-based runs:

```bash
# Example: only sync files
ansible-playbook -i ansible/hosts.yml ansible/main.yml --ask-vault-pass --ask-pass --tags sync
```


Available task tags in `ansible/tasks.yml`:

- `setup`
- `filesystem`
- `sync`
- `build`
- `client`
- `docker`
- `deploy`
- `runtime`

For deployment variable details, see `projects/talktogether/ansible/README.md`.


# TODO
* check ID generation
* editable config for validto and when id gets reused