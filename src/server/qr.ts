import "server-only";

import crypto from "node:crypto";

import { DomainError } from "@/server/domain";

type ZoneQrPayload = {
  type: "smartpark-zone";
  version: 1;
  zoneId: string;
  zoneCode: string;
  signature: string;
};

function qrPepper() {
  return process.env.QR_TOKEN_PEPPER ?? "smartpark-demo-pepper";
}

export function createQrToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashQrToken(token: string) {
  return crypto.createHash("sha256").update(`${token}.${qrPepper()}`).digest("hex");
}

function signZone(zoneId: string, zoneCode: string) {
  return crypto.createHmac("sha256", qrPepper()).update(`${zoneId}.${zoneCode}`).digest("base64url");
}

export function createZoneQrPayload(zoneId: string, zoneCode: string) {
  const payload: ZoneQrPayload = {
    type: "smartpark-zone",
    version: 1,
    zoneId,
    zoneCode,
    signature: signZone(zoneId, zoneCode)
  };
  return JSON.stringify(payload);
}

export function verifyZoneQrPayload(rawPayload: string) {
  let payload: ZoneQrPayload;

  try {
    payload = JSON.parse(rawPayload) as ZoneQrPayload;
  } catch {
    throw new DomainError("This is not a valid SmartPark zone code.", "invalid_zone_qr");
  }

  if (
    payload.type !== "smartpark-zone" ||
    payload.version !== 1 ||
    !payload.zoneId ||
    !payload.zoneCode ||
    !payload.signature
  ) {
    throw new DomainError("This is not a valid SmartPark zone code.", "invalid_zone_qr");
  }

  const expected = Buffer.from(signZone(payload.zoneId, payload.zoneCode));
  const actual = Buffer.from(payload.signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new DomainError("This SmartPark zone code could not be verified.", "unverified_zone_qr");
  }

  return payload;
}
