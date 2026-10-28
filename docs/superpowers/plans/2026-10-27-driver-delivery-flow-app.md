# Driver delivery flow — Delivery App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The driver app runs a whole meal session against the server: a session-scoped order list, Start delivery, Delivered / Failed, Paid / Unpaid, search, live server counters, an unpaid list grouped by day, and session restore on launch.

**Architecture:**
- Pure, tested helpers hold all the decisions: which actions an order offers, filtering, search, grouping, and normalising the server payload. They live in `services/delivery/orderView.ts` and `services/delivery/normalizeOrder.ts`.
- `services/delivery/selection.ts` owns the persisted area-and-session choice.
- The screens are thin: load, render, and send every write through one `act()` that refreshes afterwards.
- No client-side caching of orders, and no AsyncStorage counters: the server is the only source of counts.

**Tech Stack:** Expo SDK 58, expo-router, React Native 0.88, React 19.3, TypeScript (strict), axios via `BaseApiClient`, jest-expo + @testing-library/react-native (added in Task 1).

**Spec:** `docs/superpowers/specs/2026-10-27-driver-delivery-flow-design.md`. The "App behaviour" section is binding; its "Backend contract" section defines the endpoints used here.

**Depends on:** the Backend plan `docs/superpowers/plans/2026-10-27-driver-delivery-flow-backend.md` (Tasks B1–B4). The app's jest tests mock the services, so Tasks 1–7 can run before the Backend is done. Only the device check in Task 8 needs it.

## Global Constraints

- Repo: `C:\Users\budglk\RC\Frontend-Delivery`, branch `feat/driver-delivery-flow` (created from `main` in Task 0). Never push, never open a PR, never merge.
- Do NOT run Prettier or any formatter. Don't reformat or whitespace-trim lines you don't change. Files are stored as LF and checked out as CRLF by `core.autocrlf`; keep that (don't convert endings).
- New dependencies: ONLY the Task 1 dev dependencies, at exactly the versions listed there. Nothing else.
- TDD: write the test, run it and show the red output, implement, then run it and show it green. Existing behaviour that a task doesn't name stays unchanged.
- Never dispatch subagents. Commit style: `feat(scope): ...`, `fix(scope): ...`, `test(scope): ...`, `chore(test): ...`, `docs: ...`.
- Copy and labels are exactly as written in the spec and this plan:
  - Status labels: Waiting, On the way, Delivered, Failed.
  - Filter chips: To deliver, Delivered, Failed, All.
  - Action buttons: DELIVERED, FAILED, PAID, UNPAID.
  - Messages: "Available after ordering closes", "Was it paid?".
- Brand green stays `#69bf70`. Keep the existing visual style (white cards with shadow, `RC FoodService` header) and the summary box fixed above the tab bar (`bottom: 110`).
- Never touch a phone or device in Tasks 1–7. In Task 8:
  - Never cancel or edit orders, never change passwords, and never edit the database.
  - Never start or stop Docker containers.
  - Never change phone settings (font size, display density: never run `wm density`).
- Gates at the end of every task:
  - `npx jest`: all green.
  - `npx tsc --noEmit`: 0 errors (baseline on 2026-10-27: clean).
  - `npx expo lint`: 0 errors (baseline: 0 errors, 23 warnings; don't add warnings in files you touch).

## File map

| File | Responsibility |
|---|---|
| `package.json`, `jest.setup.ts` (new) | Test runner (Task 1) |
| `services/types/api.types.ts` | Order and summary types matching the Backend contract (Task 2) |
| `services/delivery/normalizeOrder.ts` (new) | Server order to `DeliveryOrder` (Task 2) |
| `services/delivery/orderView.ts` (new) | Actions, labels, filters, search, grouping, money format (Task 2) |
| `services/clients/delivery-api.client.ts` | HTTP calls (Task 2) |
| `services/delivery/delivery.service.ts` | App-facing operations, error wrapping (Task 2) |
| `services/delivery/selection.ts` (new) | Persisted area + session choice; storage cleanup (Task 3) |
| `screens/area-selection/area-selection.screen.tsx` | Saves the session with the area (Task 3) |
| `components/popupmodel/popupModel.tsx` | Optional `onRequestClose` (Task 4) |
| `components/failReasonModal/failReasonModal.tsx` (new) | Required reason input (Task 4) |
| `screens/home/home.screen.tsx` | Active Orders (Task 4) |
| `screens/pendingPayments/pendingPayments.screen.tsx` | Unpaid list grouped by day (Task 5) |
| `screens/auth/login/login.screen.tsx`, `app/index.tsx`, `app/_layout.tsx` | Storage cleanup, session restore, plain Stack (Task 6) |
| `OVERVIEW.md`, `docs/DEVICE-CHECKLIST.md` (new) | Orientation and manual test list (Task 7) |

---

### Task 0: Branch setup (controller only)

- [ ] `git -C C:\Users\budglk\RC\Frontend-Delivery status --short --branch`. Expect `## main...origin/main` plus the untracked `docs/superpowers/` (these planning docs). Anything else: stop and ask.
- [ ] `git switch -c feat/driver-delivery-flow`.
- [ ] Commit the planning docs as the first commit: `git add docs/superpowers && git commit -m "docs: driver delivery flow spec, plans and start-here"`.
- [ ] Add `.superpowers/` to `.git/info/exclude` (the SDD workspace is scratch and stays out of git).

---

### Task 1: Test runner

**Files:**
- Modify: `package.json` (devDependencies, `test` script, `jest` block)
- Create: `jest.setup.ts`
- Test: `components/__tests__/popupModel.test.tsx`

**Interfaces:**
- Produces: `npx jest` runs `**/*.test.ts(x)`; `@/` resolves to the repo root; AsyncStorage, safe-area, gesture-handler, reanimated, worklets and the Google fonts are mocked.

- [ ] **Step 1: Install exactly these versions** (they match Frontend-Customer):

```bash
npm install --save-dev jest@~30.5.2 jest-expo@~58.0.12 @testing-library/react-native@^14.1.0 @types/jest@^30.0.0 test-renderer@^1.3.0 @react-native/jest-preset@^0.88.0
```

If npm needs a version that isn't in the cache and the download is blocked, stop and report BLOCKED. Never use `npx --yes`.

- [ ] **Step 2:** In `package.json`, add `"test": "jest"` to `scripts` and add this top-level block:

```json
  "jest": {
    "preset": "jest-expo",
    "resolver": "react-native-reanimated/jest/resolver",
    "setupFiles": ["<rootDir>/jest.setup.ts"],
    "moduleNameMapper": { "^@/(.*)$": "<rootDir>/$1" },
    "testPathIgnorePatterns": ["/node_modules/", "/android/", "/dist/", "/graphify-out/"],
    "testMatch": ["**/*.test.ts", "**/*.test.tsx"],
    "testTimeout": 20000
  },
```

- [ ] **Step 3: Create** `jest.setup.ts`

```ts
// Native modules don't exist under Jest: replace them with the libraries' own fakes.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// RN 0.88 serves `AssetRegistry` from a private module that jest-expo's stub does not cover.
jest.mock('react-native/src/private/assets/AssetRegistry', () => ({ AssetRegistry: jest.requireMock('react-native/asset-registry') }));

require('react-native-gesture-handler/jestSetup');

// Google fonts need the native font loader, which never resolves under Jest: report them as loaded.
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true, null],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_700Bold: 'Nunito_700Bold',
}));
jest.mock('@expo-google-fonts/raleway', () => ({
  useFonts: () => [true, null],
  Raleway_700Bold: 'Raleway_700Bold',
}));

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
```

- [ ] **Step 4: Write the smoke test** `components/__tests__/popupModel.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import CancelModal from '../popupmodel/popupModel';

describe('CancelModal', () => {
  it('shows its texts and calls onConfirm / onClose', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    await render(<CancelModal visible title="Mark as Paid?" message="Order ID: A" confirmText="Paid" cancelText="Back" onConfirm={onConfirm} onClose={onClose} />);
    expect(screen.getByText('Mark as Paid?')).toBeTruthy();
    fireEvent.press(screen.getByText('Paid'));
    fireEvent.press(screen.getByText('Back'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 5:** Run `npx jest`: 1 suite, 1 test, passing. If the setup itself fails, fix only `jest.setup.ts` and the `jest` block, and put the error and the fix in the report. Then run `npx tsc --noEmit` and `npx expo lint`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json jest.setup.ts components/__tests__/popupModel.test.tsx
git commit -m "chore(test): add jest-expo and testing-library, matching Frontend-Customer"
```

---

### Task 2: Types, API client, service and pure helpers

**Files:**
- Modify: `services/types/api.types.ts`
- Create: `services/delivery/normalizeOrder.ts`, test `services/delivery/__tests__/normalizeOrder.test.ts`
- Create: `services/delivery/orderView.ts`, test `services/delivery/__tests__/orderView.test.ts`
- Modify (rewrite): `services/clients/delivery-api.client.ts`, `services/delivery/delivery.service.ts`
- Test: `services/delivery/__tests__/delivery.service.test.ts`

**Interfaces:**
- Produces (types): `OrderStatus`, `PaymentStatus`, `MealTime`, `DeliveryOrder` (with `status: OrderStatus`, `payment_status: PaymentStatus`, `target_date: string | null`, `failure_reason: string | null`, `customer_phone: string`), `GetAreaOrdersRequest`, `SessionScope`, `DriverSummary`, `StartDeliveryResponse`.
- Produces (helpers): `normalizeOrder(raw)`, `orderActions(o)`, `STATUS_LABEL`, `statusGroup(s)`, `parcelsOf(o)`, `matchesSearch(o, q)`, `visibleOrders(orders, filter, q)`, `needsStart(orders)`, `groupByDate(orders, today)`, `formatRs(n)`, `colomboToday(now?)`.
- Produces (service, singleton `deliveryService`): `getSessionOrders(scope & { target_date })`, `getUnpaidOrders(areaId)`, `getSummary(scope)`, `startDelivery(scope)`, `markDelivered(id)`, `markFailed(id, reason)`, `setPayment(id, 'paid' | 'unpaid')`.

- [ ] **Step 1: Types.** In `services/types/api.types.ts`:
  - Replace the `DeliveryOrder` interface and the `GetAreaOrdersRequest` interface with the block below.
  - Change `UpdatePaymentStatusRequest.payment_status` to `'paid' | 'unpaid'`.
  - Leave everything else untouched.

```ts
export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'completed' | 'cancelled' | 'delivery_failed';
export type PaymentStatus = 'pending' | 'paid' | 'unpaid' | 'ignored';
export type MealTime = 'breakfast' | 'lunch' | 'dinner';

export interface DeliveryOrder {
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  area_id: number;
  meal_time: MealTime;
  target_date: string | null;
  total_price: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  failure_reason: string | null;
  created_at: string;
  items: OrderItem[];
}

/** One area in one meal session */
export interface SessionScope {
  area_id: number;
  meal_time: MealTime;
}

export interface GetAreaOrdersRequest {
  area_id: number;
  meal_time?: MealTime;
  target_date?: string; // YYYY-MM-DD
  payment_status?: 'pending' | 'paid' | 'unpaid' | 'any';
  type?: 'current' | 'all';
}

export interface DriverSummary {
  to_deliver: { orders: number; parcels: number };
  delivered: { orders: number; parcels: number };
  failed: { orders: number };
  collected: { orders: number; amount: number };
  unpaid: { orders: number; amount: number; list: { order_id: string; total_price: number }[] };
}

export interface StartDeliveryResponse {
  message: string;
  moved: number;
  order_ids: string[];
}
```

- [ ] **Step 2: Write the failing tests.**

`services/delivery/__tests__/normalizeOrder.test.ts`:

```ts
import { normalizeOrder } from '../normalizeOrder';

describe('normalizeOrder', () => {
  it('maps the order-service payload', () => {
    const o = normalizeOrder({
      id: 'ORD-1-a', customer_id: 'c1', customer_name: 'Ann', customer_phone: '0771', customer_address: 'Block A',
      area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', total_price: '450.00', payment_status: 'pending',
      status: 'delivering', failure_reason: null, created_at: '2026-10-27T05:00:00Z',
      order_items: [{ food_name: 'Rice', quantity: 2, price: '225.00', meal_type: 'veg' }],
    });
    expect(o).toEqual({
      order_id: 'ORD-1-a', customer_id: 'c1', customer_name: 'Ann', customer_phone: '0771', customer_address: 'Block A',
      area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', total_price: 450, payment_status: 'pending',
      status: 'delivering', failure_reason: null, created_at: '2026-10-27T05:00:00Z',
      items: [{ food_name: 'Rice', quantity: 2, price: 225, meal_type: 'veg' }],
    });
  });

  it('fills safe defaults for missing fields', () => {
    const o = normalizeOrder({ id: 'X' });
    expect(o.customer_name).toBe('');
    expect(o.customer_phone).toBe('');
    expect(o.items).toEqual([]);
    expect(o.total_price).toBe(0);
    expect(o.status).toBe('pending');
    expect(o.payment_status).toBe('pending');
    expect(o.target_date).toBeNull();
  });
});
```

`services/delivery/__tests__/orderView.test.ts`:

```ts
import type { DeliveryOrder } from '../../types/api.types';
import { colomboToday, formatRs, groupByDate, matchesSearch, needsStart, orderActions, parcelsOf, STATUS_LABEL, visibleOrders } from '../orderView';

const order = (over: Partial<DeliveryOrder>): DeliveryOrder => ({
  order_id: 'A', customer_id: 'c', customer_name: 'Ann Perera', customer_phone: '0771234567', customer_address: 'Block A room 12',
  area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', total_price: 450, payment_status: 'pending', status: 'pending',
  failure_reason: null, created_at: '', items: [{ food_name: 'Chicken Rice', quantity: 2, price: 225, meal_type: 'non-veg' }],
  ...over,
});

describe('orderActions', () => {
  it('offers Delivered and Failed only while delivering', () => {
    expect(orderActions(order({ status: 'delivering' }))).toEqual(['delivered', 'failed', 'paid', 'unpaid']);
    expect(orderActions(order({ status: 'pending' }))).toEqual(['paid', 'unpaid']);
  });
  it('offers Paid for unpaid orders and nothing once paid', () => {
    expect(orderActions(order({ status: 'delivered', payment_status: 'unpaid' }))).toEqual(['paid']);
    expect(orderActions(order({ status: 'completed', payment_status: 'paid' }))).toEqual([]);
  });
  it('offers nothing on cancelled or ignored orders', () => {
    expect(orderActions(order({ status: 'cancelled' }))).toEqual([]);
    expect(orderActions(order({ payment_status: 'ignored' }))).toEqual([]);
  });
});

describe('labels and counts', () => {
  it('maps statuses to the spec labels', () => {
    expect([STATUS_LABEL.pending, STATUS_LABEL.preparing, STATUS_LABEL.delivering, STATUS_LABEL.delivered, STATUS_LABEL.completed, STATUS_LABEL.delivery_failed])
      .toEqual(['Waiting', 'Waiting', 'On the way', 'Delivered', 'Delivered', 'Failed']);
  });
  it('counts parcels and formats money', () => {
    expect(parcelsOf(order({ items: [{ food_name: 'a', quantity: 2, price: 1, meal_type: 'veg' }, { food_name: 'b', quantity: 1, price: 1, meal_type: 'veg' }] }))).toBe(3);
    expect(formatRs(450)).toBe('Rs. 450.00');
  });
});

describe('search and filters', () => {
  it('matches order id, name, phone, address and food, ignoring case', () => {
    const o = order({ order_id: 'ORD-99-x' });
    for (const q of ['ord-99', 'ann', '077123', 'room 12', 'chicken', '']) expect(matchesSearch(o, q)).toBe(true);
    expect(matchesSearch(o, 'pizza')).toBe(false);
  });
  it('filters by group and never shows cancelled orders', () => {
    const list = [
      order({ order_id: 'P', status: 'pending' }), order({ order_id: 'D', status: 'delivering' }),
      order({ order_id: 'V', status: 'delivered' }), order({ order_id: 'C', status: 'completed' }),
      order({ order_id: 'F', status: 'delivery_failed' }), order({ order_id: 'X', status: 'cancelled' }),
    ];
    const ids = (f: Parameters<typeof visibleOrders>[1]) => visibleOrders(list, f, '').map((o) => o.order_id);
    expect(ids('to_deliver')).toEqual(['P', 'D']);
    expect(ids('delivered')).toEqual(['V', 'C']);
    expect(ids('failed')).toEqual(['F']);
    expect(ids('all')).toEqual(['P', 'D', 'V', 'C', 'F']);
  });
  it('needs a start while any order is pending or preparing', () => {
    expect(needsStart([order({ status: 'delivering' }), order({ status: 'preparing' })])).toBe(true);
    expect(needsStart([order({ status: 'delivering' })])).toBe(false);
  });
});

describe('groupByDate', () => {
  it('groups newest first with Today, counts and amounts; undated last', () => {
    const groups = groupByDate([
      order({ order_id: 'A', target_date: '2026-10-26', total_price: 100 }),
      order({ order_id: 'B', target_date: '2026-10-27', total_price: 200 }),
      order({ order_id: 'C', target_date: '2026-10-27', total_price: 50.5 }),
      order({ order_id: 'D', target_date: null, total_price: 10 }),
    ], '2026-10-27');
    expect(groups.map((g) => [g.label, g.orders.map((o) => o.order_id), g.amount])).toEqual([
      ['Today', ['B', 'C'], 250.5],
      ['2026-10-26', ['A'], 100],
      ['Undated', ['D'], 10],
    ]);
  });
  it('colomboToday is the Sri Lanka date', () => {
    expect(colomboToday(new Date('2026-10-26T19:00:00Z'))).toBe('2026-10-27');
  });
});
```

- [ ] **Step 3:** Run `npx jest services/delivery`: FAIL (the modules don't exist yet).

- [ ] **Step 4: Implement** `services/delivery/normalizeOrder.ts`

```ts
import type { DeliveryOrder, OrderItem } from '../types/api.types';

/** order-service returns `id`, decimal strings and `order_items`; the app uses `order_id`, numbers and `items`. */
export function normalizeOrder(raw: any): DeliveryOrder {
  const rawItems: any[] = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.order_items) ? raw.order_items : [];
  const items: OrderItem[] = rawItems.map((ri) => ({
    food_name: ri.food_name ?? '',
    quantity: Number(ri.quantity ?? 0),
    price: Number(ri.price ?? 0),
    meal_type: ri.meal_type ?? 'other',
  }));
  return {
    order_id: String(raw.order_id ?? raw.id ?? ''),
    customer_id: raw.customer_id ?? '',
    customer_name: raw.customer_name ?? '',
    customer_phone: raw.customer_phone ?? '',
    customer_address: raw.customer_address ?? '',
    area_id: Number(raw.area_id ?? 0),
    meal_time: raw.meal_time,
    target_date: raw.target_date ?? null,
    total_price: Number(raw.total_price ?? 0),
    payment_status: raw.payment_status ?? 'pending',
    status: raw.status ?? 'pending',
    failure_reason: raw.failure_reason ?? null,
    created_at: raw.created_at ?? '',
    items,
  };
}
```

`services/delivery/orderView.ts`:

```ts
import type { DeliveryOrder, OrderStatus } from '../types/api.types';

export type OrderAction = 'delivered' | 'failed' | 'paid' | 'unpaid';
export type StatusGroup = 'to_deliver' | 'delivered' | 'failed' | 'cancelled';
export type OrderFilter = 'to_deliver' | 'delivered' | 'failed' | 'all';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Waiting',
  preparing: 'Waiting',
  delivering: 'On the way',
  delivered: 'Delivered',
  completed: 'Delivered',
  delivery_failed: 'Failed',
  cancelled: 'Cancelled',
};

export function statusGroup(status: OrderStatus): StatusGroup {
  if (status === 'pending' || status === 'preparing' || status === 'delivering') return 'to_deliver';
  if (status === 'delivered' || status === 'completed') return 'delivered';
  if (status === 'delivery_failed') return 'failed';
  return 'cancelled';
}

/** Buttons an order offers. Delivered/Failed only while out for delivery; payment until it is settled. */
export function orderActions(o: Pick<DeliveryOrder, 'status' | 'payment_status'>): OrderAction[] {
  if (o.status === 'cancelled') return [];
  const actions: OrderAction[] = [];
  if (o.status === 'delivering') actions.push('delivered', 'failed');
  if (o.payment_status === 'pending') actions.push('paid', 'unpaid');
  else if (o.payment_status === 'unpaid') actions.push('paid');
  return actions;
}

export const parcelsOf = (o: Pick<DeliveryOrder, 'items'>) => o.items.reduce((n, item) => n + (item.quantity || 0), 0);

export const formatRs = (amount: number) => `Rs. ${Number(amount || 0).toFixed(2)}`;

export function matchesSearch(o: DeliveryOrder, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields = [o.order_id, o.customer_name, o.customer_phone, o.customer_address, ...o.items.map((i) => i.food_name)];
  return fields.some((f) => String(f || '').toLowerCase().includes(q));
}

export function visibleOrders(orders: DeliveryOrder[], filter: OrderFilter, query: string): DeliveryOrder[] {
  return orders.filter((o) => {
    const group = statusGroup(o.status);
    if (group === 'cancelled') return false;
    if (filter !== 'all' && group !== filter) return false;
    return matchesSearch(o, query);
  });
}

export const needsStart = (orders: DeliveryOrder[]) => orders.some((o) => o.status === 'pending' || o.status === 'preparing');

export interface DateGroup {
  date: string | null;
  label: string;
  orders: DeliveryOrder[];
  amount: number;
}

/** Unpaid orders by session date, newest first; orders without a date go last. */
export function groupByDate(orders: DeliveryOrder[], today: string): DateGroup[] {
  const byDate = new Map<string | null, DeliveryOrder[]>();
  for (const o of orders) byDate.set(o.target_date, [...(byDate.get(o.target_date) ?? []), o]);
  return [...byDate.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : b.localeCompare(a)))
    .map(([date, list]) => ({
      date,
      label: date === null ? 'Undated' : date === today ? 'Today' : date,
      orders: list,
      amount: Math.round(list.reduce((n, o) => n + o.total_price, 0) * 100) / 100,
    }));
}

/** Today's date in Sri Lanka (UTC+05:30, no DST), matching the backend's colomboToday. */
export const colomboToday = (now = new Date()) => new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
```

- [ ] **Step 5:** Run `npx jest services/delivery/__tests__/normalizeOrder.test.ts services/delivery/__tests__/orderView.test.ts`: green.

- [ ] **Step 6: Write the failing service test** `services/delivery/__tests__/delivery.service.test.ts`

```ts
import { DeliveryApiClient } from '../../clients/delivery-api.client';
import { DeliveryService } from '../delivery.service';

describe('DeliveryService', () => {
  const api = DeliveryApiClient.prototype as any;
  afterEach(() => jest.restoreAllMocks());

  it('session orders ask for every status and payment of one session, normalised', async () => {
    const spy = jest.spyOn(api, 'getAreaOrders').mockResolvedValue({ orders: [{ id: 'A', total_price: '10.00' }] });
    const list = await new DeliveryService().getSessionOrders({ area_id: 3, meal_time: 'lunch', target_date: '2026-10-27' });
    expect(spy).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', type: 'all', payment_status: 'any' });
    expect(list[0]).toMatchObject({ order_id: 'A', total_price: 10 });
  });

  it('unpaid orders cover every status and day of the area', async () => {
    const spy = jest.spyOn(api, 'getAreaOrders').mockResolvedValue({ orders: [] });
    await new DeliveryService().getUnpaidOrders(3);
    expect(spy).toHaveBeenCalledWith({ area_id: 3, type: 'all', payment_status: 'unpaid' });
  });

  it('marks delivered and failed (trimmed reason) through the status endpoint', async () => {
    const spy = jest.spyOn(api, 'updateOrderStatus').mockResolvedValue({});
    const s = new DeliveryService();
    await s.markDelivered('A');
    await s.markFailed('B', '  not at hostel ');
    expect(spy.mock.calls).toEqual([['A', 'delivered'], ['B', 'delivery_failed', 'not at hostel']]);
  });

  it('returns the summary and wraps API errors with the server message', async () => {
    jest.spyOn(api, 'getSummary').mockResolvedValue({ summary: { failed: { orders: 1 } } });
    await expect(new DeliveryService().getSummary({ area_id: 3, meal_time: 'lunch' })).resolves.toEqual({ failed: { orders: 1 } });
    jest.spyOn(api, 'startDelivery').mockRejectedValue({ response: { status: 409, data: { message: 'Ordering is still open for this session. Start delivery after it closes.' } } });
    await expect(new DeliveryService().startDelivery({ area_id: 3, meal_time: 'lunch' })).rejects.toMatchObject({ status: 409 });
  });
});
```

Before writing the last assertion, read `services/utils/error.utils.ts` and check how `ErrorUtils.createApiError` maps an axios-shaped error. If it puts the status somewhere other than `status`, change only that assertion to match, and say so in the report.

- [ ] **Step 7:** Run `npx jest services/delivery/__tests__/delivery.service.test.ts`: FAIL.

- [ ] **Step 8: Implement.** Replace `services/clients/delivery-api.client.ts` with:

```ts
/**
 * Delivery API Client
 * HTTP calls to delivery-service for the driver app
 */

import { DriverSummary, GetAreaOrdersRequest, SessionScope, StartDeliveryResponse } from '../types/api.types';
import { BaseApiClient } from './base-api.client';

export interface AreaOrdersResponse {
  message: string;
  orders: any[];
  total: number;
}

export class DeliveryApiClient extends BaseApiClient {
  constructor() {
    super('DELIVERY_SERVICE');
  }

  async getAreaOrders(params: GetAreaOrdersRequest): Promise<AreaOrdersResponse> {
    const q = new URLSearchParams({ area_id: String(params.area_id) });
    if (params.meal_time) q.append('meal_time', params.meal_time);
    if (params.target_date) q.append('target_date', params.target_date);
    if (params.payment_status) q.append('payment_status', params.payment_status);
    if (params.type) q.append('type', params.type);
    // Cache-busting param to avoid 304 with empty body on some devices
    q.append('_ts', Date.now().toString());
    const response = await this.get<AreaOrdersResponse>(`/delivery/orders/area?${q.toString()}`);
    return response.data;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: 'paid' | 'unpaid'): Promise<unknown> {
    const response = await this.put(`/delivery/orders/${encodeURIComponent(orderId)}/payment`, { payment_status: paymentStatus });
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: 'delivered' | 'delivery_failed', failureReason?: string): Promise<unknown> {
    const body = status === 'delivery_failed' ? { status, failure_reason: failureReason } : { status };
    const response = await this.put(`/delivery/orders/${encodeURIComponent(orderId)}/status`, body);
    return response.data;
  }

  async startDelivery(scope: SessionScope): Promise<StartDeliveryResponse> {
    const response = await this.post<StartDeliveryResponse>('/delivery/orders/start-delivery', scope);
    return response.data;
  }

  async getSummary(scope: SessionScope): Promise<{ summary: DriverSummary }> {
    const q = new URLSearchParams({ area_id: String(scope.area_id), meal_time: scope.meal_time, _ts: Date.now().toString() });
    const response = await this.get<{ summary: DriverSummary }>(`/delivery/summary?${q.toString()}`);
    return response.data;
  }
}
```

Replace `services/delivery/delivery.service.ts` with:

```ts
/**
 * Delivery Service
 * Driver operations for one area and meal session. No caching: every screen refreshes after a write.
 */

import { DeliveryApiClient } from '../clients/delivery-api.client';
import { DeliveryOrder, DriverSummary, SessionScope, StartDeliveryResponse } from '../types/api.types';
import { ErrorUtils } from '../utils/error.utils';
import { normalizeOrder } from './normalizeOrder';

const wrap = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    throw ErrorUtils.createApiError(error);
  }
};

export class DeliveryService {
  private api = new DeliveryApiClient();

  /** Every order of one session in one area, any status and payment */
  getSessionOrders(scope: SessionScope & { target_date: string }): Promise<DeliveryOrder[]> {
    return wrap(async () => (await this.api.getAreaOrders({ ...scope, type: 'all', payment_status: 'any' })).orders.map(normalizeOrder));
  }

  /** Every unpaid order of the area, any status and day */
  getUnpaidOrders(areaId: number): Promise<DeliveryOrder[]> {
    return wrap(async () => (await this.api.getAreaOrders({ area_id: areaId, type: 'all', payment_status: 'unpaid' })).orders.map(normalizeOrder));
  }

  getSummary(scope: SessionScope): Promise<DriverSummary> {
    return wrap(async () => (await this.api.getSummary(scope)).summary);
  }

  startDelivery(scope: SessionScope): Promise<StartDeliveryResponse> {
    return wrap(() => this.api.startDelivery(scope));
  }

  markDelivered(orderId: string): Promise<unknown> {
    return wrap(() => this.api.updateOrderStatus(orderId, 'delivered'));
  }

  markFailed(orderId: string, reason: string): Promise<unknown> {
    return wrap(() => this.api.updateOrderStatus(orderId, 'delivery_failed', reason.trim()));
  }

  setPayment(orderId: string, paymentStatus: 'paid' | 'unpaid'): Promise<unknown> {
    return wrap(() => this.api.updatePaymentStatus(orderId, paymentStatus));
  }
}
```

The two screens still call the removed methods (`getTodaysOrders`, `getAreaOrders`, `updatePaymentStatus`), so `tsc` will fail until Tasks 4 and 5. To keep this task's gate green, make only these call-site renames in the old screens:
- `screens/home/home.screen.tsx`: `deliveryService.updatePaymentStatus(orderId, type)` becomes `deliveryService.setPayment(orderId, type)`.
- `screens/pendingPayments/pendingPayments.screen.tsx`: `deliveryService.updatePaymentStatus(orderId, 'paid')` becomes `deliveryService.setPayment(orderId, 'paid')`, and `const response = await deliveryService.getAreaOrders({ area_id: parseInt(idToUse), payment_status: 'unpaid' }); const ordersArray = Array.isArray(response.orders) ? response.orders : [];` becomes `const ordersArray = await deliveryService.getUnpaidOrders(parseInt(idToUse));`.
- `home.screen.tsx` `fetchOrders`: replace the `getTodaysOrders` call and the two lines after it with `const ordersArray = await deliveryService.getUnpaidOrders(parseInt(areaId));`. This is temporary: Task 4 rewrites the screen.

List these temporary edits in the report.

- [ ] **Step 9:** Run `npx jest`, `npx tsc --noEmit` and `npx expo lint`: all pass the gates.

- [ ] **Step 10: Commit**

```bash
git add services/types/api.types.ts services/delivery services/clients/delivery-api.client.ts screens/home/home.screen.tsx screens/pendingPayments/pendingPayments.screen.tsx
git commit -m "feat(delivery): session-scoped orders, summary, start-delivery and status calls"
```

---

### Task 3: Area + session selection

**Files:**
- Create: `services/delivery/selection.ts`, test `services/delivery/__tests__/selection.test.ts`
- Modify: `screens/area-selection/area-selection.screen.tsx` (`handleAreaSelection` and the logout handler)
- Test: `screens/__tests__/area-selection.screen.test.tsx`

**Interfaces:**
- Produces: `interface DeliverySelection { areaId: number; area: string; sessionId: number; mealTime: MealTime; date: string }`, `saveSelection(sel)`, `loadSelection(): Promise<DeliverySelection | null>` (null when it's missing or from the old format), `clearDeliveryStorage()` (removes the selection and the legacy `rc_delivery_paid_summary_area_*` / `rc_delivery_unpaid_collected_area_*` keys).

- [ ] **Step 1: Write the failing tests.**

`services/delivery/__tests__/selection.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearDeliveryStorage, loadSelection, saveSelection } from '../selection';

const SEL = { areaId: 3, area: 'Block A', sessionId: 7, mealTime: 'lunch' as const, date: '2026-10-27' };

beforeEach(() => AsyncStorage.clear());

it('round-trips a selection', async () => {
  await saveSelection(SEL);
  await expect(loadSelection()).resolves.toEqual(SEL);
});

it('treats the old { areaId, area } format and junk as no selection', async () => {
  await AsyncStorage.setItem('rc_selected_area', JSON.stringify({ areaId: 3, area: 'Block A' }));
  await expect(loadSelection()).resolves.toBeNull();
  await AsyncStorage.setItem('rc_selected_area', 'not json');
  await expect(loadSelection()).resolves.toBeNull();
});

it('clears the selection and the legacy local counters only', async () => {
  await saveSelection(SEL);
  await AsyncStorage.multiSet([['rc_delivery_paid_summary_area_3', '{}'], ['rc_delivery_unpaid_collected_area_3', '{}'], ['access_token', 't']]);
  await clearDeliveryStorage();
  expect(await AsyncStorage.getAllKeys()).toEqual(['access_token']);
});
```

`screens/__tests__/area-selection.screen.test.tsx`:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import AreaSelectionScreen from '../area-selection/area-selection.screen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
// jest.mock factories are hoisted above imports: build the fakes inside the factory, never from outer variables.
jest.mock('@/services', () => ({
  authService: { logout: jest.fn() },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
  locationService: { getAreas: jest.fn(async () => [{ area_id: 3, area_name: 'Block A' }, { area_id: 4, area_name: 'Block B' }]) },
  menuApi: {
    getMyDeliverySessions: jest.fn(async () => [
      { id: 7, date: '2026-10-27', meal_time: 'lunch', start_time: '06:00:00', end_time: '10:00:00', notes: null, state: 'closed', mine: [3], taken: [] },
    ]),
    setMyDeliveryAreas: jest.fn(async () => undefined),
  },
}));

beforeEach(() => AsyncStorage.clear());

it('choosing one of my areas saves the area with its session and opens the tabs', async () => {
  await render(<AreaSelectionScreen />);
  fireEvent.press(await screen.findByText('Block A'));
  await waitFor(() => expect(router.push).toHaveBeenCalledWith('/(tabs)'));
  expect(JSON.parse((await AsyncStorage.getItem('rc_selected_area'))!)).toEqual({ areaId: 3, area: 'Block A', sessionId: 7, mealTime: 'lunch', date: '2026-10-27' });
});
```

- [ ] **Step 2:** Run `npx jest services/delivery/__tests__/selection.test.ts screens/__tests__/area-selection.screen.test.tsx`: FAIL.

- [ ] **Step 3: Implement** `services/delivery/selection.ts`

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealTime } from '../types/api.types';

/** The area and meal session the driver is working, chosen on the area-selection screen */
export interface DeliverySelection {
  areaId: number;
  area: string;
  sessionId: number;
  mealTime: MealTime;
  date: string; // YYYY-MM-DD, the session date
}

const KEY = 'rc_selected_area';
const LEGACY_PREFIXES = ['rc_delivery_paid_summary_area_', 'rc_delivery_unpaid_collected_area_'];
const MEALS: MealTime[] = ['breakfast', 'lunch', 'dinner'];

export async function saveSelection(selection: DeliverySelection): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(selection));
}

/** null when nothing is stored or it is the old { areaId, area } shape without a session */
export async function loadSelection(): Promise<DeliverySelection | null> {
  try {
    const s = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
    const valid = s && Number.isInteger(s.areaId) && typeof s.area === 'string' && Number.isInteger(s.sessionId)
      && MEALS.includes(s.mealTime) && /^\d{4}-\d{2}-\d{2}$/.test(s.date);
    return valid ? { areaId: s.areaId, area: s.area, sessionId: s.sessionId, mealTime: s.mealTime, date: s.date } : null;
  } catch {
    return null;
  }
}

/** Forget the selection and the local counters older builds kept */
export async function clearDeliveryStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter((k) => k === KEY || LEGACY_PREFIXES.some((p) => k.startsWith(p)));
  if (stale.length) await AsyncStorage.multiRemove(stale);
}
```

In `area-selection.screen.tsx`:
- Import `{ clearDeliveryStorage, saveSelection } from '@/services/delivery/selection'`.
- Replace `handleAreaSelection` with the version below.
- In the logout `onPress`, replace the `getAllKeys` / `filter` / `multiRemove` block with `await clearDeliveryStorage();`.
- Remove the `AsyncStorage` import if it is no longer used.

```tsx
    const handleAreaSelection = async (area: Area) => {
        if (!session) return;
        try {
            await saveSelection({
                areaId: Number(area.area_id),
                area: area.area_name,
                sessionId: session.id,
                mealTime: session.meal_time,
                date: session.date,
            });
        } catch (e) { /* ignore */ }
        router.push('/(tabs)');
    };
```

`handleAreaSelection` is defined before `const session = ...`. Move the `session` declaration above `handleAreaSelection` so the closure reads it; don't change it otherwise.

- [ ] **Step 4:** Run the two tests (green), then the full gates.

- [ ] **Step 5: Commit**

```bash
git add services/delivery/selection.ts services/delivery/__tests__/selection.test.ts screens/area-selection/area-selection.screen.tsx screens/__tests__/area-selection.screen.test.tsx
git commit -m "feat(areas): remember the meal session with the chosen area"
```

---

### Task 4: Active Orders (Home)

**Files:**
- Modify: `components/popupmodel/popupModel.tsx` (optional `onRequestClose` prop)
- Create: `components/failReasonModal/failReasonModal.tsx`
- Modify (rewrite): `screens/home/home.screen.tsx`
- Test: `screens/__tests__/home.screen.test.tsx`, `components/__tests__/failReasonModal.test.tsx`

**Interfaces:**
- Consumes: `deliveryService` (Task 2), `loadSelection` (Task 3), `menuApi.getMyDeliverySessions()` (existing, returns `DeliverySession[]` with `state`), and the `orderView` helpers (Task 2).
- Produces: `FailReasonModal` (`{ visible, orderId, onCancel, onSubmit(reason) }`); `CancelModal` gains `onRequestClose?: () => void`, which defaults to `onClose`.

- [ ] **Step 1: Write the failing tests.**

`components/__tests__/failReasonModal.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import FailReasonModal from '../failReasonModal/failReasonModal';

it('needs a reason before Mark failed works, and submits it trimmed', async () => {
  const onSubmit = jest.fn();
  await render(<FailReasonModal visible orderId="B" onCancel={jest.fn()} onSubmit={onSubmit} />);
  fireEvent.press(screen.getByRole('button', { name: 'Mark failed' }));
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByTestId('fail-reason-input'), '  Not at hostel ');
  fireEvent.press(screen.getByRole('button', { name: 'Mark failed' }));
  expect(onSubmit).toHaveBeenCalledWith('Not at hostel');
});
```

`screens/__tests__/home.screen.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import HomeScreen from '../home/home.screen';

jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return { useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});

// Factories are hoisted above the imports: fakes are built inside them, and outer state is only read
// lazily through `mock`-prefixed variables (the only outer names babel-jest allows in a factory).
let mockSessionState = 'closed';
let mockSelection: any = null;
jest.mock('@/services', () => ({
  deliveryService: {
    getSessionOrders: jest.fn(),
    getSummary: jest.fn(),
    startDelivery: jest.fn(),
    markDelivered: jest.fn(),
    markFailed: jest.fn(),
    setPayment: jest.fn(),
  },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
  menuApi: { getMyDeliverySessions: jest.fn(async () => [{ id: 7, meal_time: 'lunch', state: mockSessionState, mine: [3], taken: [] }]) },
}));
jest.mock('@/services/delivery/selection', () => ({ loadSelection: jest.fn(async () => mockSelection) }));

import { deliveryService } from '@/services';
const svc = deliveryService as unknown as Record<'getSessionOrders' | 'getSummary' | 'startDelivery' | 'markDelivered' | 'markFailed' | 'setPayment', jest.Mock>;

const order = (order_id: string, status: string, payment_status = 'pending', over: object = {}) => ({
  order_id, status, payment_status, customer_id: 'c', customer_name: `Name ${order_id}`, customer_phone: `07700${order_id}`,
  customer_address: `Room ${order_id}`, area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', total_price: 450,
  failure_reason: null, created_at: '', items: [{ food_name: 'Rice', quantity: 2, price: 225, meal_type: 'veg' }], ...over,
});
const SUMMARY = {
  to_deliver: { orders: 4, parcels: 6 }, delivered: { orders: 2, parcels: 3 }, failed: { orders: 1 },
  collected: { orders: 2, amount: 900 }, unpaid: { orders: 1, amount: 450, list: [] },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSessionState = 'closed';
  mockSelection = { areaId: 3, area: 'Block A', sessionId: 7, mealTime: 'lunch', date: '2026-10-27' };
  svc.getSessionOrders.mockResolvedValue([order('A', 'pending'), order('B', 'delivering'), order('V', 'delivered', 'paid'), order('X', 'cancelled')]);
  svc.getSummary.mockResolvedValue(SUMMARY);
  for (const k of ['startDelivery', 'markDelivered', 'markFailed', 'setPayment'] as const) svc[k].mockResolvedValue({ message: 'ok' });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('shows the server counters and, by default, only orders still to deliver', async () => {
  await render(<HomeScreen />);
  expect(await screen.findByText('To deliver: 4 orders · 6 parcels')).toBeTruthy();
  expect(screen.getByText('Delivered: 2 orders · 3 parcels')).toBeTruthy();
  expect(screen.getByText('Collected: Rs. 900.00')).toBeTruthy();
  expect(screen.getByText('Unpaid: 1 orders · Rs. 450.00')).toBeTruthy();
  expect(screen.getByTestId('order-A')).toBeTruthy();
  expect(screen.getByTestId('order-B')).toBeTruthy();
  expect(screen.queryByTestId('order-V')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'All' }));
  expect(screen.getByTestId('order-V')).toBeTruthy();
  expect(screen.queryByTestId('order-X')).toBeNull();
  expect(svc.getSessionOrders).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch', target_date: '2026-10-27' });
});

it('searches by phone', async () => {
  await render(<HomeScreen />);
  fireEvent.changeText(await screen.findByPlaceholderText('Search orders'), '07700B');
  expect(screen.queryByTestId('order-A')).toBeNull();
  expect(screen.getByTestId('order-B')).toBeTruthy();
});

it('Start delivery waits for ordering to close', async () => {
  mockSessionState = 'open';
  await render(<HomeScreen />);
  expect(await screen.findByText('Available after ordering closes')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Start delivery' }).props.accessibilityState).toMatchObject({ disabled: true });
});

it('Start delivery moves the area on and refreshes', async () => {
  await render(<HomeScreen />);
  fireEvent.press(await screen.findByRole('button', { name: 'Start delivery' }));
  fireEvent.press(screen.getByText('Start'));
  await waitFor(() => expect(svc.startDelivery).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch' }));
  await waitFor(() => expect(svc.getSessionOrders).toHaveBeenCalledTimes(2));
});

it('Delivered on an order not yet paid then asks whether it was paid', async () => {
  await render(<HomeScreen />);
  fireEvent.press(within(await screen.findByTestId('order-B')).getByRole('button', { name: 'DELIVERED' }));
  fireEvent.press(screen.getByText('Yes, delivered'));
  await waitFor(() => expect(svc.markDelivered).toHaveBeenCalledWith('B'));
  expect(await screen.findByText('Was it paid?')).toBeTruthy();
  fireEvent.press(screen.getByText('Paid'));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('B', 'paid'));
});

it('Failed needs a reason and sends it', async () => {
  await render(<HomeScreen />);
  fireEvent.press(within(await screen.findByTestId('order-B')).getByRole('button', { name: 'FAILED' }));
  fireEvent.changeText(screen.getByTestId('fail-reason-input'), 'Not at hostel');
  fireEvent.press(screen.getByRole('button', { name: 'Mark failed' }));
  await waitFor(() => expect(svc.markFailed).toHaveBeenCalledWith('B', 'Not at hostel'));
});

it('Unpaid on a waiting order records it without delivering', async () => {
  await render(<HomeScreen />);
  fireEvent.press(within(await screen.findByTestId('order-A')).getByRole('button', { name: 'UNPAID' }));
  fireEvent.press(screen.getByText('Unpaid'));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('A', 'unpaid'));
  expect(svc.markDelivered).not.toHaveBeenCalled();
});

it("shows the server's message when an action fails", async () => {
  svc.markDelivered.mockRejectedValue(new Error('Cannot change status from delivered to delivered'));
  await render(<HomeScreen />);
  fireEvent.press(within(await screen.findByTestId('order-B')).getByRole('button', { name: 'DELIVERED' }));
  fireEvent.press(screen.getByText('Yes, delivered'));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Could not update', 'Cannot change status from delivered to delivered'));
});

it('asks for an area when nothing is selected', async () => {
  mockSelection = null;
  await render(<HomeScreen />);
  expect(await screen.findByText('Choose a delivery area first')).toBeTruthy();
  expect(svc.getSessionOrders).not.toHaveBeenCalled();
});
```

- [ ] **Step 2:** Run `npx jest screens/__tests__/home.screen.test.tsx components/__tests__/failReasonModal.test.tsx`: FAIL.

- [ ] **Step 3: Implement.**

`components/popupmodel/popupModel.tsx`:
- Add `onRequestClose?: () => void;` to `ModalProps`.
- Destructure `onRequestClose`.
- Change `onRequestClose={onClose}` on the `<Modal>` to `onRequestClose={onRequestClose ?? onClose}`.
- Add `accessibilityRole="button"` to both `TouchableOpacity` buttons.
- Change nothing else.

`components/failReasonModal/failReasonModal.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  orderId: string;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}

const MAX_REASON = 500; // order-service rejects longer reasons

export default function FailReasonModal({ visible, orderId, onCancel, onSubmit }: Props) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const valid = trimmed.length > 0 && trimmed.length <= MAX_REASON;

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Delivery failed</Text>
          <Text style={styles.text}>Order ID: {orderId}</Text>
          <TextInput
            testID="fail-reason-input"
            style={styles.input}
            placeholder="What happened? (required)"
            placeholderTextColor="#888"
            value={reason}
            onChangeText={setReason}
            maxLength={MAX_REASON}
            multiline
          />
          <View style={styles.row}>
            <TouchableOpacity accessibilityRole="button" style={[styles.button, styles.back]} onPress={onCancel}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: !valid }}
              disabled={!valid}
              style={[styles.button, styles.submit, !valid && styles.disabled]}
              onPress={() => onSubmit(trimmed)}
            >
              <Text style={styles.buttonText}>Mark failed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  card: { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  text: { fontSize: 14, color: '#666', marginBottom: 12 },
  input: { minHeight: 80, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, color: '#000', textAlignVertical: 'top' },
  row: { flexDirection: 'row', marginTop: 16 },
  button: { flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 5, alignItems: 'center' },
  back: { backgroundColor: '#69bf70' },
  submit: { backgroundColor: '#d63031' },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
```

Replace `screens/home/home.screen.tsx` with:

```tsx
import FailReasonModal from '@/components/failReasonModal/failReasonModal';
import CancelModal from '@/components/popupmodel/popupModel';
import { DeliveryOrder, DeliverySession, DriverSummary, ErrorUtils, deliveryService, menuApi } from '@/services';
import { OrderAction, OrderFilter, STATUS_LABEL, formatRs, needsStart, orderActions, parcelsOf, visibleOrders } from '@/services/delivery/orderView';
import { DeliverySelection, loadSelection } from '@/services/delivery/selection';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FILTERS: { key: OrderFilter; label: string }[] = [
    { key: 'to_deliver', label: 'To deliver' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'failed', label: 'Failed' },
    { key: 'all', label: 'All' },
];
const ACTION_LABEL: Record<OrderAction, string> = { delivered: 'DELIVERED', failed: 'FAILED', paid: 'PAID', unpaid: 'UNPAID' };
const SESSION_STATE: Record<DeliverySession['state'], string> = {
    upcoming: 'Ordering not open yet',
    open: 'Ordering open',
    closed: 'Ordering closed',
};

type Confirm = { title: string; message: string; confirmText: string; run: () => Promise<unknown> };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const HomeScreen = () => {
    const [selection, setSelection] = useState<DeliverySelection | null>(null);
    const [session, setSession] = useState<DeliverySession | null>(null);
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [summary, setSummary] = useState<DriverSummary | null>(null);
    const [filter, setFilter] = useState<OrderFilter>('to_deliver');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<Confirm | null>(null);
    const [failing, setFailing] = useState<DeliveryOrder | null>(null);
    const [askPaid, setAskPaid] = useState<DeliveryOrder | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const sel = await loadSelection();
            setSelection(sel);
            if (!sel) {
                setError('Choose a delivery area first');
                return;
            }
            const scope = { area_id: sel.areaId, meal_time: sel.mealTime };
            const [list, counters, sessions] = await Promise.all([
                deliveryService.getSessionOrders({ ...scope, target_date: sel.date }),
                deliveryService.getSummary(scope),
                menuApi.getMyDeliverySessions(),
            ]);
            setOrders(list);
            setSummary(counters);
            setSession(sessions.find((s) => s.id === sel.sessionId) ?? null);
        } catch (e) {
            setError(ErrorUtils.getErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    // One write at a time, then a full reload so the list and the counters match the server
    const act = async (run: () => Promise<unknown>) => {
        if (busy) return;
        setBusy(true);
        try {
            await run();
        } catch (e) {
            Alert.alert('Could not update', ErrorUtils.getErrorMessage(e));
        } finally {
            setBusy(false);
            await load();
        }
    };

    const onAction = (order: DeliveryOrder, action: OrderAction) => {
        const id = order.order_id;
        if (action === 'failed') {
            setFailing(order);
        } else if (action === 'delivered') {
            setConfirm({
                title: 'Mark as Delivered?',
                message: `Order ID: ${id}`,
                // not 'Delivered': that is also a filter chip label on this screen
                confirmText: 'Yes, delivered',
                run: async () => {
                    await deliveryService.markDelivered(id);
                    if (order.payment_status === 'pending') setAskPaid(order);
                },
            });
        } else {
            setConfirm({
                title: action === 'paid' ? 'Mark as Paid?' : 'Mark as Unpaid?',
                message: `Order ID: ${id}`,
                confirmText: action === 'paid' ? 'Paid' : 'Unpaid',
                run: () => deliveryService.setPayment(id, action),
            });
        }
    };

    const onStart = () => {
        if (!selection) return;
        setConfirm({
            title: 'Start delivery?',
            message: `Waiting orders in ${selection.area} will be marked "On the way" and their customers notified.`,
            confirmText: 'Start',
            run: async () => {
                const result = await deliveryService.startDelivery({ area_id: selection.areaId, meal_time: selection.mealTime });
                Alert.alert('Delivery started', result.message);
            },
        });
    };

    const shown = visibleOrders(orders, filter, search);
    const canStart = session?.state === 'closed' && !busy;

    const renderOrder = ({ item }: { item: DeliveryOrder }) => (
        <View testID={`order-${item.order_id}`} style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderIdText}>Order ID: {item.order_id}</Text>
                <Text style={styles.badge}>{STATUS_LABEL[item.status]}</Text>
            </View>
            <Text style={styles.customerNameText}>Customer: {item.customer_name || 'N/A'}</Text>
            <Text style={styles.customerInfo}>Phone: {item.customer_phone || 'N/A'}</Text>
            <Text style={styles.customerInfo}>Address: {item.customer_address || 'N/A'}</Text>
            {item.items.map((orderItem, index) => (
                <Text key={index} style={styles.itemText}>{orderItem.food_name} × {orderItem.quantity}</Text>
            ))}
            <Text style={styles.customerInfo}>Parcels: {parcelsOf(item)}</Text>
            <Text style={styles.priceText}>Price : {formatRs(item.total_price)}</Text>
            {item.status === 'delivery_failed' && item.failure_reason ? (
                <Text style={styles.customerInfo}>Reason: {item.failure_reason}</Text>
            ) : null}
            <View style={styles.paymentRow}>
                {orderActions(item).map((action) => (
                    <TouchableOpacity
                        key={action}
                        accessibilityRole="button"
                        disabled={busy}
                        style={[styles.actionButton, styles[action]]}
                        onPress={() => onAction(item, action)}
                    >
                        <Text style={action === 'unpaid' ? styles.unpaidText : styles.actionText}>{ACTION_LABEL[action]}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (isLoading && orders.length === 0 && !error) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color="#69bf70" />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>RC FoodService</Text>
                <Text style={styles.title}>Active Orders{selection ? ` - ${selection.area}` : ''}</Text>
                {selection ? (
                    <Text style={styles.sessionText}>
                        {capitalize(selection.mealTime)}{session ? ` · ${SESSION_STATE[session.state]}` : ''}
                    </Text>
                ) : null}

                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search orders"
                        placeholderTextColor="#888"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={styles.chipRow}>
                    {FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f.key}
                            accessibilityRole="button"
                            accessibilityState={{ selected: filter === f.key }}
                            style={[styles.chip, filter === f.key && styles.chipActive]}
                            onPress={() => setFilter(f.key)}
                        >
                            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {needsStart(orders) ? (
                    <View style={styles.startRow}>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !canStart }}
                            disabled={!canStart}
                            style={[styles.startButton, !canStart && styles.startDisabled]}
                            onPress={onStart}
                        >
                            <Text style={styles.startText}>Start delivery</Text>
                        </TouchableOpacity>
                        {session?.state !== 'closed' ? <Text style={styles.startCaption}>Available after ordering closes</Text> : null}
                    </View>
                ) : null}

                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity accessibilityRole="button" onPress={load} style={styles.retryButton}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {shown.length === 0 && !error ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders here</Text>
                    </View>
                ) : (
                    <FlatList
                        data={shown}
                        keyExtractor={(item) => item.order_id}
                        renderItem={renderOrder}
                        contentContainerStyle={{ paddingBottom: 220 }}
                        showsVerticalScrollIndicator={false}
                        refreshing={isLoading}
                        onRefresh={load}
                    />
                )}
            </View>

            {summary ? (
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryLine}>To deliver: {summary.to_deliver.orders} orders · {summary.to_deliver.parcels} parcels</Text>
                    <Text style={styles.summaryLine}>Delivered: {summary.delivered.orders} orders · {summary.delivered.parcels} parcels</Text>
                    <Text style={styles.summaryLine}>Collected: {formatRs(summary.collected.amount)}</Text>
                    <Text style={styles.summaryLine}>Unpaid: {summary.unpaid.orders} orders · {formatRs(summary.unpaid.amount)}</Text>
                </View>
            ) : null}

            <CancelModal
                visible={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                confirmText={confirm?.confirmText}
                cancelText="Back"
                onClose={() => setConfirm(null)}
                onConfirm={() => {
                    const c = confirm;
                    setConfirm(null);
                    if (c) act(c.run);
                }}
            />

            <CancelModal
                visible={!!askPaid}
                title="Was it paid?"
                message={askPaid ? `Order ID: ${askPaid.order_id} · ${formatRs(askPaid.total_price)}` : ''}
                confirmText="Paid"
                cancelText="Not paid"
                onRequestClose={() => setAskPaid(null)}
                onConfirm={() => {
                    const o = askPaid;
                    setAskPaid(null);
                    if (o) act(() => deliveryService.setPayment(o.order_id, 'paid'));
                }}
                onClose={() => {
                    const o = askPaid;
                    setAskPaid(null);
                    if (o) act(() => deliveryService.setPayment(o.order_id, 'unpaid'));
                }}
            />

            <FailReasonModal
                visible={!!failing}
                orderId={failing?.order_id ?? ''}
                onCancel={() => setFailing(null)}
                onSubmit={(reason) => {
                    const o = failing;
                    setFailing(null);
                    if (o) act(() => deliveryService.markFailed(o.order_id, reason));
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    header: { fontSize: 30, fontWeight: 'bold', marginBottom: 24, color: '#000' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#69bf70', marginBottom: 4 },
    sessionText: { fontSize: 14, color: '#555', marginBottom: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12 },
    searchInput: { marginLeft: 10, fontSize: 16, flex: 1, color: '#000' },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
    chipActive: { backgroundColor: '#69bf70' },
    chipText: { color: '#333', fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    startRow: { marginBottom: 12 },
    startButton: { backgroundColor: '#000', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    startDisabled: { opacity: 0.35 },
    startText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    startCaption: { marginTop: 6, color: '#666', textAlign: 'center' },
    orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    orderIdText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
    badge: { fontSize: 12, fontWeight: '700', color: '#69bf70' },
    customerNameText: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 6 },
    customerInfo: { fontSize: 12, color: '#666', marginVertical: 1 },
    itemText: { fontSize: 14, color: '#000', marginVertical: 1 },
    priceText: { fontSize: 14, fontWeight: 'bold', color: 'green', marginTop: 8 },
    paymentRow: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 10, gap: 8 },
    actionButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    delivered: { backgroundColor: '#69bf70' },
    failed: { backgroundColor: '#d63031' },
    paid: { backgroundColor: '#000' },
    unpaid: { backgroundColor: '#ccc' },
    actionText: { color: '#fff', fontWeight: '600' },
    unpaidText: { color: '#000', fontWeight: '600' },
    summaryContainer: { position: 'absolute', bottom: 110, left: 14, right: 24, backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
    summaryLine: { fontSize: 15, fontWeight: '600', color: '#000', marginVertical: 2 },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#666', textAlign: 'center' },
    errorContainer: { backgroundColor: '#ffe6e6', padding: 15, borderRadius: 8, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    errorText: { color: '#d63031', flex: 1, marginRight: 10 },
    retryButton: { backgroundColor: '#ff6b6b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    retryText: { color: 'white', fontSize: 12, fontWeight: '600' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
});

export default HomeScreen;
```

Notes for the implementer:
- `useFocusEffect` (rather than `useEffect`) refetches when the driver comes back to the tab after paying on Pending Payments.
- The "Was it paid?" dialog's Android back gesture only closes it (`onRequestClose`), so a back press never records Unpaid.
- The tab route file `app/(tabs)/index.tsx` already renders this screen; check it, and don't change it unless it passes props.

- [ ] **Step 4:** Run the two test files (green), then the full gates.

- [ ] **Step 5: Commit**

```bash
git add components/popupmodel/popupModel.tsx components/failReasonModal/failReasonModal.tsx components/__tests__/failReasonModal.test.tsx screens/home/home.screen.tsx screens/__tests__/home.screen.test.tsx
git commit -m "feat(home): session orders with start delivery, delivered/failed, payment and live counters"
```

---

### Task 5: Pending Payments

**Files:**
- Modify (rewrite): `screens/pendingPayments/pendingPayments.screen.tsx`
- Test: `screens/__tests__/pendingPayments.screen.test.tsx`

**Interfaces:**
- Consumes: `deliveryService.getUnpaidOrders(areaId)` and `setPayment` (Task 2), `loadSelection` (Task 3), `groupByDate`, `matchesSearch`, `formatRs`, `STATUS_LABEL` and `colomboToday` (Task 2).

- [ ] **Step 1: Write the failing test** `screens/__tests__/pendingPayments.screen.test.tsx`

```tsx
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import PendingPaymentsScreen from '../pendingPayments/pendingPayments.screen';

jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return { useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});
jest.mock('@/services', () => ({
  deliveryService: { getUnpaidOrders: jest.fn(), setPayment: jest.fn() },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
}));
jest.mock('@/services/delivery/selection', () => ({
  loadSelection: jest.fn(async () => ({ areaId: 3, area: 'Block A', sessionId: 7, mealTime: 'lunch', date: '2026-10-27' })),
}));
jest.mock('@/services/delivery/orderView', () => ({ ...jest.requireActual('@/services/delivery/orderView'), colomboToday: () => '2026-10-27' }));

import { deliveryService } from '@/services';
const svc = deliveryService as unknown as Record<'getUnpaidOrders' | 'setPayment', jest.Mock>;

const order = (order_id: string, target_date: string, total_price: number, status = 'delivered') => ({
  order_id, status, payment_status: 'unpaid', customer_id: 'c', customer_name: `Name ${order_id}`, customer_phone: '0770',
  customer_address: `Room ${order_id}`, area_id: 3, meal_time: 'lunch', target_date, total_price, failure_reason: null,
  created_at: '', items: [],
});

beforeEach(() => {
  jest.clearAllMocks();
  svc.getUnpaidOrders.mockResolvedValue([order('A', '2026-10-26', 100), order('B', '2026-10-27', 200, 'delivery_failed'), order('C', '2026-10-27', 50)]);
  svc.setPayment.mockResolvedValue({});
});

it('lists every unpaid order of the area grouped by day, with totals', async () => {
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText('Today · 2 orders · Rs. 250.00')).toBeTruthy();
  expect(screen.getByText('2026-10-26 · 1 orders · Rs. 100.00')).toBeTruthy();
  expect(screen.getByText('Outstanding: 3 orders · Rs. 350.00')).toBeTruthy();
  expect(within(screen.getByTestId('unpaid-B')).getByText('Failed')).toBeTruthy();
  expect(svc.getUnpaidOrders).toHaveBeenCalledWith(3);
});

it('searches by address', async () => {
  await render(<PendingPaymentsScreen />);
  fireEvent.changeText(await screen.findByPlaceholderText('Search orders'), 'room a');
  expect(screen.getByTestId('unpaid-A')).toBeTruthy();
  expect(screen.queryByTestId('unpaid-B')).toBeNull();
});

it('marks an order paid after confirming, then reloads', async () => {
  await render(<PendingPaymentsScreen />);
  fireEvent.press(within(await screen.findByTestId('unpaid-A')).getByRole('button', { name: 'PAID' }));
  fireEvent.press(screen.getByText('Paid'));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('A', 'paid'));
  await waitFor(() => expect(svc.getUnpaidOrders).toHaveBeenCalledTimes(2));
});
```

- [ ] **Step 2:** Run it: FAIL.

- [ ] **Step 3: Implement.** Replace `screens/pendingPayments/pendingPayments.screen.tsx` with:

```tsx
import CancelModal from '@/components/popupmodel/popupModel';
import { DeliveryOrder, ErrorUtils, deliveryService } from '@/services';
import { STATUS_LABEL, colomboToday, formatRs, groupByDate, matchesSearch } from '@/services/delivery/orderView';
import { DeliverySelection, loadSelection } from '@/services/delivery/selection';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A');

const PendingPaymentsScreen = () => {
  const [selection, setSelection] = useState<DeliverySelection | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState<DeliveryOrder | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sel = await loadSelection();
      setSelection(sel);
      if (!sel) {
        setError('Choose a delivery area first');
        return;
      }
      setOrders(await deliveryService.getUnpaidOrders(sel.areaId));
    } catch (e) {
      setError(ErrorUtils.getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markPaid = async (order: DeliveryOrder) => {
    if (busy) return;
    setBusy(true);
    try {
      await deliveryService.setPayment(order.order_id, 'paid');
    } catch (e) {
      Alert.alert('Could not update', ErrorUtils.getErrorMessage(e));
    } finally {
      setBusy(false);
      await load();
    }
  };

  const shown = orders.filter((o) => matchesSearch(o, search));
  const sections = groupByDate(shown, colomboToday()).map((g) => ({ ...g, key: g.label, data: g.orders }));
  const outstanding = Math.round(orders.reduce((n, o) => n + o.total_price, 0) * 100) / 100;

  const renderOrder = ({ item }: { item: DeliveryOrder }) => (
    <View testID={`unpaid-${item.order_id}`} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderText}>Order ID : {item.order_id}</Text>
        <Text style={styles.badge}>{STATUS_LABEL[item.status]}</Text>
      </View>
      <Text style={styles.itemText}>Customer: {item.customer_name || 'N/A'}</Text>
      <Text style={styles.itemText}>Phone: {item.customer_phone || 'N/A'}</Text>
      <Text style={styles.itemText}>Address: {item.customer_address || 'N/A'}</Text>
      <Text style={styles.itemText}>Meal: {capitalize(item.meal_time)}</Text>
      <Text style={styles.priceText}>Price : {formatRs(item.total_price)}</Text>
      <View style={styles.paymentRow}>
        <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.paidButton} onPress={() => setPaying(item)}>
          <Text style={styles.paidText}>PAID</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>RC FoodService</Text>
        <Text style={styles.title}>Pending Payments{selection ? ` - ${selection.area}` : ''}</Text>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.order_id}
          renderItem={renderOrder}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.label} · {section.orders.length} orders · {formatRs(section.amount)}</Text>
          )}
          ListEmptyComponent={!isLoading && !error ? <Text style={styles.emptyText}>No unpaid orders</Text> : null}
          contentContainerStyle={{ paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={load}
          stickySectionHeadersEnabled={false}
        />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Outstanding: {orders.length} orders · {formatRs(outstanding)}</Text>
      </View>

      <CancelModal
        visible={!!paying}
        title="Mark as Paid?"
        message={paying ? `Order ID: ${paying.order_id} · ${formatRs(paying.total_price)}` : ''}
        confirmText="Paid"
        cancelText="Back"
        onClose={() => setPaying(null)}
        onConfirm={() => {
          const o = paying;
          setPaying(null);
          if (o) markPaid(o);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  header: { fontSize: 30, fontWeight: 'bold', marginBottom: 24, color: '#000' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#69bf70', marginBottom: 25 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { marginLeft: 10, fontSize: 16, flex: 1, color: '#000' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#555', marginTop: 8, marginBottom: 10 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  badge: { fontSize: 12, fontWeight: '700', color: '#69bf70' },
  itemText: { fontSize: 14, color: '#000', marginVertical: 1 },
  priceText: { fontSize: 14, fontWeight: 'bold', color: 'green', marginTop: 8 },
  paymentRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  paidButton: { backgroundColor: '#000', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginLeft: 10 },
  paidText: { color: '#fff', fontWeight: '600' },
  errorContainer: { backgroundColor: '#ffe6e6', padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#d63031' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', paddingVertical: 50 },
  summaryContainer: { position: 'absolute', bottom: 110, left: 14, right: 24, backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  summaryLabel: { fontSize: 15, fontWeight: '600', color: '#000' },
});

export default PendingPaymentsScreen;
```

- [ ] **Step 4:** Run the test (green), then the full gates.

- [ ] **Step 5: Commit**

```bash
git add screens/pendingPayments/pendingPayments.screen.tsx screens/__tests__/pendingPayments.screen.test.tsx
git commit -m "feat(payments): every unpaid order of the area, grouped by day with totals"
```

---

### Task 6: Session restore, plain layout, storage cleanup at login

**Files:**
- Modify: `app/index.tsx`, `app/_layout.tsx`, `screens/auth/login/login.screen.tsx` (the AsyncStorage cleanup block only)
- Test: `app/__tests__/index.test.tsx`

**Interfaces:**
- Consumes: `authService.isAuthenticated()` (existing), `clearDeliveryStorage()` (Task 3).

- [ ] **Step 1: Write the failing test** `app/__tests__/index.test.tsx`

```tsx
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import Index from '../index';

// No JSX inside factories (the JSX runtime helper is an out-of-scope variable for babel-jest's hoisting check)
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => require('react').createElement(require('react-native').Text, null, `redirect:${href}`),
}));
jest.mock('@/services', () => ({ authService: { isAuthenticated: jest.fn() } }));

import { authService } from '@/services';
const isAuthenticated = authService.isAuthenticated as jest.Mock;

it('a signed-in driver goes straight to area selection', async () => {
  isAuthenticated.mockResolvedValue(true);
  await render(<Index />);
  expect(await screen.findByText('redirect:/(routes)/area-selection')).toBeTruthy();
});

it('anyone else goes to login, also when the check throws', async () => {
  isAuthenticated.mockResolvedValue(false);
  await render(<Index />);
  expect(await screen.findByText('redirect:/(routes)/login')).toBeTruthy();
  isAuthenticated.mockRejectedValue(new Error('storage'));
  await render(<Index />);
  expect(await screen.findByText('redirect:/(routes)/login')).toBeTruthy();
});
```

- [ ] **Step 2:** Run it: FAIL (the current index always redirects to login).

- [ ] **Step 3: Implement.** Replace `app/index.tsx`:

```tsx
import { authService } from '@/services';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type Target = '/(routes)/login' | '/(routes)/area-selection';

export default function Index() {
    const [target, setTarget] = useState<Target | null>(null);

    useEffect(() => {
        let alive = true;
        authService
            .isAuthenticated()
            .then((ok) => alive && setTarget(ok ? '/(routes)/area-selection' : '/(routes)/login'))
            .catch(() => alive && setTarget('/(routes)/login'));
        return () => { alive = false; };
    }, []);

    if (!target) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#69bf70" />
            </View>
        );
    }
    return <Redirect href={target} />;
}
```

Replace `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(routes)/login/index" />
      <Stack.Screen name="(routes)/area-selection/index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

In `login.screen.tsx`, replace the `try { const keys = await AsyncStorage.getAllKeys(); ... } catch {}` cleanup block with `try { await clearDeliveryStorage(); } catch {}` and import `clearDeliveryStorage` from `@/services/delivery/selection`. Remove the `AsyncStorage` import only if nothing else in the file uses it (the "remember me" logic may use it: check first).

- [ ] **Step 4:** Run the test (green), then the full gates. Also run `rg -n "rc_delivery_" screens app services`: the only matches should be the legacy prefixes inside `services/delivery/selection.ts`.

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx app/_layout.tsx app/__tests__/index.test.tsx screens/auth/login/login.screen.tsx
git commit -m "feat(auth): restore a signed-in session on launch; single Stack layout"
```

---

### Task 7: Docs and device checklist

**Files:**
- Modify: `OVERVIEW.md`
- Create: `docs/DEVICE-CHECKLIST.md`

- [ ] **Step 1:** In `OVERVIEW.md`, rewrite the "Current status" section so it matches the app after Tasks 1–6. Keep it to the facts:
  - Session-scoped orders.
  - Start delivery after ordering closes.
  - Delivered / Failed with a reason.
  - Paid / Unpaid.
  - Server counters.
  - The unpaid list grouped by day.
  - Search by order ID, name, phone, address and food.
  - Session restore.
  - jest (`npm test`).

  Delete the "Known bug" paragraph (fixed in Task 6). Keep the GPS sentence ("no live GPS tracking"). Add a line pointing to `docs/superpowers/START-HERE.md`.
- [ ] **Step 2:** Create `docs/DEVICE-CHECKLIST.md` with this manual pass list. The driver account must hold an area in today's sessions, and the scenario comes from Backend `node scripts/dev-scenario.js`.

```markdown
# Delivery app — device checklist

Prerequisites: Backend stack running (owner starts it), `feat/driver-delivery-flow` checked out in Backend and Frontend-Delivery, a delivery-person account assigned to today's sessions (Admin → Meal Sessions → Delivery). Never cancel or edit customer orders from this device.

- [ ] Fresh install → Login → Area selection shows today's sessions; pick an area under "My areas".
- [ ] Kill and reopen the app → lands on Area selection without logging in again.
- [ ] Home header shows area, meal time and the session state.
- [ ] Open session with orders: "Start delivery" is disabled with "Available after ordering closes".
- [ ] Closed session: Start delivery → confirm → alert "<n> orders are on the way"; cards show "On the way"; customer phone gets "Your order is on the way".
- [ ] DELIVERED on an unpaid-pending order → confirm → "Was it paid?" → Paid: To deliver count −1, Delivered +1, Collected rises by the order total.
- [ ] DELIVERED → "Was it paid?" → Not paid: order appears on Pending Payments under Today.
- [ ] Android back on "Was it paid?" closes it without recording a payment.
- [ ] FAILED → empty reason keeps "Mark failed" disabled → enter reason → card moves to the Failed chip with the reason; customer gets "Delivery failed".
- [ ] UNPAID on a waiting order (before delivery) → shows on Pending Payments.
- [ ] Search on Home by order ID, phone and address; on Pending Payments by address.
- [ ] Pending Payments: groups by day, "Today" first, footer Outstanding matches the sum; PAID → confirm → order disappears and the footer drops.
- [ ] Airplane mode on Home → pull to refresh shows the error with Retry; nothing crashes.
- [ ] Logout → login again → no leftover counters from before.
```

- [ ] **Step 3: Commit**

```bash
git add OVERVIEW.md docs/DEVICE-CHECKLIST.md
git commit -m "docs: delivery app overview and device checklist for the driver flow"
```

---

### Task 8: Final whole-branch review and the device pass (controller)

- [ ] Run the final whole-branch review on the most capable model over `git merge-base main HEAD..HEAD`, pointed at the ledger's deferred-minor and `Ruling:` lines. Then one fix dispatch and one scoped re-review (see the SDD skill).
- [ ] Device pass: only when the owner says the Backend branch is deployed locally and a phone is connected. Walk `docs/DEVICE-CHECKLIST.md`, and record pass, fail or not-run per line in the ledger. If no device is available, write "device pass not run" in the final report. Never claim it ran.
- [ ] `superpowers:finishing-a-development-branch`: it asks the owner before any merge, push or PR.

## Self-review (done while writing)

- **Spec coverage:**
  - Session context: Task 3.
  - Home (counters, chips, start, actions, failed reason, "Was it paid?", search, error alerts): Task 4.
  - Pending Payments (all unpaid, grouped by day, totals, search, Paid): Task 5.
  - Session restore and dead gate: Task 6.
  - The jest decision: Task 1. Removing the AsyncStorage counters: Tasks 3, 4, 5 and 6.
- **Names:**
  - `getSessionOrders`, `getUnpaidOrders`, `getSummary`, `startDelivery`, `markDelivered`, `markFailed` and `setPayment` are defined in Task 2 and used with the same signatures in Tasks 4 and 5.
  - `loadSelection` / `saveSelection` / `clearDeliveryStorage` are defined in Task 3 and used in Tasks 4, 5 and 6.
  - The `orderView` exports used by the screens are all defined in Task 2.
- **Copy:** every visible string the tests assert appears verbatim in the code blocks.
