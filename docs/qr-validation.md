# QR Validation

SmartPark uses QR tickets as the primary verification method.

```mermaid
flowchart TD
  A["Payment successful"] --> B["Generate secure random token"]
  B --> C["Store token hash"]
  C --> D["Render raw token as QR"]
  D --> E["Warden scans QR"]
  E --> F{"Mode"}
  F -->|ENTRY| G["reserved -> active, space reserved -> occupied"]
  F -->|VERIFY| H["Return booking, plate, payment, timer status"]
  F -->|EXIT| I["active/expired -> completed, space -> available"]
```

The QR payload must not include personal data, wallet data, payment credentials, or full booking details.

Repeated exit attempts, unknown tickets, revoked tickets, cancelled bookings, and unverified payments are rejected with
clear result messages.
