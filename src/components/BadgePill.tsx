interface BadgePillProps {
  label: string;
  title?: string;
}

export function BadgePill({ label, title }: BadgePillProps) {
  return (
    <span
      className="inline-flex border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
      title={title ?? label}
    >
      {label}
    </span>
  );
}
