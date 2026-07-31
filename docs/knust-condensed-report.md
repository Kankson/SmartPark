# CHAPTER ONE
# INTRODUCTION

## 1.1 Background to the Study

Parking in busy city centres is both a mobility service and a revenue source. Where fee collection depends on cash, paper receipts and visual inspection, drivers may spend additional time looking for space, parking officers may struggle to verify payment quickly, and managers may have incomplete records for reconciliation. Digital parking systems address these concerns by connecting location identification, payment, session timing and enforcement in one auditable process.

SmartPark is a simplified parking-management application designed for a low-infrastructure environment. It uses ordinary smartphones, printed parking-zone QR signs and server records rather than automatic barriers, fixed cameras or Internet of Things sensors. A driver can scan or select a parking zone, compare availability estimates, reserve a space, pay through a wallet workflow and receive a QR ticket. A warden can validate the ticket, check a number plate and review expired sessions. An administrator can view setup information and print signed zone signs.

The project is implemented as a responsive Progressive Web Application so the same system can support drivers and wardens in the field and administrators on a computer. Its central design principle is that convenience features may assist users, but payment validity, booking state and the official parking timer remain controlled by the server.

## 1.2 Problem Statement

Manual city-centre parking operations can cause slow fee collection, weak transaction traceability, disputes about paid time and difficulty identifying overstays. Drivers may not know where to begin a digital parking session or how much time remains. Wardens may have no single view of reserved, occupied and expired spaces, and a number-plate check may be separated from the payment record. Fully automated alternatives can solve some of these problems but require expensive sensors, barriers and fixed recognition cameras.

There is therefore a need for a smaller system that improves payment accountability and field verification using equipment already available to most users. The solution must support quick zone identification, secure payment confirmation, QR ticketing, a reliable timer and a clear warden workflow without presenting software-derived availability as guaranteed physical occupancy.

## 1.3 Aim of the Project

The aim is to design, implement and evaluate a phone-first smart parking management system that supports digital booking, payment, QR ticket validation, timed parking sessions and warden verification without requiring specialised parking hardware.

## 1.4 Project Objectives

The specific objectives are to:

1. provide role-based interfaces for drivers, wardens and administrators;
2. enable signed parking-zone QR scanning, manual zone-code entry and simplified map selection;
3. implement server-calculated booking and a replaceable wallet/payment workflow;
4. generate secure QR tickets for entry, status and exit validation;
5. provide active-session timing, paid extension options and expiry reminders;
6. estimate availability with visible confidence rather than claiming sensor certainty;
7. support manual and camera-assisted plate verification with human confirmation;
8. prioritise expired sessions by live overstay duration; and
9. verify the implementation through static checks, automated tests, production compilation and mobile-browser journeys.

## 1.5 Research Questions

1. How can a city-centre parking workflow be digitised using phones and printed signs rather than IoT equipment?
2. How can booking, payment, timing and QR verification be combined without allowing the browser to determine official parking validity?
3. How can wardens receive useful availability and violation information while uncertainty and recognition errors remain visible?

## 1.6 Significance of the Project

SmartPark demonstrates an affordable path from cash-based parking collection to an auditable digital workflow. Drivers gain clearer pricing, tickets and session status; wardens gain faster verification and prioritised alerts; and managers gain structured records that can later support reconciliation and planning. Academically, the project applies software engineering, security, human-computer interaction and testing to a practical public-service problem.

## 1.7 Scope and Delimitations

The implemented scope covers driver registration and vehicles, zone discovery, booking, mock wallet payment, ticket QR generation, active sessions, extension and reminders; warden dashboards, QR validation, plate search, camera-assisted recognition review and violation decisions; and administrator setup views with printable signed zone QR codes. The map is for parking-zone selection, not turn-by-turn navigation.

The project deliberately excludes automatic barriers, IoT occupancy sensors, fixed CCTV/ANPR infrastructure, dynamic pricing and automatic legal penalties. Payment, storage and plate recognition use replaceable demonstration providers because production credentials and policy approvals are outside the academic MVP.

## 1.8 Organisation of the Report

Chapter One introduces the problem, aim and scope. Chapter Two reviews related systems and establishes the project gap. Chapter Three presents the methodology, requirements and system design. Chapter Four describes implementation, testing and results. Chapter Five provides the summary, conclusions and recommendations.

# CHAPTER TWO
# REVIEW OF RELATED LITERATURE

## 2.1 Introduction

This chapter reviews digital parking payment, QR-based entry, session management, sensor-free estimation and mobile enforcement. The review focuses on ideas that are useful for a low-cost city-centre system rather than on infrastructure-heavy smart-city deployments.

## 2.2 Digital Parking and Mobile Payment

Mobile parking applications commonly allow a driver to identify a location, select a vehicle, choose a duration and pay electronically. Their value is not only convenience; the resulting transaction becomes a record that can be matched to a location, plate and time. This supports both customer receipts and enforcement checks. A digital workflow should nevertheless treat the server or payment provider as the source of payment truth because browser responses can be interrupted or manipulated.

PayByPhone shows how active sessions can present the remaining time, exact end time, location and vehicle, while available extensions remain subject to operator rules (PayByPhone, n.d.). SmartPark adopts the same clarity but calculates extensions on the server and records each wallet debit. Reminder delivery is treated as assistance rather than proof that a session remains valid.

## 2.3 QR-Based Parking Access

Printed QR signs provide a low-cost bridge between a physical parking location and a digital service. SpotHero's Scan2Pay allows a driver to scan on-site signage, select duration, enter plate information and complete payment without first installing an application (SpotHero, 2025). The service also gives operators reservation, revenue and enforcement visibility.

SmartPark separates two QR purposes. A signed zone QR identifies where the driver intends to park and starts the booking flow. A separate ticket QR is issued only after payment and proves that a specific booking can be validated. Zone payloads are signed to reject alteration, while ticket tokens are stored as hashes and contain no personal or financial details.

## 2.4 Availability Without Space Sensors

Exact real-time occupancy normally requires sensors or frequent physical observation. However, payment and operational records can still provide useful estimates. A United States Department of Transportation review of SFpark reported that payment-data models estimated occupancy accurately about 67 to 69 per cent of the time, demonstrating value without continued large-scale sensor deployment (U.S. DOT ITS JPO, 2016).

SmartPark therefore derives an estimate from bookings, entry/exit validations and warden activity. The interface labels the result as warden verified, session estimated or limited signal. This avoids overstating precision and allows future data sources to improve confidence without changing the driver workflow.

## 2.5 Mobile Enforcement and Human Oversight

A phone-based plate search can connect a visible vehicle to a valid session. Camera-assisted optical character recognition can reduce typing, but image quality, plate design, lighting and algorithmic error make it unsuitable as the sole basis for enforcement. SmartPark displays the proposed plate and confidence score and requires the warden to confirm or correct it before searching. Similarly, the system ranks violations by overstay duration but leaves confirmation and reason-based dismissal to the warden.

This human-in-the-loop approach supports proportional decision-making and privacy. Plate images and location histories can identify individuals, so a production system should limit collection, role access and retention in line with Ghana's data-protection requirements (Data Protection Commission Ghana, n.d.).

## 2.6 Existing Systems and Identified Gap

[[TABLE:Table 2.1: Comparison of selected parking approaches]]
| Capability | Established approach | SmartPark response |
| --- | --- | --- |
| On-site start | App search, meter or QR sign | Signed zone QR, visible code or map |
| Payment | Card, wallet or mobile payment | Replaceable provider with mock wallet |
| Session support | Timer, reminder and optional extension | Timer, exact end time, alerts and paid extension |
| Enforcement | Plate lookup or operator integration | Ticket QR, plate search and human-reviewed camera suggestion |
| Occupancy | Sensor feed or displayed availability | Explicitly labelled software estimate |
| Infrastructure | May include gates, meters and sensors | Phones, printed signs and web service |

Existing platforms demonstrate valuable individual patterns, but a smaller academic system must combine them coherently. The gap addressed by SmartPark is a unified, explainable workflow for payment and enforcement that remains useful without proprietary parking hardware. Open curb-management work also shows the importance of representing locations, regulations and usage events as structured digital records (Open Mobility Foundation, n.d.).

[[FIGURE:figure_2_1_conceptual_framework.png|Figure 2.1: Conceptual framework for SmartPark]]

## 2.7 Chapter Summary

The review supports five design choices: phone-first access, signed zone identification, server-authorised payment and timing, uncertainty labels for availability, and human confirmation for plate and violation decisions. These choices form the requirements and architecture presented in Chapter Three.

# CHAPTER THREE
# METHODOLOGY, ANALYSIS AND DESIGN

## 3.1 Introduction

This chapter explains how SmartPark was developed and presents the consolidated requirements and design. The approach is appropriate for a software project whose value is demonstrated through an executable prototype and verified workflows.

## 3.2 Development Methodology

An iterative prototyping method was used. The first increment established authentication, roles, zones, spaces, vehicles and server-side domain rules. The second implemented booking, mock payment, wallet records and ticket QR validation. Later increments added signed zone QR codes, map ranking, confidence labels, extension, reminders, camera-assisted plate review, violation priority and interaction improvements.

Requirements were obtained from the project brief, analysis of manual parking problems, review of comparable services and repeated examination of driver and warden journeys. Each increment was checked against business rules before interface polish was added. This kept the core payment and validation workflow stable while allowing usability improvements.

## 3.3 Functional and Non-Functional Requirements

[[TABLE:Table 3.1: Consolidated system requirements]]
| Area | Essential requirements |
| --- | --- |
| Driver | Register vehicles; scan/select zone; compare rate and confidence; book and pay; view ticket, session and history; extend eligible sessions |
| Warden | View spaces and sessions; scan ticket; search or capture plate; review confidence; confirm/dismiss ranked violations |
| Administrator | View zones, spaces and wardens; print signed zone QR signs |
| System | Enforce roles and valid state transitions; calculate prices; prevent double booking; verify payment; hash ticket tokens; audit sensitive events |

The principal non-functional requirements are mobile usability, reliability under repeated scans and failed requests, secure server-side decisions, accessible status labels, reasonable performance, privacy and maintainability. The payment and recognition adapters must be replaceable without rewriting the domain services. Where device permission is denied, manual entry must preserve the workflow.

## 3.4 System Architecture

SmartPark follows a layered architecture. Responsive client interfaces call protected Next.js pages and API routes. Domain services implement booking, pricing, wallet, QR, session and violation rules. A data/provider layer supplies the demonstration store, Supabase-ready model and replaceable payment and recognition adapters. Authentication, validation, audit logging, QR signing, privacy limits and human confirmation apply across the layers.

[[FIGURE:figure_3_1_system_architecture.png|Figure 3.1: SmartPark system architecture]]

This separation prevents interface code from becoming the authority for payment or booking state. It also provides a clear migration path: the demonstration store can be replaced with Supabase persistence, and mock providers can be replaced with approved services.

## 3.5 Use-Case Model

The Driver, Warden and Administrator share the same parking-session lifecycle but perform different tasks. Drivers identify a zone and create a paid session. Wardens verify the session and resolve exceptions. Administrators maintain the configuration required for both groups.

[[FIGURE:figure_3_2_use_case_model.png|Figure 3.2: SmartPark use-case model]]

## 3.6 Data Design

The booking is the central record. It links the driver and vehicle to a zone and space, amount, start/end timestamps and controlled status. Payment and ticket records prove financial and access state. Verification events preserve who checked a ticket or plate and when. A violation references one expired booking, preventing duplicate open violations for the same session.

[[FIGURE:figure_3_3_core_data_model.png|Figure 3.3: Core SmartPark data model]]

Important integrity rules include unique space allocation during an active reservation, server timestamps, immutable wallet ledger entries, hashed ticket tokens and valid status transitions. A production Supabase database would enforce these rules through constraints, indexes and row-level security in addition to application checks.

## 3.7 Security, Privacy and Ethical Considerations

The design applies least-privilege role access. Drivers cannot access warden or administrator operations, and wardens cannot alter wallet balances. Prices and extension charges are recalculated on the server. Signed zone codes reject altered payloads, while ticket QR codes expose only a random token. Dismissed violations require a reason to preserve accountability.

Plate images, vehicle registrations and location histories are personal data. The MVP avoids automatic penalties and requires human confirmation before using a camera suggestion. Production deployment should document lawful purpose, access controls, image retention, audit retention and user notices, and should complete a data-protection impact review where required.

## 3.8 Chapter Summary

The iterative method produced a modular design centred on a controlled booking lifecycle. The architecture, use cases and data model support the project objectives while preserving manual fallbacks and visible uncertainty.

# CHAPTER FOUR
# PROJECT EXECUTION, IMPLEMENTATION AND TESTING

## 4.1 Introduction

This chapter describes the implemented application, its main workflows and the evidence used to verify it. The emphasis is on the working academic MVP; production services that remain simulated are stated explicitly.

## 4.2 Development Environment

[[TABLE:Table 4.1: Main development tools]]
| Tool | Project use |
| --- | --- |
| Next.js, React and TypeScript | Full-stack pages, API routes and typed components |
| Tailwind CSS, Lucide and GSAP | Responsive styling, icons and restrained motion |
| MapLibre GL JS | Simplified parking-zone map |
| qrcode.react and html5-qrcode | Ticket generation and phone-camera scanning |
| Zod and React Hook Form | Input and form validation |
| Vitest and Playwright | Automated domain tests and browser-journey capability |
| Supabase libraries | Prepared production authentication and persistence path |

## 4.3 Implemented Workflow

The driver can scan a signed zone sign or choose a zone on the map. The server returns the configured price, estimated availability and confidence. The driver selects a vehicle, space and duration; the server calculates the charge, debits the mock wallet, reserves the space and issues a QR ticket. A warden entry scan activates the timer. The driver may pay for an extension while the session remains eligible. A warden exit scan completes the booking, while an overdue session becomes expired and produces one ranked violation.

[[FIGURE:figure_4_1_end_to_end_workflow.png|Figure 4.1: End-to-end SmartPark parking workflow]]

## 4.4 Booking and Enforcement Lifecycle

The booking states are controlled by domain rules rather than arbitrary database updates. A pending payment can become reserved only after confirmation. Entry changes a reservation to active, and exit completes it. If the official end time passes first, the booking expires and one violation is created. Extension debits the wallet and changes the end time without leaving the active state.

[[FIGURE:figure_4_2_booking_lifecycle.png|Figure 4.2: Booking and enforcement lifecycle]]

## 4.5 Driver, Warden and Administrator Modules

The driver module contains the dashboard, scan page, interactive map, booking form, ticket, active-session view, wallet, vehicles, history and profile. Map modes rank the best overall option, closest option when location is permitted, or cheapest option. Availability labels distinguish warden-verified information from session estimates and limited signals. The active view shows the exact end time, countdown, 30/60/90-minute extension choices and optional browser reminders.

The warden module contains the dashboard, space grid, QR scanner, plate-verification panel and violation queue. A plate image can be captured from a phone, but the current adapter returns only a demonstration suggestion and confidence. The warden must confirm or correct the plate before search. Violations are ranked as watch below 15 minutes, high from 15 to 29 minutes and critical from 30 minutes; dismissal requires a reason.

The administrator module provides setup visibility and generates printable signed QR signs with a human-readable fallback code. It intentionally omits complex municipal management functions so the project remains focused on fee collection and verification.

## 4.6 Verification and Test Results

The domain suite contains nine automated tests. It verifies plate normalisation, fee calculation, invalid booking transitions, violation thresholds, signed-zone verification and tamper rejection, paid reservation and ticket creation, safe entry/exit transitions, single violation creation after expiry, and wallet debit during extension.

[[TABLE:Table 4.2: Verification results]]
| Verification activity | Result |
| --- | --- |
| TypeScript type checking | Passed |
| ESLint static analysis | Passed |
| Vitest automated suite | 9 of 9 passed |
| Next.js production build | Passed; 44 routes generated |
| Mobile browser journeys | Passed at 390 x 844 pixels |

The mobile journeys covered scan-to-book navigation, optional location ranking, active-session controls, camera-assisted plate review and priority-ranked violations. The checked pages showed no horizontal overflow. These results demonstrate internal correctness and usability of selected critical flows; they do not replace field trials, load testing or security assessment.

## 4.7 Results and Discussion

The implementation satisfies the project aim within its stated scope. A complete payment-to-enforcement lifecycle can be demonstrated using two phones and printed signage. Signed zone codes reduce the effort of finding the correct location, while ticket QR codes provide a separate proof of paid booking. Server-side price, wallet and state rules reduce dependence on client trust. Confidence labels and human plate confirmation make uncertainty visible instead of hiding it.

The project also confirms the trade-off of a no-IoT design. Software records can provide useful availability guidance, but they cannot prove that every physically parked vehicle is represented. Browser notifications may fail after the application closes, and the recognition provider is not production OCR. These limitations are acceptable for an academic MVP because they are isolated behind interfaces and clearly communicated to users.

## 4.8 Deployment Considerations

Production deployment requires Supabase persistence and authentication, the supplied regulated payment provider, secure environment variables, verified webhooks, rate limiting, monitoring and backups. Real plate recognition should be evaluated for accuracy, bias and privacy and should retain the confirmation step. Dependable background reminders would require a push-notification service. Field testing should include damaged QR signs, weak networks, low-light plate capture and dispute-resolution procedures.

## 4.9 Chapter Summary

SmartPark implements the principal driver, warden and administrator workflows and passes the current automated and browser checks. Its modular design supports production replacement of the demonstration services without changing the central booking lifecycle.

# CHAPTER FIVE
# SUMMARY, CONCLUSIONS AND RECOMMENDATIONS

## 5.1 Summary

This project developed a simplified smart parking management system for city-centre fee collection. The study identified weaknesses in manual payment and verification, reviewed mobile parking patterns and designed a phone-first alternative. The resulting Progressive Web Application combines signed zone identification, map selection, booking, mock wallet payment, ticket QR validation, session timing and extension, availability confidence, plate verification and prioritised violation handling.

The work used iterative prototyping and a layered architecture. Verification included static analysis, nine automated domain tests, a production build and selected mobile-browser journeys. The results show that the main parking lifecycle can be demonstrated without sensors, barriers or fixed cameras.

## 5.2 Conclusions

SmartPark meets its academic objective as a functional and testable MVP. Its strongest contribution is the combination of payment and enforcement evidence in a single workflow while keeping server state authoritative. The distinction between zone QR and ticket QR improves conceptual and security clarity. Availability-confidence labels and mandatory plate confirmation provide a more responsible design than presenting estimates or recognition output as unquestionable fact.

The system is not ready for real-money municipal operation because payment, persistence and OCR remain demonstrations and field performance has not been measured. Nevertheless, these boundaries are explicit, and the modular architecture provides a credible path to production integration.

## 5.3 Recommendations

1. integrate the supplied payment provider with signed, idempotent webhook processing;
2. replace the in-memory store with Supabase and enforce row-level security, constraints, backups and audit retention;
3. conduct usability and field trials with drivers and wardens in real parking zones;
4. adopt production push notifications only after consent and delivery requirements are defined;
5. evaluate any plate-recognition service for Ghanaian plate formats, low-light conditions, bias and privacy; and
6. develop operating procedures for disputes, refunds, damaged signage and offline verification.

## 5.4 Future Work

Future work may add operator-configured maximum stays, receipts, reconciliation reports, multilingual support, offline-safe warden checks and aggregated occupancy trends. A native mobile wrapper may be introduced if dependable background notifications or deeper camera integration become necessary. IoT sensors may be evaluated later as an optional data source, but they are not required for the core SmartPark model.

# REFERENCES

Data Protection Commission Ghana. (n.d.). *Documents and Data Protection Act resources*. https://dataprotection.org.gh/documents/

MapLibre. (n.d.). *MapLibre GL JS documentation*. https://maplibre.org/maplibre-gl-js/docs/

Open Mobility Foundation. (n.d.). *About the Curb Data Specification*. https://www.openmobilityfoundation.org/about-cds/

PayByPhone. (n.d.). *Keeping track of my parking session*. https://support.paybyphone.com/hc/en-001/articles/12430829635473-Keeping-track-of-my-parking-session

SpotHero. (2025, April 21). *Scan2Pay: Sell secure on-site parking reservations*. https://operator-help.spothero.com/en/articles/9346439-scan2pay-sell-secure-on-site-parking-reservations

United States Department of Transportation, Intelligent Transportation Systems Joint Program Office. (2016). *San Francisco parking meter payment data models accurately predict 70 percent of on-street parking occupancy*. https://www.itskrs.its.dot.gov/2016-b01101

Bank of Ghana. (n.d.). *Licence categories for payment service providers*. https://www.bog.gov.gh/fintech-innovation/licence-categories/

Kwame Nkrumah University of Science and Technology, School of Graduate Studies. (2021). *Guide for preparation and evaluation of higher degree research thesis*. https://sgs.knust.edu.gh/sites/sgs.knust.edu.gh/files/2021-02/GUIDE%20FOR%20PREPARATION%20AND%20EVALUATION%20OF%20GRADUATE%20THESIS.pdf

# APPENDIX A
# DEMONSTRATION AND REPRODUCTION DETAILS

## A.1 Demonstration Accounts

| Role | Email | Password |
| --- | --- | --- |
| Driver | driver@smartpark.test | password123 |
| Driver with active session | kofi@smartpark.test | password123 |
| Warden | warden@smartpark.test | password123 |
| Administrator | admin@smartpark.test | password123 |

## A.2 Local Execution

From the SmartPark project folder, set `COREPACK_HOME` to `.corepack`, set `CI` to `true`, and run `corepack pnpm dev -H 127.0.0.1`. Open `http://127.0.0.1:3000`, or the alternate port reported by Next.js if port 3000 is already occupied.
