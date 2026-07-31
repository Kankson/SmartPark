# Chapter One: Introduction

## 1.1 Introduction

SmartPark is a simplified, low-infrastructure smart parking management system designed to support parking fee collection, booking, and verification within a city-centre parking environment. The system allows drivers to scan signed parking-zone QR signs, find parking zones, reserve available spaces, pay through a digital wallet or payment provider, receive QR-code parking tickets, and track their parking time.

The system also provides wardens with tools for monitoring parking activity, validating QR tickets, checking vehicle number plates, identifying expired parking sessions, and recording violations. The main purpose of SmartPark is to reduce manual parking fee collection problems while keeping the application simple, usable, and easy to demonstrate.

SmartPark is designed as a responsive, phone-first web system that can later be packaged as a native mobile application. It is intentionally designed to operate with ordinary smartphones, inexpensive printed QR signs, visible zone codes, and a central web service rather than specialised Internet of Things (IoT) equipment. The project focuses on the core parking workflow: zone identification, booking, payment, QR ticketing, timer-based parking sessions, and basic enforcement.

## 1.2 Problem Statement

Many city-centre parking systems still depend on manual fee collection and physical inspection. This can lead to delays, poor tracking of occupied and available spaces, revenue leakage, disputes between drivers and parking officers, and difficulty identifying drivers who have exceeded their paid parking time.

Drivers may also struggle to know where parking is available before arriving at a location. Wardens may not have a reliable digital dashboard showing which vehicles have valid bookings, which spaces are occupied, and which sessions have expired.

Therefore, there is a need for a simplified smart parking management system that allows drivers to book and pay for parking digitally while enabling wardens to verify parking sessions quickly using QR codes and number-plate checks.

## 1.3 Project Aim

The aim of this project is to design and develop a simplified, phone-first smart parking management system called SmartPark that enables digital parking booking, payment, secure QR-code validation, parking-session timing, availability estimation, and warden-based vehicle verification for city-centre parking fee collection without requiring IoT sensors or automated barriers.

## 1.4 Project Objectives

The objectives of the project are to:

1. Develop a driver interface where users can register, add vehicles, view parking zones, select available spaces, and make parking bookings.
2. Implement a digital payment or wallet-based system for processing parking fees.
3. Generate secure QR-code tickets after successful payment.
4. Provide a parking timer that tracks the official duration of an active parking session.
5. Develop a warden dashboard for monitoring available, reserved, occupied, and expired parking spaces.
6. Allow wardens to scan QR tickets for entry, status verification, and exit validation.
7. Provide manual number-plate search for additional vehicle verification.
8. Detect expired parking sessions and create violation alerts for wardens.
9. Allow drivers to scan a signed parking-zone QR code or enter a visible zone code to begin parking quickly.
10. Rank parking zones by best overall choice, proximity, and price while showing whether availability is verified, estimated, or based on limited signals.
11. Allow drivers to extend an active paid session and receive expiry alerts.
12. Support phone-camera plate capture with recognition confidence and mandatory warden confirmation.
13. Prioritise violation alerts by live overstay severity and require reasons when wardens dismiss alerts.
14. Provide a basic admin section for managing system setup and generating printable parking-zone QR signs.
15. Keep the system simple, secure, responsive, and suitable for demonstration as an academic MVP.

## 1.5 Scope of the Project

The scope of SmartPark covers the development of a simplified parking management application with three main user roles: driver, warden, and admin.

For drivers, the system includes registration, login, vehicle management, signed zone-QR scanning, manual zone-code entry, parking-zone viewing, best/closest/cheapest ranking, optional location-based ranking, availability-confidence labels, space selection, booking, payment, QR-ticket display, active-session timing, session extension, expiry alerts, wallet history, and booking history.

For wardens, the system includes a dashboard, parking-space grid, QR-ticket validation, manual plate search, phone-camera plate capture, recognition-confidence review, severity-ranked expired-session alerts, and violation management.

For admins, the system includes basic views for parking zones, parking spaces, warden accounts, system settings, and signed printable zone QR codes.

The project also includes a database design for users, vehicles, parking zones, parking spaces, bookings, payments, wallet transactions, QR tickets, verification events, violations, and audit logs.

The system is designed as a responsive Progressive Web Application for the MVP and is optimised for ordinary driver and warden phones. Printed QR signs and visible zone codes are the only dedicated physical parking materials assumed by the system. It is not a native Android or iOS application at this stage, although the structure allows future mobile packaging using tools such as Capacitor.

## 1.6 Limitations of the Project

The limitations of the project are:

1. The MVP uses a simplified map view that displays parking zones only; it does not provide turn-by-turn navigation or live traffic information.
2. The payment provider is represented by a mock payment system until the actual payment service is integrated.
3. The phone-camera plate workflow currently uses a replaceable mock recognition provider. Real optical character recognition must be connected and evaluated before production use.
4. The system does not include physical parking barriers, IoT sensors, CCTV monitoring, or automatic vehicle detection.
5. The MVP is not a full legal enforcement platform and does not automatically issue official fines.
6. Availability is estimated from software records such as bookings, entry/exit validation, and warden activity. Without physical sensors, it must not be presented as guaranteed detection of every parked vehicle.
7. Browser-based expiry notifications work while the application is active. Background delivery requires a production push-notification service.
8. The application depends on internet access for booking, payment confirmation, signed zone-QR resolution, QR validation, and current dashboard updates.
9. The current implementation uses an in-memory demonstration store, so records reset when the server restarts. Supabase/PostgreSQL persistence remains a production requirement.
10. The current implementation requires further security, privacy, and payment-provider review before real-money deployment.
11. The system is initially built as a responsive web application rather than a fully native mobile application.

## 1.7 Approach to Project

The project follows a phased development approach.

First, the system requirements are identified by defining the major users, workflows, and core features required for a low-infrastructure MVP. The main workflow is centred on a driver scanning or selecting a parking zone, selecting a space, paying for a booking, receiving a QR ticket, and having that ticket validated by a warden.

Second, the system architecture is designed using a shared frontend and backend structure. The application is organised into role-based interfaces for drivers, wardens, and admins, while the business logic is handled by reusable server-side services.

Third, the database structure is designed to support users, vehicles, parking zones, spaces, bookings, payments, QR tickets, wallet transactions, verification events, violations, and audit logs. Security rules such as role-based access and row-level security are considered as part of the design.

Fourth, the application is implemented using modern web technologies, including Next.js, React, TypeScript, Tailwind CSS, MapLibre GL JS, QR-code libraries, and a Supabase-ready database architecture. Signed zone QR codes, explainable parking-zone ranking, active-session extension, expiry alerts, phone-camera plate capture, and severity-based warden queues are implemented around the core workflow. A mock payment provider and mock plate-recognition provider are retained as replaceable demonstration adapters until real external services are available.

Finally, the system is tested through automated domain and integration tests, production compilation, and mobile-sized browser journeys. The verified journeys include scan-to-zone, map ranking, booking, payment, QR generation and validation, session extension and alerts, camera-assisted plate review, expired-session detection, and violation handling. The completed MVP demonstrates the essential parking-management process without specialised parking hardware.
