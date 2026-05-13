## Plan: AudioGrabber API Productization

Build a spec-first TypeScript API around your existing Python downloader (hybrid), then add tests, dependency-update safeguards, full frontend, Keycloak OIDC, and recurring sync jobs with BullMQ.

**Steps**
1. Phase 0: Module boundaries and contracts  
Define stable module boundaries from the current prototype (YouTube fetch, download execution, media indexing, sync orchestration), then lock a JSON contract between TypeScript API and Python worker (request, progress, result, errors).
2. Phase 1: OpenAPI-first API foundation (depends on 1)  
Write OpenAPI YAML first, generate typed API contracts, scaffold API server handlers, add persistence models for jobs/library entities, and wire non-blocking worker dispatch.
3. Phase 2: Test pyramid and CI quality gates (parallel with late Phase 1 endpoint implementation)  
Add unit tests (mappers/worker adapter/validation), integration tests (OpenAPI routes/status transitions), contract tests (schema-client compatibility), and e2e flow tests (sync/download lifecycle).
4. Phase 3: Dependency deprecation/update mechanism (depends on 3) ✅  
   `requirements.txt` pins all Python deps (yt-dlp, requests, isodate, pandas). `.venv` at `AudioGrabber/.venv`. `worker_bridge.py` supports `dry_run` mode. `python/canary.py` validates package versions + bridge dry-run + optional live metadata fetch. `scripts/check-deps.sh` reports outdated npm + pip packages. New npm scripts: `canary`, `canary:live`, `check-deps`.
5. Phase 4: Full frontend app (depends on 2 and 3) ✅  
   New Quasar frontend workspace at `projects/ytdownloader/apps/client` with typed OpenAPI client bootstrapping, pages for Download, Sync, Jobs monitor (polling tracked jobs), Library list, and API Settings. Build and typecheck are passing.
6. Phase 5: Keycloak OpenID Connect (can start after core API contracts are stable; finalization depends on 5)  
Add token validation middleware, map Keycloak roles/scopes to endpoint permissions, and update frontend auth/token refresh/logout flow.
7. Phase 6: Automatic sync jobs (depends on 2, 3, and scheduler infra)  
Introduce Redis + BullMQ worker, recurring schedule definitions with jitter/backoff, idempotent sync diffing, dead-letter handling, and quota-aware throttling.
8. Phase 7: Production hardening and rollout (depends on all prior phases)  
Add structured logs/metrics/tracing, deployment env docs, backup/recovery checks, and staged rollout via canary channels before notebook retirement.

**Relevant files**
- [projects/ytdownloader/apps/AudioGrabber/youtube/yt_api.py](projects/ytdownloader/apps/AudioGrabber/youtube/yt_api.py) - Baseline YouTube fetch and download behavior to preserve behind worker contract.
- [projects/ytdownloader/apps/AudioGrabber/youtube/video_db.py](projects/ytdownloader/apps/AudioGrabber/youtube/video_db.py) - Existing metadata shape to map into persistent entities.
- [packages/core/scripts/OpenApiBuilder.ts](packages/core/scripts/OpenApiBuilder.ts) - OpenAPI type generation workflow to reuse.
- [packages/server/src/server/ExpressServer.ts](packages/server/src/server/ExpressServer.ts) - Server bootstrap/lifecycle pattern.
- [packages/server/src/server/ExpressRouter.ts](packages/server/src/server/ExpressRouter.ts) - OpenAPI route registration and request parsing/validation flow.
- [packages/server/test/server/express-server.test.ts](packages/server/test/server/express-server.test.ts) - Integration test style for route behavior.
- [projects/talktogether/apps/client/src/boot/di.ts](projects/talktogether/apps/client/src/boot/di.ts) - Typed API client bootstrap pattern for frontend.
- [projects/talktogether/apps/client/src/router/index.ts](projects/talktogether/apps/client/src/router/index.ts) - Route-guard/auth flow to adapt for OIDC.
- [projects/talktogether/apps/server/src/serverFactory.ts](projects/talktogether/apps/server/src/serverFactory.ts) - Middleware composition and auth wiring reference.
- [package.json](package.json) - Workspace quality/test/build commands for CI gates.

**Verification**
1. Run workspace gates: npm run check, npm run test, npm run build.
2. Add OpenAPI drift gate: fail CI when generated types differ from schema.
3. Validate endpoint behavior with integration tests for jobs, sync, library, auth.
4. Validate worker lifecycle determinism: queued -> running -> success/failed -> retry.
5. Validate recurring sync idempotency and quota controls under scheduled execution.
6. Validate OIDC flow with Keycloak: login, token refresh, role-based access, logout.
7. Validate end-to-end UX: trigger sync/download, observe progress, recover failed jobs.

**Decisions captured from your answers**
- Hybrid backend: TypeScript API + Python worker.
- Spec-first OpenAPI.
- Keycloak in later phase (after API/tests/frontend MVP stability).
- Redis + BullMQ for scheduler/jobs.
- Full user-facing frontend (not only ops dashboard).

This plan is now documented in session memory and ready for handoff to implementation. If you want, I can now refine this into a milestone timeline (for example 2-week sprints with deliverables).