
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"; // Added FirebaseApp type
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // Added for Firebase Analytics

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "hatchwise.firebaseapp.com",
  projectId: "hatchwise",
  storageBucket: "hatchwise.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_GA_ID // Use environment variable
};

// Initialize Firebase
let app: FirebaseApp; // Explicitly typed app

if (!getApps().length) {
  // Check if all required config values are present, especially the API key
  if (!firebaseConfig.apiKey) {
    const errorMessage = "Firebase API Key is missing. Check your NEXT_PUBLIC_FIREBASE_API_KEY environment variable. App cannot be initialized.";
    console.error(errorMessage);
    // Throw an error to halt initialization if the key is critical
    throw new Error(errorMessage);
  }
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    // If initialization fails (e.g., due to truly malformed config beyond just API key),
    // rethrow or handle gracefully so `getAuth` isn't called on an undefined `app`.
    throw error; // Rethrow to make it clear initialization failed
  }
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app); // Initialize Firestore

// Initialize Firebase Analytics if in a browser environment
let analytics;
// Check if window is defined (i.e., we're in a browser environment)
// and if NEXT_PUBLIC_GA_ID is present
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID && app) { // Check if app is initialized before using it
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Error initializing Firebase Analytics:", error);
  }
}

export { app, analytics }; // Export app and analytics
export default app;
