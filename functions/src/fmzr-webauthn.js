/*
 * FMZR WebAuthn Callable Functions for Gmail Vault
 * ------------------------------------------------
 * Security/Privacy: Stores ONLY a zero-knowledge compatible publicHash of the
 * credential. No raw biometric templates or credential material leave the
 * device. Callable endpoints require Firebase Auth (context.auth) and will be
 * extended later with attestation validation & credential ID storage.
 *
 * TODO: Persist credential IDs + attestation data and integrate with ZKP flows.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize the Admin SDK exactly once (emulator-safe guard).
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Utility validator to ensure the hash looks like base64/base64url/hex.
const HASH_REGEX = /^[A-Fa-f0-9]+$|^[A-Za-z0-9_\-]+=*$/;

/**
 * Registers the caller's fingerprint hash in Firestore.
 * Expects data.publicHash and requires an authenticated Firebase user.
 */
async function registerFingerprint(data, context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const publicHash = data?.publicHash;
  if (typeof publicHash !== 'string' || !publicHash || !HASH_REGEX.test(publicHash)) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid publicHash string is required.');
  }

  const uid = context.auth.uid;

  try {
    const docRef = db.collection('users').doc(uid).collection('fingerprint').doc('primary');
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await docRef.set({
      publicHash,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { success: true, message: 'Fingerprint registered' };
  } catch (err) {
    console.error('registerFingerprint error:', err);
    throw new functions.https.HttpsError('internal', 'Failed to register fingerprint');
  }
}

/**
 * Verifies the provided publicHash against Firestore.
 * Returns matched: true when the hashes align; otherwise matched: false.
 */
async function verifyFingerprint(data, context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const publicHash = data?.publicHash;
  if (typeof publicHash !== 'string' || !publicHash || !HASH_REGEX.test(publicHash)) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid publicHash string is required.');
  }

  const uid = context.auth.uid;

  try {
    const docRef = db.collection('users').doc(uid).collection('fingerprint').doc('primary');
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return { success: true, matched: false };
    }

    const storedHash = snapshot.get('publicHash');
    const matched = storedHash === publicHash;

    return { success: true, matched };
  } catch (err) {
    console.error('verifyFingerprint error:', err);
    throw new functions.https.HttpsError('internal', 'Failed to verify fingerprint');
  }
}

// Export callable HTTPS functions (non-destructive alongside existing entrypoints).
exports.registerFingerprint = functions.https.onCall(registerFingerprint);
exports.verifyFingerprint = functions.https.onCall(verifyFingerprint);
