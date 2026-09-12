import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        oa: {
          bg: "var(--oa-bg)",
          surface: "var(--oa-surface)",
          "surface-hi": "var(--oa-surface-hi)",
          "surface-raise": "var(--oa-surface-raise)",
          line: "var(--oa-line)",
          "line-soft": "var(--oa-line-soft)",
          text: "var(--oa-text)",
          "text-dim": "var(--oa-text-dim)",
          "text-faint": "var(--oa-text-faint)",
          primary: "var(--oa-primary)",
          "primary-dim": "var(--oa-primary-dim)",
          "primary-soft": "var(--oa-primary-soft)",
          gold: "var(--oa-gold)",
          "gold-dim": "var(--oa-gold-dim)",
          "gold-soft": "var(--oa-gold-soft)",
          green: "var(--oa-green)",
          "green-dim": "var(--oa-green-dim)",
          red: "var(--oa-red)",
          "red-dim": "var(--oa-red-dim)",
          blue: "var(--oa-blue)",
          "blue-dim": "var(--oa-blue-dim)",
        },
      },
      borderRadius: {
        "oa-lg": "var(--oa-radius-lg)",
        "oa-md": "var(--oa-radius-md)",
        "oa-sm": "var(--oa-radius-sm)",
      },
      fontFamily: {
        head: ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
