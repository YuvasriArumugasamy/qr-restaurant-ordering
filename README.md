# QR Restaurant Ordering (MERN)

A full-stack MERN app where each table has a unique QR code. Guests scan the QR, browse the menu, add items to a cart, and place orders. Staff view a real-time dashboard and move orders through `pending → preparing → completed`.

**Stack:** MongoDB (Atlas) · Express · React (Vite) · Node.js · Socket.IO · JWT auth · `qrcode`

---

## Features

- Unique QR code per table (auto-generated, printable PNG)
- Customer flow keyed to a table code (`/t/:code`) — menu, cart, place order, live status
- Admin login (JWT) with seeded admin user
- Admin dashboard with real-time new orders and status updates (Socket.IO)
- Order status tracking: `pending`, `preparing`, `completed`, `cancelled`
- Table management UI: create tables, view/print QR codes, open the customer view
- Mobile-first responsive UI

## Project structure

```
qr-restaurant-ordering/
├── client/              # React + Vite frontend
│   └── src/
│       ├── api/         # REST + socket clients
│       ├── context/     # Auth context
│       ├── pages/       # HomePage, TablePage, AdminLogin, AdminDashboard, AdminTables
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
└── server/              # Node + Express + MongoDB
    └── src/
        ├── models/      # Admin, Table, MenuItem, Order
        ├── routes/      # auth, menu, tables, orders
        ├── middleware/  # JWT auth
        ├── utils/       # seed script
        └── index.js
```

## Prerequisites

- Node.js 18+ and npm
- A MongoDB Atlas connection string (or any MongoDB URI)

## 1. Configure environment

```bash
cp server/.env.example server/.env
# edit server/.env and set MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
```

Key variables:

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default `5000`) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign admin tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin credentials |
| `CLIENT_URL` | Frontend origin, used for CORS (default `http://localhost:5173`) |
| `PUBLIC_BASE_URL` | Base URL encoded into QR codes (e.g. `https://your-domain.com`) |

The client doesn't need an `.env` for local dev — Vite proxies `/api` and `/socket.io` to the server. Optionally, `client/.env` can set `VITE_API_PROXY` to point at a remote backend.

## 2. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

## 3. Seed the database

Seeds an admin user, 6 tables, and 9 sample menu items (only inserts if empty).

```bash
cd server
npm run seed
```

## 4. Run

Open two terminals.

```bash
# terminal 1 – backend (http://localhost:5000)
cd server
npm run dev

# terminal 2 – frontend (http://localhost:5173)
cd client
npm run dev
```

Then:

- Admin: http://localhost:5173/admin/login (use the seeded `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Admin → **Tables & QR** — see QR codes for each table, click **Open customer view** to simulate a guest scanning that QR.
- Place orders from the customer view; they appear live on the admin dashboard.

## API overview

### Public
- `POST /api/auth/login` — admin login, returns `{ token, admin }`
- `GET  /api/menu` — list available menu items
- `GET  /api/tables/by-code/:code` — resolve a table by its QR code
- `POST /api/orders` — `{ tableCode, items: [{ menuItemId, quantity }], customerName?, notes? }`
- `GET  /api/orders/by-table/:code` — recent orders for a table (customer view)

### Admin (Bearer JWT)
- `GET    /api/orders?status=pending|preparing|completed|cancelled`
- `PATCH  /api/orders/:id/status` — body `{ status }`
- `GET    /api/tables` — list tables with generated QR data URLs
- `POST   /api/tables` — `{ number, label? }`
- `GET    /api/tables/:id/qr.png` — PNG stream of the QR code
- `DELETE /api/tables/:id`
- `GET    /api/menu/all` · `POST /api/menu` · `PATCH /api/menu/:id` · `DELETE /api/menu/:id`

### Socket.IO events
- Server emits `order:new` and `order:update` to the `admins` room and to `table:<code>` rooms.
- Client joins with `socket.emit('join-admin')` or `socket.emit('join-table', code)`.

## Deployment notes

- Set `PUBLIC_BASE_URL` to your production frontend URL so the QR codes encode the real customer link.
- Set `CLIENT_URL` to your production frontend origin (used for CORS + Socket.IO origin).
- Run `npm run seed` once against the production DB to create the admin user.
- Build the frontend with `cd client && npm run build` — serve `client/dist` with any static host, or behind the same proxy as the API.

## License

MIT
