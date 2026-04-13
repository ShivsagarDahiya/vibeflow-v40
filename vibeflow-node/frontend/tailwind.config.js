/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#e91e63",
          50: "#fce4ec",
          100: "#f8bbd0",
          200: "#f48fb1",
          300: "#f06292",
          400: "#ec407a",
          500: "#e91e63",
          600: "#d81b60",
          700: "#c2185b",
          800: "#ad1457",
          900: "#880e4f",
        },
        gold: {
          DEFAULT: "#f4a460",
          light: "#ffd180",
          dark: "#e8935a",
        },
        dark: {
          DEFAULT: "#0a0a0f",
          50: "#16161f",
          100: "#12121a",
          200: "#1e1e2a",
          300: "#252535",
          400: "#2e2e42",
        },
        surface: {
          DEFAULT: "#12121a",
          high: "#1e1e2a",
          higher: "#252535",
        },
        love: {
          pink: "#e91e63",
          rose: "#f06292",
          gold: "#f4a460",
          deep: "#880e4f",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.3)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.3)" },
          "70%": { transform: "scale(1)" },
        },
        floatUp: {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-120px) scale(0.5)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        swipeLeft: {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(-150%) rotate(-20deg)", opacity: "0" },
        },
        swipeRight: {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(150%) rotate(20deg)", opacity: "0" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
        heartbeat: "heartbeat 1.5s ease-in-out infinite",
        "float-up": "floatUp 1.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "swipe-left": "swipeLeft 0.4s ease-out forwards",
        "swipe-right": "swipeRight 0.4s ease-out forwards",
        "pulse-ring": "pulseRing 1s ease-out infinite",
        "gradient-shift": "gradientShift 4s ease infinite",
      },
      backgroundSize: {
        "200%": "200%",
      },
      boxShadow: {
        love: "0 0 20px rgba(233, 30, 99, 0.4)",
        "love-lg": "0 0 40px rgba(233, 30, 99, 0.5)",
        gold: "0 0 20px rgba(244, 164, 96, 0.4)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-lg": "0 8px 40px rgba(0, 0, 0, 0.6)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
        "tab-bar": "5rem",
      },
    },
  },
  plugins: [],
};
