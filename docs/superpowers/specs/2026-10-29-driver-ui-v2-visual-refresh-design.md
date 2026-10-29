# RC Delivery App — Visual Refresh (v2) — Design addendum

**Date:** 2026-10-29 · **Branch:** `feat/driver-ui-modernization` · **Status:** proposed; the owner approves the v2 boards at Gate 1 before any screen is built.
**Amends:** `2026-10-29-driver-ui-modernization-design.md` (the base spec). Everything in the base spec still binds unless this addendum changes it. The base spec's hard constraints (§4: 7:1 contrast, 56/64 dp targets, font scale 1.3, opacity/transform animation only, no blur, no new dependency except `expo-keep-awake`) are unchanged.

## 1. Why

The first mockup boards (`docs/superpowers/mockups/`) meet the rider rules but look dated, for one reason: every element has the same weight. They are white cards with outlined pill buttons, so nothing leads the eye. They are also too tall for the job:

- The Areas count wraps to two lines in English and three in Sinhala, so a fourth area scrolls out of the glance.
- A stop card stacks four full-width controls (Call, Failed, Delivered, More) and is about 420 px tall, so 1.5 cards fit on a screen.
- Call is shown at hostel gates, where the customer is standing there.
- In the "Was it paid?" sheet, Paid is the green primary, so a habitual tap records money that was not collected.
- `#6O7L`: the letter O and the digit 0 look the same in the system font.

## 2. Changes (D1–D7)

| # | Change | Replaces |
|---|---|---|
| D1 | **Areas hero.** The next area is a deep-green card (`brandStrong` fill, white text 7.87:1). "8 orders" is the big figure (count size); "12 parcels" sits on a smaller line below; a thin progress bar shows delivered of total. Other areas are compact rows with a small progress bar and a check when finished. The meal switcher becomes a compact segmented control. | Three same-weight white cards with a wrapping 40 sp line (§6.2) |
| D2 | **Button hierarchy.** One filled primary per card. Secondary actions are soft tinted buttons (`brandSoft`, no outline) with icons. Call is a 56 dp round icon button beside the name. More is a 56 dp "⋯" icon button. | Outlined pill buttons stacked full-width (§6.3) |
| D3 | **Collapsible stop card.** Collapsed: initials avatar, name, `#ref`, status chip, amount, a left status stripe, and a 56 dp Delivered icon button for on-the-way orders. Tap the card to expand Call, Failed and More. One card is expanded at a time. Call is hidden for orders in a hostel group (an address with 2 or more orders in the area). | A 4-row card (§6.3, C4) |
| D4 | **Handover.** Two-step sheet: title "Delivered to {name}. Was it paid?", Paid and Not paid side by side with equal weight, Back below. One-choice style: a "slide to confirm" control instead of two buttons, with a tap-accessible fallback; the 5-second Undo bar stays. Rapid handovers share one Undo bar that lists the pending count and undoes the last one. | Paid as the green primary; two one-tap buttons (§6.5) |
| D5 | **Motion.** A check animates in on success and the card slides out (opacity and transform only); skeleton rows while loading; a calm "All delivered" state; light haptic on queue. | Spinners; instant disappearance |
| D6 | **Shell.** Floating rounded tab bar with filled icon on the active tab and an Unpaid count badge. Sticky address-group headers. Status chips get a leading dot. | Flat tab bar (§6.1) |
| D7 | **Typography.** Default: keep the system font for both languages (P1). Trial at Gate 1: render the boards with Inter (Latin) plus Noto Sans Sinhala; adopt only if the owner prefers it, because it adds a font package. Money and counts use tabular numerals. Sinhala text gets +2 sp on count and title sizes. | Raleway/Nunito/system mix |

## 3. Amendments to the base spec (from the 2026-10-29 review)

| # | Section | Change |
|---|---|---|
| A1 | §6.6 queue results | **401** pauses the queue and asks the driver to sign in again; items stay waiting. **408 and 429** are retried like a 5xx. Only other 4xx are refused. |
| A2 | §6.6 queue items | A payment item carries `dependsOn` (the Delivered item for the same order). If that item is refused, the payment item is refused with the message "Delivery was not sent". |
| A3 | §6.6 storage | The queue key includes the user id (`rc_action_queue:<userId>`), so a second driver on the same phone cannot send the first driver's items. |
| A4 | §6.8 short reference | `shortRef` takes the last four characters of the order ID, upper-cases them, and maps the look-alikes `0`, `O`→`D` and `1`, `I`, `L`→`T`, so the label has no O/0 or I/1/L confusion. Decision R at Gate 1: this, or a per-day sequence from the backend (`#17`), which is easier for the kitchen to write and is a backend change. Admin must apply the same mapping. |
| A5 | §6.3 | Call hidden at hostel groups (D3). |
| A6 | §6.9 | `micro` rises from 14 to 16 (chip text); a Sinhala bump of +2 sp on `count` and `title`. |

## 4. New tokens

| Token | Value | Use | Check |
|---|---|---|---|
| `hero` | `#1B5E20` (= `brandStrong`) | Hero card fill | white on it 7.87 |
| `onHero` | `#FFFFFF` | Text on the hero | 7.87 |
| `onHeroSoft` | `#F1FAF2` | Secondary text on the hero | ≥ 7 (test) |
| `heroTrack` | `rgba(255,255,255,0.25)` | Progress track on the hero | non-text |
| `heroFill` | `#69bf70` | Progress fill on the hero | ≥ 3 on hero (test) |
| `tint` | `#EEF7EF` (= `brandSoft`) | Soft secondary buttons | `brandStrong` text on it 7.19 |

## 5. Non-goals

Maps and directions; dark mode; a gradient or blur anywhere; new animation libraries (Reanimated and gesture-handler are already installed).

## 6. Success criteria

1. The Areas screen shows at least four areas at once at font scale 1.3 in English, and three in Sinhala, without wrapping the count figure.
2. At least five collapsed stop cards fit on one screen (390 × 844) at font scale 1.0.
3. Every new colour pair is covered by `theme/__tests__/contrast.test.ts` and passes.
4. A paid-or-not mistake needs a deliberate slide or a deliberate tap on an equal-weight button: Paid and Not paid have the same size, weight and fill.
5. Janky frames on Areas and Stops are no worse than the Phase 0 baseline (animations are opacity and transform only).
