export const extractVideoId = (input: string): string => {
    const value = input.trim();
    if (!value) {
        return '';
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
        return value;
    }

    try {
        const url = new URL(value);
        const fromV = url.searchParams.get('v');
        if (fromV && /^[a-zA-Z0-9_-]{11}$/.test(fromV)) {
            return fromV;
        }

        const segments = url.pathname.split('/').filter(Boolean);
        const last = segments.at(-1) ?? '';
        if (/^[a-zA-Z0-9_-]{11}$/.test(last)) {
            return last;
        }
    } catch {
        return '';
    }

    return '';
};
