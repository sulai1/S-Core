import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { DownloadRequest, SyncRequest, WorkerSubmission } from "../types.js";

export interface WorkerAdapter {
    submitDownload(request: DownloadRequest): Promise<WorkerSubmission>;
    submitSync(request: SyncRequest): Promise<WorkerSubmission>;
}

type WorkerMode = "stub" | "python";

export class PythonWorkerAdapter implements WorkerAdapter {
    constructor(
        private readonly mode: WorkerMode = (process.env.AUDIOGRABBER_WORKER_MODE as WorkerMode | undefined) ?? "stub",
        private readonly pythonExecutable: string = process.env.AUDIOGRABBER_PYTHON_EXECUTABLE ?? "python3",
        private readonly timeoutMs: number = Number(process.env.AUDIOGRABBER_WORKER_TIMEOUT_MS ?? 7000),
    ) { }

    async submitDownload(request: DownloadRequest): Promise<WorkerSubmission> {
        if (this.mode === "python") {
            return this.submitViaPython("download", request);
        }

        return {
            accepted: true,
            externalJobId: randomUUID(),
            message: "stubbed-python-download",
        };
    }

    async submitSync(request: SyncRequest): Promise<WorkerSubmission> {
        if (this.mode === "python") {
            return this.submitViaPython("sync", request);
        }

        return {
            accepted: true,
            externalJobId: randomUUID(),
            message: "stubbed-python-sync",
        };
    }

    private submitViaPython(kind: "download" | "sync", payload: DownloadRequest | SyncRequest): Promise<WorkerSubmission> {
        const inlineBridge = [
            "import json,sys,uuid",
            "raw = sys.stdin.read()",
            "data = json.loads(raw) if raw else {}",
            "kind = data.get('kind', 'unknown')",
            "result = {'accepted': True, 'externalJobId': str(uuid.uuid4()), 'message': f'python-bridge-{kind}'}",
            "sys.stdout.write(json.dumps(result))",
            "sys.stdout.flush()",
        ].join("; ");

        return new Promise<WorkerSubmission>((resolve, reject) => {
            const processHandle = spawn(this.pythonExecutable, ["-c", inlineBridge], {
                stdio: ["pipe", "pipe", "pipe"],
            });

            let stdout = "";
            let stderr = "";

            const timeout = setTimeout(() => {
                processHandle.kill();
                reject(new Error(`python-worker-timeout-${this.timeoutMs}ms`));
            }, this.timeoutMs);

            processHandle.stdout.on("data", (chunk: Buffer) => {
                stdout += chunk.toString();
            });

            processHandle.stderr.on("data", (chunk: Buffer) => {
                stderr += chunk.toString();
            });

            processHandle.on("error", (error: Error) => {
                clearTimeout(timeout);
                reject(error);
            });

            processHandle.on("close", (code: number | null) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`python-worker-exit-${String(code)}:${stderr.trim()}`));
                    return;
                }

                try {
                    const parsed = JSON.parse(stdout) as WorkerSubmission;
                    if (typeof parsed.accepted !== "boolean") {
                        reject(new Error("python-worker-invalid-response"));
                        return;
                    }
                    resolve(parsed);
                } catch (error) {
                    reject(new Error(`python-worker-json-parse-failed:${String(error)}`));
                }
            });

            processHandle.stdin.write(JSON.stringify({ kind, payload }));
            processHandle.stdin.end();
        });
    }
}
