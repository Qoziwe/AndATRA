/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        panel: "#10233f",
        surface: "#0f1c2f",
        border: "#1f3559",
        primary: "#3B82F6",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: "#8EA3C5"
      },
      boxShadow: {
        card: "0 18px 45px rgba(3, 12, 26, 0.28)"
      }
    }
  },
  plugins: []
};
