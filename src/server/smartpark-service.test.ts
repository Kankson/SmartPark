import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertBookingTransition,
  calculateParkingPrice,
  getViolationPriority,
  normalizePlateNumber
} from "@/server/domain";
import {
  createBooking,
  extendBookingSession,
  expireOverdueBookings,
  getZoneQrPayload,
  getWallet,
  listAvailableSpots,
  listDriverVehicles,
  listZones,
  processAzaPaymentWebhook,
  resolveZoneQrPayload,
  validateQrTicket
} from "@/server/smartpark-service";
import { resetStoreForTests } from "@/server/store";

describe("SmartPark domain rules", () => {
  beforeEach(() => {
    process.env.PAYMENT_PROVIDER = "mock";
    delete process.env.AZA_API_KEY;
    delete process.env.AZA_WEBHOOK_SECRET;
    resetStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes number plates", () => {
    expect(normalizePlateNumber(" gr 1234-22 ")).toBe("GR123422");
  });

  it("calculates prices in minor currency units with fixed durations", () => {
    expect(calculateParkingPrice(500, 30)).toBe(250);
    expect(calculateParkingPrice(700, 90)).toBe(1050);
  });

  it("rejects invalid booking transitions", () => {
    expect(() => assertBookingTransition("reserved", "completed")).toThrow(/Invalid booking transition/);
  });

  it("ranks violation urgency from live overstay time", () => {
    expect(getViolationPriority(4)).toBe("watch");
    expect(getViolationPriority(15)).toBe("high");
    expect(getViolationPriority(30)).toBe("critical");
  });

  it("creates signed zone codes and rejects tampering", () => {
    const payload = getZoneQrPayload("zone_market_a");
    expect(resolveZoneQrPayload(payload).code).toBe("CMA");

    const tampered = JSON.parse(payload) as Record<string, unknown>;
    tampered.zoneCode = "HSB";
    expect(() => resolveZoneQrPayload(JSON.stringify(tampered))).toThrow(/could not be verified/i);
  });

  it("creates a paid reservation and QR ticket through the mock provider", async () => {
    const vehicle = listDriverVehicles("user_driver_ama")[0];
    const spot = listAvailableSpots("zone_market_a")[0];

    const result = await createBooking({
      driverId: "user_driver_ama",
      vehicleId: vehicle.id,
      zoneId: "zone_market_a",
      spotId: spot.id,
      durationMinutes: 60
    });

    expect(result.booking.status).toBe("reserved");
    expect(result.payment.status).toBe("successful");
    expect(result.qrPayload).toContain("smartpark-ticket");
  });

  it("reserves an AZA booking only after a signed completion webhook", async () => {
    process.env.PAYMENT_PROVIDER = "aza";
    process.env.AZA_API_KEY = "aza_test_example";
    process.env.AZA_WEBHOOK_SECRET = "webhook-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: "aza-session-booking",
              status: "PENDING",
              amount: 5,
              currency: "GHS",
              checkoutUrl: "https://pay.aza.systems/c/aza-session-booking",
              expiresAt: new Date(Date.now() + 30 * 60_000).toISOString()
            }
          }),
          { status: 201, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const vehicle = listDriverVehicles("user_driver_ama")[0];
    const spot = listAvailableSpots("zone_market_a")[0];

    const pending = await createBooking({
      driverId: "user_driver_ama",
      vehicleId: vehicle.id,
      zoneId: "zone_market_a",
      spotId: spot.id,
      durationMinutes: 60
    });

    expect(pending.booking.status).toBe("pending_payment");
    expect(pending.payment.status).toBe("pending");
    expect(pending.qrPayload).toBe("");
    expect(pending.redirectUrl).toBe("https://pay.aza.systems/c/aza-session-booking");

    const rawBody = JSON.stringify({
      event: "checkout.completed",
      sessionId: "aza-session-booking",
      amount: pending.payment.amountMinor / 100,
      currency: pending.payment.currency,
      reference: pending.booking.bookingReference
    });
    const signature = `sha256=${createHmac("sha256", "webhook-secret").update(rawBody).digest("hex")}`;
    const completed = await processAzaPaymentWebhook(
      rawBody,
      new Headers({
        "x-aza-signature": signature,
        "x-aza-event": "checkout.completed",
        "x-aza-delivery": "delivery-booking-1"
      }),
    );

    if (completed.duplicate) {
      throw new Error("The first AZA delivery must not be treated as a duplicate.");
    }
    if (!("qrPayload" in completed)) {
      throw new Error("A completed booking payment must issue a QR ticket.");
    }
    expect(completed.booking.status).toBe("reserved");
    expect(completed.payment.status).toBe("successful");
    expect(completed.qrPayload).toContain("smartpark-ticket");
  });

  it("validates QR entry and exit safely", async () => {
    const vehicle = listDriverVehicles("user_driver_ama")[0];
    const spot = listAvailableSpots("zone_market_a")[0];
    const result = await createBooking({
      driverId: "user_driver_ama",
      vehicleId: vehicle.id,
      zoneId: "zone_market_a",
      spotId: spot.id,
      durationMinutes: 60
    });

    const entry = validateQrTicket({
      payload: result.qrPayload,
      mode: "entry",
      wardenId: "user_warden_one"
    });
    expect(entry.result).toBe("valid");
    expect(entry.booking?.status).toBe("active");
    expect(listZones().find((zone) => zone.id === "zone_market_a")?.availabilityConfidence).toBe("verified");

    const exit = validateQrTicket({
      payload: result.qrPayload,
      mode: "exit",
      wardenId: "user_warden_one"
    });
    expect(exit.result).toBe("valid");
    expect(exit.booking?.status).toBe("completed");

    const repeatExit = validateQrTicket({
      payload: result.qrPayload,
      mode: "exit",
      wardenId: "user_warden_one"
    });
    expect(repeatExit.result).toBe("already_used");
  });

  it("expires overdue active bookings and creates one violation", async () => {
    const state = resetStoreForTests();
    const booking = state.bookings.find((item) => item.id === "booking_active_demo");
    expect(booking).toBeDefined();
    booking!.endTime = new Date(Date.now() - 5 * 60_000).toISOString();

    const expired = expireOverdueBookings();
    expect(expired.some((item) => item.id === "booking_active_demo")).toBe(true);
    expect(state.violations.filter((item) => item.bookingId === "booking_active_demo")).toHaveLength(1);

    expireOverdueBookings();
    expect(state.violations.filter((item) => item.bookingId === "booking_active_demo")).toHaveLength(1);
  });

  it("extends an active session and debits the driver wallet", async () => {
    const state = resetStoreForTests();
    const booking = state.bookings.find((item) => item.id === "booking_active_demo");
    expect(booking?.endTime).toBeDefined();
    const previousEndTime = Date.parse(booking!.endTime!);
    const previousBalance = getWallet("user_driver_kofi").account!.balanceMinor;

    const result = await extendBookingSession({
      bookingId: "booking_active_demo",
      driverId: "user_driver_kofi",
      extensionMinutes: 30
    });

    expect(result.booking.endTime).toBeDefined();
    expect(Date.parse(result.booking.endTime!)).toBe(previousEndTime + 30 * 60_000);
    expect(result.payment.status).toBe("successful");
    expect(getWallet("user_driver_kofi").account!.balanceMinor).toBe(previousBalance - result.amountMinor);
  });
});
