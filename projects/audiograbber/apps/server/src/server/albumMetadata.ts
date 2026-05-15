export type ParsedAlbumMetadata = {
    title?: string;
    label?: string;
    catalogue?: string;
    genre?: string;
    style?: string;
    format?: string;
    releaseDate?: Date;
    tags: string[];
};

function cleanText(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const cleaned = value.trim().replace(/\s+/g, " ");
    return cleaned.length > 0 ? cleaned : undefined;
}

function extractField(description: string | undefined, pattern: RegExp): string | undefined {
    if (!description) {
        return undefined;
    }

    const match = description.match(pattern);
    return cleanText(match?.[1]);
}

function parseReleaseDate(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const parsed = new Date(`${trimmed}T00:00:00.000Z`);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }

    return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

/**
 * Convert a year to a date (January 1 of that year)
 */
export function yearToDate(year: number | null | undefined): Date | undefined {
    if (typeof year !== "number" || year < 1 || year > 9999) {
        return undefined;
    }

    return new Date(Date.UTC(year, 0, 1));
}

function collectTags(values: Array<string | undefined>): string[] {
    const normalizedToDisplay = new Map<string, string>();

    for (const value of values) {
        if (!value) {
            continue;
        }

        const hashtagMatches = value.match(/#[^\s,;]+/g) ?? [];
        const chunks = hashtagMatches.length > 0
            ? hashtagMatches.map((token) => token.slice(1))
            : value.split(/\s*,\s*|\s*\/\s*|\s+&\s+/g);

        for (const chunk of chunks) {
            const cleaned = cleanText(chunk?.replace(/^#/, ""));
            if (!cleaned) {
                continue;
            }

            const normalized = cleaned.toLowerCase().replace(/\s+/g, " ").trim();
            if (!normalized || normalizedToDisplay.has(normalized)) {
                continue;
            }

            normalizedToDisplay.set(normalized, cleaned);
        }
    }

    return [...normalizedToDisplay.values()];
}

export function parseAlbumMetadata(description?: string, videoDate?: string): ParsedAlbumMetadata {
    const title = extractField(description, /^Title:\s*(.+?)(?:\n|$)/im);
    const label = extractField(description, /^Label:\s*(.+?)(?:\n|$)/im);
    const catalogue = extractField(description, /^(?:Catalogue|Cat\.?\s*No\.?|Cat\.?\s*#):\s*(.+?)(?:\n|$)/im);
    const genre = extractField(description, /^Genre:\s*(.+?)(?:\n|$)/im);
    const style = extractField(description, /^Style:\s*(.+?)(?:\n|$)/im);
    const format = extractField(description, /^Format:\s*(.+?)(?:\n|$)/im);
    const releaseDate = parseReleaseDate(
        extractField(description, /^Date:\s*(.+?)(?:\n|$)/im)
        ?? (videoDate && /^\d{8}$/.test(videoDate)
            ? `${videoDate.slice(0, 4)}-${videoDate.slice(4, 6)}-${videoDate.slice(6, 8)}`
            : undefined),
    );

    return {
        title,
        label,
        catalogue,
        genre,
        style,
        format,
        releaseDate,
        tags: collectTags([genre, style]),
    };
}