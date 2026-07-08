/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-space)", "sans-serif"],
        sans: ["var(--font-manrope)", "sans-serif"]
      },
      colors: {
        ink: "#e2e8f0",
        "ink-muted": "#94a3b8",
        surface: "#121816",
        "surface-card": "#182421",
        "surface-elevated": "#1e352e",
        accent: "#10b981",
        "accent-muted": "#065f46",
        night: "#080c0a",
        aurora: "#10b981",
        sand: "#121816"
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(16, 185, 129, 0.3)",
        soft: "0 20px 60px -40px rgba(0, 0, 0, 0.6)",
        "card": "0 4px 24px -8px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 32px -8px rgba(16, 185, 129, 0.2)"
      }
    }
  },
  plugins: []
};
