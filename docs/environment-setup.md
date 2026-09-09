# SmartPark Environment Setup

SmartPark creates a safe `.env.local` automatically the first time `pnpm dev` runs. It starts with mock payments, so
the app remains usable without AZA or Supabase credentials.

## Open the Local Environment File

From PowerShell in the SmartPark folder:

```powershell
corepack pnpm env:setup
notepad .env.local
```

The file is located at:

```text
C:\Users\Forge Mages\Documents\SmartPark\.env.local
```

Run this redacted check at any time. It reports whether values are configured but never prints a secret:

```powershell
corepack pnpm env:check
```

`.env.local` is intentionally excluded from Git. `.env.example` is the committed template that other computers receive.

## Enable AZA Locally

Change only these values in `.env.local`:

```dotenv
PAYMENT_PROVIDER=aza
AZA_API_BASE_URL=https://api.aza.systems
AZA_API_KEY=aza_test_your_key_from_the_merchant_dashboard
AZA_WEBHOOK_SECRET=your_endpoint_signing_secret
```

Restart `pnpm dev`, sign in as Admin, open **Settings**, and select **Test AZA connection**. Start with an
`aza_test_...` key.

## Configure Vercel

Vercel environment values are not stored in a project file. Open the Vercel project, then go to **Settings >
Environment Variables** and add:

```text
NEXT_PUBLIC_APP_URL=https://your-smartpark-domain.vercel.app
PAYMENT_PROVIDER=aza
AZA_API_BASE_URL=https://api.aza.systems
AZA_API_KEY=aza_test_...
AZA_WEBHOOK_SECRET=...
```

Apply the variables to Production and Preview as needed, then redeploy. In the AZA merchant dashboard, register:

```text
https://your-smartpark-domain.vercel.app/api/payments/aza-webhook
```

Subscribe to `checkout.completed`, `checkout.expired`, `checkout.cancelled`, and `checkout.refunded`. The Admin settings
page displays and copies the exact webhook URL generated from `NEXT_PUBLIC_APP_URL`.

## Important Production Boundary

The current demo store lives in server memory. That is fine for a classroom demonstration, but it is not durable across
Vercel instances or restarts. Wire the included Supabase/PostgreSQL schema to the service layer before receiving real
payments so checkout sessions, bookings, and processed webhook IDs share one durable database.
