-- SmartPark local schema (SQLite).
--
-- This mirrors supabase/migrations/001_initial_schema.sql, which is the
-- production Postgres target. Postgres enums become CHECK constraints, uuid
-- becomes text (the domain layer generates prefixed ids), timestamptz becomes
-- text holding ISO-8601 UTC, and booleans become 0/1 integers.
--
-- Column names are snake_case; src/server/db.ts derives them from the
-- camelCase domain field names and asserts at boot that the two agree.

pragma journal_mode = wal;
pragma foreign_keys = on;

-- Bump this (and SCHEMA_VERSION in src/server/db.ts) whenever the shape below
-- changes. `create table if not exists` cannot alter an existing database, so
-- the version is what stops a stale file being used against a newer schema.
pragma user_version = 1;

create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  phone text not null,
  role text not null check (role in ('driver', 'warden', 'admin')),
  is_active integer not null check (is_active in (0, 1))
);

create table if not exists wallet_accounts (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  currency text not null,
  balance_minor integer not null,
  created_at text not null,
  updated_at text not null,
  unique (user_id, currency)
);

create table if not exists vehicles (
  id text primary key,
  owner_id text not null references users(id) on delete cascade,
  plate_number text not null,
  normalized_plate_number text not null,
  vehicle_type text not null check (vehicle_type in ('car', 'motorcycle', 'van', 'accessible')),
  make text not null,
  model text not null,
  colour text not null,
  is_active integer not null check (is_active in (0, 1)),
  created_at text not null,
  updated_at text not null
);

create table if not exists zones (
  id text primary key,
  name text not null,
  code text not null unique,
  description text not null,
  address text not null,
  latitude real not null,
  longitude real not null,
  hourly_rate_minor integer not null,
  currency text not null,
  operating_start text not null,
  operating_end text not null,
  total_spaces integer not null,
  is_active integer not null check (is_active in (0, 1)),
  created_at text not null,
  updated_at text not null
);

create table if not exists spots (
  id text primary key,
  zone_id text not null references zones(id) on delete cascade,
  spot_code text not null,
  status text not null check (status in ('available', 'held', 'reserved', 'occupied', 'unavailable')),
  is_accessible integer not null check (is_accessible in (0, 1)),
  vehicle_type text not null check (vehicle_type in ('car', 'motorcycle', 'van', 'accessible')),
  held_by_user_id text references users(id) on delete set null,
  hold_expires_at text,
  created_at text not null,
  updated_at text not null,
  unique (zone_id, spot_code)
);

create table if not exists bookings (
  id text primary key,
  booking_reference text not null unique,
  driver_id text not null references users(id) on delete cascade,
  vehicle_id text not null references vehicles(id) on delete cascade,
  zone_id text not null references zones(id) on delete cascade,
  spot_id text not null references spots(id) on delete cascade,
  duration_minutes integer not null,
  amount_minor integer not null,
  currency text not null,
  status text not null check (
    status in ('pending_payment', 'reserved', 'active', 'completed', 'cancelled', 'payment_failed', 'expired')
  ),
  reserved_at text,
  check_in_time text,
  end_time text,
  check_out_time text,
  cancelled_at text,
  expired_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists payments (
  id text primary key,
  booking_id text not null references bookings(id) on delete cascade,
  driver_id text not null references users(id) on delete cascade,
  provider text not null,
  provider_reference text not null,
  idempotency_key text not null unique,
  amount_minor integer not null,
  currency text not null,
  status text not null check (status in ('pending', 'successful', 'failed', 'cancelled', 'refunded')),
  payment_method text not null,
  provider_payload text not null,
  verified_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists wallet_transactions (
  id text primary key,
  wallet_account_id text not null references wallet_accounts(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  booking_id text references bookings(id) on delete set null,
  payment_id text references payments(id) on delete set null,
  transaction_type text not null check (
    transaction_type in ('top_up', 'parking_payment', 'refund', 'adjustment')
  ),
  direction text not null check (direction in ('credit', 'debit')),
  amount_minor integer not null,
  balance_before_minor integer not null,
  balance_after_minor integer not null,
  status text not null check (status in ('pending', 'posted', 'failed')),
  provider_reference text,
  description text not null,
  created_at text not null
);

create table if not exists qr_tickets (
  id text primary key,
  booking_id text not null references bookings(id) on delete cascade,
  token_hash text not null unique,
  status text not null check (status in ('active', 'entered', 'exited', 'revoked', 'expired')),
  issued_at text not null,
  first_entry_at text,
  exit_at text,
  revoked_at text,
  created_at text not null
);

create table if not exists verification_events (
  id text primary key,
  booking_id text references bookings(id) on delete set null,
  qr_ticket_id text references qr_tickets(id) on delete set null,
  warden_id text not null references users(id) on delete cascade,
  verification_type text not null check (
    verification_type in ('entry', 'status_check', 'exit', 'manual_plate_search', 'plate_recognition')
  ),
  result text not null check (
    result in ('valid', 'invalid', 'expired', 'already_used', 'not_found', 'mismatch')
  ),
  plate_number_entered text,
  device_information text,
  notes text,
  created_at text not null
);

create table if not exists violations (
  id text primary key,
  booking_id text not null references bookings(id) on delete cascade,
  vehicle_id text not null references vehicles(id) on delete cascade,
  spot_id text not null references spots(id) on delete cascade,
  violation_type text not null check (
    violation_type in ('expired_session', 'invalid_ticket', 'wrong_parking_space', 'plate_mismatch', 'unpaid_vehicle')
  ),
  detected_at text not null,
  overstay_minutes integer not null,
  status text not null check (status in ('open', 'confirmed', 'dismissed', 'resolved')),
  warden_id text references users(id) on delete set null,
  warden_notes text,
  confirmed_at text,
  dismissed_at text,
  created_at text not null,
  updated_at text not null
);

-- No foreign key on actor_user_id: the audit trail has to outlive the accounts
-- it references, and it also records non-user actors such as "system".
create table if not exists audit_logs (
  id text primary key,
  actor_user_id text,
  actor_role text check (actor_role in ('driver', 'warden', 'admin')),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata text not null,
  created_at text not null
);

-- Demo-only QR tokens, kept so a reloaded ticket page can re-render its code.
create table if not exists demo_qr_tokens (
  booking_id text primary key references bookings(id) on delete cascade,
  token text not null
);

-- Webhook idempotency keys already applied, so a replayed webhook is a no-op.
create table if not exists processed_webhook_keys (
  key text primary key,
  created_at text not null
);

create index if not exists vehicles_owner_idx on vehicles(owner_id);
create index if not exists vehicles_plate_idx on vehicles(normalized_plate_number);
create index if not exists spots_zone_status_idx on spots(zone_id, status);
create index if not exists bookings_driver_idx on bookings(driver_id);
create index if not exists bookings_status_idx on bookings(status);
create index if not exists bookings_spot_idx on bookings(spot_id);
create index if not exists payments_booking_idx on payments(booking_id);
create index if not exists wallet_transactions_user_idx on wallet_transactions(user_id, created_at);
create index if not exists qr_tickets_booking_idx on qr_tickets(booking_id);
create index if not exists verification_events_booking_idx on verification_events(booking_id, created_at);
create index if not exists violations_status_idx on violations(status, detected_at);
create index if not exists audit_logs_entity_idx on audit_logs(entity_type, entity_id, created_at);
