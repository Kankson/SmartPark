# SmartPark User Manual

This guide covers the normal Driver and Warden workflows. Use the Help icon in the application header to replay the relevant tutorial at any time.

## Driver Workflow

1. Log in with a Driver account.
2. Open **Map** to compare zones, available spaces and hourly prices. Use **Scan** instead when a parking-zone QR sign is available.
3. Select a zone and choose the vehicle, duration and available parking space.
4. Review the fee and continue to payment checkout. AZA is used when the live provider is configured; otherwise SmartPark uses the demonstration provider.
5. Wait for SmartPark to confirm payment and display the QR parking ticket.
6. Present the ticket to a logged-in Warden. The Warden selects **ENTRY** and scans it.
7. Open **Active** to monitor the timer or extend the session before expiry.
8. At departure, present the same ticket for an **EXIT** scan.
9. Open **History** to review the completed booking.

## Warden Workflow

1. Log in with a Warden account.
2. Review **Dashboard** for occupancy and urgent violation alerts.
3. For vehicle entry, open **Scanner**, select **ENTRY**, allow camera access and scan the Driver's ticket.
4. Confirm that the result is valid and that the plate and assigned space match the vehicle.
5. During patrol, use **Spaces** to review space states and **Plates** to check a registration number.
6. Open **Violations** for overdue sessions. Verify the vehicle, add a note and confirm or dismiss the alert.
7. For vehicle exit, open **Scanner**, select **EXIT** and scan the same ticket.
8. Use **VERIFY** only when checking a ticket without changing its entry or exit state.

## Mobile Notes

- Use the deployed HTTPS Vercel address for camera scanning.
- Grant camera permission when the browser asks.
- The Driver and Warden should use separate role accounts.
- Both devices must access the same deployed SmartPark environment.
- A valid payment confirmation is required before a Driver QR ticket is issued.
- The current demonstration store is held in server memory. Reliable shared state across multiple Vercel devices requires the prepared Supabase persistence layer to be connected.
