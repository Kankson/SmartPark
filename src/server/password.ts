import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing for the local backend: scrypt with a per-password salt,
 * stored as `scrypt$<keylen>$<salt-hex>$<hash-hex>`. Verification is constant
 * time so a mismatch cannot be timed out of the comparison.
 */
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH);
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${KEY_LENGTH}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, keyLength, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !keyLength || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const derived = scryptSync(password, Buffer.from(salt, "hex"), Number(keyLength));
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
