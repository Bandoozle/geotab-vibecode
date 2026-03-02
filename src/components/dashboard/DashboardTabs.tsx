"use client";

import { useEffect, useMemo, useState } from "react";
import type { Query } from "firebase/firestore";
import { getCountFromServer } from "firebase/firestore";

type TabsMap = Record<string, React.ReactNode>;
type LabelsMap = Record<string, string>;
type CountsMap = Record<string, number>;

/**
 * OPTIONAL Firestore counts:
 * Pass a Query per tab key and we'll fetch counts via getCountFromServer()
 * (no need to read all documents).
 */
type CountQueriesMap = Record<string, Query>;

export function DashboardTabs({
  tabs,
  labels,
  defaultActiveKey,
  isLoaded,
  counts, // still supported (manual counts)
  countQueries, // new (Firestore counts)
}: {
  tabs: TabsMap;
  labels: LabelsMap;
  defaultActiveKey: string;
  isLoaded?: boolean;
  counts?: CountsMap;
  countQueries?: CountQueriesMap;
}) {
  const keys = useMemo(() => Object.keys(tabs), [tabs]);

  const safeDefault = keys.includes(defaultActiveKey)
    ? defaultActiveKey
    : keys[0] ?? "";

  const [active, setActive] = useState<string>(safeDefault);

  // If counts are not provided, but Firestore queries are, load counts from Firestore.
  const [fsCounts, setFsCounts] = useState<CountsMap>({});
  const [fsCountsLoaded, setFsCountsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      if (counts) return; // manual counts win
      if (!countQueries) return;

      setFsCountsLoaded(false);

      try {
        const entries = await Promise.all(
          Object.entries(countQueries).map(async ([key, q]) => {
            const snap = await getCountFromServer(q);
            return [key, snap.data().count] as const;
          })
        );

        if (cancelled) return;

        const next: CountsMap = {};
        for (const [k, c] of entries) next[k] = c;

        setFsCounts(next);
      } finally {
        if (!cancelled) setFsCountsLoaded(true);
      }
    }

    loadCounts();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countQueries, counts]);

  const activeNode = tabs[active];

  const effectiveCounts = counts ?? fsCounts;
  const effectiveLoaded =
    isLoaded === false ? false : counts ? true : countQueries ? fsCountsLoaded : true;

  return (
    <div className="rounded-xl border border-primary/15 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-primary/10 p-2">
        {keys.map((k) => {
          const isActive = k === active;
          const count = effectiveCounts?.[k];

          return (
            <button
              key={k}
              type="button"
              onClick={() => setActive(k)}
              disabled={effectiveLoaded === false}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium inline-flex items-center gap-2",
                effectiveLoaded === false ? "opacity-60 cursor-not-allowed" : "",
                isActive
                  ? "bg-primary text-white"
                  : "border border-primary/15 bg-surface text-primary hover:bg-primary/5",
              ].join(" ")}
            >
              <span>{labels[k] ?? k}</span>

              {typeof count === "number" ? (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
                  ].join(" ")}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="p-4">{activeNode ?? null}</div>
    </div>
  );
}