
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcAklWKtyi-GMbq2PejGuoY3uospl1dyk",
  authDomain: "hatchtrack.firebaseapp.com",
  projectId: "hatchtrack",
  storageBucket: "hatchtrack.firebasestorage.app", // Updated as per your request
  messagingSenderId: "947747547328",
  appId: "1:947747547328:web:19a9b37707b34541ae2525"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export default app;

