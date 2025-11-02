// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkngHfOvZrFx3Q21VqHlVN95KLSJD0DT4",
  authDomain: "vault-11b59.firebaseapp.com",
  projectId: "vault-11b59",
  storageBucket: "vault-11b59.firebasestorage.app",
  messagingSenderId: "755009560537",
  appId: "1:755009560537:web:b7c66061c32f8d50f7c3c8",
  measurementId: "G-JD34XGNQJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Export the app instance
export default app;
