# MINIME — E-Commerce Frontend

A client-side e-commerce storefront for MINIME sustainable footwear and apparel. Built with vanilla JavaScript ES modules — no framework required.

---

## Features

- Product catalogue with filtering (Men, Women, Sale, Bestsellers)
- Shopping cart (persisted to `localStorage`)
- Wishlist
- Multi-language support: English, French, Arabic (RTL)
- Light / Dark theme
- Checkout with Stripe card payment + Cash on Delivery fallback
- Admin dashboard (Chart.js analytics)
- Address book, Order history, Reviews

---

## Getting Started

### Prerequisites

- Any static file server (e.g. VS Code **Live Server**, `npx serve`, or **Vite**)
- A modern browser with ES module support (Chrome 80+, Firefox 80+, Safari 14+)

> ⚠️ **Do NOT open `index.html` directly** (`file://` protocol blocks ES modules). Always serve via a local server.

### Run locally

```bash
npm run dev
```

Then open `http://localhost:5173` (or the port shown).

---

## Configuration

Copy `.env.example` to `.env` and set the required variables:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend REST API base URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (`pk_live_…` or `pk_test_…`) |
| `VITE_ADMIN_EMAILS` | No | Comma-separated admin email addresses for dashboard access |

---

## Project Structure

```
FrontEnd/
├── index.html              # Single-page app shell (all pages as hidden divs)
├── main.js                 # App entry point
├── config.js               # Runtime config (reads from Vite env vars)
├── style.css               # Global styles
└── components/
    ├── state.js            # Shared application state
    ├── auth.js             # Authentication
    ├── cart.js             # Shopping cart logic
    ├── wishlist.js         # Wishlist logic + rendering
    ├── orders.js           # Order management + rendering
    ├── addresses.js        # Address book
    ├── products.js         # Product fetching + rendering
    ├── fallback-products.js# Local product data (no backend needed)
    ├── reviews.js          # Product reviews
    ├── settings.js         # Language & theme
    ├── translations.js     # All UI strings in 3 languages
    ├── pages.js            # Page navigation helpers
    ├── ui-handlers.js      # UI event handlers
    ├── ui-utils.js         # Shared utilities (notifications, escapeHtml)
    ├── dashboard.js        # Admin dashboard (Chart.js)
    ├── dashboard-access.js # Dashboard access control
    └── dom.js              # DOM element references
```

---

## Deployment

1. Set the required environment variables on your hosting platform (Vercel, Netlify, Cloudflare Pages, etc.)
2. Deploy the `dist/` folder after running `npm run build`

For SPA routing (so page refreshes don't 404), add a redirect rule:

**Netlify** (`_redirects` file):
```
/* /index.html 200
```

**Vercel** (`vercel.json`):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## License

MIT © MINIME
