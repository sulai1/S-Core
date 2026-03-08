# S-Core Workspace

A monorepo workspace for the **Talktogether** application and reusable **S-Core** packages.

## Architecture

```
S-Core/
├── packages/          # Reusable libraries
│   ├── client/        # OpenAPI client library
│   ├── core/          # Core framework & utilities
│   ├── server/        # Express server utilities
│   └── talktogether/  # Domain-specific types & schemas
├── projects/          # Full applications
│   └── talktogether/
│       ├── apps/
│       │   ├── client/   # Vue 3 + Quasar SPA frontend
│       │   └── server/   # Express + TypeORM backend
│       └── Deploy configs (Docker, Ansible, etc)
└── ...config files
```

## Project Overview

### Frontend (`projects/talktogether/apps/client`)
- **Framework**: Vue 3 + Quasar
- **Routing**: Vue Router with authentication guards
- **API**: TypeScript-safe OpenAPI client (`@s-core/client`)
- **Port**: 9000 (dev)

**Key Files**:
- `src/router/` - Route definitions and auth guard
- `src/pages/` - Page components (LoginPage, IndexPage, etc)
- `src/layouts/` - Layout wrappers
- `src/boot/di.ts` - Dependency injection & API client setup

### Backend (`projects/talktogether/apps/server`)
- **Framework**: Express.js
- **ORM**: TypeORM + PostgreSQL
- **API**: OpenAPI schema-driven endpoints
- **Auth**: Session-based with bcrypt
- **Port**: 3000 (dev)

**Key Files**:
- `src/serverFactory.ts` - Express server setup with auth endpoints
- `src/database/` - Database utilities & migrations
- `app.ts` - Entry point

### Shared Packages (`packages/`)
- **`@s-core/core`**: Framework for building modular apps
- **`@s-core/server`**: Server utilities (Express helpers, datasource builders)
- **`@s-core/client`**: TypeScript OpenAPI client generator
- **`@s-core/talktogether`**: Domain types, schemas, database tables

## Setup & Development

### Prerequisites
- Node.js 18+ (ESM support required)
- npm 8+
- PostgreSQL (for server)

### Installation
```bash
# Install all workspace dependencies
npm run deps:install

# Or from workspace root
npm ci
```

### Running Development Servers

**Client** (Quasar SPA on port 9000):
```bash
cd projects/talktogether/apps/client
npm run dev
```

**Server** (Express on port 3000):
```bash
cd projects/talktogether/apps/server
npm run dev
```

**Both** (from workspace root):
```bash
npm run dev --workspaces
```

### Building
```bash
# Build all packages and apps
npm run build

# Or specific workspace
npm run build -w @s-core/core
npm run build -w quasar-project
```

## Authentication Flow

1. **Login**: User submits credentials on `LoginPage.vue`
2. **Route Guard**: `src/router/index.ts` checks session via `/auth/session` endpoint
3. **Session Management**: Express stores session in cookie (secure, httpOnly)
4. **Protected Routes**: Routes marked with `meta: { requiresAuth: true }` are guarded
5. **Logout**: Session destroyed, user redirected to `/login`

## API Configuration

The client connects to the backend via environment-specific base URL:

**Development** (hardcoded):
```typescript
// src/boot/di.ts
const baseUrl = 'http://localhost:3000';
```

**Production** (load from config.js):
```javascript
// public/config.js (created at runtime)
window.API_BASE_URL = 'https://api.example.com';
```

## Testing

```bash
# Run tests in all workspaces
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific package
npm test -w @s-core/core
```

## Common Tasks

### Add a New Route
1. Update OpenAPI schema in `@s-core/talktogether`
2. Implement handler in `src/serverFactory.ts`
3. Add page component in `src/pages/`
4. Add route to `src/router/routes.ts`
5. Client automatically gets typed access via `routes['/path'].method()`

### Add a Database Table
1. Create entity in `@s-core/talktogether`
2. Generate migration: `npm run migration:generate`
3. Run migration: `npm run migration:run`

### Troubleshooting: Blank Client Page
1. Ensure server is running on port 3000
2. Check browser network tab for `/auth/session` response
3. Verify `src/boot/di.ts` base URL matches server location
4. Clear browser cache (Ctrl+Shift+Delete)

## Project Structure Standards

- **ESM modules**: All packages use ES2022+ with `"type": "module"`
- **TypeScript**: Strict mode enabled (`"strict": true`)
- **Imports**: Explicit imports preferred (no `import *`)
- **Route paths**: Must start with `/` (e.g., `/auth/login`)

## Deployment

### Docker
See `projects/talktogether/Dockerfile`

### Ansible
See `projects/talktogether/ansible/main.yml`

## Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| Vue 3 | Frontend framework | ^3.x |
| Quasar | UI components | ^2.18.6 |
| Express | Web server | ^4.x |
| TypeORM | Database ORM | ^0.3.x |
| TypeScript | Language | ^5.x |
| Vitest | Testing | ^0.34.x |

## License

ISC
