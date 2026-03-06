/**
 * extracts the path parameter type for a given path and method from an OpenAPI PathObject
 * @template PathObject - The OpenAPI PathObject type.
 * @template Path - The path in the OpenAPI schema.
 * @template Method - The HTTP method for the path.
 */
export type OpenApiPathParameter<
    PathObject,
    Path extends keyof PathObject = any,
    Method extends keyof PathObject[Path] = any
> = PathObject[Path][Method] extends {
    parameters: {
        path?: infer P;
    };
} ? P : never;
