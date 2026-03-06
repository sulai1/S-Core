/**
 * extracts the request body type for a given path and method from an OpenAPI PathObject
 * @template PathObject - The OpenAPI PathObject type.
 * @template Path - The path in the OpenAPI schema.
 * @template Method - The HTTP method for the path.
 */
export type OpenApiBody<
    PathObject,
    Path extends keyof PathObject,
    Method extends keyof PathObject[Path]> = PathObject[Path][Method] extends {
        requestBody: {
            content: {
                [key: string]: infer P;
            };
        };
    } ? P : never;