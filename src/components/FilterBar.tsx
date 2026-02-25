"use client";

export function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-primary/10 bg-surface px-6 py-3">
      <input
        type="text"
        placeholder="Filter by group..."
        className="border border-primary/20 bg-white px-3 py-2 text-sm text-primary placeholder:text-primary/60 focus:border-accent focus:outline-none"
      />
      <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
        <input type="checkbox" className="border border-primary/30 text-accent focus:ring-accent" />
        Show hidden reports
      </label>
    </div>
  );
}
