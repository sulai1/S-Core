/**
 * extracts the query parameter type for a given path and method from an OpenAPI PathObject
 * @template PathObject - The OpenAPI PathObject type.
 * @template Path - The path in the OpenAPI schema.
 * @template Method - The HTTP method for the path.
 */
export type OpenApiQueryParameter<
    PathObject,
    Path extends keyof PathObject = any,
    Method extends keyof PathObject[Path] = any
> = PathObject[Path][Method] extends {
    parameters: {
        query?: infer Q;
    };
} ? Q : never;