
/**
 * represents a MIME content type with optional parameters
 * @template Type - The main type of the content (e.g., "application", "text").
 * @template Subtype - The subtype of the content (e.g., "json", "html").
 * @template Dependant - An optional parameter dependent on the type/subtype (e.g., charset for text types).
 */
export type ContentType<
    Type extends string = "application" | "audio" | "example" | "font" | "image" | "message" | "multipart" | "model" | "text" | "video",
    Subtype extends string =
    Type extends "application" ? "octet-stream" | "json" | "xml" :
    Type extends "text" ? "plain" | "css" | "html" | "javascript" :
    Type extends "image" ? "apng" | "avif" | "bmp" | "gif" | "jpeg" | "png" | "svg+xml" | "webp" :
    Type extends "multipart" ? "form-data" | "byteranges" :
    string,
    Dependant extends string | undefined =
    Type extends "text" ? "utf-8" :
    undefined
> = Type extends "text" ?
    `${Type}/${Subtype}; charset=${Dependant}` :
    Type extends "multipart" ? (
        Dependant extends undefined ?
        `${Type}/${Subtype}` :
        `${Type}/${Subtype}; boundary=${Dependant}`
    ) :
    `${Type}/${Subtype}`;

export const json: ContentType<"application", "json"> = "application/json";
export const css: ContentType<"text", "css"> = "text/css; charset=utf-8";
export const multipart: ContentType<"multipart", "form-data", "----WebKitFormBoundary7MA4YWxkTrZu0gW"> = "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW";