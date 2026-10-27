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
