"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/tracking", label: "Map" },
  { href: "/tracking", label: "Track" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/", label: "Safety" },
  { href: "/", label: "Maintenance" },
  { href: "/", label: "Sustainability" },
  { href: "/", label: "Pages", badge: 12 },
  { href: "/", label: "Applications" },
  { href: "/", label: "Support" },
  { href: "/", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-full w-56 shrink-0 flex-col self-stretch border-r border-primary/15 bg-white shadow-[2px_0_6px_rgba(0,0,0,0.06),4px_0_14px_rgba(0,0,0,0.1)]">
      <div className="flex shrink-0 items-center border-b border-primary/10 px-4 py-3">
        <Image
          src="/geotab.png"
          alt="GEOTAB"
          width={110}
          height={28}
          className="h-7 w-auto object-contain object-left"
          priority
        />
      </div>
      <div className="border-b border-primary/10 p-3">
        <input
          type="text"
          placeholder="Jump to..."
          className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm text-primary placeholder:text-primary/50 focus:border-accent focus:outline-none"
        />
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {nav.map(({ href, label, badge }) => {
          const isActive =
            (label === "Dashboard" && pathname === "/") ||
            (label === "Map" && pathname === "/tracking") ||
            (label === "Track" && pathname === "/tracking") ||
            (label === "Leaderboard" && pathname === "/leaderboard");
          return (
            <Link
              key={label}
              href={href}
              className={`mb-0.5 flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-primary/80 hover:bg-surface hover:text-primary"
              }`}
            >
              <span>{label}</span>
              {badge != null ? (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center bg-accent text-xs font-medium text-white">
                  {badge}
                </span>
              ) : (
                <span className="text-primary/40">+</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
