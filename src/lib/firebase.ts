
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // Added for Firebase Analytics

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDmhvQMfLgHA-ViWROE3XVlbJVGmjQBlC4",
  authDomain: "hatchwise.firebaseapp.com",
  projectId: "hatchwise",
  storageBucket: "hatchwise.firebasestorage.app",
  messagingSenderId: "288005574631",
  appId: "1:288005574631:web:150517f4aa707de5777742",
  measurementId: process.env.NEXT_PUBLIC_GA_ID // Use environment variable
};

// Initialize Firebase
let app;
if (!getApps().length) {
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
  analytics = getAnalytics(app);
}

export { app, analytics }; // Export app and analytics
export default app;

