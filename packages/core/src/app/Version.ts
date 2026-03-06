export interface Version {
    major: number;
    minor: number;
    patch: number;
}
export interface VersionConstraint {
    min?: Version;
    max?: Version;
    exact?: Version;
}

export function isVersion(obj: unknown): obj is Version {
    return obj !== null
        && typeof obj === "object"
        && "major" in obj
        && "minor" in obj
        && "patch" in obj
        && typeof obj.major === "number"
        && typeof obj.minor === "number"
        && typeof obj.patch === "number";
}

export interface Dependency {
    name: string;
    version: VersionConstraint;
}

