import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { authenticateFingerprint } from "../utils/webauthn";
import { hashCredential } from "../utils/zkp";
import { decryptData } from "../utils/decrypt";
import { useAuth } from "../contexts/AuthContext";

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

      if (!storedHash) {
        throw new Error("No ZKP hash found. Enroll biometrics first.");
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
          const plain = await decryptData(data.encryptedData, user.uid);
          return { id: doc.id, ...plain };
        })
      );

      setRecovered(accounts);
      setStatus("success");

      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setStatus("error");
      alert("Recovery failed: " + (err.message || "Unknown error"));
      console.error('Recovery error:', err);
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
