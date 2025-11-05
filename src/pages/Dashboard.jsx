"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { collection, onSnapshot, deleteDoc, doc, query } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import { useOnlineStatus } from "../hooks/useOnlineStatus"
import notificationService from "../services/notificationService"
import { decryptData } from "../utils/decrypt"
import { Search, Plus, Mail, Lock, Shield, Zap, TrendingUp, Eye, Copy, Trash2, Edit, MoreVertical, CheckCircle, AlertCircle, EyeOff } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { isOnline, showOfflineReminder } = useOnlineStatus()
  const [searchTerm, setSearchTerm] = useState("")
  const [firestoreAccounts, setFirestoreAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [decryptionError, setDecryptionError] = useState("")
  const [hasRequestedNotificationPermission, setHasRequestedNotificationPermission] = useState(false)
  const [showPassword, setShowPassword] = useState({})
  const [copied, setCopied] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  // Request notification permission and check online status on dashboard load
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!hasRequestedNotificationPermission) {
        await notificationService.requestPermission();
        setHasRequestedNotificationPermission(true);
        
        if (!isOnline) {
          await showOfflineReminder();
        }
      }
    };

    initializeNotifications();
  }, [isOnline, hasRequestedNotificationPermission, showOfflineReminder]);

  // Firestore real-time listener
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const q = query(collection(db, "users", user.uid, "accounts"))
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const decrypted = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const data = docSnapshot.data()
              try {
                const plain = await decryptData(data.encryptedData)
                
                console.log('✅ Decrypted account:', {
                  id: docSnapshot.id,
                  email: plain.email,
                  passwordLength: plain.password?.length,
                  hasNotes: !!plain.notes
                });
                
                return {
                  id: docSnapshot.id,
                  email: plain.email,
                  password: plain.password,
                  notes: plain.notes,
                  category: plain.category || 'general',
                  recoveryEmail: data.recoveryEmail,
                  recoveryPhone: data.recoveryPhone,
                  createdAt: data.createdAt,
                  updatedAt: data.updatedAt
                }
              } catch (decryptError) {
                console.error('❌ Failed to decrypt account:', decryptError)
                return {
                  id: docSnapshot.id,
                  email: '[Encrypted]',
                  password: '[Encrypted]',
                  notes: '[Decryption Failed]',
                  category: 'general',
                  recoveryEmail: data.recoveryEmail,
                  recoveryPhone: data.recoveryPhone,
                  createdAt: data.createdAt,
                  updatedAt: data.updatedAt,
                  decryptionFailed: true
                }
              }
            })
          )
          
          console.log('📦 Total decrypted accounts:', decrypted.length);
          setFirestoreAccounts(decrypted)
          setDecryptionError("")
          setLoading(false)
          
          if (decrypted.length > 0 && isOnline) {
            try {
              await notificationService.showSyncNotification(`${decrypted.length} accounts synchronized`);
            } catch (notifError) {
              console.warn('Notification error:', notifError);
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.warn('Firestore request aborted');
            return;
          }
          
          console.error('Error processing accounts:', error)
          setDecryptionError("Failed to load accounts")
          setLoading(false)
          
          if (isOnline) {
            try {
              await notificationService.showError("Failed to load encrypted accounts");
            } catch (notifError) {
              console.warn('Notification error:', notifError);
            }
          }
        }
      },
      (error) => {
        if (error.name === 'AbortError') {
          console.warn('Firestore listener aborted');
          return;
        }
        
        console.error('Firestore listener error:', error)
        setDecryptionError("Failed to connect to database")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, isOnline])

  // Handle account deletion
  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      await deleteDoc(doc(db, "users", user.uid, "accounts", accountId))
      
      try {
        await notificationService.showSuccess("Account deleted successfully");
      } catch (notifError) {
        console.warn('Notification error:', notifError);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Delete request aborted');
        return;
      }
      
      console.error('Error deleting account:', error)
      
      try {
        await notificationService.showError("Failed to delete account. Please try again.");
      } catch (notifError) {
        console.warn('Notification error:', notifError);
      }
    }
  }

  // Helper functions
  const copyToClipboard = (text, label) => {
    console.log('📋 Copying to clipboard:', { label, text, textLength: text?.length });
    navigator.clipboard.writeText(text);
    alert(`${label} copied!`);
  };

  const handleCopy = (text, field) => {
    // 🔒 SECURITY AUDIT LOG
    console.log('🔒 CLIPBOARD AUDIT:', {
      field,
      textLength: text?.length,
      isPlaintext: true,
      timestamp: new Date().toISOString()
    });
    
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Filter accounts based on search
  const filteredAccounts = firestoreAccounts.filter((account) => {
    const matchesSearch =
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.notes && account.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Gmail Vault</h1>
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span>{isOnline ? 'All systems operational' : 'Working offline'}</span>
                </p>
              </div>
            </div>
            <Link to="/add" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md">
                <Plus className="w-5 h-5" />
                <span>Add Account</span>
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Accounts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{firestoreAccounts.length}</p>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {firestoreAccounts.length} secured
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Encrypted</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{firestoreAccounts.length}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">256-bit AES</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quick Access</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{filteredAccounts.length}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Real-time sync</p>
            </div>
          </div>

          {/* Error message */}
          {decryptionError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{decryptionError}</p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  ×
                </button>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{filteredAccounts.length}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">found</span>
              </div>
            </div>
          </div>
        </header>

        {/* Accounts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading your accounts...</p>
            </div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No matches found' : 'No accounts yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `No accounts match "${searchTerm}". Try a different search term.` 
                : 'Start securing your Gmail accounts today'}
            </p>
            {!searchTerm && (
              <Link to="/add">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md">
                  Add your first account
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredAccounts.map((account) => (
              <div key={account.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all group">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full capitalize">
                    {account.category}
                  </span>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(account.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === account.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                        <Link 
                          to={`/edit/${account.id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Account</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            handleDeleteAccount(account.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">{account.email}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(account.email, `email-${account.id}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {copied === `email-${account.id}` ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Password</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm font-mono text-gray-900 dark:text-white truncate">
                        {showPassword[account.id] ? account.password : '••••••••••••'}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePasswordVisibility(account.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {showPassword[account.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(account.password, `password-${account.id}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {copied === `password-${account.id}` ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {account.notes && account.notes !== '[Decryption Failed]' && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{account.notes}</p>
                    </div>
                  )}

                  {/* Recovery Info */}
                  {(account.recoveryEmail || account.recoveryPhone) && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                      {account.recoveryEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Recovery: {account.recoveryEmail}
                        </p>
                      )}
                      {account.recoveryPhone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Phone: {account.recoveryPhone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link to={`/edit/${account.id}`} className="flex-1">
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-sm font-medium">
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
