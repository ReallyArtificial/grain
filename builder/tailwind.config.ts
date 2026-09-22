import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grain: {
          50: "#faf8f5",
          100: "#f3efe8",
          200: "#e6ddd0",
          300: "#d4c5ae",
          400: "#bfa788",
          500: "#b0936e",
          600: "#a38162",
          700: "#886a53",
          800: "#6f5747",
          900: "#5b483c",
          950: "#30251f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
}

export default config
