import "server-only";

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  type AuditLog,
  type Booking,
  type DemoUser,
  type ParkingSpot,
  type ParkingZone,
  type Payment,
  type QrTicket,
  type SmartParkState,
  type Vehicle,
  type VerificationEvent,
  type Violation,
  type WalletAccount,
  type WalletTransaction,
  nowIso
} from "@/server/domain";

/**
 * Column kinds understood by the generic row mapper. SQLite has no boolean or
 * JSON storage class, so `bool` round-trips through 0/1 and `json` through text.
 */
type FieldKind = "text" | "int" | "real" | "bool" | "json";

interface TableSpec<T> {
  table: string;
  fields: Record<keyof T & string, FieldKind>;
}

/** A spec with its entity type erased, for code that loops over every table. */
type AnyTableSpec = { table: string; fields: Record<string, FieldKind> };

function spec<T>(table: string, fields: Record<keyof T & string, FieldKind>): TableSpec<T> {
  return { table, fields };
}

const userSpec = spec<DemoUser>("users", {
  id: "text",
  email: "text",
  passwordHash: "text",
  fullName: "text",
  phone: "text",
  role: "text",
  isActive: "bool"
});

const walletAccountSpec = spec<WalletAccount>("wallet_accounts", {
  id: "text",
  userId: "text",
  currency: "text",
  balanceMinor: "int",
  createdAt: "text",
  updatedAt: "text"
});

const zoneSpec = spec<ParkingZone>("zones", {
  id: "text",
  name: "text",
  code: "text",
  description: "text",
  address: "text",
  latitude: "real",
  longitude: "real",
  hourlyRateMinor: "int",
  currency: "text",
  operatingStart: "text",
  operatingEnd: "text",
  totalSpaces: "int",
  isActive: "bool",
  createdAt: "text",
  updatedAt: "text"
});

const vehicleSpec = spec<Vehicle>("vehicles", {
  id: "text",
  ownerId: "text",
  plateNumber: "text",
  normalizedPlateNumber: "text",
  vehicleType: "text",
  make: "text",
  model: "text",
  colour: "text",
  isActive: "bool",
  createdAt: "text",
  updatedAt: "text"
});

const spotSpec = spec<ParkingSpot>("spots", {
  id: "text",
  zoneId: "text",
  spotCode: "text",
  status: "text",
  isAccessible: "bool",
  vehicleType: "text",
  heldByUserId: "text",
  holdExpiresAt: "text",
  createdAt: "text",
  updatedAt: "text"
});

const bookingSpec = spec<Booking>("bookings", {
  id: "text",
  bookingReference: "text",
  driverId: "text",
  vehicleId: "text",
  zoneId: "text",
  spotId: "text",
  durationMinutes: "int",
  amountMinor: "int",
  currency: "text",
  status: "text",
  reservedAt: "text",
  checkInTime: "text",
  endTime: "text",
  checkOutTime: "text",
  cancelledAt: "text",
  expiredAt: "text",
  createdAt: "text",
  updatedAt: "text"
});

const paymentSpec = spec<Payment>("payments", {
  id: "text",
  bookingId: "text",
  driverId: "text",
  provider: "text",
  providerReference: "text",
  idempotencyKey: "text",
  amountMinor: "int",
  currency: "text",
  status: "text",
  paymentMethod: "text",
  providerPayload: "json",
  verifiedAt: "text",
  createdAt: "text",
  updatedAt: "text"
});

const walletTransactionSpec = spec<WalletTransaction>("wallet_transactions", {
  id: "text",
  walletAccountId: "text",
  userId: "text",
  bookingId: "text",
  paymentId: "text",
  transactionType: "text",
  direction: "text",
  amountMinor: "int",
  balanceBeforeMinor: "int",
  balanceAfterMinor: "int",
  status: "text",
  providerReference: "text",
  description: "text",
  createdAt: "text"
});

const qrTicketSpec = spec<QrTicket>("qr_tickets", {
  id: "text",
  bookingId: "text",
  tokenHash: "text",
  status: "text",
  issuedAt: "text",
  firstEntryAt: "text",
  exitAt: "text",
  revokedAt: "text",
  createdAt: "text"
});

const verificationEventSpec = spec<VerificationEvent>("verification_events", {
  id: "text",
  bookingId: "text",
  qrTicketId: "text",
  wardenId: "text",
  verificationType: "text",
  result: "text",
  plateNumberEntered: "text",
  deviceInformation: "text",
  notes: "text",
  createdAt: "text"
});

const violationSpec = spec<Violation>("violations", {
  id: "text",
  bookingId: "text",
  vehicleId: "text",
  spotId: "text",
  violationType: "text",
  detectedAt: "text",
  overstayMinutes: "int",
  status: "text",
  wardenId: "text",
  wardenNotes: "text",
  confirmedAt: "text",
  dismissedAt: "text",
  createdAt: "text",
  updatedAt: "text"
});

const auditLogSpec = spec<AuditLog>("audit_logs", {
  id: "text",
  actorUserId: "text",
  actorRole: "text",
  action: "text",
  entityType: "text",
  entityId: "text",
  metadata: "json",
  createdAt: "text"
});

/**
 * Insert order. Parents come before children so foreign keys resolve; the
 * snapshot writer deletes in the reverse of this order.
 */
const collectionSpecs = [
  { key: "users", spec: userSpec },
  { key: "walletAccounts", spec: walletAccountSpec },
  { key: "zones", spec: zoneSpec },
  { key: "vehicles", spec: vehicleSpec },
  { key: "spots", spec: spotSpec },
  { key: "bookings", spec: bookingSpec },
  { key: "payments", spec: paymentSpec },
  { key: "walletTransactions", spec: walletTransactionSpec },
  { key: "qrTickets", spec: qrTicketSpec },
  { key: "verificationEvents", spec: verificationEventSpec },
  { key: "violations", spec: violationSpec },
  { key: "auditLogs", spec: auditLogSpec }
] as const;

type CollectionKey = (typeof collectionSpecs)[number]["key"];

function toColumn(field: string) {
  return field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toStorage(value: unknown, kind: FieldKind) {
  if (value === undefined || value === null) {
    return null;
  }
  if (kind === "bool") {
    return value ? 1 : 0;
  }
  if (kind === "json") {
    return JSON.stringify(value);
  }
  return value as string | number;
}

function fromStorage(value: unknown, kind: FieldKind) {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (kind === "bool") {
    return value === 1 || value === true;
  }
  if (kind === "json") {
    return JSON.parse(String(value)) as unknown;
  }
  return value;
}

function readRows(db: DatabaseSync, table: AnyTableSpec): unknown[] {
  const fields = Object.entries(table.fields) as [string, FieldKind][];
  const columns = fields.map(([field]) => `${toColumn(field)} as "${field}"`).join(", ");
  const rows = db.prepare(`select ${columns} from ${table.table}`).all() as Record<string, unknown>[];

  return rows.map((row) => {
    const entity: Record<string, unknown> = {};
    for (const [field, kind] of fields) {
      const value = fromStorage(row[field], kind);
      // Optional domain fields are `undefined`, never `null`, so a nullable
      // column comes back as an absent key rather than an explicit null.
      if (value !== undefined) {
        entity[field] = value;
      }
    }
    return entity;
  });
}

function writeRows(db: DatabaseSync, table: AnyTableSpec, rows: readonly unknown[]) {
  const fields = Object.entries(table.fields) as [string, FieldKind][];
  const columns = fields.map(([field]) => toColumn(field)).join(", ");
  const placeholders = fields.map(() => "?").join(", ");
  const statement = db.prepare(`insert into ${table.table} (${columns}) values (${placeholders})`);

  for (const row of rows) {
    statement.run(...fields.map(([field, kind]) => toStorage((row as Record<string, unknown>)[field], kind)));
  }
}

/**
 * Fails loudly at boot when schema.sql and the table specs have drifted apart,
 * which would otherwise surface much later as a silently missing column.
 */
function assertSchemaMatchesSpecs(db: DatabaseSync) {
  for (const { spec: table } of collectionSpecs) {
    const info = db.prepare(`pragma table_info(${table.table})`).all() as { name: string }[];
    const actual = new Set(info.map((column) => column.name));
    if (actual.size === 0) {
      throw new Error(`Local schema is missing the "${table.table}" table.`);
    }
    const missing = Object.keys(table.fields)
      .map(toColumn)
      .filter((column) => !actual.has(column));
    if (missing.length > 0) {
      throw new Error(`Local schema table "${table.table}" is missing column(s): ${missing.join(", ")}.`);
    }
  }
}

/** Must match `pragma user_version` in schema.sql. */
const SCHEMA_VERSION = 1;

function resolveDatabasePath() {
  const configured = process.env.SMARTPARK_DB_PATH;
  if (configured === ":memory:") {
    return ":memory:";
  }
  return configured ? configured : join(process.cwd(), ".data", "smartpark.db");
}

export function openDatabase() {
  const path = resolveDatabasePath();
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new DatabaseSync(path);
  const { user_version: version } = db.prepare("pragma user_version").get() as { user_version: number };

  if (version === 0) {
    db.exec(readFileSync(join(process.cwd(), "src", "server", "schema.sql"), "utf8"));
  } else if (version !== SCHEMA_VERSION) {
    throw new Error(
      `The database at ${path} uses schema version ${version}, but this build expects ${SCHEMA_VERSION}. ` +
        "Run `pnpm db:reset` to recreate it.",
    );
  }

  assertSchemaMatchesSpecs(db);
  return db;
}

export function isDatabaseEmpty(db: DatabaseSync) {
  const row = db.prepare("select count(*) as count from users").get() as { count: number };
  return row.count === 0;
}

export function loadState(db: DatabaseSync): SmartParkState {
  const state = {} as Record<CollectionKey, unknown>;
  for (const { key, spec: table } of collectionSpecs) {
    state[key] = readRows(db, table as AnyTableSpec);
  }

  const demoQrTokens: Record<string, string> = {};
  for (const row of db.prepare("select booking_id, token from demo_qr_tokens").all() as {
    booking_id: string;
    token: string;
  }[]) {
    demoQrTokens[row.booking_id] = row.token;
  }

  const processedWebhookKeys = new Set(
    (db.prepare("select key from processed_webhook_keys").all() as { key: string }[]).map((row) => row.key),
  );

  return { ...state, demoQrTokens, processedWebhookKeys } as unknown as SmartParkState;
}

/**
 * Replaces the stored snapshot with `state`. The whole write is one deferred
 * transaction, so foreign keys are only checked at commit and a failure leaves
 * the previous snapshot untouched.
 */
export function saveState(db: DatabaseSync, state: SmartParkState) {
  db.exec("begin immediate");
  try {
    db.exec("pragma defer_foreign_keys = on");

    for (const { spec: table } of [...collectionSpecs].reverse()) {
      db.exec(`delete from ${table.table}`);
    }
    db.exec("delete from demo_qr_tokens");
    db.exec("delete from processed_webhook_keys");

    for (const { key, spec: table } of collectionSpecs) {
      writeRows(db, table as AnyTableSpec, (state as unknown as Record<CollectionKey, unknown[]>)[key]);
    }

    const tokenStatement = db.prepare("insert into demo_qr_tokens (booking_id, token) values (?, ?)");
    for (const [bookingId, token] of Object.entries(state.demoQrTokens)) {
      tokenStatement.run(bookingId, token);
    }

    const keyStatement = db.prepare("insert into processed_webhook_keys (key, created_at) values (?, ?)");
    const createdAt = nowIso();
    for (const key of state.processedWebhookKeys) {
      keyStatement.run(key, createdAt);
    }

    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }
}
