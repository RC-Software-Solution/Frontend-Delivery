# Driver delivery flow — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give delivery persons server support for the full session flow: an area guard, a live session summary, a bulk "start delivery", and a delivery-service proxy that passes session filters and per-call auth through.

**Architecture:** The new order-service code lives in its own files (`utils/driverScope.js`, `utils/driverSummary.js`, `middlewares/requireHeldArea.js`, `controllers/driver.controller.js`), so it can be tested with `require.cache` stubs, the same way `apps/menu-service/src/controllers/sessionDelivery.controller.test.js` is. Driver assignments are read with raw SQL from the menu-service tables (`session_delivery_assignments`, `meal_sessions`) in the shared database, as menu-service already reads `users`. delivery-service stays a thin proxy.

**Tech Stack:** Node 24, Express, Sequelize (MySQL), `node:test` + `node:assert/strict`.

**Spec:** `C:\Users\budglk\RC\Frontend-Delivery\docs\superpowers\specs\2026-10-27-driver-delivery-flow-design.md` (the "Backend contract" section is binding).

**Repo / working directory for every task:** `C:\Users\budglk\RC\Backend`. Plan and spec files live in the Frontend-Delivery repo; read them by absolute path.

## Global Constraints

- Branch: `feat/driver-delivery-flow`, created from `main`. The owner has unrelated **staged** changes on `main` (`.gitignore`, `scripts/sql/2026-09-27-seed-test-data.sql`): never commit, unstage, modify or stash them. Stage only the files your task names, with `git add <paths>`, never `git add -A` or `git add .`.
- Never push, never open a PR, never merge.
- Do NOT run Prettier or any formatter. Don't reformat or whitespace-trim lines you don't change. Preserve each file's line endings.
- No new dependencies.
- TDD: write the test, run it and show it failing, implement, then run it and show it passing.
- Never dispatch subagents.
- Commit messages follow the repo style `feat(order): ...` / `feat(delivery): ...` / `test(...)` / `docs(api): ...`.
- Messages, status codes and field names are exactly as written in the spec and in this plan.
- Every new route must appear in `tests/routes-access.expected.json`, regenerated with `node tests/helpers/routes.js --write`; the diff may add only the new routes. It must also appear in `docs/API.md` and the Postman collection, regenerated with `node scripts/gen-postman.js` after adding an `OVERRIDES` entry. `node scripts/gen-postman.js --check` must pass.
- Repo-level checks that must stay green at the end of every task: `node --test "tests/*.test.js"` (the authz, routes-access, session-window and audit-copies tests). The integration suite needs Docker and is not required.

## File map

| File | Responsibility |
|---|---|
| `apps/order-service/src/utils/driverScope.js` (new) | SQL: the sessions a driver holds for an area today; find a session by date and meal time |
| `apps/order-service/src/middlewares/requireHeldArea.js` (new) | 403 a delivery person acting on an area they don't hold today |
| `apps/order-service/src/utils/driverSummary.js` (new) | Pure counting of orders, parcels and money for a session |
| `apps/order-service/src/controllers/driver.controller.js` (new) | `driverSummary`, `startDelivery` handlers |
| `apps/order-service/src/routes/order.routes.js` (modify) | Mount the guard and the two new routes |
| `apps/delivery-service/src/services/orderServiceClient.js` (modify) | Per-call auth, session filters, new proxies |
| `apps/delivery-service/src/controllers/delivery.controller.js` (modify) | Query validation and pass-through; new handlers |
| `apps/delivery-service/src/routes/delivery.routes.js` (modify) | New routes |
| `apps/delivery-service/package.json` (modify) | `test` script |
| `scripts/gen-postman.js`, `docs/API.md`, `docs/postman/*`, `tests/routes-access.expected.json` | Regenerated docs and access policy |

---

### Task B0: Branch setup

**Files:** none

- [ ] **Step 1:** `git -C C:\Users\budglk\RC\Backend status --short --branch`. Expect `## main...origin/main`, plus `M  .gitignore` and `A  scripts/sql/2026-09-27-seed-test-data.sql` (staged). Anything else: stop and report.
- [ ] **Step 2:** `git switch -c feat/driver-delivery-flow`. Staged changes carry over to the new branch untouched; that is expected. Leave them staged and never include them in a commit.
- [ ] **Step 3:** Add `.superpowers/` to `C:\Users\budglk\RC\Backend\.git\info\exclude` if it isn't already listed (it's a local scratch folder and must stay out of git).
- [ ] **Step 4:** `cd apps/order-service; npm test`. Record the baseline pass count in the report.

(The controller does this before Task B1; there is no commit.)

---

### Task B1: Driver area guard

**Files:**
- Create: `apps/order-service/src/utils/driverScope.js`
- Create: `apps/order-service/src/middlewares/requireHeldArea.js`
- Test: `apps/order-service/src/middlewares/requireHeldArea.test.js`
- Modify: `apps/order-service/src/routes/order.routes.js` (the `router.get('/', getOrders)` line)

**Interfaces:**
- Produces: `heldSessions(userId, areaId, date = colomboToday()) -> Promise<Array<{ id, date, meal_time, start_time, end_time }>>`; `findSession(date, mealTime) -> Promise<{ id, date, meal_time, start_time, end_time } | null>`; the middleware `requireHeldArea(req, res, next)`, which sets `req.heldSessions` for delivery persons.

- [ ] **Step 1: Write the failing test** `apps/order-service/src/middlewares/requireHeldArea.test.js`

```js
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

let held, calls;
const id = path.join(__dirname, '..', 'utils', 'driverScope.js');
require.cache[id] = {
  id, filename: id, loaded: true,
  exports: { heldSessions: async (...args) => { calls.push(args); return held; } },
};
const { requireHeldArea } = require('./requireHeldArea');

const run = async (req) => {
  const res = { code: null, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  let nexted = false;
  await requireHeldArea({ query: {}, body: {}, ...req }, res, () => { nexted = true; });
  return { res, nexted };
};

beforeEach(() => { held = []; calls = []; });

test('admins pass without a lookup', async () => {
  const { nexted } = await run({ user: { id: 'a', role: 'admin' }, query: { area_id: '3' } });
  assert.equal(nexted, true);
  assert.equal(calls.length, 0);
});

test('a driver without area_id passes so the handler can answer its own 400', async () => {
  const { nexted } = await run({ user: { id: 'd', role: 'delivery_person' } });
  assert.equal(nexted, true);
  assert.equal(calls.length, 0);
});

test('a driver who does not hold the area today gets 403', async () => {
  const { res, nexted } = await run({ user: { id: 'd', role: 'delivery_person' }, query: { area_id: '3' } });
  assert.equal(nexted, false);
  assert.equal(res.code, 403);
  assert.deepEqual(res.body, { message: 'You do not cover this area today' });
  assert.deepEqual(calls, [['d', 3]]);
});

test('a driver who holds the area passes, with the sessions attached', async () => {
  held = [{ id: 7, meal_time: 'lunch' }];
  const req = { user: { id: 'd', role: 'delivery_person' }, body: { area_id: 3 }, query: {} };
  const res = { status() { return this; }, json() { return this; } };
  let nexted = false;
  await requireHeldArea(req, res, () => { nexted = true; });
  assert.equal(nexted, true);
  assert.deepEqual(req.heldSessions, held);
});

test('a lookup failure is a 500, not a pass', async () => {
  require.cache[id].exports.heldSessions = async () => { throw new Error('db down'); };
  const { res, nexted } = await run({ user: { id: 'd', role: 'delivery_person' }, query: { area_id: '3' } });
  assert.equal(nexted, false);
  assert.equal(res.code, 500);
  require.cache[id].exports.heldSessions = async (...args) => { calls.push(args); return held; };
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `cd apps/order-service; node --test src/middlewares/requireHeldArea.test.js`
Expected: FAIL with `Cannot find module './requireHeldArea'`.

- [ ] **Step 3: Implement** `apps/order-service/src/utils/driverScope.js`

```js
// Which meal sessions a delivery person covers. The assignment and session tables belong to
// menu-service but live in the same database, so they are read directly (as menu-service reads `users`).
const sequelize = require('../config/database');
const { colomboToday } = require('./sessionWindow');

const SESSION_COLUMNS = 's.id, s.date, s.meal_time, s.start_time, s.end_time';

/** Sessions on `date` (default: today in Sri Lanka) in which `userId` holds `areaId`. */
async function heldSessions(userId, areaId, date = colomboToday()) {
  return sequelize.query(
    `SELECT ${SESSION_COLUMNS}
       FROM session_delivery_assignments a
       JOIN meal_sessions s ON s.id = a.meal_session_id
      WHERE a.user_id = :userId AND a.area_id = :areaId AND s.date = :date`,
    { replacements: { userId, areaId, date }, type: 'SELECT' }
  );
}

/** The session held on `date` for `mealTime`, or null. */
async function findSession(date, mealTime) {
  const rows = await sequelize.query(
    `SELECT ${SESSION_COLUMNS} FROM meal_sessions s WHERE s.date = :date AND s.meal_time = :mealTime LIMIT 1`,
    { replacements: { date, mealTime }, type: 'SELECT' }
  );
  return rows[0] || null;
}

module.exports = { heldSessions, findSession };
```

`apps/order-service/src/middlewares/requireHeldArea.js`:

```js
const driverScope = require('../utils/driverScope');

// Delivery persons may only read or act on an area they hold in one of today's sessions.
// Other roles pass untouched. A missing area_id passes too: each handler answers its own 400.
exports.requireHeldArea = async (req, res, next) => {
  if (req.user?.role !== 'delivery_person') return next();
  const raw = req.query?.area_id ?? req.body?.area_id;
  if (raw === undefined || raw === '') return next();
  try {
    const held = await driverScope.heldSessions(req.user.id, Number(raw));
    if (!held.length) return res.status(403).json({ message: 'You do not cover this area today' });
    req.heldSessions = held;
    next();
  } catch (error) {
    console.error('Driver area check failed:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
```

The middleware calls `driverScope.heldSessions` through the module object (not a destructured import), so the test's swap of the stub takes effect.

In `apps/order-service/src/routes/order.routes.js`, add the import under the other middleware imports:

```js
const { requireHeldArea } = require('../middlewares/requireHeldArea');
```

and change `router.get('/', getOrders);` to:

```js
router.get('/', requireHeldArea, getOrders);
```

- [ ] **Step 4: Run the tests and check that they pass**

Run: `cd apps/order-service; npm test`, then from the repo root `node --test "tests/*.test.js"`.
Expected: everything passes. `routes-access` is unchanged, because the guard isn't a role middleware.

- [ ] **Step 5: Commit**

```bash
git add apps/order-service/src/utils/driverScope.js apps/order-service/src/middlewares/requireHeldArea.js apps/order-service/src/middlewares/requireHeldArea.test.js apps/order-service/src/routes/order.routes.js
git commit -m "feat(order): delivery persons can only list orders for areas they hold today"
```

---

### Task B2: Session summary for drivers

**Files:**
- Create: `apps/order-service/src/utils/driverSummary.js`
- Test: `apps/order-service/src/utils/driverSummary.test.js`
- Create: `apps/order-service/src/controllers/driver.controller.js`
- Test: `apps/order-service/src/controllers/driver.controller.test.js`
- Modify: `apps/order-service/src/routes/order.routes.js`
- Modify: `scripts/gen-postman.js` (OVERRIDES), then regenerate `docs/API.md`, `docs/postman/*` and `tests/routes-access.expected.json`

**Interfaces:**
- Consumes: `findSession` and `requireHeldArea` (`req.heldSessions`) from B1.
- Produces: `summarize(orders) -> Summary` (shape in the spec); `driverSummary` handler at `GET /api/orders/driver-summary`; the internal helper `resolveScope(req, src)` in `driver.controller.js`, which B3 reuses.

- [ ] **Step 1: Write the failing unit test** `apps/order-service/src/utils/driverSummary.test.js`

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('./driverSummary');

const o = (id, status, payment_status, total_price, qtys) =>
  ({ id, status, payment_status, total_price, order_items: qtys.map((quantity) => ({ quantity })) });

test('an empty session is all zeros', () => {
  assert.deepEqual(summarize([]), {
    to_deliver: { orders: 0, parcels: 0 },
    delivered: { orders: 0, parcels: 0 },
    failed: { orders: 0 },
    collected: { orders: 0, amount: 0 },
    unpaid: { orders: 0, amount: 0, list: [] },
  });
});

test('counts orders, parcels and money by status and payment', () => {
  const s = summarize([
    o('A', 'pending', 'pending', '450.00', [1, 1]),
    o('B', 'delivering', 'paid', '300.50', [1]),
    o('C', 'delivered', 'unpaid', '200', [2]),
    o('D', 'completed', 'paid', '100.25', [1]),
    o('E', 'delivery_failed', 'unpaid', '50', [1]),
    o('F', 'cancelled', 'paid', '999', [5]),
  ]);
  assert.deepEqual(s.to_deliver, { orders: 2, parcels: 3 });
  assert.deepEqual(s.delivered, { orders: 2, parcels: 3 });
  assert.deepEqual(s.failed, { orders: 1 });
  assert.deepEqual(s.collected, { orders: 2, amount: 400.75 });
  assert.deepEqual(s.unpaid, { orders: 2, amount: 250, list: [{ order_id: 'C', total_price: 200 }, { order_id: 'E', total_price: 50 }] });
});

test('orders without items count zero parcels', () => {
  assert.deepEqual(summarize([{ id: 'X', status: 'preparing', payment_status: 'pending', total_price: 10 }]).to_deliver, { orders: 1, parcels: 0 });
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `cd apps/order-service; node --test src/utils/driverSummary.test.js`
Expected: FAIL with `Cannot find module './driverSummary'`.

- [ ] **Step 3: Implement** `apps/order-service/src/utils/driverSummary.js`

```js
// Live counters for one area in one meal session, as the driver app shows them.
// Cancelled orders are ignored; amounts are rounded to 2 decimals.
const TO_DELIVER = ['pending', 'preparing', 'delivering'];
const DELIVERED = ['delivered', 'completed'];

const round2 = (n) => Math.round(n * 100) / 100;
const parcelsOf = (order) => (order.order_items || []).reduce((n, item) => n + Number(item.quantity || 0), 0);

function summarize(orders) {
  const s = {
    to_deliver: { orders: 0, parcels: 0 },
    delivered: { orders: 0, parcels: 0 },
    failed: { orders: 0 },
    collected: { orders: 0, amount: 0 },
    unpaid: { orders: 0, amount: 0, list: [] },
  };
  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    const parcels = parcelsOf(order);
    const price = Number(order.total_price || 0);
    if (TO_DELIVER.includes(order.status)) {
      s.to_deliver.orders += 1;
      s.to_deliver.parcels += parcels;
    } else if (DELIVERED.includes(order.status)) {
      s.delivered.orders += 1;
      s.delivered.parcels += parcels;
    } else if (order.status === 'delivery_failed') {
      s.failed.orders += 1;
    }
    if (order.payment_status === 'paid') {
      s.collected.orders += 1;
      s.collected.amount += price;
    } else if (order.payment_status === 'unpaid') {
      s.unpaid.orders += 1;
      s.unpaid.amount += price;
      s.unpaid.list.push({ order_id: order.id, total_price: round2(price) });
    }
  }
  s.collected.amount = round2(s.collected.amount);
  s.unpaid.amount = round2(s.unpaid.amount);
  return s;
}

module.exports = { summarize };
```

- [ ] **Step 4:** Run `node --test src/utils/driverSummary.test.js` and check that it passes.

- [ ] **Step 5: Write the failing controller test** `apps/order-service/src/controllers/driver.controller.test.js`

```js
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Stub models, the SQL scope helper and the user-service client so no DB or network is needed.
let orders, updates, pushes, session, raceIds, findAllArgs;
const stub = (rel, exports) => {
  const id = path.join(__dirname, '..', rel);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
stub('models/index.js', {
  Order: {
    findAll: async (args) => { findAllArgs = args; return orders; },
    update: async (changes, { where }) => { updates.push({ changes, where }); return [raceIds.includes(where.id) ? 0 : 1]; },
  },
  Order_Item: {},
});
stub('utils/driverScope.js', { findSession: async () => session, heldSessions: async () => [] });
stub('services/userServiceClient.js', { notifyUser: async (...args) => { pushes.push(args); } });

const { driverSummary } = require('./driver.controller');

const CLOSED = { id: 7, date: '2020-01-01', meal_time: 'lunch', start_time: '06:00:00', end_time: '09:00:00' };
const driver = (sessions = [CLOSED]) => ({ id: 'd', role: 'delivery_person' , _held: sessions });

const call = async (handler, { query = {}, body = {}, user = driver() } = {}) => {
  const res = { code: 200, json(b) { this.body = b; return this; }, status(c) { this.code = c; return this; } };
  await handler({ query, body, user, heldSessions: user._held }, res);
  return res;
};

beforeEach(() => { orders = []; updates = []; pushes = []; session = null; raceIds = []; findAllArgs = null; });

test('summary: meal_time is required', async () => {
  const res = await call(driverSummary, { query: { area_id: '3' } });
  assert.equal(res.code, 400);
  assert.deepEqual(res.body, { message: 'meal_time must be one of: breakfast, lunch, dinner' });
});

test('summary: area_id is required', async () => {
  const res = await call(driverSummary, { query: { meal_time: 'lunch' } });
  assert.equal(res.code, 400);
  assert.deepEqual(res.body, { message: 'area_id is required' });
});

test('summary: a driver without that session is refused', async () => {
  const res = await call(driverSummary, { query: { area_id: '3', meal_time: 'dinner' } });
  assert.equal(res.code, 403);
  assert.deepEqual(res.body, { message: 'You do not cover this area in that session' });
});

test("summary: counts the driver's held session", async () => {
  orders = [{ id: 'A', status: 'delivering', payment_status: 'paid', total_price: '100', order_items: [{ quantity: 2 }] }];
  const res = await call(driverSummary, { query: { area_id: '3', meal_time: 'lunch' } });
  assert.equal(res.code, 200);
  assert.deepEqual(findAllArgs.where, { area_id: 3, meal_time: 'lunch', target_date: '2020-01-01' });
  assert.equal(res.body.target_date, '2020-01-01');
  assert.deepEqual(res.body.summary.to_deliver, { orders: 1, parcels: 2 });
  assert.deepEqual(res.body.summary.collected, { orders: 1, amount: 100 });
});

test('summary: an admin names a date; an unknown session is 404', async () => {
  const admin = { id: 'a', role: 'admin' };
  assert.equal((await call(driverSummary, { query: { area_id: '3', meal_time: 'lunch', target_date: '2020-01-01' }, user: admin })).code, 404);
  session = CLOSED;
  assert.equal((await call(driverSummary, { query: { area_id: '3', meal_time: 'lunch', target_date: '2020-01-01' }, user: admin })).code, 200);
});

test('summary: an admin date must be YYYY-MM-DD', async () => {
  const res = await call(driverSummary, { query: { area_id: '3', meal_time: 'lunch', target_date: '27/10/2026' }, user: { id: 'a', role: 'admin' } });
  assert.equal(res.code, 400);
  assert.deepEqual(res.body, { message: 'target_date must be YYYY-MM-DD' });
});
```

- [ ] **Step 6:** Run `node --test src/controllers/driver.controller.test.js` and check that it fails with `Cannot find module './driver.controller'`.

- [ ] **Step 7: Implement** `apps/order-service/src/controllers/driver.controller.js`

```js
const { Order, Order_Item } = require('../models');
const { findSession } = require('../utils/driverScope');
const { colomboToday } = require('../utils/sessionWindow');
const { summarize } = require('../utils/driverSummary');

const MEALS = ['breakfast', 'lunch', 'dinner'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Which area and session a request is about. Drivers get the session they hold today
// (req.heldSessions, set by requireHeldArea); admins may name any target_date.
// Returns { areaId, mealTime, session } or { error: [status, message] }.
const resolveScope = async (req, src) => {
  const areaId = Number(src.area_id);
  const mealTime = String(src.meal_time || '').toLowerCase();
  if (src.area_id === undefined || src.area_id === '' || !Number.isInteger(areaId)) return { error: [400, 'area_id is required'] };
  if (!MEALS.includes(mealTime)) return { error: [400, 'meal_time must be one of: breakfast, lunch, dinner'] };
  if (req.user.role === 'delivery_person') {
    const session = (req.heldSessions || []).find((s) => s.meal_time === mealTime);
    if (!session) return { error: [403, 'You do not cover this area in that session'] };
    return { areaId, mealTime, session };
  }
  const date = src.target_date || colomboToday();
  if (!DATE.test(date)) return { error: [400, 'target_date must be YYYY-MM-DD'] };
  const session = await findSession(date, mealTime);
  if (!session) return { error: [404, 'No meal session for that date and meal time'] };
  return { areaId, mealTime, session };
};

// GET /api/orders/driver-summary?area_id&meal_time[&target_date]
exports.driverSummary = async (req, res) => {
  try {
    const scope = await resolveScope(req, req.query || {});
    if (scope.error) return res.status(scope.error[0]).json({ message: scope.error[1] });
    const { areaId, mealTime, session } = scope;
    const orders = await Order.findAll({
      where: { area_id: areaId, meal_time: mealTime, target_date: session.date },
      include: [{ model: Order_Item, as: 'order_items', required: false }],
    });
    res.status(200).json({
      message: 'Driver summary retrieved successfully',
      area_id: areaId,
      meal_time: mealTime,
      target_date: session.date,
      summary: summarize(orders),
    });
  } catch (error) {
    console.error('Error building driver summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resolveScope = resolveScope;
```

The test's `findAllArgs.where` assertion checks only `where`; `include` is allowed alongside it.

In `order.routes.js`, add the import:

```js
const { driverSummary } = require('../controllers/driver.controller');
```

and, directly above `router.get('/', requireHeldArea, getOrders);`:

```js
router.get('/driver-summary', checkRole(['delivery_person', 'admin', 'super_admin']), requireHeldArea, driverSummary);
```

- [ ] **Step 8: Docs and access policy.** In `scripts/gen-postman.js`, add to `OVERRIDES` directly after the `'PUT /api/orders/:order_id/status'` entry:

```js
  'GET /api/orders/driver-summary': {
    query: [
      { key: 'area_id', value: '{{area_id}}' },
      { key: 'meal_time', value: 'lunch' },
      { key: 'target_date', value: '{{today}}', disabled: true },
    ],
    desc: "Live counters for one area in one meal session: to_deliver, delivered, failed, collected, unpaid (with order list). Delivery persons get today's session they hold (403 otherwise); target_date is for admins.",
  },
```

Run `node scripts/gen-postman.js`, `node tests/helpers/routes.js --write`, then `git diff tests/routes-access.expected.json`. Expected: exactly one added line, `"apps/order-service/src/routes/order.routes.js | GET /driver-summary": "login + role: admin, delivery_person, super_admin"`.

- [ ] **Step 9:** Run `cd apps/order-service; npm test`, then from the root `node --test "tests/*.test.js"` and `node scripts/gen-postman.js --check`. All must pass.

- [ ] **Step 10: Commit**

```bash
git add apps/order-service/src/utils/driverSummary.js apps/order-service/src/utils/driverSummary.test.js apps/order-service/src/controllers/driver.controller.js apps/order-service/src/controllers/driver.controller.test.js apps/order-service/src/routes/order.routes.js scripts/gen-postman.js docs/API.md docs/postman tests/routes-access.expected.json
git commit -m "feat(order): driver session summary of parcels, orders and money"
```

---

### Task B3: Bulk start delivery

**Files:**
- Modify: `apps/order-service/src/controllers/driver.controller.js`
- Modify: `apps/order-service/src/controllers/driver.controller.test.js`
- Modify: `apps/order-service/src/routes/order.routes.js`
- Modify: `scripts/gen-postman.js` (OVERRIDES), then regenerate the docs and the access policy

**Interfaces:**
- Consumes: `resolveScope` (B2), `sessionState` (`utils/sessionWindow.js`), `pushMessageFor` (`utils/orderStatus.js`), `userServiceClient.notifyUser(userId, title, body)`.
- Produces: `startDelivery` handler at `POST /api/orders/start-delivery`, response `{ message, moved, order_ids }`.

- [ ] **Step 1: Add the failing tests** to `driver.controller.test.js`. Change the import line to `const { driverSummary, startDelivery } = require('./driver.controller');`, then append:

```js
const { colomboToday } = require('../utils/sessionWindow');
const OPEN = { id: 8, date: colomboToday(), meal_time: 'dinner', start_time: '00:00:00', end_time: '23:59:59' };
const tick = () => new Promise((r) => setImmediate(r));

test('start: refused while ordering is open, nothing written', async () => {
  const res = await call(startDelivery, { body: { area_id: 3, meal_time: 'dinner' }, user: driver([OPEN]) });
  assert.equal(res.code, 409);
  assert.deepEqual(res.body, { message: 'Ordering is still open for this session. Start delivery after it closes.' });
  assert.equal(updates.length, 0);
});

test('start: a driver without that session is refused', async () => {
  const res = await call(startDelivery, { body: { area_id: 3, meal_time: 'breakfast' } });
  assert.equal(res.code, 403);
});

test('start: moves pending and preparing orders to delivering and pushes each customer', async () => {
  orders = [
    { id: 'A', customer_id: 'c1', status: 'pending', meal_time: 'lunch' },
    { id: 'B', customer_id: 'c2', status: 'preparing', meal_time: 'lunch' },
  ];
  const res = await call(startDelivery, { body: { area_id: 3, meal_time: 'lunch' } });
  await tick();
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { message: '2 orders are on the way', moved: 2, order_ids: ['A', 'B'] });
  assert.deepEqual(findAllArgs.where.target_date, '2020-01-01');
  assert.deepEqual(updates.map((u) => [u.where, u.changes]), [
    [{ id: 'A', status: 'pending' }, { status: 'delivering' }],
    [{ id: 'B', status: 'preparing' }, { status: 'delivering' }],
  ]);
  assert.deepEqual(pushes, [['c1', 'Order update', 'Your order is on the way'], ['c2', 'Order update', 'Your order is on the way']]);
});

test('start: an order changed meanwhile is skipped and not pushed', async () => {
  orders = [{ id: 'A', customer_id: 'c1', status: 'pending', meal_time: 'lunch' }];
  raceIds = ['A'];
  const res = await call(startDelivery, { body: { area_id: 3, meal_time: 'lunch' } });
  await tick();
  assert.deepEqual(res.body, { message: '0 orders are on the way', moved: 0, order_ids: [] });
  assert.equal(pushes.length, 0);
});

test('start: a failed push does not fail the request', async () => {
  require.cache[path.join(__dirname, '..', 'services/userServiceClient.js')].exports.notifyUser = async () => { throw new Error('push down'); };
  orders = [{ id: 'A', customer_id: 'c1', status: 'pending', meal_time: 'lunch' }];
  const res = await call(startDelivery, { body: { area_id: 3, meal_time: 'lunch' } });
  await tick();
  assert.equal(res.code, 200);
  require.cache[path.join(__dirname, '..', 'services/userServiceClient.js')].exports.notifyUser = async (...args) => { pushes.push(args); };
});
```

The stub is read at call time (`userServiceClient.notifyUser(...)` inside the handler), so swapping `exports.notifyUser` takes effect. Keep the controller calling it as `userServiceClient.notifyUser`, not as a destructured import.

- [ ] **Step 2:** Run `node --test src/controllers/driver.controller.test.js`. Expect the new tests to FAIL (`startDelivery is not a function`).

- [ ] **Step 3: Implement.** In `driver.controller.js`, add these imports at the top:

```js
const { Op } = require('sequelize');
const userServiceClient = require('../services/userServiceClient');
const { pushMessageFor } = require('../utils/orderStatus');
```

change `const { colomboToday } = require('../utils/sessionWindow');` to `const { colomboToday, sessionState } = require('../utils/sessionWindow');`, and add before `exports.resolveScope = resolveScope;`:

```js
// POST /api/orders/start-delivery { area_id, meal_time[, target_date] }
// After ordering closes, every pending/preparing order of the area and session goes out for delivery at once.
exports.startDelivery = async (req, res) => {
  try {
    const scope = await resolveScope(req, req.body || {});
    if (scope.error) return res.status(scope.error[0]).json({ message: scope.error[1] });
    const { areaId, mealTime, session } = scope;
    if (sessionState(session.date, session.start_time, session.end_time) !== 'closed') {
      return res.status(409).json({ message: 'Ordering is still open for this session. Start delivery after it closes.' });
    }
    const orders = await Order.findAll({
      where: { area_id: areaId, meal_time: mealTime, target_date: session.date, status: { [Op.in]: ['pending', 'preparing'] } },
    });
    const moved = [];
    for (const order of orders) {
      // Keyed on the status we read, so an order an admin changed meanwhile is left alone
      const [updated] = await Order.update({ status: 'delivering' }, { where: { id: order.id, status: order.status } });
      if (!updated) continue;
      moved.push(order.id);
      const push = pushMessageFor({ id: order.id, meal_time: order.meal_time, status: 'delivering' });
      userServiceClient
        .notifyUser(order.customer_id, push.title, push.body)
        .catch((error) => console.error(`Push for order ${order.id} failed:`, error.message));
    }
    res.status(200).json({ message: `${moved.length} orders are on the way`, moved: moved.length, order_ids: moved });
  } catch (error) {
    console.error('Error starting delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

The test's `findAllArgs.where` for start includes `status: { [Op.in]: [...] }`; the test asserts only `target_date`, so that's fine. Because `sequelize` is a real dependency, the real `Op` is used.

In `order.routes.js`, extend the import to `const { driverSummary, startDelivery } = require('../controllers/driver.controller');` and add below the `driver-summary` route:

```js
router.post('/start-delivery', checkRole(['delivery_person', 'admin', 'super_admin']), requireHeldArea, audit('order.start_delivery', 'order', { fields: ['area_id', 'meal_time', 'target_date'] }), startDelivery);
```

- [ ] **Step 4: Docs and access policy.** In `OVERRIDES`, after the `driver-summary` entry, add:

```js
  'POST /api/orders/start-delivery': {
    body: { area_id: '{{area_id}}', meal_time: 'lunch' },
    desc: "After the session's ordering window closes, moves every pending/preparing order of the area and session to `delivering` and pushes each customer. 409 while ordering is open. Delivery persons act on today's session they hold; admins may add target_date.",
  },
```

Run `node scripts/gen-postman.js` and `node tests/helpers/routes.js --write`. The expected diff in `tests/routes-access.expected.json` is one added line: `POST /start-delivery` with `login + role: admin, delivery_person, super_admin`.

- [ ] **Step 5:** Run `cd apps/order-service; npm test`, then `node --test "tests/*.test.js"` and `node scripts/gen-postman.js --check` from the root. All must pass.

- [ ] **Step 6: Commit**

```bash
git add apps/order-service/src/controllers/driver.controller.js apps/order-service/src/controllers/driver.controller.test.js apps/order-service/src/routes/order.routes.js scripts/gen-postman.js docs/API.md docs/postman tests/routes-access.expected.json
git commit -m "feat(order): drivers start delivery for a whole area once ordering closes"
```

---

### Task B4: delivery-service pass-through and per-call auth

**Files:**
- Modify: `apps/delivery-service/src/services/orderServiceClient.js`
- Modify: `apps/delivery-service/src/controllers/delivery.controller.js`
- Test: `apps/delivery-service/src/controllers/delivery.controller.test.js` (new)
- Modify: `apps/delivery-service/src/routes/delivery.routes.js`
- Modify: `apps/delivery-service/package.json` (the `test` script)
- Modify: `scripts/gen-postman.js` (OVERRIDES), then regenerate the docs and the access policy

**Interfaces:**
- Consumes: the order-service endpoints from B2 and B3.
- Produces: the app-facing endpoints:
  - `GET /api/delivery/orders/area?area_id&meal_time&target_date&payment_status(pending|paid|unpaid|any)&type(current|all)&limit`
  - `GET /api/delivery/summary?area_id&meal_time`
  - `POST /api/delivery/orders/start-delivery { area_id, meal_time }`
  - Client methods `getOrdersByArea(areaId, { mealTime, targetDate, paymentStatus, type, limit }, authHeader)`, `updatePaymentStatus(orderId, paymentStatus, authHeader)`, `updateOrderStatus(orderId, status, failureReason, authHeader)` (unchanged), `startDelivery(body, authHeader)` and `getDriverSummary(query, authHeader)`.

- [ ] **Step 1:** In `apps/delivery-service/package.json`, set `"test": "node --test \"src/**/*.test.js\""`.

- [ ] **Step 2: Write the failing test** `apps/delivery-service/src/controllers/delivery.controller.test.js`

```js
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

let calls, reply, failWith;
const clientId = path.join(__dirname, '..', 'services', 'orderServiceClient.js');
const record = (name) => async (...args) => { calls.push([name, ...args]); if (failWith) throw failWith; return reply; };
require.cache[clientId] = {
  id: clientId, filename: clientId, loaded: true,
  exports: {
    getOrdersByArea: record('getOrdersByArea'),
    updatePaymentStatus: record('updatePaymentStatus'),
    updateOrderStatus: record('updateOrderStatus'),
    startDelivery: record('startDelivery'),
    getDriverSummary: record('getDriverSummary'),
  },
};
const { getAreaOrders, updatePaymentStatus, startDelivery, getSummary } = require('./delivery.controller');

const AUTH = 'Bearer driver-token';
const call = async (handler, { query = {}, body = {}, params = {} } = {}) => {
  const res = { code: 200, json(b) { this.body = b; return this; }, status(c) { this.code = c; return this; } };
  await handler({ query, body, params, header: (h) => (h === 'Authorization' ? AUTH : undefined) }, res);
  return res;
};

beforeEach(() => { calls = []; reply = { orders: [] }; failWith = null; });

test('area orders: session filters, type and a 500 default limit are passed through with the caller token', async () => {
  reply = { orders: [{ id: 'A' }] };
  const res = await call(getAreaOrders, { query: { area_id: '3', meal_time: 'lunch', target_date: '2026-10-27', payment_status: 'any', type: 'all' } });
  assert.equal(res.code, 200);
  assert.deepEqual(calls, [['getOrdersByArea', '3', { mealTime: 'lunch', targetDate: '2026-10-27', paymentStatus: 'any', type: 'all', limit: 500 }, AUTH]]);
  assert.equal(res.body.total, 1);
});

test('area orders: legacy date is an alias of target_date; limit is capped at 500', async () => {
  await call(getAreaOrders, { query: { area_id: '3', date: '2026-10-27', limit: '9999' } });
  assert.deepEqual(calls[0][2], { mealTime: undefined, targetDate: '2026-10-27', paymentStatus: 'pending', type: 'current', limit: 500 });
});

test('area orders: bad type, payment_status or date are 400', async () => {
  assert.equal((await call(getAreaOrders, { query: { area_id: '3', type: 'later' } })).code, 400);
  assert.equal((await call(getAreaOrders, { query: { area_id: '3', payment_status: 'ignored' } })).code, 400);
  assert.equal((await call(getAreaOrders, { query: { area_id: '3', target_date: '27-10-2026' } })).code, 400);
  assert.equal(calls.length, 0);
});

test("area orders: order-service's 403 is forwarded unchanged", async () => {
  failWith = Object.assign(new Error('HTTP 403'), { status: 403, body: { message: 'You do not cover this area today' } });
  const res = await call(getAreaOrders, { query: { area_id: '3' } });
  assert.equal(res.code, 403);
  assert.deepEqual(res.body, { message: 'You do not cover this area today' });
});

test('payment: forwards the caller token per call', async () => {
  await call(updatePaymentStatus, { params: { order_id: 'A' }, body: { payment_status: 'paid' } });
  assert.deepEqual(calls, [['updatePaymentStatus', 'A', 'paid', AUTH]]);
});

test('start delivery and summary proxy body/query and return order-service bodies', async () => {
  reply = { message: '1 orders are on the way', moved: 1, order_ids: ['A'] };
  const start = await call(startDelivery, { body: { area_id: 3, meal_time: 'lunch' } });
  assert.deepEqual(start.body, reply);
  reply = { summary: { to_deliver: { orders: 0, parcels: 0 } } };
  const sum = await call(getSummary, { query: { area_id: '3', meal_time: 'lunch' } });
  assert.deepEqual(sum.body, reply);
  assert.deepEqual(calls, [
    ['startDelivery', { area_id: 3, meal_time: 'lunch' }, AUTH],
    ['getDriverSummary', { area_id: '3', meal_time: 'lunch' }, AUTH],
  ]);
});

test('start delivery: a 409 from order-service is forwarded', async () => {
  failWith = Object.assign(new Error('HTTP 409'), { status: 409, body: { message: 'Ordering is still open for this session. Start delivery after it closes.' } });
  const res = await call(startDelivery, { body: { area_id: 3, meal_time: 'lunch' } });
  assert.equal(res.code, 409);
});
```

- [ ] **Step 3:** Run `cd apps/delivery-service; npm test`. Expect FAIL: `startDelivery`/`getSummary` are undefined, and the call shapes differ.

- [ ] **Step 4: Implement the client.** In `orderServiceClient.js`:
  - Remove the `authHeader` constructor parameter and field, the `setAuthHeader` method, and the first three lines of `makeRequest` that inject `this.authHeader`.
  - Replace `getOrdersByArea` and `updatePaymentStatus` with the methods below, and add the two new ones. Keep `updateOrderStatus` as it is.

```js
  /**
   * Orders of one area. paymentStatus 'any' sends no payment filter; type is 'current' or 'all'.
   */
  async getOrdersByArea(areaId, { mealTime, targetDate, paymentStatus = 'pending', type = 'current', limit = 500 } = {}, authHeader) {
    const q = new URLSearchParams({ area_id: String(areaId), type, limit: String(limit) });
    if (paymentStatus && paymentStatus !== 'any') q.set('payment_status', paymentStatus);
    if (mealTime) q.set('meal_time', mealTime);
    if (targetDate) q.set('target_date', targetDate);
    return this.makeRequest(`/api/orders?${q.toString()}`, 'GET', null, { Authorization: authHeader });
  }

  async updatePaymentStatus(orderId, paymentStatus, authHeader) {
    return this.makeRequest(`/api/orders/${orderId}/payment`, 'PUT', { payment_status: paymentStatus }, { Authorization: authHeader });
  }

  async startDelivery(body, authHeader) {
    return this.makeRequest('/api/orders/start-delivery', 'POST', body, { Authorization: authHeader });
  }

  async getDriverSummary(query, authHeader) {
    const q = new URLSearchParams(query);
    return this.makeRequest(`/api/orders/driver-summary?${q.toString()}`, 'GET', null, { Authorization: authHeader });
  }
```

- [ ] **Step 5: Implement the controller.** In `delivery.controller.js`:
  - Replace `getAreaOrders` entirely with the version below.
  - In `updatePaymentStatus`, delete the `orderServiceClient.setAuthHeader(...)` line and call `orderServiceClient.updatePaymentStatus(order_id, payment_status, req.header('Authorization'))`.
  - In `getMyAreaOrders`, delete the `setAuthHeader` line and call `orderServiceClient.getOrdersByArea(userAreaId, { paymentStatus: 'pending' }, req.header('Authorization'))`.
  - Append `startDelivery` and `getSummary`.

```js
const PAYMENT = ['pending', 'paid', 'unpaid', 'any'];
const TYPES = ['current', 'all'];
const MAX_LIMIT = 500;

// Forward order-service's status and body unchanged when it answered; otherwise a 500.
const fail = (res, error, message) => {
  if (error.status) return res.status(error.status).json(error.body);
  console.error(`${message}:`, error);
  return res.status(500).json({ message, error: error.message });
};

/**
 * Orders of one area for the driver app. `date` is accepted as an alias of target_date.
 */
exports.getAreaOrders = async (req, res) => {
  const { area_id, meal_time, payment_status = 'pending', type = 'current' } = req.query;
  const target_date = req.query.target_date || req.query.date;

  if (!area_id) return res.status(400).json({ message: 'area_id is required' });
  if (meal_time && !['breakfast', 'lunch', 'dinner'].includes(meal_time.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid meal_time. Must be one of: breakfast, lunch, dinner' });
  }
  if (!PAYMENT.includes(payment_status)) {
    return res.status(400).json({ message: 'Invalid payment_status. Must be one of: pending, paid, unpaid, any' });
  }
  if (!TYPES.includes(type)) return res.status(400).json({ message: 'Invalid type. Must be one of: current, all' });
  if (target_date && !/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
    return res.status(400).json({ message: 'target_date must be YYYY-MM-DD' });
  }
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || MAX_LIMIT, 1), MAX_LIMIT);

  try {
    const result = await orderServiceClient.getOrdersByArea(
      area_id,
      { mealTime: meal_time, targetDate: target_date, paymentStatus: payment_status, type, limit },
      req.header('Authorization')
    );
    const orders = result.orders || [];
    res.status(200).json({
      message: 'Orders retrieved successfully',
      area_id,
      meal_time: meal_time || 'all',
      target_date: target_date || null,
      payment_status,
      type,
      orders,
      total: orders.length,
    });
  } catch (error) {
    fail(res, error, 'Failed to fetch orders');
  }
};

/**
 * Start delivery for a whole area and session (order-service checks the window and the driver's area)
 */
exports.startDelivery = async (req, res) => {
  try {
    res.status(200).json(await orderServiceClient.startDelivery(req.body, req.header('Authorization')));
  } catch (error) {
    fail(res, error, 'Failed to start delivery');
  }
};

/**
 * Live session counters for the driver's area
 */
exports.getSummary = async (req, res) => {
  try {
    res.status(200).json(await orderServiceClient.getDriverSummary(req.query, req.header('Authorization')));
  } catch (error) {
    fail(res, error, 'Failed to fetch delivery summary');
  }
};
```

In `delivery.routes.js`, add `startDelivery, getSummary` to the controller import and add:

```js
// Live counters (parcels, orders, money) for one area in one session
router.get('/summary', checkRole(['delivery_person', 'admin', 'super_admin']), getSummary);

// Move a whole area's orders to delivering once ordering has closed
router.post('/orders/start-delivery', checkRole(['delivery_person', 'admin', 'super_admin']), startDelivery);
```

- [ ] **Step 6:** Run `cd apps/delivery-service; npm test` and check that it passes. Then run `rg -n "setAuthHeader" apps/delivery-service/src`: expect no matches.

- [ ] **Step 7: Docs and access policy.** In `OVERRIDES`, replace the `'GET /api/delivery/orders/area'` entry with:

```js
  'GET /api/delivery/orders/area': {
    query: [
      { key: 'area_id', value: '{{area_id}}' },
      { key: 'meal_time', value: 'lunch', disabled: true },
      { key: 'target_date', value: '{{today}}', disabled: true },
      { key: 'payment_status', value: 'any', disabled: true },
      { key: 'type', value: 'all', disabled: true },
      { key: 'limit', value: '500', disabled: true },
    ],
    desc: 'payment_status (pending | paid | unpaid | any) defaults to `pending`; type (current | all) defaults to `current`; limit defaults to and is capped at 500. `date` is still accepted as an alias of target_date. Delivery persons get 403 for an area they do not hold today.',
  },
```

and after the `'PUT /api/delivery/orders/:order_id/status'` entry, add:

```js
  'GET /api/delivery/summary': {
    query: [
      { key: 'area_id', value: '{{area_id}}' },
      { key: 'meal_time', value: 'lunch' },
    ],
    desc: 'Proxies GET /api/orders/driver-summary and returns its body unchanged.',
  },
  'POST /api/delivery/orders/start-delivery': {
    body: { area_id: '{{area_id}}', meal_time: 'lunch' },
    desc: 'Proxies POST /api/orders/start-delivery and returns its body (or its 403/409) unchanged.',
  },
```

Run `node scripts/gen-postman.js` and `node tests/helpers/routes.js --write`. The expected access diff is two added delivery-service lines (`GET /summary`, `POST /orders/start-delivery`), both `login + role: admin, delivery_person, super_admin`.

- [ ] **Step 8:** From the root, run `node --test "tests/*.test.js"` and `node scripts/gen-postman.js --check`. Also run `cd apps/order-service; npm test`. All must pass.

- [ ] **Step 9: Commit**

```bash
git add apps/delivery-service/package.json apps/delivery-service/src/services/orderServiceClient.js apps/delivery-service/src/controllers/delivery.controller.js apps/delivery-service/src/controllers/delivery.controller.test.js apps/delivery-service/src/routes/delivery.routes.js scripts/gen-postman.js docs/API.md docs/postman tests/routes-access.expected.json
git commit -m "feat(delivery): session filters, summary and start-delivery proxies; per-call auth"
```

---

### Task B5: Backlog update and live smoke check

**Files:**
- Modify: `BACKLOG.md`

- [ ] **Step 1:** In `BACKLOG.md`, under "Delivery Person", tick (`- [x]`) and append ` — done 2026-10-27 on feat/driver-delivery-flow` to:
  - "No 'mark as Delivered' endpoint." (the status endpoint already existed; B3 adds the bulk start)
  - "No live delivery stats"
  - "No yet-to-be-delivered count endpoint"
  - "Daily unpaid list tracking"

  Under "Cross-cutting", tick the `orderServiceClient` shared-singleton item the same way. Leave "No search by order-code or user-code" open and append: ` — order ID search is done client-side in the driver app; user codes are deferred with the location data-model plan.`
- [ ] **Step 2 (only if the owner's Docker stack is already running; never start or stop containers):** `docker compose -f docker/docker-compose.yml ps` shows order-service and delivery-service up. Then:
  1. Run `node scripts/dev-scenario.js all-open`.
  2. Sign in as a delivery person from the dev accounts (memory `dev-test-environment`) with `curl`. Never print the login response body; extract only the token.
  3. `GET http://127.0.0.1:4003/api/delivery/summary?area_id=<held>&meal_time=<open session>` returns 200 with a `summary`.
  4. `POST /api/delivery/orders/start-delivery` for the open session returns 409.

  Record the status codes in the report. If the stack isn't running, write "smoke check skipped: stack not running" in the report.
- [ ] **Step 3: Commit**

```bash
git add BACKLOG.md
git commit -m "docs(backlog): driver delivery flow items done"
```

---

## Self-review (done while writing)

- **Spec coverage:** the guard (B1), the summary (B2), start delivery with the 409 and per-order conditional updates (B3), the area orders contract and per-call auth (B4). The backlog item for the singleton auth header is closed in B4 and B5.
- **Types and names:**
  - `resolveScope` is defined in B2 and reused in B3.
  - Client method names in B4 match the ones the controller test stubs.
  - The app plan consumes exactly `GET /delivery/orders/area` (type, payment_status=any, target_date, meal_time), `GET /delivery/summary` and `POST /delivery/orders/start-delivery`.
- **Known trade-off (Ruling: drivers need today's hold to see old unpaid orders):** Pending Payments lists unpaid orders from earlier days too, but only for an area the driver holds today. That is consistent with the guard; if the owner wants debt collection without a hold, relax `requireHeldArea` for `payment_status=unpaid` reads in a follow-up.
