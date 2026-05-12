import { randomUUID } from "node:crypto";
import { DownloadRequest, JobRecord, LibraryVideo, SyncRequest } from "../types.js";
import { JobStore } from "./JobStore.js";
import { WorkerAdapter } from "../worker/PythonWorkerAdapter.js";

export class JobService {
    private readonly jobs = new Map<string, JobRecord>();

    private readonly sampleLibrary: LibraryVideo[] = [
        { id: "sample-1", title: "Example Track", status: "ready" },
        { id: "sample-2", title: "Queued Download", status: "processing" },
    ];

    constructor(
        private readonly worker: WorkerAdapter,
        private readonly store: JobStore = new JobStore(),
    ) {
        for (const job of this.store.load()) {
            this.jobs.set(job.jobId, job);
        }
    }

    queueDownload(request: DownloadRequest): JobRecord {
        const job = this.createJob("download");
        this.dispatchDownload(job.jobId, request).catch((error: unknown) => {
            this.failJob(job.jobId, error);
        });
        return job;
    }

    queueSync(request: SyncRequest): JobRecord {
        const job = this.createJob("sync");
        this.dispatchSync(job.jobId, request).catch((error: unknown) => {
            this.failJob(job.jobId, error);
        });
        return job;
    }

    getJob(jobId: string): JobRecord | undefined {
        return this.jobs.get(jobId);
    }

    listVideos(_limit?: number): { items: LibraryVideo[] } {
        return { items: this.sampleLibrary };
    }

    private persist(): void {
        this.store.save(Array.from(this.jobs.values()));
    }

    private createJob(kind: JobRecord["kind"]): JobRecord {
        const now = new Date().toISOString();
        const job: JobRecord = {
            jobId: randomUUID(),
            state: "queued",
            progress: 0,
            kind,
            createdAt: now,
            updatedAt: now,
        };

        this.jobs.set(job.jobId, job);
        this.persist();
        return job;
    }

    private async dispatchDownload(jobId: string, request: DownloadRequest): Promise<void> {
        this.updateJob(jobId, { state: "running", progress: 15 });
        const result = await this.worker.submitDownload(request);
        if (!result.accepted) {
            throw new Error(result.message ?? "worker-rejected-download");
        }

        this.updateJob(jobId, {
            state: "success",
            progress: 100,
            externalJobId: result.externalJobId,
        });
    }

    private async dispatchSync(jobId: string, request: SyncRequest): Promise<void> {
        this.updateJob(jobId, { state: "running", progress: 20 });
        const result = await this.worker.submitSync(request);
        if (!result.accepted) {
            throw new Error(result.message ?? "worker-rejected-sync");
        }

        this.updateJob(jobId, {
            state: "success",
            progress: 100,
            externalJobId: result.externalJobId,
        });
    }

    private updateJob(jobId: string, patch: Partial<JobRecord>): void {
        const current = this.jobs.get(jobId);
        if (!current) {
            return;
        }

        this.jobs.set(jobId, {
            ...current,
            ...patch,
            updatedAt: new Date().toISOString(),
        });
        this.persist();
    }

    private failJob(jobId: string, error: unknown): void {
        const message = error instanceof Error ? error.message : "unknown-worker-error";
        this.updateJob(jobId, { state: "failed", error: message });
    }
}
