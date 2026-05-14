import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { YtDlpWorkerAdapter } from "../src/server/worker/PythonWorkerAdapter.js";

const shouldRunLiveDownload = process.env.AUDIOGRABBER_RUN_LIVE_DOWNLOAD_TEST === "1";

describe("AudioGrabber live download", () => {
    test.skipIf(!shouldRunLiveDownload)("downloads a real video with ytdlp worker", async () => {
        const cwd = process.cwd();
        const downloadFolder = path.resolve(cwd, ".data/audiograbber/live-download-test");
        rmSync(downloadFolder, { recursive: true, force: true });
        mkdirSync(downloadFolder, { recursive: true });

        process.env.AUDIOGRABBER_DOWNLOAD_FOLDER = downloadFolder;
        const adapter = new YtDlpWorkerAdapter("ytdlp", 600000);

        // Override with an env var if you need to test another video.
        const videoId = process.env.AUDIOGRABBER_LIVE_TEST_VIDEO_ID ?? "KWezDI4uZHo";
        const result = await adapter.submitDownload({
            videoId,
            outputFormat: "mp3",
            embedMetadata: true,
        });

        expect(result.accepted).toBe(true);

        const files = existsSync(downloadFolder) ? readdirSync(downloadFolder) : [];
        const mediaFiles = files.filter((name) => /\.(mp3|m4a|webm|mp4)$/i.test(name));
        expect(mediaFiles.length).toBeGreaterThan(0);
    }, 620000);
});
