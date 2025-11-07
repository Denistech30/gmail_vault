# Gmail Vault – FMZR Functions Backend

This directory contains the Firebase Functions foundation for WebAuthn / biometric recovery.

## Getting Started

```bash
cd functions
npm install
```

## Local Emulation

```bash
# Start Functions + Firestore + Auth emulators
npm run emulate
# or
npx firebase emulators:start --only functions,firestore,auth
```

The Express app is deployed as `functions.https.onRequest(app)`. When running locally, the `/status` route will be accessible via the emulator, typically:

```
http://localhost:5001/<project-id>/us-central1/api/status
```

Check the emulator logs for the exact host/port if unsure.

### Testing callable WebAuthn helpers

```js
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const register = httpsCallable(functions, "registerFingerprint");
await register({ publicHash: "<hex-or-base64-hash>" });

const verify = httpsCallable(functions, "verifyFingerprint");
const result = await verify({ publicHash: "<hash-from-client>" });
console.log(result.data); // { success: true, matched: true/false }
```

- Caller must be authenticated via Firebase Auth (email link, password, etc.).
- Fingerprint hashes are stored under `users/{uid}/fingerprint` in Firestore.

## Deployment

Once logged into Firebase and linked to a project:

```bash
firebase deploy --only functions
```

> ⚠️ Deployment is not automatic. Link this project with `firebase init functions` first. See `FUNCTIONS_SETUP.md` in the repo root for full instructions.
