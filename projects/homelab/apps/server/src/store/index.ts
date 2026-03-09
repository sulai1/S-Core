
export let cachedToken: { token: string; expiresAt: number };

export async function getValidToken(
    identity: string,
    secret: string,
    postTokens: any
): Promise<{ token: string; expiresAt: number }> {
    const now = Date.now();
    console.log('[TOKEN] get');

    // Return cached token if still valid (refresh 5 minutes before expiry)
    if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
        console.log('[TOKEN] Using cached token');
        return cachedToken;
    }

    try {
        console.log('[TOKEN] Generating new token');
        const response = await postTokens({
            identity: identity,
            secret: secret
        });
        if (!response.ok) {
            throw new Error(`Token generation failed: ${response.status}`);
        }

        const token = response.data.token;

        // Cache token for 1 hour
        cachedToken = {
            token,
            expiresAt: now + 60 * 60 * 1000
        };

        console.log('[TOKEN] New token cached');
        return token;
    } catch (error) {
        console.error('[TOKEN] Error generating token:', error);
        throw error;
    }
}
