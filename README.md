# Billing & Inventory — Frontend

React SPA for the billing counter: catalogue management, a POS-style billing screen,
and invoices.

**React 19 + TypeScript + Vite**, with **Redux Toolkit**, **React Router** and
**Tailwind CSS 4**. Data goes through `fetch` — no HTTP client dependency.

## Requirements

- Node.js 18+
- The [backend](../inventory-backend) running and reachable

## Setup

```bash
npm install
cp .env.example .env
```

`.env` holds one variable — where the API lives:

```ini
VITE_API_URL=http://localhost:3000/api
```

Start it:

```bash
npm run dev
```

Opens on `http://localhost:5173`. Sign in with the backend's seeded owner account:

```
admin@example.com / Admin@123
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server with HMR |
| `npm run build` | typecheck, then production build into `dist/` |
| `npm run preview` | serve the production build locally |
| `npm run lint` | ESLint |

## Pages

| Route | What it does |
| --- | --- |
| `/login` | JWT login |
| `/` | dashboard |
| `/billing` | POS screen — pick products, cart, checkout drawer |
| `/invoices` · `/invoices/:id` | invoice list and full bill view |
| `/customers` | customer CRUD |
| `/categories` · `/products` · `/variants` | catalogue CRUD |

Every route except `/login` sits behind `ProtectedRoute`.

## How it is put together

```
src/
  api/        client.ts wraps fetch; one module per resource
  store/      Redux Toolkit — auth and cart slices
  pages/      one file per route
  components/ Modal, Drawer, ConfirmDialog, Select, AsyncSelect, Pagination…
  icons/      inline SVG components, no icon library
  constants/  dropdown option sets in one place
  types/      mirrors the backend response contract
  utils/      money/date formatting, error messages
```

**`api/client.ts` is the only place that calls `fetch`.** It owns the base URL, the
`Authorization` header, unwrapping the `{ success, message, data }` envelope, and
turning failures into `ApiError`. A `401` clears auth state and drops the user back
to `/login`.

**Redux holds only what is shared across pages** — the logged-in user and the cart.
List pages keep their own state, since nothing else reads it.

Two things worth knowing before touching the code:

- The login token is nested at `data.token.access_token`, not `data.token`.
- Money arrives as a fixed 2-decimal **string** (`"499.00"`) because JSON numbers drop
  trailing zeros. Use `formatMoney()` to display it, and `Number()` before any maths.
  It is still **sent** as a plain number.
