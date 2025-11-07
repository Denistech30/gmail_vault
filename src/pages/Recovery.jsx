import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { recoverWithFingerprint } from "../utils/fingerprintService";
import { decryptData, decryptMasterKeyWithFingerprint } from "../lib/crypto";
import { getLocalMasterKey, setLocalMasterKey } from "../utils/masterKeyStore";

export default function Recovery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const [recoveredAccounts, setRecoveredAccounts] = useState([]);

  const handleRecover = async () => {
    if (!user) {
      alert("Log in first");
      return;
    }

    setStatus("scanning");
    setErrorMessage("");

    try {
      const { success, matched, publicHash } = await recoverWithFingerprint();

      if (!success || !matched) {
        setStatus("error");
        setErrorMessage("No fingerprint match found. Re-enroll biometrics on a trusted device.");
        return;
      }

      const backupDoc = await getDoc(doc(db, "users", user.uid, "backups", "masterKey"));
      if (!backupDoc.exists()) {
        setStatus("error");
        setErrorMessage("No encrypted master key backup found. Enroll fingerprint on an original device first.");
        return;
      }

      const backupData = backupDoc.data();
      if (!backupData?.iv || !backupData?.encryptedMasterKey) {
        setStatus("error");
        setErrorMessage("Backup data is incomplete. Re-enroll fingerprint to regenerate backup.");
        return;
      }

      const masterKey = await decryptMasterKeyWithFingerprint(
        { iv: backupData.iv, encryptedMasterKey: backupData.encryptedMasterKey },
        publicHash
      );

      if (!masterKey) {
        setStatus("error");
        setErrorMessage("Failed to unwrap master key. Ensure you are using the enrolled fingerprint.");
        return;
      }

      setLocalMasterKey(masterKey);

      const accountSnap = await getDocs(collection(db, "users", user.uid, "accounts"));
      const decryptedAccounts = await Promise.all(
        accountSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const plaintext = await decryptData(masterKey, data.encryptedData);
          const parsed = JSON.parse(plaintext);
          return {
            id: docSnap.id,
            email: parsed.email,
            password: parsed.password,
            notes: parsed.notes,
            category: parsed.category,
            recoveryEmail: data.recoveryEmail,
            recoveryPhone: data.recoveryPhone,
          };
        })
      );

      setRecoveredAccounts(decryptedAccounts);
      setStatus("success");
    } catch (error) {
      console.error("Recovery error:", error);
      setStatus("error");
      setErrorMessage(error.message || "Recovery failed. Try again or re-enroll fingerprint.");
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Recover with Fingerprint</h1>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleRecover}
          disabled={status === "scanning"}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg"
        >
          {status === "scanning" ? "Scanning..." : "Recover with Fingerprint"}
        </button>

        {status === "error" && (
          <p className="text-red-600 text-center max-w-xl">{errorMessage}</p>
        )}
      </div>

      {status === "success" && (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold">Recovered Accounts</h2>
          <div className="grid gap-4">
            {recoveredAccounts.map((account) => (
              <div key={account.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="font-semibold">{account.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Category: {account.category}</p>
                <p className="mt-2"><span className="font-medium">Password:</span> {account.password}</p>
                {account.notes && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Notes: {account.notes}</p>
                )}
              </div>
            ))}
            {recoveredAccounts.length === 0 && (
              <p className="text-sm text-gray-600">No encrypted accounts stored for this user.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
