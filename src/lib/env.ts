import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEMO_MODE: z.string().default("true"),
  SMARTPARK_DB_PATH: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["mock", "aza"]).default("mock"),
  MOCK_PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  AZA_API_BASE_URL: z.string().url().default("https://api.aza.systems"),
  AZA_API_KEY: z.string().optional(),
  AZA_WEBHOOK_SECRET: z.string().optional(),
  QR_TOKEN_PEPPER: z.string().optional()
});

export const env = envSchema.parse(process.env);

export function isDemoMode() {
  return env.NEXT_PUBLIC_DEMO_MODE !== "false";
}
