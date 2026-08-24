import { Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';
export type FirebaseAppGetter = () => admin.app.App;

let app: admin.app.App | undefined;

// Lazy singleton: constructing the credential parses the private key
// immediately, which would crash the whole Nest app at bootstrap if Firebase
// isn't configured yet (this provider is eagerly instantiated via DI). Only
// call this from inside a request — e.g. the auth guard — never at wiring time.
function getFirebaseApp(): admin.app.App {
  if (!app) {
    app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // .env stores literal "\n" sequences inside a quoted string; turn them back into real newlines.
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
  }
  return app;
}

export const firebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  useValue: getFirebaseApp,
};
