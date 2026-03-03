import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;

if (!apiKey || !appId || !messagingSenderId) {
  throw new Error(
    "Missing Firebase config. Add NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_APP_ID, and NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID to .env.local (see .env.example). Restart the dev server after changing .env.local."
  );
}

const firebaseConfig = {
  apiKey,
  authDomain: "vibe-code-feb-2026.firebaseapp.com",
  projectId: "vibe-code-feb-2026",
  storageBucket: "vibe-code-feb-2026.firebasestorage.app",
  messagingSenderId,
  appId,
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);