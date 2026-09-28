# Deal Workspace

A quote-to-renewal workspace for the quote/deal family: intake, quote building with comparable-quote intelligence, approvals, contracts with prorated amendments, and partner visibility — in one app.

**Live demo:** https://quote-deal-workspace.lovable.app

> Demo prototype only. All companies, people, quotes, and contracts are fictional sample data — no real PII, no backend, nothing is stored or sent anywhere. All state lives in your browser session.

## What's inside

- **Dashboard** — KPIs, active quotes, renewal watchlist, recent activity
- **Quotes** — list, new-quote intake, and a full quote builder (line items, commercials, approval path, comparable quotes, pricing policy, audit trail)
- **Approvals** — submitted quotes queue with approve / request changes / reject
- **Contracts** — active and expiring contracts, auto-renew toggles, prorated mid-term amendments
- **Partners** — partner cards with owned contracts and influenced ARR

## Run it locally

Requires [Node.js](https://nodejs.org) 18+ (or [Bun](https://bun.sh)).

```bash
npm install
npm run dev
```

Then open **http://localhost:8080** in your browser.

## Build for production

```bash
npm run build
npm run preview
```

The app is a standard React (TanStack Start) + Tailwind CSS project, so it can also be deployed to any static/edge hosting provider (Vercel, Netlify, Cloudflare, etc.) that runs `npm run build`.

## Tech stack

- React 19 + TanStack Start (file-based routing, server functions)
- Tailwind CSS v4 with a custom "term sheet ledger" design system
- Zustand for client-side state
- shadcn/ui components, Lucide icons
