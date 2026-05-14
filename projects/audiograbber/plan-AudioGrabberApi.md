## Plan: AudioGrabber API Productization

Build a spec-first TypeScript API with multi-user support, Keycloak OIDC authentication, per-user access control, audio fingerprinting with similarity search, and PostgreSQL persistence — with recurring sync jobs via BullMQ.

**Steps**
1. Phase 0: Module boundaries and contracts ✅  
   TypeScript worker fully ported (yt-dlp + ffmpeg-static + node-id3). Music metadata parser extracted to standalone module with test coverage.
2. Phase 1: Dependency deprecation/update mechanism ✅  
   `requirements.txt` pins all Python deps (yt-dlp, requests, isodate, pandas). `.venv` at `AudioGrabber/.venv`. `worker_bridge.py` supports `dry_run` mode. `python/canary.py` validates package versions + bridge dry-run + optional live metadata fetch. `scripts/check-deps.sh` reports outdated npm + pip packages. New npm scripts: `canary`, `canary:live`, `check-deps`.
3. Phase 2: Full frontend app ✅  
   New Quasar frontend workspace at `projects/ytdownloader/apps/client` with typed OpenAPI client bootstrapping, pages for Download, Sync, Jobs monitor (polling tracked jobs), Library list, and API Settings. Build and typecheck are passing.
4. Phase 3: PostgreSQL + TypeORM foundation ✅  
   Installed `typeorm`, `pg`; `sqlite3` for test DB. Four entities defined as `EntitySchema` (workspace convention, no decorators):  
   - `User`: `{ id, keycloakSub (unique), youtubeApiKey (AES-encrypted), createdAt }`  
   - `MediaFile`: `{ id, youtubeVideoId (unique), filePath, mimeType, durationSecs, ownerId→User, visibility (owner|groups|public), allowedGroups: string[], title, artist, album }`  
   - `Job`: `{ id, kind, state, progress, ownerId→User, mediaFileId?→MediaFile, externalJobId, createdAt, updatedAt }`  
   - `AudioFingerprint`: `{ id, mediaFileId (unique), fingerprint (pgvector), acoustIdRecordingId, acoustIdScore, enrichedAt }`  
   Replace `JobStore.ts` JSON logic with Prisma queries; seed from existing jobs JSON on migration.
5. Phase 4: Keycloak OIDC + per-user YouTube API key (depends on 3)  
   JWT validation middleware (RS256, Keycloak JWKS endpoint). Extract `sub` + `groups` claim; upsert `User` row on first authenticated request. New endpoints: `GET /me`, `PUT /me/youtube-api-key`. Use requesting user's stored YouTube API key for yt-dlp calls. Require auth on all endpoints except `GET /health`. Extend OpenAPI schema with `securitySchemes: bearerAuth`.  
   > Note: Keycloak must be configured with a `groups` mapper on the client scope to include group membership in the JWT.
6. Phase 5: Access control on media files (depends on 4)  
   `POST /jobs/download` accepts optional `visibility` param (default: `owner`). `GET /library/videos` filters: owned by user OR user-groups ∩ `allowedGroups` OR public. New endpoints: `PATCH /library/videos/{id}/visibility`, `GET /library/videos/{id}/file` (streamed, auth-checked). Add `canAccessMedia(user, file)` helper.
7. Phase 6: Audio fingerprinting pipeline (depends on 3)  
   After download, spawn `fpcalc` (Chromaprint) → get `duration` + compressed fingerprint → decompress `int32[]` → `float32[]` → store in pgvector column.  
   - **Dedup**: before download, query pgvector by cosine similarity (threshold ~0.97); return existing `MediaFile` if matched.  
   - **AcoustID**: POST fingerprint + duration to `api.acoustid.org/v2/lookup`; enrich `title/artist/album` if confidence > threshold and fields are missing.  
   New endpoints: `GET /library/videos/{id}/fingerprint`, `GET /library/search/similar?videoId=`.  
   > Note: requires free AcoustID app API key from acoustid.org. pgvector fingerprint dimensions vary by track length — use `halfvec` (up to 16k dims) or normalize to a fixed size.
8. Phase 7: OpenAPI schema expansion (depends on 4–6)  
   Extend `schema.yaml` for all new endpoints from Phases 4–6. Regenerate `src/server/api/index.ts`.
9. Phase 8: Test pyramid and CI quality gates (parallel with late Phase 7)  
   Unit tests: JWT middleware, `canAccessMedia`, fingerprint pipeline, AcoustID enrichment. Integration tests: auth-required endpoints, access-denied scenarios, visibility filtering, similarity search. CI gate: schema/generated-types drift check.
10. Phase 9: Frontend updates (depends on 7)  
    User settings page (YouTube API key). Library: visibility badge + per-item edit controls. Similarity search UI. Keycloak login/logout/token refresh in Quasar app.
11. Phase 10: Automatic sync jobs (depends on 3, 6)  
    Redis + BullMQ. Per-user scheduled sync using that user's own YouTube API key. Dedup integration: skip tracks matching an existing fingerprint. Jitter/backoff, dead-letter handling, quota-aware throttling.
12. Phase 11: Production hardening (depends on all prior phases)  
    Encrypt YouTube API keys at rest (AES-256-GCM, key from env). Structured logging with `sub` context (never PII). PostgreSQL backup/restore runbook. Deployment env docs, staged rollout.

**Relevant files**
- [projects/ytdownloader/apps/AudioGrabber/src/server/services/JobStore.ts](projects/ytdownloader/apps/AudioGrabber/src/server/services/JobStore.ts) — replace with Prisma in Phase 3
- [projects/ytdownloader/apps/AudioGrabber/src/server/services/JobService.ts](projects/ytdownloader/apps/AudioGrabber/src/server/services/JobService.ts) — add user-scoped API key lookup in Phase 4
- [projects/ytdownloader/apps/AudioGrabber/src/server/worker/PythonWorkerAdapter.ts](projects/ytdownloader/apps/AudioGrabber/src/server/worker/PythonWorkerAdapter.ts) — add fpcalc call + dedup check in Phase 6
- [projects/ytdownloader/apps/AudioGrabber/src/server/api/schema.yaml](projects/ytdownloader/apps/AudioGrabber/src/server/api/schema.yaml) — extend in Phase 7
- [projects/ytdownloader/apps/AudioGrabber/src/server/musicMetadata.ts](projects/ytdownloader/apps/AudioGrabber/src/server/musicMetadata.ts) — metadata parser (complete)
- [projects/ytdownloader/apps/client](projects/ytdownloader/apps/client) — frontend updates in Phase 9
- [packages/core/scripts/OpenApiBuilder.ts](packages/core/scripts/OpenApiBuilder.ts) - OpenAPI type generation workflow to reuse.
- [packages/server/src/server/ExpressServer.ts](packages/server/src/server/ExpressServer.ts) - Server bootstrap/lifecycle pattern.
- [packages/server/src/server/ExpressRouter.ts](packages/server/src/server/ExpressRouter.ts) - OpenAPI route registration and request parsing/validation flow.
- [packages/server/test/server/express-server.test.ts](packages/server/test/server/express-server.test.ts) - Integration test style for route behavior.
- [projects/talktogether/apps/client/src/router/index.ts](projects/talktogether/apps/client/src/router/index.ts) - Route-guard/auth flow to adapt for OIDC.
- [projects/talktogether/apps/server/src/serverFactory.ts](projects/talktogether/apps/server/src/serverFactory.ts) - Middleware composition and auth wiring reference.
- [package.json](package.json) - Workspace quality/test/build commands for CI gates.

**Verification**
1. Phase 3: Prisma migrations run cleanly; existing jobs JSON data survives seed.
2. Phase 4: Unauthenticated requests rejected with 401; Keycloak JWT grants access; YouTube key stored and retrievable.
3. Phase 5: User A cannot access User B's private files; group-shared files visible to group members; public files accessible without auth.
4. Phase 6: Re-downloading same track returns existing `MediaFile` (dedup hit); similarity search returns ranked results; AcoustID fills missing metadata fields.
5. Phase 8: All integration tests green; CI fails on schema/type drift.
6. E2E: login → enter YouTube key → download → check library → search similar → change visibility.
7. Phase 10: Recurring sync runs per-user, skips deduped tracks, respects quota throttling.

**Decisions captured**
- Pure TypeScript backend (Python worker fully replaced).
- Spec-first OpenAPI.
- Keycloak OIDC only — no separate API key system; groups delivered via JWT claims.
- Per-user YouTube API key stored in DB (encrypted at rest).
- PostgreSQL + Prisma for persistence; pgvector for fingerprint similarity.
- Audio fingerprinting: dedup + local similarity search + AcoustID external metadata enrichment.
- Redis + BullMQ for scheduler/jobs.
- Full user-facing frontend (not only ops dashboard).