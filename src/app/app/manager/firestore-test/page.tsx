"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export default function FirestoreTestPage() {
  const [status, setStatus] = useState("Testing…");

  useEffect(() => {
    async function run() {
      try {
        // CHANGE THIS to a collection you KNOW exists in Firestore
        const COL = "mileage";

        const qy = query(collection(db, COL), limit(5));
        const snap = await getDocs(qy);

        console.log("Firestore projectId:", db.app.options.projectId);
        console.log("Collection:", COL, "Docs:", snap.size);

        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log("Sample docs:", rows);

        setStatus(`✅ Connected. ${snap.size} docs in "${COL}" (see console)`);
      } catch (e: any) {
        console.error("Firestore test error:", e);
        setStatus(`❌ Error: ${e?.message ?? String(e)}`);
      }
    }

    run();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Firestore Test</h1>
      <p>{status}</p>
      <p>Open DevTools Console (F12) to see details.</p>
    </div>
  );
}