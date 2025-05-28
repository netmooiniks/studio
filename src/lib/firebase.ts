
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
    console.error("Firebase API Key is missing. Check your NEXT_PUBLIC_FIREBASE_API_KEY environment variable.");
    // For a client-side error, you might want to throw to stop initialization
    // or handle it by disabling Firebase features.
    // For server-side, this error will likely be caught during initialization.
    // Consider throwing an error here to halt initialization if the key is critical
    // throw new Error("Firebase API Key is missing. App cannot be initialized.");
  }
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    // If initialization fails (e.g., due to truly malformed config beyond just API key),
    // rethrow or handle gracefully so `getAuth` isn't called on an undefined `app`.
    // However, `auth/invalid-api-key` usually happens at the `getAuth` step.
    throw error; // Rethrow to make it clear initialization failed
  }
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Analytics if in a browser environment
let analytics;
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
  if (app) { 
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.error("Error initializing Firebase Analytics:", error);
    }
  }
}

export { app, analytics };
export default app;
