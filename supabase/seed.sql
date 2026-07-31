-- Demo parking data for local Supabase projects.
-- Create auth users first, then insert matching profiles with the user IDs from auth.users.
-- This seed intentionally avoids creating official city data.

insert into public.parking_zones
  (id, name, code, description, address, latitude, longitude, hourly_rate_minor, currency, operating_start, operating_end, total_spaces)
values
  ('00000000-0000-0000-0000-000000000101', 'Central Market Zone A', 'CMA', 'High-turnover street parking beside the central market.', 'Central Market Road, City Centre', 5.5571000, -0.2057000, 500, 'GHS', '06:00', '22:00', 20),
  ('00000000-0000-0000-0000-000000000102', 'High Street Zone B', 'HSB', 'Business district parking for short visits.', 'High Street, City Centre', 5.5524000, -0.2025000, 700, 'GHS', '07:00', '21:00', 20),
  ('00000000-0000-0000-0000-000000000103', 'Independence Avenue Zone C', 'IAC', 'Civic-area parking with accessible spaces.', 'Independence Avenue, City Centre', 5.5615000, -0.1918000, 600, 'GHS', '06:30', '20:30', 20)
on conflict (code) do nothing;

insert into public.parking_spots (zone_id, spot_code, status, is_accessible, vehicle_type)
select z.id, z.code || '-' || lpad(gs::text, 2, '0'),
  case
    when gs = 2 then 'reserved'::public.parking_spot_status
    when gs = 3 then 'occupied'::public.parking_spot_status
    when gs = 4 then 'unavailable'::public.parking_spot_status
    else 'available'::public.parking_spot_status
  end,
  gs in (1, 2),
  case when gs = 5 then 'motorcycle' else 'car' end
from public.parking_zones z
cross join generate_series(1, 20) as gs
where z.code in ('CMA', 'HSB', 'IAC')
on conflict (zone_id, spot_code) do nothing;
