/**
 * Fingerprint service bridging browser WebAuthn credentials with Firebase.
 * Only hashed representations of credentials are sent to the backend; no raw
 * biometric identifiers or private data leave the device. Hashes should remain
 * compatible with zero-knowledge proof (ZKP) verification in the FMZR backend.
 */

import "@/firebase/config"; // Ensures the shared Firebase app is initialized once
import { startFingerprintEnrollment, verifyFingerprint } from "@/utils/webauthnClient";
import { hashCredential } from "@/utils/cryptoUtils";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, setDoc } from "firebase/firestore";

/**
 * Enrolls the current user by generating a platform credential via WebAuthn,
 * hashing the serialized response, and forwarding that hash to both Firebase
 * Functions (for backend persistence) and Firestore (for local caching).
 *
 * @param {string} userId - Firebase Auth user ID of the active user session.
 * @returns {Promise<any>} Response payload from the `registerFingerprint` Cloud Function.
 */
export async function enrollUserFingerprint(userId) {
  try {
    const credential = await startFingerprintEnrollment();
    const json = JSON.stringify(credential);
    const hash = await hashCredential(json);

    const functions = getFunctions();
    const registerFingerprint = httpsCallable(functions, "registerFingerprint");
    const response = await registerFingerprint({ userId, publicHash: hash });

    const db = getFirestore();
    await setDoc(doc(db, "fingerprints", userId), {
      publicHash: hash,
      updatedAt: Date.now(),
    });

    return response.data;
  } catch (err) {
    console.error("❌ Fingerprint enrollment failed:", err);
    throw err;
  }
}

/**
 * Attempts recovery by requesting a WebAuthn assertion, hashing the result,
 * and delegating verification to the backend. Only the derived hash travels
 * over the network, safeguarding biometric material while enabling ZKP checks.
 *
 * @returns {Promise<any>} Response payload from the `verifyFingerprint` Cloud Function.
 */
export async function recoverWithFingerprint() {
  try {
    const assertion = await verifyFingerprint();
    const json = JSON.stringify(assertion);
    const hash = await hashCredential(json);

    const functions = getFunctions();
    const verifyFingerprintFn = httpsCallable(functions, "verifyFingerprint");
    const response = await verifyFingerprintFn({ publicHash: hash });

    return response.data;
  } catch (err) {
    console.error("❌ Fingerprint recovery failed:", err);
    throw err;
  }
}
