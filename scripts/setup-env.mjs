import { access, copyFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const templatePath = path.join(root, ".env.example");
const localPath = path.join(root, ".env.local");

try {
  await access(localPath);
  console.log(`SmartPark environment already exists: ${localPath}`);
} catch {
  await copyFile(templatePath, localPath);
  console.log(`Created a safe local environment file: ${localPath}`);
  console.log("SmartPark will use mock payments until you replace the AZA placeholders and set PAYMENT_PROVIDER=aza.");
}
