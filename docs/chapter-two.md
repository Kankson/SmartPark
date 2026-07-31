# Chapter Two: Review of Literature and Tools

## 2.1 Background Review

Parking management has become an important concern in many urban areas because of the continuous increase in vehicle usage and the limited availability of parking spaces. In busy city centres, drivers often spend time searching for available spaces, while parking authorities face challenges in fee collection, space monitoring, and enforcement. These challenges have encouraged the use of digital parking systems that combine booking, payment, monitoring, and verification.

Smart parking systems are designed to improve the way parking spaces are located, reserved, paid for, and monitored. Existing research shows that smart parking solutions commonly use mobile applications, sensors, wireless communication, cloud databases, and real-time availability updates to help drivers locate free parking spaces and help administrators manage parking activity. Some smart parking studies focus heavily on Internet of Things (IoT) devices such as infrared sensors, microcontrollers, and automated barriers. Others focus on mobile application support, reservation, electronic payment, and user convenience.

For this project, the emphasis is not on building a complex IoT-based parking infrastructure. Instead, SmartPark adopts a low-infrastructure approach based on ordinary smartphones, printed QR signs, visible zone codes, digital payment records, and warden verification. The system demonstrates parking-zone identification, booking, payment, secure QR-code ticketing, timer-based session tracking, software-derived availability, and mobile enforcement without sensors, automated barriers, or fixed cameras.

Digital payment is an important part of modern parking systems. Traditional cash-based parking collection can be slow, difficult to audit, and vulnerable to revenue loss. By introducing wallet-based or provider-based payment, the system can create a clearer record of parking transactions. In SmartPark, payment is treated as the core of the booking process because a parking reservation becomes valid only after payment has been confirmed by the backend.

QR-code ticketing is also useful in simplified parking systems because it provides a quick way to verify a paid booking without requiring expensive physical infrastructure. A QR ticket can be scanned by a warden at entry, during inspection, or at exit. However, for security reasons, the QR code should not contain private user information or payment details. It should contain only a secure ticket token that can be checked against the backend database.

Number-plate verification provides an additional layer of confirmation. In advanced systems, licence-plate recognition may be automated using cameras and optical character recognition. However, automatic recognition can introduce cost, accuracy, privacy, and implementation challenges. For this reason, SmartPark treats automatic number-plate recognition as an optional add-on and provides manual plate search as the main verification method for the MVP.

## 2.2 Review of Existing Applications

Several existing parking applications provide useful ideas for the design of SmartPark. These applications show how digital parking systems can support searching, paying, reserving, and managing parking sessions.

### ParkMobile

ParkMobile is a parking application that allows users to find, reserve, and pay for parking using a mobile app or web-based service. Its public website describes a workflow where users enter a parking zone, set parking time, select a vehicle, and pay for the session. This is relevant to SmartPark because SmartPark follows a similar simplified driver flow: select a parking zone, choose duration, select vehicle, pay, and receive a parking ticket.

The key lesson from ParkMobile is that a parking system should make the driver workflow quick and understandable. The driver should not need to understand the internal parking database or enforcement process. The application should guide the driver through a simple sequence of actions.

### SpotHero

SpotHero focuses strongly on parking reservation. It allows drivers to search for a destination, compare parking options, book a space, and access a parking pass. This shows the importance of giving users confidence before they arrive at a parking location. SmartPark applies this idea by allowing drivers to view parking-zone availability and reserve a space after payment.

The key lesson from SpotHero is that booking should reduce uncertainty. A driver should know the selected location, space, amount, and booking status before arriving.

### Pay-by-Phone Parking Systems

Pay-by-phone parking systems allow drivers to pay for parking through a mobile phone or application instead of using traditional parking meters. Such systems commonly support starting a session, selecting a duration, extending time, and helping enforcement officers check valid sessions. This is relevant to SmartPark because the system also uses digital payment, timed parking sessions, and warden verification.

However, pay-by-phone systems can also have limitations. They may depend on internet or mobile network availability, may introduce additional service charges, and may exclude users who are less comfortable with smartphones. These issues show why SmartPark must remain simple, clear, and transparent about parking fees.

### Scan-to-Pay and Phone-Based Enforcement

Recent parking platforms demonstrate that a printed QR sign can provide a low-cost entry point to digital parking. A driver can scan the sign, identify the parking zone, select a duration, and complete payment without a pay station or barrier. SpotHero's Scan2Pay workflow is an example of on-site QR parking that does not require an initial app download. SmartPark adapts this idea by generating signed zone QR payloads and also displaying a human-readable zone code as a fallback.

Handheld enforcement systems also show that wardens can validate paid parking sessions using ordinary mobile devices. In this model, the number plate acts as a searchable identifier and the warden receives current session, payment, location, and expiry information. SmartPark follows this approach through QR validation, manual plate search, phone-camera capture, and a severity-ranked violation queue.

### Availability Estimation Without Sensors

Parking availability does not always require a sensor in every space. The United States Department of Transportation's ITS evaluation reported that payment transaction data could be used to estimate a substantial proportion of on-street occupancy. This supports SmartPark's decision to derive availability from booking, payment, entry/exit, and warden-verification records. However, SmartPark labels the result as verified, estimated, or limited rather than claiming exact physical occupancy.

### Comparison With SmartPark

SmartPark borrows useful ideas from existing parking applications but keeps the system smaller and more focused. It does not attempt to provide city-wide navigation, physical sensor networks, dynamic pricing, or fully automated enforcement. Instead, it focuses on a demonstrable, phone-first MVP suitable for a city-centre parking fee collection scenario.

The comparison can be summarised as follows:

| Feature | Existing Parking Apps | SmartPark MVP |
| --- | --- | --- |
| Parking search | Commonly supported | Supported through simplified map and zone list |
| Reservation | Supported in some apps | Supported after payment |
| Digital payment | Commonly supported | Supported through mock wallet/payment provider |
| QR ticket/pass | Supported in some systems | Main verification method |
| Warden dashboard | Usually operator-side | Included for enforcement |
| Number-plate verification | May be automated in advanced systems | Manual search first, mock recognition optional |
| IoT sensors/barriers | Used in some advanced systems | Outside MVP scope |
| Scan-to-park zone QR | Supported by some on-site payment systems | Signed zone QR plus visible code fallback |
| Availability confidence | Often shown as a number | Explicitly labelled as verified, estimated, or limited |
| Session extension and alerts | Common in pay-by-phone systems | Implemented for active paid sessions |
| Enforcement prioritisation | Operator-side feature | Implemented from live overstay duration |

## 2.3 Problem Identification

From the review of smart parking concepts and existing applications, the following problems can be identified:

1. Manual parking fee collection can lead to delays, poor accountability, and revenue leakage.
2. Drivers may not know whether parking spaces are available before reaching a parking location.
3. Parking wardens may lack a central dashboard showing active, expired, and invalid parking sessions.
4. Paper tickets can be lost, damaged, reused, or difficult to verify quickly.
5. It can be difficult to identify vehicles that have exceeded their paid parking duration.
6. Fully automated parking systems with sensors, barriers, and cameras can be expensive and complex for an MVP.
7. Automatic number-plate recognition may not always be accurate and should not be the only verification method.
8. Payment confirmation must be handled securely, because relying on the browser alone can lead to false or manipulated payment status.

These problems justify the development of a simplified system that combines digital booking, secure payment confirmation, signed parking-zone QR codes, QR ticketing, timed sessions, explainable availability estimates, manual or camera-assisted plate verification, and a prioritised warden dashboard.

## 2.4 Project Evaluation

SmartPark can be evaluated based on how well it addresses the identified parking-management problems while remaining simple and practical.

### Functional Evaluation

Functionally, the system is expected to support the main parking workflow. A driver should be able to log in, add a vehicle, view parking zones, select a space, choose a duration, make payment, and receive a QR ticket. A warden should be able to view parking activity, scan QR tickets, search number plates, identify expired sessions, and manage violations.

The most important measure of functional success is whether the complete parking cycle can be demonstrated from zone identification to booking, payment, entry, active-session management, verification, and exit or violation handling.

### Usability Evaluation

The system should be easy for non-technical users. Drivers should be able to scan or enter a zone, compare recommended options, and complete a booking without assistance. Wardens should be able to capture or enter a plate and interpret the verification result quickly using clear labels and colour indicators. The implemented interface was checked at a 390 by 844 pixel phone viewport without horizontal overflow.

### Security Evaluation

Security is important because the system involves payment, booking status, vehicle details, and enforcement records. Payment success should be confirmed by the backend, not by the browser. QR codes should use secure tokens rather than exposing personal or financial data. Drivers should only access their own bookings, vehicles, wallet records, and tickets. Wardens should be able to verify tickets and violations but should not be allowed to modify financial records.

### Performance Evaluation

The MVP should load quickly and support simple parking operations without unnecessary complexity. The map should display parking-zone markers rather than heavy navigation or traffic features. Warden dashboards should show useful operational data without excessive animation or large charts.

### Maintainability Evaluation

The project should be structured so that future developers can replace mock services with real services. The payment provider should be replaceable. Plate recognition should be replaceable. The demo in-memory store should later be replaceable with Supabase database access without rewriting the entire user interface.

## 2.5 Review of Project-Related Methodologies

The development of SmartPark follows a structured and iterative methodology. The project begins with the identification of the parking-management problem, followed by requirements analysis, system design, implementation, testing, and documentation.

### Requirements Analysis

The first stage is to define the users of the system and the functions they require. The main users are drivers, wardens, and admins. The requirements are divided into functional requirements, such as booking and QR validation, and non-functional requirements, such as security, usability, responsiveness, and maintainability.

### System Design Methodology

SmartPark uses a role-based design approach. Each user role has its own interface, but all roles share the same backend logic and data model. This avoids duplication and ensures that booking, payment, QR validation, and violation rules remain consistent.

The system is designed around the main parking workflow:

```text
Driver booking -> payment confirmation -> QR ticket -> warden validation -> timer -> exit or violation
```

### Software Development Methodology

The project follows an incremental MVP approach. Instead of building every possible smart parking feature at once, the core workflow is implemented first and then improved with carefully selected phone-based features. This makes the project easier to test and demonstrate while preserving a clear scope.

The implementation phases are:

1. Set up the application structure.
2. Implement authentication and role-based access.
3. Implement parking zones, spaces, and vehicle management.
4. Implement booking and server-side price calculation.
5. Implement mock payment and wallet logic.
6. Implement QR ticket generation and validation.
7. Implement timer and expired-session violation logic.
8. Implement manual plate search and optional mock recognition.
9. Implement signed zone QR codes, availability-confidence labels, and explainable parking-zone ranking.
10. Implement session extension, expiry alerts, camera-assisted plate review, and violation prioritisation.
11. Test and document the system.

### Tools and Technologies

SmartPark uses tools that support rapid development, maintainability, and future expansion.

| Tool/Technology | Purpose in SmartPark |
| --- | --- |
| Next.js | Provides the web application structure, routing, server actions, and API routes |
| React | Builds reusable user-interface components |
| TypeScript | Adds type safety and improves maintainability |
| Tailwind CSS | Provides responsive styling |
| Supabase | Planned backend for authentication, PostgreSQL database, storage, and realtime updates |
| MapLibre GL JS | Displays the simplified parking-zone map |
| QR libraries | Generate and scan QR-code parking tickets |
| Zod | Validates user and API inputs |
| Vitest | Supports unit and integration testing |
| Playwright | Supports end-to-end browser testing |

MapLibre GL JS is suitable for the MVP because it provides browser-based map rendering and marker support without requiring the project to depend on complex proprietary mapping workflows. Supabase is suitable because it combines authentication, PostgreSQL, row-level security, storage, and realtime features in one platform.

### Testing Methodology

Testing is performed at three levels:

1. Unit testing: used to test small functions such as price calculation, plate normalization, and state transitions.
2. Integration testing: used to test workflows such as booking creation, payment confirmation, QR issuing, and violation creation.
3. End-to-end and browser-journey testing: used to simulate driver zone scanning, mobile map ranking, active-session alerts, warden camera-assisted plate review, and QR validation.

This approach helps ensure that both the internal logic and the user-facing workflows behave correctly.

## 2.6 Summary

This chapter reviewed the background of smart parking systems, existing parking applications, the problems identified from manual and digital parking systems, and the methodologies suitable for developing SmartPark. The review shows that the project should focus on a simple but complete parking workflow rather than overcomplicating the system with IoT sensors, automatic barriers, or full automated enforcement.

SmartPark therefore adopts a practical low-infrastructure MVP approach. It focuses on digital booking, wallet/payment integration, signed zone QR entry, secure QR ticketing, timer-based sessions, explainable availability estimates, phone-assisted plate verification, and prioritised warden monitoring. This provides a strong foundation for future expansion while keeping the current project achievable and easy to demonstrate.

## References

1. A. A. Elsonbaty and M. Shams, "The Smart Parking Management System," arXiv, 2020. https://arxiv.org/abs/2009.13443
2. San Francisco Municipal Transportation Agency, "SFpark Evaluation." https://www.sfmta.com/getting-around/drive-park/demand-responsive-pricing/sfpark-evaluation
3. United States Department of Transportation, "San Francisco parking meter payment data models accurately predict 70 percent of on-street parking occupancy," ITS Deployment Evaluation. https://www.itskrs.its.dot.gov/2016-b01101
4. ParkMobile, "ParkMobile Parking App | Find & Pay for Parking." https://parkmobile.io/
5. SpotHero, "Scan2Pay: Sell Secure On-Site Parking Reservations," 2025. https://operator-help.spothero.com/en/articles/9346439-scan2pay-sell-secure-on-site-parking-reservations
6. PayByPhone, "Keeping Track of My Parking Session." https://support.paybyphone.com/hc/en-001/articles/12430829635473-Keeping-track-of-my-parking-session
7. Open Mobility Foundation, "About the Curb Data Specification." https://www.openmobilityfoundation.org/about-cds/
8. Data Protection Commission Ghana, "Documents and Data Protection Act Resources." https://dataprotection.org.gh/documents/
9. Bank of Ghana, "Licence Categories for Payment Service Providers." https://www.bog.gov.gh/fintech-innovation/licence-categories/
10. MapLibre, "MapLibre GL JS Documentation." https://maplibre.org/maplibre-gl-js/docs/
