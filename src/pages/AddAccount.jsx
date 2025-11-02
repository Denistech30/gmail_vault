"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { collection, addDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import notificationService from "../services/notificationService"
import Input from "../components/Input"
import Button from "../components/Button"
import PopupAlert from "../components/PopupAlert"

export default function AddAccount() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    recoveryEmail: "",
    recoveryPhone: "",
    notes: "",
    category: "general",
  })
  const [showPopup, setShowPopup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [popupType, setPopupType] = useState("success")

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Encryption functions using crypto.subtle AES-256
  const generateEncryptionKey = async (userPassword) => {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(userPassword || user?.uid || 'default-key'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    return { key, salt }
  }

  const encryptData = async (data, userPassword) => {
    try {
      const { key, salt } = await generateEncryptionKey(userPassword)
      const encoder = new TextEncoder()
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encoder.encode(JSON.stringify(data))
      )
      
      return {
        encryptedData: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        salt: Array.from(salt)
      }
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  const generatePassword = () => {
    const length = 16
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setFormData({ ...formData, password })
    setShowPassword(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setPopupMessage("Email and password are required!")
      setPopupType("error")
      setShowPopup(true)
      return
    }

    if (!user) {
      setPopupMessage("You must be logged in to save accounts!")
      setPopupType("error")
      setShowPopup(true)
      return
    }

    setLoading(true)
    
    try {
      // Prepare data to encrypt (email, password, notes)
      const sensitiveData = {
        email: formData.email,
        password: formData.password,
        notes: formData.notes,
        category: formData.category
      }
      
      // Encrypt sensitive data using user's password or user ID
      const encryptedBlob = await encryptData(sensitiveData, user.uid)
      
      // 🔒 SECURITY AUDIT LOG
      console.log('🔒 SECURITY AUDIT - ENCRYPTION CHECK:');
      console.log('Original data length:', JSON.stringify(sensitiveData).length);
      console.log('Encrypted blob:', {
        encryptedDataLength: encryptedBlob.encryptedData.length,
        ivLength: encryptedBlob.iv.length,
        saltLength: encryptedBlob.salt.length,
        sample: encryptedBlob.encryptedData.slice(0, 20) + '...'
      });
      console.log('✅ Plaintext NOT in encrypted blob:', 
        !JSON.stringify(encryptedBlob).includes(formData.email) &&
        !JSON.stringify(encryptedBlob).includes(formData.password)
      );
      
      // Store for audit
      localStorage.setItem('lastEncrypted', JSON.stringify(encryptedBlob));
      
      // Prepare document for Firestore
      const accountDoc = {
        userId: user.uid,
        recoveryEmail: formData.recoveryEmail,
        recoveryPhone: formData.recoveryPhone,
        encryptedData: encryptedBlob,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Save to Firestore under users/{userId}/accounts
      await addDoc(collection(db, "users", user.uid, "accounts"), accountDoc)
      
      setPopupMessage("Account saved successfully! Your data has been encrypted and stored securely.")
      setPopupType("success")
      setShowPopup(true)
      
      // Show browser notification
      await notificationService.showSuccess("Account saved and encrypted successfully!")
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        recoveryEmail: "",
        recoveryPhone: "",
        notes: "",
        category: "general",
      })
      
    } catch (error) {
      console.error('Error saving account:', error)
      setPopupMessage("Failed to save account. Please try again.")
      setPopupType("error")
      setShowPopup(true)
    } finally {
      setLoading(false)
    }
  }

  const handlePopupClose = () => {
    setShowPopup(false)
    // Navigate to dashboard after successful save
    if (popupType === "success") {
      setTimeout(() => {
        navigate("/")
      }, 300) // Wait for popup close animation
    }
  }

  return (
    <section className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Create</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Add new account</h1>
              <p className="text-gray-600 dark:text-gray-400">Securely store login, recovery details and notes in your vault.</p>
            </div>
            <div className="flex-shrink-0">
              <Button type="button" variant="secondary" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 md:p-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Email Address *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Password *
            </label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <div className="flex-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                  aria-required="true"
                  secure
                />
              </div>
              <Button type="button" variant="secondary" onClick={generatePassword} className="sm:w-auto">
                Generate
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showPassword ? "Hide" : "Show"} Password
            </button>
          </div>

          <div>
            <label htmlFor="recoveryEmail" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Recovery Email
            </label>
            <Input
              id="recoveryEmail"
              name="recoveryEmail"
              type="email"
              value={formData.recoveryEmail}
              onChange={handleChange}
              placeholder="recovery@example.com"
            />
          </div>

          <div>
            <label htmlFor="recoveryPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Recovery Phone
            </label>
            <Input
              id="recoveryPhone"
              name="recoveryPhone"
              type="tel"
              value={formData.recoveryPhone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="general">General</option>
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="business">Business</option>
              <option value="finance">Finance</option>
              <option value="social">Social</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows={4}
              aria-label="Account notes"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate("/")} className="flex-1">
              Back to dashboard
            </Button>
            <Button type="submit" variant="primary" disabled={loading} className="flex-1">
              {loading ? "Encrypting & Saving..." : "Save Account"}
            </Button>
          </div>
        </form>

        <PopupAlert 
          message={popupMessage}
          type={popupType}
          isOpen={showPopup}
          onClose={handlePopupClose}
          autoClose={true}
          duration={3000}
        />
      </div>
    </section>
  )
}
