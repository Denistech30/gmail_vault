"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import { decryptData } from "../utils/decrypt"
import notificationService from "../services/notificationService"
import Input from "../components/Input"
import Button from "../components/Button"
import PopupAlert from "../components/PopupAlert"

export default function EditAccount() {
  const { id } = useParams()
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
  const [loadingAccount, setLoadingAccount] = useState(true)
  const [popupMessage, setPopupMessage] = useState("")
  const [popupType, setPopupType] = useState("success")

  // Load existing account data
  useEffect(() => {
    const loadAccount = async () => {
      if (!user || !id) return

      try {
        const docRef = doc(db, "users", user.uid, "accounts", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          const decrypted = await decryptData(data.encryptedData, user.uid)
          
          setFormData({
            email: decrypted.email || "",
            password: decrypted.password || "",
            recoveryEmail: data.recoveryEmail || "",
            recoveryPhone: data.recoveryPhone || "",
            notes: decrypted.notes || "",
            category: decrypted.category || "general",
          })
        } else {
          setPopupMessage("Account not found")
          setPopupType("error")
          setShowPopup(true)
        }
      } catch (error) {
        console.error('Error loading account:', error)
        setPopupMessage("Failed to load account")
        setPopupType("error")
        setShowPopup(true)
      } finally {
        setLoadingAccount(false)
      }
    }

    loadAccount()
  }, [user, id])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Encryption functions
  const generateEncryptionKey = async (userPassword) => {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(userPassword),
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
    
    if (!user) {
      setPopupMessage("Please log in to update account")
      setPopupType("error")
      setShowPopup(true)
      return
    }

    setLoading(true)

    try {
      // Encrypt sensitive data
      const dataToEncrypt = {
        email: formData.email,
        password: formData.password,
        notes: formData.notes,
        category: formData.category,
      }

      const encryptedData = await encryptData(dataToEncrypt, user.uid)

      // Update in Firestore
      const docRef = doc(db, "users", user.uid, "accounts", id)
      await updateDoc(docRef, {
        encryptedData,
        recoveryEmail: formData.recoveryEmail,
        recoveryPhone: formData.recoveryPhone,
        updatedAt: new Date().toISOString(),
      })

      setPopupMessage("Account updated successfully!")
      setPopupType("success")
      setShowPopup(true)

      // Show notification
      await notificationService.showSuccess("Account updated successfully!")
      
    } catch (error) {
      console.error('Error updating account:', error)
      setPopupMessage("Failed to update account. Please try again.")
      setPopupType("error")
      setShowPopup(true)
    } finally {
      setLoading(false)
    }
  }

  const handlePopupClose = () => {
    setShowPopup(false)
    if (popupType === "success") {
      setTimeout(() => {
        navigate("/")
      }, 300)
    }
  }

  if (loadingAccount) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading account...</p>
        </div>
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Edit</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Update account</h1>
              <p className="text-gray-600 dark:text-gray-400">Modify your account details and save changes.</p>
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
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Account"}
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
