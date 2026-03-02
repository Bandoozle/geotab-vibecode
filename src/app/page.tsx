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
      // Not logged in -> login
      if (!user) {
        router.replace("/login");
        return;
      }

      // Logged in -> check role from users/{uid}
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = (snap.data()?.role as UserRole | undefined) ?? "driver";

        router.replace(role === "manager" ? "/dashboard" : "/tracking");
      } catch {
        // If something is wrong, send to login
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