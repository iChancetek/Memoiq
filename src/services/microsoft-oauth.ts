
import { getServerFirebase } from '@/firebase/server';

const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`;

/**
 * Returns the Microsoft OAuth 2.0 authorization URL.
 */
export function getMicrosoftAuthUrl(state: string) {
    const scopes = [
        'openid',
        'profile',
        'email',
        'offline_access',
        'Mail.ReadWrite',
        'Calendars.ReadWrite',
        'Contacts.ReadWrite',
    ];

    const params = new URLSearchParams({
        client_id: CLIENT_ID!,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        response_mode: 'query',
        scope: scopes.join(' '),
        state: state, // used to pass userId
        prompt: 'consent',
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchanges the authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to exchange code: ${JSON.stringify(error)}`);
    }

    return response.json();
}

/**
 * Uses a refresh token to obtain a new access token.
 */
export async function getNewAccessToken(refreshToken: string) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to refresh token: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Fetches the user's Microsoft profile information.
 */
export async function getMicrosoftUserInfo(accessToken: string) {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Microsoft user info');
    }

    return response.json();
}
