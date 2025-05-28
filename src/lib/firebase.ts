
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
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
    const errorMessage = "CRITICAL ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is MISSING or EMPTY in the deployment environment. Please ensure it is correctly set with a valid value in your Firebase App Hosting backend's environment variable settings and then REDEPLOY your application. App cannot initialize.";
    console.error(errorMessage);
    // Throw an error to halt initialization if the key is critical
    throw new Error(errorMessage);
  }
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Error initializing Firebase app (this usually happens AFTER the API key check if the key was present but invalid, or config is malformed):", error);
    // If initialization fails (e.g., due to truly malformed config beyond just API key),
    // rethrow or handle gracefully so `getAuth` isn't called on an undefined `app`.
    throw error;
  }
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Analytics if in a browser environment
let analytics;
// Check if window is defined (i.e., we're in a browser environment)
// and if NEXT_PUBLIC_GA_ID is present and app is initialized
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID && app) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Error initializing Firebase Analytics:", error);
  }
}

export { app, analytics };
export default app;
