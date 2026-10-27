# RC Frontend-Delivery — Overview

RC is a food-delivery platform: a customer app, this delivery-driver app, an admin console, and a backend of microservices. This file is a brief orientation for anyone (including a future Claude Code session) opening this repo on its own, without the rest of the project's context. Full detail lives in the RC root: `../GO-LIVE-PLAYBOOK.md` and `../AWS-INFRASTRUCTURE-PLAYBOOK.md`.

> **In-flight work:** the driver delivery flow (marking orders delivered, server-side counts, unpaid list). Start at `docs/superpowers/START-HERE.md`.

## What this repo is

An Expo/React Native app (file-based routing via `expo-router`) — the app delivery drivers use to see assigned orders and mark payment collected. **`main` is the branch to use here** — it's already ahead of `origin/dev`, which is missing most of the real service-integration code found on `main`.

## Current status

Built against real backend APIs:
- Login — real JWT auth against user-service, `delivery_person` role enforced
- Area selection — today's sessions for the driver; selection stores area and meal session
- Session-scoped orders — Home loads every order for the selected area and session from delivery-service
- Start delivery — after ordering closes for that session; moves orders to out-for-delivery on the server
- Delivered / Failed — failed requires a reason; status updates go to the backend
- Paid / Unpaid — mark payment collected or unpaid from order cards and confirmation flows
- Server counters — Home summary counts (to deliver, delivered, collected, etc.) come from the backend after refresh or each write
- Pending Payments — unpaid orders grouped by session date ("Today" first)
- Search — by order ID, customer name, phone, address, and food item names (`services/delivery/orderView.ts`); Home and Pending Payments both use the same matcher
- Session restore — `app/index.tsx` routes authenticated drivers to area selection without logging in again; JWT and selected area persist across restarts
- Tests — Jest unit and screen tests via `npm test`

No live GPS/location tracking anywhere in the codebase (no `expo-location`, no geolocation, no map). "Location Service Integration" here means a static named-area picker, not real-time driver tracking.

Driver delivery flow (spec and task notes): `docs/superpowers/START-HERE.md`.

## Backend it talks to

`user-service` (auth), `delivery-service` (orders/payment status), `locations-service` (areas) — see `../Backend/OVERVIEW.md` for what's actually built there.

## Deployment direction

Ships to the App Store and Google Play via **EAS Build** (free tier covers this app's build volume). Cash-on-delivery only at launch. See `../GO-LIVE-PLAYBOOK.md` for account setup (Apple/Google) and timeline.
