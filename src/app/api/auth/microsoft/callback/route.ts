import { NextRequest, NextResponse } from 'next/server';
import { getServerFirebase } from '@/firebase/server';
import { exchangeCodeForTokens, getMicrosoftUserInfo } from '@/services/microsoft-oauth';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Pass userId via state

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    try {
        const { firestore } = getServerFirebase();
        
        // 1. Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);
        const { access_token, refresh_token } = tokens;

        // 2. Fetch user info to get email and display name
        const userInfo = await getMicrosoftUserInfo(access_token);
        const { mail, displayName, userPrincipalName } = userInfo;
        const email = mail || userPrincipalName;

        if (!email) {
            throw new Error('Could not retrieve email from Microsoft profile');
        }

        // 3. Store in Firestore under the user's integrations.microsoftAccounts
        const userRef = firestore.collection('users').doc(state);
        const emailKey = email.replace(/\./g, '_');

        await userRef.set({
            integrations: {
                microsoftAccounts: {
                    [emailKey]: {
                        email: email,
                        displayName: displayName || email,
                        refreshToken: refresh_token,
                        status: 'connected',
                        lastSync: new Date()
                    }
                }
            }
        }, { merge: true });

        // 4. Close the popup and notify the opener
        return new NextResponse(`
            <html>
                <body>
                    <script>
                        window.opener.postMessage({ 
                            type: 'MS_AUTH_SUCCESS', 
                            email: '${email}' 
                        }, window.location.origin);
                        window.close();
                    </script>
                    <p>Authentication successful! Closing window...</p>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (error: any) {
        console.error('Microsoft OAuth Callback Error:', error);
        return new NextResponse(`
            <html>
                <body>
                    <script>
                        window.opener.postMessage({ 
                            type: 'MS_AUTH_ERROR', 
                            message: '${error.message}' 
                        }, window.location.origin);
                        window.close();
                    </script>
                    <p>Authentication failed: ${error.message}</p>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}
