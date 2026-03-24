# Plan: Ticketing Management Module

Implementation of a complete ticketing system for regular intercity/suburban lines, including seat mapping, real-time reservation, and QR code ticketing.

## User Review Required

> [!IMPORTANT]
> This module introduces **Redis** as a hard dependency for real-time seat locks. Ensure the local/production environments have Redis available.

> [!NOTE]
> We will use "Seat Templates" to allow reuse of layouts (Convencional 46, DD 60, etc.) across different vehicles.

## Proposed Changes

### [Backend - Database & Models]
Design the core tables for seat templates, travel sessions, and individual tickets.

#### [NEW] [SeatTemplate.java](file:///c:/dev/fleetmanager/backend/src/main/java/com/z7design/fleet_manager/model/SeatTemplate.java)
- Define seat layout (grid, rows, columns, poltrona number).
#### [NEW] [Ticket.java](file:///c:/dev/fleetmanager/backend/src/main/java/com/z7design/fleet_manager/model/Ticket.java)
- Individual ticket data, passenger info, seat number, price, status (RESERVED, PAID, CANCELLED).
#### [MODIFY] [V453__create_ticketing_tables.sql](file:///c:/dev/fleetmanager/backend/src/main/resources/db/migration/V453__create_ticketing_tables.sql)
- SQL migration for new tables.

### [Backend - Real-time & Services]
Implement the logic for seat locking and PDF generation.

#### [NEW] [SeatReservationService.java](file:///c:/dev/fleetmanager/backend/src/main/java/com/z7design/fleet_manager/service/SeatReservationService.java)
- Integration with **Redis** to lock seats for 10 minutes.
#### [NEW] [TicketingController.java](file:///c:/dev/fleetmanager/backend/src/main/java/com/z7design/fleet_manager/controller/TicketingController.java)
- Endpoints for searching trips, selecting seats, and confirming purchases.

### [Frontend - Admin & Customer]
UI for seat configuration and ticket purchase.

#### [NEW] [SeatMapEditor.tsx](file:///c:/dev/fleetmanager/frontend/src/pages/admin/SeatMapEditor.tsx)
- Drag-and-drop editor for seat templates using `@dnd-kit/core`.
#### [NEW] [TripBooking.tsx](file:///c:/dev/fleetmanager/frontend/src/pages/customer/TripBooking.tsx)
- The storefront for customers to pick trips and seats.

---

## Verification Plan

### Automated Tests
- **Unit Tests**: Test Redis lock expiration logic.
- **Integration Tests**: Verify ticket generation sequence and concurrency handling (two people picking the same seat).

### Manual Verification
1.  **Template Creation**: Create a "DD - Double Decker" template and save.
2.  **Booking Flow**: Search for a trip, select a seat, verify the 10-minute lock message, and complete the "purchase".
3.  **PDF Check**: Open the generated ticket and check if the QR Code is readable.
