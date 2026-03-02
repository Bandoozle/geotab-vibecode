"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebaseClient";

type UserRole = "manager" | "driver";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
  
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        console.log("UID:", user.uid);
        console.log("Doc exists:", snap.exists());
        console.log("Full data:", JSON.stringify(snap.data()));
        console.log("Role:", snap.data()?.role);
  
        const role = snap.data()?.role as UserRole | undefined;
  
        if (!role) {
          console.log("No role found, going to login");
          router.replace("/login");
          return;
        }
  
        const destination =
          role === "manager" ? "/app/dashboard" : "/app/driverDashboard";
        console.log("Redirecting to:", destination);
        router.replace(destination);
      } catch (err) {
        console.error("Error:", err);
        router.replace("/login");
      }
    });
  
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-surface text-primary/70">
      Loading…
    </div>
  );
}