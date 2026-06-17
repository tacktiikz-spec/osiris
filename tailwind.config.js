/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Police de récit (serif immersive) et police d'interface (sans).
        serif: ["'Crimson Pro'", "'Iowan Old Style'", "Georgia", "serif"],
        sans: ["Inter", "'Segoe UI'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "monospace"],
      },
      colors: {
        // Couleurs neutres sombres de base ; les accents viennent du thème (variables CSS).
        ink: {
          950: "#05060a",
          900: "#0a0c12",
          850: "#0f121b",
          800: "#141823",
          700: "#1c2130",
          600: "#2a3142",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        flash: {
          "0%": { opacity: "0.55" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.35s ease-out",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        flash: "flash 0.7s ease-out forwards",
      },
    },
  },
  plugins: [],
};
