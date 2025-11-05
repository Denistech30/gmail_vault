"use client"

import { useState } from "react"
import Button from "../components/Button"
import { useAuth } from "../contexts/AuthContext"
import { enrollFingerprint } from "../utils/webauthn"
import { collection, addDoc, doc, setDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { splitIntoShards, encryptShard } from "../utils/shard"
import { hashCredential } from "../utils/zkp"
import { ensureMasterKey } from "../utils/masterKey"
import bip39 from "bip39"
import CryptoJS from "crypto-js"

export default function Settings({ darkMode, toggleDarkMode }) {
  const [biometricsEnabled, setBiometricsEnabled] = useState(localStorage.getItem("biometricsEnabled") === "true")
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Firebase Auth state
  const { user, signIn, register, signOut } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [authFormData, setAuthFormData] = useState({ email: '', password: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  const handleBiometricsToggle = () => {
    const newValue = !biometricsEnabled
    setBiometricsEnabled(newValue)
    localStorage.setItem("biometricsEnabled", newValue.toString())
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleEnroll = async () => {
    if (!user) {
      alert("Please log in first to enroll biometrics");
      return;
    }

    try {
      const cred = await enrollFingerprint();
      localStorage.setItem("fingerprintCred", JSON.stringify(cred));
      
      const publicHashField = await hashCredential(cred);
      const publicHash = publicHashField.toString();
      localStorage.setItem("zkpPublicHash", publicHash);
      
      await addDoc(collection(db, "users", user.uid, "zkp"), { publicHash });
      
      const { shard1, shard2 } = splitIntoShards(cred);
      const key = CryptoJS.lib.WordArray.random(32).toString();
      localStorage.setItem("shardKey", key);

      await addDoc(collection(db, "users", user.uid, "shards"), {
        shard: encryptShard(shard1, key),
        index: 0
      });
      await addDoc(collection(db, "users", user.uid, "shards"), {
        shard: encryptShard(shard2, key),
        index: 1
      });

      const masterKey = ensureMasterKey();
      const phrase = bip39.generateMnemonic();
      alert("RECOVERY PHRASE:\n\n" + phrase + "\n\nWrite this down — use if email lost.");

      const backupKey = CryptoJS.PBKDF2(phrase, user.uid, { keySize: 8, iterations: 1000 }).toString();
      const encryptedMasterKey = CryptoJS.AES.encrypt(masterKey, backupKey).toString();

      await setDoc(doc(db, "users", user.uid), { encryptedBackup: encryptedMasterKey }, { merge: true });

      setBiometricsEnabled(true);
      localStorage.setItem("biometricsEnabled", "true");
      
      alert("Enrollment complete!\n\nFingerprint enrolled\nZKP hash saved\nShards saved to cloud");
    } catch (err) {
      console.error('Enrollment error:', err);
      alert("Enrollment failed: " + err.message + "\n\n" +
        "Tip: Ensure device has screen lock and biometrics enabled.");
    }
  };

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      localStorage.removeItem("accounts")
      localStorage.removeItem("biometricsEnabled")
      window.location.reload()
    }
  }

  // Firebase Auth handlers
  const handleAuthFormChange = (e) => {
    setAuthFormData({
      ...authFormData,
      [e.target.name]: e.target.value
    })
    setAuthError('')
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    setAuthSuccess('')

    try {
      const result = isLogin 
        ? await signIn(authFormData.email, authFormData.password)
        : await register(authFormData.email, authFormData.password)

      if (result.success) {
        setAuthSuccess(`Successfully ${isLogin ? 'logged in' : 'registered'}! User ID: ${result.user?.uid}`)
        setAuthFormData({ email: '', password: '' })
        setTimeout(() => setAuthSuccess(''), 5000)
      } else {
        setAuthError(result.error)
      }
    } catch (error) {
      setAuthError('An unexpected error occurred')
    }
    
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    setAuthLoading(true)
    const result = await signOut()
    if (result.success) {
      setAuthSuccess('Successfully logged out!')
      setTimeout(() => setAuthSuccess(''), 3000)
    } else {
      setAuthError(result.error)
    }
    setAuthLoading(false)
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setAuthError('')
    setAuthSuccess('')
    setAuthFormData({ email: '', password: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toggle dark mode theme</p>
              </div>
              <button
                onClick={toggleDarkMode}
                role="switch"
                aria-checked={darkMode}
                aria-label="Toggle dark mode"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Firebase Authentication */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Firebase Authentication</h2>
            
            {user ? (
              // User is logged in
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-green-900 dark:text-green-400">Logged in</span>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-300 mb-1"><span className="font-medium">Email:</span> {user.email}</p>
                  <p className="text-xs text-green-700 dark:text-green-400 font-mono"><span className="font-medium">User ID:</span> {user.uid}</p>
                </div>
                
                <Button 
                  variant="danger" 
                  onClick={handleSignOut}
                  disabled={authLoading}
                  className="w-full sm:w-auto"
                >
                  {authLoading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            ) : (
              // User is not logged in - show login form
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Success/Error Messages */}
                {authSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-800 dark:text-green-300">{authSuccess}</span>
                    </div>
                  </div>
                )}
                
                {authError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-red-800 dark:text-red-300">{authError}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="auth-email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Email
                    </label>
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      value={authFormData.email}
                      onChange={handleAuthFormChange}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="auth-password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Password
                    </label>
                    <input
                      id="auth-password"
                      name="password"
                      type="password"
                      value={authFormData.password}
                      onChange={handleAuthFormChange}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={authLoading}
                    className="w-full"
                  >
                    {authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={toggleAuthMode}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {isLogin ? 'Need an account? Sign up' : 'Have an account? Sign in'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Biometric Authentication</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable fingerprint for account recovery</p>
                </div>
                <button
                  onClick={handleBiometricsToggle}
                  role="switch"
                  aria-checked={biometricsEnabled}
                  aria-label="Toggle biometric authentication"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    biometricsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      biometricsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Enrollment Button */}
              <div className="pt-4">
                <Button 
                  onClick={handleEnroll} 
                  disabled={biometricsEnabled || !user}
                  className="w-full sm:w-auto"
                >
                  {biometricsEnabled ? "✓ Enrolled" : "Enroll Fingerprint"}
                </Button>
                {!user && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Please log in to enroll biometrics</p>
                )}
              </div>
              
              {showSuccess && (
                <div role="status" className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-300">
                  ✓ Biometric settings updated successfully
                </div>
              )}
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Management</h2>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Clear all stored accounts and settings. This action cannot be undone.</p>
              <Button variant="danger" onClick={clearAllData}>
                Clear All Data
              </Button>
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400"><span className="font-medium text-gray-900 dark:text-white">Version:</span> 1.0.0</p>
              <p className="text-gray-600 dark:text-gray-400"><span className="font-medium text-gray-900 dark:text-white">App:</span> Gmail Vault</p>
              <p className="text-gray-600 dark:text-gray-400"><span className="font-medium text-gray-900 dark:text-white">Description:</span> Secure Gmail account manager with biometric recovery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
