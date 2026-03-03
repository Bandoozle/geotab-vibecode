import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: "#1e293b",
        primaryLight: "#334155",
        accent: "#2563eb",
        accentHover: "#1d4ed8",
        surface: "#f8fafc",
        surfaceCard: "#ffffff",
        muted: "#64748b",
        mutedLight: "#94a3b8",
        ready: "#16a34a",
        caution: "#ca8a04",
        atRisk: "#dc2626",
        readyBg: "#f0fdf4",
        cautionBg: "#fefce8",
        atRiskBg: "#fef2f2",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        cardHover: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        sidebar: "2px 0 12px rgb(0 0 0 / 0.04)",
      },
      borderRadius: {
        card: "0.75rem",
        cardLg: "1rem",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
