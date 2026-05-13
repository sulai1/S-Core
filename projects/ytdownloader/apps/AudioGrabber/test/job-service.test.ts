import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { JobService } from "../src/server/services/JobService.js";
import type { DownloadRequest, SyncRequest, WorkerSubmission } from "../src/server/types.js";
import type { WorkerAdapter } from "../src/server/worker/PythonWorkerAdapter.js";

class FakeWorker implements WorkerAdapter {
    public downloadCalls: DownloadRequest[] = [];
    public syncCalls: SyncRequest[] = [];

    async submitDownload(request: DownloadRequest): Promise<WorkerSubmission> {
        this.downloadCalls.push(request);
        return { accepted: true, externalJobId: "worker-job" };
    }

    async submitSync(request: SyncRequest): Promise<WorkerSubmission> {
        this.syncCalls.push(request);
        return { accepted: true, externalJobId: "worker-sync-job" };
    }
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("JobService", () => {
    test("skips download work when matching file already exists", async () => {
        const tempDir = mkdtempSync(path.join(os.tmpdir(), "audiograbber-job-service-"));
        try {
            writeFileSync(path.join(tempDir, "Glitchosaurus Rex abc123xyz99.mp3"), "existing");

            const worker = new FakeWorker();
            const service = new JobService(worker, {
                load: () => [],
                save: vi.fn(),
            } as never);
            (service as unknown as { downloadFolder: string }).downloadFolder = tempDir;

            const job = service.queueDownload({
                videoId: "abc123xyz99",
                songTitle: "Glitchosaurus Rex",
                artist: "Jhesha, Cocodrilo",
                album: "Auryn",
            });

            expect(job.state).toBe("success");
            expect(job.progress).toBe(100);
            expect(worker.downloadCalls).toHaveLength(0);
        } finally {
            rmSync(tempDir, { recursive: true, force: true });
        }
    });
});
