import { FilePaths, FileUploadResult, OpenApiModule } from "@s-core/core";
import { Request } from "express";
import { promises as fs } from "fs";
import path from "path";

export type FileServerModuleOptions = {
    fileName?: (file: Express.Multer.File) => string;
};

function normalizeFilename(filename: string): string {
    const safe = path.basename(filename);
    if (safe !== filename) {
        throw new Error("Invalid filename");
    }
    return safe;
}


export function createFileServerModule<Path extends string>(
    basePath: Path,
    uploadDir: string,
    options: FileServerModuleOptions = {}
): OpenApiModule<FilePaths<Path>, Request> {
    return {
        [basePath]: {
            post: async (req: { files: { type: string; format: any } }, request?: Request) => {
                const files = (request as unknown as { files?: Express.Multer.File[] })?.files || [];

                if (!files || files.length === 0) {
                    throw new Error("No files uploaded");
                }

                await fs.mkdir(uploadDir, { recursive: true });

                const results: FileUploadResult[] = [];
                for (const file of files) {
                    const desiredName = options.fileName ? options.fileName(file) : file.originalname;
                    const filename = normalizeFilename(desiredName);
                    const filePath = path.join(uploadDir, filename);

                    if (file.buffer) {
                        await fs.writeFile(filePath, file.buffer);
                    } else if (file.path) {
                        // If multer used disk storage, file is already written
                        // Just copy it to the final location if different
                        if (file.path !== filePath) {
                            await fs.rename(file.path, filePath);
                        }
                    } else {
                        throw new Error(`No data for file ${file.originalname}`);
                    }

                    results.push({
                        filename,
                        size: file.size,
                        path: filePath
                    });
                }

                return results;
            }
        },
        [`${basePath}/{filename}`]: {
            get: async (options?: Request & { params?: { filename?: string } }) => {
                const filename = options?.params?.filename;

                if (!filename) {
                    throw new Error("Filename is required");
                }

                const safeFilename = normalizeFilename(filename);
                const filePath = path.join(uploadDir, safeFilename);

                await fs.access(filePath);
                return filePath;
            }
        }
    } as unknown as OpenApiModule<FilePaths<Path>, Request>;
}
