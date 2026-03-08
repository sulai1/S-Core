import { FileUploadResult, HttpRequestOptions } from "@s-core/core";
import axios from "axios";
import type { Client } from "@s-core/core";

export type FileClientOptions = {
    client?: Client;
    basePath?: string;
};

export type FormDataLike = {
    // Use broad arg types so native browser FormData and Node form-data are both assignable.
    append: (name: string, value: any, fileName?: string) => void;
    getHeaders?: () => Record<string, string>;
};

export type FileClient = {
    upload(formData: FormDataLike, options?: HttpRequestOptions): Promise<FileUploadResult[]>;
    download(filename: string, options?: HttpRequestOptions): Promise<unknown>;
};

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
    const client: Client = options.client ? options.client : axios.create({ baseURL });
    const basePath = options.basePath ?? "";

    return {
        async upload(formData, requestOptions) {
            const headers = { ...(requestOptions?.headers ?? {}) } as Record<string, string | string[] | undefined>;
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
