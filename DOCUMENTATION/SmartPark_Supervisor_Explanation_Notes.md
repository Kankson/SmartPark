# SmartPark Supervisor Explanation Notes

## 1. The Project in One Sentence

SmartPark is a role-based parking management application that allows a driver to find, reserve, pay for, enter, extend, and leave a parking space while giving a warden the tools to verify tickets and number plates, monitor occupancy, and manage overstays.

## 2. One-Minute Project Explanation

SmartPark addresses the delays, uncertainty, cash handling, and weak enforcement common in manually managed city-centre parking. A driver uses the application to view parking zones, see the application's latest availability estimate, choose a vehicle and space, select a duration, and pay from a digital wallet. After payment, the system creates a secure QR ticket.

At the parking location, a warden scans the QR ticket in entry mode. This activates the booking, marks the space as occupied, and starts the official parking period. The driver's screen displays a countdown and sends reminder notifications. The driver can pay to extend an active session. When the paid period ends, the server marks the booking as expired and creates a violation for the warden. On exit, the warden scans the ticket again and the system releases the space.

Number-plate recognition is an optional second verification method. It assists the warden but does not replace the QR ticket, payment record, or human judgement.

## 3. The Problem Being Solved

Traditional parking operations commonly have the following problems:

- Drivers do not know where spaces may be available before arriving.
- Manual cash collection is slow and difficult to audit.
- Paper tickets can be lost, damaged, copied, or incorrectly checked.
- Parking duration is difficult to monitor consistently.
- Wardens may not have one current view of occupied spaces and overdue sessions.
- Separate payment, ticketing, and enforcement activities create inconsistent records.

SmartPark combines these activities in one auditable workflow while deliberately avoiding dependence on costly IoT sensors.

## 4. Project Boundary

### Included in the current project

- Driver, warden, and supporting administrator roles
- Responsive web application and Progressive Web App structure
- Parking-zone map and availability estimates
- Vehicle and number-plate management
- Space selection and temporary reservation holds
- Server-calculated parking charges
- Demonstration digital wallet and payment adapter
- Secure QR tickets for entry, status checks, and exit
- Server-authoritative parking timer
- Paid session extensions
- Overstay detection and violation alerts
- Manual plate search and camera-assisted recognition
- Zone, space, user, payment, ticket, verification, and audit data models
- Automated tests for the main business rules

### Not claimed as complete

- Physical detection of cars through IoT sensors
- Production mobile-money processing
- Production-grade automatic number-plate recognition
- A fully connected production database
- Guaranteed knowledge of unrecorded physical vehicles
- Turn-by-turn navigation
- Native Android or iOS binaries

The present system is a strong functional prototype. Its business logic and interfaces are implemented, while external services are represented through replaceable provider adapters.

## 5. Who Uses the System?

| Actor | Main responsibilities |
|---|---|
| Driver | Registers a vehicle, finds a zone, books and pays, presents a QR ticket, monitors time, extends a session, and views history |
| Warden | Monitors occupancy and violations, scans QR tickets, searches or scans plates, confirms entry or exit, and reviews violations |
| Administrator | Reviews system information, manages operational setup, and generates signed QR signs for parking zones |
| Payment provider | Accepts a payment request and reports a verified result through an adapter |
| Plate-recognition provider | Extracts a possible plate number and confidence score from a camera image |

## 6. High-Level Architecture

SmartPark uses a layered design:

```text
Driver / Warden / Administrator
              |
       Next.js user interface
              |
   Route handlers and server actions
              |
 SmartPark service and domain rules
        /             \
 Payment adapter   Plate adapter
              |
  Demo store now / PostgreSQL later
```

### Presentation layer

The pages and components under `src/app` and `src/components` provide the driver, warden, and administrator interfaces. The interface is responsive and uses a shared application shell, role-specific navigation, MapLibre for the map, `html5-qrcode` for camera scanning, and GSAP for restrained motion.

### Application layer

Next.js route handlers and server actions receive requests, validate input, require an authenticated role, and call the service layer. This prevents the browser from directly changing protected records.

### Domain and service layer

`src/server/domain.ts` defines the business entities, statuses, valid transitions, price calculation, plate normalization, and violation priority. `src/server/smartpark-service.ts` coordinates complete operations such as creating a booking, processing payment, validating a ticket, extending a session, and detecting an overstay.

### Data layer

The running prototype currently uses a seeded in-memory store in `src/server/store.ts`. A PostgreSQL/Supabase schema is already defined in `supabase/migrations/001_initial_schema.sql`, including tables, constraints, Row Level Security, and an atomic space-hold function. Connecting repository functions to that database is a production step.

### External-service adapters

Payment and plate recognition are behind interfaces. The current mock implementations can be replaced by real providers without redesigning the driver and warden screens or the main business rules.

## 7. Complete Driver-to-Exit Workflow

### Step 1: Authentication

The user signs in and receives an HTTP-only session cookie. Role checks direct the user to the correct area and prevent a driver from using warden or administrator routes.

### Step 2: Find a parking zone

The driver opens the map and sees parking zones with price, available-space count, and confidence. The list can favour the closest, cheapest, or best option.

The map displays zones rather than sensor-detected individual cars. Availability comes from the application's booking and spot records.

### Step 3: Create a booking

The driver selects:

- A registered vehicle
- An available space
- An allowed duration

The server verifies that the vehicle belongs to the driver and that the space is available. It places a short hold on the space, calculates the price from the zone's hourly rate, and creates a pending booking.

### Step 4: Pay

The server sends the transaction through the payment-provider interface. In the current prototype, a mock provider immediately returns a controlled success or failure.

On successful verification, the server:

- Debits the demonstration wallet
- Records the payment
- Records the wallet transaction and balance change
- Changes the booking to `reserved`
- Changes the space to `reserved`
- Issues a secure QR ticket

The amount supplied by the browser is never trusted. The server calculates it again.

### Step 5: Enter

The warden scans the ticket in `ENTRY` mode. If it is paid, reserved, valid, and not previously used, the server:

- Changes the booking to `active`
- Changes the space to `occupied`
- Records the check-in time
- Calculates and records the official end time
- Changes the ticket to `entered`
- Records a verification event

The official timer therefore begins after validated entry, not when the booking form is submitted.

### Step 6: Monitor or extend

The driver sees a countdown calculated from the server's end time. The browser updates the display each second, but it cannot grant extra parking time. Optional notifications warn the driver before expiry.

An active session may be extended by 30, 60, or 90 minutes. The server calculates the additional charge, verifies the wallet balance, records the transaction, and updates the end time.

### Step 7: Detect an overstay

Whenever relevant server operations run, `expireOverdueBookings()` compares active bookings with server time. An overdue booking becomes `expired`, its ticket becomes expired, and one open violation is created. Repeated checks update the overstay duration instead of creating duplicate violations.

### Step 8: Exit

The warden scans in `EXIT` mode. An active or expired booking is completed, the ticket is marked as exited, and the parking space returns to available.

## 8. The Main State Machines

State machines prevent impossible changes and make the system easier to test.

### Booking

```text
pending_payment -> reserved -> active -> completed
        |             |          |
        v             v          v
 payment_failed    cancelled   expired -> completed
```

For example, a booking cannot jump directly from `pending_payment` to `active`; payment and reservation must occur first.

### Parking space

```text
available -> held -> reserved -> occupied -> available
```

A hold protects the checkout period. In production, the database's atomic hold function prevents two simultaneous users from reserving the same space.

### QR ticket

```text
active -> entered -> exited
           |
           v
         expired
```

The ticket status makes repeated entry or exit scans detectable.

## 9. Understanding Each Important Component

### Map and "smart" availability

MapLibre renders a map using OpenStreetMap raster tiles. SmartPark ranks zones using availability, price, optional distance, and data confidence.

The confidence label is important:

| Confidence | Meaning |
|---|---|
| Verified | A recent warden verification provides a stronger operational signal |
| Estimated | Current bookings provide a live application signal |
| Limited | The application has little recent evidence |

This is an honest design for a phone-only system. SmartPark should say "availability estimate" rather than claim sensor-level physical certainty.

### Digital wallet and payment

All money values are stored as integer minor units, such as pesewas, to avoid floating-point rounding errors. Payment records use provider references and idempotency keys so repeated provider messages can be detected.

The mock provider proves the workflow and the integration contract. A real mobile-money or card provider would replace the adapter and send a signed webhook before the booking is confirmed.

### QR security

There are two different QR uses:

| QR type | Purpose |
|---|---|
| Zone QR | A signed code displayed at a parking zone so a driver can identify the correct zone |
| Ticket QR | A post-payment credential used by a warden for entry, verification, and exit |

A ticket contains a random token rather than personal or payment details. The store keeps a SHA-256 hash of the token with a server-side pepper. Ticket status, booking status, role checks, and verification logs provide stronger protection than treating any readable QR image as valid.

### Timer and violations

The server's `checkInTime` and `endTime` are authoritative. The React countdown is only a visual representation. This protects the logic from a user changing the phone clock or closing the browser.

Overstay severity is classified as:

| Overstay | Priority |
|---|---|
| Less than 15 minutes | Watch |
| 15 to 29 minutes | High |
| 30 minutes or more | Critical |

### Number-plate checking

Manual plate search normalizes letters and numbers, then checks for matching reserved, active, or expired sessions. Camera-assisted recognition accepts an image and returns a proposed plate and confidence score.

The current recognition provider is mocked and returns a demonstration result. Even with a real OCR or ANPR provider, the warden must confirm the plate because lighting, angle, dirt, and similar characters can cause recognition errors. It is intentionally a second check, not the sole authority.

### Warden dashboard

The dashboard summarizes available and occupied spaces, active sessions, and open violations. The warden can inspect a zone's spaces, scan tickets in different modes, search plates, and confirm or dismiss violations. A dismissal requires a reason, supporting accountability.

### Administrator area

The administrator area provides operational oversight and zone QR-sign generation. It is a supporting feature rather than one of the two main project phases. Full production create, update, and delete operations should use the database, permissions, and audit logs.

## 10. Core Data Model

| Entity | Why it exists |
|---|---|
| `profiles` | Stores identity and role information |
| `vehicles` | Links normalized number plates to drivers |
| `parking_zones` | Stores location, rate, opening information, and map coordinates |
| `parking_spots` | Stores each space and its operational status |
| `bookings` | Connects a driver, vehicle, zone, space, duration, amount, and lifecycle |
| `payments` | Stores provider references, status, amount, and idempotency information |
| `wallet_accounts` | Stores the driver's available demonstration balance |
| `wallet_transactions` | Provides an audit trail of debits, credits, and balance changes |
| `qr_tickets` | Stores hashed ticket tokens and usage status |
| `verification_events` | Records entry, exit, status, and plate checks |
| `violations` | Records overstays and their review status |
| `audit_logs` | Records sensitive administrative or enforcement actions |

The booking is the central business record. It links the commercial event, the physical parking allocation, the ticket, and any enforcement event.

## 11. Security and Integrity Decisions

- Protected operations execute on the server.
- Role checks protect driver, warden, and administrator functions.
- Prices are recalculated on the server.
- Wallet balances are changed only by server logic.
- QR tickets use random tokens and stored hashes.
- Zone QR payloads use an HMAC signature to reveal tampering.
- Payment webhook logic validates a signature and deduplicates events.
- Verification and enforcement actions create records.
- The proposed database uses constraints and Row Level Security.
- The production design must keep service-role secrets out of the browser.

The current demonstration login stores seeded plain-text passwords and a user-ID cookie. This is acceptable only for a local prototype. Production should use Supabase Auth or another mature authentication system, secure password hashing, session rotation, rate limits, and account recovery.

## 12. What Is Real, Mocked, and Planned?

| Area | Current status | Production step |
|---|---|---|
| User interfaces | Implemented | Accessibility and field usability testing |
| Booking rules | Implemented and tested | Move persistence into database transactions |
| Pricing | Implemented server-side | Configure approved municipal tariffs |
| Wallet/payment flow | Implemented with mock provider | Integrate supplied payment API and signed webhooks |
| QR entry and exit | Implemented and tested | Deploy secure secrets, rate limits, and scanner field tests |
| Timer and violations | Implemented and tested | Add scheduled background processing and push updates |
| Map | Implemented | Use production tile/geocoding terms and monitor usage |
| Availability | Application estimate | Add operational reconciliation; no IoT is required |
| Plate search | Implemented | Connect production booking database |
| Camera recognition | Mocked behind interface | Integrate OCR/ANPR provider and test on local plates |
| Database schema | Prepared | Wire repositories to Supabase/PostgreSQL |
| Real-time updates | Recalculated during requests | Add Supabase Realtime or server-sent updates |
| PWA support | Implemented shell/offline fallback | Test installation and caching on target phones |

## 13. Why This Is a Valid Final-Year Project

The academic value is not just the screen design. The project integrates several computer-science concerns:

- Requirements analysis for multiple actors
- Role-based authorization
- Relational data modelling
- Transaction and concurrency design
- State-machine modelling
- Payment-provider abstraction
- Secure token generation and validation
- Real-time time-based business rules
- Camera and QR input
- Map-based decision support
- Progressive Web App design
- Automated testing
- Security, privacy, and auditability

The research and evaluation should measure whether the integrated workflow reduces booking time, improves verification consistency, and gives users clearer parking information compared with a manual process.

## 14. Important Limitations to State Honestly

- The in-memory demonstration data resets when the development server restarts.
- Map availability represents recorded application activity, not guaranteed physical occupancy.
- The current payment provider does not transfer real money.
- The current camera provider demonstrates the integration pattern rather than production recognition accuracy.
- Browser notifications require permission and may behave differently across mobile platforms.
- True real-time multi-device synchronization requires the prepared database and a realtime channel.
- Reliable production operation also needs rate limiting, monitoring, backups, privacy rules, retention rules, and security testing.

These limitations do not invalidate the prototype. They define the boundary between the implemented academic system and production deployment.

## 15. Five-Minute Demonstration Plan

1. Sign in as a driver and briefly show registered vehicles and wallet balance.
2. Open the map and explain price, available spaces, and confidence.
3. Choose a zone, vehicle, space, and duration; show that the server calculates the amount.
4. Complete the demonstration payment and display the generated QR ticket.
5. Open the warden interface and scan or paste the ticket in entry mode.
6. Return to the driver active-session page and show the official countdown and extension choices.
7. Show the warden dashboard, plate search, space states, and violation queue.
8. Scan the ticket in exit mode and show that the space becomes available again.
9. End by distinguishing the implemented core from the mock external providers.

Demo accounts:

```text
Driver: driver@smartpark.test / password123
Warden: warden@smartpark.test / password123
Admin:  admin@smartpark.test / password123
```

## 16. Likely Supervisor Questions and Strong Answers

### "Why is it smart if there are no IoT sensors?"

The intelligence is in the integrated decision and control process: zone ranking, availability confidence, server-calculated pricing, controlled state transitions, timed enforcement, duplicate-safe violations, secure verification, and camera-assisted plate matching. The system labels availability honestly instead of pretending to have physical certainty.

### "How do you stop two drivers from booking the same spot?"

The application moves a space from available to held before payment and enforces valid state transitions. The production PostgreSQL design includes an atomic `hold_parking_spot()` function, so simultaneous requests cannot both succeed.

### "Can a driver change the price in the browser?"

Changing the displayed value does not change the charge. The server retrieves the zone rate and recalculates the amount before recording payment.

### "What makes the timer trustworthy?"

The server records check-in and end times. The browser only displays the difference. Closing the page or changing a phone clock does not extend the official session.

### "Can someone copy another person's QR code?"

A copy still refers to the same server-side ticket. The token is random, stored as a hash, linked to one booking, and governed by its status. Once entry or exit changes that status, an invalid repeated action is rejected and logged. Production should also use short validity windows and scanner rate limits.

### "Why not use number-plate recognition alone?"

Recognition can fail because of image quality, angle, dirt, or character similarity. SmartPark uses it as assisted double verification. The payment-backed QR ticket and booking record remain the primary evidence, with the warden confirming camera results.

### "Is the system really real-time?"

The current prototype recalculates state from current server data whenever relevant pages or actions run. It is near-live within the demonstration, but true push synchronization between many devices is a production step using Supabase Realtime or another event channel.

### "Why use a PWA instead of building two native apps?"

A responsive PWA gives drivers and wardens one maintainable codebase, browser-based QR and camera access, installability, and faster development. Native applications can later be built with React Native or Capacitor if deeper platform integration becomes necessary.

### "What happens when there is no internet?"

The PWA can retain an application shell and show an offline fallback, but payments, authoritative booking changes, and ticket validation should not be finalized without the server. This preserves consistency and prevents conflicting records.

### "How would you make it production-ready?"

Connect the service layer to Supabase/PostgreSQL, use Supabase Auth, integrate the supplied payment provider with signed idempotent webhooks, add scheduled expiry processing and realtime subscriptions, connect and evaluate a plate-recognition provider, add rate limiting and monitoring, and conduct security and field usability tests.

### "How was it tested?"

The project currently has nine passing Vitest tests for normalization, pricing, invalid transitions, violation priority, zone-QR tampering, paid reservation and QR creation, entry and exit validation, duplicate-safe expiry violations, and paid extensions. The TypeScript type check also passes. Playwright journeys provide a starting point for driver and warden end-to-end browser testing.

## 17. Terms You Should Use Carefully

Use these accurate descriptions:

- "availability estimate with a confidence label"
- "mock payment provider behind a replaceable interface"
- "camera-assisted plate recognition"
- "server-authoritative parking timer"
- "in-memory prototype with a production database schema prepared"
- "responsive Progressive Web App"
- "role-based parking workflow"

Avoid claiming:

- guaranteed physical availability
- real money transfer in the prototype
- production-grade ANPR accuracy
- complete offline transactions
- a fully deployed production database
- IoT-based occupancy detection

## 18. Source-Code Guide

| Topic | Main location |
|---|---|
| Business entities and state rules | `src/server/domain.ts` |
| Complete parking workflows | `src/server/smartpark-service.ts` |
| Demo data | `src/server/seed.ts` |
| Demo data store | `src/server/store.ts` |
| Ticket and zone QR security | `src/server/qr.ts` |
| Payment integration contract | `src/server/payment-provider.ts` |
| Plate-recognition contract | `src/server/plate-recognition-provider.ts` |
| Authentication and role checks | `src/lib/auth.ts` |
| Driver pages | `src/app/driver` |
| Warden pages | `src/app/warden` |
| Administrator pages | `src/app/admin` |
| API routes | `src/app/api` |
| Database design | `supabase/migrations/001_initial_schema.sql` |
| Business-rule tests | `src/server/smartpark-service.test.ts` |
| Browser journeys | `e2e/smartpark.spec.ts` |

## 19. Final Summary to Memorize

SmartPark is an integrated parking workflow, not merely a map or payment page. Its central record is the booking, which connects a driver, vehicle, zone, spot, price, payment, QR ticket, timer, verification events, and possible violation. The server controls all important state changes. The current prototype demonstrates the complete workflow with mock external providers and an in-memory store, while its provider interfaces and PostgreSQL schema show how it can progress into a production system without changing the core concept.
