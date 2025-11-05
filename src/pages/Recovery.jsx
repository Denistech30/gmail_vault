import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { authenticateFingerprint } from "../utils/webauthn";
import { hashCredential } from "../utils/zkp";
import { decryptData } from "../utils/decrypt";
import { sendSignInLinkToEmail } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import CryptoJS from "crypto-js";
import { setMasterKey } from "../utils/masterKey";

export default function Recovery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("ready");
  const [recovered, setRecovered] = useState([]);

  const handleRecover = async () => {
    if (!user) return alert("Log in first");

    setStatus("scanning");
    try {
      const authResp = await authenticateFingerprint();

      const localHash = localStorage.getItem("zkpPublicHash");
      const zkpSnap = await getDocs(collection(db, "users", user.uid, "zkp"));
      const storedHash = zkpSnap.docs[0]?.data()?.publicHash;

      if (!storedHash || !localHash) {
        throw new Error("ZKP hash missing");
      }

      const currentHashField = await hashCredential(authResp);
      const currentHash = currentHashField.toString();
      const isValid = currentHash === storedHash;

      console.log('ZKP AUDIT:', { isValid, currentHash: currentHash.slice(0, 16) + '...' });

      if (!isValid) {
        throw new Error("ZKP verification failed - fingerprint does not match");
      }

      const accSnap = await getDocs(collection(db, "users", user.uid, "accounts"));
      const accounts = await Promise.all(
        accSnap.docs.map(async doc => {
          const data = doc.data();
          const plain = await decryptData(data.encryptedData);
          return { id: doc.id, ...plain };
        })
      );

      setRecovered(accounts);
      setStatus("success");

      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setStatus("error");
      console.error('Recovery error:', err);

      if (err.message?.includes('ZKP')) {
        const email = prompt("Fingerprint check failed. Enter email to receive a verification link.");
        if (!email) {
          const phrase = prompt("No email provided. Enter recovery phrase.");
          if (!phrase) {
            alert("Recovery cancelled. Email or phrase required.");
            return;
          }

          try {
            const backupKey = CryptoJS.PBKDF2(phrase, user.uid, { keySize: 8, iterations: 1000 }).toString();
            const backupDoc = await getDoc(doc(db, "users", user.uid));
            const encryptedBackup = backupDoc.data()?.encryptedBackup;
            if (!encryptedBackup) {
              throw new Error("No backup found for this user.");
            }

            const decryptedBytes = CryptoJS.AES.decrypt(encryptedBackup, backupKey);
            const masterKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
            if (!masterKey) {
              throw new Error("Invalid recovery phrase.");
            }

            setMasterKey(masterKey);
            alert("Recovery phrase accepted. Retry fingerprint to restore vault.");
            return;
          } catch (phraseErr) {
            console.error('Phrase recovery error:', phraseErr);
            alert("Recovery phrase failed: " + phraseErr.message);
            return;
          }
        }

        try {
          await sendSignInLinkToEmail(auth, email, {
            url: window.location.href,
            handleCodeInApp: true,
          });
          alert("Check your email for a verification link.");
        } catch (linkErr) {
          console.error('Email link error:', linkErr);
          alert("Failed to send email link: " + linkErr.message);
        }
      }

      alert("Recovery failed: " + err.message + "\n\n" +
        "Tip: Ensure device has screen lock and biometrics enabled.");
    }
  };

  if (status === "success") {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Recovery Complete!</h1>
        <div className="space-y-4">
          {recovered.map(a => (
            <div key={a.id} className="p-4 border rounded">
              <p><strong>{a.email}</strong></p>
              <p>Password: {a.password}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Recover with Fingerprint</h1>
      <button
        onClick={handleRecover}
        disabled={status === "scanning"}
        className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg"
      >
        {status === "scanning" ? "Scanning..." : "Scan Finger"}
      </button>
      {status === "error" && <p className="text-red-600 mt-4">Failed. Try again.</p>}
    </div>
  );
}
