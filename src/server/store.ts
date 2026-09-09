import "server-only";

import type { DatabaseSync } from "node:sqlite";

import { type SmartParkState } from "@/server/domain";
import { isDatabaseEmpty, loadState, openDatabase, saveState } from "@/server/db";
import { createInitialState } from "@/server/seed";

/**
 * The working set is the plain in-memory `SmartParkState` the service layer
 * mutates directly, backed by a SQLite snapshot on disk. Writes are flushed
 * asynchronously: `markDirty()` schedules a flush on the next tick, and a
 * low-frequency sweep catches any mutation that forgot to announce itself by
 * comparing the serialised state against what was last written.
 */
const SWEEP_INTERVAL_MS = 1_000;

interface Persistence {
  db: DatabaseSync;
  state: SmartParkState;
  lastWritten: string;
  flushScheduled: boolean;
  sweep: NodeJS.Timeout;
}

declare global {
  var __SMARTPARK_PERSISTENCE__: Persistence | undefined;
}

/** `JSON.stringify` drops Sets, so `processedWebhookKeys` is expanded by hand. */
function serialize(state: SmartParkState) {
  return JSON.stringify({ ...state, processedWebhookKeys: [...state.processedWebhookKeys].sort() });
}

function flush(persistence: Persistence) {
  const serialized = serialize(persistence.state);
  if (serialized === persistence.lastWritten) {
    return;
  }

  saveState(persistence.db, persistence.state);
  persistence.lastWritten = serialized;
}

function init(): Persistence {
  const db = openDatabase();
  const state = isDatabaseEmpty(db) ? createInitialState() : loadState(db);

  const sweep = setInterval(() => {
    const current = globalThis.__SMARTPARK_PERSISTENCE__;
    if (current) {
      flush(current);
    }
  }, SWEEP_INTERVAL_MS);
  // Never hold the process open just to run the sweep.
  sweep.unref?.();

  const persistence: Persistence = { db, state, lastWritten: "", flushScheduled: false, sweep };

  // Last line of defence: `saveState` is synchronous, so it can still run here.
  process.on("exit", () => flush(persistence));

  flush(persistence);
  return persistence;
}

function getPersistence() {
  if (!globalThis.__SMARTPARK_PERSISTENCE__) {
    globalThis.__SMARTPARK_PERSISTENCE__ = init();
  }
  return globalThis.__SMARTPARK_PERSISTENCE__;
}

export function getStore() {
  return getPersistence().state;
}

/**
 * Announces that the caller has mutated the store. Flushing is deferred to the
 * next tick so a request that performs several writes still produces a single
 * snapshot write.
 */
export function markDirty() {
  const persistence = getPersistence();
  if (persistence.flushScheduled) {
    return;
  }

  persistence.flushScheduled = true;
  // Deliberately not unref'd: a pending write should keep the process alive
  // for the tick it takes to land.
  setTimeout(() => {
    persistence.flushScheduled = false;
    flush(persistence);
  }, 0);
}

export function resetStoreForTests() {
  const persistence = getPersistence();
  persistence.state = createInitialState();
  flush(persistence);
  return persistence.state;
}
