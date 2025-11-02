"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Dashboard from "./pages/Dashboard"
import AddAccount from "./pages/AddAccount"
import EditAccount from "./pages/EditAccount"
import Settings from "./pages/Settings"
import Recovery from "./pages/Recovery"
import Sidebar from "./components/Sidebar"
import Login from "./components/Login"

// Main App Component with Authentication
function AppContent() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    // Global error handler for uncaught promise rejections
    const handleUnhandledRejection = (event) => {
      // Handle AbortError specifically - these are usually harmless
      if (event.reason?.name === 'AbortError') {
        console.warn('Caught AbortError (request cancelled):', event.reason.message);
        event.preventDefault(); // Prevent the error from being logged as uncaught
        return;
      }
      
      // Log other unhandled rejections
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add("dark")
    }

    // Load accounts from localStorage (will be replaced with Firebase)
    const savedAccounts = localStorage.getItem("accounts")
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts))
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("darkMode", newDarkMode.toString())
    if (newDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const addAccount = (account) => {
    const newAccounts = [...accounts, { ...account, id: Date.now() }]
    setAccounts(newAccounts)
    localStorage.setItem("accounts", JSON.stringify(newAccounts))
  }

  const deleteAccount = (id) => {
    const newAccounts = accounts.filter((acc) => acc.id !== id)
    setAccounts(newAccounts)
    localStorage.setItem("accounts", JSON.stringify(newAccounts))
  }

  // Show login if user is not authenticated
  if (!user) {
    return <Login />
  }

  // Show main app if user is authenticated
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 w-full min-h-screen md:ml-64 pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddAccount />} />
            <Route path="/edit/:id" element={<EditAccount />} />
            <Route path="/settings" element={<Settings darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route path="/recovery" element={<Recovery accounts={accounts} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

// App wrapper with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
