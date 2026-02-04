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
        ink: "#0f172a",
        sand: "#f5f3ef",
        aurora: "#14b8a6",
        blaze: "#f97316",
        gold: "#f59e0b",
        night: "#0b1120"
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(20, 184, 166, 0.5)",
        soft: "0 20px 60px -40px rgba(15, 23, 42, 0.4)"
      }
    }
  },
  plugins: []
};
