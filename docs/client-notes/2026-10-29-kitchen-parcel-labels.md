# Kitchen parcel labels, and two other things we need from the client

**Date:** 29 October 2026
**For:** the client
**Status:** agreed direction, not built yet

## 1. Kitchen parcel labels

### What happens today

The kitchen does not label parcels. A delivery driver matches each customer from the list on the phone.

### What we are planning

The kitchen labels every parcel before the driver collects the food. Each label carries:

- the customer's name
- a short order reference, for example `#6O7L`, the same text the driver's app shows

The short reference is the last four letters or digits of the order number. The driver's phone shows the same name and reference in large type. The bag and the screen then match.

### Why this is needed

Drivers deliver by motorcycle or tuk-tuk, and a stop works in one of two ways.

- **Hostel gate.** Several people collect at once, and the bags look the same. The customer says their name. The driver picks up the labelled bag and finds the same name on the phone.
- **House or boarding place.** The driver stops at one address. The phone shows that one stop, with a button to call the customer.

If two customers share a name, the phone shows the last four digits of the phone number, and the driver asks for those.

### What the client needs to put in place

This is a kitchen process, not only an app change. The app can match a bag to a person only if the bag carries the same name and reference the screen shows. Kitchen staff write or stick the label on at packing time, before handover to the driver.

So that the kitchen can write the reference, the Admin order list will need to show it next to each order. That is a small follow-up change in the Admin app, planned separately.

## 2. Sinhala wording

The driver app will offer English and Sinhala, and each driver chooses in the settings. We will draft the Sinhala wording. **Before release, a native Sinhala speaker chosen by the client should read every screen in Sinhala and correct the wording.** We will send the list of texts when the screens are built.

## 3. Updates saved on the phone

When a driver has no signal at a drop-off, the app keeps the update (delivered, failed, paid, not paid) on the phone and sends it automatically when the signal returns. While updates are waiting, the counts in the app show the numbers the server has, plus a line such as "3 updates waiting to send". A driver cannot log out while updates are waiting, so nothing is lost.
