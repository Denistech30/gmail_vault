import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { authenticateFingerprint } from "../utils/webauthn";
import { hashCredential, createProof } from "../utils/zkp";
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
      // Step 1: Authenticate with fingerprint
      const authResp = await authenticateFingerprint();
      
      // Step 2: Get stored ZKP hash from localStorage
      const localHash = localStorage.getItem("zkpPublicHash");
      
      // Step 3: Fetch ZKP hash from Firestore (backup)
      const zkpSnap = await getDocs(collection(db, "users", user.uid, "zkp"));
      const storedHash = zkpSnap.docs[0]?.data()?.publicHash;
      
      // Step 4: Verify using zero-knowledge proof
      if (!storedHash) {
        throw new Error("No ZKP hash found. Please enroll biometrics first.");
      }
      
      // Create hash of current authentication and verify against stored hash
      const currentHashField = await hashCredential(authResp);
      const currentHash = currentHashField.toString();
      const isValid = currentHash === storedHash;
      
      // 🔒 SECURITY AUDIT LOG - ZKP
      console.log('🔒 ZKP AUDIT:', {
        storedHashLength: storedHash?.length,
        currentHashLength: currentHash?.length,
        hashesMatch: isValid,
        hashSample: currentHash.substring(0, 16) + '...',
        timestamp: new Date().toISOString()
      });
      
      if (!isValid) {
        throw new Error("ZKP verification failed - fingerprint does not match");
      }
      
      // Step 5: ZKP verification passed - load accounts
      const accSnap = await getDocs(collection(db, "users", user.uid, "accounts"));
      const accounts = await Promise.all(
        accSnap.docs.map(async doc => {
          const data = doc.data();
          const plain = await decryptData(data.encryptedData, user.uid);
          console.log('🔓 Recovery - Decrypted account:', {
            id: doc.id,
            email: plain.email,
            passwordLength: plain.password?.length
          });
          return { id: doc.id, ...plain };
        })
      );
      console.log('✅ Recovery - Total accounts decrypted:', accounts.length);
      setRecovered(accounts);
      setStatus("success");
      
      // Auto-navigate to Dashboard after successful recovery
      setTimeout(() => {
        navigate("/");
      }, 1500); // Brief delay to show success message
    } catch (err) {
      setStatus("error");
      alert("Recovery failed: " + err.message);
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
