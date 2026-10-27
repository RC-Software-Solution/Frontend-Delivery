# Driver delivery flow — design

Date: 2026-10-27 · Owner decisions recorded 2026-10-27 · Status: approved for planning

Source of requirements: `../Backend/Meal Order and Delivery Platform.md`, section "2. Delivery Person User Stories" (14 stories). The gap audit that produced this design is summarised in `docs/superpowers/START-HERE.md`.

## Goal

A delivery person can run a whole meal session from the app: see every order in the areas they hold, start delivery once ordering has closed, mark each order Delivered or Failed, record Paid or Unpaid, search orders, and watch live server-side counts of parcels, orders and money. Doing so also makes the other apps correct: Admin revenue counts driver collections, and customers receive "on the way" and "delivered" pushes.

## Owner decisions (binding)

1. **Status flow — bulk start, then per-order outcome.** After a session's ordering window closes, the driver taps **Start delivery** once per area. Every order of that area and session that is `pending` or `preparing` moves to `delivering` (one "Your order is on the way" push each). The driver then marks each `delivering` order **Delivered** or **Failed** (failure needs a reason). Start delivery is refused while ordering is still open, so it never collides with customer edit or cancel.
2. **Data-model work is deferred** to a separate later plan: hostel, boarding-place and room location, user codes, and `delivered_by` on orders. Search therefore uses order ID, customer name, phone, address and food name.
3. **The delivery app gets jest** (jest-expo + @testing-library/react-native), with the same versions and config as Frontend-Customer.
4. **Branches:** a new local branch `feat/driver-delivery-flow` in Backend (from `main`, leaving the owner's staged `.gitignore` and `scripts/sql/2026-09-27-seed-test-data.sql` untouched) and in Frontend-Delivery. Never push, never open a PR.

## Requirement mapping

| # | Story | Delivered by |
|---|---|---|
| 1 | Sign in | Already done; session restore added (app plan, Task 7) |
| 2 | View all orders | Session-scoped list with no 10-order cap (Backend B4, app Task 4) |
| 3 | Choose area | Already done; the chosen session now travels with the area (app Task 3) |
| 4 | Order details | Card shows items, parcel count, total, phone and address (app Task 4). Hostel and room are deferred (decision 2) |
| 5 | Search by order code / user code | Order ID, name, phone, address and food; user code deferred (app Task 4) |
| 6 | Mark Delivered | Delivered / Failed actions (app Task 5) on Backend B3 + the existing status endpoint |
| 7 | Updated counts after delivering | Server summary bar (Backend B2, app Task 4/5) |
| 8 | Unpaid without Delivered | Kept: Unpaid action on any order whose payment is still pending (app Task 4) |
| 9 | Unpaid list | All unpaid orders in the area, any status, any day (Backend B4, app Task 6) |
| 10 | Search unpaid | Order ID, name, phone, address (app Task 6); hostel names deferred |
| 11 | Mark Paid | Kept (app Task 6) |
| 12 | Daily unpaid list with order numbers and amounts | Pending Payments grouped by day with count and amount per day (app Task 6) |
| 13 | To-deliver parcel and order counts | Server summary (Backend B2, app Task 4) |
| 14 | Counts move as orders are delivered | Summary refetched after every action (app Task 5) |

## Backend contract (new and changed)

All amounts are numbers rounded to 2 decimals. Dates are `YYYY-MM-DD` in Sri Lanka time (`colomboToday()`).

### Driver area guard (order-service)

A `delivery_person` may read or act on an area only if they hold it in one of **today's** meal sessions (`session_delivery_assignments` joined to `meal_sessions`, both in the shared database). Otherwise the server answers `403 { message: 'You do not cover this area today' }`. Admins and super admins are not restricted. The guard applies to `GET /api/orders` and to both new endpoints.

### `GET /api/orders/driver-summary` (order-service) → `GET /api/delivery/summary` (delivery-service)

Query: `area_id` (required), `meal_time` (required: breakfast | lunch | dinner), `target_date` (admins only; drivers always get today's session they hold).

200:
```json
{
  "message": "Driver summary retrieved successfully",
  "area_id": 3, "meal_time": "lunch", "target_date": "2026-10-27",
  "summary": {
    "to_deliver": { "orders": 4, "parcels": 6 },
    "delivered": { "orders": 2, "parcels": 3 },
    "failed": { "orders": 1 },
    "collected": { "orders": 2, "amount": 900 },
    "unpaid": { "orders": 1, "amount": 450, "list": [{ "order_id": "ORD-1-a", "total_price": 450 }] }
  }
}
```
Counting rules: cancelled orders are ignored entirely. `to_deliver` = status pending, preparing or delivering. `delivered` = delivered or completed. `failed` = delivery_failed. `collected` = payment_status paid. `unpaid` = payment_status unpaid. Parcels = the sum of order item quantities.

Errors: 400 for a missing or invalid area_id or meal_time; 403 when the driver doesn't hold that session; 404 when an admin names a date and meal time with no session.

### `POST /api/orders/start-delivery` (order-service) → `POST /api/delivery/orders/start-delivery` (delivery-service)

Body: `{ area_id, meal_time, target_date? }` (target_date: admins only).

- 409 `{ message: 'Ordering is still open for this session. Start delivery after it closes.' }` unless the session's state is `closed`.
- Otherwise moves every order with that area, meal_time and target_date (the session date) whose status is `pending` or `preparing` to `delivering`. Each update is conditional on the status that was read, so an order changed meanwhile (for example cancelled by an admin) is skipped. Each moved order's customer gets the existing `delivering` push.
- 200 `{ message: '<n> orders are on the way', moved: n, order_ids: [...] }`.
- Audited as `order.start_delivery` with `area_id`, `meal_time` and `target_date` from the body.

### `GET /api/delivery/orders/area` (delivery-service, changed)

Query: `area_id` (required), `meal_time`, `target_date` (`date` stays accepted as an alias), `payment_status` (pending | paid | unpaid | **any**, default pending), `type` (current | **all**, default current), `limit` (default 500, max 500). These are passed through to order-service, which already filters on `target_date` and `meal_time`. Errors from order-service (403 and others) are forwarded with their status and body.

### delivery-service hygiene

`orderServiceClient` no longer stores an auth header on the shared singleton. Every call receives the caller's `Authorization` header as an argument (this fixes the cross-request token leak listed in Backend's BACKLOG).

## App behaviour

### Session context

The area-selection screen already loads today's sessions. Choosing an area in a session now passes and persists `{ areaId, area, sessionId, mealTime, date }` (`rc_selected_area`). Home and Pending Payments read it from route params, falling back to storage.

### Home ("Active Orders")

- The header shows the area name and the session's meal time and state.
- The summary bar comes from `GET /delivery/summary` and shows: To deliver (orders · parcels), Delivered (orders · parcels), Collected (Rs), Unpaid (orders · Rs). It replaces the AsyncStorage paid summary.
- The list is `GET /delivery/orders/area` with `type=all`, `payment_status=any`, the session's `meal_time` and `target_date`. Filter chips: **To deliver** (default), **Delivered**, **Failed**, **All**. Cancelled orders are never shown.
- **Start delivery** appears while any order in the list is `pending` or `preparing`. It is enabled only when the session state is `closed`; otherwise its caption reads "Available after ordering closes". It asks for confirmation, then calls start-delivery.
- Search matches order ID, customer name, phone, address and food name, case-insensitively.
- The order card shows the order ID, a status badge, the customer name, phone, address, items (`name × qty`), the parcel count and the total.
- Actions per order:
  - **Delivered** and **Failed** when the status is `delivering`.
  - **Paid** and **Unpaid** when payment is `pending`.
  - **Paid** when payment is `unpaid`.
- Failed opens a reason input (required, 500 characters at most). After Delivered on an order whose payment is still `pending`, the app asks "Was it paid?" with **Paid** and **Not paid**.
- After every successful action the list and the summary are refetched. Errors from the server are shown in an alert using the server's message.

Status labels: pending and preparing show "Waiting"; delivering "On the way"; delivered and completed "Delivered"; delivery_failed "Failed".

### Pending Payments

- The list is `GET /delivery/orders/area` with `type=all`, `payment_status=unpaid` and no date: every unpaid order in the area.
- Orders are grouped by `target_date`, newest first. Each group header shows the date ("Today" for today), the number of orders and the amount.
- A card shows the order ID, customer name, phone, address, meal, status label and amount, with a **Paid** action.
- Search covers order ID, customer name, phone and address. The footer shows "Outstanding: N orders · Rs X". The AsyncStorage "Collected Total" is removed.

### Session restore

- The app's entry screen checks `authService.isAuthenticated()`. If the user is signed in it goes to area selection; otherwise it goes to login.
- The dead `isLoggedIn` gate in `app/_layout.tsx` is replaced by one plain `Stack`.

## Out of scope (deferred)

- The hostel, boarding-place and room location model, and user codes. This blocks hostel-name search and precise locations.
- `delivered_by` on orders and per-driver performance metrics in Admin.
- Live GPS tracking.
- Offline queueing of actions.
- Fixing `GET /api/users/:userId` being unauthenticated (a Backend BACKLOG item outside this flow).
