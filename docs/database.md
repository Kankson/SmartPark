# Database

The production schema is defined in `supabase/migrations/001_initial_schema.sql`.

Core tables:

- `profiles`
- `vehicles`
- `parking_zones`
- `parking_spots`
- `bookings`
- `payments`
- `wallet_accounts`
- `wallet_transactions`
- `qr_tickets`
- `verification_events`
- `violations`
- `audit_logs`

Money is stored in integer minor units such as pesewas or cents. QR tickets store only hashed tokens. Wallet transaction
history is append-only from the browser perspective.

## Integrity Controls

- UUID primary keys
- Unique active plate numbers
- Unique spot code within a zone
- Unique payment idempotency keys
- Unique QR token hashes
- Booking and spot status enums
- RLS policies for all exposed tables
- `hold_parking_spot()` conditional update helper for atomic holds

Available-space counts should be calculated from `parking_spots`, not manually trusted.
