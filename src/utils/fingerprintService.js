/**
 * Fingerprint service bridging browser WebAuthn credentials with Firebase.
 * Only hashed representations of credentials are sent to the backend; no raw
 * biometric identifiers or private data leave the device. Hashes should remain
 * compatible with zero-knowledge proof (ZKP) verification in the FMZR backend.
 */

import "../firebase/config"; // Ensures the shared Firebase app is initialized once
import { getAuth } from "firebase/auth";
import { startFingerprintEnrollment, verifyFingerprint } from "./webauthnClient";
import { hashCredential } from "./zkp";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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
    let response;
    try {
      response = await registerFingerprint({ userId, publicHash });
    } catch (fnErr) {
      console.warn("registerFingerprint callable failed, falling back to client persistence", fnErr);
      response = { data: { success: false, fallback: true } };
    }

    const db = getFirestore();
    await setDoc(doc(db, "users", userId, "fingerprint", "primary"), {
      publicHash,
      updatedAt: Date.now(),
    });

    return { ...response.data, publicHash, serializedCredential: serialized };
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
export async function recoverWithFingerprint(passedUserId) {
  try {
    const assertion = await verifyFingerprint();
    const serialized = serializeCredential(assertion);
    const hashField = await hashCredential(serialized);
    const publicHash = hashField.toString();

    const functions = getFunctions();
    const verifyFingerprintFn = httpsCallable(functions, "verifyFingerprint");
    let response;
    try {
      response = await verifyFingerprintFn({ publicHash });
    } catch (fnErr) {
      console.warn("verifyFingerprint callable failed, falling back to client verification", fnErr);
      response = { data: { success: false, matched: false, fallback: true } };
    }

    let matched = Boolean(response?.data?.matched);
    let success = Boolean(response?.data?.success !== false);

    if (!matched) {
      const auth = getAuth();
      const userId = passedUserId || auth.currentUser?.uid;
      if (userId) {
        try {
          const db = getFirestore();
          const snapshot = await getDoc(doc(db, "users", userId, "fingerprint", "primary"));
          if (snapshot.exists()) {
            const storedHash = snapshot.get("publicHash");
            matched = storedHash === publicHash;
            success = success || matched;
          }
        } catch (fallbackErr) {
          console.warn("Client fingerprint fallback failed", fallbackErr);
        }
      }
    }

    return { success, matched, publicHash, assertion: serialized };
  } catch (err) {
    console.error("❌ Fingerprint recovery failed:", err);
    throw err;
  }
}
