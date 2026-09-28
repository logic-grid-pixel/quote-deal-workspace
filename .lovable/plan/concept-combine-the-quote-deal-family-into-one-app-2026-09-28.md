# Concept: Combine the Quote/Deal Family into One App

## What you have today

| Project | What it does | Reusable pieces |
|---|---|---|
| Quote Copilot | AI-assisted quote builder: intake → builder → approval, with AI mock, audit drawer, policy panel | Full workflow screens, store, mock AI |
| Deal Copilot | Earlier variant of the same AI quote-builder idea | Alternative builder concepts |
| Swift Quoting | Same problem framed as a CPQ team pitch | Alternative builder concepts |
| Deal Compass | Shows quotes with similar bundles/pricing approved in last 6 months, % match | Match-scoring UI, mock quote data |
| Deal Spark | Same idea as Deal Compass, earlier version | Match-scoring UI |
| Partner Lifecycle Hub | Multi-year contracts for partners: amendments, mid-term changes, co-term, auto-renewal | Real proration/pricing math, contracts + partners screens |

Deal Copilot/Quote Copilot/Swift Quoting overlap heavily, and so do Deal Compass/Deal Spark — there are effectively three ideas, not six.

## The interesting combination

None of these prototypes tells the full story alone. Combined, one deal could flow end to end:

```text
Intake → AI quote builder → similar-deal comps (% match) → approval
       → signed contract → mid-term amendment / co-term → auto-renewal
```

That is a compelling demo for a CPQ vision: the seller sees approved precedents while building, then the approved quote becomes a living contract that partners can amend — one continuous lifecycle.

## Concept: "Deal Workspace" (single app, one sidebar)

- **Dashboard** — pipeline of quotes/contracts, one object model shared across modules
- **Quote Builder** — from Quote Copilot (intake, AI assist, policy checks, audit trail)
- **Deal Comps** — from Deal Compass (% match against approved quotes, surfaced as a side panel inside the builder, not a separate page)
- **Approvals** — the approval flow from Quote Copilot
- **Contracts** — from Partner Lifecycle Hub (partners, amendments, co-term, renewal)

Two ways to scope it:

1. **Full merge** — all modules above, one shared deal object. Bigger build; best as 2–3 steps.
2. **Best-of merge** — quote builder + comps panel + contracts only; drop redundant dashboards. One focused demo.

## How the merge works mechanically

- Your other projects can be read here as snapshots; their screens, mock data, and pricing logic can be copied into this project directly.
- Shared stack (React + same UI kit) means components carry over with light adaptation — mainly reconciling the three different data models into one shared quote/contract shape.
- Nothing is pushed back to the original projects; they stay untouched.
