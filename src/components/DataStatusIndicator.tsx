"use client";

import { useEffect, useState } from "react";

interface StatusResponse {
  ok: boolean;
  statusCode?: number;
  error?: string;
  hint?: string;
  serverNumber?: number;
  vehicleCount?: number;
  message?: string;
}

export function DataStatusIndicator() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/data/status")
      .then((res) => res.json())
      .then((data: StatusResponse) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ ok: false, error: "Request failed" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="border-b border-primary/10 bg-surface px-6 py-2">
        <span className="text-xs text-primary/60">Checking Geotab connection…</span>
      </div>
    );
  }

  if (!status) return null;

  if (status.ok) {
    return (
      <div className="border-b border-primary/10 bg-[#e8f5e9] px-6 py-2 flex items-center gap-2">
        <span className="inline-block h-2 w-2 bg-green-600" aria-hidden />
        <span className="text-xs text-primary">
          <strong>Connected</strong> — {status.serverNumber != null ? `Server ${status.serverNumber} · ` : ""}{status.vehicleCount ?? 0} vehicles
        </span>
      </div>
    );
  }

  return (
    <div className="border-b border-primary/10 bg-[#ffebee] px-6 py-2">
      <p className="text-xs text-primary">
        <strong>Not connected to Geotab</strong>
        {status.statusCode != null && (
          <span className="ml-1 font-mono text-primary/70">({status.statusCode})</span>
        )}
      </p>
      <p className="text-xs text-primary/80 mt-0.5">{status.error}</p>
      {status.hint && (
        <p className="text-xs text-primary/70 mt-1">{status.hint}</p>
      )}
      <a
        href="/api/data/status"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-accent underline mt-1 inline-block"
      >
        Open status in new tab
      </a>
    </div>
  );
}
