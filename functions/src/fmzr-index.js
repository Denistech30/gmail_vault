/*
 * FMZR Backend Foundation for Gmail Vault
 * --------------------------------------------------------------
 * This Express app is mounted as a Firebase Cloud Function.
 * - Initializes firebase-admin using default credentials.
 * - Enables CORS + JSON body parsing for REST-style endpoints.
 * - Exposes a `/status` health-check route to confirm deployment.
 *
 * TODO (Step 2+): Add WebAuthn enrollment/authentication routes
 * that interact with Firestore or other services.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize the Firebase Admin SDK once per runtime instance.
// Uses service account credentials when deployed and emulator creds locally.
admin.initializeApp();

// Create an Express app to host REST endpoints.
const app = express();

// Apply middleware:
// - cors(): allow cross-origin requests from the PWA during development.
// - express.json(): parse incoming JSON bodies.
app.use(cors());
app.use(express.json());

// Health-check endpoint to verify the backend is reachable.
app.get('/status', (_req, res) => {
  res.json({ success: true, message: 'FMZR backend running' });
});

/*
 * Placeholder example for future WebAuthn routes.
 * app.post('/webauthn/register', async (req, res) => {
 *   // TODO: Issue challenge, persist registration data, etc.
 * });
 */

// Export the Express app as a Firebase HTTPS Cloud Function.
exports.api = functions.https.onRequest(app);
