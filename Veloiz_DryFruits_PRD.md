# Product Requirements Document
## Veloiz Studios — Dry Fruits E-Commerce Platform (V1)

**Document owner:** Veloiz Studios
**Status:** Draft
**Version:** 1.0
**Last updated:** 15 September 2026

---

## 1. Overview

### 1.1 Summary
A modern e-commerce web application for a local dry-fruits business, enabling customers to browse products, add items to a cart, check out, and pay online via Razorpay. The business owner manages the entire catalog, inventory, and order pipeline through a custom admin dashboard — with no code changes required.

This is also the founding project for **Veloiz Store Engine v1**, a reusable e-commerce template intended to power future small-business clients.

### 1.2 Problem Statement
The business currently relies on manual, unscalable processes:
- Orders taken over WhatsApp, phone calls, and Instagram DMs
- Manual order tracking with no single source of truth
- Customers repeatedly asking for prices/availability
- Product information (prices, stock) maintained ad hoc

This breaks down as order and product volume grows.

### 1.3 Goals
- Give customers a self-serve way to browse, order, and pay online
- Give the business owner full control over products, stock, and orders without developer involvement
- Ship a secure, reliable payment and order pipeline
- Build the system generically enough to reuse for future Veloiz clients

### 1.4 Non-Goals (V1)
- Customer accounts, login, order history, wishlist (deferred to V2)
- Multi-vendor support
- Advanced product variant systems (beyond basic weight options)
- Native mobile app
- Multi-language / multi-currency support

---

## 2. Users & Personas

| Persona | Description | Needs |
|---|---|---|
| **Customer** | Shopper visiting the storefront, no account required | Fast browsing, clear pricing, trustworthy checkout, order confirmation |
| **Admin (Business Owner)** | Owns the dry-fruits business, manages catalog and fulfillment | Simple CMS to manage products/stock/orders without technical help |

---

## 3. User Journeys

### 3.1 Customer Journey
```
Visit site → Browse/Search/Filter → View product → Select weight & quantity
   → Add to cart → Checkout → Enter delivery details → Pay via Razorpay
   → Receive order confirmation
```

### 3.2 Admin Journey
```
Login (/admin/login) → Dashboard overview → Manage products/categories/stock
   → View incoming orders → Update order status → Track revenue & low-stock alerts
```

---

## 4. Functional Requirements

### 4.1 Customer-Facing Storefront

**Homepage**
- Hero banner with value proposition and CTA ("Shop Now")
- Category navigation (Almonds, Cashews, Pistachios, Walnuts, Raisins, Dates, etc.)
- Featured products section

**Product Browsing**
- FR-1: Customer can view a paginated/scrollable product listing
- FR-2: Customer can search products by name
- FR-3: Customer can filter products by category
- FR-4: Disabled/out-of-stock products are hidden or clearly marked unavailable

**Product Detail Page**
- FR-5: Display product name, price, description, image, and quality badge
- FR-6: Customer can select a weight option (e.g., 250g / 500g / 1kg) where available
- FR-7: Customer can adjust quantity via a stepper control
- FR-8: "Add to Cart" and "Buy Now" actions

**Cart**
- FR-9: Cart displays line items with product, weight, quantity, and price
- FR-10: Customer can update quantity or remove items from the cart
- FR-11: Cart calculates subtotal, delivery fee, and total in real time
- FR-12: Cart persists during the session (local/session state; no login required)

**Checkout**
- FR-13: Customer enters name, phone, email, and delivery address
- FR-14: Order summary is shown before payment
- FR-15: System creates a Razorpay order server-side before presenting the payment widget
- FR-16: Customer completes payment via UPI, card, or net banking through Razorpay Checkout
- FR-17: On successful payment, the system verifies the payment signature server-side before marking the order as paid
- FR-18: Customer receives an on-screen order confirmation with order number

### 4.2 Admin Dashboard (`/admin`)

**Authentication**
- FR-19: Admin logs in via email/password (Supabase Auth)
- FR-20: Only authenticated admin users can access `/admin/*` routes

**Dashboard Home**
- FR-21: Display summary metrics: total products, total orders, pending orders, low-stock count, total revenue

**Product Management**
- FR-22: Admin can create, edit, and delete products
- FR-23: Admin can update price, description, and stock quantity
- FR-24: Admin can upload/replace a product image (stored in Supabase Storage)
- FR-25: Admin can enable/disable a product's visibility on the storefront

**Category Management**
- FR-26: Admin can create, edit, and delete categories
- FR-27: Products can be assigned to a category

**Order Management**
- FR-28: Admin can view a list of all orders with customer, items, total, and payment status
- FR-29: Admin can update order status through a defined pipeline: `Pending → Confirmed → Processing → Shipped → Delivered`
- FR-30: Order list is filterable/sortable by status and date

**Inventory**
- FR-31: Stock is automatically decremented when an order is successfully paid
- FR-32: Admin dashboard flags products below a low-stock threshold

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Razorpay secret keys and other credentials never exposed to the client/browser; all payment verification happens server-side |
| **Security** | Supabase Row Level Security (RLS) policies enforced on all tables; customers cannot read/write admin-only data |
| **Integrity** | Orders cannot be marked "paid" by client-side manipulation — payment status is only set after server-side signature verification against Razorpay |
| **Performance** | Product listing and detail pages should load quickly on 3G/4G mobile connections (primary customer device assumption: mobile) |
| **Availability** | System should degrade gracefully if Razorpay or Supabase is temporarily unavailable (clear error state, no silent order loss) |
| **Usability** | Admin dashboard must be usable by a non-technical business owner with no training beyond a short walkthrough |
| **Portability** | Core system should be abstracted enough to reconfigure (branding, catalog, categories) for a new client with minimal code changes |

---

## 6. Data Model (Initial Schema — Supabase/PostgreSQL)

```
categories
- id, name, slug, image_url, created_at

products
- id, name, slug, description, price, stock,
  category_id (FK → categories), image_url,
  is_active, created_at, updated_at

orders
- id, order_number, customer_name, phone, email, address,
  subtotal, delivery_fee, total,
  payment_status, order_status, created_at

order_items
- id, order_id (FK → orders), product_id (FK → products),
  product_name, quantity, price, subtotal

payments
- id, order_id (FK → orders), razorpay_order_id,
  razorpay_payment_id, status, amount, created_at

admin_users
- managed via Supabase Auth
```

*Schema to be finalized once actual client requirements (e.g., weight-based variants) are confirmed.*

---

## 7. System Architecture

```
Customer / Admin Browser
        │
        ▼
   Next.js (React + TypeScript + Tailwind + shadcn/ui)
   - Server Actions / API Routes
        │
   ┌────┼────────────────┐
   ▼    ▼                ▼
Supabase  Razorpay      Admin CMS (built into Next.js)
(Postgres, Auth,  (Payments)  Products / Orders / Inventory
 Storage)
```

**Tech Stack**
- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js Server Actions / API Routes
- Database: Supabase PostgreSQL
- Auth: Supabase Auth (admin only, V1)
- Storage: Supabase Storage (product images)
- Payments: Razorpay
- Hosting: Vercel
- Version control: Git + GitHub

---

## 8. Critical / High-Risk Areas
These require manual review regardless of AI-assisted development:
- Authentication and session handling
- Supabase RLS policies
- Razorpay order creation and payment signature verification
- Order-creation logic (preventing fraudulent "paid" orders)
- Database read/write permissions
- Admin route authorization
- Environment variable / secret handling

---

## 9. Order Status Pipeline

```
Pending → Confirmed → Processing → Shipped → Delivered
```
Payment status (`Paid` / `Unpaid`) is tracked separately from order fulfillment status.

---

## 10. Success Metrics

| Metric | Target (V1 launch) |
|---|---|
| Orders placed online vs. WhatsApp/phone | Track % shift to online ordering |
| Payment failure/error rate | < 2% of checkout attempts |
| Admin able to manage catalog independently | No developer intervention needed post-launch |
| Time to add/edit a product (admin) | Under 2 minutes |
| Successful reuse for a 2nd client | Codebase reused with < X hours of customization (to define) |

---

## 11. Future Scope (V2+)
- Customer accounts, login, order history, saved addresses, wishlist
- Proper product variant system (weight/size as first-class variant, not just an option)
- Notifications (SMS/email/WhatsApp order updates)
- Discount codes / coupons
- Analytics dashboard for the admin
- Multi-business/multi-tenant support (Veloiz Store Engine productization)

---

## 12. Open Questions
- Final delivery fee logic — flat rate, free above threshold, or distance-based?
- Does the client need weight-based variant pricing at launch, or is single-price-per-product sufficient for V1?
- Low-stock threshold — client-configurable or fixed default?
- Any requirement for order cancellation/refund flow in V1?
