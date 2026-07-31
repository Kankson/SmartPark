create extension if not exists pgcrypto;

create type public.user_role as enum ('driver', 'warden', 'admin');
create type public.booking_status as enum (
  'pending_payment',
  'reserved',
  'active',
  'completed',
  'cancelled',
  'payment_failed',
  'expired'
);
create type public.parking_spot_status as enum ('available', 'held', 'reserved', 'occupied', 'unavailable');
create type public.payment_status as enum ('pending', 'successful', 'failed', 'cancelled', 'refunded');
create type public.qr_ticket_status as enum ('active', 'entered', 'exited', 'revoked', 'expired');
create type public.verification_type as enum (
  'entry',
  'status_check',
  'exit',
  'manual_plate_search',
  'plate_recognition'
);
create type public.verification_result as enum (
  'valid',
  'invalid',
  'expired',
  'already_used',
  'not_found',
  'mismatch'
);
create type public.violation_status as enum ('open', 'confirmed', 'dismissed', 'resolved');
create type public.violation_type as enum (
  'expired_session',
  'invalid_ticket',
  'wrong_parking_space',
  'plate_mismatch',
  'unpaid_vehicle'
);
create type public.wallet_transaction_type as enum ('top_up', 'parking_payment', 'refund', 'adjustment');
create type public.wallet_direction as enum ('credit', 'debit');
create type public.wallet_transaction_status as enum ('pending', 'posted', 'failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'driver',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plate_number text not null,
  normalized_plate_number text not null,
  vehicle_type text not null default 'car',
  make text not null default '',
  model text not null default '',
  colour text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_normalized_plate_check check (normalized_plate_number = upper(regexp_replace(plate_number, '[^a-zA-Z0-9]', '', 'g')))
);

create unique index vehicles_active_plate_unique
  on public.vehicles (normalized_plate_number)
  where is_active;
create index vehicles_owner_idx on public.vehicles(owner_id);
create index vehicles_normalized_plate_idx on public.vehicles(normalized_plate_number);

create table public.parking_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text not null default '',
  address text not null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  hourly_rate_minor integer not null check (hourly_rate_minor >= 0),
  currency char(3) not null default 'GHS',
  operating_start time not null,
  operating_end time not null,
  total_spaces integer not null default 0 check (total_spaces >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parking_spots (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.parking_zones(id) on delete cascade,
  spot_code text not null,
  status public.parking_spot_status not null default 'available',
  is_accessible boolean not null default false,
  vehicle_type text not null default 'car',
  held_by_user_id uuid references public.profiles(id) on delete set null,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parking_spots_zone_code_unique unique (zone_id, spot_code),
  constraint parking_spots_hold_check check (
    (status = 'held' and held_by_user_id is not null and hold_expires_at is not null)
    or (status <> 'held')
  )
);

create index parking_spots_zone_status_idx on public.parking_spots(zone_id, status);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  driver_id uuid not null references public.profiles(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  zone_id uuid not null references public.parking_zones(id) on delete restrict,
  spot_id uuid not null references public.parking_spots(id) on delete restrict,
  duration_minutes integer not null check (duration_minutes in (30, 60, 90, 120, 180, 240)),
  amount_minor integer not null check (amount_minor >= 0),
  currency char(3) not null default 'GHS',
  status public.booking_status not null default 'pending_payment',
  reserved_at timestamptz,
  check_in_time timestamptz,
  end_time timestamptz,
  check_out_time timestamptz,
  cancelled_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_driver_idx on public.bookings(driver_id);
create index bookings_spot_idx on public.bookings(spot_id);
create index bookings_status_idx on public.bookings(status);
create index bookings_end_time_idx on public.bookings(end_time);
create index bookings_reference_idx on public.bookings(booking_reference);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  driver_id uuid not null references public.profiles(id) on delete restrict,
  provider text not null,
  provider_reference text not null,
  idempotency_key text not null unique,
  amount_minor integer not null check (amount_minor >= 0),
  currency char(3) not null default 'GHS',
  status public.payment_status not null default 'pending',
  payment_method text not null,
  provider_payload jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_provider_reference_unique on public.payments(provider, provider_reference);
create index payments_booking_idx on public.payments(booking_id);
create index payments_driver_idx on public.payments(driver_id);

create table public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency char(3) not null default 'GHS',
  balance_minor integer not null default 0 check (balance_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallet_accounts_user_currency_unique unique (user_id, currency)
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid not null references public.wallet_accounts(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  booking_id uuid references public.bookings(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete restrict,
  transaction_type public.wallet_transaction_type not null,
  direction public.wallet_direction not null,
  amount_minor integer not null check (amount_minor > 0),
  balance_before_minor integer not null check (balance_before_minor >= 0),
  balance_after_minor integer not null check (balance_after_minor >= 0),
  status public.wallet_transaction_status not null default 'posted',
  provider_reference text,
  description text not null,
  created_at timestamptz not null default now()
);

create index wallet_transactions_user_idx on public.wallet_transactions(user_id, created_at desc);

create table public.qr_tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  token_hash text not null unique,
  status public.qr_ticket_status not null default 'active',
  issued_at timestamptz not null default now(),
  first_entry_at timestamptz,
  exit_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.verification_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  qr_ticket_id uuid references public.qr_tickets(id) on delete set null,
  warden_id uuid not null references public.profiles(id) on delete restrict,
  verification_type public.verification_type not null,
  result public.verification_result not null,
  plate_number_entered text,
  device_information text,
  notes text,
  created_at timestamptz not null default now()
);

create index verification_events_booking_idx on public.verification_events(booking_id, created_at desc);
create index verification_events_warden_idx on public.verification_events(warden_id, created_at desc);

create table public.violations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  spot_id uuid not null references public.parking_spots(id) on delete restrict,
  violation_type public.violation_type not null,
  detected_at timestamptz not null default now(),
  overstay_minutes integer not null default 0 check (overstay_minutes >= 0),
  status public.violation_status not null default 'open',
  warden_id uuid references public.profiles(id) on delete set null,
  warden_notes text,
  confirmed_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index violations_booking_type_unique
  on public.violations(booking_id, violation_type);
create index violations_status_idx on public.violations(status);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_role public.user_role,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger vehicles_set_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();
create trigger parking_zones_set_updated_at before update on public.parking_zones
  for each row execute function public.set_updated_at();
create trigger parking_spots_set_updated_at before update on public.parking_spots
  for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger wallet_accounts_set_updated_at before update on public.wallet_accounts
  for each row execute function public.set_updated_at();
create trigger violations_set_updated_at before update on public.violations
  for each row execute function public.set_updated_at();

create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.hold_parking_spot(
  p_spot_id uuid,
  p_user_id uuid,
  p_hold_expires_at timestamptz
)
returns public.parking_spots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spot public.parking_spots;
begin
  update public.parking_spots
  set status = 'held',
      held_by_user_id = p_user_id,
      hold_expires_at = p_hold_expires_at
  where id = p_spot_id
    and status = 'available'
  returning * into v_spot;

  if v_spot.id is null then
    raise exception 'Parking space is not available';
  end if;

  return v_spot;
end;
$$;

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.parking_zones enable row level security;
alter table public.parking_spots enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.qr_tickets enable row level security;
alter table public.verification_events enable row level security;
alter table public.violations enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = auth.uid() or public.current_app_role() in ('warden', 'admin'));
create policy "profiles_update_own_basic" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "vehicles_driver_manage_own" on public.vehicles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "vehicles_staff_read" on public.vehicles
  for select using (public.current_app_role() in ('warden', 'admin'));

create policy "zones_read_authenticated" on public.parking_zones
  for select using (auth.role() = 'authenticated');
create policy "zones_admin_manage" on public.parking_zones
  for all using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

create policy "spots_read_authenticated" on public.parking_spots
  for select using (auth.role() = 'authenticated');
create policy "spots_admin_manage" on public.parking_spots
  for all using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

create policy "bookings_driver_read_own" on public.bookings
  for select using (driver_id = auth.uid());
create policy "bookings_staff_read" on public.bookings
  for select using (public.current_app_role() in ('warden', 'admin'));

create policy "payments_driver_read_own" on public.payments
  for select using (driver_id = auth.uid());
create policy "payments_admin_read" on public.payments
  for select using (public.current_app_role() = 'admin');

create policy "wallet_accounts_driver_read_own" on public.wallet_accounts
  for select using (user_id = auth.uid());
create policy "wallet_transactions_driver_read_own" on public.wallet_transactions
  for select using (user_id = auth.uid());
create policy "wallet_transactions_admin_read" on public.wallet_transactions
  for select using (public.current_app_role() = 'admin');

create policy "qr_tickets_driver_read_own" on public.qr_tickets
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = qr_tickets.booking_id
        and b.driver_id = auth.uid()
    )
  );
create policy "qr_tickets_warden_read" on public.qr_tickets
  for select using (public.current_app_role() in ('warden', 'admin'));

create policy "verification_events_staff_read" on public.verification_events
  for select using (public.current_app_role() in ('warden', 'admin'));
create policy "verification_events_warden_insert" on public.verification_events
  for insert with check (warden_id = auth.uid() and public.current_app_role() = 'warden');

create policy "violations_staff_read" on public.violations
  for select using (public.current_app_role() in ('warden', 'admin'));
create policy "violations_warden_update_status" on public.violations
  for update using (public.current_app_role() = 'warden') with check (public.current_app_role() = 'warden');

create policy "audit_logs_admin_read" on public.audit_logs
  for select using (public.current_app_role() = 'admin');

revoke insert, update, delete on public.payments from authenticated;
revoke insert, update, delete on public.wallet_accounts from authenticated;
revoke insert, update, delete on public.wallet_transactions from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;
