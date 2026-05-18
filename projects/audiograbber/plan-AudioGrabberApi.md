## Plan: AudioGrabber API Productization

Build a spec-first TypeScript API with multi-user support, Keycloak OIDC authentication, per-user access control, audio fingerprinting with similarity search, and PostgreSQL persistence — with recurring sync jobs via BullMQ.

Processing policy: run download/import first, then metadata/features as follow-up jobs. The same follow-up pipeline must also work for files manually placed in the library folder (not downloaded through the app).

**Execution Order**
1. Ensure file exists (download job or folder-import discovery job).
2. Gather basic video/file metadata and register DB records.
3. Calculate fingerprint.
4. Enrich metadata: AcoustID/MusicBrainz first, then YouTube title/artist fallback, then local extraction (tags, BPM, key).
5. Write ID3 tags to MP3 files.
6. Calculate and store OpenL3 feature vector.

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
7. Phase 6: Download/import-first ingestion and fingerprinting pipeline (depends on 3)  
   - **Stage A (first)**: ensure media file exists via app download job or folder import discovery job (scan `download` folder for unmanaged files and register them as `MediaFile`).  
   - **Stage B**: once file exists, spawn `fpcalc` (Chromaprint) → get `duration` + compressed fingerprint → decompress `int32[]` → `float32[]` → store in pgvector column.  
   - **Dedup**: before download, query pgvector by cosine similarity (threshold ~0.97); return existing `MediaFile` if matched. For folder-imported files, run the same dedup check after discovery.  
   - **AcoustID**: POST fingerprint + duration to `api.acoustid.org/v2/lookup`; enrich `title/artist/album` if confidence > threshold and fields are missing.  
   - **Fallback metadata**: if AcoustID is weak/missing, try YouTube matching using title/artist candidates, then continue local metadata extraction.  
   New endpoints: `GET /library/videos/{id}/fingerprint`, `GET /library/search/similar?videoId=`.  
   > Note: requires free AcoustID app API key from acoustid.org. pgvector fingerprint dimensions vary by track length — use `halfvec` (up to 16k dims) or normalize to a fixed size.
8. Phase 7: OpenAPI schema expansion (depends on 4–6)  
   Extend `schema.yaml` for all new endpoints from Phases 4–6. Regenerate `src/server/api/index.ts`.
9. Phase 8: Test pyramid and CI quality gates (parallel with late Phase 7)  
   Unit tests: JWT middleware, `canAccessMedia`, fingerprint pipeline, AcoustID enrichment. Integration tests: auth-required endpoints, access-denied scenarios, visibility filtering, similarity search. CI gate: schema/generated-types drift check.
10. Phase 9: Frontend updates (depends on 7)  
    User settings page (YouTube API key). Library: visibility badge + per-item edit controls. Similarity search UI. Keycloak login/logout/token refresh in Quasar app.
11. Phase 10: Automatic sync and folder-processing jobs (depends on 3, 6)  
   Redis + BullMQ. Per-user scheduled sync using that user's own YouTube API key, plus scheduled folder discovery for files added outside the app. Dedup integration: skip tracks matching an existing fingerprint. Run metadata/features as separate follow-up jobs so existing files can be enriched in later executions. Include jitter/backoff, dead-letter handling, quota-aware throttling.
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
5. Folder ingest: dropping a valid media file into the configured folder (without using app download) results in discovered `MediaFile`, then metadata/features jobs run successfully in subsequent schedule/manual runs.
6. Phase 8: All integration tests green; CI fails on schema/type drift.
7. E2E: login → enter YouTube key → download → check library → search similar → change visibility.
8. E2E (folder path): copy file to ingest folder → scheduled/manual ingest run → metadata/features appear in library.
9. Phase 10: Recurring sync and folder jobs run per-user, skip deduped tracks, respect quota throttling.

**Decisions captured**
- Pure TypeScript backend (Python worker fully replaced).
- Spec-first OpenAPI.
- Keycloak OIDC only — no separate API key system; groups delivered via JWT claims.
- Per-user YouTube API key stored in DB (encrypted at rest).
- PostgreSQL + Prisma for persistence; pgvector for fingerprint similarity.
- Audio fingerprinting: dedup + local similarity search + AcoustID external metadata enrichment.
- Redis + BullMQ for scheduler/jobs.
- Full user-facing frontend (not only ops dashboard).
- Download/import-first pipeline: file acquisition is always first, metadata and feature extraction run as independent follow-up jobs.
- Files manually added to the library folder are supported and must enter the same enrichment pipeline.