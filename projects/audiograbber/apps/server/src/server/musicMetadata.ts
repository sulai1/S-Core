function decodeHtmlEntities(value: string): string {
    return value
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#x27;/gi, "'")
        .replace(/&#x2F;/gi, "/");
}

function cleanText(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const cleaned = decodeHtmlEntities(value)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeMarkup(value: string): string {
    return decodeHtmlEntities(value)
        .replace(/\\u003[cC]/g, "<")
        .replace(/\\u003[eE]/g, ">")
        .replace(/\\u0026/g, "&")
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"');
}

function extractNearbySection(markup: string, marker: string, span = 1200): string | undefined {
    const idx = markup.indexOf(marker);
    if (idx < 0) {
        return undefined;
    }
    return markup.slice(idx, idx + span);
}

function firstRegexGroup(input: string | undefined, regex: RegExp): string | undefined {
    if (!input) {
        return undefined;
    }
    const match = input.match(regex);
    return cleanText(match?.[1]);
}

function stripTrailingVideoIdToken(value: string): string {
    return value.replace(/\s+[A-Za-z0-9_-]{11}\s*$/, "").trim();
}

function looksLikeMetadataNoise(value: string): boolean {
    const compact = value.toLowerCase();
    if (value.length > 180) {
        return true;
    }

    return [
        '"thumbnail"',
        'isCrawlable',
        'playerConfig',
        'microformat',
        'playerMicroformatRenderer',
        'annotations',
        'serializedShareEntity',
        '\\u0026',
    ].some((token) => compact.includes(token.toLowerCase()));
}

function splitTitleFallback(videoTitle: string): { artist?: string; songTitle?: string } {
    const cleanedTitle = stripTrailingVideoIdToken(cleanText(videoTitle) ?? videoTitle);
    const separatorMatch = cleanedTitle.match(/^\s*(?:\d{1,2}\s*[.)-]?\s*)?(.+?)\s*[-\u2010\u2011\u2012\u2013\u2014\u2212_]\s*(.+)$/);

    if (!separatorMatch) {
        return { songTitle: cleanedTitle };
    }

    const normalizedArtist = cleanText(
        separatorMatch[1]
            ?.replace(/\s*&\s*/gi, ", ")
            ?.replace(/\s+vs\.?\s+/gi, ", ")
            ?.replace(/\s+feat\.?\s+/gi, ", ")
            ?.replace(/\s+ft\.?\s+/gi, ", ")
            ?.replace(/\s+x\s+/gi, ", ")
            ?.replace(/[\s\-\u2010\u2011\u2012\u2013\u2014\u2212_]+$/, ""),
    );

    return {
        artist: normalizedArtist,
        songTitle: cleanText(separatorMatch[2]),
    };
}

export function parseMusicMetadata(videoTitle: string, description?: string): {
    artist?: string;
    songTitle?: string;
    album?: string;
} {
    const result: { artist?: string; songTitle?: string; album?: string } = {};
    let outNowArtist: string | undefined;
    const titleFallback = splitTitleFallback(videoTitle);

    const videoTitleText = cleanText(videoTitle) ?? videoTitle;
    const compactVideoTitle = videoTitleText
        .replace(/^\s*\d{1,2}\s*[.)-]?\s*/, "")
        .replace(/\s*(?:h|x)?264\s*q\d+\s*$/i, "")
        .trim();

    const tryCompactTitleParse = (): void => {
        if (/\s*[-\u2010\u2011\u2012\u2013\u2014\u2212_]\s*/.test(compactVideoTitle)) {
            return;
        }

        const tokens = compactVideoTitle.split(/\s+/).filter(Boolean);
        if (tokens.length < 4 || !(/[&,]/.test(compactVideoTitle) || /\bvs\.?\b/i.test(compactVideoTitle) || /\bfeat\.?\b/i.test(compactVideoTitle) || /\bft\.?\b/i.test(compactVideoTitle) || /\bx\b/i.test(compactVideoTitle))) {
            return;
        }

        const normalizedCompactArtistText = (text: string): string => text
            .replace(/\s*&\s*/gi, ", ")
            .replace(/\s+vs\.?\s+/gi, ", ")
            .replace(/\s+feat\.?\s+/gi, ", ")
            .replace(/\s+ft\.?\s+/gi, ", ")
            .replace(/\s+x\s+/gi, ", ");

        if (tokens.length >= 5) {
            result.artist = result.artist ?? cleanText(normalizedCompactArtistText(tokens.slice(0, -2).join(" ")));
            result.songTitle = result.songTitle ?? cleanText(tokens.slice(-2).join(" "));
            return;
        }

        if (tokens.length === 4) {
            result.artist = result.artist ?? cleanText(normalizedCompactArtistText(tokens.slice(0, -1).join(" ")));
            result.songTitle = result.songTitle ?? cleanText(tokens[tokens.length - 1]);
        }
    };

    if (description) {
        const markup = normalizeMarkup(description);

        const metadataBlock = extractNearbySection(markup, "ytVideoAttributeViewModelMetadata", 2800);
        if (metadataBlock) {
            result.songTitle = result.songTitle ?? firstRegexGroup(
                metadataBlock,
                /ytVideoAttributeViewModelTitle[^>]*>([^<]+)</i
            );
            result.artist = result.artist ?? firstRegexGroup(
                metadataBlock,
                /ytVideoAttributeViewModelSubtitle[^>]*>\s*<span[^>]*>([^<]+)</i
            );
            result.album = result.album ?? firstRegexGroup(
                metadataBlock,
                /ytVideoAttributeViewModelSecondarySubtitle[^>]*>\s*<span[^>]*>([^<]+)</i
            );
        }

        const titleBlock = extractNearbySection(markup, "ytVideoAttributeViewModelTitle", 500);
        result.songTitle = result.songTitle ?? firstRegexGroup(
            titleBlock,
            /(?:ytAttributedStringLink[^>]*>|<span[^>]*>|>)([^<\n][^<]*?)(?:<|\n|$)/i
        );

        const subtitleBlock = extractNearbySection(markup, "ytVideoAttributeViewModelSubtitle", 700);
        result.artist = result.artist ?? firstRegexGroup(
            subtitleBlock,
            /(?:ytAttributedStringLink[^>]*>|<span[^>]*>|>)([^<\n][^<]*?)(?:<|\n|$)/i
        );

        const secondaryBlock = extractNearbySection(markup, "ytVideoAttributeViewModelSecondarySubtitle", 1400);
        if (secondaryBlock) {
            const linkMatches = [...secondaryBlock.matchAll(/ytAttributedStringLink[^>]*>([^<]+)</gi)]
                .map((m) => cleanText(m[1]))
                .filter((v): v is string => Boolean(v));

            if (linkMatches.length > 0 && !result.artist) {
                result.artist = linkMatches[0];
            }
            if (linkMatches.length > 0 && !result.album) {
                result.album = linkMatches[linkMatches.length - 1];
            }

            if (!result.album) {
                result.album = firstRegexGroup(
                    secondaryBlock,
                    /(?:<span[^>]*>|>)([^<\n][^<]*?)(?:<|\n|$)/i
                );
            }
        }

        if (!result.artist) {
            const artistPatternMatch = description.match(/^Artist:\s*(.+?)(?:\n|$)/im);
            const artistValue = cleanText(artistPatternMatch?.[1]);
            if (artistValue && !/^various\s+artists?$/i.test(artistValue)) {
                result.artist = artistValue;
            }
        }

        if (!result.songTitle || (!result.album && titleFallback.artist)) {
            const songPatternMatch = description.match(/(Song|Title):\s*(.+?)(?:\n|$)/im);
            const metadataLabel = songPatternMatch?.[1]?.toLowerCase();
            const metadataValue = cleanText(songPatternMatch?.[2]);

            if (metadataLabel === "song" && !result.songTitle) {
                result.songTitle = metadataValue;
            }

            if (metadataLabel === "title") {
                if (!result.album && titleFallback.artist) {
                    result.artist = result.artist ?? titleFallback.artist;
                    result.songTitle = result.songTitle ?? titleFallback.songTitle;
                    result.album = metadataValue;
                } else if (!result.songTitle) {
                    result.songTitle = metadataValue;
                }
            }
        }

        if (!result.album) {
            const albumPatternMatch = description.match(/Album:\s*(.+?)(?:\n|$)/im);
            result.album = cleanText(albumPatternMatch?.[1]);
        }

        if (!result.album) {
            const outNowMatch = description.match(/^\s*([^\n-]{2,}?)\s*-\s*([^\n]+?)\s+IS\s+OUT\s+NOW\b[^\n]*$/im);
            if (outNowMatch) {
                outNowArtist = cleanText(outNowMatch[1]);
                result.artist = result.artist ?? outNowArtist;
                result.album = cleanText(outNowMatch[2]);
            }
        }

        if (!result.artist || !result.songTitle) {
            const trackLineMatches = [...description.matchAll(/^\s*(\d{1,2})\s*[.)-]*\s*([^\n-]+?)\s*-\s*([^\n]+?)\s*$/gim)];
            if (trackLineMatches.length > 0) {
                const titleIndex = videoTitle.match(/^\s*(\d{1,2})\b/)?.[1];
                const selected = (titleIndex
                    ? trackLineMatches.find((m) => m[1] === titleIndex)
                    : undefined) ?? trackLineMatches[0];

                const selectedArtist = cleanText(selected?.[2]);
                if (!result.artist || (outNowArtist && result.artist === outNowArtist)) {
                    result.artist = selectedArtist;
                }
                result.songTitle = result.songTitle ?? cleanText(selected?.[3]);
            }
        }

        if (result.songTitle && looksLikeMetadataNoise(result.songTitle)) {
            result.songTitle = undefined;
        }
        if (result.artist && looksLikeMetadataNoise(result.artist)) {
            result.artist = undefined;
        }
        if (result.album && looksLikeMetadataNoise(result.album)) {
            result.album = undefined;
        }

        if (result.songTitle) {
            result.songTitle = stripTrailingVideoIdToken(result.songTitle);
        }
    }

    if (!result.songTitle) {
        tryCompactTitleParse();
    }

    if (!result.songTitle) {
        const fallback = splitTitleFallback(videoTitle);
        result.artist = result.artist || fallback.artist;
        result.songTitle = fallback.songTitle;
    }

    return result;
}