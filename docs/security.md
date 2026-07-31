# Security Notes

This MVP is a demonstrator, not a real-money production system.

Implemented or documented controls:

- Server-side role checks
- Supabase RLS migration
- Hashed QR tokens
- No service-role key in client code
- No browser-side wallet balance updates
- Server-side price calculation
- Payment provider abstraction
- Mock webhook signature verification
- Audit log table
- Protected warden/admin routes

Before production:

- Complete Supabase repository wiring and test RLS with real users.
- Add production rate limiting.
- Add provider-specific webhook replay protection.
- Review logging and retention for personal data.
- Review operational rules for violations and fines.
- Run a security audit before processing real money.
