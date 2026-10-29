# RC Delivery App Visual Refresh (v2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the driver app look current and quicker to use: an Areas hero, compact collapsible stop cards, a clear button hierarchy, a safer handover (equal-weight Paid / Not paid, slide to confirm), and motion, without breaking the rider rules.

**Architecture:** This plan **overlays** the base plan (`2026-10-29-driver-ui-modernization.md`). It adds redrawn boards, extra tokens and UI-kit pieces, and changes how base Tasks 9, 10, 13, 14 and 15 are built. Nothing here replaces the base plan's phases, gates or execution rules (SDD ledger, device safety, one local commit per task, never push).

**Tech Stack:** Expo SDK 58, React Native 0.88, Reanimated 4.7.1, react-native-gesture-handler ~3.3.0, expo-haptics, jest-expo. No new dependency (a font package only if the owner picks Inter at Gate 1).

**Spec:** `docs/superpowers/specs/2026-10-29-driver-ui-v2-visual-refresh-design.md` (binding addendum), on top of `docs/superpowers/specs/2026-10-29-driver-ui-modernization-design.md`.

## Global Constraints

- All base-plan Global Constraints apply unchanged (7:1 text contrast, 56 dp controls / 64 dp handover buttons / 16 dp gap, font scale 1.3, opacity and transform animation only, no blur, no hard-coded colour or size in `screens/` or `components/` outside `components/ui/`, every string through `useT()`, sentence case, no formatter, one local commit per task, never push).
- No new dependency. A font package is allowed only after the owner chooses it at Gate 1 (Task V1).
- Every new colour pair is added to `theme/__tests__/contrast.test.ts`.

## Order of work against the base plan

| Step | What | Base plan relation |
|---|---|---|
| V0 | Amend the base spec and plan with A1–A6 | docs only; do before base Tasks 6+ |
| V1 | Redraw the boards as v2, **Gate 1** | replaces base Tasks 4–5 output; the base Phase 0 audit (Tasks 1–3) still runs first |
| V2 | Tokens | extends base Task 6 |
| V3 | UI kit additions | extends base Task 7 |
| V4 | Short reference and queue changes | extends base Tasks 9–10 |
| V5 | Areas hero | builds base Task 13 |
| V6 | Collapsible stop card | builds base Task 14 |
| V7 | Handover | builds base Task 15 |
| V8 | Shell polish and motion | after base Task 17 |

---

### Task V0: Amend the base spec and plan

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-driver-ui-modernization-design.md` (§6.3, §6.6, §6.8, §6.9, add a line at the top: `Amended by 2026-10-29-driver-ui-v2-visual-refresh-design.md (A1–A6)`)
- Modify: `docs/superpowers/plans/2026-10-29-driver-ui-modernization.md` (Task 9 `shortRef` test and code, Task 10 result handling and storage key, Task 6 `type.micro`)

- [ ] **Step 1: Apply A1–A6**

Edit the base spec sections to match addendum §3 exactly (queue 401 / 408 / 429, `dependsOn`, per-user key, `shortRef` mapping, Call hidden at hostel groups, `micro` 16).

- [ ] **Step 2: Update the base plan's tests and code to match**

In base Task 9, change the `shortRef` expectation to the mapped output: `ORD-1792999353509-9f6o7l` → last four `6o7l` → upper `6O7L` → mapped `6D7T`; the example in the spec becomes `#6D7T`. In base Task 10, add test cases for 401 (queue paused, items stay waiting), 408 and 429 (retried), a refused Delivered item refusing its dependent payment item, and the per-user key. In base Task 6, `type.micro` becomes 16 and the contrast test's rider-size case asserts `micro >= 16`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs docs/superpowers/plans
git commit -m "docs: amend driver UI spec and plan with the v2 review findings (A1-A6)"
```

---

### Task V1: v2 boards and Gate 1

**Files:**
- Create: `docs/superpowers/mockups/driver-ui-mockups-v2.html` (self-contained, same rules as base Task 4: inline CSS, no CDN, system font stack)
- Create: `docs/superpowers/mockups/png-v2/<Board>.png`, `docs/superpowers/mockups/README-v2.md`
- Keep: the v1 files, untouched, for the side-by-side comparison.

**Boards (390 × 844, id = name):**

| Board | Must show |
|---|---|
| `Areas-v2` | Hero card with "8 orders" at count size, "12 parcels" below, progress bar; two compact rows (one finished with a check); segmented meal control; "3 updates waiting" line; at least 4 areas visible; Sinhala variant of the same board |
| `Stops-v2` | Hostel group: sticky header, five collapsed cards visible, one expanded card (Call hidden at a hostel, Failed and More shown); a house stop with the Call icon button |
| `Card-v2` | Every state: waiting, on the way, waiting to send, refused with Dismiss, delivered paid, delivered not paid, failed with reason; each with avatar, stripe, chip dot |
| `Handover-v2` | Two-step sheet (equal weight Paid / Not paid), already-paid variant, slide-to-confirm at rest and half-way, the shared Undo bar with "2 pending" |
| `TabBar-v2` | Floating tab bar with the Unpaid badge |
| `Fonts` | The Areas hero and a stop card in the system font beside the same in Inter + Noto Sans Sinhala |

- [ ] **Step 1: Draw the boards** using the spec §4 tokens. Hero text colours: `onHero` and `onHeroSoft` only.
- [ ] **Step 2: Self-check** with the base Task 4 Step 3 procedure: every board renders, Sinhala glyphs render, no overflow in the 390 px frame, and at font scale 1.3 (set `font-size` 1.3×) the Areas screen still shows four areas in English.
- [ ] **Step 3: Render PNGs** into `png-v2/` and write `README-v2.md`: one section per board with its PNG, which spec change (D1–D7) it shows, then "Decisions to confirm": fonts (system or Inter), reference format R (mapped letters or a backend sequence), and "slide to confirm in the one-choice style".
- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/mockups
git commit -m "docs(mockups): v2 boards for the visual refresh"
```

**GATE 1 (stop).** The owner approves each board, and decides fonts and R. Record each answer as a `Ruling:` in the ledger. If Inter is chosen, add its package in Task V2 (pinned, no `npx --yes`). If R is the backend sequence, open a separate backend task; this plan continues with the mapped reference.

---

### Task V2: Tokens

**Files:**
- Modify: `theme/index.ts`, `theme/__tests__/contrast.test.ts` (both created by base Task 6)

**Interfaces:** Produces `color.hero`, `color.onHero`, `color.onHeroSoft`, `color.heroTrack`, `color.heroFill`.

- [ ] **Step 1: Add the failing cases** to `theme/__tests__/contrast.test.ts`

```ts
test('hero text pairs reach 7:1', () => {
  expect(contrast(color.onHero, color.hero)).toBeGreaterThanOrEqual(AAA);
  expect(contrast(color.onHeroSoft, color.hero)).toBeGreaterThanOrEqual(AAA);
});

test('hero progress fill is visible on the hero (non-text 3:1)', () => {
  expect(contrast(color.heroFill, color.hero)).toBeGreaterThanOrEqual(3);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest theme/__tests__/contrast.test.ts`
Expected: FAIL (the new tokens are `undefined`).

- [ ] **Step 3: Add the tokens** inside the `color` object in `theme/index.ts`

```ts
  hero: '#1B5E20', // Areas hero card fill (= brandStrong)
  onHero: '#FFFFFF', // 7.87:1 on hero
  onHeroSoft: '#F1FAF2', // secondary text on hero; the test enforces >= 7
  heroTrack: 'rgba(255,255,255,0.25)', // progress track on hero (decorative)
  heroFill: '#69bf70', // progress fill on hero, 3.48:1 (non-text)
```

If `onHeroSoft` fails 7:1, lighten it until the test passes; do not lower the threshold.

- [ ] **Step 4: Run to verify they pass.** `npx jest`, `npx tsc --noEmit`, `npx expo lint`.
- [ ] **Step 5: Commit** `git add theme && git commit -m "feat(theme): hero tokens with contrast tests"`

---

### Task V3: UI kit additions

**Files:**
- Create: `components/ui/ProgressBar.tsx`, `components/ui/IconButton.tsx`, `components/ui/Avatar.tsx`, `components/ui/SlideToConfirm.tsx`, `components/ui/slide.ts`
- Test: `components/__tests__/ui-v2.test.tsx`, `components/__tests__/slide.test.ts`

**Interfaces:**
- `ProgressBar({ done: number, total: number, tone?: 'hero'|'brand' = 'brand' })`: renders a bar with `accessibilityRole="progressbar"` and `accessibilityValue={{ min: 0, max: total, now: done }}`; width fraction `total === 0 ? 0 : min(done / total, 1)`.
- `IconButton({ icon, label, onPress, variant?: 'tint'|'primary'|'ink' = 'tint', disabled? })`: a 56 dp square (`touch.min`) with `accessibilityLabel={label}`; `tint` = `brandSoft` fill with `brandStrong` icon, `primary` = brand fill with `onBrand` icon.
- `Avatar({ name })`: a 40 dp circle, `brandSoft` fill, up to two initials in `brandStrong` (`initials('Kasun Perera')` = `KP`, `initials('Amal')` = `A`, `initials('')` = `?`).
- `shouldConfirm(translationX: number, trackWidth: number, thumb: number): boolean` in `slide.ts`: true when `translationX >= (trackWidth - thumb) * 0.9`.
- `SlideToConfirm({ label, onConfirm, disabled? })`: a 64 dp track with a draggable 64 dp thumb; releasing past `shouldConfirm` calls `onConfirm` once and haptics; otherwise the thumb springs back. It also exposes `accessibilityActions={[{ name: 'activate', label }]}` so a screen reader or a double tap on the track calls `onConfirm` without sliding.

- [ ] **Step 1: Write the failing tests**

`components/__tests__/slide.test.ts`:

```ts
import { shouldConfirm } from '../ui/slide';

it('confirms only near the end of the track', () => {
  expect(shouldConfirm(0, 300, 64)).toBe(false);
  expect(shouldConfirm(100, 300, 64)).toBe(false);
  expect(shouldConfirm(213, 300, 64)).toBe(false); // 90% of 236 is 212.4
  expect(shouldConfirm(213.5, 300, 64)).toBe(true);
  expect(shouldConfirm(236, 300, 64)).toBe(true);
});
```

`components/__tests__/ui-v2.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, initials } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';
import { ProgressBar } from '../ui/ProgressBar';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { touch } from '@/theme';

it('initials handle two names, one name and nothing', () => {
  expect(initials('Kasun Perera')).toBe('KP');
  expect(initials('Amal')).toBe('A');
  expect(initials('  ')).toBe('?');
});

it('Avatar shows the initials', async () => {
  await render(<Avatar name="Nimali Silva" />);
  expect(screen.getByText('NS')).toBeTruthy();
});

it('ProgressBar reports done of total and never exceeds 100%', async () => {
  await render(<ProgressBar done={5} total={13} />);
  expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({ min: 0, max: 13, now: 5 });
  await render(<ProgressBar done={3} total={0} />);
  expect(screen.getAllByRole('progressbar')[1].props.accessibilityValue.now).toBe(3);
});

it('IconButton is a labelled 56 dp button', async () => {
  const onPress = jest.fn();
  await render(<IconButton icon="call-outline" label="Call Kasun" onPress={onPress} />);
  const b = screen.getByRole('button', { name: 'Call Kasun' });
  expect(StyleSheet.flatten(b.props.style).minHeight).toBe(touch.min);
  expect(StyleSheet.flatten(b.props.style).minWidth).toBe(touch.min);
  await fireEvent.press(b);
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('SlideToConfirm can be activated without sliding, once', async () => {
  const onConfirm = jest.fn();
  await render(<SlideToConfirm label="Slide: delivered, paid" onConfirm={onConfirm} />);
  const track = screen.getByLabelText('Slide: delivered, paid');
  await fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run to verify they fail.** `npx jest components/__tests__/slide.test.ts components/__tests__/ui-v2.test.tsx` → FAIL, modules not found.

- [ ] **Step 3: Write the code**

`components/ui/slide.ts`:

```ts
export const shouldConfirm = (translationX: number, trackWidth: number, thumb: number) =>
  translationX >= (trackWidth - thumb) * 0.9;
```

`components/ui/Avatar.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { color } from '@/theme';
import { AppText } from './AppText';

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
};

export function Avatar({ name }: { name: string }) {
  return (
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="caption" weight="bold" tone="brand">{initials(name)}</AppText>
    </View>
  );
}
```

`components/ui/ProgressBar.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { color, radius } from '@/theme';

export function ProgressBar({ done, total, tone = 'brand' }: { done: number; total: number; tone?: 'hero' | 'brand' }) {
  const fraction = total === 0 ? 0 : Math.min(done / total, 1);
  const track = tone === 'hero' ? color.heroTrack : color.field;
  const fill = tone === 'hero' ? color.heroFill : color.brand;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ height: 8, borderRadius: radius.pill, backgroundColor: track, overflow: 'hidden' }}
    >
      <View style={{ width: `${fraction * 100}%`, height: 8, backgroundColor: fill }} />
    </View>
  );
}
```

`components/ui/IconButton.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { color, radius, touch } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const look = {
  tint: { fill: color.brandSoft, ink: color.brandStrong },
  primary: { fill: color.brand, ink: color.onBrand },
  ink: { fill: color.ink, ink: color.onInk },
} as const;

export function IconButton({ icon, label, onPress, variant = 'tint', disabled = false }: {
  icon: IconName; label: string; onPress: () => void; variant?: keyof typeof look; disabled?: boolean;
}) {
  const l = look[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{ minWidth: touch.min, minHeight: touch.min, borderRadius: radius.pill, backgroundColor: l.fill, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
    >
      <Ionicons name={icon} size={26} color={l.ink} />
    </TouchableOpacity>
  );
}
```

`components/ui/SlideToConfirm.tsx` (gesture-handler 3.3 and Reanimated 4.7 — before writing, check the installed version's pan-gesture API with `mcp__plugin_context7_context7__query-docs` for `react-native-gesture-handler` and adjust the import and gesture names only; keep the logic, sizes and the accessibility action as written):

```tsx
import * as Haptics from 'expo-haptics';
import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { color, radius, touch } from '@/theme';
import { AppText } from './AppText';
import { shouldConfirm } from './slide';

const THUMB = touch.primary;

export function SlideToConfirm({ label, onConfirm, disabled = false }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const [width, setWidth] = React.useState(0);
  const x = useSharedValue(0);
  const fire = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onConfirm();
  }, [onConfirm]);

  const pan = Gesture.Pan()
    .enabled(!disabled && width > 0)
    .onUpdate((e) => {
      x.value = Math.max(0, Math.min(e.translationX, width - THUMB));
    })
    .onEnd((e) => {
      if (shouldConfirm(e.translationX, width, THUMB)) runOnJS(fire)();
      x.value = withSpring(0);
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={() => !disabled && fire()}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: THUMB, borderRadius: radius.pill, backgroundColor: color.brandSoft, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
    >
      <AppText weight="bold" tone="brand" style={{ textAlign: 'center', paddingLeft: THUMB }}>{label}</AppText>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ position: 'absolute', left: 0, width: THUMB, height: THUMB, borderRadius: radius.pill, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' }, thumbStyle]}>
          <AppText weight="bold" tone="onBrand">›</AppText>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
```

The app root must be wrapped in `GestureHandlerRootView` (base Task 12's root layout; add it there if absent).

- [ ] **Step 4: Run to verify they pass.** `npx jest`, `npx tsc --noEmit`, `npx expo lint`.
- [ ] **Step 5: Commit**

```bash
git add components/ui components/__tests__/ui-v2.test.tsx components/__tests__/slide.test.ts
git commit -m "feat(ui): progress bar, icon button, avatar and slide-to-confirm"
```

---

### Task V4: Reference mapping, queue rules and the pending-handover bar logic

Changes the base Tasks 9 and 10 code after V0 updated their tests.

**Files:**
- Modify: `services/delivery/stopHelpers.ts` (base Task 9), `services/delivery/actionQueue.ts` and its tests (base Task 10)
- Create: `services/delivery/pendingBar.ts`, test `services/delivery/__tests__/pendingBar.test.ts`

**Interfaces:**
- `shortRef(orderId: string): string`: last four characters, upper-cased, with `0`, `O` → `D` and `1`, `I`, `L` → `T`, prefixed `#`.
- Queue: items gain `dependsOn?: string` (an item id). Result handling per spec A1–A3.
- `pendingBar(items: QueueItem[], now: number)`: `{ count: number, secondsLeft: number, lastId: string | null }` for the one-choice style's shared Undo bar. `count` is items with `sendAfter > now`; `secondsLeft = ceil((max(sendAfter) - now) / 1000)`; `lastId` is the newest such item.

- [ ] **Step 1: Write the failing tests** (the V0 edits already cover `shortRef`, 401 / 408 / 429, `dependsOn` and the per-user key). Add `pendingBar.test.ts`:

```ts
import { pendingBar } from '../pendingBar';

const item = (id: string, sendAfter: number) => ({ id, orderId: 'o' + id, action: 'delivered', sendAfter, createdAt: sendAfter - 5000, state: 'waiting' }) as any;

it('counts only items still inside their undo window', () => {
  expect(pendingBar([], 1000)).toEqual({ count: 0, secondsLeft: 0, lastId: null });
  const items = [item('a', 3000), item('b', 6000), item('c', 900)];
  expect(pendingBar(items, 1000)).toEqual({ count: 2, secondsLeft: 5, lastId: 'b' });
});
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement**

```ts
import type { QueueItem } from './actionQueue';

export function pendingBar(items: QueueItem[], now: number) {
  const open = items.filter((i) => i.state === 'waiting' && i.sendAfter > now);
  if (open.length === 0) return { count: 0, secondsLeft: 0, lastId: null as string | null };
  const last = open.reduce((a, b) => (b.createdAt >= a.createdAt ? b : a));
  const end = Math.max(...open.map((i) => i.sendAfter));
  return { count: open.length, secondsLeft: Math.ceil((end - now) / 1000), lastId: last.id };
}
```

- [ ] **Step 4: Run** `npx jest`, `npx tsc --noEmit`, `npx expo lint`. **Step 5: Commit** `feat(delivery): look-alike-safe reference, safer queue rules, pending undo bar`.

---

### Task V5: Areas hero

**Boards:** `Areas-v2`. Builds base Task 13 with these differences.

**Files:** Modify/Create the files named in base Task 13; add `components/areas/AreaHero.tsx`, `components/areas/AreaRow.tsx`; Test: `components/__tests__/areas-v2.test.tsx`.

**Interfaces:**
- `AreaHero({ name, orders, parcels, delivered, total, onPress })`: `hero` fill; name in `onHero`; `t('areas.orders', { orders })` at `type.count` (`orders` is "{orders} orders"); `t('areas.parcels', { parcels })` at body size in `onHeroSoft`; `ProgressBar tone="hero"`; the whole card is a 64 dp+ button.
- `AreaRow({ name, orders, parcels, delivered, total, onPress })`: compact row, `ProgressBar`, a check when `orders === 0 && delivered > 0`.
- The hero is the first area with orders still to deliver; the rest are rows. When every area is done, all are rows with checks.
- Sinhala size bump (A6): `AppText` reads `useSettings().settings.language` and adds 2 to the `count` and `title` sizes when it is `'si'`. Test in `areas-v2.test.tsx`: with the language set to `si`, the hero's orders text `fontSize` equals `type.count + 2`.
- New keys in both dictionaries: `areas.orders` ("{orders} orders"), `areas.parcels` ("{parcels} parcels to deliver"). Sinhala uses the same sentence split.

- [ ] **Step 1: Failing test** `areas-v2.test.tsx`: renders three areas (one finished) and asserts (a) exactly one `AreaHero` (testID `area-hero`), the unfinished first one; (b) the finished area shows `areas.allDelivered`; (c) the hero's orders text style `fontSize` equals `type.count`; (d) with all areas finished there is no hero.
- [ ] **Step 2: Run, verify FAIL. Step 3: implement. Step 4: run, verify PASS** plus the three gates.
- [ ] **Step 5: Device check** (device safety block applies): screenshot Areas with three areas at font scale 1.0 and, only if the owner allows, 1.3; confirm at least four rows or three in Sinhala. List differences from the board.
- [ ] **Step 6: Commit** `feat(areas): hero card, compact rows and progress`.

---

### Task V6: Collapsible stop card

**Boards:** `Stops-v2`, `Card-v2`. Builds base Task 14.

**Files:** Create `components/stops/StopCard.tsx`, `components/stops/stopCardState.ts`; Modify base Task 14's `screens/stops/stops.screen.tsx`; Test: `components/__tests__/stopCard.test.tsx`.

**Interfaces:**
- `isHostelStop(order, orders): boolean`: true when two or more orders in the area share the order's address (case- and space-insensitive).
- `StopCard({ order, expanded, onToggle, onDelivered, onFailed, onMore, showPhoneDigits })`: collapsed content: `Avatar`, name (`type.title`, bold), `#ref`, `Chip` with dot, amount, left status stripe (4 dp, status colour), and for on-the-way orders an `IconButton variant="primary" icon="checkmark" label=t('stops.delivered')`. Expanded adds: Call `IconButton` only when `phone` exists and `!isHostelStop`; Failed and More `AppButton variant="secondary"`.
- The list holds `expandedId: string | null`; toggling another card collapses the first.

- [ ] **Step 1: Failing tests:** (a) a collapsed on-the-way card shows the Delivered icon button and no Failed button; (b) pressing the card shows Failed and More; (c) Call is absent for an order whose address is shared by another order and present for a lone address with a phone; (d) pressing Delivered calls `onDelivered` once and does not toggle the card; (e) a delivered card shows no action buttons.
- [ ] **Step 2–4: red, implement, green** plus the three gates.
- [ ] **Step 5: Device check:** five collapsed cards visible on one screen at font scale 1.0; list scroll with `bash scripts/perf-frames.sh v2-stops` (janky % no worse than the Phase 0 baseline).
- [ ] **Step 6: Commit** `feat(stops): collapsible stop card with icon actions`.

---

### Task V7: Handover

**Boards:** `Handover-v2`. Builds base Task 15 with these differences.

**Files:** the files named in base Task 15; add `components/handover/PaymentSheet.tsx`, `components/handover/UndoBar.tsx`; Test: `components/__tests__/handover-v2.test.tsx`.

**Interfaces:**
- `PaymentSheet({ visible, name, ref, amount, alreadyPaid, onPaid, onNotPaid, onDelivered, onBack })`: when `!alreadyPaid` the title is `t('handover.deliveredAskPaid', { name })` ("Delivered to {name}. Was it paid?") and **Paid and Not paid are two `AppButton variant="secondary" size="lg"` buttons of equal size in one row with `touch.gap` between**; Back below. When `alreadyPaid`: title `t('handover.confirmDelivered', { name })`, one primary Delivered and Back.
- `UndoBar({ count, secondsLeft, onUndo })`: shows `t('handover.pending', { count })` and `t('handover.sendingIn', { seconds })`, one 64 dp Undo button that removes the newest pending item (`pendingBar().lastId`).
- One-choice style: the card shows `SlideToConfirm label=t('handover.slidePaid')` ("Slide: delivered, paid") and a plain `AppButton variant="secondary"` "Delivered, not paid"; both queue with the 5-second delay.

- [ ] **Step 1: Failing tests:** (a) in the two-step sheet, Paid and Not paid have equal `minHeight` and the same variant (compare flattened styles' `backgroundColor`); (b) Back sends nothing; (c) Paid queues delivered then payment with `dependsOn`; (d) `UndoBar` with `count` 2 shows the pending text and Undo calls `onUndo` once; (e) slide activation calls the queue once.
- [ ] **Step 2–4: red, implement, green** plus the three gates.
- [ ] **Step 5: Device check** (device safety block applies): open both sheets, screenshot, Back out. No write is confirmed.
- [ ] **Step 6: Commit** `feat(handover): equal-weight payment sheet, slide to confirm, shared undo bar`.

---

### Task V8: Shell polish and motion

**Boards:** `TabBar-v2`. After base Task 17.

**Files:** Modify `components/tabBar/tabBar.tsx` (floating pill, filled active icon, Unpaid badge), `components/ui/Chip.tsx` (leading dot), `screens/stops/stops.screen.tsx` (sticky section headers, skeleton rows); Create `components/ui/Skeleton.tsx`, `components/ui/SuccessCheck.tsx`; Test: `components/__tests__/tabBar.test.tsx` (extend), `components/__tests__/ui-v2.test.tsx` (extend).

**Interfaces:**
- `TabBar` reads an optional `badges?: Record<string, number>`; the Unpaid tab shows the count in a pill when `> 0` with `accessibilityLabel` "Unpaid, {n}".
- `Skeleton({ width, height })`: a `field`-coloured block pulsing with a Reanimated opacity loop.
- `SuccessCheck({ onDone })`: an Ionicons check scaling from 0.6 to 1 and fading in, then calling `onDone` after 400 ms; opacity and transform only.
- All animations are skipped when the system "reduce motion" setting is on (`AccessibilityInfo.isReduceMotionEnabled`).

- [ ] **Step 1: Failing tests:** the Unpaid badge appears for 2 and not for 0; `Chip` still paints its status pair; `Skeleton` renders without a provider.
- [ ] **Step 2–4: red, implement, green** plus the three gates.
- [ ] **Step 5: Frame-time check:** `bash scripts/perf-frames.sh v2-areas` and `v2-stops`; the janky % must be no worse than the Phase 0 baseline in `docs/superpowers/perf-baseline.md`.
- [ ] **Step 6: Commit** `feat(ui): floating tab bar, skeletons, success check and status dots`.

---

## Final gate

After V8 and the base plan's Phase 4 (device checklist, final review): the controller lists, for every v2 board, each remaining difference from the phone screenshot and the task that owns it. Never claim parity. The owner decides merge or push.

## Self-review (spec coverage)

| Addendum item | Task |
|---|---|
| D1 Areas hero | V5 |
| D2 button hierarchy, D3 collapsible card, Call hidden at hostels | V3 (IconButton), V6 |
| D4 handover, shared Undo | V3 (SlideToConfirm), V4 (pendingBar), V7 |
| D5 motion | V8 |
| D6 shell | V8 |
| D7 typography | V1 decision, V2 (package only if chosen) |
| A1–A3 queue rules | V0 tests, V4 |
| A4 reference mapping | V0, V4 |
| A5 | V6 |
| A6 `micro` 16, Sinhala bump | V0 (`micro`); the Sinhala `count` / `title` +2 sp is applied in V5 through `AppText` when `language === 'si'` and tested there |
| §4 tokens | V2 |
