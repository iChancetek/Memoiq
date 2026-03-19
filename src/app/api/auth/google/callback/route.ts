import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/services/google-oauth';
import { getServerFirebase } from '@/firebase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // State will contain our userId

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    try {
        const userId = state;
        const tokens = await exchangeCodeForTokens(code);
        const userInfo = await getGoogleUserInfo(tokens.access_token);

        const { firestore } = getServerFirebase();
        const userRef = firestore.collection('users').doc(userId);

        const accountData = {
            email: userInfo.email,
            displayName: userInfo.name || userInfo.email,
            photoURL: userInfo.picture || '',
            refreshToken: tokens.refresh_token,
            status: 'connected',
            lastSync: new Date(),
        };

        // Update the user document with the new Google account
        // We use dot notation for nested objects in firestore to avoid overwriting the whole integrations object
        await userRef.update({
            [`integrations.googleAccounts.${userInfo.email.replace(/\./g, '_')}`]: accountData
        });

        // Return a script to close the popup and notify the parent
        return new NextResponse(
            `<html>
                <body>
                    <script>
                        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', email: '${userInfo.email}' }, '*');
                        window.close();
                    </script>
                    <p>Successfully connected! This window will close automatically.</p>
                </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
        );
    } catch (error: any) {
        console.error('OAuth Callback Error:', error);
        return new NextResponse(
            `<html>
                <body>
                    <script>
                        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: '${error.message}' }, '*');
                    </script>
                    <p>Error: ${error.message}</p>
                </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
        );
    }
}
