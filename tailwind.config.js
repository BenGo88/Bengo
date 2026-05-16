/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f5f0",
          100: "#ece9df",
          200: "#d9d3bf",
          300: "#c2b899",
          400: "#ab9d73",
          500: "#8a7c55",
          600: "#6e6344",
          700: "#564d35",
          800: "#3d3726",
          900: "#1e1b13",
          950: "#0f0e0a",
        },
        vermillion: {
          400: "#e8593c",
          500: "#d44527",
          600: "#b83a21",
        },
        jade: {
          400: "#4ead8a",
          500: "#3d9477",
          600: "#327a62",
        },
      },
      fontFamily: {
        display: ['"Noto Serif JP"', "Georgia", "serif"],
        body: ['"Noto Sans JP"', '"Helvetica Neue"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
