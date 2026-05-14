import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { JobRecord } from "../types.js";
import { AUDIOGRABBER_JOB_STORE_PATH } from "../storagePaths.js";

export class JobStore {
    private readonly storePath: string;

    constructor(storePath: string = AUDIOGRABBER_JOB_STORE_PATH) {
        this.storePath = path.isAbsolute(storePath) ? storePath : path.resolve(process.cwd(), storePath);
    }

    load(): JobRecord[] {
        if (!existsSync(this.storePath)) {
            return [];
        }

        try {
            const raw = readFileSync(this.storePath, "utf8");
            const data = JSON.parse(raw) as JobRecord[];
            if (!Array.isArray(data)) {
                return [];
            }
            return data;
        } catch {
            return [];
        }
    }

    save(records: JobRecord[]): void {
        const dirPath = path.dirname(this.storePath);
        mkdirSync(dirPath, { recursive: true });

        const tmpPath = `${this.storePath}.tmp`;
        writeFileSync(tmpPath, JSON.stringify(records, null, 2), "utf8");
        renameSync(tmpPath, this.storePath);
    }
}
