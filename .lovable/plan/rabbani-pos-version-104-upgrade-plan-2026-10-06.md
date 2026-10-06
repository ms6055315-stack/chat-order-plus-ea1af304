# Rabbani POS — Version 104 Upgrade Plan

Upgrade the existing POS to the Version 104 feature list without removing anything that works today and without losing any saved orders, customers or menu.

## What already works (kept as is)
Menu with variants, dialer, token on/off per item, cart per order type, live draft orders, dine-in tables, waiters/riders, delivery with saved customers and charges, self-service (kept separate), bill/token printing with size settings and preview, WhatsApp templates and inbox, AI agent, voice, End Day, 40-day reports with a date picker, offline saving with a backup copy in the browser.

## Phase 1 — Orders and payments (most important)
- **Payments:** a new payment screen with Cash, Online, Card (can be turned on in settings), Mixed and Partial. It has a large number pad and shows Total, Paid and Remaining live. Every payment is saved as its own record linked to the order (method, amount, time, reference number).
- **Order statuses:** Pending, Confirmed, Preparing, Ready, Completed, Cancelled, with large coloured badges. Completed and cancelled orders never go back to Pending by themselves. The only way back is pressing "Reopen" / "Edit".
- **Order notes and item notes**, plus a source tag (POS / WhatsApp / Online / Self-service).
- **Search orders** by number, name or phone. Add a "View order" panel and "Reprint" on every order.
- **Double-tap protection** on Close Order, Complete, Cancel, Pay and Print: a second tap within a moment does nothing.
- **Printing safety:** if printing fails, the order is kept and can be reprinted. The bill shows the payment breakdown (Cash / Online / Remaining).

## Phase 2 — Dashboard, reports, discounts
- **Dashboard page** with real numbers only: today's sales, orders, pending, completed, cancelled, cash, online, partial, outstanding, top products.
- **Reports:** Daily / Weekly / Monthly / custom date range. Adds product sales, category sales, cash / online / card, partial and outstanding, cancelled orders and customer sales. Cancelled orders stay out of sales totals. Self-service stays out, as you asked before.
- **Discount rules in one place:** small deal Rs. 40 off, deals up to Rs. 1500 Rs. 100 off, editable in settings and never applied twice. The bill shows Subtotal, Discount and Final Total.

## Phase 3 — Menu, categories, customers, settings
- **Menu items:** available on/off, description, optional photo, sort order.
- **Categories:** rename, reorder, turn on/off. The POS updates instantly.
- **Customers:** search by name or phone, order history, total orders, total spent, last order.
- **Settings:** add Discount rules, Payment methods and Order settings sections next to the existing shop and print settings.
- **Menu prices:** add any missing Version 104 items (Pizza Classic/Special S/M/L, Pizza Fries, Rolls, Drinks, Sting, BBQ) **only if they are not already in your menu**. Nothing in your saved menu is deleted or changed.

## Phase 4 — Speed and stability
- Remove the loop where the draft order re-saves on every change. Save once per change, with a short delay.
- Faster product search and category switching, and lighter re-drawing of the cart and order lists.
- Clear error messages with retry. Nothing is silently lost.
- A full test run of every flow on the Version 104 checklist (cash, mixed, partial, delivery, complete, cancel, reopen, refresh, reprint, double-tap, offline, reports).

## Technical details
- Storage stays offline-first (localStorage plus the IndexedDB mirror). There is no cloud sync, as you asked earlier. New keys are `rabbani_payments` and `rabbani_audit`. Orders get optional fields (`payments`, `paidAmount`, `notes`, `source`, `statusHistory`), so old orders load unchanged.
- A one-time migration on startup turns old orders' `paymentStatus` (paid / pay-later) into payment records. It verifies counts and never wipes data, and a JSON backup is downloaded first.
- A central `lib/discounts.ts`, `lib/payments.ts` and `lib/orderStore.ts` (one write path with an idempotency guard) are used by POS, Orders, Self-Service and the AI/WhatsApp agent.
- Status changes go through a guarded `setStatus` that refuses automatic completed/cancelled → pending transitions.
- Each phase ships separately and is verified in the browser before the next starts.
