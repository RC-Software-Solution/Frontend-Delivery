# RC Delivery App UI Modernization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the delivery app around the rider: a glanceable areas screen for the handlebar, a one-hand stops screen for the drop-off, a handover that survives mistaken taps and lost signal, in English and Sinhala.

**Architecture:** Same Expo / expo-router app. A token theme and a small UI kit (ported from Frontend-Customer, adjusted for sunlight and 56/64 dp targets), a string layer with English and Sinhala dictionaries, a settings store (language, handover style), and one offline action queue that every driver write goes through. New navigation: tabs Areas / Unpaid / Settings, with Stops and Manage areas as stack screens. No backend change.

**Tech Stack:** Expo SDK 58, React Native 0.88, expo-router 58, Reanimated 4, AsyncStorage, jest-expo 58 + @testing-library/react-native 14. One dependency added: `expo-keep-awake` (already installed with Expo).

**Spec:** `docs/superpowers/specs/2026-10-29-driver-ui-modernization-design.md` (read it first; it is binding). Client note: `docs/client-notes/2026-10-29-kitchen-parcel-labels.md`.

## Global Constraints

- Every text colour pair ≥ 7:1 (placeholders ≥ 4.5:1), enforced by `theme/__tests__/contrast.test.ts`.
- Body text ≥ 18; area counts ≥ 40; names on stop cards ≥ 22.
- Every tappable control ≥ 56 dp high; handover buttons ≥ 64 dp; ≥ 16 dp between the two handover buttons.
- Layouts work at font scale 1.3.
- No new dependency except `expo-keep-awake` (Task 12). Never `npx --yes`; never an unpinned download.
- Animate only `opacity`/`transform` with Reanimated; no blur.
- Lists are `FlatList`/`SectionList` with `keyExtractor`; row shadows `elevation ≤ 2`.
- No user-visible string is written in a screen or component: every string comes from `i18n/en.ts` and `i18n/si.ts` via `useT()`. The two dictionaries have the same keys.
- No hard-coded colour or font size in `screens/` or `components/` outside `components/ui/` (which reads tokens).
- Sentence case; no all-caps labels.
- Light mode only (`app.json` `userInterfaceStyle: "light"`).
- Do NOT run Prettier or any formatter; do not reformat or whitespace-trim lines you do not change; keep line endings (LF in git, CRLF checkout via autocrlf).
- TDD: show the failing test output, then the passing output.
- One local commit per task (repo style `feat(scope): ...` / `fix(scope): ...` / `docs: ...`), a separate commit per fix round. Never push, never open a PR, never merge.
- Gates for every task: `npx jest` green, `npx tsc --noEmit` 0 errors, `npx expo lint` 0 errors and ≤ 19 warnings.

---

## Deviation from the writing-plans norm (deliberate, one)

The screens' exact look depends on mockups the owner has not approved yet (Phase 1). As in the customer app's plan, Phases 0–2 carry full step-level detail now. Phase 3 tasks carry their files, interfaces, behaviour, complete tests and the logic code; the **layout values** (spacing, which token goes where, arrangement on the card) are written into each Phase 3 task by the controller **after Gate 1**, from the approved boards, as one docs commit before Task 12 starts. Phase 3 must not start before that commit exists.

## Owner decisions

C1–C11 in spec §2 are binding (2026-10-29). P1–P7 in spec §6.10 are proposed defaults; the owner confirms or changes them at Gate 1. If a P decision changes, the controller edits the affected task text before dispatching it and records a `Ruling:` line.

## Execution rules

- Branch `feat/driver-ui-modernization` (already created from `feat/driver-delivery-flow` at `e0b853a`). Work in the main checkout; no worktree (Metro and the phone are wired to it).
- SDD ledger: `.superpowers/sdd/2026-10-29-driver-ui-modernization/progress.md` (first line `# SDD ledger — plan: C:\Users\budglk\RC\Frontend-Delivery\docs\superpowers\plans\2026-10-29-driver-ui-modernization.md`). Briefs, reports and review packages live next to it. `.superpowers/` stays out of git (`.git/info/exclude`).
- Ledger line formats: `Task <N>: complete (commits <a>..<b>, review clean)`, `Task <N>: fix round <R>/5 (...)`, `Task <N>: minor (deferred): ...`, `Ruling: <what> — <why> — <cost if wrong>`.
- Models: implementers and task reviewers `claude-sonnet-5-5-high`; fix rounds 4–5 and the final whole-branch review `claude-opus-5-5-high`. Always set the model explicitly.
- One implementer at a time. Implementers never dispatch subagents.
- Never claim parity with a mockup. Gate pages list every remaining difference and its owning task.

## Environment notes

- Windows, PowerShell. `rg` available. Node 24. Run shell scripts with Git Bash (`bash scripts/x.sh`).
- Phone: Samsung SM-A057F over USB, Expo Go. adb at `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`. Screenshots from Bash only: `"$ADB" exec-out screencap -p > file.png` (PowerShell pipes corrupt PNGs). Find elements by label with `"$ADB" shell uiautomator dump /sdcard/ui.xml && "$ADB" pull /sdcard/ui.xml`, never fixed coordinates.
- Metro: the owner runs it. Do not start a second one. The Expo Go project URL is `exp://<LAN IP>:8081` (read the IP from the owner's Metro output; the customer app used `192.168.1.164`).
- Backend: `C:\Users\budglk\RC\Backend`, read-only for this plan. The owner starts and stops Docker. Test data: `node scripts/dev-scenario.js accounts` (once), then `node scripts/dev-scenario.js states` (breakfast closed, lunch open, dinner later). Driver account: `flow.delivery@test.local` / `Passw0rd!`; it must be assigned to today's sessions by the owner in Admin → Meal Sessions → Delivery before any device step. Never print login response bodies.
- `.expo/types/router.d.ts` is generated by Metro and gitignored. After routes change (Task 12), `tsc` may report a route-type error until Metro regenerates it; restart Metro (owner) or report it as the known environment error. It is not a code defect.

**Device safety (every device step repeats it):** never press a confirm that writes to the server unless the task says so: Start delivery's "Start", "Yes, delivered" / "Paid" / "Not paid" / "Mark failed" / "Mark paid", Take / Release area. Open a popup, screenshot it, close it with Back / Cancel. Never change the phone's font size, display size or density, Wi-Fi or airplane mode unless the task says so, and always restore Wi-Fi. If adb shows "Allow USB debugging?" press Cancel and report it. Finish every device task signed in as `flow.delivery@test.local`.

---

# PHASE 0 — Audit

**Phase gate:** after Task 3 the owner reads the audit report. Do not start Phase 1 before the owner says so.

### Task 1: Ledger and measurement scripts

**Files:**
- Create: `scripts/asset-weight.sh`, `scripts/perf-frames.sh`
- Modify: `.gitattributes` (create if missing) — `*.sh text eol=lf`
- Create (git-excluded): `.superpowers/sdd/2026-10-29-driver-ui-modernization/progress.md`

**Interfaces:** Produces `bash scripts/asset-weight.sh` (prints one line per referenced raster asset and a `TOTAL` line) and `bash scripts/perf-frames.sh <label>` (prints gfxinfo frame stats after scrolling the current screen).

- [ ] **Step 1: Exclude the scratch folder and open the ledger**

```powershell
Add-Content .git/info/exclude ".superpowers/"
New-Item -ItemType Directory -Force .superpowers/sdd/2026-10-29-driver-ui-modernization | Out-Null
Set-Content .superpowers/sdd/2026-10-29-driver-ui-modernization/progress.md "# SDD ledger — plan: C:\Users\budglk\RC\Frontend-Delivery\docs\superpowers\plans\2026-10-29-driver-ui-modernization.md"
```

- [ ] **Step 2: Write `scripts/asset-weight.sh`**

```bash
#!/usr/bin/env bash
# Size of every raster asset the app actually requires (Metro bundles only these), plus the total.
cd "$(dirname "$0")/.." || exit 1
grep -rhoE "assets/[A-Za-z0-9_./ ()-]+\.(png|jpg|jpeg|webp|gif)" \
  --include=*.tsx --include=*.ts --include=*.json \
  screens components app services constants styles app.json 2>/dev/null | sort -u |
while read -r f; do [ -f "$f" ] && printf '%s\t%s\n' "$(stat -c %s "$f")" "$f"; done | sort -rn |
awk -F'\t' '{t+=$1; printf "%7.0f KB  %s\n",$1/1024,$2} END {printf "%7.0f KB  TOTAL (budget: 1500 KB)\n",t/1024}'
```

- [ ] **Step 3: Write `scripts/perf-frames.sh`**

```bash
#!/usr/bin/env bash
# Usage: bash scripts/perf-frames.sh <label>
# Open the screen to measure on the phone first (a list with enough orders to scroll).
# Scrolls the list four times down and four times up, then prints the frame statistics.
ADB="${ADB:-$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe}"
PKG=host.exp.exponent
"$ADB" shell dumpsys gfxinfo "$PKG" reset >/dev/null
for _ in 1 2 3 4; do "$ADB" shell input swipe 540 1700 540 600 250; sleep 0.4; done
for _ in 1 2 3 4; do "$ADB" shell input swipe 540 600 540 1700 250; sleep 0.4; done
echo "== $1"
"$ADB" shell dumpsys gfxinfo "$PKG" | grep -E "Total frames rendered|Janky frames|50th percentile|90th percentile|95th percentile|99th percentile"
```

- [ ] **Step 4: `.gitattributes`**

Add the line `*.sh text eol=lf` (create the file if it does not exist; keep any existing lines).

- [ ] **Step 5: Run the asset script**

Run: `bash scripts/asset-weight.sh`
Expected: one line per asset (at least `assets/images/rc.jpg`) and a `TOTAL` line. Record the total in the ledger as the asset baseline.

- [ ] **Step 6: Commit**

```bash
git add scripts/asset-weight.sh scripts/perf-frames.sh .gitattributes
git commit -m "chore(audit): asset-weight and perf-frames scripts"
```

### Task 2: Capture every screen, popup and state on the phone

**Files:**
- Create: `docs/superpowers/ui-audit/before/*.png` (screenshots), `docs/superpowers/ui-audit/before/dumps/*.xml` (uiautomator dumps of the same screens)
- Create: `docs/superpowers/perf-baseline.md`

**Precondition:** the owner has started the Backend and Metro, assigned `flow.delivery@test.local` to today's sessions in at least two areas, and run `node scripts/dev-scenario.js states`. Ask the owner whether any orders in those areas are `delivering`; if none, the Delivered / Failed / "Was it paid?" popups can only be captured if the owner allows one **Start delivery** on the breakfast (closed) session. Record the answer as a `Ruling:`.

- [ ] **Step 1: The capture list (one PNG + one dump each, file names as listed)**

| File | How to reach it |
|---|---|
| `01-login-empty.png` | Signed out, cold start |
| `02-login-required.png` | Press LOGIN with both fields empty |
| `03-login-wrong.png` | Valid email, wrong password (`Wrong-pass-1!`), LOGIN |
| `04-login-success-alert.png` | Correct password; the "Login Successful" alert (press Continue afterwards) |
| `05-area-loading.png` | Area selection while loading (screenshot immediately after Continue; if missed, note "not captured") |
| `06-area-list.png` | Area selection with session chips and My / Unassigned / Covered groups |
| `07-area-other-session.png` | Tap the other session chip |
| `08-home-open-session.png` | Choose an area in the open (lunch) session: Home with "Available after ordering closes" |
| `09-home-closed-session.png` | Back, choose an area in the closed (breakfast) session: Home with Start delivery enabled |
| `10-home-start-confirm.png` | Press Start delivery: the confirm popup (press Back unless the owner allowed one Start) |
| `11-home-filter-delivered.png`, `12-home-filter-all.png` | The Delivered and All chips |
| `13-home-search.png` | Type part of a customer name into Search |
| `14-home-delivered-confirm.png` | DELIVERED on a delivering order: confirm popup (Back) |
| `15-home-fail-reason.png` | FAILED: the reason popup (Back) |
| `16-home-paid-confirm.png`, `17-home-unpaid-confirm.png` | PAID and UNPAID confirm popups (Back) |
| `18-home-summary-overlap.png` | Scroll to the bottom: the counters panel over the list |
| `19-payments.png` | Orders tab (Pending Payments) |
| `20-payments-confirm.png` | PAID on a payments card (Back) |
| `21-home-offline.png` | Wi-Fi off (`"$ADB" shell svc wifi disable`), pull to refresh on Home; then `svc wifi enable` and confirm with `"$ADB" shell dumpsys wifi | grep -i "Wi-Fi is"` |
| `22-tabbar.png` | Crop not needed: any screen with the tab bar |
| `23-home-fontscale-1.3.png` | **Only if the owner allows a font-scale change:** `"$ADB" shell settings put system font_scale 1.3`, screenshot Home, then `settings put system font_scale 1.0` |

For each, save the screenshot (`"$ADB" exec-out screencap -p > docs/superpowers/ui-audit/before/<file>`) and the dump (`uiautomator dump`, pull to `dumps/<same name>.xml`). Anything that cannot be reached is listed in the report with the reason, never faked.

- [ ] **Step 2: Frame-time baseline**

On Home with the longest list available: `bash scripts/perf-frames.sh before-home` three times, then the same on Pending Payments (`before-payments`). Write `docs/superpowers/perf-baseline.md`:

```markdown
# Performance baseline — 2026-10-29 (before)

Device: Samsung SM-A057F, Expo Go, flow.delivery@test.local, <area>, <n> orders.

| Run | Screen | Total frames | Janky % | p50 | p90 | p95 | p99 |
|---|---|---|---|---|---|---|---|
| 1 | Home | ... |
...

Median janky: Home <x> %, Payments <y> %. Assets: <total> KB (scripts/asset-weight.sh).
```

- [ ] **Step 3: Finish safely**

Wi-Fi on, font scale 1.0, signed in as `flow.delivery@test.local`, no write confirmed (unless the owner allowed the one Start delivery).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/ui-audit/before docs/superpowers/perf-baseline.md
git commit -m "docs(audit): before screenshots, UI dumps and frame-time baseline"
```

### Task 3: Audit report

**Files:**
- Create: `docs/superpowers/ui-audit/2026-10-29-driver-ui-audit.md`

- [ ] **Step 1: Measure from the dumps and the code**

1. **Touch targets.** From each dump, list every clickable node with its `bounds`; convert px to dp (`dp = px / (density / 160)`; the SM-A057F reports density with `"$ADB" shell wm density`). Flag every control under 56 dp high and every pair of adjacent action buttons closer than 16 dp.
2. **Text sizes.** List every `fontSize` per screen from the code (`rg -n "fontSize" screens components`).
3. **Contrast.** For every text colour / background pair in the code, the WCAG ratio (use the `contrast` helper from `../Frontend-Customer/theme/__tests__/contrast.test.ts`, run with `node -e`). Flag < 7:1.
4. **Literals.** Count of hex colours and font sizes per file (`rg -c "#[0-9a-fA-F]{3,8}\b|fontSize" screens components`).
5. **Taps per job.** Count the taps for: deliver one paid order; deliver one unpaid order; fail one order; mark one unpaid order paid; switch to another area.
6. **Behaviour gaps** seen on the phone (anything that differs from `docs/DEVICE-CHECKLIST.md`).

- [ ] **Step 2: Write the report**

Sections: Summary (five most serious findings for a rider), Screens and popups (one row per capture with the PNG path and what is wrong), Touch targets, Text sizes, Contrast, Literals, Taps per job, Behaviour gaps, Frame times and assets (from Task 2), What the spec §5 got right or wrong (confirm or correct each row). Use the spec's language rules: plain sentences, no shorthand.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/ui-audit/2026-10-29-driver-ui-audit.md
git commit -m "docs(audit): driver app UI audit report"
```

**PHASE 0 GATE (stop here).** Show the owner the report's Summary and the five worst screenshots. Do not continue until the owner says so.

---

# PHASE 1 — Mockups

### Task 4: Mock boards

**Files:**
- Create: `docs/superpowers/mockups/driver-ui-mockups.html` (one self-contained file: inline CSS, no CDN, no web fonts, system font stack `system-ui, "Noto Sans Sinhala", "Iskoola Pota", sans-serif`)

**Visual references:** the customer app's tokens (`../Frontend-Customer/theme/index.ts`), Admin's approved mockups (`../Admin/docs/superpowers/mockups/admin-ui-mockups.html`), and spec §6.9 (the tokens and sizes are binding; use exactly those hex values and type sizes).

- [ ] **Step 1: Board list (each board is a 390 × 844 phone frame with an id equal to its name; a board picker at the top of the page)**

| Board | Content |
|---|---|
| `SignIn` | Spec §6.10 P6: no "Remember me", language switch EN / සිං, error banner |
| `Areas-1area` | One area: name, "8 orders · 12 parcels to deliver" at count size, done line, session state, meal switcher hidden |
| `Areas-3areas` | Three areas, meal switcher (Breakfast / Lunch / Dinner), one area "All delivered", "3 updates waiting to send" line, Manage areas link |
| `Areas-states` | Loading skeleton, not assigned today, no areas in this meal, offline error |
| `Stops-hostel` | Counts strip, Start delivery banner (disabled with caption), search, filter chips, an address group header "Hostel A · 4 orders", four cards incl. two with the same name showing "Phone …4567" |
| `Stops-house` | Cards for houses with the Call button prominent |
| `Card-states` | One card each: Waiting, On the way (two-step buttons), On the way (one-choice buttons), Waiting to send, Not sent (refused, with Dismiss), Delivered paid, Delivered not paid, Failed with reason |
| `Handover-twostep` | The "Was it paid?" sheet (name, `#ref`, amount, Paid / Not paid / Back) and the already-paid variant (Delivered / Back) |
| `Handover-onetap` | The card with Delivered, not paid (left) and Delivered, paid (right), then the Undo bar with countdown |
| `Failed` | The reason sheet with the four preset chips, text box, disabled and enabled Mark failed |
| `More` | The More sheet: Mark paid / Mark not paid / payment correction |
| `Unpaid` | Day groups ("Today · 2 orders · Rs 650"), cards with Mark paid, footer Outstanding, the Mark paid confirm sheet |
| `Settings` | Language (English / සිංහල), Handover style (two choices with one-line explanations), account name, Log out, and the blocked-logout message |
| `ManageAreas` | Meal chips, My areas with a separate Release button, Free areas with Take, Covered (disabled) |
| `TabBar` | Areas / Unpaid / Settings, labels always visible, active pill |
| `Sinhala` | `Areas-3areas`, `Stops-hostel`, `Handover-twostep` and `Settings` again with every string from the Sinhala draft (Task 8's `si.ts` text) |

- [ ] **Step 2: Sticky notes**

On the page, a yellow note per open decision (P1–P7 from spec §6.10) with the default and the alternative, so the owner can answer them while reviewing.

- [ ] **Step 3: Self-check**

Open the file with the Playwright MCP over a local server (file: URLs are blocked):
`python -I -m http.server 8765 --bind 127.0.0.1 --directory docs/superpowers/mockups` (start it in the background; stop only that process afterwards, found by its PID via `netstat -ano | findstr 8765`). Check every board renders, Sinhala glyphs render, nothing overflows its 390 px frame.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/mockups/driver-ui-mockups.html
git commit -m "docs(mockups): driver app mock boards"
```

### Task 5: PNG renders and the mockup gate page

**Files:**
- Create: `docs/superpowers/mockups/png/<Board>.png` (one per board, 390 px wide, device scale factor 2)
- Create: `docs/superpowers/mockups/README.md`

- [ ] **Step 1: Render**

With the Task 4 server running, use the Playwright MCP: viewport 390 × 844, navigate to `http://127.0.0.1:8765/driver-ui-mockups.html#<Board>`, screenshot the board element into the repo's `.playwright-mcp` folder, move each PNG to `docs/superpowers/mockups/png/`, delete `.playwright-mcp`, stop the server by PID.

- [ ] **Step 2: Gate page**

`README.md`: one section per board with its PNG (`![Areas-3areas](png/Areas-3areas.png)`), two lines on what the board shows and which spec section it implements, then "Decisions to confirm" (P1–P7 with default and alternative), then "Not in the mockups" (anything the spec requires that no board shows).

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/mockups/png docs/superpowers/mockups/README.md
git commit -m "docs(mockups): rendered boards and the mockup gate page"
```

**PHASE 1 GATE (stop here).** Show the owner `docs/superpowers/mockups/README.md` (and offer the HTML). Collect: approval or change requests per board, and answers to P1–P7. Change requests go back into Task 4 as fix rounds. When approved, record `Mocks: approved by product owner <date>` and each P answer as a `Ruling:` in the ledger, then write the Phase 3 layout detail into this plan (docs commit `docs(plan): phase 3 layout detail from the approved mockups`). The approved boards are then the visual spec for Phase 3.

---

# PHASE 2 — Foundation

No screen changes look different in this phase except the light-mode lock. Gate: jest / tsc / lint only.

### Task 6: Tokens, contrast test, light mode

**Files:**
- Create: `theme/index.ts`, `theme/__tests__/contrast.test.ts`
- Modify: `app.json` (`"userInterfaceStyle": "automatic"` → `"light"`)

**Interfaces:**
- Produces: `color`, `status`, `space`, `radius`, `type`, `shadow`, `touch` from `@/theme`; `StatusKey = keyof typeof status`.

- [ ] **Step 1: Write the failing test** `theme/__tests__/contrast.test.ts`

```ts
import { color, status, touch, type } from '@/theme';

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const AAA = 7;

const textPairs: [string, string, string][] = [
  ['ink on surface', color.ink, color.surface],
  ['ink on page bg', color.ink, color.bg],
  ['ink on field', color.ink, color.field],
  ['muted on surface', color.muted, color.surface],
  ['muted on page bg', color.muted, color.bg],
  ['muted on field', color.muted, color.field],
  ['onBrand on brand fill', color.onBrand, color.brand],
  ['brandStrong on surface', color.brandStrong, color.surface],
  ['brandStrong on page bg', color.brandStrong, color.bg],
  ['brandStrong on brandSoft', color.brandStrong, color.brandSoft],
  ['danger on surface', color.danger, color.surface],
  ['onDanger on danger fill', color.onDanger, color.danger],
  ['onInk on ink fill', color.onInk, color.ink],
];

test.each(textPairs)('%s reaches 7:1', (_name, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AAA);
});

test.each(Object.entries(status))('status chip "%s" reaches 7:1', (_name, { fg, bg }) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AAA);
});

test('placeholders reach 4.5:1 on the field grey', () => {
  expect(contrast(color.subtle, color.field)).toBeGreaterThanOrEqual(4.5);
});

test('borders reach 3:1 (non-text)', () => {
  expect(contrast(color.border, color.surface)).toBeGreaterThanOrEqual(3);
});

test('the brand and attention fills are never text colours (they cannot pass)', () => {
  expect(contrast(color.brand, color.surface)).toBeLessThan(AAA);
  expect(contrast(color.attention, color.surface)).toBeLessThan(AAA);
});

test('rider sizes from the spec', () => {
  expect(type.body).toBeGreaterThanOrEqual(18);
  expect(type.title).toBeGreaterThanOrEqual(22);
  expect(type.count).toBeGreaterThanOrEqual(40);
  expect(touch.min).toBeGreaterThanOrEqual(56);
  expect(touch.primary).toBeGreaterThanOrEqual(64);
  expect(touch.gap).toBeGreaterThanOrEqual(16);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest theme/__tests__/contrast.test.ts`
Expected: FAIL, `Cannot find module '@/theme'`.

- [ ] **Step 3: Write `theme/index.ts`**

```ts
// Ratios measured 2026-10-29 (spec §6.9). Text pairs reach 7:1 for sunlight; the test enforces it.
export const color = {
  brand: '#69bf70', // FILL ONLY: 2.26:1 on white
  onBrand: '#0A0A0F', // text on the brand fill, 8.73:1
  brandStrong: '#1B5E20', // green text and icons, 7.87:1 on white
  brandSoft: '#EEF7EF', // tinted brand background
  ink: '#0A0A0F',
  onInk: '#FFFFFF',
  muted: '#4A4A4A', // secondary text, 8.86:1 on white
  subtle: '#5A5A5A', // placeholders only, 5.94:1 on field
  bg: '#F3F5F0', // Admin "Paper"
  surface: '#FFFFFF',
  field: '#ECEFEA',
  border: '#8A968C', // non-text, 3.08:1
  danger: '#A12622', // 7.46:1 on white
  onDanger: '#FFFFFF',
  attention: '#E0A100', // amber FILL ONLY (icons, bars): needs a human
  scrim: 'rgba(10,10,15,0.55)', // sheet backdrop, not a text colour
} as const;

// Chips: driver-facing statuses and payment states. Every pair ≥ 7:1.
export const status = {
  waiting: { fg: '#6B4500', bg: '#FFF3D6' },
  on_the_way: { fg: '#4A2390', bg: '#EFE7FB' },
  delivered: { fg: '#14501A', bg: '#E4F4E6' },
  failed: { fg: '#8E1F1B', bg: '#FDE8E7' },
  cancelled: { fg: '#3D3D3D', bg: '#EEEEEE' },
  paid: { fg: '#14501A', bg: '#E4F4E6' },
  unpaid: { fg: '#6B4500', bg: '#FFF3D6' },
} as const;
export type StatusKey = keyof typeof status;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
export const type = { micro: 14, caption: 16, body: 18, title: 22, h1: 28, count: 40 } as const;
export const touch = { min: 56, primary: 64, gap: 16 } as const;

export const shadow = {
  card: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  bar: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
} as const;

export const theme = { color, status, space, radius, type, touch, shadow };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest theme/__tests__/contrast.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Light mode**

In `app.json` change `"userInterfaceStyle": "automatic"` to `"userInterfaceStyle": "light"`. Run `npx jest` (all green), `npx tsc --noEmit` (0), `npx expo lint` (0 errors, ≤ 19 warnings).

- [ ] **Step 6: Commit**

```bash
git add theme app.json
git commit -m "feat(theme): rider tokens with a 7:1 contrast test; lock light mode"
```

### Task 7: UI kit

**Files:**
- Create: `components/ui/AppText.tsx`, `components/ui/AppButton.tsx`, `components/ui/Card.tsx`, `components/ui/Chip.tsx`, `components/ui/EmptyState.tsx`, `components/ui/Sheet.tsx`
- Test: `components/__tests__/ui.test.tsx`

**Interfaces:**
- Consumes: `@/theme` (Task 6).
- Produces:
  - `AppText({ variant?: keyof typeof type = 'body', tone?: 'ink'|'muted'|'brand'|'danger'|'onBrand'|'onInk'|'onDanger' = 'ink', weight?: 'regular'|'semibold'|'bold' = 'regular', ...TextProps })`
  - `AppButton({ title, onPress, variant?: 'primary'|'secondary'|'danger'|'outline'|'ink' = 'primary', size?: 'md'|'lg' = 'md', icon?: IoniconName, loading?, disabled?, style?, accessibilityLabel? })` — `md` = 56 dp min height, `lg` = 64 dp
  - `Card(ViewProps)`
  - `Chip({ label: string, tone: StatusKey })`
  - `EmptyState({ icon, title, message?, actionLabel?, onAction?, tone?: 'brand'|'error' })`
  - `Sheet({ visible, onClose, children, testID? })` — bottom sheet in a transparent `Modal`; backdrop press and Android back call `onClose`.

- [ ] **Step 1: Write the failing tests** `components/__tests__/ui.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { Sheet } from '../ui/Sheet';
import { color, status, touch, type } from '@/theme';

it('AppText uses the token size and tone, and never sets a font family', async () => {
  await render(<AppText variant="title" tone="brand" weight="bold">Kasun</AppText>);
  const style = StyleSheet.flatten(screen.getByText('Kasun').props.style);
  expect(style.fontSize).toBe(type.title);
  expect(style.color).toBe(color.brandStrong);
  expect(style.fontWeight).toBe('700');
  expect(style.fontFamily).toBeUndefined();
});

it('AppButton is a labelled button at least 56 dp high, 64 dp when large', async () => {
  const onPress = jest.fn();
  await render(
    <>
      <AppButton title="Delivered" onPress={onPress} />
      <AppButton title="Delivered, paid" size="lg" onPress={onPress} />
    </>,
  );
  const md = screen.getByRole('button', { name: 'Delivered' });
  const lg = screen.getByRole('button', { name: 'Delivered, paid' });
  expect(StyleSheet.flatten(md.props.style).minHeight).toBe(touch.min);
  expect(StyleSheet.flatten(lg.props.style).minHeight).toBe(touch.primary);
  await fireEvent.press(md);
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('AppButton does nothing while loading or disabled and says so', async () => {
  const onPress = jest.fn();
  await render(<AppButton title="Paid" onPress={onPress} disabled />);
  const b = screen.getByRole('button', { name: 'Paid' });
  expect(b.props.accessibilityState).toMatchObject({ disabled: true });
  await fireEvent.press(b);
  expect(onPress).not.toHaveBeenCalled();
});

it('Chip paints its status pair', async () => {
  await render(<Chip label="On the way" tone="on_the_way" />);
  expect(StyleSheet.flatten(screen.getByText('On the way').props.style).color).toBe(status.on_the_way.fg);
});

it('EmptyState shows its action only with both a label and a handler', async () => {
  const onAction = jest.fn();
  await render(<EmptyState icon="cloud-offline-outline" title="No orders here" actionLabel="Try again" onAction={onAction} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(onAction).toHaveBeenCalled();
});

it('Sheet renders its children only while visible and closes from the backdrop', async () => {
  const onClose = jest.fn();
  const { rerender } = await render(<Sheet visible={false} onClose={onClose}><Text>Was it paid?</Text></Sheet>);
  expect(screen.queryByText('Was it paid?')).toBeNull();
  await rerender(<Sheet visible onClose={onClose}><Text>Was it paid?</Text></Sheet>);
  expect(screen.getByText('Was it paid?')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('sheet-backdrop'));
  expect(onClose).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest components/__tests__/ui.test.tsx`
Expected: FAIL, `Cannot find module '../ui/AppButton'`.

- [ ] **Step 3: Write the kit**

`components/ui/AppText.tsx`:

```tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { color, type } from '@/theme';

const tones = {
  ink: color.ink,
  muted: color.muted,
  brand: color.brandStrong, // the fill green fails contrast as text
  danger: color.danger,
  onBrand: color.onBrand,
  onInk: color.onInk,
  onDanger: color.onDanger,
} as const;

const weights = { regular: '400', semibold: '600', bold: '700' } as const;

// The big sizes stop growing at 1.3x so a handlebar screen keeps its layout; body text scales freely.
const capped: Partial<Record<keyof typeof type, number>> = { h1: 1.3, count: 1.3 };

export type AppTextProps = TextProps & {
  variant?: keyof typeof type;
  tone?: keyof typeof tones;
  weight?: keyof typeof weights;
};

export function AppText({ variant = 'body', tone = 'ink', weight = 'regular', style, ...rest }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={capped[variant]}
      style={[{ fontSize: type[variant], color: tones[tone], fontWeight: weights[weight] }, style]}
      {...rest}
    />
  );
}
```

`components/ui/AppButton.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { color, radius, space, touch } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ink';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const look: Record<Variant, { fill: string; label: 'onBrand' | 'ink' | 'onDanger' | 'onInk'; ink: string; border?: string }> = {
  primary: { fill: color.brand, label: 'onBrand', ink: color.onBrand },
  secondary: { fill: color.field, label: 'ink', ink: color.ink },
  danger: { fill: color.danger, label: 'onDanger', ink: color.onDanger },
  outline: { fill: 'transparent', label: 'ink', ink: color.ink, border: color.ink },
  ink: { fill: color.ink, label: 'onInk', ink: color.onInk },
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const inert = disabled || loading;
  const l = look[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={[
        {
          minHeight: size === 'lg' ? touch.primary : touch.min,
          backgroundColor: l.fill,
          borderRadius: radius.pill,
          paddingHorizontal: space.lg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inert ? 0.5 : 1,
          ...(l.border ? { borderWidth: 2, borderColor: l.border } : null),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={l.ink} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          {icon ? <Ionicons name={icon} size={24} color={l.ink} /> : null}
          <AppText weight="bold" tone={l.label}>{title}</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}
```

`components/ui/Card.tsx`:

```tsx
import React from 'react';
import { View, ViewProps } from 'react-native';
import { color, radius, shadow, space } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[{ backgroundColor: color.surface, borderRadius: radius.lg, padding: space.md, ...shadow.card }, style]} {...rest} />;
}
```

`components/ui/Chip.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { radius, space, status, StatusKey } from '@/theme';
import { AppText } from './AppText';

export function Chip({ label, tone }: { label: string; tone: StatusKey }) {
  const { fg, bg } = status[tone];
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs }}>
      <AppText variant="micro" weight="bold" style={{ color: fg }}>{label}</AppText>
    </View>
  );
}
```

`components/ui/EmptyState.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { color, space, status } from '@/theme';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function EmptyState({ icon, title, message, actionLabel, onAction, tone = 'brand' }: {
  icon: IconName; title: string; message?: string; actionLabel?: string; onAction?: () => void; tone?: 'brand' | 'error';
}) {
  const disc = tone === 'error' ? status.failed : { fg: color.brandStrong, bg: color.brandSoft };
  return (
    <View style={{ alignItems: 'center', padding: space.lg, gap: space.sm }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: disc.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={36} color={disc.fg} />
      </View>
      <AppText variant="title" weight="bold" style={{ textAlign: 'center' }}>{title}</AppText>
      {message ? <AppText tone="muted" style={{ textAlign: 'center' }}>{message}</AppText> : null}
      {actionLabel && onAction ? <AppButton title={actionLabel} onPress={onAction} style={{ alignSelf: 'stretch', marginTop: space.md }} /> : null}
    </View>
  );
}
```

`components/ui/Sheet.tsx`:

```tsx
import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, space } from '@/theme';

export function Sheet({ visible, onClose, children, testID }: { visible: boolean; onClose: () => void; children: React.ReactNode; testID?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable testID="sheet-backdrop" accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: color.scrim }} />
        <View testID={testID} style={{ backgroundColor: color.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, paddingBottom: space.lg + insets.bottom, gap: space.md }}>
          {children}
        </View>
      </View>
    </Modal>
  );
}
```

The backdrop's `accessibilityLabel="Close"` becomes translated in Task 8 (Step 6 there).

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest components/__tests__/ui.test.tsx`
Expected: PASS (6 tests). Then `npx jest`, `npx tsc --noEmit`, `npx expo lint`.

- [ ] **Step 5: Commit**

```bash
git add components/ui components/__tests__/ui.test.tsx
git commit -m "feat(ui): rider UI kit (text, buttons, card, chip, empty state, sheet)"
```

### Task 8: Settings and the English / Sinhala string layer

**Files:**
- Create: `i18n/en.ts`, `i18n/si.ts`, `i18n/translate.ts`, `services/settings/settings.ts`, `services/settings/SettingsContext.tsx`
- Test: `i18n/__tests__/strings.test.ts`, `services/settings/__tests__/settings.test.tsx`
- Modify: `components/ui/Sheet.tsx` (translated backdrop label)

**Interfaces:**
- Produces:
  - `type Language = 'en' | 'si'`; `type StringKey = keyof typeof en`
  - `translate(lang: Language, key: StringKey, params?: Record<string, string | number>): string`
  - `type HandoverStyle = 'two_step' | 'one_tap'`; `interface Settings { language: Language; handover: HandoverStyle }`; `DEFAULT_SETTINGS = { language: 'en', handover: 'two_step' }`
  - `loadSettings(): Promise<Settings>`, `saveSettings(s: Settings): Promise<void>` (AsyncStorage key `rc_settings`)
  - `SettingsProvider({ children })`, `useSettings(): { settings: Settings; update(patch: Partial<Settings>): Promise<void>; ready: boolean }`, `useT(): (key: StringKey, params?) => string`
  - Without a provider, `useSettings()` returns the defaults and `useT()` returns English, so screen tests do not need a provider.

- [ ] **Step 1: Write the failing tests**

`i18n/__tests__/strings.test.ts`:

```ts
import en from '../en';
import si from '../si';
import { translate } from '../translate';

const placeholders = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort();

it('English and Sinhala have exactly the same keys', () => {
  expect(Object.keys(si).sort()).toEqual(Object.keys(en).sort());
});

it('no string is empty, and both languages use the same placeholders', () => {
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    expect(en[key].trim()).not.toBe('');
    expect(si[key].trim()).not.toBe('');
    expect(placeholders(si[key])).toEqual(placeholders(en[key]));
  }
});

it('fills placeholders, repeatedly', () => {
  expect(translate('en', 'areas.toDeliver', { orders: 8, parcels: 12 })).toBe('8 orders · 12 parcels to deliver');
  expect(translate('si', 'areas.toDeliver', { orders: 8, parcels: 12 })).toContain('8');
});

it('no English all-caps labels', () => {
  for (const v of Object.values(en)) expect(v).not.toMatch(/\b[A-Z]{3,}\b/);
});
```

`services/settings/__tests__/settings.test.tsx`:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../settings';
import { SettingsProvider, useSettings, useT } from '../SettingsContext';

beforeEach(() => AsyncStorage.clear());

it('defaults to English and two steps, and ignores a broken stored value', async () => {
  expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  await AsyncStorage.setItem('rc_settings', '{"language":"fr","handover":"x"}');
  expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  await AsyncStorage.setItem('rc_settings', 'not json');
  expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
});

it('round-trips the settings', async () => {
  await saveSettings({ language: 'si', handover: 'one_tap' });
  expect(await loadSettings()).toEqual({ language: 'si', handover: 'one_tap' });
});

function Probe() {
  const t = useT();
  const { settings, update } = useSettings();
  return (
    <>
      <Text>{t('tabs.areas')}</Text>
      <Text>{settings.handover}</Text>
      <Pressable accessibilityRole="button" onPress={() => update({ language: 'si' })}><Text>switch</Text></Pressable>
    </>
  );
}

it('without a provider the app reads English defaults', async () => {
  await render(<Probe />);
  expect(screen.getByText('Areas')).toBeTruthy();
  expect(screen.getByText('two_step')).toBeTruthy();
});

it('the provider loads the stored language and switches at once, persisting it', async () => {
  await saveSettings({ language: 'en', handover: 'one_tap' });
  await render(<SettingsProvider><Probe /></SettingsProvider>);
  expect(await screen.findByText('one_tap')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'switch' }));
  expect(await screen.findByText('ප්‍රදේශ')).toBeTruthy();
  await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem('rc_settings'))!).language).toBe('si'));
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest i18n services/settings`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `i18n/en.ts`**

```ts
// Every user-visible string. Keys are shared with si.ts (a test enforces it). Placeholders: {name}.
const en = {
  'common.tryAgain': 'Try again',
  'common.back': 'Back',
  'common.close': 'Close',
  'common.refresh': 'Refresh',
  'common.loading': 'Loading',
  'common.dismiss': 'Dismiss',
  'common.amount': 'Rs {amount}',
  'common.offline': 'Check your connection and try again.',
  'common.serverError': 'Something went wrong. Please try again.',
  'common.searchPlaceholder': 'Search name, #ref or phone',

  'meal.breakfast': 'Breakfast',
  'meal.lunch': 'Lunch',
  'meal.dinner': 'Dinner',
  'session.closed': 'Delivery time',
  'session.open': 'Ordering open',
  'session.upcoming': 'Ordering not open yet',

  'tabs.areas': 'Areas',
  'tabs.unpaid': 'Unpaid',
  'tabs.settings': 'Settings',

  'status.waiting': 'Waiting',
  'status.on_the_way': 'On the way',
  'status.delivered': 'Delivered',
  'status.failed': 'Failed',
  'status.cancelled': 'Cancelled',
  'pay.paid': 'Paid',
  'pay.unpaid': 'Not paid',

  'areas.title': 'My areas',
  'areas.toDeliver': '{orders} orders · {parcels} parcels to deliver',
  'areas.done': '{delivered} delivered · {collected} collected',
  'areas.allDelivered': 'All delivered',
  'areas.noSession': 'You are not assigned to a meal session today. Please contact an administrator.',
  'areas.noAreas': 'You have no areas in this meal.',
  'areas.manage': 'Manage areas',
  'areas.loadError': "Couldn't load your areas",
  'areas.countError': "Couldn't load this area's counts",

  'queue.waiting': '{count} updates waiting to send',
  'queue.cardWaiting': 'Waiting to send',
  'queue.cardRefused': 'Not sent: {message}',

  'stops.toDeliver': 'To deliver',
  'stops.delivered': 'Delivered',
  'stops.collected': 'Collected',
  'stops.unpaid': 'Unpaid',
  'stops.ordersParcels': '{orders} orders · {parcels} parcels',
  'stops.filter.to_deliver': 'To deliver',
  'stops.filter.delivered': 'Delivered',
  'stops.filter.failed': 'Failed',
  'stops.filter.all': 'All',
  'stops.group': '{address} · {count} orders',
  'stops.noAddress': 'No address',
  'stops.empty': 'No orders here',
  'stops.loadError': "Couldn't load the orders",
  'stops.start': 'Start delivery',
  'stops.startAfterClose': 'Available after ordering closes',
  'stops.startTitle': 'Start delivery?',
  'stops.startMessage': 'Waiting orders in {area} will be marked "On the way" and their customers notified.',
  'stops.startConfirm': 'Start',
  'stops.started': 'Delivery started',
  'stops.call': 'Call {name}',
  'stops.more': 'More',
  'stops.parcels': '{count} parcels',
  'stops.phoneEnding': 'Phone …{digits}',
  'stops.reason': 'Reason: {reason}',

  'handover.delivered': 'Delivered',
  'handover.failed': 'Failed',
  'handover.deliveredPaid': 'Delivered, paid',
  'handover.deliveredNotPaid': 'Delivered, not paid',
  'handover.wasItPaid': 'Was it paid?',
  'handover.confirmDelivered': 'Mark delivered?',
  'handover.undo': 'Undo',
  'handover.undoBar': 'Delivered to {name} · {payment}',
  'handover.sendingIn': 'Sending in {seconds} s',

  'fail.title': 'Delivery failed',
  'fail.placeholder': 'What happened? (required)',
  'fail.submit': 'Mark failed',
  'fail.reason.notThere': 'Customer not there',
  'fail.reason.noAnswer': 'Phone not answered',
  'fail.reason.wrongAddress': 'Wrong address',
  'fail.reason.refused': 'Refused the order',

  'more.title': 'Order {ref}',
  'more.markPaid': 'Mark paid',
  'more.markUnpaid': 'Mark not paid',
  'confirm.paidTitle': 'Mark paid?',
  'confirm.unpaidTitle': 'Mark not paid?',
  'confirm.orderLine': '{name} · {ref} · {amount}',

  'unpaid.title': 'Unpaid orders',
  'unpaid.group': '{label} · {count} orders · {amount}',
  'unpaid.today': 'Today',
  'unpaid.undated': 'Undated',
  'unpaid.outstanding': 'Outstanding: {count} orders · {amount}',
  'unpaid.empty': 'No unpaid orders',
  'unpaid.loadError': "Couldn't load unpaid orders",

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.english': 'English',
  'settings.sinhala': 'සිංහල',
  'settings.handover': 'Handing over an order',
  'settings.twoStep': 'Two steps',
  'settings.twoStepHelp': 'Tap Delivered, then answer "Was it paid?"',
  'settings.oneTap': 'One tap, with Undo',
  'settings.oneTapHelp': 'Tap Delivered, paid or Delivered, not paid. Undo for {seconds} seconds.',
  'settings.account': 'Signed in as {name}',
  'settings.logout': 'Log out',
  'settings.logoutBlocked': '{count} updates are not sent yet. Connect to the internet to send them before logging out.',

  'login.title': 'Sign in',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.showPassword': 'Show password',
  'login.hidePassword': 'Hide password',
  'login.emailRequired': 'Email is required',
  'login.passwordRequired': 'Password is required',
  'login.invalid': 'Invalid email or password. Please try again',
  'login.notDriver': 'Only delivery personnel are allowed to access this application',
  'login.pending': 'Your account is pending approval. Please contact support',
  'login.deleted': 'Your account has been deleted. Please contact support',

  'manage.title': 'Manage areas',
  'manage.mine': 'My areas',
  'manage.free': 'Free areas',
  'manage.taken': 'Covered by other drivers',
  'manage.take': 'Take',
  'manage.release': 'Release',
  'manage.takeError': 'Could not take this area',
  'manage.releaseError': 'Could not release this area',

  'error.update': 'Could not update',
} as const;

export default en;
```

- [ ] **Step 4: Write `i18n/si.ts`** (draft; a native speaker reviews it before release, spec §6.7)

```ts
import type en from './en';

// DRAFT Sinhala. Must be reviewed by a native speaker chosen by the client before release.
const si: Record<keyof typeof en, string> = {
  'common.tryAgain': 'නැවත උත්සාහ කරන්න',
  'common.back': 'ආපසු',
  'common.close': 'වසන්න',
  'common.refresh': 'නැවුම් කරන්න',
  'common.loading': 'පූරණය වෙමින්',
  'common.dismiss': 'ඉවත් කරන්න',
  'common.amount': 'රු. {amount}',
  'common.offline': 'ඔබේ අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කර නැවත උත්සාහ කරන්න.',
  'common.serverError': 'යම් දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.',
  'common.searchPlaceholder': 'නම, #අංකය හෝ දුරකථනය සොයන්න',

  'meal.breakfast': 'උදේ ආහාරය',
  'meal.lunch': 'දිවා ආහාරය',
  'meal.dinner': 'රාත්‍රී ආහාරය',
  'session.closed': 'බෙදාහැරීමේ වේලාව',
  'session.open': 'ඇණවුම් විවෘතයි',
  'session.upcoming': 'ඇණවුම් තවම විවෘත නැත',

  'tabs.areas': 'ප්‍රදේශ',
  'tabs.unpaid': 'නොගෙවූ',
  'tabs.settings': 'සැකසුම්',

  'status.waiting': 'රැඳී ඇත',
  'status.on_the_way': 'මඟ දී',
  'status.delivered': 'බෙදාහැරියා',
  'status.failed': 'අසාර්ථකයි',
  'status.cancelled': 'අවලංගුයි',
  'pay.paid': 'ගෙවා ඇත',
  'pay.unpaid': 'ගෙවා නැත',

  'areas.title': 'මගේ ප්‍රදේශ',
  'areas.toDeliver': 'බෙදාහැරීමට ඇණවුම් {orders} · පාර්සල් {parcels}',
  'areas.done': 'බෙදාහැරූ {delivered} · එකතු කළ {collected}',
  'areas.allDelivered': 'සියල්ල බෙදාහැර ඇත',
  'areas.noSession': 'අද ඔබට කිසිදු ආහාර වාරයක් පවරා නැත. කරුණාකර පරිපාලකයෙකු අමතන්න.',
  'areas.noAreas': 'මෙම ආහාර වාරයේ ඔබට ප්‍රදේශ නැත.',
  'areas.manage': 'ප්‍රදේශ කළමනාකරණය',
  'areas.loadError': 'ඔබේ ප්‍රදේශ පූරණය කළ නොහැකි විය',
  'areas.countError': 'මෙම ප්‍රදේශයේ ගණන් පූරණය කළ නොහැකි විය',

  'queue.waiting': 'යැවීමට බලාපොරොත්තුවෙන් යාවත්කාලීන {count}',
  'queue.cardWaiting': 'යැවීමට බලාපොරොත්තුවෙන්',
  'queue.cardRefused': 'යැවුණේ නැත: {message}',

  'stops.toDeliver': 'බෙදාහැරීමට',
  'stops.delivered': 'බෙදාහැරූ',
  'stops.collected': 'එකතු කළ',
  'stops.unpaid': 'නොගෙවූ',
  'stops.ordersParcels': 'ඇණවුම් {orders} · පාර්සල් {parcels}',
  'stops.filter.to_deliver': 'බෙදාහැරීමට',
  'stops.filter.delivered': 'බෙදාහැරූ',
  'stops.filter.failed': 'අසාර්ථක',
  'stops.filter.all': 'සියල්ල',
  'stops.group': '{address} · ඇණවුම් {count}',
  'stops.noAddress': 'ලිපිනයක් නැත',
  'stops.empty': 'මෙහි ඇණවුම් නැත',
  'stops.loadError': 'ඇණවුම් පූරණය කළ නොහැකි විය',
  'stops.start': 'බෙදාහැරීම අරඹන්න',
  'stops.startAfterClose': 'ඇණවුම් වැසූ පසු ලබාගත හැක',
  'stops.startTitle': 'බෙදාහැරීම අරඹන්නද?',
  'stops.startMessage': '{area} හි රැඳී ඇති ඇණවුම් "මඟ දී" ලෙස සලකුණු කර පාරිභෝගිකයින්ට දැනුම් දෙනු ඇත.',
  'stops.startConfirm': 'අරඹන්න',
  'stops.started': 'බෙදාහැරීම ආරම්භ විය',
  'stops.call': '{name} අමතන්න',
  'stops.more': 'තවත්',
  'stops.parcels': 'පාර්සල් {count}',
  'stops.phoneEnding': 'දුරකථනය …{digits}',
  'stops.reason': 'හේතුව: {reason}',

  'handover.delivered': 'බෙදාහැරියා',
  'handover.failed': 'අසාර්ථකයි',
  'handover.deliveredPaid': 'බෙදාහැරියා, ගෙව්වා',
  'handover.deliveredNotPaid': 'බෙදාහැරියා, ගෙව්වේ නැත',
  'handover.wasItPaid': 'මුදල් ගෙව්වාද?',
  'handover.confirmDelivered': 'බෙදාහැරූ ලෙස සලකුණු කරන්නද?',
  'handover.undo': 'අහෝසි කරන්න',
  'handover.undoBar': '{name} වෙත බෙදාහැරියා · {payment}',
  'handover.sendingIn': 'තත්පර {seconds} කින් යවයි',

  'fail.title': 'බෙදාහැරීම අසාර්ථකයි',
  'fail.placeholder': 'සිදු වූයේ කුමක්ද? (අවශ්‍යයි)',
  'fail.submit': 'අසාර්ථක ලෙස සලකුණු කරන්න',
  'fail.reason.notThere': 'පාරිභෝගිකයා එහි නැත',
  'fail.reason.noAnswer': 'දුරකථනයට පිළිතුරු නැත',
  'fail.reason.wrongAddress': 'වැරදි ලිපිනය',
  'fail.reason.refused': 'ඇණවුම ප්‍රතික්ෂේප කළා',

  'more.title': 'ඇණවුම {ref}',
  'more.markPaid': 'ගෙවූ ලෙස සලකුණු කරන්න',
  'more.markUnpaid': 'නොගෙවූ ලෙස සලකුණු කරන්න',
  'confirm.paidTitle': 'ගෙවූ ලෙස සලකුණු කරන්නද?',
  'confirm.unpaidTitle': 'නොගෙවූ ලෙස සලකුණු කරන්නද?',
  'confirm.orderLine': '{name} · {ref} · {amount}',

  'unpaid.title': 'නොගෙවූ ඇණවුම්',
  'unpaid.group': '{label} · ඇණවුම් {count} · {amount}',
  'unpaid.today': 'අද',
  'unpaid.undated': 'දිනයක් නැත',
  'unpaid.outstanding': 'ගෙවිය යුතු: ඇණවුම් {count} · {amount}',
  'unpaid.empty': 'නොගෙවූ ඇණවුම් නැත',
  'unpaid.loadError': 'නොගෙවූ ඇණවුම් පූරණය කළ නොහැකි විය',

  'settings.title': 'සැකසුම්',
  'settings.language': 'භාෂාව',
  'settings.english': 'English',
  'settings.sinhala': 'සිංහල',
  'settings.handover': 'ඇණවුමක් භාර දීම',
  'settings.twoStep': 'පියවර දෙකක්',
  'settings.twoStepHelp': '"බෙදාහැරියා" ඔබා, පසුව "මුදල් ගෙව්වාද?" යන්නට පිළිතුරු දෙන්න',
  'settings.oneTap': 'එක් ස්පර්ශයක්, අහෝසි කිරීම සමඟ',
  'settings.oneTapHelp': '"බෙදාහැරියා, ගෙව්වා" හෝ "බෙදාහැරියා, ගෙව්වේ නැත" ඔබන්න. තත්පර {seconds} ක් අහෝසි කළ හැක.',
  'settings.account': '{name} ලෙස පිවිස ඇත',
  'settings.logout': 'ඉවත් වන්න',
  'settings.logoutBlocked': 'යාවත්කාලීන {count} ක් තවම යවා නැත. ඉවත් වීමට පෙර ඒවා යැවීමට අන්තර්ජාලයට සම්බන්ධ වන්න.',

  'login.title': 'පිවිසෙන්න',
  'login.email': 'ඊමේල්',
  'login.password': 'මුරපදය',
  'login.submit': 'පිවිසෙන්න',
  'login.showPassword': 'මුරපදය පෙන්වන්න',
  'login.hidePassword': 'මුරපදය සඟවන්න',
  'login.emailRequired': 'ඊමේල් අවශ්‍යයි',
  'login.passwordRequired': 'මුරපදය අවශ්‍යයි',
  'login.invalid': 'වැරදි ඊමේල් හෝ මුරපදය. නැවත උත්සාහ කරන්න',
  'login.notDriver': 'මෙම යෙදුමට පිවිසිය හැක්කේ බෙදාහරින්නන්ට පමණි',
  'login.pending': 'ඔබේ ගිණුම අනුමැතිය සඳහා රැඳී ඇත. කරුණාකර සහාය අමතන්න',
  'login.deleted': 'ඔබේ ගිණුම මකා දමා ඇත. කරුණාකර සහාය අමතන්න',

  'manage.title': 'ප්‍රදේශ කළමනාකරණය',
  'manage.mine': 'මගේ ප්‍රදේශ',
  'manage.free': 'නිදහස් ප්‍රදේශ',
  'manage.taken': 'වෙනත් බෙදාහරින්නන් ආවරණය කරයි',
  'manage.take': 'ගන්න',
  'manage.release': 'නිදහස් කරන්න',
  'manage.takeError': 'මෙම ප්‍රදේශය ගත නොහැකි විය',
  'manage.releaseError': 'මෙම ප්‍රදේශය නිදහස් කළ නොහැකි විය',

  'error.update': 'යාවත්කාලීන කළ නොහැකි විය',
};

export default si;
```

- [ ] **Step 5: Write `i18n/translate.ts`, `services/settings/settings.ts`, `services/settings/SettingsContext.tsx`**

`i18n/translate.ts`:

```ts
import en from './en';
import si from './si';

export type Language = 'en' | 'si';
export type StringKey = keyof typeof en;
export type TParams = Record<string, string | number>;

const dictionaries: Record<Language, Record<StringKey, string>> = { en, si };

export function translate(lang: Language, key: StringKey, params?: TParams): string {
  let s = dictionaries[lang][key] ?? en[key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
```

`services/settings/settings.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '@/i18n/translate';

export type HandoverStyle = 'two_step' | 'one_tap';
export interface Settings { language: Language; handover: HandoverStyle }

export const DEFAULT_SETTINGS: Settings = { language: 'en', handover: 'two_step' };
const KEY = 'rc_settings';

export async function loadSettings(): Promise<Settings> {
  try {
    const s = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
    return {
      language: s?.language === 'si' ? 'si' : 'en',
      handover: s?.handover === 'one_tap' ? 'one_tap' : 'two_step',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}
```

`services/settings/SettingsContext.tsx`:

```tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StringKey, TParams, translate } from '@/i18n/translate';
import { DEFAULT_SETTINGS, Settings, loadSettings, saveSettings } from './settings';

interface Value { settings: Settings; update: (patch: Partial<Settings>) => Promise<void>; ready: boolean }

const SettingsContext = createContext<Value>({ settings: DEFAULT_SETTINGS, update: async () => {}, ready: true });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  // A state updater may run after this call returns; the ref is what gets saved.
  const current = useRef<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (!alive) return;
      current.current = s;
      setSettings(s);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...current.current, ...patch };
    current.current = next;
    setSettings(next);
    await saveSettings(next);
  }, []);

  const value = useMemo(() => ({ settings, update, ready }), [settings, update, ready]);
  // Hold the first paint until the stored language is known, so a Sinhala user never sees English flash.
  return <SettingsContext.Provider value={value}>{ready ? children : null}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);

export function useT() {
  const { settings } = useSettings();
  return useCallback((key: StringKey, params?: TParams) => translate(settings.language, key, params), [settings.language]);
}
```

- [ ] **Step 6: Translate the Sheet backdrop label**

In `components/ui/Sheet.tsx` add `import { useT } from '@/services/settings/SettingsContext';`, `const t = useT();` and use `accessibilityLabel={t('common.close')}`.

- [ ] **Step 7: Run to verify they pass**

Run: `npx jest i18n services/settings components`
Expected: PASS. Then the three gates.

- [ ] **Step 8: Commit**

```bash
git add i18n services/settings components/ui/Sheet.tsx
git commit -m "feat(i18n): English and Sinhala strings, settings store for language and handover style"
```

### Task 9: Stop helpers (short reference, duplicate names, address groups, actions, queue overlay)

**Files:**
- Create: `services/delivery/stopView.ts`
- Test: `services/delivery/__tests__/stopView.test.ts`

**Interfaces:**
- Consumes: `DeliveryOrder` (`services/types/api.types.ts`), `matchesSearch`, `statusGroup` (`services/delivery/orderView.ts`), `QueueItem` (type only, from Task 10's `services/delivery/actionQueue.ts` — this task defines the type there first, see Step 3).
- Produces:
  - `shortRef(orderId: string): string` → `'#6O7L'`
  - `phoneEnding(phone: string): string | null` → last 4 digits
  - `duplicateNameKeys(orders: DeliveryOrder[]): Set<string>`; `nameKey(name: string): string`
  - `groupByAddress(orders: DeliveryOrder[]): { address: string | null; orders: DeliveryOrder[] }[]`
  - `matchesStop(o: DeliveryOrder, query: string): boolean`
  - `type MoreAction = 'mark_paid' | 'mark_unpaid'`; `moreActions(o): MoreAction[]`; `canHandOver(o): boolean`
  - `type ShownOrder = DeliveryOrder & { queue?: 'waiting' | 'refused'; queueError?: string; queueIds: string[] }`; `overlayQueue(orders, items: QueueItem[]): ShownOrder[]`
  - `chipFor(o: DeliveryOrder): 'waiting' | 'on_the_way' | 'delivered' | 'failed' | 'cancelled'`

- [ ] **Step 1: Write the failing test** `services/delivery/__tests__/stopView.test.ts`

```ts
import type { DeliveryOrder } from '../../types/api.types';
import type { QueueItem } from '../actionQueue';
import { canHandOver, chipFor, duplicateNameKeys, groupByAddress, matchesStop, moreActions, nameKey, overlayQueue, phoneEnding, shortRef } from '../stopView';

const order = (over: Partial<DeliveryOrder>): DeliveryOrder => ({
  order_id: 'ORD-1792999353509-9f6o7l', customer_id: 'c', customer_name: 'Kasun', customer_phone: '0771234567',
  customer_address: 'Hostel A', area_id: 3, meal_time: 'lunch', target_date: '2026-10-29', total_price: 450,
  payment_status: 'pending', status: 'delivering', failure_reason: null, created_at: '', items: [], ...over,
});
const item = (over: Partial<QueueItem>): QueueItem => ({
  id: 'q1', orderId: 'ORD-1792999353509-9f6o7l', action: { kind: 'delivered' }, createdAt: 1, sendAfter: 1, state: 'waiting', ...over,
});

it('shortRef is the last four letters or digits, upper-case, with #', () => {
  expect(shortRef('ORD-1792999353509-9f6o7l')).toBe('#6O7L');
  expect(shortRef('ab')).toBe('#AB');
  expect(shortRef('')).toBe('#');
});

it('phoneEnding keeps the last four digits only', () => {
  expect(phoneEnding('077 123-4567')).toBe('4567');
  expect(phoneEnding('12')).toBeNull();
  expect(phoneEnding('')).toBeNull();
});

it('duplicate names ignore case and extra spaces, and skip cancelled orders', () => {
  const list = [
    order({ order_id: 'A', customer_name: 'Kasun Perera' }),
    order({ order_id: 'B', customer_name: '  kasun   perera ' }),
    order({ order_id: 'C', customer_name: 'Nimal' }),
    order({ order_id: 'D', customer_name: 'Nimal', status: 'cancelled' }),
  ];
  const dups = duplicateNameKeys(list);
  expect(dups.has(nameKey('Kasun Perera'))).toBe(true);
  expect(dups.has(nameKey('Nimal'))).toBe(false);
});

it('groups by address (no address last), names sorted inside a group', () => {
  const groups = groupByAddress([
    order({ order_id: '1', customer_address: 'Hostel B', customer_name: 'Zara' }),
    order({ order_id: '2', customer_address: '', customer_name: 'Amal' }),
    order({ order_id: '3', customer_address: 'Hostel A', customer_name: 'Saman' }),
    order({ order_id: '4', customer_address: 'Hostel A', customer_name: 'Ama' }),
  ]);
  expect(groups.map((g) => g.address)).toEqual(['Hostel A', 'Hostel B', null]);
  expect(groups[0].orders.map((o) => o.order_id)).toEqual(['4', '3']);
});

it('search matches the short reference with or without #, plus the old fields', () => {
  const o = order({});
  expect(matchesStop(o, '6o7l')).toBe(true);
  expect(matchesStop(o, '#6O7L')).toBe(true);
  expect(matchesStop(o, 'kas')).toBe(true);
  expect(matchesStop(o, '4567')).toBe(true);
  expect(matchesStop(o, 'zzz')).toBe(false);
});

it('hand-over only while on the way; More offers the payment moves the server allows', () => {
  expect(canHandOver(order({ status: 'delivering' }))).toBe(true);
  expect(canHandOver(order({ status: 'pending' }))).toBe(false);
  expect(moreActions(order({ payment_status: 'pending' }))).toEqual(['mark_paid', 'mark_unpaid']);
  expect(moreActions(order({ status: 'completed', payment_status: 'paid' }))).toEqual(['mark_unpaid']);
  expect(moreActions(order({ status: 'delivered', payment_status: 'unpaid' }))).toEqual(['mark_paid']);
  expect(moreActions(order({ status: 'cancelled' }))).toEqual([]);
  expect(moreActions(order({ payment_status: 'ignored' }))).toEqual([]);
});

it('chips', () => {
  expect(chipFor(order({ status: 'preparing' }))).toBe('waiting');
  expect(chipFor(order({ status: 'delivering' }))).toBe('on_the_way');
  expect(chipFor(order({ status: 'completed' }))).toBe('delivered');
  expect(chipFor(order({ status: 'delivery_failed' }))).toBe('failed');
});

it('waiting actions show as already done and are marked; refused ones carry the message', () => {
  const [shown] = overlayQueue([order({})], [
    item({ id: 'q1', action: { kind: 'delivered' } }),
    item({ id: 'q2', action: { kind: 'paid' } }),
  ]);
  expect(shown.status).toBe('delivered');
  expect(shown.payment_status).toBe('paid');
  expect(shown.queue).toBe('waiting');
  expect(shown.queueIds).toEqual(['q1', 'q2']);

  const [failed] = overlayQueue([order({})], [item({ action: { kind: 'failed', reason: 'Wrong address' } })]);
  expect(failed.status).toBe('delivery_failed');
  expect(failed.failure_reason).toBe('Wrong address');

  const [refused] = overlayQueue([order({})], [item({ state: 'refused', error: 'Cannot change status from delivered to delivered' })]);
  expect(refused.status).toBe('delivering');
  expect(refused.queue).toBe('refused');
  expect(refused.queueError).toBe('Cannot change status from delivered to delivered');

  const [untouched] = overlayQueue([order({ order_id: 'other' })], [item({})]);
  expect(untouched.queue).toBeUndefined();
  expect(untouched.queueIds).toEqual([]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest services/delivery/__tests__/stopView.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create the queue types first** — `services/delivery/actionQueue.ts` (Task 10 adds the functions to this same file)

```ts
export type QueuedAction = { kind: 'delivered' } | { kind: 'failed'; reason: string } | { kind: 'paid' } | { kind: 'unpaid' };

export interface QueueItem {
  id: string;
  orderId: string;
  action: QueuedAction;
  createdAt: number;
  sendAfter: number;
  state: 'waiting' | 'refused';
  error?: string;
}
```

- [ ] **Step 4: Write `services/delivery/stopView.ts`**

```ts
import type { DeliveryOrder } from '../types/api.types';
import type { QueueItem } from './actionQueue';
import { matchesSearch, statusGroup } from './orderView';

/** The kitchen label prints the same text (spec §6.8). */
export function shortRef(orderId: string): string {
  return `#${String(orderId || '').replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase()}`;
}

export function phoneEnding(phone: string): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
}

export const nameKey = (name: string) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');

export function duplicateNameKeys(orders: DeliveryOrder[]): Set<string> {
  const seen = new Map<string, number>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const k = nameKey(o.customer_name);
    if (k) seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
}

/** One hostel's orders sit together; orders without an address go last. */
export function groupByAddress(orders: DeliveryOrder[]): { address: string | null; orders: DeliveryOrder[] }[] {
  const groups = new Map<string | null, DeliveryOrder[]>();
  for (const o of orders) {
    const a = o.customer_address?.trim() || null;
    groups.set(a, [...(groups.get(a) ?? []), o]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)))
    .map(([address, list]) => ({ address, orders: [...list].sort((x, y) => x.customer_name.localeCompare(y.customer_name)) }));
}

export function matchesStop(o: DeliveryOrder, query: string): boolean {
  const q = query.trim().replace(/^#/, '').toLowerCase();
  if (!q) return true;
  return shortRef(o.order_id).slice(1).toLowerCase().includes(q) || matchesSearch(o, q);
}

export const canHandOver = (o: Pick<DeliveryOrder, 'status'>) => o.status === 'delivering';

export type MoreAction = 'mark_paid' | 'mark_unpaid';

/** The server accepts any payment change, so a mistaken payment can always be corrected. */
export function moreActions(o: Pick<DeliveryOrder, 'status' | 'payment_status'>): MoreAction[] {
  if (o.status === 'cancelled') return [];
  if (o.payment_status === 'pending') return ['mark_paid', 'mark_unpaid'];
  if (o.payment_status === 'paid') return ['mark_unpaid'];
  if (o.payment_status === 'unpaid') return ['mark_paid'];
  return [];
}

export function chipFor(o: Pick<DeliveryOrder, 'status'>): 'waiting' | 'on_the_way' | 'delivered' | 'failed' | 'cancelled' {
  if (o.status === 'delivering') return 'on_the_way';
  const g = statusGroup(o.status);
  return g === 'to_deliver' ? 'waiting' : g;
}

export type ShownOrder = DeliveryOrder & { queue?: 'waiting' | 'refused'; queueError?: string; queueIds: string[] };

/** Orders as the driver should see them: waiting actions already applied, refusals flagged. */
export function overlayQueue(orders: DeliveryOrder[], items: QueueItem[]): ShownOrder[] {
  return orders.map((o) => {
    const mine = items.filter((i) => i.orderId === o.order_id);
    const shown: ShownOrder = { ...o, queueIds: mine.map((i) => i.id) };
    for (const i of mine) {
      if (i.state === 'refused') {
        shown.queue = 'refused';
        shown.queueError = i.error;
        continue;
      }
      if (!shown.queue) shown.queue = 'waiting';
      if (i.action.kind === 'delivered') shown.status = 'delivered';
      if (i.action.kind === 'failed') { shown.status = 'delivery_failed'; shown.failure_reason = i.action.reason; }
      if (i.action.kind === 'paid') shown.payment_status = 'paid';
      if (i.action.kind === 'unpaid') shown.payment_status = 'unpaid';
    }
    return shown;
  });
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx jest services/delivery`
Expected: PASS. Then the three gates.

- [ ] **Step 6: Commit**

```bash
git add services/delivery/stopView.ts services/delivery/actionQueue.ts services/delivery/__tests__/stopView.test.ts
git commit -m "feat(stops): short reference, duplicate names, address groups, payment corrections, queue overlay"
```

### Task 10: The action queue

**Files:**
- Modify: `services/delivery/actionQueue.ts` (types from Task 9 stay at the top)
- Create: `services/delivery/sendQueued.ts`, `hooks/useActionQueue.ts`
- Test: `services/delivery/__tests__/actionQueue.test.ts`, `hooks/__tests__/useActionQueue.test.tsx`

**Interfaces:**
- Produces (from `actionQueue.ts`):
  - `getQueue(): Promise<QueueItem[]>`, `subscribe(listener: (items: QueueItem[]) => void): () => void`
  - `enqueue(orderId: string, actions: QueuedAction[], opts?: { delayMs?: number; now?: number }): Promise<QueueItem[]>`
  - `undo(ids: string[]): Promise<void>` (removes waiting items only), `dismiss(id: string): Promise<void>` (removes a refused item)
  - `flush(send: (item: QueueItem) => Promise<unknown>, now?: number): Promise<{ sent: number; refused: number; stopped: boolean }>` (one run at a time; a second call while running returns the same promise)
  - `waitingCount(items: QueueItem[]): number`
  - `_resetQueueForTests(): void`
- Produces (from `sendQueued.ts`): `sendQueued(item: QueueItem): Promise<unknown>`; `sendNow(): Promise<unknown>` (= `flush(sendQueued)`)
- Produces (from `hooks/useActionQueue.ts`): `useActionQueue(): QueueItem[]`; `QueueRunner(): null` (mounted once in the root layout: sends on mount, when the app becomes active, and every 15 s while items are waiting).

- [ ] **Step 1: Write the failing queue test** `services/delivery/__tests__/actionQueue.test.ts`

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { _resetQueueForTests, dismiss, enqueue, flush, getQueue, subscribe, undo, waitingCount } from '../actionQueue';

const offline = { status: 0, code: 'NETWORK_ERROR', message: 'Network error' };

beforeEach(async () => {
  await AsyncStorage.clear();
  _resetQueueForTests();
});

it('keeps actions on the phone across a restart, in order', async () => {
  await enqueue('A', [{ kind: 'delivered' }, { kind: 'paid' }], { now: 1000 });
  _resetQueueForTests(); // a fresh JS context reads AsyncStorage again
  const q = await getQueue();
  expect(q.map((i) => [i.orderId, i.action.kind, i.state])).toEqual([['A', 'delivered', 'waiting'], ['A', 'paid', 'waiting']]);
});

it('sends due items in order and removes them', async () => {
  await enqueue('A', [{ kind: 'delivered' }, { kind: 'paid' }], { now: 1000 });
  const send = jest.fn(async () => ({}));
  expect(await flush(send, 1000)).toEqual({ sent: 2, refused: 0, stopped: false });
  expect(send.mock.calls.map(([i]) => i.action.kind)).toEqual(['delivered', 'paid']);
  expect(await getQueue()).toEqual([]);
});

it('does not send before sendAfter, and Undo removes the items before they go', async () => {
  const added = await enqueue('A', [{ kind: 'delivered' }, { kind: 'paid' }], { now: 1000, delayMs: 5000 });
  const send = jest.fn(async () => ({}));
  await flush(send, 3000);
  expect(send).not.toHaveBeenCalled();
  await undo(added.map((i) => i.id));
  await flush(send, 9000);
  expect(send).not.toHaveBeenCalled();
  expect(await getQueue()).toEqual([]);
});

it('no signal stops the run and keeps everything', async () => {
  await enqueue('A', [{ kind: 'delivered' }], { now: 1 });
  await enqueue('B', [{ kind: 'delivered' }], { now: 2 });
  const send = jest.fn(async () => { throw offline; });
  expect(await flush(send, 10)).toEqual({ sent: 0, refused: 0, stopped: true });
  expect(send).toHaveBeenCalledTimes(1);
  expect(waitingCount(await getQueue())).toBe(2);
});

it('a 5xx or 401 also stops and keeps the item for the next run', async () => {
  await enqueue('A', [{ kind: 'paid' }], { now: 1 });
  await flush(jest.fn(async () => { throw { status: 503, message: 'down' }; }), 10);
  await flush(jest.fn(async () => { throw { status: 401, message: 'expired' }; }), 10);
  expect(waitingCount(await getQueue())).toBe(1);
});

it('a 409 saying the order is already delivered counts as sent (the earlier response was lost)', async () => {
  await enqueue('A', [{ kind: 'delivered' }], { now: 1 });
  const send = jest.fn(async () => { throw { status: 409, message: 'Cannot change status from completed to delivered', details: { from: 'completed', to: 'delivered' } }; });
  expect(await flush(send, 10)).toEqual({ sent: 1, refused: 0, stopped: false });
  expect(await getQueue()).toEqual([]);
});

it('any other refusal is kept as refused with the server message, and the run goes on', async () => {
  await enqueue('A', [{ kind: 'failed', reason: 'Wrong address' }], { now: 1 });
  await enqueue('B', [{ kind: 'paid' }], { now: 2 });
  const send = jest.fn(async (i) => {
    if (i.orderId === 'A') throw { status: 409, message: 'Cannot change status from pending to delivery_failed', details: { from: 'pending' } };
    return {};
  });
  expect(await flush(send, 10)).toEqual({ sent: 1, refused: 1, stopped: false });
  const [left] = await getQueue();
  expect(left).toMatchObject({ orderId: 'A', state: 'refused', error: 'Cannot change status from pending to delivery_failed' });
  expect(waitingCount([left])).toBe(0);
  await flush(send, 20);
  expect(send).toHaveBeenCalledTimes(2); // a refused item is never re-sent
  await dismiss(left.id);
  expect(await getQueue()).toEqual([]);
});

it('one run at a time', async () => {
  await enqueue('A', [{ kind: 'paid' }], { now: 1 });
  let release: () => void = () => {};
  const send = jest.fn(() => new Promise<void>((r) => { release = r; }));
  const first = flush(send, 10);
  const second = flush(send, 10);
  expect(second).toBe(first);
  await new Promise((r) => setTimeout(r, 20)); // let the run reach send()
  expect(send).toHaveBeenCalledTimes(1);
  release();
  await first;
  expect(send).toHaveBeenCalledTimes(1);
});

it('subscribers hear every change', async () => {
  const seen: number[] = [];
  const off = subscribe((items) => seen.push(items.length));
  await enqueue('A', [{ kind: 'paid' }], { now: 1 });
  await flush(async () => ({}), 10);
  off();
  expect(seen).toEqual([1, 0]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest services/delivery/__tests__/actionQueue.test.ts`
Expected: FAIL, `_resetQueueForTests` / `enqueue` is not a function.

- [ ] **Step 3: Implement** — append to `services/delivery/actionQueue.ts` below the types

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rc_action_queue';
let items: QueueItem[] | null = null;
let counter = 0;
let running: Promise<FlushResult> | null = null;
const listeners = new Set<(items: QueueItem[]) => void>();

export interface FlushResult { sent: number; refused: number; stopped: boolean }

async function load(): Promise<QueueItem[]> {
  if (items === null) {
    try {
      const raw = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]');
      items = Array.isArray(raw) ? raw : [];
    } catch {
      items = [];
    }
  }
  return items;
}

async function save(next: QueueItem[]): Promise<void> {
  items = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  for (const l of listeners) l(next);
}

export async function getQueue(): Promise<QueueItem[]> {
  return [...(await load())];
}

export function subscribe(listener: (items: QueueItem[]) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const waitingCount = (list: QueueItem[]) => list.filter((i) => i.state === 'waiting').length;

export async function enqueue(orderId: string, actions: QueuedAction[], opts: { delayMs?: number; now?: number } = {}): Promise<QueueItem[]> {
  const now = opts.now ?? Date.now();
  const added: QueueItem[] = actions.map((action) => ({
    id: `${now}-${++counter}`,
    orderId,
    action,
    createdAt: now,
    sendAfter: now + (opts.delayMs ?? 0),
    state: 'waiting',
  }));
  await save([...(await load()), ...added]);
  return added;
}

export async function undo(ids: string[]): Promise<void> {
  await save((await load()).filter((i) => !(ids.includes(i.id) && i.state === 'waiting')));
}

export async function dismiss(id: string): Promise<void> {
  await save((await load()).filter((i) => !(i.id === id && i.state === 'refused')));
}

// A lost response can make a retry hit "already done": the order is then in the target status.
const DONE_FROM: Partial<Record<QueuedAction['kind'], string[]>> = {
  delivered: ['delivered', 'completed'],
  failed: ['delivery_failed'],
};
const alreadyApplied = (item: QueueItem, e: any) => e?.status === 409 && (DONE_FROM[item.action.kind] ?? []).includes(e?.details?.from);
const keepForLater = (e: any) => !e?.status || e.status === 401 || e.status >= 500;

export function flush(send: (item: QueueItem) => Promise<unknown>, now: number = Date.now()): Promise<FlushResult> {
  if (running) return running;
  running = (async () => {
    const result: FlushResult = { sent: 0, refused: 0, stopped: false };
    for (const item of await getQueue()) {
      if (item.state !== 'waiting' || item.sendAfter > now) continue;
      // Undo may have removed it while an earlier item was sending
      if (!(await load()).some((i) => i.id === item.id)) continue;
      try {
        await send(item);
        result.sent++;
        await save((await load()).filter((i) => i.id !== item.id));
      } catch (e: any) {
        if (alreadyApplied(item, e)) {
          result.sent++;
          await save((await load()).filter((i) => i.id !== item.id));
        } else if (keepForLater(e)) {
          result.stopped = true;
          break;
        } else {
          result.refused++;
          await save((await load()).map((i) => (i.id === item.id ? { ...i, state: 'refused', error: e?.message ?? String(e) } : i)));
        }
      }
    }
    return result;
  })().finally(() => { running = null; });
  return running;
}

export function _resetQueueForTests(): void {
  items = null;
  running = null;
  listeners.clear();
}
```

Move the `import AsyncStorage ...` line to the top of the file (above the types) so lint stays clean.

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest services/delivery/__tests__/actionQueue.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Write the sender and the runner hook test first** `hooks/__tests__/useActionQueue.test.tsx`

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppState, Text } from 'react-native';
import { _resetQueueForTests, enqueue, getQueue } from '@/services/delivery/actionQueue';
import { QueueRunner, useActionQueue } from '../useActionQueue';

jest.mock('@/services', () => ({
  deliveryService: { markDelivered: jest.fn(async () => ({})), markFailed: jest.fn(async () => ({})), setPayment: jest.fn(async () => ({})) },
}));
import { deliveryService } from '@/services';
const svc = deliveryService as unknown as Record<'markDelivered' | 'markFailed' | 'setPayment', jest.Mock>;

function Count() {
  return <Text>{`queued:${useActionQueue().length}`}</Text>;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  _resetQueueForTests();
});

it('the hook follows the queue', async () => {
  await render(<Count />);
  expect(await screen.findByText('queued:0')).toBeTruthy();
  await act(async () => { await enqueue('A', [{ kind: 'paid' }], { delayMs: 60_000 }); });
  expect(screen.getByText('queued:1')).toBeTruthy();
});

it('the runner sends on mount, mapping each action to the right service call', async () => {
  await enqueue('A', [{ kind: 'delivered' }, { kind: 'unpaid' }]);
  await enqueue('B', [{ kind: 'failed', reason: 'Wrong address' }]);
  await render(<QueueRunner />);
  await waitFor(() => expect(svc.markFailed).toHaveBeenCalledWith('B', 'Wrong address'));
  expect(svc.markDelivered).toHaveBeenCalledWith('A');
  expect(svc.setPayment).toHaveBeenCalledWith('A', 'unpaid');
  await waitFor(async () => expect(await getQueue()).toEqual([]));
});

it('the runner sends again when the app comes back to the foreground', async () => {
  const listeners: ((s: string) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, l: any) => { listeners.push(l); return { remove: jest.fn() } as any; });
  await render(<QueueRunner />);
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); }); // the mount run finishes on an empty queue
  await enqueue('A', [{ kind: 'paid' }], { now: 0 });
  await act(async () => { listeners.forEach((l) => l('active')); });
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('A', 'paid'));
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx jest hooks/__tests__/useActionQueue.test.tsx`
Expected: FAIL, `Cannot find module '../useActionQueue'`.

- [ ] **Step 7: Implement** `services/delivery/sendQueued.ts` and `hooks/useActionQueue.ts`

```ts
// services/delivery/sendQueued.ts
import { deliveryService } from '@/services';
import { QueueItem, flush } from './actionQueue';

export function sendQueued(item: QueueItem): Promise<unknown> {
  const a = item.action;
  if (a.kind === 'delivered') return deliveryService.markDelivered(item.orderId);
  if (a.kind === 'failed') return deliveryService.markFailed(item.orderId, a.reason);
  return deliveryService.setPayment(item.orderId, a.kind);
}

export const sendNow = () => flush(sendQueued);
```

```ts
// hooks/useActionQueue.ts
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { QueueItem, getQueue, subscribe, waitingCount } from '@/services/delivery/actionQueue';
import { sendNow } from '@/services/delivery/sendQueued';

const RETRY_MS = 15_000;

export function useActionQueue(): QueueItem[] {
  const [items, setItems] = useState<QueueItem[]>([]);
  useEffect(() => {
    let alive = true;
    getQueue().then((q) => alive && setItems(q));
    const off = subscribe((q) => setItems([...q]));
    return () => { alive = false; off(); };
  }, []);
  return items;
}

/** Mounted once at the root. Sends on start, on return to the foreground, and every 15 s while anything waits. */
export function QueueRunner(): null {
  const items = useActionQueue();
  const waiting = waitingCount(items) > 0;

  useEffect(() => {
    sendNow();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') sendNow(); });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => { sendNow(); }, RETRY_MS);
    return () => clearInterval(timer);
  }, [waiting]);

  return null;
}
```

- [ ] **Step 8: Run to verify everything passes**

Run: `npx jest services/delivery hooks`
Expected: PASS. Then the three gates.

- [ ] **Step 9: Commit**

```bash
git add services/delivery/actionQueue.ts services/delivery/sendQueued.ts hooks/useActionQueue.ts services/delivery/__tests__/actionQueue.test.ts hooks/__tests__/useActionQueue.test.tsx
git commit -m "feat(queue): driver actions are kept on the phone and sent when the signal returns"
```

### Task 11: Areas overview service

**Files:**
- Create: `services/delivery/areaOverview.ts`
- Test: `services/delivery/__tests__/areaOverview.test.ts`

**Interfaces:**
- Consumes: `menuApi.getMyDeliverySessions()`, `locationService.getAreas()`, `deliveryService.getSummary(scope)`, `ErrorUtils.getErrorMessage` from `@/services`; `DeliverySession`.
- Produces:
  - `pickSession(sessions: DeliverySession[], chosenId?: number | null): DeliverySession | null`
  - `interface AreaRow { areaId: number; name: string; summary: DriverSummary | null; error?: string }`
  - `interface Overview { sessions: DeliverySession[]; session: DeliverySession | null; rows: AreaRow[] }`
  - `loadOverview(chosenId?: number | null): Promise<Overview>` — rejects only when the sessions or areas call fails; one failing area summary gives that row an `error` and keeps the others.

- [ ] **Step 1: Write the failing test** `services/delivery/__tests__/areaOverview.test.ts`

```ts
import { loadOverview, pickSession } from '../areaOverview';

jest.mock('@/services', () => ({
  menuApi: { getMyDeliverySessions: jest.fn() },
  locationService: { getAreas: jest.fn() },
  deliveryService: { getSummary: jest.fn() },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
}));
import { deliveryService, locationService, menuApi } from '@/services';
const sessionsMock = menuApi.getMyDeliverySessions as jest.Mock;
const areasMock = locationService.getAreas as jest.Mock;
const summaryMock = deliveryService.getSummary as jest.Mock;

const s = (id: number, meal_time: string, state: string, mine: number[] = [3]) =>
  ({ id, date: '2026-10-29', meal_time, start_time: '', end_time: '', notes: null, state, mine, taken: [] }) as any;
const SUMMARY = { to_deliver: { orders: 8, parcels: 12 }, delivered: { orders: 5, parcels: 6 }, failed: { orders: 0 }, collected: { orders: 4, amount: 2250 }, unpaid: { orders: 1, amount: 450, list: [] } };

beforeEach(() => {
  jest.clearAllMocks();
  areasMock.mockResolvedValue([{ area_id: 3, area_name: 'Hostel A' }, { area_id: 4, area_name: 'Kandy Rd' }]);
  summaryMock.mockResolvedValue(SUMMARY);
});

it('picks the chosen session, else the latest closed one, else the first open, else the first', () => {
  const list = [s(1, 'breakfast', 'closed'), s(2, 'lunch', 'closed'), s(3, 'dinner', 'open')];
  expect(pickSession(list, 3)?.id).toBe(3);
  expect(pickSession(list, 99)?.id).toBe(2);
  expect(pickSession([s(1, 'breakfast', 'upcoming'), s(2, 'lunch', 'open')])?.id).toBe(2);
  expect(pickSession([s(1, 'breakfast', 'upcoming')])?.id).toBe(1);
  expect(pickSession([])).toBeNull();
});

it('one row per area I hold in that meal, named, with its counts', async () => {
  sessionsMock.mockResolvedValue([s(2, 'lunch', 'closed', [3, 4])]);
  const o = await loadOverview();
  expect(o.session?.id).toBe(2);
  expect(o.rows.map((r) => [r.areaId, r.name, r.summary?.to_deliver.orders])).toEqual([[3, 'Hostel A', 8], [4, 'Kandy Rd', 8]]);
  expect(summaryMock).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch' });
  expect(summaryMock).toHaveBeenCalledWith({ area_id: 4, meal_time: 'lunch' });
});

it('a failing area keeps the others', async () => {
  sessionsMock.mockResolvedValue([s(2, 'lunch', 'closed', [3, 4])]);
  summaryMock.mockImplementation(async ({ area_id }: any) => { if (area_id === 4) throw new Error('You do not cover this area today'); return SUMMARY; });
  const o = await loadOverview();
  expect(o.rows[0].summary).toBeTruthy();
  expect(o.rows[1]).toMatchObject({ areaId: 4, summary: null, error: 'You do not cover this area today' });
});

it('no session today gives no rows and asks no summaries', async () => {
  sessionsMock.mockResolvedValue([]);
  expect(await loadOverview()).toEqual({ sessions: [], session: null, rows: [] });
  expect(summaryMock).not.toHaveBeenCalled();
});

it('a failing sessions call rejects', async () => {
  sessionsMock.mockRejectedValue(new Error('Network error'));
  await expect(loadOverview()).rejects.toThrow('Network error');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest services/delivery/__tests__/areaOverview.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement** `services/delivery/areaOverview.ts`

```ts
import { DeliverySession, DriverSummary, ErrorUtils, deliveryService, locationService, menuApi } from '@/services';

export interface AreaRow { areaId: number; name: string; summary: DriverSummary | null; error?: string }
export interface Overview { sessions: DeliverySession[]; session: DeliverySession | null; rows: AreaRow[] }

/** The meal being delivered now: the latest one whose ordering has closed, else the open one. */
export function pickSession(sessions: DeliverySession[], chosenId?: number | null): DeliverySession | null {
  const chosen = sessions.find((x) => x.id === chosenId);
  if (chosen) return chosen;
  const closed = sessions.filter((x) => x.state === 'closed');
  if (closed.length) return closed[closed.length - 1];
  return sessions.find((x) => x.state === 'open') ?? sessions[0] ?? null;
}

export async function loadOverview(chosenId?: number | null): Promise<Overview> {
  const [sessions, areas] = await Promise.all([menuApi.getMyDeliverySessions(), locationService.getAreas()]);
  const session = pickSession(sessions, chosenId);
  if (!session) return { sessions, session: null, rows: [] };
  const names = new Map(areas.map((a) => [Number(a.area_id), a.area_name]));
  const rows = await Promise.all(
    session.mine.map(async (areaId): Promise<AreaRow> => {
      const name = names.get(areaId) ?? String(areaId);
      try {
        return { areaId, name, summary: await deliveryService.getSummary({ area_id: areaId, meal_time: session.meal_time }) };
      } catch (e) {
        return { areaId, name, summary: null, error: ErrorUtils.getErrorMessage(e) };
      }
    }),
  );
  return { sessions, session, rows };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest services/delivery`
Expected: PASS. Then the three gates.

- [ ] **Step 5: Commit**

```bash
git add services/delivery/areaOverview.ts services/delivery/__tests__/areaOverview.test.ts
git commit -m "feat(areas): overview of every area the driver holds in a meal"
```

**PHASE 2 GATE:** `npx jest` (record suites/tests), `npx tsc --noEmit` 0, `npx expo lint` ≤ 19 warnings. No screenshots: nothing visible changed except the light-mode lock. Report and continue to Phase 3 only after Gate 1's layout-detail commit exists.

---

# PHASE 3 — Screens

**Before each Phase 3 task:** the implementer reads the approved board(s) named in the task (`docs/superpowers/mockups/png/<Board>.png` and the HTML source) and the layout detail the controller added after Gate 1. Before marking a task complete, the controller compares the phone screenshot with the board. Every Phase 3 device step follows the device safety block.

### Task 12: Navigation and app shell

**Boards:** `TabBar`.

**Files:**
- Modify: `app/_layout.tsx`, `app/index.tsx`, `app/__tests__/index.test.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/pendingPayments/index.tsx`, `components/tabBar/tabBar.tsx`, `components/tabBarButton/tabBarButton.tsx`, `constants/constants.tsx` (remove the `icon` map if nothing else uses it), `package.json` / `package-lock.json` (`expo-keep-awake`)
- Create: `app/(tabs)/settings/index.tsx`, `app/(routes)/stops/index.tsx`, `app/(routes)/manage-areas/index.tsx`, `screens/settings/settings.screen.tsx` (placeholder that renders the translated title only; Task 17 builds it), `screens/stops/stops.screen.tsx` and `screens/areas/areas.screen.tsx` and `screens/manageAreas/manageAreas.screen.tsx` (each renders its translated title only; Tasks 13, 14, 18 build them)
- Test: `components/__tests__/tabBar.test.tsx`

**Interfaces:**
- Root layout: `<SettingsProvider><QueueRunner /><Stack screenOptions={{ headerShown: false }}>…</Stack></SettingsProvider>` with screens `index`, `(routes)/login/index`, `(routes)/stops/index`, `(routes)/manage-areas/index`, `(tabs)`.
- `app/index.tsx`: signed in → `<Redirect href="/(tabs)" />`, else `/(routes)/login`.
- Tabs: `index` (title key `tabs.areas`, icon `location-outline`), `pendingPayments/index` (`tabs.unpaid`, `cash-outline`), `settings/index` (`tabs.settings`, `settings-outline`).
- Stops route params: `{ areaId: string; area: string; sessionId: string; mealTime: MealTime; date: string }` (strings, parsed in the screen).
- The old `app/(routes)/area-selection/index.tsx` route is removed in this task; `screens/area-selection/area-selection.screen.tsx` and its test stay until Task 18 replaces them (the route file is the only consumer of navigation to it).

- [ ] **Step 1: Tests first**

Update `app/__tests__/index.test.tsx`: the first test's name becomes `'a signed-in driver goes straight to the areas'` and its expectation `'redirect:/(tabs)'` (the landing screen changes by design, spec C10; record a Ruling line in the ledger). The second test stays unchanged.

`components/__tests__/tabBar.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { TabBar } from '../tabBar/tabBar';
import { touch } from '@/theme';

const routes = [
  { key: 'a', name: 'index' },
  { key: 'u', name: 'pendingPayments/index' },
  { key: 's', name: 'settings/index' },
];
const props = (index: number, navigateToTab = jest.fn()) => ({
  state: { index, routes },
  descriptors: Object.fromEntries(routes.map((r) => [r.key, { options: { title: r.name } }])),
  emitter: { emit: jest.fn(() => ({ defaultPrevented: false })) },
  navigateToTab,
}) as any;

it('shows three labelled tabs, each at least 56 dp, with the current one selected', async () => {
  await render(<TabBar {...props(1)} />);
  for (const name of ['Areas', 'Unpaid', 'Settings']) {
    const tab = screen.getByRole('tab', { name });
    expect(StyleSheet.flatten(tab.props.style).minHeight).toBeGreaterThanOrEqual(touch.min);
  }
  expect(screen.getByRole('tab', { name: 'Unpaid' }).props.accessibilityState).toMatchObject({ selected: true });
});

it('pressing another tab navigates to it', async () => {
  const navigateToTab = jest.fn();
  await render(<TabBar {...props(0, navigateToTab)} />);
  await fireEvent.press(screen.getByRole('tab', { name: 'Settings' }));
  expect(navigateToTab).toHaveBeenCalledWith('s');
});
```

Run: `npx jest app components/__tests__/tabBar.test.tsx` → FAIL.

- [ ] **Step 2: Implement**

1. `npx expo install expo-keep-awake` (pins the SDK-58 version; this is the one permitted dependency). Confirm `package.json` gained exactly that line.
2. Rewrite `components/tabBar/tabBar.tsx` and `components/tabBarButton/tabBarButton.tsx`: a fixed bar (layout from the `TabBar` board), labels always visible (`AppText` `caption` bold), `accessibilityRole="tab"`, `accessibilityState={{ selected }}`, `minHeight: touch.min`, icons from a local map `{ index: 'location-outline', 'pendingPayments/index': 'cash-outline', 'settings/index': 'settings-outline' }`, the label from `t(KEY_BY_ROUTE[route.name])` with `KEY_BY_ROUTE = { index: 'tabs.areas', 'pendingPayments/index': 'tabs.unpaid', 'settings/index': 'tabs.settings' }`. The selected tab: `color.brand` pill behind the icon, label `onBrand`. Keep the pill slide (Reanimated `transform` only). Keep `emitter.emit({ type: 'tabPress', target, canPreventDefault: true })` before `navigateToTab`.
3. Root layout, index redirect, tabs layout, the three new route files (each wraps its screen like the existing route files, without the `GestureHandlerRootView` duplication: put one `GestureHandlerRootView` in the root layout instead and remove it from the route files).
4. Login's success path: `router.replace('/(tabs)')` (the full Login rewrite is Task 18; here change only the navigation target and delete the "Login Successful" alert, P6).

- [ ] **Step 3: Verify**

`npx jest` green, `npx tsc --noEmit` 0 (or only the known Metro router-types error, reported), lint. Device: cold start signed in lands on the Areas placeholder; the three tabs switch; labels readable; screenshot `docs/superpowers/ui-audit/after/12-tabbar.png` next to the board.

- [ ] **Step 4: Commit** — `feat(nav): areas-first navigation with Areas, Unpaid and Settings tabs`

### Task 13: Areas (the mounted screen)

**Boards:** `Areas-1area`, `Areas-3areas`, `Areas-states`, `Sinhala`.

**Files:**
- Modify: `screens/areas/areas.screen.tsx`
- Test: `screens/__tests__/areas.screen.test.tsx`

**Interfaces:**
- Consumes: `loadOverview`, `pickSession` (Task 11), `useActionQueue`, `waitingCount` (Task 10), `useT` (Task 8), kit (Task 7), `useKeepAwake` from `expo-keep-awake`.
- Navigation: a row press → `router.push({ pathname: '/(routes)/stops', params: { areaId, area, sessionId, mealTime, date } })`; "Manage areas" → `router.push('/(routes)/manage-areas')`.

- [ ] **Step 1: Tests first** `screens/__tests__/areas.screen.test.tsx`

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import AreasScreen from '../areas/areas.screen';

jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return { router: { push: jest.fn() }, useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});
jest.mock('@/services/delivery/areaOverview', () => ({ ...jest.requireActual('@/services/delivery/areaOverview'), loadOverview: jest.fn() }));
let mockQueue: any[] = [];
jest.mock('@/hooks/useActionQueue', () => ({ useActionQueue: () => mockQueue }));

import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { loadOverview } from '@/services/delivery/areaOverview';
const overview = loadOverview as jest.Mock;

const SUM = (toDeliver: number, parcels: number) => ({
  to_deliver: { orders: toDeliver, parcels }, delivered: { orders: 5, parcels: 6 }, failed: { orders: 0 },
  collected: { orders: 4, amount: 2250 }, unpaid: { orders: 1, amount: 450, list: [] },
});
const lunch = { id: 2, date: '2026-10-29', meal_time: 'lunch', state: 'closed', mine: [3, 4], taken: [], start_time: '', end_time: '', notes: null };
const dinner = { ...lunch, id: 3, meal_time: 'dinner', state: 'open', mine: [3] };

beforeEach(() => {
  jest.clearAllMocks();
  mockQueue = [];
  overview.mockResolvedValue({
    sessions: [lunch, dinner], session: lunch,
    rows: [{ areaId: 3, name: 'Hostel A', summary: SUM(8, 12) }, { areaId: 4, name: 'Kandy Rd', summary: SUM(0, 0) }],
  });
});

it('one large row per area with what is left to deliver, and the session state', async () => {
  await render(<AreasScreen />);
  expect(await screen.findByText('Hostel A')).toBeTruthy();
  expect(screen.getByText('8 orders · 12 parcels to deliver')).toBeTruthy();
  expect(screen.getByText('5 delivered · Rs 2,250.00 collected')).toBeTruthy();
  expect(screen.getByText('All delivered')).toBeTruthy();
  expect(screen.getByText('Delivery time')).toBeTruthy();
  expect(useKeepAwake).toHaveBeenCalled();
});

it('switching meal reloads that session', async () => {
  await render(<AreasScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Dinner' }));
  expect(overview).toHaveBeenLastCalledWith(3);
});

it('an area opens its stops with the session in the params', async () => {
  await render(<AreasScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: /Hostel A/ }));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/(routes)/stops', params: { areaId: '3', area: 'Hostel A', sessionId: '2', mealTime: 'lunch', date: '2026-10-29' } });
});

it('shows how many updates are waiting to send', async () => {
  mockQueue = [{ state: 'waiting' }, { state: 'waiting' }, { state: 'refused' }];
  await render(<AreasScreen />);
  expect(await screen.findByText('2 updates waiting to send')).toBeTruthy();
});

it('not assigned today', async () => {
  overview.mockResolvedValue({ sessions: [], session: null, rows: [] });
  await render(<AreasScreen />);
  expect(await screen.findByText('You are not assigned to a meal session today. Please contact an administrator.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
});

it('no areas in this meal offers Manage areas', async () => {
  overview.mockResolvedValue({ sessions: [lunch], session: { ...lunch, mine: [] }, rows: [] });
  await render(<AreasScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Manage areas' }));
  expect(router.push).toHaveBeenCalledWith('/(routes)/manage-areas');
});

it('offline first load shows the error with Try again, which reloads', async () => {
  overview.mockRejectedValueOnce({ status: 0, code: 'NETWORK_ERROR', message: 'Network error' });
  await render(<AreasScreen />);
  expect(await screen.findByText("Couldn't load your areas")).toBeTruthy();
  expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
  await act(async () => { await fireEvent.press(screen.getByRole('button', { name: 'Try again' })); });
  expect(await screen.findByText('Hostel A')).toBeTruthy();
});

it('one failing area shows its own message and keeps the rest', async () => {
  overview.mockResolvedValue({ sessions: [lunch], session: lunch, rows: [{ areaId: 3, name: 'Hostel A', summary: SUM(8, 12) }, { areaId: 4, name: 'Kandy Rd', summary: null, error: 'x' }] });
  await render(<AreasScreen />);
  expect(await screen.findByText("Couldn't load this area's counts")).toBeTruthy();
  expect(screen.getByText('8 orders · 12 parcels to deliver')).toBeTruthy();
});
```

Amounts use `formatAmount` (add to `services/delivery/orderView.ts` in this task, with a test in `orderView.test.ts`): `formatAmount(2250) === '2,250.00'` (`toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`), shown through `t('common.amount', { amount })` → `Rs 2,250.00`. `formatRs` stays for the old screens until Task 19.

Run red.

- [ ] **Step 2: Implement** the screen to the boards: `Screen`-level `SafeAreaView` on `color.bg`; header `areas.title`; meal switcher (one `AppButton`-sized chip per session, `accessibilityRole="button"`, label `t('meal.<meal_time>')`, shown only when `sessions.length > 1`); `session.<state>` line; rows as pressable `Card`s (`accessibilityRole="button"`, `accessibilityLabel` = area name + the to-deliver line) with the name (`h1` bold), the to-deliver line (`count`-sized numbers per the board), the done line (`muted`), "All delivered" with a check icon when `to_deliver.orders === 0`; `queue.waiting` banner when `waitingCount > 0`; "Manage areas" `outline` button at the end; `EmptyState` for not-assigned (action Refresh) and no-areas (action Manage areas); `EmptyState tone="error"` for the first-load failure (message `common.offline` when `status === 0 && code === 'NETWORK_ERROR'`, else `common.serverError`); a skeleton or `ActivityIndicator` per the `Areas-states` board while loading. `useKeepAwake()`. Reload on focus, on pull-to-refresh, and when `waitingCount` drops (effect on the number).

- [ ] **Step 3: Verify** — jest/tsc/lint. Device: as `flow.delivery`, Areas with the closed breakfast session and the open lunch session; switch meals; open an area; screenshot English and Sinhala (switch in Settings once Task 17 exists, or temporarily via `AsyncStorage` is NOT allowed: if Task 17 is not done, Sinhala screenshots are taken at Gate 3) next to `Areas-3areas`; leave the phone on Areas for 2 minutes and confirm the screen does not dim; `bash scripts/perf-frames.sh areas` ×3 if the list scrolls (with one or two areas it does not: say so).

- [ ] **Step 4: Commit** — `feat(areas): glanceable areas screen for the handlebar`

### Task 14: Stops (list, search, groups, start delivery, call, cards)

**Boards:** `Stops-hostel`, `Stops-house`, `Card-states`, `Sinhala`.

**Files:**
- Modify: `screens/stops/stops.screen.tsx`
- Create: `components/stops/StopCard.tsx`
- Test: `screens/__tests__/stops.screen.test.tsx`

**Interfaces:**
- Consumes: route params (Task 12), `deliveryService.getSessionOrders`, `getSummary`, `startDelivery`, `menuApi.getMyDeliverySessions`; `visibleOrders` logic replaced by `overlayQueue` → `matchesStop` → filter by `statusGroup` (the chip filter) → `groupByAddress`; `duplicateNameKeys`, `phoneEnding`, `shortRef`, `chipFor`, `canHandOver`, `moreActions` (Task 9); `useActionQueue`, `dismiss` (Task 10).
- Produces: `StopCard({ order: ShownOrder, showPhoneEnding: boolean, onHandOver: (o, kind) => void, onFail: (o) => void, onMore: (o) => void, onDismiss: (id) => void, handover: HandoverStyle, busy: boolean })` where `kind` is `'two_step' | 'paid' | 'unpaid'`. In this task the screen passes `onHandOver`, `onFail` and `onMore` callbacks that do nothing; Task 15 replaces them with the sheets.

- [ ] **Step 1: Tests first** `screens/__tests__/stops.screen.test.tsx`

```tsx
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';
import StopsScreen from '../stops/stops.screen';

jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    router: { back: jest.fn() },
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
    useLocalSearchParams: () => ({ areaId: '3', area: 'Hostel A', sessionId: '7', mealTime: 'lunch', date: '2026-10-29' }),
  };
});
let mockSessionState = 'closed';
jest.mock('@/services', () => ({
  deliveryService: { getSessionOrders: jest.fn(), getSummary: jest.fn(), startDelivery: jest.fn() },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
  menuApi: { getMyDeliverySessions: jest.fn(async () => [{ id: 7, meal_time: 'lunch', state: mockSessionState, mine: [3], taken: [] }]) },
}));
let mockQueue: any[] = [];
jest.mock('@/hooks/useActionQueue', () => ({ useActionQueue: () => mockQueue }));

import { deliveryService } from '@/services';
const svc = deliveryService as unknown as Record<'getSessionOrders' | 'getSummary' | 'startDelivery', jest.Mock>;

const order = (id: string, over: object = {}) => ({
  order_id: `ORD-1-${id}000`, status: 'delivering', payment_status: 'pending', customer_id: 'c', customer_name: `Name ${id}`,
  customer_phone: `07712340${id.charCodeAt(0) % 10}0`, customer_address: 'Hostel A', area_id: 3, meal_time: 'lunch',
  target_date: '2026-10-29', total_price: 450, failure_reason: null, created_at: '',
  items: [{ food_name: 'Rice', quantity: 2, price: 225, meal_type: 'veg' }], ...over,
});
const SUMMARY = { to_deliver: { orders: 4, parcels: 6 }, delivered: { orders: 2, parcels: 3 }, failed: { orders: 1 }, collected: { orders: 2, amount: 900 }, unpaid: { orders: 1, amount: 450, list: [] } };

beforeEach(() => {
  jest.clearAllMocks();
  mockSessionState = 'closed';
  mockQueue = [];
  svc.getSessionOrders.mockResolvedValue([
    order('a', { customer_name: 'Kasun Perera', customer_phone: '0771111234' }),
    order('b', { customer_name: 'kasun perera', customer_phone: '0772225678' }),
    order('c', { customer_name: 'Nimal', customer_address: 'Hostel B' }),
    order('d', { status: 'pending' }),
    order('v', { status: 'completed', payment_status: 'paid' }),
    order('x', { status: 'cancelled' }),
  ]);
  svc.getSummary.mockResolvedValue(SUMMARY);
  svc.startDelivery.mockResolvedValue({ message: '1 orders are on the way', moved: 1, order_ids: [] });
});

it('loads this area and meal, shows the counts and groups orders by address', async () => {
  await render(<StopsScreen />);
  expect(await screen.findByText('Hostel A · 3 orders')).toBeTruthy();
  expect(screen.getByText('Hostel B · 1 orders')).toBeTruthy();
  expect(screen.getByText('4 orders · 6 parcels')).toBeTruthy();
  expect(svc.getSessionOrders).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch', target_date: '2026-10-29' });
  expect(screen.queryByTestId('stop-ORD-1-v000')).toBeNull(); // delivered is not in "To deliver"
  expect(screen.queryByTestId('stop-ORD-1-x000')).toBeNull();
});

it('same name twice shows the last four phone digits on both; a unique name does not', async () => {
  await render(<StopsScreen />);
  expect(within(await screen.findByTestId('stop-ORD-1-a000')).getByText('Phone …1234')).toBeTruthy();
  expect(within(screen.getByTestId('stop-ORD-1-b000')).getByText('Phone …5678')).toBeTruthy();
  expect(within(screen.getByTestId('stop-ORD-1-c000')).queryByText(/Phone …/)).toBeNull();
});

it('every card shows its short reference, and search finds it', async () => {
  await render(<StopsScreen />);
  expect(within(await screen.findByTestId('stop-ORD-1-c000')).getByText('#C000')).toBeTruthy();
  await fireEvent.changeText(screen.getByPlaceholderText('Search name, #ref or phone'), '#c000');
  expect(screen.getByTestId('stop-ORD-1-c000')).toBeTruthy();
  expect(screen.queryByTestId('stop-ORD-1-a000')).toBeNull();
});

it('Call opens the dialler with the customer phone', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await render(<StopsScreen />);
  await fireEvent.press(within(await screen.findByTestId('stop-ORD-1-c000')).getByRole('button', { name: 'Call Nimal' }));
  expect(open).toHaveBeenCalledWith(expect.stringMatching(/^tel:0771234/));
});

it('filters: Delivered shows the delivered order; All shows everything but cancelled', async () => {
  await render(<StopsScreen />);
  // "Delivered" is also the hand-over button's name on every card: look inside the filter row
  await fireEvent.press(within(await screen.findByTestId('filter-row')).getByRole('button', { name: 'Delivered' }));
  expect(screen.getByTestId('stop-ORD-1-v000')).toBeTruthy();
  await fireEvent.press(within(screen.getByTestId('filter-row')).getByRole('button', { name: 'All' }));
  expect(screen.getByTestId('stop-ORD-1-d000')).toBeTruthy();
  expect(screen.queryByTestId('stop-ORD-1-x000')).toBeNull();
});

it('Start delivery waits for ordering to close', async () => {
  mockSessionState = 'open';
  await render(<StopsScreen />);
  expect(await screen.findByText('Available after ordering closes')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Start delivery' }).props.accessibilityState).toMatchObject({ disabled: true });
});

it('Start delivery asks, starts, and reloads', async () => {
  await render(<StopsScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Start delivery' }));
  expect(screen.getByText('Start delivery?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Start' }));
  await waitFor(() => expect(svc.startDelivery).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch' }));
  await waitFor(() => expect(svc.getSessionOrders).toHaveBeenCalledTimes(2));
});

it('a waiting action shows on its card and moves it out of To deliver; a refused one shows the message and can be dismissed', async () => {
  mockQueue = [{ id: 'q1', orderId: 'ORD-1-a000', action: { kind: 'delivered' }, createdAt: 1, sendAfter: 1, state: 'waiting' }];
  const { rerender } = await render(<StopsScreen />);
  expect(await screen.findByText('Hostel A · 2 orders')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'All' }));
  expect(within(screen.getByTestId('stop-ORD-1-a000')).getByText('Waiting to send')).toBeTruthy();
  mockQueue = [{ id: 'q2', orderId: 'ORD-1-c000', action: { kind: 'paid' }, createdAt: 1, sendAfter: 1, state: 'refused', error: 'Order not found' }];
  await rerender(<StopsScreen />);
  expect(within(screen.getByTestId('stop-ORD-1-c000')).getByText('Not sent: Order not found')).toBeTruthy();
  expect(within(screen.getByTestId('stop-ORD-1-c000')).getByRole('button', { name: 'Dismiss' })).toBeTruthy();
});

it('a slow earlier reload cannot overwrite a newer one', async () => {
  await render(<StopsScreen />);
  await screen.findByText('Hostel A · 3 orders');
  let release: (v: unknown[]) => void = () => {};
  svc.getSessionOrders.mockReturnValueOnce(new Promise((r) => { release = r; })).mockResolvedValueOnce([order('c', { customer_name: 'Nimal', customer_address: 'Hostel B' })]);
  await act(async () => { screen.getByTestId('stops-list').props.refreshControl.props.onRefresh(); });
  await act(async () => { screen.getByTestId('stops-list').props.refreshControl.props.onRefresh(); });
  expect(await screen.findByText('Hostel B · 1 orders')).toBeTruthy();
  await act(async () => { release([order('a'), order('b')]); });
  expect(screen.queryByText('Hostel A · 2 orders')).toBeNull();
});
```

(`shortRef('ORD-1-c000')` is `'#C000'`: the non-alphanumerics are dropped and the last four kept.)

Run red.

- [ ] **Step 2: Implement** to the boards. `SectionList` (`testID="stops-list"`, `keyExtractor={(o) => o.order_id}`, `stickySectionHeadersEnabled={false}`, `refreshControl` with `onRefresh={load}`), sections from `groupByAddress`, section header `stops.group` (address or `stops.noAddress`), the counts strip from `summary`, the Start delivery block (as today's logic: shown while `needsStart(orders)`; enabled when the session is `closed`; confirm in a `Sheet` with `stops.startTitle`, `stops.startMessage`, buttons `stops.startConfirm` and `common.back`; result in `Alert.alert(t('stops.started'), result.message)`; errors in `Alert.alert(t('error.update'), message)`), the search `TextInput` (`placeholderTextColor={color.subtle}`, 56 dp high), filter chips as 56 dp buttons with `accessibilityState.selected`, inside a row with `testID="filter-row"`. Keep the `loadSeq` latest-wins guard from today's Home. `StopCard`: name (`title` bold), `Chip` status and a `#ref` text, `stops.phoneEnding` when `showPhoneEnding`, address, items, `stops.parcels`, amount, `stops.reason` for failed, `Call` (`AppButton variant="outline" icon="call-outline"`, `accessibilityLabel={t('stops.call', { name })}`, `Linking.openURL('tel:' + phone.replace(/[^\d+]/g, ''))`), the handover area (Task 15 fills it; here render it only when `canHandOver(order) && !order.queue`), More (`icon="ellipsis-horizontal"`) when `moreActions(order).length && !order.queue`, the queue line `queue.cardWaiting` / `queue.cardRefused` with a `common.dismiss` button calling `dismiss(id)` for each refused id. `useKeepAwake()`. Reload when `waitingCount` drops.

- [ ] **Step 3: Verify** — jest/tsc/lint. Device: open an area with orders in the closed breakfast session and the open lunch session; screenshots (hostel group, a house card with Call, search by `#ref`) next to `Stops-hostel` / `Stops-house`; press Call once and immediately back out of the dialler (do not place the call); press Start delivery and choose Back (unless the owner allows a Start, as in Task 2). `bash scripts/perf-frames.sh stops` ×3 on the longest list; compare with the Phase 0 Home baseline.

- [ ] **Step 4: Commit** — `feat(stops): one-hand stops screen grouped by address, with call and short references`

### Task 15: Handover (two steps, one tap with Undo, failed, more)

**Boards:** `Card-states`, `Handover-twostep`, `Handover-onetap`, `Failed`, `More`, `Sinhala`.

**Files:**
- Create: `components/handover/HandoverButtons.tsx`, `components/handover/PaidSheet.tsx`, `components/handover/FailSheet.tsx`, `components/handover/MoreSheet.tsx`, `components/handover/UndoBar.tsx`, `services/delivery/failReasons.ts`
- Modify: `screens/stops/stops.screen.tsx`, `components/stops/StopCard.tsx`
- Delete (end of this task): `components/failReasonModal/failReasonModal.tsx`, `components/__tests__/failReasonModal.test.tsx` (replaced by `FailSheet` and its tests below)
- Test: `screens/__tests__/handover.test.tsx`, `services/delivery/__tests__/failReasons.test.ts`

**Interfaces:**
- Consumes: `enqueue`, `undo` (Task 10), `sendNow` (Task 10), `useSettings` (Task 8), `expo-haptics` (`Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`).
- Produces:
  - `UNDO_MS = 5000` and `PRESET_REASONS: { key: StringKey; sent: string }[]` from `services/delivery/failReasons.ts`, with `sent` values `'Customer not there'`, `'Phone not answered'`, `'Wrong address'`, `'Refused the order'` (English, spec §6.5, P5)
  - `handOver(order, payment: 'paid' | 'unpaid' | null, delayMs: number)`: queues `[{ kind: 'delivered' }, ...(payment ? [{ kind: payment }] : [])]`, then `sendNow()` at once (two steps) or after `delayMs` via `setTimeout` (one tap); returns the queued ids.

- [ ] **Step 1: Tests first** `services/delivery/__tests__/failReasons.test.ts`

```ts
import en from '@/i18n/en';
import { PRESET_REASONS, UNDO_MS } from '../failReasons';

it('presets are sent in English, exactly as the English labels', () => {
  expect(PRESET_REASONS.map((r) => r.sent)).toEqual(['Customer not there', 'Phone not answered', 'Wrong address', 'Refused the order']);
  for (const r of PRESET_REASONS) expect(en[r.key]).toBe(r.sent);
});

it('the undo window is 5 seconds', () => {
  expect(UNDO_MS).toBe(5000);
});
```

`screens/__tests__/handover.test.tsx` (same mocks as `stops.screen.test.tsx`, plus):

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import StopsScreen from '../stops/stops.screen';
import { _resetQueueForTests, getQueue } from '@/services/delivery/actionQueue';

jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn(), NotificationFeedbackType: { Success: 'success' } }));
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    router: { back: jest.fn() },
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
    useLocalSearchParams: () => ({ areaId: '3', area: 'Hostel A', sessionId: '7', mealTime: 'lunch', date: '2026-10-29' }),
  };
});
jest.mock('@/services', () => ({
  deliveryService: { getSessionOrders: jest.fn(), getSummary: jest.fn(), startDelivery: jest.fn(), markDelivered: jest.fn(), markFailed: jest.fn(), setPayment: jest.fn() },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
  menuApi: { getMyDeliverySessions: jest.fn(async () => [{ id: 7, meal_time: 'lunch', state: 'closed', mine: [3], taken: [] }]) },
}));
let mockHandover = 'two_step';
jest.mock('@/services/settings/SettingsContext', () => ({
  ...jest.requireActual('@/services/settings/SettingsContext'),
  useSettings: () => ({ settings: { language: 'en', handover: mockHandover }, update: jest.fn(), ready: true }),
}));

import { deliveryService } from '@/services';
const svc = deliveryService as unknown as Record<string, jest.Mock>;
const order = (id: string, over: object = {}) => ({
  order_id: id, status: 'delivering', payment_status: 'pending', customer_id: 'c', customer_name: 'Kasun', customer_phone: '0771234567',
  customer_address: 'Hostel A', area_id: 3, meal_time: 'lunch', target_date: '2026-10-29', total_price: 450, failure_reason: null,
  created_at: '', items: [], ...over,
});
const SUMMARY = { to_deliver: { orders: 1, parcels: 1 }, delivered: { orders: 0, parcels: 0 }, failed: { orders: 0 }, collected: { orders: 0, amount: 0 }, unpaid: { orders: 0, amount: 0, list: [] } };

beforeEach(async () => {
  jest.useRealTimers();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  _resetQueueForTests();
  mockHandover = 'two_step';
  svc.getSessionOrders.mockResolvedValue([order('ORD-1-abcd'), order('ORD-2-paid', { payment_status: 'paid' })]);
  svc.getSummary.mockResolvedValue(SUMMARY);
  for (const k of ['markDelivered', 'markFailed', 'setPayment']) svc[k].mockResolvedValue({});
});

const card = (id: string) => screen.findByTestId(`stop-${id}`);

// The header's back button and the filter chip "Delivered" share names with sheet and card buttons:
// sheet buttons are always looked up inside their sheet, card buttons inside their card.
const sheet = () => within(screen.getByTestId('paid-sheet'));

it('two steps: Delivered asks "Was it paid?"; Back sends nothing', async () => {
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-1-abcd')).getByRole('button', { name: 'Delivered' }));
  expect(screen.getByText('Was it paid?')).toBeTruthy();
  await fireEvent.press(sheet().getByRole('button', { name: 'Back' }));
  expect(await getQueue()).toEqual([]);
  expect(svc.markDelivered).not.toHaveBeenCalled();
});

it('two steps: Paid queues delivered then paid and sends them at once', async () => {
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-1-abcd')).getByRole('button', { name: 'Delivered' }));
  await fireEvent.press(sheet().getByRole('button', { name: 'Paid' }));
  await waitFor(() => expect(svc.markDelivered).toHaveBeenCalledWith('ORD-1-abcd'));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('ORD-1-abcd', 'paid'));
});

it('two steps on an already-paid order only confirms Delivered', async () => {
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-2-paid')).getByRole('button', { name: 'Delivered' }));
  expect(screen.getByText('Mark delivered?')).toBeTruthy();
  expect(screen.queryByText('Was it paid?')).toBeNull();
  await fireEvent.press(sheet().getByRole('button', { name: 'Delivered' }));
  await waitFor(() => expect(svc.markDelivered).toHaveBeenCalledWith('ORD-2-paid'));
  expect(svc.setPayment).not.toHaveBeenCalled();
});

it('one tap: nothing is sent during the undo window, and Undo cancels it', async () => {
  mockHandover = 'one_tap';
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-1-abcd')).getByRole('button', { name: 'Delivered, not paid' }));
  expect(screen.getByText('Delivered to Kasun · Not paid')).toBeTruthy();
  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(svc.markDelivered).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(svc.markDelivered).not.toHaveBeenCalled();
  expect(await getQueue()).toEqual([]);
});

it('one tap: after the window both actions are sent', async () => {
  mockHandover = 'one_tap';
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-1-abcd')).getByRole('button', { name: 'Delivered, paid' }));
  await act(async () => { jest.advanceTimersByTime(5100); });
  jest.useRealTimers();
  await waitFor(() => expect(svc.markDelivered).toHaveBeenCalledWith('ORD-1-abcd'));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('ORD-1-abcd', 'paid'));
});

it('one tap: the two buttons are 64 dp high and at least 16 dp apart', async () => {
  mockHandover = 'one_tap';
  await render(<StopsScreen />);
  const c = await card('ORD-1-abcd');
  const { StyleSheet } = require('react-native');
  for (const name of ['Delivered, paid', 'Delivered, not paid']) {
    expect(StyleSheet.flatten(within(c).getByRole('button', { name }).props.style).minHeight).toBeGreaterThanOrEqual(64);
  }
  expect(StyleSheet.flatten(within(c).getByTestId('handover-row').props.style).gap).toBeGreaterThanOrEqual(16);
});

it('Failed needs a reason; a preset is sent in English; Back sends nothing', async () => {
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-1-abcd')).getByRole('button', { name: 'Failed' }));
  const submit = screen.getByRole('button', { name: 'Mark failed' });
  expect(submit.props.accessibilityState).toMatchObject({ disabled: true });
  await fireEvent.press(screen.getByRole('button', { name: 'Wrong address' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Mark failed' }));
  await waitFor(() => expect(svc.markFailed).toHaveBeenCalledWith('ORD-1-abcd', 'Wrong address'));
});

it('Failed with typed text sends the text, trimmed, at most 500 characters', async () => {
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-1-abcd')).getByRole('button', { name: 'Failed' }));
  expect(screen.getByTestId('fail-reason-input').props.maxLength).toBe(500);
  await fireEvent.changeText(screen.getByTestId('fail-reason-input'), '  gate locked  ');
  await fireEvent.press(screen.getByRole('button', { name: 'Mark failed' }));
  await waitFor(() => expect(svc.markFailed).toHaveBeenCalledWith('ORD-1-abcd', 'gate locked'));
});

it('More corrects a payment: a paid order can be marked not paid after confirming', async () => {
  svc.getSessionOrders.mockResolvedValue([order('ORD-3-done', { status: 'completed', payment_status: 'paid' })]);
  await render(<StopsScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'All' }));
  await fireEvent.press(within(await card('ORD-3-done')).getByRole('button', { name: 'More' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Mark not paid' }));
  expect(screen.getByText('Mark not paid?')).toBeTruthy();
  await fireEvent.press(within(screen.getByTestId('confirm-sheet')).getByRole('button', { name: 'Mark not paid' }));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('ORD-3-done', 'unpaid'));
});

it('More on a waiting order with payment pending offers Mark not paid without delivering (story 8)', async () => {
  svc.getSessionOrders.mockResolvedValue([order('ORD-4-wait', { status: 'pending' })]);
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-4-wait')).getByRole('button', { name: 'More' }));
  expect(screen.getByRole('button', { name: 'Mark paid' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Mark not paid' }));
  await fireEvent.press(within(screen.getByTestId('confirm-sheet')).getByRole('button', { name: 'Mark not paid' }));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('ORD-4-wait', 'unpaid'));
  expect(svc.markDelivered).not.toHaveBeenCalled();
});

it('offline: the handover is kept on the phone and the card says so', async () => {
  svc.markDelivered.mockRejectedValue({ status: 0, code: 'NETWORK_ERROR', message: 'Network error' });
  await render(<StopsScreen />);
  await fireEvent.press(within(await card('ORD-1-abcd')).getByRole('button', { name: 'Delivered' }));
  await fireEvent.press(sheet().getByRole('button', { name: 'Paid' }));
  await waitFor(async () => expect((await getQueue()).map((i) => i.action.kind)).toEqual(['delivered', 'paid']));
  await fireEvent.press(screen.getByRole('button', { name: 'All' }));
  expect(within(await card('ORD-1-abcd')).getByText('Waiting to send')).toBeTruthy();
});
```

Note: this file does NOT mock `@/hooks/useActionQueue` (it uses the real queue and runner functions; `sendNow` is triggered by the handover code). Run red.

- [ ] **Step 2: Implement** to the boards: `HandoverButtons` (two-step: `Delivered` `primary lg` + `Failed` `danger`/`outline` per board; one-tap: row `testID="handover-row"` with `gap: touch.gap`, `Delivered, not paid` left (`secondary lg`), `Delivered, paid` right (`primary lg`), `Failed` below), `PaidSheet` (`testID="paid-sheet"`; pending payment → `handover.wasItPaid` with Paid / Not paid / Back; settled → `handover.confirmDelivered` with Delivered / Back; the order line `confirm.orderLine`), `FailSheet` (preset chips as 56 dp buttons that fill the text box with the **translated label** while remembering the English `sent` value; typing replaces the preset; submit sends the preset's English text if the box still equals the translated label, otherwise the trimmed text; `testID="fail-reason-input"`, `maxLength={500}`; Mark failed disabled when empty), `MoreSheet` (one button per `moreActions` → a `confirm-sheet` with `confirm.paidTitle` / `confirm.unpaidTitle` and the matching button plus Back), `UndoBar` (fixed above the tab bar while any order has waiting items whose `sendAfter > now`; text `handover.undoBar` with the payment label `pay.paid` / `pay.unpaid`, countdown `handover.sendingIn`, `Undo` `ink lg` button calling `undo(ids)`). Every queued action: `Haptics.notificationAsync(Success)`; then `sendNow()` (immediately, or after `UNDO_MS` + 100 ms for one tap). Delete `components/failReasonModal` and its test.

- [ ] **Step 3: Verify** — jest/tsc/lint. Device (only with the owner's permission for this task, because handovers write to the server): with `flow.delivery`, one delivering test order per case: two-step Paid; two-step Back; one-tap Undo (switch the setting once Task 17 exists; otherwise jest-only and say so); Failed with a preset; Wi-Fi off → handover → "Waiting to send" → kill and reopen the app → still waiting → Wi-Fi on → sent within 15 s (spec success criterion 6). If the owner does not allow writes, every case is jest-only and the report says so. Screenshots next to the boards.

- [ ] **Step 4: Commit** — `feat(handover): two-step and one-tap handover with undo, failure presets and payment corrections, all queued`

### Task 16: Unpaid

**Boards:** `Unpaid`.

**Files:**
- Modify: `screens/pendingPayments/pendingPayments.screen.tsx`, `screens/__tests__/pendingPayments.screen.test.tsx`

**Interfaces:**
- Consumes: `menuApi.getMyDeliverySessions` (every area in any session today: union of `mine`), `locationService.getAreas` (names), `deliveryService.getUnpaidOrders(areaId)` per area, `groupByDate`, `colomboToday`, `formatAmount`, `matchesStop`, `shortRef`, `overlayQueue`, `enqueue` + `sendNow`.

- [ ] **Step 1: Tests first.** Replace `pendingPayments.screen.test.tsx` (its old strings and the single-area assumption change by design, spec §6.4; record a Ruling line in the ledger):

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import PendingPaymentsScreen from '../pendingPayments/pendingPayments.screen';
import { _resetQueueForTests } from '@/services/delivery/actionQueue';

jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return { useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn(), NotificationFeedbackType: { Success: 'success' } }));
jest.mock('@/services', () => ({
  deliveryService: { getUnpaidOrders: jest.fn(), setPayment: jest.fn() },
  menuApi: { getMyDeliverySessions: jest.fn(async () => [{ id: 1, meal_time: 'breakfast', state: 'closed', mine: [3], taken: [] }, { id: 2, meal_time: 'lunch', state: 'open', mine: [3, 4], taken: [] }]) },
  locationService: { getAreas: jest.fn(async () => [{ area_id: 3, area_name: 'Hostel A' }, { area_id: 4, area_name: 'Kandy Rd' }]) },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
}));
jest.mock('@/services/delivery/orderView', () => ({ ...jest.requireActual('@/services/delivery/orderView'), colomboToday: () => '2026-10-29' }));

import { deliveryService } from '@/services';
const svc = deliveryService as unknown as Record<'getUnpaidOrders' | 'setPayment', jest.Mock>;
const order = (order_id: string, area_id: number, target_date: string, total_price: number, status = 'delivered') => ({
  order_id, status, payment_status: 'unpaid', customer_id: 'c', customer_name: `Name ${order_id}`, customer_phone: '0771234567',
  customer_address: `Room ${order_id}`, area_id, meal_time: 'lunch', target_date, total_price, failure_reason: null, created_at: '', items: [],
});

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  _resetQueueForTests();
  svc.getUnpaidOrders.mockImplementation(async (areaId: number) => (areaId === 3 ? [order('ORD-A', 3, '2026-10-28', 100), order('ORD-B', 3, '2026-10-29', 200, 'delivery_failed')] : [order('ORD-C', 4, '2026-10-29', 50)]));
  svc.setPayment.mockResolvedValue({});
});

it('every area I hold today, once each, grouped by day with totals', async () => {
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText('Today · 2 orders · Rs 250.00')).toBeTruthy();
  expect(screen.getByText('2026-10-28 · 1 orders · Rs 100.00')).toBeTruthy();
  expect(screen.getByText('Outstanding: 3 orders · Rs 350.00')).toBeTruthy();
  expect(within(screen.getByTestId('unpaid-ORD-B')).getByText('Failed')).toBeTruthy();
  expect(within(screen.getByTestId('unpaid-ORD-C')).getByText('Kandy Rd')).toBeTruthy();
  expect(svc.getUnpaidOrders.mock.calls.map(([id]) => id).sort()).toEqual([3, 4]);
});

it('searches by address and by short reference', async () => {
  await render(<PendingPaymentsScreen />);
  await fireEvent.changeText(await screen.findByPlaceholderText('Search name, #ref or phone'), 'room ord-a');
  expect(screen.getByTestId('unpaid-ORD-A')).toBeTruthy();
  expect(screen.queryByTestId('unpaid-ORD-B')).toBeNull();
});

it('Mark paid asks first, then queues and sends it', async () => {
  await render(<PendingPaymentsScreen />);
  await fireEvent.press(within(await screen.findByTestId('unpaid-ORD-A')).getByRole('button', { name: 'Mark paid' }));
  expect(screen.getByText('Mark paid?')).toBeTruthy();
  await fireEvent.press(within(screen.getByTestId('confirm-sheet')).getByRole('button', { name: 'Mark paid' }));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('ORD-A', 'paid'));
});

it('empty and error states', async () => {
  svc.getUnpaidOrders.mockResolvedValue([]);
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText('No unpaid orders')).toBeTruthy();
  svc.getUnpaidOrders.mockRejectedValue({ status: 0, code: 'NETWORK_ERROR', message: 'x' });
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText("Couldn't load unpaid orders")).toBeTruthy();
});
```

Run red.

- [ ] **Step 2: Implement** to the `Unpaid` board: header `unpaid.title`; search; `SectionList` (`keyExtractor`), section header `unpaid.group` with `label` = `unpaid.today` / `unpaid.undated` / the date; cards (`testID="unpaid-<id>"`): name, `#ref`, area name, `meal.<meal_time>`, `Chip` from `chipFor`, amount, `Mark paid` (`primary`, 56 dp) → `confirm-sheet` → `enqueue(id, [{ kind: 'paid' }])` + `sendNow()` + haptic; queue overlay hides a waiting-paid order from the list and shows refused messages like Stops; footer `unpaid.outstanding` (from the server list minus waiting-paid orders). Remove the `loadSelection` dependency. Keep the latest-wins `loadSeq` guard.

- [ ] **Step 3: Verify** — jest/tsc/lint. Device: Unpaid tab with test data; screenshot next to the board; open Mark paid and choose Back.

- [ ] **Step 4: Commit** — `feat(unpaid): unpaid orders across all my areas, queued Mark paid`

### Task 17: Settings

**Boards:** `Settings`, `Sinhala`.

**Files:**
- Modify: `screens/settings/settings.screen.tsx`
- Test: `screens/__tests__/settings.screen.test.tsx`

**Interfaces:** Consumes `useSettings`, `useT`, `useActionQueue`, `waitingCount`, `authService.getCurrentUser`, `authService.logout`, `clearDeliveryStorage`, `UNDO_MS`. Log out → `router.replace('/(routes)/login')`.

- [ ] **Step 1: Tests first** `screens/__tests__/settings.screen.test.tsx`

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import SettingsScreen from '../settings/settings.screen';
import { SettingsProvider } from '@/services/settings/SettingsContext';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/services', () => ({
  authService: { getCurrentUser: jest.fn(async () => ({ full_name: 'Flow Delivery' })), logout: jest.fn(async () => undefined) },
}));
let mockQueue: any[] = [];
jest.mock('@/hooks/useActionQueue', () => ({ useActionQueue: () => mockQueue }));
import { router } from 'expo-router';
import { authService } from '@/services';

const renderIt = () => render(<SettingsProvider><SettingsScreen /></SettingsProvider>);

beforeEach(async () => {
  jest.clearAllMocks();
  mockQueue = [];
  await AsyncStorage.clear();
});

it('switches the language at once and keeps it', async () => {
  await renderIt();
  await fireEvent.press(await screen.findByRole('radio', { name: 'සිංහල' }));
  expect(await screen.findByText('සැකසුම්')).toBeTruthy();
  await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem('rc_settings'))!).language).toBe('si'));
});

it('two steps is the default; one tap can be chosen', async () => {
  await renderIt();
  expect((await screen.findByRole('radio', { name: /Two steps/ })).props.accessibilityState).toMatchObject({ checked: true });
  await fireEvent.press(screen.getByRole('radio', { name: /One tap, with Undo/ }));
  await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem('rc_settings'))!).handover).toBe('one_tap'));
  expect(screen.getByText('Tap Delivered, paid or Delivered, not paid. Undo for 5 seconds.')).toBeTruthy();
});

it('shows who is signed in and logs out', async () => {
  await renderIt();
  expect(await screen.findByText('Signed in as Flow Delivery')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));
  await waitFor(() => expect(authService.logout).toHaveBeenCalled());
  expect(router.replace).toHaveBeenCalledWith('/(routes)/login');
});

it('log out is blocked while updates wait to be sent; refused ones do not block', async () => {
  mockQueue = [{ state: 'waiting' }, { state: 'waiting' }, { state: 'refused' }];
  await renderIt();
  await fireEvent.press(await screen.findByRole('button', { name: 'Log out' }));
  expect(screen.getByText('2 updates are not sent yet. Connect to the internet to send them before logging out.')).toBeTruthy();
  expect(authService.logout).not.toHaveBeenCalled();
});
```

Run red.

- [ ] **Step 2: Implement** to the board: two radio groups (each option a 56 dp row, `accessibilityRole="radio"`, `accessibilityState={{ checked }}`, `accessibilityLabel` = title + help for handover), the language options labelled in their own language (`settings.english`, `settings.sinhala`), the help line `settings.oneTapHelp` with `{ seconds: UNDO_MS / 1000 }`, the account line, `Log out` (`outline`), the blocked message inline under it (not an Alert). Logout clears `clearDeliveryStorage()` but **not** `rc_settings` and not `rc_action_queue`.

- [ ] **Step 3: Verify** — jest/tsc/lint. Device: switch to Sinhala, visit every tab and an area's stops, screenshot each in Sinhala next to the `Sinhala` board, switch back to English. Switch handover to one tap and back.

- [ ] **Step 4: Commit** — `feat(settings): language, handover style and a safe log out`

### Task 18: Sign in and Manage areas

**Boards:** `SignIn`, `ManageAreas`.

**Files:**
- Modify: `screens/auth/login/login.screen.tsx`, `screens/manageAreas/manageAreas.screen.tsx`
- Delete: `screens/area-selection/area-selection.screen.tsx`, `screens/__tests__/area-selection.screen.test.tsx`
- Test: `screens/__tests__/login.screen.test.tsx`, `screens/__tests__/manageAreas.screen.test.tsx`

**Interfaces:** Login consumes `authService.login`, `getFcmToken`, `clearDeliveryStorage`, `useSettings` (language switch). Manage areas consumes `menuApi.getMyDeliverySessions`, `setMyDeliveryAreas`, `locationService.getAreas`, `pickSession`.

- [ ] **Step 1: Tests first**

`screens/__tests__/login.screen.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import LoginScreen from '../auth/login/login.screen';
import { SettingsProvider } from '@/services/settings/SettingsContext';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/services/push/push.service', () => ({ getFcmToken: jest.fn(async () => 'fcm-1') }));
jest.mock('@/services/delivery/selection', () => ({ clearDeliveryStorage: jest.fn(async () => undefined) }));
jest.mock('@/services', () => ({
  authService: { login: jest.fn() },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
}));
import { router } from 'expo-router';
import { authService } from '@/services';
const login = authService.login as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('both fields are required', async () => {
  await render(<LoginScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText('Email is required')).toBeTruthy();
  expect(screen.getByText('Password is required')).toBeTruthy();
  expect(login).not.toHaveBeenCalled();
});

it('a good login goes straight to the areas, with no success popup', async () => {
  login.mockResolvedValue({ user: { full_name: 'Flow Delivery' } });
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('Email'), ' flow.delivery@test.local ');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'Passw0rd!');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)'));
  expect(login).toHaveBeenCalledWith({ email: 'flow.delivery@test.local', password: 'Passw0rd!', fcm_token: 'fcm-1' });
  expect(Alert.alert).not.toHaveBeenCalled();
});

it('wrong password and non-driver accounts get their messages in a banner', async () => {
  login.mockRejectedValueOnce(new Error('Invalid credentials'));
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.c');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'x');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Invalid email or password. Please try again')).toBeTruthy();
  login.mockRejectedValueOnce(new Error('Only delivery personnel can log in'));
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Only delivery personnel are allowed to access this application')).toBeTruthy();
});

it('the language can be switched before signing in', async () => {
  await render(<SettingsProvider><LoginScreen /></SettingsProvider>);
  await fireEvent.press(await screen.findByRole('button', { name: 'සිංහල' }));
  expect(await screen.findByRole('button', { name: 'පිවිසෙන්න' })).toBeTruthy();
});

it('no Remember me', async () => {
  await render(<LoginScreen />);
  expect(screen.queryByText(/Remember me/i)).toBeNull();
});
```

`screens/__tests__/manageAreas.screen.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import ManageAreasScreen from '../manageAreas/manageAreas.screen';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/services', () => ({
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
  locationService: { getAreas: jest.fn(async () => [{ area_id: 3, area_name: 'Hostel A' }, { area_id: 4, area_name: 'Kandy Rd' }, { area_id: 5, area_name: 'Lake Rd' }]) },
  menuApi: {
    getMyDeliverySessions: jest.fn(async () => [{ id: 7, date: '2026-10-29', meal_time: 'lunch', state: 'closed', mine: [3, 4], taken: [5], start_time: '', end_time: '', notes: null }]),
    setMyDeliveryAreas: jest.fn(async () => undefined),
  },
}));
import { menuApi } from '@/services';
const setAreas = menuApi.setMyDeliveryAreas as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('lists mine, free and taken; Release is its own 56 dp button', async () => {
  (menuApi.getMyDeliverySessions as jest.Mock).mockResolvedValueOnce([{ id: 7, date: '2026-10-29', meal_time: 'lunch', state: 'closed', mine: [3, 4], taken: [], start_time: '', end_time: '', notes: null }]);
  await render(<ManageAreasScreen />);
  expect(await screen.findByText('My areas')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Release Hostel A' }));
  await waitFor(() => expect(setAreas).toHaveBeenCalledWith(7, [4]));
});

it('Take adds a free area; an area another driver covers cannot be taken', async () => {
  (menuApi.getMyDeliverySessions as jest.Mock).mockResolvedValueOnce([{ id: 7, date: '2026-10-29', meal_time: 'lunch', state: 'closed', mine: [3], taken: [5], start_time: '', end_time: '', notes: null }]);
  await render(<ManageAreasScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Take Kandy Rd' }));
  await waitFor(() => expect(setAreas).toHaveBeenCalledWith(7, [3, 4]));
  expect(screen.queryByRole('button', { name: 'Take Lake Rd' })).toBeNull();
  expect(screen.getByText('Covered by other drivers')).toBeTruthy();
});

it('the last area in a meal cannot be released', async () => {
  (menuApi.getMyDeliverySessions as jest.Mock).mockResolvedValueOnce([{ id: 7, date: '2026-10-29', meal_time: 'lunch', state: 'closed', mine: [3], taken: [], start_time: '', end_time: '', notes: null }]);
  await render(<ManageAreasScreen />);
  await screen.findByText('Hostel A');
  expect(screen.queryByRole('button', { name: 'Release Hostel A' })).toBeNull();
});

it('a refused take shows the server message', async () => {
  setAreas.mockRejectedValueOnce(new Error('Area already covered'));
  (menuApi.getMyDeliverySessions as jest.Mock).mockResolvedValueOnce([{ id: 7, date: '2026-10-29', meal_time: 'lunch', state: 'closed', mine: [3], taken: [], start_time: '', end_time: '', notes: null }]);
  await render(<ManageAreasScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Take Kandy Rd' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Could not take this area', 'Area already covered'));
});
```

Run red.

- [ ] **Step 2: Implement** to the boards. Login: hero per board (keep `assets/images/rc.jpg` only if the board uses it; re-encode below 150 KB if it stays), language switch (two 56 dp buttons `settings.english` / `settings.sinhala`), labelled fields (`accessibilityLabel` = `login.email` / `login.password`), password eye 56 dp (`login.showPassword` / `login.hidePassword`), inline banner for server errors, the same error mapping as today with translated strings, `clearDeliveryStorage()` before navigating, `router.replace('/(tabs)')`, no Raleway/Nunito imports. Manage areas: back button, meal chips (default `pickSession`), groups `manage.mine` / `manage.free` / `manage.taken`, row = area name + a separate 56 dp `Release` / `Take` button (`accessibilityLabel` `"Release {name}"` / `"Take {name}"` built from `t('manage.release') + ' ' + name`), Release hidden when `mine.length === 1`, errors via `Alert.alert(t('manage.takeError' | 'manage.releaseError'), message)`, reload after each change. Delete the old area-selection screen and test.

- [ ] **Step 3: Verify** — jest/tsc/lint; `bash scripts/asset-weight.sh` not above the Phase 0 total. Device: sign out from Settings, Sign in screen in English and Sinhala (screenshot beside `SignIn`), wrong password once, sign in; Manage areas screenshot beside `ManageAreas` (do not take or release unless the owner allows it).

- [ ] **Step 4: Commit** — `feat(auth,areas): rider sign in with language switch; manage areas with separate take and release`

**PHASE 3 GATE (stop here):** `npx jest` (record totals), `npx tsc --noEmit`, `npx expo lint`, `bash scripts/asset-weight.sh`, `bash scripts/perf-frames.sh` ×3 on Stops (compare with `perf-baseline.md`), then a gate page `docs/superpowers/ui-audit/phase-3-gate.md` with every phone screenshot (English and Sinhala) **beside its board**, a "what still differs from the mockups" list naming the owning task for each difference, every jest-only behaviour listed as jest-only, and the open questions. Stop and report.

---

# PHASE 4 — Wrap-up

### Task 19: Dead code, literals, packages

**Files:**
- Delete: `screens/home/home.screen.tsx`, `screens/__tests__/home.screen.test.tsx` (replaced by Stops and its tests), `components/popupmodel/popupModel.tsx`, `components/__tests__/popupModel.test.tsx`, `constants/Colors.ts`, `hooks/useThemeColor.ts`, `hooks/useColorScheme.ts`, `hooks/useColorScheme.web.ts`, `styles/common/common.styles.tsx` — each only after `rg` shows no remaining import (if one remains, keep the file and list it in the report)
- Modify: `services/delivery/selection.ts` (keep only `clearDeliveryStorage`; delete `saveSelection` / `loadSelection` and their tests in `selection.test.ts` if `rg` shows no consumer), `services/delivery/orderView.ts` (delete `formatRs` and `orderActions` if unused, with their tests), `jest.setup.ts` (remove the Raleway and Nunito mocks), `package.json` / `package-lock.json` (`npm uninstall @expo-google-fonts/raleway @expo-google-fonts/nunito` if `rg` shows no import, P1)

- [ ] **Step 1: The checks, each must print nothing**

```bash
rg -n "#[0-9a-fA-F]{3,8}\b|fontSize|fontWeight" screens components --glob '!components/ui/**' --glob '!**/__tests__/**'
rg -n ">[^<{}\s][^<{}]*</(AppText|Text)>" screens components --glob '!**/__tests__/**'
rg -n "placeholder=\"|title=\"[A-Za-z]|accessibilityLabel=\"[A-Za-z]" screens components --glob '!**/__tests__/**'
rg -n "Raleway|Nunito|popupModel|failReasonModal|area-selection" app screens components services hooks
```

Fix what they find (move strings into the dictionaries, colours into tokens). The only allowed exception is the Sheet's `testID` values.

- [ ] **Step 2: Gates** — `npx jest` green (record totals), `npx tsc --noEmit` 0, `npx expo lint` 0 errors / ≤ 19 warnings, `bash scripts/asset-weight.sh`.

- [ ] **Step 3: Commit** — `chore: remove the replaced screens, popups, fonts and dead helpers`

### Task 20: Device checklist and the full device pass

**Files:**
- Modify: `docs/DEVICE-CHECKLIST.md` (rewrite for the new app), `docs/client-notes/2026-10-29-kitchen-parcel-labels.md` (attach the Sinhala string list: export `i18n/si.ts` values beside `en.ts` as a two-column table in a new file `docs/client-notes/2026-10-29-sinhala-strings.md`), `docs/superpowers/perf-baseline.md` (append "After" section), `OVERVIEW.md` (status section: the new navigation and the queue)
- Create: `docs/superpowers/ui-audit/after/*.png`

- [ ] **Step 1: Rewrite the checklist** with one checkbox per spec §2 and §6 behaviour, grouped: Sign in; Areas (mounted, keep-awake, meal switch, waiting count); Stops (groups, duplicate-name digits, `#ref` search, Call, Start delivery); Handover two-step; Handover one-tap with Undo; Failed presets; More corrections; Offline (Wi-Fi off → handover → restart → Wi-Fi on → sent); Unpaid; Settings (language, style, blocked log out); Manage areas; Sinhala on every screen; font scale 1.3 (only with the owner's permission); iOS pass list (unverified).

- [ ] **Step 2: Run the pass** with the owner present for every write. Screenshots into `ui-audit/after/`. Perf ×3 on Stops and Areas; append to `perf-baseline.md`.

- [ ] **Step 3: Commit** — `docs: device checklist, Sinhala string list for the client, after measurements`

### Task 21: Final review and finishing

- [ ] **Step 1:** Final whole-branch review on `claude-opus-5-5-high` (diff `git merge-base feat/driver-delivery-flow HEAD`..HEAD), pointed at the ledger's `minor (deferred)` and `Ruling:` lines and at spec §9.
- [ ] **Step 2:** One fix dispatch for its findings, one scoped re-review.
- [ ] **Step 3:** `superpowers:finishing-a-development-branch`. It asks the owner before any merge, push or PR: stop and ask.

---

## Self-review (against the spec)

| Spec item | Task |
|---|---|
| §2 C1/C2 mounted Areas, all areas, counts | 11, 13 |
| §2 C3/C4 stops, names, duplicate digits, Call, no PIN | 9, 14 |
| §2 C5 kitchen labels / short reference | 9 (`shortRef`), client note; Admin follow-up out of scope |
| §2 C6 English + Sinhala setting | 8, 17, 18 |
| §2 C7 two styles, two-step default, Undo | 8, 15, 17 |
| §2 C8 Failed reason first | 15 |
| §2 C9 offline queue | 10, 14, 15, 16, 17 |
| §2 C10 approach 1 navigation | 12 |
| §2 C11 visual reference | 4, 6, 7 |
| §4 7:1, sizes, 56/64 dp, 16 dp gap, font scale | 6, 7, 15, 20 |
| §4 strings only from dictionaries; no literals | 8, 19 |
| §4 one dependency | 12 |
| §6.4 Unpaid across areas | 16 |
| §6.5 corrections from More | 9, 15 |
| §6.6 queue rules incl. 409-already-applied, refused, blocked log out | 10, 17 |
| §6.10 P1–P7 confirmed at Gate 1 | 5 |
| §7 phases and gates | Phase gates after 3, 5, 11, 18 |
| §9 success criteria | 19 (grep, gates), 20 (device, perf, Sinhala, offline) |
