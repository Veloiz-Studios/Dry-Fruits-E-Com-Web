# Veloiz E-Commerce Platform — Outstanding Work

**Purpose:** This document lists everything still missing or unconfirmed from a pure development/feature standpoint, based on comparing the original PRD against the "Lovable to Next.js" migration summary. Business, KYC, and payment-account ownership topics are intentionally excluded — this is scoped to code/features only.

---

## 🔴 Priority 1 — Core Admin Functionality (Not Built / Placeholder)

These were core PRD requirements ("business owner manages everything without touching code") and are either explicitly placeholder or entirely absent from the migration summary.

### 1. Admin Product Management (CRUD)
- [x] Create new product (name, description, price, category, image)
- [x] Edit existing product (price, description, stock)
- [x] Delete product (with cascades/protections)
- [x] Enable/disable product visibility on storefront
- [x] Manage per-weight variants (250g/500g/1kg) and their individual stock/price
- **Status:** ✅ Built. Full Server Action-powered CRUD overlay in the dashboard with Postgres error handling, responsive UI, and instant database syncing.

### 2. Product Image Upload Mechanism
- [ ] Admin-facing image upload flow (Supabase Storage)
- [ ] Save returned image URL to the correct product/variant record
- **Status:** Not built.

### 3. Category Management
- [x] Create category
- [x] Edit category (name, image)
- [x] Delete category
- [x] Assign products to categories via UI
- **Status:** ✅ Built. Full CRUD sheet with real-time websocket syncing.

### 4. Inventory Page
- [ ] Dedicated stock-level view per product/variant
- [ ] Manual stock adjustment control
- [ ] Low-stock flagging/alerts for the admin
- **Status:** Stock is manageable via the Product Matrix, but a dedicated global overview table is still unbuilt.

### 5. Settings / Business Profile Page
- [ ] Business name, owner name, phone, email, address, city
- [ ] Logo upload
- [ ] Opening/closing hours
- **Status:** Explicitly a placeholder.

### 6. Admin Order Status Management
- [x] UI to move an order through the pipeline: Pending → Confirmed → Processing → Shipped → Delivered
- [x] Filter/search orders by status
- **Status:** ✅ Built. Fully integrated via Service Role bypass, with secure Supabase broadcasts triggering instant storefront UI updates for customers without compromising RLS.

---

## 🟡 Priority 2 — Missing PRD Features

### 7. Analytics Page
- [ ] Revenue analytics
- [ ] Booking/order trends over time
- [ ] Conversion rate
- [ ] Peak order times
- [ ] Growth indicators
- **Status:** Not mentioned at all in the migration summary. Appears entirely unbuilt.

### 8. Delivery Fee Logic
- [ ] Finalize logic: flat rate vs. free-above-threshold vs. distance-based
- [ ] Confirm it's actually wired into checkout, not a placeholder value
- **Status:** Was an open question in the original PRD; resolution not confirmed in the migration doc.

---

## 🟡 Priority 3 — Reliability & Edge Cases (Payment Engine)

The checkout/payment core sounds solid, but these specific behaviors need explicit testing, not just code review:

### 9. Race Condition on Last-Unit Checkout
- [ ] Confirm stock is re-validated **server-side at the moment of checkout/order creation**, not only reflected via the real-time display
- [ ] Test scenario: two customers add the last unit of a variant to cart simultaneously — confirm only one atomic transaction succeeds and the other gets a clear "no longer available" response

### 10. Payment Failure / Abandonment Path
- [ ] Test: user closes tab or cancels mid-Cashfree-checkout — confirm order stays in a clean "unpaid/abandoned" state (not stuck, not falsely marked paid)
- [ ] Confirm `finalize_paid_order` is only ever triggered after server-side Cashfree order-status verification, never optimistically

### 11. Full Sandbox End-to-End Test
- [ ] Place a real test order start to finish through Cashfree sandbox
- [ ] Confirm `/order/[number]?verify=true` handshake correctly flips order to Paid
- [ ] Confirm stock deduction happens exactly once (no double-deduction)

---

## 🔴 Security — Flagged Separately (Not a Feature Gap, But Blocking)

### 12. RLS Policy Restoration
- [ ] Replace the current approach (bypassing RLS via `SUPABASE_SERVICE_ROLE_KEY` in `admin.actions.ts`) with either: (a) properly fixed RLS policies, or (b) explicit authentication/authorization checks on every single admin server action, with no exceptions
- [ ] Audit every function in `admin.actions.ts` individually to confirm an admin-identity check exists before any data is read or written
- [ ] Confirm the Phone OTP admin login restricts access to a single allow-listed phone number, not any number that requests an OTP

---

## 🟢 Priority 4 — Pre-Launch Polish (Not Urgent Yet)

- [ ] Replace AI-generated/placeholder product photography with real product photos
- [ ] Full mobile responsiveness pass across storefront and priority admin screens (dashboard, orders, inventory)
- [ ] Set all environment variables in Vercel (production), not just local `.env.local`
- [ ] Confirm domain whitelisting with Cashfree for the actual production domain (beyond localhost/sandbox)
- [ ] Unique metadata (title/description) for every public and admin page

---

## Summary

| Area | Status |
|---|---|
| Storefront (browsing, cart, real-time stock) | ✅ Built |
| Checkout + Cashfree payment engine | ✅ Built (needs edge-case testing) |
| Admin: Product CRUD | ✅ Built (Full dynamic variant matrix + realtime) |
| Admin: Category management | ✅ Built (CRUD + UI sync) |
| Admin: Inventory | ❌ Placeholder only |
| Admin: Settings/business profile | ❌ Placeholder only |
| Admin: Order status pipeline control | ✅ Built (Secure realtime broadcasts + device tracking) |
| Analytics page | ❌ Not built |
| Delivery fee logic | ⚠️ Unresolved from PRD |
| Race condition / edge-case handling | ⚠️ Needs testing |
| RLS / security | 🔴 Needs fixing before production |

**Bottom line:** the customer-facing shopping and payment experience is in good shape. The admin side — which was meant to let the business owner run the store without a developer — is the biggest remaining body of work, since product, category, inventory, and settings management all still need to be built from scratch.
