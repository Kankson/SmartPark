import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const localPath = path.join(root, ".env.local");

let localValues = {};
let localFilePresent = true;
try {
  localValues = parseEnv(await readFile(localPath, "utf8"));
} catch {
  localFilePresent = false;
}

const values = { ...localValues, ...process.env };
const provider = (values.PAYMENT_PROVIDER || "mock").trim().toLowerCase();
const apiKey = values.AZA_API_KEY?.trim() || "";
const webhookSecret = values.AZA_WEBHOOK_SECRET?.trim() || "";
const apiKeyReady = isConfigured(apiKey);
const webhookReady = isConfigured(webhookSecret);
const apiKeyMode = !apiKeyReady
  ? "missing or placeholder"
  : apiKey.startsWith("aza_test_")
    ? "configured (test)"
    : apiKey.startsWith("aza_live_")
      ? "configured (live)"
      : "configured (unrecognized prefix)";

console.log("SmartPark environment status");
console.log(`- Local file: ${localFilePresent ? localPath : "missing; run pnpm env:setup"}`);
console.log("- Payment provider: configured");
console.log(`- AZA API key: ${apiKeyMode}`);
console.log(`- AZA signing secret: ${webhookReady ? "configured" : "missing or placeholder"}`);
console.log("- Webhook URL path: /api/payments/aza-webhook");

if (provider === "aza" && (!apiKeyReady || !webhookReady)) {
  console.error("AZA is selected but its server secrets are incomplete.");
  process.exitCode = 1;
} else if (provider === "aza") {
  console.log("AZA configuration is ready for a connection test in Admin > Settings.");
} else {
  console.log("Mock payments are active; no real money will move.");
}

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
        return [key, value];
      }),
  );
}

function isConfigured(value) {
  return Boolean(value) && !/(replace|your[-_]|example|change[-_]?me|\.\.\.)/i.test(value);
}
