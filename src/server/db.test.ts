import { describe, expect, it } from "vitest";

import { isDatabaseEmpty, loadState, openDatabase, saveState } from "@/server/db";
import { createInitialState } from "@/server/seed";

/** Comparable form: Sets expanded, and key order normalised away. */
function normalize(state: ReturnType<typeof createInitialState>) {
  const plain = { ...state, processedWebhookKeys: [...state.processedWebhookKeys].sort() };
  return Object.fromEntries(Object.entries(plain).sort(([a], [b]) => a.localeCompare(b)));
}

describe("local database", () => {
  it("reports an unseeded database as empty", () => {
    expect(isDatabaseEmpty(openDatabase())).toBe(true);
  });

  it("round-trips the seeded state without losing or inventing fields", () => {
    const db = openDatabase();
    const state = createInitialState();

    saveState(db, state);

    expect(isDatabaseEmpty(db)).toBe(false);
    expect(normalize(loadState(db))).toEqual(normalize(state));
  });

  it("keeps the previous snapshot when a write violates the schema", () => {
    const db = openDatabase();
    const state = createInitialState();
    saveState(db, state);

    const invalid = createInitialState();
    invalid.bookings[0].status = "not_a_status" as never;

    expect(() => saveState(db, invalid)).toThrow();
    expect(loadState(db).bookings).toHaveLength(state.bookings.length);
  });

  it("replaces rather than accumulates rows across writes", () => {
    const db = openDatabase();
    const state = createInitialState();

    saveState(db, state);
    saveState(db, state);

    expect(loadState(db).zones).toHaveLength(state.zones.length);
  });
});
