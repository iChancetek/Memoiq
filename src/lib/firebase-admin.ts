import * as admin from 'firebase-admin';

// Attempt to load the service account from an environment variable.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

// Initialize the Firebase Admin SDK.
// If the service account environment variable is not set, it will attempt to use
// Application Default Credentials, which is the standard for managed environments.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
  });
}

export const adminApp = admin.apps[0] || admin.initializeApp();
