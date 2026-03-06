/**
 * extracts the response type for a given path, method, and status code from an OpenAPI PathsObject
 * @template Paths - The OpenAPI PathsObject type.
 * @template Path - The path in the OpenAPI schema.
 * @template Method - The HTTP method for the path.
 * @template Status - The HTTP status code for the response.
 */
export type OpenApiResult<Paths, Path extends keyof Paths, Method extends keyof Paths[Path]> = Paths[Path][Method] extends {
    responses: {
        [key: string]: {
            content?: {
                [key: string]: infer T;
            }
        }
    }
} ? T : never;