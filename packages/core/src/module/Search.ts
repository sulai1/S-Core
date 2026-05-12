/**
 * Search module for filtering and ranking rows by relevance
 * Supports field-specific searches, exact match precedence, and field weighting
 */

export interface SearchOptions {
    /** Text to search for */
    text: string;

    /** Fields to search in. If undefined, searches all string fields */
    fields?: string[];

    /** Fields that must have exact matches. Rows not matching these are filtered out */
    exactFields?: string[];

    /** Field-specific weights for scoring (higher = more relevant). Default: 1 */
    fieldWeights?: Record<string, number>;

    /** Type of matching: 'exact' | 'prefix' | 'partial' (default: 'partial') */
    matchType?: 'exact' | 'prefix' | 'partial';

    /** Case sensitive search (default: false) */
    caseSensitive?: boolean;

    /** Maximum results to return */
    limit?: number;

    /** Minimum score threshold (0-100) */
    minScore?: number;
}

export interface SearchResult<T> {
    rows: T[];
    scores: number[];
    matches: Array<{
        rowIndex: number;
        field: string;
        matchType: 'exact' | 'prefix' | 'partial';
    }>;
}

type MatchType = 'exact' | 'prefix' | 'partial';
type MatchInfo = { field: string; type: MatchType; position: number };

/**
 * Calculate relevance score for a row based on matches
 */
function calculateScore(
    matches: MatchInfo[],
    fieldWeights: Record<string, number>,
    totalFields: number
): number {
    if (matches.length === 0) return 0;

    let score = 0;

    // Group matches by field
    const matchesByField = new Map<string, MatchInfo[]>();
    for (const match of matches) {
        if (!matchesByField.has(match.field)) {
            matchesByField.set(match.field, []);
        }
        matchesByField.get(match.field)!.push(match);
    }

    // Score each matched field
    for (const [field, fieldMatches] of matchesByField.entries()) {
        const weight = fieldWeights[field] ?? 1;
        const bestMatch = fieldMatches.reduce((best, curr) =>
            matchTypeScore(curr.type) > matchTypeScore(best.type) ? curr : best
        );

        const matchScore = matchTypeScore(bestMatch.type);
        const positionBonus = Math.max(0, 10 - bestMatch.position); // Early matches score higher
        const fieldScore = (matchScore + positionBonus) * weight;
        score += fieldScore;
    }

    // Bonus for multiple field matches
    score += matchesByField.size * 5;

    // Normalize to 0-100
    return Math.min(100, Math.round(score));
}

/**
 * Get base score for match type
 */
function matchTypeScore(type: MatchType): number {
    switch (type) {
        case 'exact':
            return 50;
        case 'prefix':
            return 30;
        case 'partial':
            return 10;
    }
}

/**
 * Find matches in a string
 */
function findMatches(
    text: string,
    query: string,
    matchType: 'exact' | 'prefix' | 'partial',
    caseSensitive: boolean
): MatchInfo[] {
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const matches: MatchInfo[] = [];

    if (matchType === 'exact') {
        if (searchText === searchQuery) {
            matches.push({ type: 'exact', position: 0, field: '' });
        }
    } else if (matchType === 'prefix') {
        if (searchText.startsWith(searchQuery)) {
            matches.push({ type: 'prefix', position: 0, field: '' });
        }
    } else {
        // partial: find all occurrences
        let pos = 0;
        while ((pos = searchText.indexOf(searchQuery, pos)) !== -1) {
            matches.push({ type: 'partial', position: pos, field: '' });
            pos += 1;
        }
    }

    return matches;
}

/**
 * Get all string field names from an object
 */
function getStringFields<T extends Record<string, any>>(row: T): string[] {
    return Object.keys(row).filter(
        (key) => typeof row[key] === 'string' && row[key] !== null && row[key] !== undefined
    );
}

/**
 * Convert field:value syntax to structured query
 * Supports: "firstName:john", "=firstName:john" (exact), "firstName:jo*" (prefix)
 */
function parseFieldSyntax(text: string): {
    field?: string;
    query: string;
    matchType: MatchType;
    isFieldSearch: boolean;
} {
    // Check for field:query syntax
    const fieldMatch = text.match(/^(=)?(\w+):(.+)$/);
    if (fieldMatch) {
        const [, exactFlag, field, query] = fieldMatch;
        const matchType = exactFlag ? 'exact' : query.endsWith('*') ? 'prefix' : 'partial';
        return {
            field,
            query: query.replace(/\*$/, ''),
            matchType,
            isFieldSearch: true,
        };
    }

    return {
        query: text,
        matchType: 'partial',
        isFieldSearch: false,
    };
}

/**
 * Search and rank rows by relevance
 *
 * @example
 * // Simple search across all string fields
 * search(salesmen, { text: "john" })
 *
 * @example
 * // Search specific field with exact match precedence
 * search(salesmen, {
 *   text: "john",
 *   exactFields: ["firstName"],
 *   fieldWeights: { firstName: 3, lastName: 2 }
 * })
 *
 * @example
 * // Field-specific syntax
 * search(salesmen, { text: "firstName:john" })
 * search(salesmen, { text: "=firstName:john" })  // exact match
 * search(salesmen, { text: "firstName:jo*" })    // prefix match
 */
export function search<T extends Record<string, any>>(
    rows: T[],
    options: SearchOptions
): SearchResult<T> {
    const {
        text,
        fields,
        exactFields = [],
        fieldWeights: userWeights = {},
        matchType: defaultMatchType = 'partial',
        caseSensitive = false,
        limit,
        minScore = 0,
    } = options;

    if (!text || text.trim() === '') {
        return { rows: [], scores: [], matches: [] };
    }

    // Parse field:value syntax
    const parsed = parseFieldSyntax(text.trim());
    const searchQuery = parsed.query;
    const searchFields = parsed.isFieldSearch && parsed.field ? [parsed.field] : fields;
    const matchType = parsed.matchType || defaultMatchType;

    // Determine which fields to search
    const fieldsToSearch = searchFields || (rows.length > 0 ? getStringFields(rows[0]) : []);

    // Build field weights
    const fieldWeights: Record<string, number> = {};
    for (const field of fieldsToSearch) {
        fieldWeights[field] = userWeights[field] ?? 1;
    }

    // Score and filter rows
    const scored = rows
        .map((row, originalIndex) => {
            const allMatches: MatchInfo[] = [];

            // Find matches for exact fields
            let exactFieldsMatch = true;
            for (const exactField of exactFields) {
                const fieldValue = row[exactField];
                if (typeof fieldValue !== 'string') {
                    exactFieldsMatch = false;
                    break;
                }

                const fieldMatches = findMatches(fieldValue, searchQuery, 'exact', caseSensitive);
                if (fieldMatches.length === 0) {
                    exactFieldsMatch = false;
                    break;
                }
            }

            if (exactFields.length > 0 && !exactFieldsMatch) {
                return null; // Filter out rows that don't match all exact fields
            }

            // Find matches in search fields
            for (const field of fieldsToSearch) {
                const fieldValue = row[field];
                if (typeof fieldValue !== 'string') continue;

                const fieldMatches = findMatches(fieldValue, searchQuery, matchType, caseSensitive);
                allMatches.push(
                    ...fieldMatches.map((m) => ({
                        ...m,
                        field,
                    }))
                );
            }

            if (allMatches.length === 0) return null;

            const score = calculateScore(allMatches, fieldWeights, fieldsToSearch.length);
            return {
                originalIndex,
                row,
                score,
                matches: allMatches,
            };
        })
        .filter(
            (entry): entry is {
                originalIndex: number;
                row: T;
                score: number;
                matches: MatchInfo[];
            } => entry !== null && entry.score >= minScore
        );

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply limit
    const results = scored.slice(0, limit);

    return {
        rows: results.map((r) => r.row),
        scores: results.map((r) => r.score),
        matches: results.flatMap((r) =>
            r.matches.map((m) => ({
                rowIndex: results.indexOf(r),
                field: m.field,
                matchType: m.type,
            }))
        ),
    };
}

/**
 * Builder for composable search queries
 *
 * @example
 * new SearchBuilder(salesmen)
 *   .query("john")
 *   .fields(["firstName", "lastName"])
 *   .exactMatch(["firstName"])
 *   .boost("firstName", 3)
 *   .limit(10)
 *   .execute()
 */
export class SearchBuilder<T extends Record<string, any>> {
    private options: SearchOptions;

    constructor(private rows: T[], initialText: string = '') {
        this.options = {
            text: initialText,
            matchType: 'partial',
            caseSensitive: false,
        };
    }

    query(text: string): this {
        this.options.text = text;
        return this;
    }

    fields(...fieldNames: string[]): this {
        this.options.fields = fieldNames;
        return this;
    }

    exactMatch(...fieldNames: string[]): this {
        this.options.exactFields = fieldNames;
        return this;
    }

    boost(fieldWeights: Record<string, number> | string, weight?: number): this {
        if (typeof fieldWeights === 'string') {
            if (weight !== undefined) {
                this.options.fieldWeights = { ...this.options.fieldWeights, [fieldWeights]: weight };
            }
        } else {
            this.options.fieldWeights = { ...this.options.fieldWeights, ...fieldWeights };
        }
        return this;
    }

    matchType(type: 'exact' | 'prefix' | 'partial'): this {
        this.options.matchType = type;
        return this;
    }

    caseSensitive(sensitive: boolean): this {
        this.options.caseSensitive = sensitive;
        return this;
    }

    limit(max: number): this {
        this.options.limit = max;
        return this;
    }

    minScore(threshold: number): this {
        this.options.minScore = threshold;
        return this;
    }

    execute(): SearchResult<T> {
        return search(this.rows, this.options);
    }
}
