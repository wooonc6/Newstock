import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080d17",
        surface: "#0f1724",
        surface2: "#162033",
        surface3: "#1c2a42",
        accent: "#00e5b0",
        accent2: "#3b82f6",
        warn: "#f59e0b",
        danger: "#ef4444",
        purple: "#a855f7",
        text: "#eef2ff",
        "text-muted": "#4b5a72",
        "text-dim": "#8899b4",
        coin: "#fbbf24",
      },
      fontFamily: {
        sans: ["var(--font-noto)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
