"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/app/dashboard", label: "Dashboard" },
  //TODO: add map back
  { href: "/app/tracking", label: "Map" }, 
  // { href: "/app/tracking", label: "Track" },
  { href: "/app/leaderboard", label: "Leaderboard" },
  { href: "/app/safety", label: "Safety" },
  { href: "/app/checkin", label: "Check-In" },

  // { href: "/app/maintenance", label: "Maintenance" },
  // { href: "/app/sustainability", label: "Sustainability" },
  // { href: "/app/pages", label: "Pages", badge: 12 },
  // { href: "/app/applications", label: "Applications" },
  // { href: "/app/support", label: "Support" },
  // { href: "/app/settings", label: "Settings" },
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

      <nav className="flex-1 overflow-y-auto p-2">
        {nav.map(({ href, label, badge }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              className={`mb-0.5 flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-primary/80 hover:bg-surface hover:text-primary"
              }`}
            >
              <span>{label}</span>
              {badge != null ? (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-accent text-xs font-medium text-white">
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