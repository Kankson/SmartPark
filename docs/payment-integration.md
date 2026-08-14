# Payment Integration

SmartPark supports AZA hosted checkout and retains a mock provider for local demonstrations. The provider is selected
with `PAYMENT_PROVIDER=mock` or `PAYMENT_PROVIDER=aza`.

The server-side adapter contract is:

```ts
interface PaymentProvider {
  readonly name: "mock" | "aza";
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedWebhookEvent>;
}
```

## AZA Configuration

1. Register the business at `https://merchants.aza.systems/onboarding` and complete KYB.
2. Generate a test API key from **Settings > API Keys** in the AZA merchant dashboard.
3. Register a public HTTPS webhook endpoint:

   ```text
   https://your-smartpark-domain.example/api/payments/aza-webhook
   ```

4. Subscribe the endpoint to `checkout.completed`, `checkout.expired`, `checkout.cancelled`, and
   `checkout.refunded`.
5. Put the test API key and endpoint signing secret in `.env.local`:

   ```dotenv
   PAYMENT_PROVIDER=aza
   AZA_API_BASE_URL=https://api.aza.systems
   AZA_API_KEY=aza_test_replace-with-the-dashboard-key
   AZA_WEBHOOK_SECRET=replace-with-the-endpoint-signing-secret
   ```

6. Restart SmartPark after changing the environment.

The local file is created automatically by `pnpm dev`. Use these commands to open it and verify setup without printing
secrets:

```powershell
corepack pnpm env:setup
notepad .env.local
corepack pnpm env:check
```

After restarting, Admin users can open **Settings** to copy the exact webhook URL and test `GET /api/v1/merchant/me`
through SmartPark's server-side connection check.

Use an `aza_test_...` key until the full workflow has been tested. Test keys use the production-shaped API without
moving real money. Never expose either AZA secret through a `NEXT_PUBLIC_...` variable.

## Booking Payment Flow

```text
Driver selects parking
  -> SmartPark holds the spot
  -> server calculates the GHS amount
  -> POST /api/v1/merchant/sessions
  -> driver opens the returned checkoutUrl
  -> customer approves payment in AZA
  -> AZA posts checkout.completed
  -> SmartPark verifies HMAC and payment fields
  -> booking becomes reserved and QR ticket is issued
```

SmartPark sends GHS as a decimal value because AZA expects values such as `7.50`. Internally, SmartPark continues to
store money as integer pesewas. The booking reference is sent as AZA's `reference`; purpose and booking identifiers are
sent as a JSON string in `metadata`; the payment ID is sent as `idempotencyKey`.

The driver is never trusted to report payment success. A pending page may link back to the hosted checkout, but only a
verified `checkout.completed` webhook can reserve the spot or issue a ticket.

## Webhook Verification

The route reads the raw request body before parsing JSON and verifies:

- `X-Aza-Signature` as `sha256=<hex>` using HMAC-SHA256 and a constant-time comparison
- `X-Aza-Event` against the event in the JSON body
- `X-Aza-Delivery` as the retry-deduplication key
- session ID against the stored provider reference
- amount, currency, and booking reference against the stored payment

The delivery ID is saved only after processing succeeds. Repeated deliveries are acknowledged without applying the
financial state change twice.

## Session Status Mapping

| AZA status or event | SmartPark result |
|---|---|
| `PENDING` | Payment remains pending and the space remains held |
| `COMPLETED` / `checkout.completed` | Payment succeeds; reservation or extension is applied |
| `EXPIRED` / `checkout.expired` | Payment fails and an initial booking hold is released |
| `CANCELLED` / `checkout.cancelled` | Payment fails and an initial booking hold is released |
| `REFUNDED` / `checkout.refunded` | Payment is marked refunded; an unused reservation is cancelled and its QR is revoked |

## Development Mode

`PAYMENT_PROVIDER=mock` preserves the immediate local workflow and demonstration wallet. It does not contact AZA. The
same booking, pricing, QR, and enforcement rules are used after payment confirmation.

The current in-memory store is suitable only for a single-process demonstration. Before receiving production webhooks,
payments and processed delivery IDs must be stored in Supabase/PostgreSQL so every server instance sees the same state.

## Required Production Rules

- Never trust browser payment success.
- Verify webhook signatures.
- Process callbacks idempotently.
- Store sanitized provider payloads only.
- Never store card data.
- Keep the AZA API key and signing secret in server environment variables, never in Git or client-side code.
- Store payment and webhook idempotency records in a transactional database.
- Do not debit the demonstration wallet for externally settled AZA payments.
- Audit every financial state change.
