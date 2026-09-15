# Implementation Plan: Veloiz Dry-Fruits E-Commerce (V1)

Based on the Product Requirements Document (PRD), this document outlines the step-by-step phased approach for building the e-commerce platform. The tech stack includes Next.js (App Router, Tailwind CSS, shadcn/ui), Supabase, and Razorpay.

## Phase 1: Project Setup & Infrastructure
- Initialize Next.js project (App Router, TypeScript, Tailwind CSS, ESLint).
- Install and configure UI libraries (`shadcn/ui`, `lucide-react`, etc.).
- Set up the Supabase project (Database, Auth, Storage) and add connection variables to `.env.local`.
- Establish the initial Supabase Database Schema (Categories, Products, Orders, Order_Items, Payments).
- Setup initial Row Level Security (RLS) policies for core tables.

## Phase 2: Admin Dashboard Core & Auth
- Set up `/admin/login` flow using Supabase Auth (Email/Password methodology).
- Implement protected route middleware for `/admin/*` paths to ensure only authenticated sessions can access them.
- Build the Admin Dashboard global layout (Navigation Sidebar, Header).
- Implement the Dashboard Home view with summary metrics (Total Products, Total Orders, Revenue, Low-Stock items).

## Phase 3: Catalog Management (Admin)
- Build the **Categories** CMS interface (Table list, Create, Update, Delete).
- Build the **Products** CMS interface:
  - Form fields for name, description, price, stock, and category selection.
  - Image uploader component integrated with Supabase Storage.
  - Visibility toggle to flag a product as Active/Inactive.

## Phase 4: Customer Storefront
- Build Storefront common layout (Navbar, Footer, Cart Trigger icon).
- Build the Homepage (Hero banner, visual Category navigation, Featured products grid).
- Build the Product Listing Page with grid layout, search by name, and filter by category (pagination/scrolling).
- Build the Product Detail Page displaying product information, weight selection (where applicable), quantity stepper, and "Add to Cart" interactions.

## Phase 5: Cart System
- Implement robust client-side Cart state management using `Zustand` (or React Context) layered with LocalStorage persistence.
- Build a slide-out Cart Drawer (or page) enabling customers to view line items, adjust quantities, review subtotal, delivery fees, and grand total.

## Phase 6: Checkout & Payments
- Build a seamless Checkout Form to aggregate customer details (Name, phone, email, and delivery address).
- Implement a Next.js Server Action to securely instantiate a Razorpay order before payment.
- Integrate the frontend Razorpay Checkout widget.
- Build a server-side webhook / API route handler to verify the Razorpay signature upon payment completion.
- Execute server-side transaction logic upon verified payment: Insert records into Orders, Order_Items, and Payments.
- Implement automated decrementing of inventory stock in the `products` table on successful orders.
- Create an Order Confirmation / Success screen.

## Phase 7: Order Management (Admin)
- Build the Admin Orders view (Data table with customer info, line items, totals, and payment status overview).
- Implement the Order Status updater workflow (`Pending → Confirmed → Processing → Shipped → Delivered`).
- Create Low Stock UI alerts in the product dashboard for depleted inventory.

## Phase 8: Final Security Audit & Polish
- Security Audit: Verify Razorpay secrets are never exposed on the client. Verify Supabase RLS policies effectively block unauthorized client actions against admin tables.
- Performance and responsiveness review (ensure UI is heavily optimized for mobile users as defined in the PRD).
- Address any remaining "Open Questions" from the PM/business owner before final V1 release.
