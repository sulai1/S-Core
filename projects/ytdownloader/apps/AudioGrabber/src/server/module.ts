import { OpenApiModule } from "@s-core/core";
import { paths } from "./api/index.js";
import { JobService } from "./services/JobService.js";
import { PythonWorkerAdapter } from "./worker/PythonWorkerAdapter.js";

const jobService = new JobService(new PythonWorkerAdapter());

export const audioGrabberModule: OpenApiModule<paths> = {
    "/health": {
        get: async () => ({ status: "ok" }),
    },
    "/jobs/download": {
        post: async (request) => {
            const job = jobService.queueDownload(request);
            return { jobId: job.jobId, state: "queued" as const };
        },
    },
    "/jobs/{jobId}": {
        get: async (options) => {
            const params = options?.params as { jobId?: string } | undefined;
            const jobId = params?.jobId ?? "";
            const job = jobService.getJob(jobId);
            if (!job) {
                return { jobId, state: "failed" as const, progress: 0, error: `Job ${jobId} not found` };
            }
            return {
                jobId: job.jobId,
                state: job.state,
                progress: job.progress,
                error: job.error,
            };
        },
    },
    "/sync/channels/{channelId}": {
        post: async (_request, options) => {
            const params = options?.params as { channelId?: string } | undefined;
            const job = jobService.queueSync({
                channelId: params?.channelId ?? "unknown",
            });
            return {
                jobId: job.jobId,
                channelId: params?.channelId ?? "unknown",
                state: "queued" as const,
            };
        },
    },
    "/library/videos": {
        get: async (options) => {
            const query = options?.query as { limit?: number } | undefined;
            return jobService.listVideos(query?.limit);
        },
    },
};
