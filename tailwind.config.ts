import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09080F",
        surface: "#13111E",
        border: "#1E1B2E",
        violet: {
          DEFAULT: "#7C3AED",
          light: "#A78BFA",
        },
        gold: "#F59E0B",
        emerald: "#10B981",
        danger: "#EF4444",
        text: "#E2E0F0",
        muted: "#6B7280",
        code: "#0D0C18",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        heading: ["Unbounded", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
