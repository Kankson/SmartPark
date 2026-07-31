import {
  type Booking,
  type DemoUser,
  type ParkingSpot,
  type ParkingZone,
  type SmartParkState,
  type Vehicle,
  createId,
  normalizePlateNumber,
  nowIso
} from "@/server/domain";
import { hashQrToken } from "@/server/qr";

const createdAt = "2026-06-16T12:00:00.000Z";

export const demoUsers: DemoUser[] = [
  {
    id: "user_driver_ama",
    email: "driver@smartpark.test",
    password: "password123",
    fullName: "Ama Mensah",
    phone: "+233 20 000 1001",
    role: "driver",
    isActive: true
  },
  {
    id: "user_driver_kofi",
    email: "kofi@smartpark.test",
    password: "password123",
    fullName: "Kofi Boateng",
    phone: "+233 20 000 1002",
    role: "driver",
    isActive: true
  },
  {
    id: "user_driver_efua",
    email: "efua@smartpark.test",
    password: "password123",
    fullName: "Efua Darko",
    phone: "+233 20 000 1003",
    role: "driver",
    isActive: true
  },
  {
    id: "user_warden_one",
    email: "warden@smartpark.test",
    password: "password123",
    fullName: "Kojo Warden",
    phone: "+233 20 000 2001",
    role: "warden",
    isActive: true
  },
  {
    id: "user_warden_two",
    email: "nana.warden@smartpark.test",
    password: "password123",
    fullName: "Nana Warden",
    phone: "+233 20 000 2002",
    role: "warden",
    isActive: true
  },
  {
    id: "user_admin_one",
    email: "admin@smartpark.test",
    password: "password123",
    fullName: "SmartPark Admin",
    phone: "+233 20 000 3001",
    role: "admin",
    isActive: true
  }
];

export const demoZones: ParkingZone[] = [
  {
    id: "zone_market_a",
    name: "Central Market Zone A",
    code: "CMA",
    description: "High-turnover street parking beside the central market.",
    address: "Central Market Road, City Centre",
    latitude: 5.5571,
    longitude: -0.2057,
    hourlyRateMinor: 500,
    currency: "GHS",
    operatingStart: "06:00",
    operatingEnd: "22:00",
    totalSpaces: 20,
    isActive: true,
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "zone_high_street_b",
    name: "High Street Zone B",
    code: "HSB",
    description: "Business district parking for short visits.",
    address: "High Street, City Centre",
    latitude: 5.5524,
    longitude: -0.2025,
    hourlyRateMinor: 700,
    currency: "GHS",
    operatingStart: "07:00",
    operatingEnd: "21:00",
    totalSpaces: 20,
    isActive: true,
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "zone_independence_c",
    name: "Independence Avenue Zone C",
    code: "IAC",
    description: "Civic-area parking with accessible spaces.",
    address: "Independence Avenue, City Centre",
    latitude: 5.5615,
    longitude: -0.1918,
    hourlyRateMinor: 600,
    currency: "GHS",
    operatingStart: "06:30",
    operatingEnd: "20:30",
    totalSpaces: 20,
    isActive: true,
    createdAt,
    updatedAt: createdAt
  }
];

function buildSpots() {
  const spots: ParkingSpot[] = [];

  for (const zone of demoZones) {
    for (let index = 1; index <= 20; index += 1) {
      const code = `${zone.code}-${String(index).padStart(2, "0")}`;
      const status =
        index === 2 ? "reserved" : index === 3 ? "occupied" : index === 4 ? "unavailable" : "available";

      spots.push({
        id: `spot_${zone.code.toLowerCase()}_${index}`,
        zoneId: zone.id,
        spotCode: code,
        status,
        isAccessible: index === 1 || index === 2,
        vehicleType: index === 5 ? "motorcycle" : "car",
        createdAt,
        updatedAt: createdAt
      });
    }
  }

  return spots;
}

const initialVehicles: Vehicle[] = [
  vehicle("vehicle_ama_1", "user_driver_ama", "GR 1234-22", "car", "Toyota", "Corolla", "White"),
  vehicle("vehicle_kofi_1", "user_driver_kofi", "GT 8841-21", "car", "Hyundai", "Elantra", "Blue"),
  vehicle("vehicle_efua_1", "user_driver_efua", "GX 4509-20", "car", "Kia", "Rio", "Silver")
];

function vehicle(
  id: string,
  ownerId: string,
  plateNumber: string,
  vehicleType: Vehicle["vehicleType"],
  make: string,
  model: string,
  colour: string,
): Vehicle {
  return {
    id,
    ownerId,
    plateNumber,
    normalizedPlateNumber: normalizePlateNumber(plateNumber),
    vehicleType,
    make,
    model,
    colour,
    isActive: true,
    createdAt,
    updatedAt: createdAt
  };
}

export function createInitialState(): SmartParkState {
  const now = Date.now();
  const spots = buildSpots();
  const activeEnd = new Date(now + 85 * 60_000).toISOString();
  const expiredEnd = new Date(now - 24 * 60_000).toISOString();
  const activeToken = "demo-active-ticket-token";
  const expiredToken = "demo-expired-ticket-token";

  const bookings: Booking[] = [
    {
      id: "booking_active_demo",
      bookingReference: "SP-260616-ACTIVE",
      driverId: "user_driver_kofi",
      vehicleId: "vehicle_kofi_1",
      zoneId: "zone_market_a",
      spotId: "spot_cma_3",
      durationMinutes: 120,
      amountMinor: 1000,
      currency: "GHS",
      status: "active",
      reservedAt: new Date(now - 40 * 60_000).toISOString(),
      checkInTime: new Date(now - 35 * 60_000).toISOString(),
      endTime: activeEnd,
      createdAt: new Date(now - 45 * 60_000).toISOString(),
      updatedAt: new Date(now - 35 * 60_000).toISOString()
    },
    {
      id: "booking_expired_demo",
      bookingReference: "SP-260616-EXPIRED",
      driverId: "user_driver_efua",
      vehicleId: "vehicle_efua_1",
      zoneId: "zone_high_street_b",
      spotId: "spot_hsb_3",
      durationMinutes: 60,
      amountMinor: 700,
      currency: "GHS",
      status: "expired",
      reservedAt: new Date(now - 130 * 60_000).toISOString(),
      checkInTime: new Date(now - 90 * 60_000).toISOString(),
      endTime: expiredEnd,
      expiredAt: new Date(now - 20 * 60_000).toISOString(),
      createdAt: new Date(now - 140 * 60_000).toISOString(),
      updatedAt: new Date(now - 20 * 60_000).toISOString()
    },
    {
      id: "booking_completed_demo",
      bookingReference: "SP-260615-DONE",
      driverId: "user_driver_ama",
      vehicleId: "vehicle_ama_1",
      zoneId: "zone_independence_c",
      spotId: "spot_iac_6",
      durationMinutes: 60,
      amountMinor: 600,
      currency: "GHS",
      status: "completed",
      reservedAt: new Date(now - 26 * 60 * 60_000).toISOString(),
      checkInTime: new Date(now - 25 * 60 * 60_000).toISOString(),
      endTime: new Date(now - 24 * 60 * 60_000).toISOString(),
      checkOutTime: new Date(now - 24 * 60 * 60_000 + 10 * 60_000).toISOString(),
      createdAt: new Date(now - 27 * 60 * 60_000).toISOString(),
      updatedAt: new Date(now - 24 * 60 * 60_000 + 10 * 60_000).toISOString()
    }
  ];

  return {
    users: demoUsers.map((user) => ({ ...user })),
    vehicles: initialVehicles.map((item) => ({ ...item })),
    zones: demoZones.map((zone) => ({ ...zone })),
    spots,
    bookings,
    payments: bookings.map((booking) => ({
      id: `payment_${booking.id}`,
      bookingId: booking.id,
      driverId: booking.driverId,
      provider: "mock",
      providerReference: `mock_${booking.id}`,
      idempotencyKey: `idem_${booking.id}`,
      amountMinor: booking.amountMinor,
      currency: booking.currency,
      status: "successful",
      paymentMethod: "demo_wallet",
      providerPayload: { seeded: true },
      verifiedAt: booking.reservedAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    })),
    walletAccounts: demoUsers
      .filter((user) => user.role === "driver")
      .map((user, index) => ({
        id: `wallet_${user.id}`,
        userId: user.id,
        currency: "GHS",
        balanceMinor: [8250, 4200, 3500][index] ?? 2500,
        createdAt,
        updatedAt: createdAt
      })),
    walletTransactions: [],
    qrTickets: [
      {
        id: "ticket_active_demo",
        bookingId: "booking_active_demo",
        tokenHash: hashQrToken(activeToken),
        status: "entered",
        issuedAt: bookings[0].reservedAt ?? nowIso(),
        firstEntryAt: bookings[0].checkInTime,
        createdAt: bookings[0].createdAt
      },
      {
        id: "ticket_expired_demo",
        bookingId: "booking_expired_demo",
        tokenHash: hashQrToken(expiredToken),
        status: "expired",
        issuedAt: bookings[1].reservedAt ?? nowIso(),
        firstEntryAt: bookings[1].checkInTime,
        createdAt: bookings[1].createdAt
      }
    ],
    demoQrTokens: {
      booking_active_demo: activeToken,
      booking_expired_demo: expiredToken
    },
    verificationEvents: [],
    violations: [
      {
        id: "violation_expired_demo",
        bookingId: "booking_expired_demo",
        vehicleId: "vehicle_efua_1",
        spotId: "spot_hsb_3",
        violationType: "expired_session",
        detectedAt: new Date(now - 20 * 60_000).toISOString(),
        overstayMinutes: 24,
        status: "open",
        createdAt: new Date(now - 20 * 60_000).toISOString(),
        updatedAt: new Date(now - 20 * 60_000).toISOString()
      }
    ],
    auditLogs: [
      {
        id: createId("audit"),
        actorUserId: "system",
        actorRole: "admin",
        action: "seed_demo_state",
        entityType: "system",
        entityId: "smartpark",
        metadata: { demo: true },
        createdAt: nowIso()
      }
    ],
    processedWebhookKeys: new Set()
  };
}
