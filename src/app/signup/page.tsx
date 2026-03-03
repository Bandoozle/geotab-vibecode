// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebaseClient";

type Role = "manager" | "driver";

function friendlyAuthError(code?: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled — go to Firebase Console → Authentication → Sign-in method and enable Email/Password.";
    case "auth/invalid-api-key":
      return "Invalid Firebase API key — check your .env.local file has the correct NEXT_PUBLIC_FIREBASE_API_KEY.";
    default:
      return `Sign up failed (${code ?? "unknown"}). Check the browser console for details.`;
  }
}

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("driver");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignup() {
    setError(null);

    const e = email.trim();
    const n = name.trim();
    if (role === "driver" && !n) return setError("Please enter your full name.");
    if (!e) return setError("Email is required.");
    if (!password) return setError("Password is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    try {
      setLoading(true);

      // 1) Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, e, password);

      // 2) Store role (and name for drivers) in Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: e,
        role,
        ...(role === "driver" ? { name: n } : {}),
        createdAt: serverTimestamp(),
      });

      // 3) Go to dashboard
      if(role==="manager"){
        router.push("/app/manager/dashboard");
      }
      else if(role==="driver"){
        router.push("/app/driver/driverDashboard");
      }
      else{
        router.push("/login");
      }

    } catch (err: any) {
      setError(friendlyAuthError(err?.code));
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-primary/15 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center">
          <Image
            src="/geotab.png"
            alt="GEOTAB"
            width={140}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
          <h1 className="mt-4 text-xl font-semibold text-primary">Create your account</h1>
          <p className="mt-1 text-sm text-primary/60">Sign up as a manager or driver.</p>
        </div>

        <div className="mt-6 space-y-4">
          {/* Role */}
          <div>
            <label className="text-xs font-medium text-primary/70">Role</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("driver")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  role === "driver"
                    ? "border-accent bg-accent text-white"
                    : "border-primary/20 bg-white text-primary hover:bg-surface"
                }`}
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => setRole("manager")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  role === "manager"
                    ? "border-accent bg-accent text-white"
                    : "border-primary/20 bg-white text-primary hover:bg-surface"
                }`}
              >
                Manager
              </button>
            </div>
          </div>

          {/* Name — drivers only */}
          {role === "driver" && (
            <div>
              <label className="text-xs font-medium text-primary/70">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="mt-2 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary placeholder:text-primary/40 focus:border-accent focus:outline-none"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-primary/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-2 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary placeholder:text-primary/40 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-primary/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary placeholder:text-primary/40 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Confirm */}
          <div>
            <label className="text-xs font-medium text-primary/70">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary placeholder:text-primary/40 focus:border-accent focus:outline-none"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onSignup}
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <div className="text-center text-xs text-primary/60">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}