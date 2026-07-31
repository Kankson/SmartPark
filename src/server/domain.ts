export type UserRole = "driver" | "warden" | "admin";

export type BookingStatus =
  | "pending_payment"
  | "reserved"
  | "active"
  | "completed"
  | "cancelled"
  | "payment_failed"
  | "expired";

export type ParkingSpotStatus = "available" | "held" | "reserved" | "occupied" | "unavailable";
export type PaymentStatus = "pending" | "successful" | "failed" | "cancelled" | "refunded";
export type QrTicketStatus = "active" | "entered" | "exited" | "revoked" | "expired";
export type VerificationType = "entry" | "status_check" | "exit" | "manual_plate_search" | "plate_recognition";
export type VerificationResult = "valid" | "invalid" | "expired" | "already_used" | "not_found" | "mismatch";
export type ViolationStatus = "open" | "confirmed" | "dismissed" | "resolved";
export type ViolationPriority = "critical" | "high" | "watch";
export type AvailabilityConfidence = "verified" | "estimated" | "limited";
export type ViolationType =
  | "expired_session"
  | "invalid_ticket"
  | "wrong_parking_space"
  | "plate_mismatch"
  | "unpaid_vehicle";

export type VehicleType = "car" | "motorcycle" | "van" | "accessible";

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  plateNumber: string;
  normalizedPlateNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  colour: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingZone {
  id: string;
  name: string;
  code: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  hourlyRateMinor: number;
  currency: string;
  operatingStart: string;
  operatingEnd: string;
  totalSpaces: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneWithAvailability extends ParkingZone {
  availableSpaces: number;
  heldSpaces: number;
  reservedSpaces: number;
  occupiedSpaces: number;
  unavailableSpaces: number;
  availabilityConfidence: AvailabilityConfidence;
  availabilityUpdatedAt: string;
}

export interface ParkingSpot {
  id: string;
  zoneId: string;
  spotCode: string;
  status: ParkingSpotStatus;
  isAccessible: boolean;
  vehicleType: VehicleType;
  heldByUserId?: string;
  holdExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  driverId: string;
  vehicleId: string;
  zoneId: string;
  spotId: string;
  durationMinutes: number;
  amountMinor: number;
  currency: string;
  status: BookingStatus;
  reservedAt?: string;
  checkInTime?: string;
  endTime?: string;
  checkOutTime?: string;
  cancelledAt?: string;
  expiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  driverId: string;
  provider: string;
  providerReference: string;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  providerPayload: Record<string, unknown>;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletAccount {
  id: string;
  userId: string;
  currency: string;
  balanceMinor: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletAccountId: string;
  userId: string;
  bookingId?: string;
  paymentId?: string;
  transactionType: "top_up" | "parking_payment" | "refund" | "adjustment";
  direction: "credit" | "debit";
  amountMinor: number;
  balanceBeforeMinor: number;
  balanceAfterMinor: number;
  status: "pending" | "posted" | "failed";
  providerReference?: string;
  description: string;
  createdAt: string;
}

export interface QrTicket {
  id: string;
  bookingId: string;
  tokenHash: string;
  status: QrTicketStatus;
  issuedAt: string;
  firstEntryAt?: string;
  exitAt?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface VerificationEvent {
  id: string;
  bookingId?: string;
  qrTicketId?: string;
  wardenId: string;
  verificationType: VerificationType;
  result: VerificationResult;
  plateNumberEntered?: string;
  deviceInformation?: string;
  notes?: string;
  createdAt: string;
}

export interface Violation {
  id: string;
  bookingId: string;
  vehicleId: string;
  spotId: string;
  violationType: ViolationType;
  detectedAt: string;
  overstayMinutes: number;
  status: ViolationStatus;
  wardenId?: string;
  wardenNotes?: string;
  confirmedAt?: string;
  dismissedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId?: string;
  actorRole?: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SmartParkState {
  users: DemoUser[];
  vehicles: Vehicle[];
  zones: ParkingZone[];
  spots: ParkingSpot[];
  bookings: Booking[];
  payments: Payment[];
  walletAccounts: WalletAccount[];
  walletTransactions: WalletTransaction[];
  qrTickets: QrTicket[];
  demoQrTokens: Record<string, string>;
  verificationEvents: VerificationEvent[];
  violations: Violation[];
  auditLogs: AuditLog[];
  processedWebhookKeys: Set<string>;
}

export const allowedDurations = [30, 60, 90, 120, 180, 240] as const;

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code = "domain_error",
    public readonly status = 400,
  ) {
    super(message);
  }
}

const bookingTransitions: Record<BookingStatus, BookingStatus[]> = {
  pending_payment: ["reserved", "payment_failed", "cancelled"],
  reserved: ["active", "cancelled"],
  active: ["completed", "expired"],
  expired: ["completed"],
  completed: [],
  cancelled: [],
  payment_failed: []
};

const spotTransitions: Record<ParkingSpotStatus, ParkingSpotStatus[]> = {
  available: ["held", "unavailable"],
  held: ["reserved", "available"],
  reserved: ["occupied", "available"],
  occupied: ["available"],
  unavailable: ["available"]
};

export function assertBookingTransition(from: BookingStatus, to: BookingStatus) {
  if (!bookingTransitions[from].includes(to)) {
    throw new DomainError(`Invalid booking transition from ${from} to ${to}`, "invalid_booking_transition");
  }
}

export function assertSpotTransition(from: ParkingSpotStatus, to: ParkingSpotStatus) {
  if (!spotTransitions[from].includes(to)) {
    throw new DomainError(`Invalid space transition from ${from} to ${to}`, "invalid_space_transition");
  }
}

export function normalizePlateNumber(plateNumber: string) {
  return plateNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function calculateParkingPrice(hourlyRateMinor: number, durationMinutes: number) {
  if (!allowedDurations.includes(durationMinutes as (typeof allowedDurations)[number])) {
    throw new DomainError("Unsupported parking duration", "unsupported_duration");
  }

  return Math.ceil((hourlyRateMinor * durationMinutes) / 60);
}

export function formatMoney(amountMinor: number, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(amountMinor / 100);
}

export function createId(prefix: string) {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${id}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function minutesBetween(startIso: string, endIso: string) {
  return Math.max(0, Math.ceil((Date.parse(endIso) - Date.parse(startIso)) / 60_000));
}

export function getViolationPriority(overstayMinutes: number): ViolationPriority {
  if (overstayMinutes >= 30) return "critical";
  if (overstayMinutes >= 15) return "high";
  return "watch";
}

export function getViolationPriorityScore(overstayMinutes: number) {
  const priority = getViolationPriority(overstayMinutes);
  return priority === "critical" ? 3 : priority === "high" ? 2 : 1;
}

export function createBookingReference() {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, "0");
  return `SP-${stamp}-${suffix}`;
}

export function buildQrPayload(token: string) {
  return JSON.stringify({ type: "smartpark-ticket", token });
}

export function parseQrPayload(payload: string) {
  try {
    const parsed = JSON.parse(payload) as { type?: unknown; token?: unknown };
    if (parsed.type !== "smartpark-ticket" || typeof parsed.token !== "string") {
      throw new Error("Invalid QR payload");
    }
    return parsed.token;
  } catch {
    if (payload.trim().length > 12) {
      return payload.trim();
    }
    throw new DomainError("Invalid QR ticket payload", "invalid_qr_payload");
  }
}

export function getRemainingSeconds(endTime?: string, now = new Date()) {
  if (!endTime) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.parse(endTime) - now.getTime()) / 1000));
}
