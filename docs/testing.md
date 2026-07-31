# Testing

Test layers:

- Unit/domain: price calculation, plate normalization, state transitions, QR hashing, timer calculations.
- Integration/service: booking creation, payment success/failure, QR entry/exit, expiration, violation creation.
- E2E: driver and warden journeys through the browser.

Commands:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:e2e
corepack pnpm build
```

The current machine reported 0 free bytes on `C:`, so dependencies could not be installed during initial scaffolding.
Free disk space is required before running the commands above.
