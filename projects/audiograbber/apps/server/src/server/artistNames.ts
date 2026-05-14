export function splitArtistNames(value: string | null | undefined): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(/\s*,\s*|\s+&\s+|\s+vs\.?\s+|\s+feat\.?\s+|\s+ft\.?\s+|\s+x\s+/i)
        .map((part) => part.trim())
        .filter(Boolean);
}

export function normalizeArtistName(value: string): string {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function uniqueArtistNames(values: string[]): string[] {
    const normalizedToDisplay = new Map<string, string>();

    for (const value of values) {
        const displayName = value.trim();
        if (!displayName) {
            continue;
        }

        const normalizedName = normalizeArtistName(displayName);
        if (!normalizedName || normalizedToDisplay.has(normalizedName)) {
            continue;
        }

        normalizedToDisplay.set(normalizedName, displayName);
    }

    return [...normalizedToDisplay.values()];
}