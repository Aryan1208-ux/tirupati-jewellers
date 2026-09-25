# Tirupati Jewellers - Headless E-Commerce Platform

A luxury e-commerce platform for **Tirupati Jewellers** built with **Medusa (v2)**, **Next.js (App Router)**, **TailwindCSS**, and **PostgreSQL (Docker)**.

---

## 🏛 Architecture Overview

```
Tirupati-Jewellers/
├── docker-compose.yml        # Local PostgreSQL database container (Port 5432)
├── backend/                  # Turbo monorepo root
│   ├── apps/
│   │   ├── backend/          # Medusa v2 Backend Server & Admin Dashboard (Port 9000)
│   │   └── storefront/       # Next.js App Router Storefront (Port 3001)
│   ├── package.json
│   └── turbo.json
└── legacy-static/            # Legacy static HTML/CSS/JS files (backed up)
```

---

## 🚀 Getting Started

### 1. Start PostgreSQL Database
```bash
docker compose up -d
```

### 2. Start Medusa Backend (Port 9000)
```bash
cd backend
npm run backend:dev
```
- **Storefront API**: `http://localhost:9000/store`
- **Medusa Admin Dashboard**: `http://localhost:9000/app`

### 3. Start Next.js Storefront (Port 3001)
```bash
cd backend
npm run storefront:dev
```
- Open `http://localhost:3001` in your browser.

---

## 💎 Features & Pages

- **Home (`/`)**: Hero banner, curated jewelry collections (Rings, Necklaces, Earrings, Bracelets), dynamic featured products, craftsmanship story, trust badges, and consultation CTA.
- **Catalogue (`/shop`)**: Dynamic catalogue fetching items directly from Medusa Backend API with live category and search filtering.
- **Product Details (`/product/[handle]`)**: Dynamic variant picker, image zoom, price formatting in INR, certified jewelry badges, and add-to-cart.
- **Cart (`/cart`)**: Real-time Medusa cart synchronization, quantity adjustments, line-item deletions, and live subtotal calculations.
- **Checkout (`/checkout`)**: Multi-step checkout form connected to Medusa cart shipping and contact details with Cash-on-Delivery and Online payment selection.
- **Order Confirmation (`/order-confirmation`)**: Order tracking reference and celebratory confirmation.

---

## 🔐 Credentials & API Keys

- **Publishable API Key**: Stored in `apps/storefront/.env.local` and `apps/admin/.env.local` as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- **Database URL**: Stored in `apps/backend/.env` as `DATABASE_URL`
