"use client";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1a3560] bg-[#25477b] px-6">
      <span className="text-sm font-medium text-white/90">Practice Fleet Dashboard</span>
      <div className="flex items-center gap-4">
        <button type="button" className="text-white/80 hover:text-white" aria-label="Help">
          ?
        </button>
        <button type="button" className="text-white/80 hover:text-white" aria-label="Messages">
          ✉
        </button>
        <button type="button" className="relative text-white/80 hover:text-white" aria-label="Notifications">
          🔔
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center bg-accent px-1 text-[10px] font-medium text-white">
            12
          </span>
        </button>
        <button type="button" className="text-white/80 hover:text-white" aria-label="Settings">
          ⚙
        </button>
        <span className="border-l border-white/20 pl-4 text-sm text-white/90">User</span>
      </div>
    </header>
  );
}
