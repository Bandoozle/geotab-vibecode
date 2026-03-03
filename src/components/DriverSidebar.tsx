"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const nav = [
  // { href: "/app/dashboard", label: "Dashboard" },
  //TODO: add map back
  // { href: "/app/tracking", label: "Map" }, 
  // { href: "/app/tracking", label: "Track" },
  // { href: "/app/leaderboard", label: "Leaderboard" },
  // { href: "/app/safety", label: "Safety" },
  { href: "/app/driver/checkin", label: "Check-In" },

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
    <aside className="flex min-h-full w-52 shrink-0 flex-col border-r border-slate-200/80 bg-surface shadow-sidebar">
      <div className="flex shrink-0 items-center border-b border-slate-200/80 px-5 py-4">
        <Image
          src="/geotab.png"
          alt="Geotab"
          width={110}
          height={28}
          className="h-7 w-auto object-contain object-left"
          priority
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map(({ href, label, badge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`mb-1 flex items-center rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:bg-slate-100 hover:text-primary"
              }`}
            >
              <span>{label}</span>
              {badge != null && (
                <span className="ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent/90 text-xs font-medium text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}