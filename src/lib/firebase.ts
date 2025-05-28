
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "hatchwise.firebaseapp.com",
  projectId: "hatchwise",
  storageBucket: "hatchwise.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_GA_ID
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  // Check if all required config values are present, especially the API key
  if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key is missing. Check your NEXT_PUBLIC_FIREBASE_API_KEY environment variable.");
    // For a client-side error, you might want to throw to stop initialization
    // or handle it by disabling Firebase features.
    // For server-side, this error will likely be caught during initialization.
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app); // Initialize Firestore

// Initialize Firebase Analytics if in a browser environment
let analytics;
// Check if window is defined (i.e., we're in a browser environment)
// and if NEXT_PUBLIC_GA_ID is present
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
  // Ensure app is initialized before calling getAnalytics
  if (app) { 
    analytics = getAnalytics(app);
  }
}

export { app, analytics }; // Export app and analytics
export default app;
