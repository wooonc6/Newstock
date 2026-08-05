import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        surface3: "var(--surface3)",
        accent: "var(--accent)",
        accent2: "var(--accent2)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        purple: "var(--purple)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        "text-dim": "var(--text-dim)",
        coin: "var(--coin)",
      },
      fontFamily: {
        sans: ["var(--font-ui)", "sans-serif"],
        mono: ["var(--font-financial)", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
