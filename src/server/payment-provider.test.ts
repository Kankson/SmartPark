import { createHmac } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { AzaPaymentProvider, getAzaConfigurationStatus } from "@/server/payment-provider";

describe("AZA payment provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("creates a hosted checkout with server-side authentication and GHS decimal amounts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "aza-session-1",
            status: "PENDING",
            amount: 7.5,
            currency: "GHS",
            reference: "SP-BOOKING-1",
            checkoutUrl: "https://pay.aza.systems/c/aza-session-1",
            expiresAt: "2026-07-31T10:30:00Z"
          }
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new AzaPaymentProvider({
      apiKey: "aza_test_example",
      webhookSecret: "webhook-secret"
    });

    const checkout = await provider.createPayment({
      bookingId: "booking-1",
      driverId: "driver-1",
      amountMinor: 750,
      currency: "GHS",
      idempotencyKey: "idem-1",
      reference: "SP-BOOKING-1",
      metadata: { purpose: "booking" }
    });

    expect(checkout).toMatchObject({
      provider: "aza",
      providerReference: "aza-session-1",
      status: "pending",
      redirectUrl: "https://pay.aza.systems/c/aza-session-1"
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.aza.systems/api/v1/merchant/sessions");
    expect(new Headers(request.headers).get("x-api-key")).toBe("aza_test_example");
    expect(JSON.parse(String(request.body))).toMatchObject({
      amount: 7.5,
      reference: "SP-BOOKING-1",
      idempotencyKey: "idem-1"
    });
  });

  it("verifies AZA webhook signatures and uses the delivery ID for deduplication", async () => {
    const secret = "webhook-secret";
    const rawBody = JSON.stringify({
      event: "checkout.completed",
      sessionId: "aza-session-1",
      amount: 7.5,
      currency: "GHS",
      reference: "SP-BOOKING-1"
    });
    const signature = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
    const provider = new AzaPaymentProvider({ apiKey: "aza_test_example", webhookSecret: secret });

    const event = await provider.verifyWebhook(
      rawBody,
      new Headers({
        "x-aza-signature": signature,
        "x-aza-event": "checkout.completed",
        "x-aza-delivery": "delivery-1"
      }),
    );

    expect(event).toMatchObject({
      idempotencyKey: "delivery-1",
      providerReference: "aza-session-1",
      eventType: "checkout.completed",
      status: "successful"
    });
  });

  it("rejects a webhook whose signed body was changed", async () => {
    const provider = new AzaPaymentProvider({ apiKey: "aza_test_example", webhookSecret: "webhook-secret" });
    const rawBody = JSON.stringify({ event: "checkout.completed", sessionId: "aza-session-1" });

    await expect(
      provider.verifyWebhook(
        rawBody,
        new Headers({
          "x-aza-signature": `sha256=${"0".repeat(64)}`,
          "x-aza-event": "checkout.completed",
          "x-aza-delivery": "delivery-1"
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_webhook_signature", status: 401 });
  });

  it("handles AZA's nested error envelope without leaking the API key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: "INVALID_API_KEY", message: "Invalid API key" }
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const provider = new AzaPaymentProvider({
      apiKey: "aza_test_do-not-print-this",
      webhookSecret: "webhook-secret"
    });

    await expect(provider.checkConnection()).rejects.toMatchObject({
      code: "invalid_api_key",
      message: "Invalid API key",
      status: 401
    });
  });

  it("reports redacted AZA readiness from server environment values", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "aza");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://smartpark.example/");
    vi.stubEnv("AZA_API_KEY", "aza_test_real-looking-key");
    vi.stubEnv("AZA_WEBHOOK_SECRET", "configured-signing-secret");

    expect(getAzaConfigurationStatus()).toEqual(expect.objectContaining({
      provider: "aza",
      apiKeyConfigured: true,
      webhookSecretConfigured: true,
      apiKeyMode: "test",
      ready: true,
      webhookUrl: "https://smartpark.example/api/payments/aza-webhook"
    }));
  });
});
