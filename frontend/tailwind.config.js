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
        surface: "#0a0f0d",
        "surface-card": "#0f1a16",
        "surface-elevated": "#132b23",
        accent: "#10b981",
        "accent-muted": "#065f46",
        night: "#040806",
        aurora: "#10b981",
        sand: "#0a0f0d"
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
