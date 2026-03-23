import type { Client } from "@s-core/core";
import { FileUploadResult, HttpRequestOptions } from "@s-core/core";
import axios from "axios";

export type FileClientOptions = {
    client?: Client;
    basePath?: string;
};

export type FormDataLike = {
    // Use broad arg types so native browser FormData and Node form-data are both assignable.
    append: (name: string, value: string | Blob, fileName?: string) => void;
    getHeaders?: () => Record<string, string>;
};

export type UploadFileData = Blob | ArrayBuffer | ArrayBufferView;

export type UploadFileInput = {
    data: UploadFileData;
    filename?: string;
};

export type UploadPayload = UploadFileInput | UploadFileInput[];

export type FileClient = {
    upload(payload: UploadPayload, options?: HttpRequestOptions): Promise<FileUploadResult[]>;
    download(filename: string, options?: HttpRequestOptions): Promise<unknown>;
};

function toBlob(data: UploadFileData): Blob {
    if (typeof Blob === "undefined") {
        throw new Error("Blob is not available in this runtime. Pass a FormData instance instead.");
    }
    if (data instanceof Blob) {
        return data;
    }
    if (ArrayBuffer.isView(data)) {
        const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        const copy = new Uint8Array(bytes.byteLength);
        copy.set(bytes);
        return new Blob([copy.buffer]);
    }
    return new Blob([data]);
}

function getDefaultFilename(data: UploadFileData): string {
    if (data instanceof Blob && "name" in data) {
        const maybeName = (data as Blob & { name?: unknown }).name;
        if (typeof maybeName === "string" && maybeName.length > 0) {
            return maybeName;
        }
    }
    return "upload.bin";
}

function buildFormData(payload: UploadFileInput | UploadFileInput[]): FormDataLike {
    if (typeof FormData === "undefined") {
        throw new Error("FormData is not available in this runtime. Pass a FormData instance instead.");
    }

    const formData = new FormData();
    const files = Array.isArray(payload) ? payload : [payload];

    for (const file of files) {
        const blob = toBlob(file.data);
        const filename = file.filename ?? getDefaultFilename(file.data);
        formData.append("files", blob, filename);
        formData.append("filenames", filename);
    }

    return formData;
}

function joinPath(basePath: string, endpoint: string): string {
    const trimmedBase = basePath.replace(/\/+$/, "");
    if (!trimmedBase) {
        return endpoint;
    }
    return `${trimmedBase}${endpoint}`;
}

export function createFileClient(
    baseURL: string,
    options: FileClientOptions = {}
): FileClient {
    const client: Client = options.client ? options.client : axios.create({ baseURL }) as unknown as Client;
    const basePath = options.basePath ?? "";

    return {
        async upload(payload, requestOptions) {
            const formData = buildFormData(payload);

            const headers = { ...(requestOptions?.headers ?? {}) } as Record<string, string | string[] | undefined>;
            // Force multipart for this request even if the shared axios instance default is JSON.
            headers["Content-Type"] = "multipart/form-data";
            headers["content-type"] = "multipart/form-data";
            if (typeof formData.getHeaders === "function") {
                Object.assign(headers, formData.getHeaders());
            }

            const res = await client.post(
                basePath || "/",
                formData,
                {
                    ...requestOptions,
                    headers,
                }
            );
            return res.data as FileUploadResult[];
        },
        async download(filename, requestOptions) {
            const res = await client.get(
                joinPath(basePath, `/${encodeURIComponent(filename)}`),
                requestOptions
            );
            return res.data;
        }
    };
}
