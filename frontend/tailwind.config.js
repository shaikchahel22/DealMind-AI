/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#080b12",
          surface: "#0d1117",
          surface2: "#12161f",
          surface3: "#181d29",
          border: "#1e2538",
          "border-light": "#252d3d",
        },
        brand: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
          soft: "#1a1b3d",
          "soft2": "#1e1b4b",
          muted: "rgba(99,102,241,0.15)",
        },
        accent: {
          DEFAULT: "#22d3a8",
          hover: "#34d399",
          soft: "#0a2320",
          "soft2": "#0f2e28",
          muted: "rgba(34,211,168,0.15)",
        },
        memory: {
          DEFAULT: "#38bdf8",
          soft: "#0c2240",
          muted: "rgba(56,189,248,0.12)",
        },
        warn: {
          DEFAULT: "#f5a524",
          hover: "#fbbf24",
          soft: "#1f1700",
          "soft2": "#2e2410",
          muted: "rgba(245,165,36,0.15)",
        },
        danger: {
          DEFAULT: "#f5455c",
          hover: "#fb7185",
          soft: "#1f0a0e",
          "soft2": "#2e1216",
          muted: "rgba(245,69,92,0.15)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        "card-brand": "0 0 0 1px rgba(99,102,241,0.3), 0 4px 20px rgba(99,102,241,0.1)",
        "card-accent": "0 0 0 1px rgba(34,211,168,0.3), 0 4px 20px rgba(34,211,168,0.08)",
        "card-memory": "0 0 0 1px rgba(56,189,248,0.3), 0 4px 16px rgba(56,189,248,0.08)",
        "card-warn": "0 0 0 1px rgba(245,165,36,0.3), 0 4px 16px rgba(245,165,36,0.08)",
        glow: "0 0 30px rgba(99,102,241,0.2)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #6366f1, #8b5cf6)",
        "gradient-accent": "linear-gradient(135deg, #22d3a8, #34d399)",
        "gradient-memory": "linear-gradient(135deg, #38bdf8, #6366f1)",
        "gradient-surface": "linear-gradient(to bottom, #0d1117, #080b12)",
        "hero-radial": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent)",
      },
    },
  },
  plugins: [],
};
