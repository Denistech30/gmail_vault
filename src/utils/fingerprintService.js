/**
 * Fingerprint service bridging browser WebAuthn credentials with Firebase.
 * Only hashed representations of credentials are sent to the backend; no raw
 * biometric identifiers or private data leave the device. Hashes should remain
 * compatible with zero-knowledge proof (ZKP) verification in the FMZR backend.
 */

import "../firebase/config"; // Ensures the shared Firebase app is initialized once
import { startFingerprintEnrollment, verifyFingerprint } from "./webauthnClient";
import { hashCredential } from "./zkp";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, setDoc } from "firebase/firestore";

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function serializeCredential(credential) {
  if (!credential) return null;

  const { response } = credential;
  const serializedResponse = {};

  if (response?.clientDataJSON) {
    serializedResponse.clientDataJSON = bufferToBase64Url(response.clientDataJSON);
  }
  if (response?.attestationObject) {
    serializedResponse.attestationObject = bufferToBase64Url(response.attestationObject);
  }
  if (response?.authenticatorData) {
    serializedResponse.authenticatorData = bufferToBase64Url(response.authenticatorData);
  }
  if (response?.signature) {
    serializedResponse.signature = bufferToBase64Url(response.signature);
  }
  if (response?.userHandle) {
    serializedResponse.userHandle = bufferToBase64Url(response.userHandle);
  }

  return {
    id: credential.id,
    type: credential.type,
    rawId: credential.rawId ? bufferToBase64Url(credential.rawId) : undefined,
    response: serializedResponse,
    clientExtensionResults: credential.getClientExtensionResults
      ? credential.getClientExtensionResults()
      : {},
  };
}

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
    const serialized = serializeCredential(credential);
    const hashField = await hashCredential(serialized);
    const publicHash = hashField.toString();

    const functions = getFunctions();
    const registerFingerprint = httpsCallable(functions, "registerFingerprint");
    const response = await registerFingerprint({ userId, publicHash });

    const db = getFirestore();
    await setDoc(doc(db, "fingerprints", userId), {
      publicHash,
      updatedAt: Date.now(),
    });

    return { ...response.data, publicHash };
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
    const serialized = serializeCredential(assertion);
    const hashField = await hashCredential(serialized);
    const publicHash = hashField.toString();

    const functions = getFunctions();
    const verifyFingerprintFn = httpsCallable(functions, "verifyFingerprint");
    const response = await verifyFingerprintFn({ publicHash });

    return { ...response.data, publicHash, assertion: serialized };
  } catch (err) {
    console.error("❌ Fingerprint recovery failed:", err);
    throw err;
  }
}
