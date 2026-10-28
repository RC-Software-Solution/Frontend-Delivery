# START HERE — Driver delivery flow (subagent-driven)

Entry point for any new session or agent working on the RC delivery-person requirements. Read this file fully before touching code.

Last updated: 2026-10-28 · Status: **implemented**. App branch `feat/driver-delivery-flow` is pushed. Backend `main` has the same work locally (fast-forward to `9227696`) and is not pushed. Do not re-run Tasks B0–B5 or app Tasks 0–8.

## 1. What this work is

The delivery app (this repo) meets only 4 of the 14 delivery-person user stories in `../Backend/Meal Order and Delivery Platform.md`. The biggest gap: drivers can't mark orders Delivered. That gap breaks the other apps too:

- **Admin revenue misses driver collections.** Revenue keys on status `completed` + `paid`, and orders never reach `completed`.
- **Customers get no delivery updates.** They never receive "on the way" or "delivered" pushes.
- **Drivers see only part of their list.** They see at most 10 orders, and orders whose delivery failed are hidden.

The fix is two implementation plans, one per repo, sharing one design spec:

| Doc | Path | Run in |
|---|---|---|
| Design spec (binding) | `docs/superpowers/specs/2026-10-27-driver-delivery-flow-design.md` | — |
| Backend plan (Tasks B0–B5) | `docs/superpowers/plans/2026-10-27-driver-delivery-flow-backend.md` | `C:\Users\budglk\RC\Backend` |
| App plan (Tasks 0–8) | `docs/superpowers/plans/2026-10-27-driver-delivery-flow-app.md` | `C:\Users\budglk\RC\Frontend-Delivery` |

## 2. Owner decisions (2026-10-27, binding)

1. **Status flow:** after a session's ordering window closes, the driver taps **Start delivery** per area, and every pending/preparing order goes to `delivering`. Then each order is marked **Delivered** or **Failed** (a reason is required).
2. **Deferred to a later plan:** the hostel, boarding-place and room location model, user codes, and `delivered_by` / per-driver metrics.
3. **Add jest to the delivery app**, mirroring Frontend-Customer's versions and config.
4. **Branches:** a new local `feat/driver-delivery-flow` in both repos. **Never push, never open a PR, never merge.** Backend `main` has the owner's staged `.gitignore` and `scripts/sql/2026-09-27-seed-test-data.sql`: never commit, unstage or modify them.

## 3. Read order for a new session

1. This file.
2. The SDD ledgers, if they exist (section 5). Tasks with a `Task <N>: complete` line are done: never re-dispatch them.
3. The spec.
4. The plan for the repo you're working in: its Global Constraints, then the next incomplete task.
5. Skill files: `superpowers:subagent-driven-development` (the process) and `superpowers:using-git-worktrees` (only if you choose a worktree; plain local branches were approved).

## 4. Execution order

1. **Backend plan first** (B0, then B1 to B5). The app's device check depends on it; the app's jest tests don't.
2. **App plan** (Task 0, then Tasks 1 to 7). It may start as soon as the Backend plan is approved, because the app tests mock the services.
3. **App Task 8:** the final whole-branch reviews (one per repo) and the device pass when a phone and the Backend branch are available.
4. `superpowers:finishing-a-development-branch` for each repo. It asks the owner before any merge or push.

Never run two implementers at once, and never run Backend and app implementers in parallel. One task at a time.

## 5. Where progress is tracked (survives context loss)

- Backend ledger: `C:\Users\budglk\RC\Frontend-Delivery\.superpowers\sdd\2026-10-27-driver-delivery-flow-backend\progress.md`
- App ledger: `C:\Users\budglk\RC\Frontend-Delivery\.superpowers\sdd\2026-10-27-driver-delivery-flow-app\progress.md`
- First line of each: `# SDD ledger — plan: <absolute plan path>`
- Per-task briefs, reports and review packages go in the same folder (`task-<N>-brief.md`, `task-<N>-report.md`, ...).
- `.superpowers/` is scratch: add it to `.git/info/exclude` in both repos (App Task 0 / Backend Task B0). Never commit it.
- Review packages for Backend tasks must be built from the Backend repo: `git -C C:\Users\budglk\RC\Backend log/diff <BASE>..<HEAD>`, redirected to a file in the ledger folder.
- After compaction, trust the ledger and `git log` over memory.

Ledger line formats (from the skill):
- `Task <N>: complete (commits <base7>..<head7>, review clean)`
- `Task <N>: fix round <R>/5 (<X> addressed, <Y> open — ...; commits a..b)`
- `Task <N>: minor (deferred): <one-liner>`
- `Ruling: <what> — <why> — <cost if wrong>`

## 6. Models

Always set the model explicitly on each dispatch:
- **Implementers and task reviewers:** `claude-sonnet-5-5-high`. The cheaper `composer-2.5-fast` is fine for implementers on tasks whose plan text contains the complete code: Backend B1, B2 and B5, and App Tasks 1, 3 and 7.
- **Fix rounds 4–5:** a tier up (`claude-opus-5-5-high`).
- **Final whole-branch reviews:** `claude-opus-5-5-high`.

## 7. Rules to paste into every implementer dispatch

```
Binding rules (RC driver delivery flow):
- Repo and branch are named in your brief. Work on branch feat/driver-delivery-flow only. Never push, never open a PR, never merge.
- Backend only: the owner's staged .gitignore and scripts/sql/2026-09-27-seed-test-data.sql must stay exactly as they are. Stage only the files your task lists (git add <paths>), never git add -A / git add .
- Do NOT run Prettier or any formatter; do not reformat or whitespace-trim lines you do not change; keep line endings as they are (Frontend-Delivery: LF in git, CRLF checkout via autocrlf).
- No new dependencies (the only exception is App Task 1's listed dev dependencies at the listed versions). Never use `npx --yes` or unpinned downloads.
- TDD: show the failing test output, then the passing output. Copy exact strings, status codes and names from the brief.
- Never dispatch subagents (not helpers, not reviewers).
- Never touch a phone/device, Docker containers, or the database unless your brief says so explicitly.
- Gates: Backend: `npm test` in each touched service + `node --test "tests/*.test.js"` + `node scripts/gen-postman.js --check` from the repo root. App: `npx jest`, `npx tsc --noEmit` (baseline clean), `npx expo lint` (baseline 0 errors / 23 warnings).
- Write the full report to the report path you were given; reply only with status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), commit hashes, a one-line test summary, and concerns. Be honest: failing output is reported as failing.
```

## 8. Environment notes

- Windows 10/11, PowerShell. `rg` is available. Node 24.
- Backend: per-service tests use `node --test` (`apps/order-service`: `npm test`; `apps/delivery-service` gets a `test` script in B4). Repo-level policy tests live in `tests/`.
  - When routes change, regenerate `tests/routes-access.expected.json` with `node tests/helpers/routes.js --write`.
  - Regenerate the API docs with `node scripts/gen-postman.js`, after adding an `OVERRIDES` entry in that script.
- Backend services share one MySQL database. Driver-to-area assignments live in `session_delivery_assignments` + `meal_sessions` (owned by menu-service).
- Delivery app: Expo SDK 58, expo-router, axios via `services/clients/base-api.client.ts`. Dev API hosts come from Metro's LAN IP (`services/config/api.config.ts`); delivery-service runs on port 4003.
- Device work (App Task 8 only): needs the owner's go-ahead, a connected phone, and the Backend branch running. The owner starts and stops Docker; agents never do.

## 9. Audit summary (2026-10-27, why this plan exists)

| # | Delivery-person story | Before | After both plans |
|---|---|---|---|
| 1 | Sign in | Done | Done + session restore |
| 2 | View all orders | Partial (10-order cap, payment-pending only) | Done |
| 3 | Choose area | Done (sessions, take/release) | Done |
| 4 | Order details | Partial | Done except hostel/room (deferred) |
| 5 | Search order/user code | Partial | Order ID/name/phone/address/food; user code deferred |
| 6 | Mark Delivered | Missing | Done |
| 7 | Live counts after delivering | Partial (local, paid-only) | Done (server) |
| 8 | Unpaid without Delivered | Done | Done |
| 9 | Unpaid list | Partial (failed orders hidden) | Done |
| 10 | Search unpaid | Partial | Partial: hostel names deferred |
| 11 | Mark Paid | Done | Done |
| 12 | Daily unpaid list | Partial | Done (grouped by day) |
| 13 | To-deliver counts | Partial | Done |
| 14 | Counts move on delivery | Missing | Done |

Cross-repo bugs these plans fix:
- The 10-order cap (B4).
- `completed` never reached, so revenue misses collections (B3 + App Task 4).
- No customer delivery pushes (B3 + App Task 4).
- Failed orders hidden from the unpaid list (B4 + App Task 5).
- The session date and meal time not applied to the order list (B4 + App Task 4).
- A driver could read any area (B1).
- delivery-service's shared auth-header singleton (B4).
- No session restore and the dead login gate (App Task 6).

Still open after both plans (the next plan's scope):
- Location data model (hostel, boarding place, room) and user codes. This needs Customer signup changes, user-service and order-service.
- `delivered_by` on orders and the Admin per-driver metrics.
- `GET /api/users/:userId` being unauthenticated (Backend BACKLOG).
- Debt collection for areas a driver no longer holds today (see the Ruling at the end of the Backend plan).

## 10. Prompt to start (or resume) a session

```
Continue the RC driver delivery flow using superpowers:subagent-driven-development.
Start by reading C:\Users\budglk\RC\Frontend-Delivery\docs\superpowers\START-HERE.md and follow it exactly:
check both SDD ledgers (section 5) and resume at the first task without a "complete" line —
Backend plan first, then the app plan. Never push, never open a PR, never touch the owner's staged
Backend files, never touch a device or Docker unless a task says so. At the end, report commits,
test results against the baselines, and every "Ruling:" line from the ledgers with its cost if wrong.
```

## 11. Status log

Append one line per session: date, what finished, where it stopped.

- 2026-10-27: audit done; spec and both plans written; owner decisions recorded. Nothing executed.
- 2026-10-27: Backend B0–B5 and app Tasks 0–8 implemented and reviewed. Backend `ba5b742..9227696`. App `85fd2df..c194316`.
- 2026-10-28: device checklist passed on the Samsung in Expo Go, including a cleared-data login. Customer pushes were not received: Expo Go does not load FCM, and no test customer has a token. Backend `main` fast-forwarded locally; not pushed. App branch pushed.
