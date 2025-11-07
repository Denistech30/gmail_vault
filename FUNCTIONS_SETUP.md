# Firebase Functions Setup (Gmail Vault FMZR Backend)

This repository currently includes a Firebase Functions foundation in `functions/`, but it is **not yet linked** to a Firebase project. Follow these steps to configure and test it locally.

## 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

## 2. Authenticate with Firebase

```bash
firebase login
```

## 3. Initialize Firebase for this repo

```bash
firebase init functions
```

- Choose your Firebase project (or create a new one).
- When prompted for the functions directory, enter `functions`.
- Do **not** overwrite existing files; merge the configuration as needed.

## 4. Install backend dependencies

```bash
cd functions
npm install
```

## 5. Run the local emulator suite

```bash
npm run emulate
# or
npx firebase emulators:start --only functions,firestore,auth
```

Once running, test the health-check endpoint:

```
http://localhost:5001/<your-project-id>/us-central1/api/status
```

## 6. Deploy (later, when ready)

```bash
firebase deploy --only functions
```

> ⚠️ Only deploy once you have verified the emulator output and linked the correct Firebase project.
