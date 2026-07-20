import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#05070d",
          surface: "#0a0e1a",
          elevated: "#0f1424",
        },
        neon: {
          DEFAULT: "#3b82f6",
          soft: "#60a5fa",
          deep: "#1d4ed8",
        },
        gold: {
          DEFAULT: "#d4af37",
          soft: "#f0d78c",
        },
        online: "#22c55e",
        offline: "#ef4444",
        ink: {
          DEFAULT: "#e2e8f0",
          muted: "#94a3b8",
          faint: "#5b6577",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.35)",
        "glow-gold": "0 0 20px rgba(212, 175, 55, 0.3)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 30px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 0%, rgba(59,130,246,0.12) 0%, transparent 55%), radial-gradient(circle at 90% 20%, rgba(212,175,55,0.08) 0%, transparent 45%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
