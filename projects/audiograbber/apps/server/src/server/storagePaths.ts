import path from "node:path";

function resolvePathFromEnv(envKey: string, fallbackPath: string): string {
    const configured = (process.env[envKey] ?? "").trim();
    const selected = configured.length > 0 ? configured : fallbackPath;
    return path.isAbsolute(selected) ? selected : path.resolve(process.cwd(), selected);
}

export const AUDIOGRABBER_DOWNLOAD_FOLDER = resolvePathFromEnv(
    "AUDIOGRABBER_DOWNLOAD_FOLDER",
    ".data/audiograbber/download",
);

export const AUDIOGRABBER_DOWNLOAD_TMP_FOLDER = resolvePathFromEnv(
    "AUDIOGRABBER_DOWNLOAD_TMP_FOLDER",
    path.join(AUDIOGRABBER_DOWNLOAD_FOLDER, "tmp"),
);

export const AUDIOGRABBER_DOWNLOAD_FAILED_FOLDER = resolvePathFromEnv(
    "AUDIOGRABBER_DOWNLOAD_FAILED_FOLDER",
    path.join(AUDIOGRABBER_DOWNLOAD_FOLDER, "failed"),
);

export const AUDIOGRABBER_JOB_STORE_PATH = resolvePathFromEnv(
    "AUDIOGRABBER_JOB_STORE_PATH",
    ".data/audiograbber/jobs.json",
);
