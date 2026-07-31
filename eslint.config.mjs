import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".corepack/**",
      ".next/**",
      ".next-stale-*/**",
      ".pnpm-store/**",
      "DOCUMENTATION/**",
      "coverage/**",
      "dev-server.*.log",
      "docs/**",
      "node_modules/**",
      "playwright-report/**",
      "public/**",
      "test-results/**"
    ]
  },
  ...nextVitals,
  ...nextTypescript
];

export default config;
