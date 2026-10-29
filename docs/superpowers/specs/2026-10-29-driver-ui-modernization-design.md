# RC Delivery App UI Modernization — Design

**Date:** 2026-10-29 · **Branch:** `feat/driver-ui-modernization` (local, cut from `feat/driver-delivery-flow` at `e0b853a`) · **Status:** direction approved by the product owner on 2026-10-29 (approach 1); proposed defaults in §6 are confirmed at the gates.

## 1. Goal

Make the delivery app work for people who deliver by **motorcycle or tuk-tuk**. The phone has two jobs, and the app is designed around both:

- **Riding (phone on the handlebar or dashboard).** The driver glances at it to see which area to ride to and how much is left there. Large type, high contrast for sunlight, almost no tapping.
- **At the stop (phone in the hand).** The driver finds the right order fast, hands it over, and records Delivered, Failed, Paid or Not paid with one hand, with protection against a mistaken tap and against a weak signal.

The app keeps the RC identity shared with the customer app and Admin (green brand, status colours, sentence-case labels). English and Sinhala are both supported. It must stay fast on low-end Android phones.

The process mirrors the customer app's modernization (`../Frontend-Customer/docs/superpowers/specs/2026-10-26-mobile-ui-modernization-design.md`): audit every screen and popup on the phone, draw mockups and get them approved, then apply the new UI phase by phase, with a gate after each phase.

## 2. Who uses it, and how (owner answers, 2026-10-29)

| # | Question | Answer (binding) |
|---|---|---|
| C1 | Where is the phone while riding? | Both: mounted on the handlebar or dashboard while riding to areas; in the hand when marking an order. Design for both. |
| C2 | What does the mounted screen show? | The area first, stops later: every area the driver holds for this meal, with the orders and parcels still to deliver. The stops are opened once the driver has stopped. |
| C3 | What is a drop-off like? | Both kinds: hostel handover points (several customers collect at once) and door to door (houses, boarding places). |
| C4 | How is the right order found at a handover? | The customer says their name. The name is shown large. When two orders in the list share a name, the last four digits of the phone are shown to tell them apart. A Call button for door-to-door stops. No PIN. |
| C5 | Who labels the parcels? | Nobody today. The kitchen will label every parcel with the customer name and a short order reference before handover (client process, see `docs/client-notes/2026-10-29-kitchen-parcel-labels.md`). |
| C6 | Language | English and Sinhala; the driver chooses in a setting. |
| C7 | Handover style | Both styles exist and the driver switches in settings. **Default: two steps** (Delivered, then "Was it paid?"). The other style is one choice (**Delivered, paid** / **Delivered, not paid**) with an Undo window before anything is sent. |
| C8 | Failed | Always asks for a reason first, in both styles. Nothing is sent until the reason is submitted. |
| C9 | Weak or no signal | Save the action on the phone and send it when the signal returns. |
| C10 | Shape of the app | Approach 1: the areas overview is the home screen. |
| C11 | Visual reference | Reuse the styles of the customer app and Admin. |

## 3. Non-goals

- Backend changes. Every behaviour below works on today's endpoints (§8).
- Hostel, boarding-place and room data, user codes, `delivered_by` (still deferred from the driver-flow spec).
- Maps, directions or GPS tracking.
- A PIN at handover (C4). Revisit only if customers start disputing deliveries.
- Dark mode. The app is locked to light mode; a night theme can come later.
- Tamil. The string system supports a third language later, but none is shipped.
- iOS sign-off. Only an Android phone is available; iOS gets a checklist.

## 4. Hard constraints

| Rule | Why |
|---|---|
| Every text colour pair ≥ **7:1** (WCAG AAA), except placeholder text ≥ 4.5:1; enforced by a jest test | Riders read the screen in direct sunlight |
| Body text ≥ 18, the area counts ≥ 40, names on stop cards ≥ 22 | Readable at arm's length on a handlebar mount |
| Every tappable control ≥ **56 dp** high; handover buttons ≥ **64 dp**; at least 16 dp between the two handover buttons | Gloves, vibration, one thumb |
| Layouts still work at the phone's font scale **1.3** | Drivers enlarge text |
| No new dependency except `expo-keep-awake` (already installed with Expo, added to `package.json` pinned) | Keep the app light |
| Animate only `opacity` and `transform` with Reanimated; no blur | Budget GPUs |
| Lists are `FlatList`/`SectionList` with `keyExtractor`; row shadows `elevation ≤ 2` | Scroll smoothness |
| Every loading, empty, error, offline and "waiting to send" state is designed | Unstable connections are normal |
| No user-visible string is written in a screen; every string comes from the English and Sinhala dictionaries, which must have the same keys | Both languages stay complete |
| No hard-coded colour or font size in `screens/` or `components/` (grep check) | One theme |
| Sentence case everywhere; no all-caps button labels | Admin and customer app rule; easier to read |

## 5. What exists today (code audit, 2026-10-29; the device audit in Phase 0 confirms or corrects it)

Screens: Login, Area selection, Home ("Active Orders"), Pending Payments, plus a two-tab bar. Popups: the generic confirm popup (`components/popupmodel`, used for Start delivery, Mark as Delivered, Mark as Paid/Unpaid, "Was it paid?"), the Failed reason popup, and native alerts (login success, access denied, errors, "Delivery started").

| Finding | Where |
|---|---|
| Customer name, phone and address are 12 pt grey text | `home.screen.tsx` styles `customerNameText`, `customerInfo` |
| Action buttons are about 35 dp high, side by side, all-caps | `home.screen.tsx` `actionButton` (padding 8) |
| One delivery takes three taps: DELIVERED, a confirm popup, "Was it paid?" | `home.screen.tsx` `onAction` |
| Phone and address are plain text: no call | order card |
| The counters panel floats over the bottom of the list | `summaryContainer` `position: 'absolute', bottom: 110` |
| A failed action shows an alert and is forgotten | `act()` |
| Only one area is visible at a time; another area means going back to Area selection | navigation |
| "Release" is a small link inside the area button itself | `area-selection.screen.tsx` |
| A "Login Successful 🎉" alert must be dismissed before work starts; "Remember me" does nothing | `login.screen.tsx` |
| White on the green fill is 2.26:1 | brand `#69bf70` |
| Three font setups (Raleway, Nunito, system); screens render nothing until fonts load | login, area selection |
| Order IDs are long (`ORD-1792999353509-9f6o7l`) | backend |

Baselines (2026-10-29, `e0b853a`): jest 10 suites / 38 tests green, `npx tsc --noEmit` 0 errors, `npx expo lint` 0 errors / 19 warnings.

## 6. Design

### 6.1 Navigation

```
index ── not signed in ──> Sign in ──> Areas
      └─ signed in ─────────────────> Areas

Tabs: [ Areas ] [ Unpaid ] [ Settings ]
Areas ──tap an area──> Stops (one area, one meal) ──> handover sheets
Areas ──"Manage areas"──> Manage areas (take / release areas for a meal)
```

- **Areas** (home, mounted): replaces Area selection as the landing screen.
- **Stops**: replaces Home ("Active Orders") for one area.
- **Unpaid**: replaces Pending Payments, covering every area the driver holds today.
- **Settings**: new. Language, handover style, account and Log out.
- **Manage areas**: today's Area selection behaviour (take a free area, release one of mine), reached from Areas.

### 6.2 Areas (the mounted screen)

- A meal switcher when the driver has more than one session today (Breakfast / Lunch / Dinner). The default meal is the latest session whose ordering has closed (delivery time); if none, the first open one; otherwise the first.
- One large row per area the driver holds in that meal: the area name, then **"8 orders · 12 parcels to deliver"** in the count size, then a smaller line "5 delivered · Rs 2,250 collected". An area with nothing left shows "All delivered" with a check.
- The session state in words under the meal: "Delivery time" (closed), "Ordering open" (open), "Ordering not open yet" (upcoming).
- A line "3 updates waiting to send" when the phone holds unsent actions (§6.6).
- The screen stays awake while it is open (`expo-keep-awake`).
- Pull to refresh; refetch on focus and after the phone sends waiting actions.
- Empty: not assigned to any session today → message and Refresh (today's wording). No areas held in this meal → message and "Manage areas".
- Data: `menuApi.getMyDeliverySessions()` (sessions with `mine`), then `deliveryService.getSummary({ area_id, meal_time })` for each held area in parallel. Area names from `locationService.getAreas()`.

### 6.3 Stops (one area, in the hand)

- Header: back, area name, meal. A counts strip: To deliver (orders · parcels), Delivered, Collected, Unpaid.
- **Start delivery** banner while any order is waiting; enabled only after ordering closes, with today's confirmation and server rules.
- Search by name, short reference or phone (plus today's address and food matching).
- Filter chips: To deliver (default), Delivered, Failed, All.
- Orders are grouped by address, so one hostel's orders sit together: a section header "Hostel A · 4 orders". Within a group, by name.
- **Stop card:**
  - the customer name (22, bold);
  - the short reference chip `#6O7L` (§6.8) and the status chip;
  - the last four phone digits "…4567" when another order in this area has the same name (case- and space-insensitive);
  - address, items ("Rice × 2"), parcel count, the amount large;
  - a **Call** button (56 dp, opens the dialler with `tel:`) when a phone number exists;
  - the main handover buttons (§6.5) when the order is on the way;
  - a "More" button (56 dp) for the secondary actions: Mark unpaid (story 8, before delivery), Mark paid, and the payment corrections (a paid order can be changed to not paid, an unpaid one to paid);
  - the queue state, when there is one: "Waiting to send" or "Not sent: <server message>" with Dismiss.

### 6.4 Unpaid

- Every unpaid order in every area the driver holds today (one `getUnpaidOrders(areaId)` per area, merged), grouped by day ("Today" first) with the count and amount per day.
- Search by name, reference, phone, address.
- A card shows the name, reference, area, meal, status and amount, with a **Mark paid** button (56 dp) that asks "Mark paid? Rs 450" before queueing.
- The footer shows "Outstanding: N orders · Rs X".

### 6.5 Handover

**Two steps (default):**
1. The driver taps **Delivered**.
2. A sheet shows the name, reference and amount:
   - If payment is still pending, it asks "Was it paid?" with **Paid**, **Not paid** and **Back**.
   - If payment was already settled, it shows **Delivered** and **Back**.

   Back sends nothing. Paid or Not paid queues two actions, delivered and then the payment, sent at once.

**One choice (setting):**
1. The card shows **Delivered, paid** and **Delivered, not paid**, with 16 dp between them. Delivered, not paid sits on the left, so the more common Delivered, paid is under the right thumb.
2. A tap queues the actions with a **5-second** send delay, and an Undo bar shows "Delivered to Kasun · Paid" with a countdown and an **Undo** button (64 dp). Undo removes the actions. When the time ends, they are sent.

**Failed (both styles):**
1. A sheet with preset reasons as chips (Customer not there, Phone not answered, Wrong address, Refused the order) and a text box.
2. Mark failed stays disabled until a reason is present; at most 500 characters. Preset reasons are sent in English so the customer push stays in the customer app's language; typed text is sent as typed.

**Feedback.** A light haptic (`expo-haptics`, already installed) when an action is queued. A card that has been handed over moves out of "To deliver" at once, labelled "Waiting to send" until the server accepts it.

**Mistakes.**
- Payment can be corrected afterwards from More (the server allows any payment change).
- Delivered and Failed cannot be undone once the server has accepted them (`order-service/src/utils/orderStatus.js`: `delivering` → `delivered` | `delivery_failed` only, and the customer is notified). The two-step sheet and the Undo window are the protection.

### 6.6 Waiting actions (offline queue)

- Every write from the driver (Delivered, Failed, Paid, Not paid) goes through one queue stored on the phone (AsyncStorage `rc_action_queue`). Start delivery and Manage areas stay direct: they need the server's answer (409 when ordering is open, area already taken).
- Each item is `{ id, orderId, action, sendAfter, createdAt, state: 'waiting' | 'refused', error? }`, sent in `createdAt` order, one at a time. A send runs:
  - on queueing;
  - when the app returns to the foreground;
  - every 15 s while items are waiting;
  - when Areas or Stops is focused.
- Results:
  - **Success** removes the item.
  - **No response** (status 0, `NETWORK_ERROR`) stops the run and keeps everything.
  - **5xx** keeps the item for the next run.
  - **409 where the server says the order is already in the target status** (`details.from` is the target, or `completed` for delivered) removes the item, because a lost response had already been applied.
  - **Any other 4xx** marks the item **refused** with the server's message, and the card shows it until dismissed.
- Counts stay the server's numbers. The waiting count is shown beside them ("3 updates waiting to send"), not mixed into them.
- **Log out is blocked while actions are waiting**: "3 updates are not sent yet. Connect to the internet to send them before logging out." Refused items do not block it.

### 6.7 Language

- A small string layer, `i18n/`, with English and Sinhala dictionaries (`en.ts`, `si.ts`) that must have exactly the same keys (jest test), plus a `useT()` hook; no new dependency. It uses simple `{name}` placeholders.
- The language is stored on the phone (`rc_settings`), applies at once, and is also offered on Sign in (EN | සිං), so a driver can switch before logging in.
- Server messages (errors, refusals) arrive in English and are shown as-is under a translated heading.
- Sinhala copy is drafted in the plan and **must be reviewed by a native speaker chosen by the client before release** (client note).

### 6.8 Short order reference

- `shortRef(orderId)` = the last four letters or digits of the order ID, upper-case, with `#` in front: `ORD-1792999353509-9f6o7l` → `#6O7L`.
- Shown on every card and searchable. The kitchen label must print the same text, so **Admin must show the same reference** on the kitchen's order list. That change is in the Admin repo, outside this plan, and is a follow-up (client note).

### 6.9 Visual language

- **From the customer app:**
  - the brand green `#69bf70` as a fill only, with dark labels (8.73:1);
  - the token file shape (`theme/index.ts`) and the contrast test;
  - `AppText`, `AppButton` (pill), `Card`, `StatusChip`, `EmptyState`, `ErrorState`.
- **From Admin:**
  - the page ground Paper `#F3F5F0`;
  - amber ("Turmeric") for "needs a human" (waiting, unpaid);
  - red-brown ("Brick") for failed;
  - sentence-case labels;
  - one main action per card, with the rest under More;
  - tabular figures for amounts.
- **For riders:** larger type, 7:1 contrast, 56/64 dp targets, the system font.

Tokens (all text pairs measured on 2026-10-29):

| Token | Hex | Pair and ratio |
|---|---|---|
| `ink` | `#0A0A0F` | on surface 19.75, on bg 17.99 |
| `muted` | `#4A4A4A` | on surface 8.86, on bg 8.07, on field 7.64 |
| `subtle` (placeholders only) | `#5A5A5A` | on field 5.94 |
| `brand` (fill only) | `#69bf70` | `onBrand` `#0A0A0F` on it 8.73; as text it fails (2.26) |
| `brandStrong` (green text) | `#1B5E20` | on surface 7.87, on bg 7.17, on `brandSoft` `#EEF7EF` 7.19 |
| `danger` | `#A12622` | on surface 7.46, white on it 7.46 |
| `attention` (amber fill) | `#E0A100` | `attentionInk` `#3D2B00` on it 6.00, so it is used for icons and bars, never body text |
| `attentionSoft` | `#FFF3D6` | `#6B4500` on it 7.69 (waiting / unpaid chips) |
| `bg` / `surface` / `field` / `border` | `#F3F5F0` / `#FFFFFF` / `#ECEFEA` / `#8A968C` | border on surface 3.08 (non-text ≥ 3) |

Status chips (all ≥ 7):

| Status | Text on fill | Ratio |
|---|---|---|
| Waiting | `#6B4500` on `#FFF3D6` | 7.69 |
| On the way | `#4A2390` on `#EFE7FB` | 9.04 |
| Delivered / Paid | `#14501A` on `#E4F4E6` | 8.39 |
| Failed | `#8E1F1B` on `#FDE8E7` | 7.57 |
| Cancelled | `#3D3D3D` on `#EEEEEE` | 9.36 |
| Unpaid | `#6B4500` on `#FFF3D6` | 7.69 |

Type scale: `micro` 14, `caption` 16, `body` 18, `title` 22, `h1` 28, `count` 40. Spacing 4 / 8 / 16 / 24 / 32. Radii 8 / 12 / 20 / pill.

### 6.10 Decisions proposed with defaults (confirm at the gates)

| # | Decision | Default | Alternative |
|---|---|---|---|
| P1 | Font | The system font for both languages (Android ships a Sinhala font; no loading, no new dependency); Raleway and Nunito are removed | Nunito for English plus Noto Sans Sinhala (one new font package) |
| P2 | Short reference | Last 4 characters of the order ID (§6.8) | A server-side sequence number (Backend change) |
| P3 | Keep the screen awake | On Areas and Stops while open | Never |
| P4 | Undo window | 5 seconds | 3 or 8 seconds |
| P5 | Preset failure reasons | The four in §6.5, sent in English | Free text only |
| P6 | Login extras | Remove the success alert and the dead "Remember me"; add the language switch | Keep as today |
| P7 | Log out with waiting actions | Blocked with a message | Allow with a warning, discarding them |

## 7. Phases and gates

| Phase | What | Gate (stop for the owner) |
|---|---|---|
| 0 Audit | Every screen, popup and state captured on the phone; contrast, sizes, touch targets, literals, asset weight, frame times measured | Audit report read |
| 1 Mockups | HTML boards in the repo (English, plus Sinhala for Areas, Stops and the handover sheets), rendered to PNG | **Mockups approved**; P1 to P7 confirmed |
| 2 Foundation | Tokens, UI kit, settings, language layer, short reference, stop helpers, action queue | jest / tsc / lint green; no visual claim |
| 3 Screens | Navigation, Areas, Stops, handover, Unpaid, Settings, Sign in, Manage areas | Phone screenshots beside the boards, English and Sinhala; differences listed with their owning task |
| 4 Wrap-up | Literal grep, dead code, device checklist, client note, final review | Owner decides merge / push |

A gate page never claims the build matches the mockups. It lists every remaining difference and the task that owns it.

## 8. Backend contract used (no changes)

- `GET /meal-sessions/delivery/mine`: today's sessions with `state`, `mine` and `taken`.
- `PUT /meal-sessions/:id/delivery/me`: take or release areas.
- `GET /delivery/orders/area`: orders of an area (session-scoped, or unpaid across days).
- `GET /delivery/summary`: per-area counts.
- `POST /delivery/orders/start-delivery`: start delivery for an area.
- `PUT /delivery/orders/:id/status`: `delivered` or `delivery_failed`, with a reason for failed. 409 with `from`, `to` and `allowed` on an illegal transition.
- `PUT /delivery/orders/:id/payment`: `paid` or `unpaid`, in any direction.

## 9. Success criteria

1. Every requirement in §2 and §6 is visible in the app and covered by a test or a device check.
2. The contrast test passes for every token pair in §6.9.
3. The grep for hard-coded colours, font sizes and string literals in `screens/` and `components/` prints nothing.
4. `npx jest` grows from 38 tests and stays green; `npx tsc --noEmit` 0 errors; `npx expo lint` 0 errors and no more than 19 warnings.
5. Janky-frame percentage on Areas and Stops no worse than the Phase 0 baseline on the phone.
6. With Wi-Fi off, a handover is accepted on the phone, survives an app restart, and is sent once Wi-Fi returns (device check).
7. Every string appears in Sinhala when Sinhala is chosen (device check of every screen).
