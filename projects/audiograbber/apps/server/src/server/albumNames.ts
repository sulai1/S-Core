export function normalizeAlbumName(value: string): string {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function uniqueAlbumNames(values: string[]): string[] {
    const normalizedToDisplay = new Map<string, string>();

    for (const value of values) {
        const displayName = value.trim();
        if (!displayName) {
            continue;
        }

        const normalizedName = normalizeAlbumName(displayName);
        if (!normalizedName || normalizedToDisplay.has(normalizedName)) {
            continue;
        }

        normalizedToDisplay.set(normalizedName, displayName);
    }

    return [...normalizedToDisplay.values()];
}