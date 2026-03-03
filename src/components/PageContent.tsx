"use client";

interface PageContentProps {
  children: React.ReactNode;
  /** "default" = full width, "narrow" = max-w-7xl centered, "form" = max-w-lg centered (e.g. check-in) */
  maxWidth?: "default" | "narrow" | "form";
  className?: string;
}

const MAX_WIDTH_CLASS = {
  default: "",
  narrow: "mx-auto max-w-7xl",
  form: "mx-auto max-w-lg",
};

export function PageContent({
  children,
  maxWidth = "default",
  className = "",
}: PageContentProps) {
  return (
    <div
      className={`min-h-full bg-surface px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 ${MAX_WIDTH_CLASS[maxWidth]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
