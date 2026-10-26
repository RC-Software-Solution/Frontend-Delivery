# RC Frontend-Delivery — Overview

RC is a food-delivery platform: a customer app, this delivery-driver app, an admin console, and a backend of microservices. This file is a brief orientation for anyone (including a future Claude Code session) opening this repo on its own, without the rest of the project's context. Full detail lives in the RC root: `../GO-LIVE-PLAYBOOK.md` and `../AWS-INFRASTRUCTURE-PLAYBOOK.md`.

## What this repo is

An Expo/React Native app (file-based routing via `expo-router`) — the app delivery drivers use to see assigned orders and mark payment collected. **`main` is the branch to use here** — it's already ahead of `origin/dev`, which is missing most of the real service-integration code found on `main`.

## Current status

Built against real backend APIs already:
- Login — real JWT auth against user-service, `delivery_person` role enforced
- Area selection — real fetch from locations-service, cached
- Home tab — today's orders for the driver's assigned area, from delivery-service
- Pending Payments tab — paid/unpaid toggle with optimistic UI + backend sync

**Not built, despite the integration doc's title**: no live GPS/location tracking anywhere in the codebase (no `expo-location`, no geolocation, no map). "Location Service Integration" here means a static named-area picker, not real-time driver tracking. There's also no accept/reject flow and no delivery-status progression beyond the paid/unpaid toggle — that's the entire scope of what this app does with an order today.

**Known bug**: same as Frontend-Customer — `app/_layout.tsx`'s `isLoggedIn` gate is dead code, never set to `true`; the actual navigation happens via ad hoc `router.push` calls from the login screen instead.

## Backend it talks to

`user-service` (auth), `delivery-service` (orders/payment status), `locations-service` (areas) — see `../Backend/OVERVIEW.md` for what's actually built there.

## Deployment direction

Ships to the App Store and Google Play via **EAS Build** (free tier covers this app's build volume). Cash-on-delivery only at launch. See `../GO-LIVE-PLAYBOOK.md` for account setup (Apple/Google) and timeline.
