# NOOR — Modestwear Storefront

A separated React + Express e-commerce starter for an Abaya and Crochet retailer. The code is intentionally split into page, component, context, API, controller, route, model, service, and style files rather than placing the application in one JSX file.

## Current flow

- Rich responsive homepage with collections, featured products, brand story, value propositions, campaign feature, gallery, and newsletter UI.
- Shop page with Abaya/Crochet filtering, search, sort options, and responsive product cards.
- Product detail page at `/products/:slug`: the product card uses only `mainImage`; the backend supplies exactly one `mainImage` plus four `galleryImages` for the five-view product gallery. Colour/size selection, quantity limits, live stock labels, add-to-bag, related products, and Buy Now direct checkout are included.
- Cart at `/cart`, persisted in local storage for the customer's browser.
- Checkout at `/checkout`, with delivery validation, COD ordering, server-side pricing, and Razorpay checkout integration points.
- Order confirmation at `/order-confirmation/:orderNumber`.
- Dedicated About, Gallery/Lookbook, Contact, FAQ, and Shipping/Returns routes; contact submissions are validated, rate-limited, stored in Atlas, and reviewed from the protected admin inbox.
- Existing protected admin login and dashboard at `/admin`; an authenticated admin is redirected to the dashboard, otherwise the secure login is shown.
- Admin product/category management (product CRUD/archive; category create/edit/archive/restore; five-image product photography; signed Cloudinary uploads), a contact inbox, and an order review page with status/payment filters, full customer/item/address details, CSV export, and browser print-to-PDF support.
- Express catalog API, MongoDB Atlas models, order creation, atomic variant stock decrement inside an Atlas transaction, and Razorpay signature/webhook handlers.
- `npm run seed:catalog` seeds two categories and eight example products, each with one main image and four gallery images. Demo products are also used as a visual fallback only when the catalogue API is unreachable; a successful empty catalogue response remains empty.

> The seed catalogue uses example Unsplash fashion photography so the flow can be reviewed. Replace these with the retailer's actual Cloudinary assets and product copy before launch. The frontend contains demo fallback products for visual review if the API is unavailable; demo products cannot place real orders because they do not have MongoDB IDs.

## Requirements

- Node.js 20+
- A MongoDB Atlas cluster (Atlas supports the transaction flow used for checkout)
- Razorpay test credentials to test online payments (optional for COD development)

## Local setup

### 1. Configure the backend

In a terminal:

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and fill in `MONGODB_URI`, `JWT_SECRET`, `COOKIE_SECRET`, and other values. Make sure the Atlas IP access list includes your current public IP. Keep `.env` private.

Start the API:

```bash
npm run dev
```

Health check: `http://localhost:4000/api/health`

### 2. Seed the example catalogue

Open a second terminal:

```bash
cd server
npm run seed:catalog
```

This inserts or updates the example categories and products in your configured Atlas database. Run this only against a development database: it updates the seeded product records by slug.

### 3. Configure the frontend

Open a third terminal:

```bash
cd client
npm install
```

Copy `.env.example` to `.env`. The local API address should be:

```dotenv
VITE_API_URL=http://localhost:4000/api
```

Start React/Vite:

```bash
npm run dev
```

Open `http://localhost:5173`.

### 4. Create the first admin

Add a one-time `ADMIN_BOOTSTRAP_KEY` to `server/.env`, restart the API, and send a POST request to `/api/auth/bootstrap-admin` with JSON `{ "name": "Store Admin", "email": "you@example.com", "password": "a-long-unique-password", "bootstrapKey": "same-key-from-env" }`. Remove `ADMIN_BOOTSTRAP_KEY` from `.env` and restart the backend after the administrator is created. Then sign in at `http://localhost:5173/admin`.

## Razorpay test setup

Add the Razorpay test credentials to `server/.env`:

```dotenv
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Add the public key ID to `client/.env`:

```dotenv
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

Restart both processes after changing `.env` values. Configure Razorpay's webhook URL as `https://YOUR_DOMAIN/api/payments/razorpay/webhook` after deployment, using the same webhook secret. Use Razorpay test mode and test payment details until end-to-end verification is complete.

## Stock and checkout notes

- The backend calculates prices and shipping; it does not trust amounts submitted by the browser.
- Orders refer to MongoDB product and variant IDs, not frontend-only demo IDs.
- Stock is decremented using a conditional atomic update inside a MongoDB transaction. Multi-item carts are all-or-nothing.
- COD orders are recorded as confirmed with payment still pending. Razorpay orders reserve stock pending payment, then use server-side signature verification and a raw-body webhook signature check.
- If Razorpay checkout is dismissed in the browser, the reservation cancellation endpoint releases stock using a one-time reservation token. For launch, add scheduled reconciliation for abandoned payment reservations and exercise all gateway failure and refund paths.

## Folder structure

```text
client/
  src/components/       Reusable site header and product card
  src/context/          Persistent cart state
  src/data/             Demo/preview catalogue
  src/pages/             Home, shop, product details, cart, checkout, confirmation, admin
  src/services/          API client
  src/styles/            Base and commerce styling
server/
  src/config/            Database connection
  src/controllers/       Request handlers
  src/models/            Mongoose schemas
  src/routes/             Express route definitions
  src/services/           Order, stock reservation, and payment business logic
  src/scripts/            Development seed script
```

## Before production

This is a development build and needs end-to-end testing before taking live orders. Real Cloudinary uploads require credentials. The contact inbox and order review page are implemented, but order status transitions/refunds/shipment workflows, coupon rules, true XLSX/PDF report generation (the current PDF option uses browser print), WhatsApp Business API low-stock notifications, Meta Pixel/Conversions API, newsletter persistence, logging/monitoring, backup and restore, and accessibility/performance audits remain to be implemented. Add scheduled Razorpay reservation reconciliation, review CSRF/session protections and trusted origins, and configure HTTPS and production cookies. Do not enable live payments until the Razorpay webhook, browser-dismissal, bank failure, duplicate-event, and stock-reconciliation scenarios have been tested.


## Deploy frontend and Express API to one Vercel project

The repository includes a Vercel entry point (`api/index.js`) and `vercel.json`. The Vite build is published from `client/dist`; the Express application runs as a Vercel Function for `/api/*` requests. This avoids requiring a separate Render service.

1. Push the project folder to a Git repository and import that repository into Vercel with the repository root as the project root.
2. In Vercel Project Settings → Environment Variables, configure `MONGODB_URI`, `JWT_SECRET`, `COOKIE_SECRET`, `CLIENT_ORIGIN`, `PUBLIC_APP_URL`, and the Cloudinary/Razorpay values you use. Use the exact production site origin for `CLIENT_ORIGIN` and `PUBLIC_APP_URL`.
3. Keep `VITE_API_URL` unset for production; the frontend defaults to same-origin `/api`. Set `VITE_RAZORPAY_KEY_ID` for online payments when the server credentials are configured.
4. Deploy and test `/api/health`, product detail refreshes such as `/products/the-layla-abaya`, admin login, COD checkout, Razorpay test checkout, and the Razorpay webhook.

The first deploy is not proof that the whole payment lifecycle is launch-ready. Verify Vercel function routing, MongoDB connection reuse, execution limits, webhook delivery, and pending-payment stock reconciliation against a Vercel preview deployment before accepting real orders. The admin order page currently supports viewing/filtering, CSV export, and browser print-to-PDF; editable fulfilment transitions, refunds, true XLSX/PDF generation, coupons, WhatsApp notifications, and Meta Pixel/Conversions API still need implementation and end-to-end testing.
