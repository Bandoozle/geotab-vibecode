import path from "path";
import dotenv from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Ensure env is loaded when running node scripts (tsx) outside Next.js
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
  throw new Error(
    "Missing FIREBASE_SERVICE_ACCOUNT_KEY_JSON. Ensure .env.local exists in project root and contains FIREBASE_SERVICE_ACCOUNT_KEY_JSON=..."
  );
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);

// Fix newline issue in private_key stored in .env
if (serviceAccount?.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });

export const adminDb = getFirestore(app);