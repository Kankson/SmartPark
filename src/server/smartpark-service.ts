import "server-only";

import {
  type AuditLog,
  type Booking,
  type DemoUser,
  DomainError,
  type ParkingSpot,
  type Payment,
  type QrTicket,
  type SmartParkState,
  type UserRole,
  type Vehicle,
  type VerificationEvent,
  type VerificationResult,
  type Violation,
  type ZoneWithAvailability,
  assertBookingTransition,
  assertSpotTransition,
  buildQrPayload,
  calculateParkingPrice,
  createBookingReference,
  createId,
  getViolationPriorityScore,
  minutesBetween,
  minutesFromNow,
  normalizePlateNumber,
  nowIso,
  parseQrPayload
} from "@/server/domain";
import {
  MockPaymentProvider,
  createAzaPaymentProviderFromEnv,
  createPaymentProvider,
  type VerifiedWebhookEvent
} from "@/server/payment-provider";
import { hashPassword } from "@/server/password";
import { createQrToken, createZoneQrPayload, hashQrToken, verifyZoneQrPayload } from "@/server/qr";
import { getStore, markDirty } from "@/server/store";

const HOLD_MINUTES = 10;

function ticketQrPayload(token: string) {
  return buildQrPayload(token, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

export interface BookingInput {
  driverId: string;
  vehicleId: string;
  zoneId: string;
  spotId: string;
  durationMinutes: number;
}

export interface BookingResult {
  booking: Booking;
  payment: Payment;
  qrPayload: string;
  redirectUrl?: string;
}

export interface ValidationResult {
  result: VerificationResult;
  message: string;
  booking?: Booking;
  ticket?: QrTicket;
  vehicle?: Vehicle;
  spot?: ParkingSpot;
  zone?: ZoneWithAvailability;
  payment?: Payment;
  violation?: Violation;
}

export function getUserByEmail(email: string) {
  return getStore().users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string) {
  return getStore().users.find((user) => user.id === id);
}

export function getDemoUsersByRole(role: UserRole) {
  return getStore().users.filter((user) => user.role === role && user.isActive);
}

export function registerDriver(input: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}) {
  const state = getStore();
  const existing = state.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const user: DemoUser = {
    id: createId("user"),
    fullName: input.fullName,
    email: input.email,
    passwordHash: hashPassword(input.password),
    phone: input.phone,
    role: "driver",
    isActive: true
  };

  state.users.push(user);
  state.walletAccounts.push({
    id: createId("wallet"),
    userId: user.id,
    currency: "GHS",
    balanceMinor: 10000,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
  audit("register_driver", "profile", user.id, { email: user.email });
  return user;
}

export function listZones(): ZoneWithAvailability[] {
  releaseExpiredHolds();
  const state = getStore();
  return state.zones.map((zone) => {
    const spots = state.spots.filter((spot) => spot.zoneId === zone.id);
    const bookings = state.bookings.filter((booking) => booking.zoneId === zone.id);
    const bookingIds = new Set(bookings.map((booking) => booking.id));
    const latestVerification = state.verificationEvents
      .filter((event) => event.bookingId && bookingIds.has(event.bookingId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const activityTimes = [
      zone.updatedAt,
      ...spots.map((spot) => spot.updatedAt),
      ...bookings.map((booking) => booking.updatedAt),
      ...(latestVerification ? [latestVerification.createdAt] : [])
    ];
    const availabilityUpdatedAt = activityTimes.sort((a, b) => b.localeCompare(a))[0] ?? zone.updatedAt;
    const verificationIsRecent = latestVerification
      ? Date.now() - Date.parse(latestVerification.createdAt) <= 30 * 60_000
      : false;
    const hasLiveSessionSignal = bookings.some((booking) =>
      ["reserved", "active", "expired"].includes(booking.status),
    );

    return {
      ...zone,
      availableSpaces: spots.filter((spot) => spot.status === "available").length,
      heldSpaces: spots.filter((spot) => spot.status === "held").length,
      reservedSpaces: spots.filter((spot) => spot.status === "reserved").length,
      occupiedSpaces: spots.filter((spot) => spot.status === "occupied").length,
      unavailableSpaces: spots.filter((spot) => spot.status === "unavailable").length,
      availabilityConfidence: verificationIsRecent ? "verified" : hasLiveSessionSignal ? "estimated" : "limited",
      availabilityUpdatedAt
    };
  });
}

export function getZoneQrPayload(zoneId: string) {
  const zone = getZone(zoneId);
  if (!zone || !zone.isActive) {
    throw new Error("Parking zone was not found.");
  }
  return createZoneQrPayload(zone.id, zone.code);
}

export function resolveZoneQrPayload(payload: string) {
  const verified = verifyZoneQrPayload(payload);
  const zone = getZone(verified.zoneId);
  if (!zone || !zone.isActive || zone.code !== verified.zoneCode) {
    throw new Error("This parking zone is no longer available.");
  }
  return zone;
}

export function getZone(zoneId: string) {
  return listZones().find((zone) => zone.id === zoneId);
}

export function listAvailableSpots(zoneId: string) {
  releaseExpiredHolds();
  return getStore()
    .spots.filter((spot) => spot.zoneId === zoneId && spot.status === "available")
    .sort((a, b) => a.spotCode.localeCompare(b.spotCode));
}

export function listDriverVehicles(driverId: string) {
  return getStore().vehicles.filter((vehicle) => vehicle.ownerId === driverId && vehicle.isActive);
}

export function addDriverVehicle(input: {
  ownerId: string;
  plateNumber: string;
  vehicleType: Vehicle["vehicleType"];
  make: string;
  model: string;
  colour: string;
}) {
  const state = getStore();
  const normalizedPlateNumber = normalizePlateNumber(input.plateNumber);
  const duplicate = state.vehicles.find(
    (vehicle) => vehicle.isActive && vehicle.normalizedPlateNumber === normalizedPlateNumber,
  );

  if (duplicate) {
    throw new Error("An active vehicle with this plate already exists.");
  }

  const vehicle: Vehicle = {
    id: createId("vehicle"),
    ownerId: input.ownerId,
    plateNumber: input.plateNumber,
    normalizedPlateNumber,
    vehicleType: input.vehicleType,
    make: input.make,
    model: input.model,
    colour: input.colour,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  state.vehicles.push(vehicle);
  audit("add_vehicle", "vehicle", vehicle.id, { ownerId: input.ownerId });
  return vehicle;
}

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  releaseExpiredHolds();
  const state = getStore();
  const driver = findUser(state, input.driverId, "driver");
  const vehicle = state.vehicles.find(
    (item) => item.id === input.vehicleId && item.ownerId === input.driverId && item.isActive,
  );
  const zone = state.zones.find((item) => item.id === input.zoneId && item.isActive);
  const spot = state.spots.find((item) => item.id === input.spotId && item.zoneId === input.zoneId);

  if (!driver || !driver.isActive) {
    throw new Error("Driver account is not active.");
  }
  if (!vehicle) {
    throw new Error("Selected vehicle does not belong to the driver.");
  }
  if (!zone) {
    throw new Error("Parking zone is not available.");
  }
  if (!spot || spot.status !== "available") {
    throw new Error("Parking space is no longer available.");
  }

  assertSpotTransition(spot.status, "held");
  spot.status = "held";
  spot.heldByUserId = input.driverId;
  spot.holdExpiresAt = minutesFromNow(HOLD_MINUTES);
  spot.updatedAt = nowIso();

  const amountMinor = calculateParkingPrice(zone.hourlyRateMinor, input.durationMinutes);
  const booking: Booking = {
    id: createId("booking"),
    bookingReference: createBookingReference(),
    driverId: input.driverId,
    vehicleId: input.vehicleId,
    zoneId: input.zoneId,
    spotId: input.spotId,
    durationMinutes: input.durationMinutes,
    amountMinor,
    currency: zone.currency,
    status: "pending_payment",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  state.bookings.push(booking);

  const idempotencyKey = createId("idem");
  const provider = createPaymentProvider();
  let checkout;
  try {
    checkout = await provider.createPayment({
      bookingId: booking.id,
      driverId: input.driverId,
      amountMinor,
      currency: zone.currency,
      idempotencyKey,
      description: `Parking at ${zone.name} (${spot.spotCode})`,
      reference: booking.bookingReference,
      metadata: { purpose: "booking", zoneId: zone.id, spotId: spot.id }
    });
  } catch (error) {
    assertBookingTransition(booking.status, "payment_failed");
    booking.status = "payment_failed";
    booking.updatedAt = nowIso();
    releaseHeldSpot(spot);
    audit("payment_session_failed_release_hold", "booking", booking.id, { spotId: spot.id });
    throw error;
  }

  if (checkout.expiresAt && !Number.isNaN(Date.parse(checkout.expiresAt))) {
    spot.holdExpiresAt = checkout.expiresAt;
    spot.updatedAt = nowIso();
  }

  const payment: Payment = {
    id: createId("payment"),
    bookingId: booking.id,
    driverId: input.driverId,
    provider: checkout.provider,
    providerReference: checkout.providerReference,
    idempotencyKey,
    amountMinor,
    currency: zone.currency,
    status: "pending",
    paymentMethod: checkout.provider === "aza" ? "aza_checkout" : "demo_wallet",
    providerPayload: { purpose: "booking", checkout },
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  state.payments.push(payment);
  audit("create_booking_hold", "booking", booking.id, { spotId: spot.id, amountMinor });

  if (checkout.provider === "mock") {
    return completeMockPayment(booking.id, true);
  }

  return { booking, payment, qrPayload: "", redirectUrl: checkout.redirectUrl };
}

export async function completeMockPayment(bookingId: string, successful: boolean) {
  const state = getStore();
  const booking = findBooking(state, bookingId);
  const payment = findPaymentForBooking(state, bookingId);

  if (payment.status !== "pending") {
    const token = state.demoQrTokens[booking.id];
    return { booking, payment, qrPayload: token ? ticketQrPayload(token) : "" };
  }

  const verification = await new MockPaymentProvider().verifyPayment(
    successful ? payment.providerReference : `${payment.providerReference}_fail`,
  );

  return finalizeBookingPayment({
    state,
    booking,
    payment,
    successful: successful && verification.status === "successful",
    providerPayload: verification.payload,
    verifiedAt: verification.verifiedAt,
    debitInternalWallet: true
  });
}

export async function processMockPaymentWebhook(rawBody: string, headers: Headers) {
  const state = getStore();
  const event = await new MockPaymentProvider().verifyWebhook(rawBody, headers);

  if (state.processedWebhookKeys.has(event.idempotencyKey)) {
    return { duplicate: true as const, idempotencyKey: event.idempotencyKey };
  }

  const payment = state.payments.find((item) => item.providerReference === event.providerReference);
  if (!payment) {
    throw new Error("Payment was not found for webhook reference.");
  }

  const result = await completeMockPayment(payment.bookingId, event.status === "successful");
  state.processedWebhookKeys.add(event.idempotencyKey);
  audit("process_mock_payment_webhook", "payment", payment.id, {
    providerReference: event.providerReference,
    status: event.status
  });

  return { duplicate: false as const, ...result };
}

export async function processAzaPaymentWebhook(rawBody: string, headers: Headers) {
  const state = getStore();
  const event = await createAzaPaymentProviderFromEnv().verifyWebhook(rawBody, headers);

  if (state.processedWebhookKeys.has(event.idempotencyKey)) {
    return { duplicate: true as const, idempotencyKey: event.idempotencyKey };
  }

  const payment = state.payments.find(
    (item) => item.provider === "aza" && item.providerReference === event.providerReference,
  );
  if (!payment) {
    throw new Error("Payment was not found for the AZA checkout session.");
  }

  assertAzaEventMatchesPayment(event, payment);
  const purpose = String(payment.providerPayload.purpose ?? "booking");
  const result = purpose === "extension"
    ? finalizeExtensionPaymentFromWebhook(state, payment, event)
    : finalizeAzaBookingPayment(state, payment, event);

  state.processedWebhookKeys.add(event.idempotencyKey);
  audit("process_aza_payment_webhook", "payment", payment.id, {
    deliveryId: event.idempotencyKey,
    eventType: event.eventType,
    providerReference: event.providerReference
  });

  return { duplicate: false as const, ...result };
}

function finalizeAzaBookingPayment(
  state: SmartParkState,
  payment: Payment,
  event: VerifiedWebhookEvent,
) {
  const booking = findBooking(state, payment.bookingId);

  if (event.status === "refunded") {
    return applyAzaRefund(state, booking, payment, event);
  }

  return finalizeBookingPayment({
    state,
    booking,
    payment,
    successful: event.status === "successful",
    providerPayload: { webhook: event.payload, eventType: event.eventType },
    verifiedAt: nowIso(),
    debitInternalWallet: false
  });
}

function finalizeBookingPayment(input: {
  state: SmartParkState;
  booking: Booking;
  payment: Payment;
  successful: boolean;
  providerPayload: Record<string, unknown>;
  verifiedAt: string;
  debitInternalWallet: boolean;
}): BookingResult {
  const { state, booking, payment } = input;
  const spot = findSpot(state, booking.spotId);

  if (payment.status !== "pending") {
    const token = state.demoQrTokens[booking.id];
    return { booking, payment, qrPayload: token ? ticketQrPayload(token) : "" };
  }

  payment.status = input.successful ? "successful" : "failed";
  payment.verifiedAt = input.verifiedAt;
  payment.providerPayload = { ...payment.providerPayload, ...input.providerPayload };
  payment.updatedAt = nowIso();

  if (!input.successful) {
    if (booking.status === "pending_payment") {
      assertBookingTransition(booking.status, "payment_failed");
      booking.status = "payment_failed";
      booking.updatedAt = nowIso();
    }
    releaseHeldSpot(spot);
    audit("payment_failed_release_hold", "booking", booking.id, { paymentId: payment.id });
    return { booking, payment, qrPayload: "" };
  }

  if (booking.status !== "pending_payment" || spot.status !== "held") {
    audit("paid_booking_requires_review", "payment", payment.id, {
      bookingStatus: booking.status,
      spotStatus: spot.status
    });
    return { booking, payment, qrPayload: "" };
  }

  if (input.debitInternalWallet) {
    debitWallet(state, booking.driverId, booking.amountMinor, booking.currency, booking.id, payment.id);
  }

  assertBookingTransition(booking.status, "reserved");
  assertSpotTransition(spot.status, "reserved");
  booking.status = "reserved";
  booking.reservedAt = nowIso();
  booking.updatedAt = nowIso();
  spot.status = "reserved";
  spot.heldByUserId = undefined;
  spot.holdExpiresAt = undefined;
  spot.updatedAt = nowIso();

  const existingTicket = state.qrTickets.find((ticket) => ticket.bookingId === booking.id);
  const existingToken = state.demoQrTokens[booking.id];
  if (existingTicket && existingToken) {
    return { booking, payment, qrPayload: ticketQrPayload(existingToken) };
  }

  const token = createQrToken();
  const ticket: QrTicket = {
    id: createId("ticket"),
    bookingId: booking.id,
    tokenHash: hashQrToken(token),
    status: "active",
    issuedAt: nowIso(),
    createdAt: nowIso()
  };

  state.qrTickets.push(ticket);
  state.demoQrTokens[booking.id] = token;
  audit("payment_confirmed_issue_qr", "booking", booking.id, { paymentId: payment.id, ticketId: ticket.id });

  return { booking, payment, qrPayload: ticketQrPayload(token) };
}

function finalizeExtensionPaymentFromWebhook(
  state: SmartParkState,
  payment: Payment,
  event: VerifiedWebhookEvent,
) {
  const booking = findBooking(state, payment.bookingId);

  if (payment.status !== "pending") {
    return { booking, payment };
  }

  payment.status = event.status === "refunded" ? "refunded" : event.status === "successful" ? "successful" : "failed";
  payment.verifiedAt = nowIso();
  payment.providerPayload = {
    ...payment.providerPayload,
    webhook: event.payload,
    eventType: event.eventType
  };
  payment.updatedAt = nowIso();

  if (payment.status !== "successful") {
    audit("aza_extension_payment_not_completed", "payment", payment.id, { eventType: event.eventType });
    return { booking, payment };
  }

  const extensionMinutes = Number(payment.providerPayload.extensionMinutes);
  if (![30, 60, 90].includes(extensionMinutes)) {
    audit("paid_extension_requires_review", "payment", payment.id, { reason: "invalid_extension_duration" });
    return { booking, payment };
  }
  if (booking.status !== "active" || !booking.endTime) {
    audit("paid_extension_requires_review", "payment", payment.id, { bookingStatus: booking.status });
    return { booking, payment };
  }

  applyPaidExtension(booking, payment, extensionMinutes);
  return { booking, payment };
}

function applyPaidExtension(booking: Booking, payment: Payment, extensionMinutes: number) {
  if (!booking.endTime) {
    throw new Error("The parking session does not have an end time.");
  }

  booking.durationMinutes += extensionMinutes;
  booking.endTime = new Date(Date.parse(booking.endTime) + extensionMinutes * 60_000).toISOString();
  booking.updatedAt = nowIso();
  audit("extend_active_session", "booking", booking.id, {
    paymentId: payment.id,
    extensionMinutes,
    amountMinor: payment.amountMinor
  });
}

function applyAzaRefund(
  state: SmartParkState,
  booking: Booking,
  payment: Payment,
  event: VerifiedWebhookEvent,
) {
  payment.status = "refunded";
  payment.verifiedAt = nowIso();
  payment.providerPayload = { ...payment.providerPayload, webhook: event.payload, eventType: event.eventType };
  payment.updatedAt = nowIso();

  if (booking.status === "reserved") {
    const spot = findSpot(state, booking.spotId);
    assertBookingTransition(booking.status, "cancelled");
    booking.status = "cancelled";
    booking.cancelledAt = nowIso();
    booking.updatedAt = nowIso();
    if (spot.status === "reserved") {
      assertSpotTransition(spot.status, "available");
      spot.status = "available";
      spot.updatedAt = nowIso();
    }
    const ticket = state.qrTickets.find((item) => item.bookingId === booking.id);
    if (ticket?.status === "active") {
      ticket.status = "revoked";
      ticket.revokedAt = nowIso();
    }
  } else {
    audit("aza_refund_requires_review", "payment", payment.id, { bookingStatus: booking.status });
  }

  return { booking, payment };
}

function assertAzaEventMatchesPayment(event: VerifiedWebhookEvent, payment: Payment) {
  const amount = Number(event.payload.amount);
  const amountMinor = Math.round(amount * 100);
  const currency = String(event.payload.currency ?? "");
  const booking = findBooking(getStore(), payment.bookingId);
  const purpose = String(payment.providerPayload.purpose ?? "booking");
  const extensionMinutes = Number(payment.providerPayload.extensionMinutes);
  const expectedReference = purpose === "extension"
    ? `${booking.bookingReference}-EXT-${extensionMinutes}`
    : booking.bookingReference;
  const reference = String(event.payload.reference ?? "");

  if (!Number.isFinite(amount) || amountMinor !== payment.amountMinor || currency !== payment.currency) {
    throw new DomainError("AZA webhook amount or currency does not match the payment.", "payment_webhook_mismatch", 400);
  }
  if (reference && reference !== expectedReference) {
    throw new DomainError("AZA webhook reference does not match the booking.", "payment_webhook_mismatch", 400);
  }
}

function releaseHeldSpot(spot: ParkingSpot) {
  if (spot.status !== "held") {
    return;
  }

  assertSpotTransition(spot.status, "available");
  spot.status = "available";
  spot.heldByUserId = undefined;
  spot.holdExpiresAt = undefined;
  spot.updatedAt = nowIso();
  markDirty();
}

export function getBookingDetails(bookingId: string) {
  const state = getStore();
  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking) {
    return undefined;
  }

  const token = state.demoQrTokens[booking.id];
  const payment = state.payments.find((item) => item.bookingId === booking.id);
  const checkout = payment?.providerPayload.checkout;
  const checkoutUrl = checkout && typeof checkout === "object" && "redirectUrl" in checkout
    ? String((checkout as { redirectUrl?: unknown }).redirectUrl ?? "")
    : undefined;
  return {
    booking,
    vehicle: state.vehicles.find((vehicle) => vehicle.id === booking.vehicleId),
    spot: state.spots.find((spot) => spot.id === booking.spotId),
    zone: getZone(booking.zoneId),
    payment,
    ticket: state.qrTickets.find((ticket) => ticket.bookingId === booking.id),
    qrPayload: token ? ticketQrPayload(token) : undefined,
    checkoutUrl
  };
}

export function listDriverBookings(driverId: string) {
  expireOverdueBookings();
  return getStore()
    .bookings.filter((booking) => booking.driverId === driverId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getActiveDriverBooking(driverId: string) {
  expireOverdueBookings();
  return listDriverBookings(driverId).find((booking) =>
    ["reserved", "active", "expired"].includes(booking.status),
  );
}

export function getWallet(driverId: string) {
  const state = getStore();
  const account = state.walletAccounts.find((wallet) => wallet.userId === driverId && wallet.currency === "GHS");

  return {
    account,
    transactions: state.walletTransactions
      .filter((transaction) => transaction.userId === driverId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  };
}

export function cancelReservation(bookingId: string, driverId: string) {
  const state = getStore();
  const booking = findBooking(state, bookingId);
  const spot = findSpot(state, booking.spotId);

  if (booking.driverId !== driverId) {
    throw new Error("You can only cancel your own reservation.");
  }
  if (!["pending_payment", "reserved"].includes(booking.status)) {
    throw new Error("Only pending or reserved bookings can be cancelled.");
  }

  assertBookingTransition(booking.status, "cancelled");
  booking.status = "cancelled";
  booking.cancelledAt = nowIso();
  booking.updatedAt = nowIso();

  if (spot.status === "held" || spot.status === "reserved") {
    assertSpotTransition(spot.status, "available");
    spot.status = "available";
    spot.heldByUserId = undefined;
    spot.holdExpiresAt = undefined;
    spot.updatedAt = nowIso();
  }

  audit("cancel_reservation", "booking", booking.id, { driverId });
  return booking;
}

export async function extendBookingSession(input: { bookingId: string; driverId: string; extensionMinutes: number }) {
  expireOverdueBookings();
  const state = getStore();
  const booking = findBooking(state, input.bookingId);
  const zone = state.zones.find((item) => item.id === booking.zoneId && item.isActive);

  if (booking.driverId !== input.driverId) {
    throw new Error("You can only extend your own parking session.");
  }

  if (booking.status !== "active" || !booking.endTime) {
    throw new Error("Only active parking sessions can be extended.");
  }

  if (!zone) {
    throw new Error("Parking zone is no longer available.");
  }

  if (![30, 60, 90].includes(input.extensionMinutes)) {
    throw new Error("Choose a 30, 60, or 90 minute extension.");
  }

  const pendingExtension = state.payments.find(
    (payment) =>
      payment.bookingId === booking.id &&
      payment.status === "pending" &&
      payment.providerPayload.purpose === "extension",
  );
  if (pendingExtension) {
    throw new Error("An extension payment is already awaiting confirmation.");
  }

  const amountMinor = calculateParkingPrice(zone.hourlyRateMinor, input.extensionMinutes);
  const now = nowIso();
  const idempotencyKey = createId("idem_extension");
  const provider = createPaymentProvider();
  const checkout = await provider.createPayment({
    bookingId: booking.id,
    driverId: booking.driverId,
    amountMinor,
    currency: booking.currency,
    idempotencyKey,
    description: `SmartPark extension (${input.extensionMinutes} minutes)`,
    reference: `${booking.bookingReference}-EXT-${input.extensionMinutes}`,
    metadata: { purpose: "extension", extensionMinutes: input.extensionMinutes }
  });
  const payment: Payment = {
    id: createId("payment"),
    bookingId: booking.id,
    driverId: booking.driverId,
    provider: checkout.provider,
    providerReference: checkout.providerReference,
    idempotencyKey,
    amountMinor,
    currency: booking.currency,
    status: "pending",
    paymentMethod: checkout.provider === "aza" ? "aza_checkout_extension" : "demo_wallet_extension",
    providerPayload: {
      purpose: "extension",
      extensionMinutes: input.extensionMinutes,
      checkout
    },
    createdAt: now,
    updatedAt: now
  };
  state.payments.push(payment);

  if (checkout.provider === "aza") {
    audit("create_aza_extension_checkout", "payment", payment.id, {
      bookingId: booking.id,
      extensionMinutes: input.extensionMinutes
    });
    return { booking, payment, amountMinor, pending: true, redirectUrl: checkout.redirectUrl };
  }

  const verification = await provider.verifyPayment(payment.providerReference);
  payment.status = verification.status === "successful" ? "successful" : "failed";
  payment.verifiedAt = verification.verifiedAt;
  payment.providerPayload = { ...payment.providerPayload, verification: verification.payload };
  payment.updatedAt = nowIso();

  if (payment.status !== "successful") {
    throw new Error("The extension payment could not be confirmed.");
  }

  debitWallet(
    state,
    booking.driverId,
    amountMinor,
    booking.currency,
    booking.id,
    payment.id,
    `Parking time extension (${input.extensionMinutes} minutes)`,
  );
  applyPaidExtension(booking, payment, input.extensionMinutes);

  return { booking, payment, amountMinor, pending: false };
}

export function validateQrTicket(input: {
  payload: string;
  mode: "entry" | "verify" | "exit";
  wardenId: string;
  notes?: string;
}): ValidationResult {
  expireOverdueBookings();
  const state = getStore();
  const token = parseQrPayload(input.payload);
  const tokenHash = hashQrToken(token);
  const ticket = state.qrTickets.find((item) => item.tokenHash === tokenHash);

  if (!ticket) {
    recordVerification({
      wardenId: input.wardenId,
      verificationType: input.mode === "verify" ? "status_check" : input.mode,
      result: "not_found",
      notes: input.notes
    });
    return { result: "not_found", message: "Ticket was not found." };
  }

  const booking = findBooking(state, ticket.bookingId);
  const payment = findPaymentForBooking(state, booking.id);
  const vehicle = findVehicle(state, booking.vehicleId);
  const spot = findSpot(state, booking.spotId);
  const zone = getZone(booking.zoneId);
  const violation = state.violations.find((item) => item.bookingId === booking.id && item.status === "open");

  if (payment.status !== "successful") {
    return recordQrFailure("invalid", "Ticket is connected to an unverified payment.", input, ticket, booking);
  }

  if (input.mode === "verify") {
    const result = booking.status === "expired" ? "expired" : ticket.status === "exited" ? "already_used" : "valid";
    recordVerification({
      bookingId: booking.id,
      qrTicketId: ticket.id,
      wardenId: input.wardenId,
      verificationType: "status_check",
      result,
      notes: input.notes
    });

    return {
      result,
      message: result === "valid" ? "Ticket is valid." : "Ticket needs attention.",
      booking,
      ticket,
      vehicle,
      spot,
      zone,
      payment,
      violation
    };
  }

  if (input.mode === "entry") {
    if (ticket.status !== "active" || booking.status !== "reserved") {
      return recordQrFailure("invalid", "Ticket is not ready for entry.", input, ticket, booking);
    }

    assertBookingTransition(booking.status, "active");
    assertSpotTransition(spot.status, "occupied");
    const checkIn = nowIso();
    booking.status = "active";
    booking.checkInTime = checkIn;
    booking.endTime = new Date(Date.parse(checkIn) + booking.durationMinutes * 60_000).toISOString();
    booking.updatedAt = nowIso();
    spot.status = "occupied";
    spot.updatedAt = nowIso();
    ticket.status = "entered";
    ticket.firstEntryAt = checkIn;
    recordVerification({
      bookingId: booking.id,
      qrTicketId: ticket.id,
      wardenId: input.wardenId,
      verificationType: "entry",
      result: "valid",
      notes: input.notes
    });
    audit("qr_entry_validated", "booking", booking.id, { wardenId: input.wardenId });

    return {
      result: "valid",
      message: "Entry validated. Parking timer has started.",
      booking,
      ticket,
      vehicle,
      spot,
      zone,
      payment
    };
  }

  if (!["active", "expired"].includes(booking.status) || !["entered", "expired"].includes(ticket.status)) {
    const result = ticket.status === "exited" ? "already_used" : "invalid";
    return recordQrFailure(result, "Ticket is not valid for exit.", input, ticket, booking);
  }

  if (booking.status === "active") {
    assertBookingTransition(booking.status, "completed");
  } else {
    assertBookingTransition(booking.status, "completed");
  }
  assertSpotTransition(spot.status, "available");
  booking.status = "completed";
  booking.checkOutTime = nowIso();
  booking.updatedAt = nowIso();
  spot.status = "available";
  spot.updatedAt = nowIso();
  ticket.status = "exited";
  ticket.exitAt = nowIso();
  recordVerification({
    bookingId: booking.id,
    qrTicketId: ticket.id,
    wardenId: input.wardenId,
    verificationType: "exit",
    result: "valid",
    notes: input.notes
  });
  audit("qr_exit_validated", "booking", booking.id, { wardenId: input.wardenId });

  return {
    result: "valid",
    message: "Exit validated. Space is available again.",
    booking,
    ticket,
    vehicle,
    spot,
    zone,
    payment,
    violation
  };
}

export function searchPlate(input: { plateNumber: string; wardenId: string; recognition?: boolean }) {
  expireOverdueBookings();
  const state = getStore();
  const normalized = normalizePlateNumber(input.plateNumber);
  const vehicle = state.vehicles.find((item) => item.normalizedPlateNumber === normalized && item.isActive);
  const matchingBookings = vehicle
    ? state.bookings
        .filter(
          (booking) =>
            booking.vehicleId === vehicle.id &&
            ["reserved", "active", "expired"].includes(booking.status),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];
  const booking = matchingBookings[0];

  recordVerification({
    bookingId: booking?.id,
    wardenId: input.wardenId,
    verificationType: input.recognition ? "plate_recognition" : "manual_plate_search",
    result: booking ? (booking.status === "expired" ? "expired" : "valid") : "not_found",
    plateNumberEntered: input.plateNumber
  });

  return {
    normalizedPlateNumber: normalized,
    vehicle,
    booking,
    spot: booking ? state.spots.find((spot) => spot.id === booking.spotId) : undefined,
    zone: booking ? getZone(booking.zoneId) : undefined,
    payment: booking ? state.payments.find((payment) => payment.bookingId === booking.id) : undefined,
    violation: booking
      ? state.violations.find((violation) => violation.bookingId === booking.id && violation.status === "open")
      : undefined
  };
}

export function getWardenDashboard() {
  expireOverdueBookings();
  const state = getStore();
  const zones = listZones();
  const activeBookings = state.bookings.filter((booking) => ["reserved", "active"].includes(booking.status));
  const expiredBookings = state.bookings.filter((booking) => booking.status === "expired");

  return {
    summary: {
      totalSpaces: state.spots.length,
      available: state.spots.filter((spot) => spot.status === "available").length,
      held: state.spots.filter((spot) => spot.status === "held").length,
      reserved: state.spots.filter((spot) => spot.status === "reserved").length,
      occupied: state.spots.filter((spot) => spot.status === "occupied").length,
      expiredSessions: expiredBookings.length,
      openViolations: state.violations.filter((violation) => violation.status === "open").length
    },
    zones,
    spots: state.spots,
    activeBookings,
    expiredBookings,
    recentVerificationEvents: state.verificationEvents.slice(-8).reverse(),
    openViolations: state.violations
      .filter((violation) => violation.status === "open")
      .sort((a, b) => {
        const priorityDifference =
          getViolationPriorityScore(b.overstayMinutes) - getViolationPriorityScore(a.overstayMinutes);
        return priorityDifference || b.overstayMinutes - a.overstayMinutes || a.detectedAt.localeCompare(b.detectedAt);
      })
  };
}

export function expireOverdueBookings() {
  const state = getStore();
  const now = nowIso();

  for (const booking of state.bookings) {
    if (booking.status === "expired" && booking.endTime) {
      const existing = state.violations.find(
        (item) =>
          item.bookingId === booking.id &&
          item.violationType === "expired_session" &&
          item.status === "open",
      );
      if (existing) {
        existing.overstayMinutes = minutesBetween(booking.endTime, now);
        existing.updatedAt = now;
      }
      continue;
    }

    if (booking.status !== "active" || !booking.endTime || Date.parse(booking.endTime) > Date.now()) {
      continue;
    }

    assertBookingTransition(booking.status, "expired");
    booking.status = "expired";
    booking.expiredAt = now;
    booking.updatedAt = now;

    const ticket = state.qrTickets.find((item) => item.bookingId === booking.id);
    if (ticket && ticket.status === "entered") {
      ticket.status = "expired";
    }

    const existing = state.violations.find(
      (item) => item.bookingId === booking.id && item.violationType === "expired_session",
    );

    if (existing) {
      existing.overstayMinutes = minutesBetween(booking.endTime, now);
      existing.updatedAt = now;
    } else {
      const violation: Violation = {
        id: createId("violation"),
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        spotId: booking.spotId,
        violationType: "expired_session",
        detectedAt: now,
        overstayMinutes: minutesBetween(booking.endTime, now),
        status: "open",
        createdAt: now,
        updatedAt: now
      };
      state.violations.push(violation);
      audit("create_expired_session_violation", "violation", violation.id, { bookingId: booking.id });
    }
  }

  return state.bookings.filter((booking) => booking.status === "expired");
}

export function confirmViolation(violationId: string, wardenId: string, notes?: string) {
  const violation = findViolation(getStore(), violationId);
  violation.status = "confirmed";
  violation.wardenId = wardenId;
  violation.wardenNotes = notes;
  violation.confirmedAt = nowIso();
  violation.updatedAt = nowIso();
  audit("confirm_violation", "violation", violation.id, { wardenId });
  return violation;
}

export function dismissViolation(violationId: string, wardenId: string, notes?: string) {
  const violation = findViolation(getStore(), violationId);
  violation.status = "dismissed";
  violation.wardenId = wardenId;
  violation.wardenNotes = notes;
  violation.dismissedAt = nowIso();
  violation.updatedAt = nowIso();
  audit("dismiss_violation", "violation", violation.id, { wardenId });
  return violation;
}

function releaseExpiredHolds() {
  const state = getStore();
  const now = Date.now();

  for (const spot of state.spots) {
    if (spot.status !== "held" || !spot.holdExpiresAt || Date.parse(spot.holdExpiresAt) > now) {
      continue;
    }

    spot.status = "available";
    spot.heldByUserId = undefined;
    spot.holdExpiresAt = undefined;
    spot.updatedAt = nowIso();
    markDirty();

    const booking = state.bookings.find(
      (item) => item.spotId === spot.id && item.status === "pending_payment",
    );
    if (booking) {
      booking.status = "payment_failed";
      booking.updatedAt = nowIso();
      audit("release_expired_hold", "booking", booking.id, { spotId: spot.id });
    }
  }
}

function debitWallet(
  state: SmartParkState,
  driverId: string,
  amountMinor: number,
  currency: string,
  bookingId: string,
  paymentId: string,
  description = "Parking reservation payment",
) {
  const wallet = state.walletAccounts.find((account) => account.userId === driverId && account.currency === currency);
  if (!wallet) {
    throw new Error("Driver wallet was not found.");
  }
  if (wallet.balanceMinor < amountMinor) {
    throw new Error("Insufficient wallet balance.");
  }

  const before = wallet.balanceMinor;
  wallet.balanceMinor -= amountMinor;
  wallet.updatedAt = nowIso();

  state.walletTransactions.push({
    id: createId("wallet_txn"),
    walletAccountId: wallet.id,
    userId: driverId,
    bookingId,
    paymentId,
    transactionType: "parking_payment",
    direction: "debit",
    amountMinor,
    balanceBeforeMinor: before,
    balanceAfterMinor: wallet.balanceMinor,
    status: "posted",
    providerReference: paymentId,
    description,
    createdAt: nowIso()
  });
}

function recordQrFailure(
  result: VerificationResult,
  message: string,
  input: { mode: "entry" | "verify" | "exit"; wardenId: string; notes?: string },
  ticket: QrTicket,
  booking: Booking,
): ValidationResult {
  recordVerification({
    bookingId: booking.id,
    qrTicketId: ticket.id,
    wardenId: input.wardenId,
    verificationType: input.mode === "verify" ? "status_check" : input.mode,
    result,
    notes: input.notes
  });

  return { result, message, booking, ticket };
}

function recordVerification(input: Omit<VerificationEvent, "id" | "createdAt">) {
  const event: VerificationEvent = {
    id: createId("verify"),
    createdAt: nowIso(),
    ...input
  };
  getStore().verificationEvents.push(event);
  markDirty();
  return event;
}

function audit(action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  const log: AuditLog = {
    id: createId("audit"),
    action,
    entityType,
    entityId,
    metadata,
    createdAt: nowIso()
  };
  getStore().auditLogs.push(log);
  markDirty();
  return log;
}

function findUser(state: SmartParkState, id: string, role?: UserRole): DemoUser | undefined {
  return state.users.find((user) => user.id === id && (!role || user.role === role));
}

function findBooking(state: SmartParkState, id: string) {
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) {
    throw new Error("Booking was not found.");
  }
  return booking;
}

function findPaymentForBooking(state: SmartParkState, bookingId: string) {
  const payment = state.payments.find((item) => item.bookingId === bookingId);
  if (!payment) {
    throw new Error("Payment was not found.");
  }
  return payment;
}

function findSpot(state: SmartParkState, id: string) {
  const spot = state.spots.find((item) => item.id === id);
  if (!spot) {
    throw new Error("Parking space was not found.");
  }
  return spot;
}

function findVehicle(state: SmartParkState, id: string) {
  const vehicle = state.vehicles.find((item) => item.id === id);
  if (!vehicle) {
    throw new Error("Vehicle was not found.");
  }
  return vehicle;
}

function findViolation(state: SmartParkState, id: string) {
  const violation = state.violations.find((item) => item.id === id);
  if (!violation) {
    throw new Error("Violation was not found.");
  }
  return violation;
}
