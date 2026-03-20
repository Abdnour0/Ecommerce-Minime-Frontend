# MINIME — E-Commerce Frontend

A client-side e-commerce storefront for MINIME sustainable footwear and apparel. Built with vanilla JavaScript ES modules — no framework, no bundler required.

---

## Features

- Product catalogue with filtering (Men, Women, Sale, Bestsellers)
- Shopping cart (persisted to `localStorage`)
- Wishlist
- User authentication (localStorage-based, no backend required)
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
# Option 1 — npx serve (no install needed)
npx serve .

# Option 2 — Vite dev server
npm install -g vite
vite
```

Then open `http://localhost:3000` (or the port shown).

---

## Configuration

Edit **`config.js`** before deploying:

| Variable | Description |
|----------|-------------|
| `API_URL` | Backend REST API base URL |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (`pk_live_…` or `pk_test_…`) |
| `ADMIN_EMAILS` | Email addresses granted dashboard access |

---

## Project Structure

```
FrontEnd/
├── index.html              # Single-page app shell (all pages as hidden divs)
├── main.js                 # App entry point — initialises all managers
├── config.js               # Environment configuration (API URL, Stripe key)
├── style.css               # Global styles
├── style-addresses.css     # Address-specific styles
└── components/
    ├── state.js            # Shared application state
    ├── auth.js             # Authentication (localStorage-based)
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
    ├── ui-handlers.js      # UI event handlers (cart, checkout, modals…)
    ├── ui-utils.js         # Shared utilities (notifications, escapeHtml)
    ├── logger.js           # Development-only logging utility
    ├── dashboard.js        # Admin dashboard (Chart.js)
    ├── dashboard-access.js # Dashboard access control
    └── dom.js              # DOM element references
```

---

## Authentication

This project uses **localStorage-only** authentication — no real backend is required. Passwords are hashed with **SHA-256** via the Web Crypto API before storage.

> ⚡ For production, replace `auth.js` with calls to a real backend (e.g. Node/Express + bcrypt).

---

## Deployment

1. Set `STRIPE_PUBLISHABLE_KEY` in `config.js`
2. Set `API_URL` to your production backend
3. Deploy the entire `FrontEnd/` folder to any static host:
   - **Vercel**: `vercel deploy`
   - **Netlify**: drag-and-drop the folder
   - **GitHub Pages**: push to `gh-pages` branch

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes
4. Open a Pull Request against `main`

---

## License

MIT © MINIME
