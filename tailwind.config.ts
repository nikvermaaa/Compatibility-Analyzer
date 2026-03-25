import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f0c0a",
        surface: "#1a1410",
        surfaceBorder: "#2a221b",
        surfaceHover: "#241c16",
        foreground: "#f7f4ee",
        muted: "#9e9484",
        gold: {
          DEFAULT: "#d8b67a",
          light: "#e7cb9b",
          dark: "#b39155",
        },
        rose: {
          DEFAULT: "#e11d48",
          light: "#f43f5e",
          dark: "#be123c",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
