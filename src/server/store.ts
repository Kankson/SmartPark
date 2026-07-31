import "server-only";

import { type SmartParkState } from "@/server/domain";
import { createInitialState } from "@/server/seed";

declare global {
  var __SMARTPARK_STATE__: SmartParkState | undefined;
}

export function getStore() {
  if (!globalThis.__SMARTPARK_STATE__) {
    globalThis.__SMARTPARK_STATE__ = createInitialState();
  }

  return globalThis.__SMARTPARK_STATE__;
}

export function resetStoreForTests() {
  globalThis.__SMARTPARK_STATE__ = createInitialState();
  return globalThis.__SMARTPARK_STATE__;
}
