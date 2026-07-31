import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17212B",
        asphalt: "#293241",
        kerb: "#E7ECEF",
        lane: "#F4F8F9",
        mint: "#0E9F6E",
        caution: "#D97706",
        signal: "#2563EB",
        breach: "#DC2626"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(23, 33, 43, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
