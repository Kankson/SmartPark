# Chapter Five: Implementation and Testing

## 5.1 Introduction

This chapter describes the implementation and testing of SmartPark. It explains the development tools, platform decisions, implemented modules, verification activities, deployment approach, and production limitations.

The implementation is a functional, low-infrastructure MVP that can be demonstrated with ordinary phones and printed parking-zone signs. Drivers can scan or compare zones, book and pay with a mock wallet, receive QR tickets, monitor and extend sessions, and receive in-browser alerts. Wardens can validate tickets, perform camera-assisted plate checks, monitor spaces, and act on priority-ranked violations.

## 5.2 Development Tools and Platform Consideration

### 5.2.1 Development Tools

| Tool | Purpose |
| --- | --- |
| Node.js and pnpm | Runtime and package management |
| Next.js and React | Full-stack application framework and user interfaces |
| TypeScript | Type-safe application development |
| Tailwind CSS | Responsive interface styling |
| Zod and React Hook Form | Input validation and form management |
| GSAP | Interface motion and interaction feedback |
| Lucide React | Consistent interface icons |
| MapLibre GL JS | Interactive parking map display |
| qrcode.react | QR-code generation |
| html5-qrcode | Phone-camera QR scanning |
| Browser Notification API | Active-session reminders where supported |
| Vitest | Unit and integration tests |
| Playwright | Browser journey automation capability |
| Supabase | Planned production database and authentication platform |

### 5.2.2 Platform Consideration

SmartPark is implemented as a responsive Progressive Web Application. One codebase can serve driver phones, warden phones, and administrative computers and can be developed, tested, deployed, and demonstrated within the project timeframe. The application can later be packaged with Capacitor or rebuilt with a native framework if operating-system-level background features become essential.

The implementation deliberately does not require IoT occupancy sensors, automatic barriers, fixed cameras, or smart meters. Printed signed QR signs, phone cameras, optional geolocation, booking records, ticket validations, and warden observations provide the available signals. Manual zone-code and plate entry remain available when device permissions or camera scanning fail.

The platform supports:

1. Desktop browser use by administrators and developers.
2. Mobile browser use by drivers.
3. Tablet or mobile browser use by wardens.
4. Future deployment to a Node.js-compatible hosting service.
5. Future persistent storage and authentication through Supabase.
6. Future conversion into an installable mobile application wrapper.
7. Graceful fallback when geolocation or notification permission is unavailable.

### 5.2.3 Project Structure

```text
SmartPark/
|-- docs/
|-- public/
|-- src/
|   |-- app/
|   |-- components/
|   |-- lib/
|   `-- server/
|-- supabase/
|-- package.json
`-- README.md
```

The `src/app` directory contains pages and API routes, `src/components` contains reusable interface elements, `src/lib` contains shared helpers, and `src/server` contains domain rules, provider adapters, seed data, and the demo store. The `supabase` directory contains the prepared database migration and seed files, while `docs` contains the academic and technical documentation.

## 5.3 System Implementation

### 5.3.1 Authentication and Role-Based Access

The system has Driver, Warden, and Admin roles. Each role has a protected application area and unauthorised users are redirected. Demo authentication simplifies local testing, while the structure allows Supabase Authentication to replace it in production.

### 5.3.2 Driver Module

The driver module implements:

1. Dashboard and active-booking summary.
2. Signed zone-QR scanning and manual zone-code entry.
3. Interactive map with Best, Closest, and Cheapest modes.
4. Availability-confidence labels and optional location ranking.
5. Parking booking and mock-wallet payment.
6. Vehicle management and booking history.
7. Paid QR ticket display.
8. Active-session countdown, extension, and alerts.
9. Wallet ledger and driver profile.

The driver may scan a parking sign or use the map, choose a vehicle, space, and duration, and pay through the mock wallet flow. Successful payment reserves the space and creates a QR ticket. Eligible active sessions can be extended through a server-authorised wallet transaction.

### 5.3.3 Warden Module

The warden module implements:

1. Dashboard and parking-space grid.
2. QR scanning for entry, status verification, and exit.
3. Manual and camera-assisted plate search.
4. Recognition-confidence review and plate correction.
5. Live, priority-ranked violation alerts.
6. Explicit violation confirmation and reason-based dismissal.
7. Warden profile.

Entry validation changes a reserved booking to active and marks the space occupied. Exit validation completes an active or expired booking and releases the space. Verification attempts are recorded for auditability.

### 5.3.4 Admin Module

The deliberately compact admin module provides system overview, parking-zone and space lists, warden accounts, settings, and printable signed QR signs for each parking zone. Its purpose is configuration and demonstration rather than full municipal administration.

### 5.3.5 Booking and Payment Implementation

```text
Select space -> Hold space -> Calculate price -> Create pending booking
-> Confirm payment -> Reserve booking -> Issue QR ticket
```

The server calculates the amount, controls wallet debits, and changes booking status only after the mock provider confirms payment. The browser cannot declare a successful payment. The provider-adapter design allows a supplied payment service to replace the mock implementation later.

### 5.3.6 QR Ticket Implementation

After payment, the system creates a random ticket token, stores a hash, and renders the token as a QR code for the driver. The warden uses it for entry, status, and exit validation. The QR does not contain personal or financial details.

### 5.3.7 Timer and Violation Implementation

Entry validation sets official server start and end timestamps. The browser countdown is a display of those timestamps rather than the authority. When time expires, the booking and ticket expire and the system creates one open violation while preventing duplicates.

### 5.3.8 Signed Zone QR and Smart Map Implementation

Each zone can produce a signed QR payload. The driver scan page sends a scanned value to `/api/zones/resolve-qr`; the server verifies the signature and resolves the correct booking destination. Modified codes are rejected. A visible short code provides a camera-free fallback, and the admin zone page produces printable field signs.

The map displays rate, estimated spaces, and availability confidence. Best mode combines price, availability, confidence, and optional distance; Closest uses optional browser geolocation; Cheapest sorts by price. Denied geolocation does not block booking.

### 5.3.9 Session Extension and Alert Implementation

The active-session page offers 30, 60, and 90-minute extensions. The API verifies driver ownership, active status, allowed duration, and wallet balance. A successful extension debits the wallet, creates a wallet transaction, updates the official end time, and records an audit event.

The driver can enable browser notifications for warnings at 15 minutes, 5 minutes, and expiry while the application is active. These are convenience reminders only; delivery depends on browser permission and state, while the server timestamp remains authoritative.

### 5.3.10 Camera-Assisted Plate Verification Implementation

The warden plate page accepts an image from a phone camera or file picker. The current recognition provider is a mock adapter that returns a suggested plate and confidence score. The warden must confirm or correct the suggestion before a validity search. Manual entry remains the reliable fallback, and a recognition result never creates or confirms a violation automatically.

### 5.3.11 Violation Priority and Decision-Safety Implementation

Open violations display live overstay time and are ranked as watch below 15 minutes, high from 15 to 29 minutes, and critical from 30 minutes. Dismissal requires a written reason and confirmation is an explicit warden action. This improves operational focus while preserving human judgement and accountability.

### 5.3.12 Motion and Interaction Implementation

GSAP supplies restrained page-entry, list, hover, and status motion through a shared provider. Reduced-motion preferences are respected. Consistent icons, loading states, validation messages, mobile navigation, and stable responsive layouts improve feedback without altering the business rules.

## 5.4 Testing

Testing combines automated domain tests, static analysis, a production build, and mobile-browser journey verification. The main objectives were to verify price calculation, plate normalisation, valid state transitions, payment and wallet integrity, QR validation, expiry, signed zone codes, session extension, violation priority, responsive layout, and role-appropriate workflows.

## 5.5 Unit Testing

| Test Area | Expected Result |
| --- | --- |
| Price calculation | Correct amount is calculated in minor currency units |
| Plate normalisation | Spaces and punctuation are removed and letters become uppercase |
| Booking transition | Invalid status changes are rejected |
| Violation priority | Watch, high, and critical thresholds are assigned correctly |
| Zone-code signature | Valid signed codes resolve and modified codes fail |

Example inputs include normalising `GR 1234-22` to `GR123422` and calculating 250 minor units for 30 minutes at a 500-per-hour rate.

## 5.6 Integration Testing

The automated tests cover complete interactions among services:

1. Mock payment debits the wallet, reserves a space, and issues a QR ticket.
2. QR entry activates the booking and QR exit completes it and releases the space.
3. Repeated or invalid transitions are rejected.
4. An overdue active booking expires and creates exactly one violation.
5. An active session extension updates the end time and debits the wallet.
6. Signed zone codes resolve while tampered codes are rejected.

The current Vitest suite contains nine tests. All nine passed during the latest verification.

## 5.7 End-to-End Testing

The latest browser verification used a 390 by 844-pixel mobile viewport. The checked journeys included:

1. Driver scan-to-book navigation.
2. Optional location-aware map ranking.
3. Active-session countdown, extension choices, and alert controls.
4. Warden camera-assisted plate flow with mandatory confirmation.
5. Live priority-ranked violation display.
6. Responsive pages without horizontal overflow.

The project includes Playwright capability, although full automated Playwright coverage remains future work. The present evidence combines these browser journeys with the automated domain suite.

### 5.7.1 Verification Results

| Verification | Result |
| --- | --- |
| TypeScript type checking | Passed |
| ESLint static analysis | Passed |
| Vitest automated suite | 9 of 9 passed |
| Next.js production build | Passed |
| Mobile browser journeys | Passed at 390 x 844 |

The successful production build generated the implemented application and API routes without compilation failure.

## 5.8 Deployment

For local development:

```powershell
cd "C:\Users\Forge Mages\Documents\SmartPark"
$env:COREPACK_HOME="$PWD\.corepack"
$env:CI="true"
corepack pnpm dev -H 127.0.0.1
```

The application is then opened at `http://127.0.0.1:3000`, or at the alternate port reported by Next.js if that port is occupied.

Before production deployment, the team must replace the demo store with persistent storage, connect the supplied payment provider, enable production authentication, secure environment variables and webhooks, review row-level security and rate limits, test field scanning on real phones, and complete security and privacy reviews. Dependable background reminders would require a production push-notification service. Any live plate-recognition provider must also be evaluated for accuracy, bias, privacy, and local legal compliance.

## 5.9 Challenges Encountered

1. An existing development process could keep port 3000 occupied, requiring process identification or an alternate port.
2. Payment-provider details were unavailable, so a replaceable mock provider was used.
3. Supabase credentials were not configured, so the demonstration uses an in-memory store.
4. Browser notifications depend on user permission and cannot guarantee delivery after the application closes.
5. Real plate OCR is uncertain, so the design requires human confirmation and currently uses a mock adapter.
6. Sensor-free availability is an estimate, so the interface exposes confidence instead of claiming exact occupancy.
7. Mobile testing required separate checks of camera, location, responsive layout, and fallback paths.

These limitations were handled through modular providers, server-side rules, visible confidence and status, and manual fallbacks.

## 5.10 Summary

This chapter described SmartPark's implementation and verification. A driver can find or scan a zone, book and pay, receive a QR ticket, and monitor or extend a session. A warden can validate the ticket, review a camera-assisted plate suggestion, monitor violations by priority, and record a decision.

Type checking, linting, nine automated tests, the production build, and the selected mobile-browser journeys passed in the latest verification. SmartPark is therefore a credible academic MVP while remaining explicit about the mock payment, mock recognition, in-memory storage, and notification limitations that must be replaced for production.
