/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "float-soft": "floatSoft 7s ease-in-out infinite",
        "glow-breathe": "glowBreathe 3s ease-in-out infinite",
      },
      keyframes: {
        floatSoft: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(1.5deg)" },
        },
        glowBreathe: {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.05)" },
        },
      },
      boxShadow: {
        clay:
          "0 1px 0 rgba(255,255,255,0.85) inset, 0 24px 48px -12px rgba(251, 191, 36, 0.18), 0 8px 16px -4px rgba(15, 23, 42, 0.08)",
        "clay-lg":
          "0 2px 0 rgba(255,255,255,0.9) inset, 0 32px 64px -16px rgba(251, 191, 36, 0.22), 0 12px 24px -6px rgba(15, 23, 42, 0.1)",
        orb: "0 -12px 32px rgba(255,255,255,0.65) inset, 0 20px 40px -8px rgba(234, 179, 8, 0.35), 0 8px 16px -4px rgba(124, 58, 237, 0.15)",
      },
    },
  },
  plugins: [],
}
