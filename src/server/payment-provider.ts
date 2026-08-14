import { createHmac, timingSafeEqual } from "node:crypto";

import { DomainError, createId, nowIso } from "@/server/domain";

export type PaymentProviderName = "mock" | "aza";
export type PaymentResultStatus = "pending" | "successful" | "failed" | "refunded";

export interface CreatePaymentInput {
  bookingId: string;
  driverId: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  provider: PaymentProviderName;
  providerReference: string;
  status: Exclude<PaymentResultStatus, "refunded">;
  redirectUrl?: string;
  expiresAt?: string;
}

export interface VerifyPaymentResult {
  providerReference: string;
  status: PaymentResultStatus;
  verifiedAt: string;
  payload: Record<string, unknown>;
}

export interface VerifiedWebhookEvent {
  idempotencyKey: string;
  providerReference: string;
  eventType: string;
  status: Exclude<PaymentResultStatus, "pending">;
  payload: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedWebhookEvent>;
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock" as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      provider: "mock",
      providerReference: `mock_${input.bookingId}_${createId("ref")}`,
      status: "pending",
      redirectUrl: `/driver/payment-result?bookingId=${input.bookingId}`
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const isFailure = reference.includes("fail");

    return {
      providerReference: reference,
      status: isFailure ? "failed" : "successful",
      verifiedAt: nowIso(),
      payload: { mode: "mock", reference }
    };
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedWebhookEvent> {
    const expectedSecret = process.env.MOCK_PAYMENT_WEBHOOK_SECRET ?? "smartpark-dev-secret";
    const signature = headers.get("x-smartpark-signature");

    if (signature !== expectedSecret) {
      throw new DomainError("Invalid mock webhook signature", "invalid_webhook_signature", 401);
    }

    const body = parseJsonRecord(rawBody, "Invalid mock webhook payload");
    const providerReference = String(body.providerReference ?? "");
    const idempotencyKey = String(body.idempotencyKey ?? providerReference);
    const status = body.status === "failed" ? "failed" : "successful";

    if (!providerReference) {
      throw new DomainError("Missing provider reference", "missing_provider_reference");
    }

    return {
      idempotencyKey,
      providerReference,
      eventType: status === "successful" ? "checkout.completed" : "checkout.expired",
      status,
      payload: body
    };
  }
}

interface AzaPaymentProviderOptions {
  apiKey: string;
  webhookSecret: string;
  baseUrl?: string;
}

interface AzaSession {
  id: string;
  status: string;
  amount: number;
  currency: string;
  reference?: string;
  checkoutUrl?: string;
  expiresAt?: string;
  createdAt?: string;
}

interface AzaSuccessEnvelope<T> {
  success: true;
  data: T;
}

interface AzaErrorEnvelope {
  success: false;
  error?: string | {
    code?: string;
    message?: string;
    field?: string;
  };
  message?: string;
  statusCode?: number;
}

export interface AzaConfigurationStatus {
  provider: PaymentProviderName;
  apiBaseUrl: string;
  appUrl: string;
  webhookUrl: string;
  apiKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
  apiKeyMode: "test" | "live" | "unknown" | "missing";
  ready: boolean;
}

export class AzaPaymentProvider implements PaymentProvider {
  readonly name = "aza" as const;
  private readonly baseUrl: string;

  constructor(private readonly options: AzaPaymentProviderOptions) {
    this.baseUrl = (options.baseUrl ?? "https://api.aza.systems").replace(/\/$/, "");
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (input.currency !== "GHS") {
      throw new DomainError("AZA checkout currently supports GHS payments only.", "unsupported_currency");
    }

    const session = await this.request<AzaSession>("/api/v1/merchant/sessions", {
      method: "POST",
      body: JSON.stringify({
        amount: minorToDecimal(input.amountMinor),
        description: input.description ?? `SmartPark parking payment ${input.bookingId}`,
        reference: input.reference ?? input.bookingId,
        metadata: JSON.stringify({
          bookingId: input.bookingId,
          driverId: input.driverId,
          ...input.metadata
        }),
        idempotencyKey: input.idempotencyKey
      })
    });

    if (!session.id || !session.checkoutUrl) {
      throw new DomainError("AZA did not return a valid checkout session.", "invalid_provider_response", 502);
    }

    return {
      provider: "aza",
      providerReference: session.id,
      status: mapAzaStatus(session.status) === "successful" ? "successful" : "pending",
      redirectUrl: session.checkoutUrl,
      expiresAt: session.expiresAt
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const session = await this.request<AzaSession>(`/api/v1/merchant/sessions/${encodeURIComponent(reference)}`);

    return {
      providerReference: session.id,
      status: mapAzaStatus(session.status),
      verifiedAt: nowIso(),
      payload: session as unknown as Record<string, unknown>
    };
  }

  async checkConnection(): Promise<void> {
    await this.request<Record<string, unknown>>("/api/v1/merchant/me");
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedWebhookEvent> {
    const signature = headers.get("x-aza-signature") ?? "";
    const eventHeader = headers.get("x-aza-event") ?? "";
    const deliveryId = headers.get("x-aza-delivery") ?? "";

    verifyAzaSignature(rawBody, signature, this.options.webhookSecret);

    if (!deliveryId) {
      throw new DomainError("Missing AZA delivery ID.", "missing_webhook_delivery", 400);
    }

    const body = parseJsonRecord(rawBody, "Invalid AZA webhook payload");
    const eventType = String(body.event ?? "");
    const providerReference = String(body.sessionId ?? "");

    if (!eventType || !providerReference) {
      throw new DomainError("AZA webhook is missing its event or session ID.", "invalid_webhook_payload", 400);
    }
    if (eventHeader && eventHeader !== eventType) {
      throw new DomainError("AZA webhook event header does not match its body.", "webhook_event_mismatch", 400);
    }

    const supportedEvents = [
      "checkout.completed",
      "checkout.expired",
      "checkout.cancelled",
      "checkout.refunded"
    ];
    if (!supportedEvents.includes(eventType)) {
      throw new DomainError("Unsupported AZA webhook event.", "unsupported_webhook_event", 400);
    }

    const status = eventType === "checkout.completed"
      ? "successful"
      : eventType === "checkout.refunded"
        ? "refunded"
        : "failed";

    return {
      idempotencyKey: deliveryId,
      providerReference,
      eventType,
      status,
      payload: body
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": this.options.apiKey,
          ...init.headers
        },
        signal: init.signal ?? AbortSignal.timeout(10_000),
        cache: "no-store"
      });
    } catch (error) {
      const timedOut = error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name);
      throw new DomainError(
        timedOut ? "AZA took too long to respond. Please try again." : "Could not connect to AZA. Please try again.",
        timedOut ? "payment_provider_timeout" : "payment_provider_unavailable",
        502,
      );
    }

    const payload = await readAzaResponse(response);
    if (!response.ok || payload.success !== true) {
      const error = payload as AzaErrorEnvelope;
      throw new DomainError(
        getAzaErrorMessage(error),
        getAzaErrorCode(error),
        response.status,
      );
    }

    return (payload as AzaSuccessEnvelope<T>).data;
  }
}

export function createPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  if (provider === "mock") {
    return new MockPaymentProvider();
  }
  if (provider === "aza") {
    return createAzaPaymentProviderFromEnv();
  }

  throw new DomainError(`Unsupported payment provider: ${provider}`, "unsupported_payment_provider", 500);
}

export function createAzaPaymentProviderFromEnv() {
  const apiKey = process.env.AZA_API_KEY?.trim();
  const webhookSecret = process.env.AZA_WEBHOOK_SECRET?.trim();

  if (!apiKey || !webhookSecret) {
    throw new DomainError(
      "AZA_API_KEY and AZA_WEBHOOK_SECRET are required when PAYMENT_PROVIDER=aza.",
      "missing_payment_configuration",
      500,
    );
  }

  return new AzaPaymentProvider({
    apiKey,
    webhookSecret,
    baseUrl: process.env.AZA_API_BASE_URL
  });
}

export function getAzaConfigurationStatus(): AzaConfigurationStatus {
  const rawProvider = (process.env.PAYMENT_PROVIDER ?? "mock").trim().toLowerCase();
  const provider: PaymentProviderName = rawProvider === "aza" ? "aza" : "mock";
  const apiBaseUrl = (process.env.AZA_API_BASE_URL?.trim() || "https://api.aza.systems").replace(/\/$/, "");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
  const apiKey = process.env.AZA_API_KEY?.trim() ?? "";
  const webhookSecret = process.env.AZA_WEBHOOK_SECRET?.trim() ?? "";
  const apiKeyConfigured = isConfiguredValue(apiKey);
  const webhookSecretConfigured = isConfiguredValue(webhookSecret);
  const apiKeyMode = !apiKeyConfigured
    ? "missing"
    : apiKey.startsWith("aza_test_")
      ? "test"
      : apiKey.startsWith("aza_live_")
        ? "live"
        : "unknown";

  return {
    provider,
    apiBaseUrl,
    appUrl,
    webhookUrl: `${appUrl}/api/payments/aza-webhook`,
    apiKeyConfigured,
    webhookSecretConfigured,
    apiKeyMode,
    ready: provider === "aza" && apiKeyConfigured && webhookSecretConfigured
  };
}

export async function checkAzaConnectionFromEnv() {
  const status = getAzaConfigurationStatus();
  if (!status.ready) {
    throw new DomainError(
      "Complete the AZA server configuration before testing the connection.",
      "missing_payment_configuration",
      400,
    );
  }

  await createAzaPaymentProviderFromEnv().checkConnection();
  return status;
}

function minorToDecimal(amountMinor: number) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new DomainError("Payment amount must be a positive integer in minor units.", "invalid_payment_amount");
  }
  return Number((amountMinor / 100).toFixed(2));
}

function mapAzaStatus(status: string): PaymentResultStatus {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "successful";
    case "REFUNDED":
      return "refunded";
    case "EXPIRED":
    case "CANCELLED":
      return "failed";
    default:
      return "pending";
  }
}

function verifyAzaSignature(rawBody: string, signature: string, secret: string) {
  if (!/^sha256=[a-f0-9]{64}$/i.test(signature)) {
    throw new DomainError("Invalid AZA webhook signature.", "invalid_webhook_signature", 401);
  }

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const suppliedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    throw new DomainError("Invalid AZA webhook signature.", "invalid_webhook_signature", 401);
  }
}

async function readAzaResponse(response: Response): Promise<AzaSuccessEnvelope<unknown> | AzaErrorEnvelope> {
  try {
    return await response.json() as AzaSuccessEnvelope<unknown> | AzaErrorEnvelope;
  } catch {
    throw new DomainError("AZA returned an unreadable response.", "invalid_provider_response", 502);
  }
}

function getAzaErrorMessage(error: AzaErrorEnvelope) {
  if (error.message) {
    return error.message;
  }
  if (typeof error.error === "object" && error.error?.message) {
    return error.error.message;
  }
  return "AZA rejected the payment request.";
}

function getAzaErrorCode(error: AzaErrorEnvelope) {
  const code = typeof error.error === "string" ? error.error : error.error?.code;
  return code?.trim().toLowerCase() || "payment_provider_error";
}

function isConfiguredValue(value: string) {
  return Boolean(value) && !/(replace|your[-_]|example|change[-_]?me|\.\.\.)/i.test(value);
}

function parseJsonRecord(rawBody: string, message: string) {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(message);
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new DomainError(message, "invalid_webhook_payload", 400);
  }
}
