import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FilePlus2, TriangleAlert } from "lucide-react";
import { useDealStore } from "@/lib/store";
import { annualValue, contractArr, quoteTotals } from "@/lib/pricing";
import { daysUntil, fmtCompact, fmtDate, fmtDateTime, fmtInt, fmtMoney } from "@/lib/format";
import { ContractStatusBadge, QuoteStatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Deal Workspace" },
      {
        name: "description",
        content:
          "Pipeline, approvals, contract ARR, and renewal risk across the full deal lifecycle in one view.",
      },
      { property: "og:title", content: "Dashboard — Deal Workspace" },
      {
        property: "og:description",
        content: "Pipeline, approvals, contract ARR, and renewal risk in one view.",
      },
    ],
  }),
});

function Dashboard() {
  const { quotes, contracts, products, createRenewalQuote } = useDealStore();

  const open = quotes.filter((q) => ["draft", "changes_requested"].includes(q.status));
  const pending = quotes.filter((q) => q.status === "submitted");
  const openValue = [...open, ...pending].reduce(
    (s, q) => s + quoteTotals(q.lines, products).net,
    0,
  );
  const arr = contracts
    .filter((c) => c.status !== "Expired")
    .reduce((s, c) => s + contractArr(c.lines, products), 0);
  const expiring = contracts.filter((c) => {
    const d = daysUntil(c.endDate);
    return d <= 90;
  });

  const activity = quotes
    .flatMap((q) => q.audit.map((a) => ({ ...a, quote: q })))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 7);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Monday · Q4 FY26 · week 1
          </p>
          <h1 className="mt-1 font-display text-4xl">Deal Workspace</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Quote with precedent, clear approvals, and manage contracts through renewal — one
            lifecycle, one workspace.
          </p>
        </div>
        <Link
          to="/quotes/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FilePlus2 className="h-4 w-4" /> New quote
        </Link>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Open quotes" value={fmtInt(open.length + pending.length)} sub={`${fmtCompact(openValue)} in flight`} />
        <Kpi label="Awaiting approval" value={fmtInt(pending.length)} sub={pending.length ? "oldest waiting 1 day" : "queue is clear"} tone={pending.length ? "amber" : undefined} />
        <Kpi label="Contract ARR" value={fmtCompact(arr)} sub={`${contracts.filter((c) => c.status !== "Expired").length} active agreements`} />
        <Kpi label="Renewal window ≤ 90d" value={fmtInt(expiring.length)} sub={expiring.length ? fmtCompact(expiring.reduce((s, c) => s + contractArr(c.lines, products), 0)) + " at stake" : "nothing due"} tone={expiring.length ? "amber" : undefined} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="font-display text-xl">Active quotes</h2>
            <Link to="/quotes" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              All quotes <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {quotes.slice(0, 5).map((q) => {
              const t = quoteTotals(q.lines, products);
              return (
                <Link
                  key={q.id}
                  to="/quotes/$quoteId"
                  params={{ quoteId: q.id }}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{q.customer}</p>
                    <p className="num text-[11px] text-muted-foreground">
                      {q.number} · {q.seats.toLocaleString()} seats · {q.termYears}yr · {q.region}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm">{fmtMoney(t.net)}</p>
                    <p className="num text-[11px] text-muted-foreground">{t.blendedDiscount.toFixed(1)}% disc</p>
                  </div>
                  <QuoteStatusBadge status={q.status} />
                </Link>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <TriangleAlert className="h-4 w-4 text-warning-foreground text-warning" /> Renewal watchlist
              </h2>
            </div>
            <div className="divide-y divide-border">
              {expiring.length === 0 && (
                <p className="px-5 py-4 text-sm text-muted-foreground">Nothing expiring in the next 90 days.</p>
              )}
              {expiring.map((c) => (
                <div key={c.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to="/contracts/$contractId"
                      params={{ contractId: c.id }}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {c.customer}
                    </Link>
                    <ContractStatusBadge status={c.status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="num">ends {fmtDate(c.endDate)} · {fmtCompact(contractArr(c.lines, products))} ARR</span>
                    <button
                      onClick={() => {
                        const id = createRenewalQuote(c.id);
                        if (id) window.location.assign(`/quotes/${id}`);
                      }}
                      className="rounded border border-border px-2 py-0.5 font-medium text-foreground hover:bg-accent"
                    >
                      Draft renewal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="font-display text-xl">Recent activity</h2>
            </div>
            <ul className="divide-y divide-border">
              {activity.map((a) => (
                <li key={a.id} className="px-5 py-2.5">
                  <p className="text-xs">
                    <span className="font-medium">{a.actor}</span> · {a.action}
                  </p>
                  <p className="num text-[11px] text-muted-foreground">
                    {a.quote.number}
                    {a.detail ? ` — ${a.detail}` : ""} · {fmtDateTime(a.ts)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "amber" | undefined;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="num text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className={`num mt-1.5 text-2xl font-semibold ${tone === "amber" ? "text-accent-foreground" : ""}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// keep annualValue referenced for future widgets
void annualValue;
