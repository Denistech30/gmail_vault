import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { auth, db } from "./config";

// Authentication Services
export const authService = {
  // Register new user
  register: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Firebase register error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/Password sign-up is not enabled. Please contact support.';
          break;
        default:
          errorMessage = `Registration failed: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Sign in user
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Firebase signIn error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/Password sign-in is not enabled. Please contact support.';
          break;
        default:
          errorMessage = `Authentication failed: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};

// Database Services for Gmail Accounts
export const accountService = {
  // Add new account
  addAccount: async (userId, accountData) => {
    try {
      const docRef = await addDoc(collection(db, "accounts"), {
        ...accountData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get user's accounts
  getAccounts: async (userId) => {
    try {
      const q = query(
        collection(db, "accounts"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const accounts = [];
      querySnapshot.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, accounts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete account
  deleteAccount: async (accountId) => {
    try {
      await deleteDoc(doc(db, "accounts", accountId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Settings Service
export const settingsService = {
  // Save user settings
  saveSettings: async (userId, settings) => {
    try {
      const docRef = await addDoc(collection(db, "settings"), {
        userId,
        ...settings,
        updatedAt: new Date()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get user settings
  getSettings: async (userId) => {
    try {
      const q = query(
        collection(db, "settings"), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      let settings = null;
      querySnapshot.forEach((doc) => {
        settings = { id: doc.id, ...doc.data() };
      });
      return { success: true, settings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
