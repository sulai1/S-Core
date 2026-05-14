import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DataSource } from "typeorm";
import { afterEach, describe, expect, test, vi } from "vitest";
import { JobService } from "../src/server/services/JobService.js";
import { MediaFileEntity } from "../src/database/entities/media-file.entity.js";
import type { DownloadRequest, SyncRequest, WorkerSubmission } from "../src/server/types.js";
import type { WorkerAdapter } from "../src/server/worker/PythonWorkerAdapter.js";
import { createTestDataSource } from "./helpers/test-data-source.js";

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
        const dataSource = await createTestDataSource();
        const tempDir = mkdtempSync(path.join(os.tmpdir(), "audiograbber-job-service-"));
        try {
            writeFileSync(path.join(tempDir, "Glitchosaurus Rex abc123xyz99.mp3"), "existing");

            const worker = new FakeWorker();
            const service = new JobService(worker, dataSource as DataSource);
            (service as unknown as { downloadFolder: string }).downloadFolder = tempDir;

            const job = await service.queueDownload({
                videoId: "abc123xyz99",
                songTitle: "Glitchosaurus Rex",
                artist: "Jhesha, Cocodrilo",
                album: "Auryn",
            });

            expect(job.state).toBe("success");
            expect(job.progress).toBe(100);
            expect(worker.downloadCalls).toHaveLength(0);

            const mediaRepo = dataSource.getRepository(MediaFileEntity);
            const media = await mediaRepo.findOne({
                where: { youtubeVideoId: "abc123xyz99" },
                relations: { artists: true },
            });
            expect(media).toBeTruthy();
            expect(media?.artists?.map((artist) => artist.name)).toEqual(["Jhesha", "Cocodrilo"]);
        } finally {
            rmSync(tempDir, { recursive: true, force: true });
            await dataSource.destroy();
        }
    });
});
