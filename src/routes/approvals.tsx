import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, RotateCcw, X } from "lucide-react";
import { useDealStore } from "@/lib/store";
import { compsSummary, quoteTotals, rankComps } from "@/lib/pricing";
import { HISTORICAL_QUOTES } from "@/lib/seed";
import { fmtDate, fmtMoney } from "@/lib/format";
import { QuoteStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/approvals")({
  component: ApprovalsPage,
  head: () => ({
    meta: [
      { title: "Approvals — Deal Workspace" },
      {
        name: "description",
        content: "Deal desk approval queue with historical precedent for every submitted quote.",
      },
      { property: "og:title", content: "Approvals — Deal Workspace" },
      { property: "og:description", content: "Deal desk approval queue with precedent attached." },
    ],
  }),
});

function ApprovalsPage() {
  const { quotes, products, setQuoteStatus } = useDealStore();
  const queue = quotes.filter((q) => q.status === "submitted");
  const decided = quotes.filter((q) =>
    ["approved", "rejected", "changes_requested"].includes(q.status),
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <header>
        <h1 className="font-display text-4xl">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {queue.length} quote{queue.length === 1 ? "" : "s"} waiting on deal desk
        </p>
      </header>

      {queue.length === 0 && (
        <div className="mt-8 rounded-lg border border-border bg-card px-6 py-10 text-center">
          <p className="font-display text-2xl">The queue is clear</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted quotes land here with precedent from the last 6 months attached.
          </p>
          <Link to="/quotes/new" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Start a new quote →
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {queue.map((q) => {
          const t = quoteTotals(q.lines, products);
          const matches = rankComps(q, HISTORICAL_QUOTES);
          const summary = compsSummary(q, matches, products);
          const best = matches[0];
          return (
            <article key={q.id} className="rounded-lg border border-border bg-card">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link to="/quotes/$quoteId" params={{ quoteId: q.id }} className="num text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:underline">
                      {q.number}
                    </Link>
                    <QuoteStatusBadge status={q.status} />
                  </div>
                  <h2 className="mt-0.5 font-display text-2xl">{q.customer}</h2>
                  <p className="num text-xs text-muted-foreground">
                    {q.seats.toLocaleString()} seats · {q.termYears}yr · {q.region} · {q.channel} · submitted {fmtDate(q.submittedAt ?? q.createdAt)} by {q.owner}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-lg font-semibold">{fmtMoney(t.net)}</p>
                  <p className="num text-xs text-muted-foreground">{t.blendedDiscount.toFixed(1)}% blended discount</p>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto]">
                <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs leading-relaxed">{summary.headline}</p>
                  {best && (
                    <p className="num mt-2 text-[11px] text-muted-foreground">
                      Closest precedent: {best.id} · {best.customer} · {best.matchPct}% match — approved by {best.approvedBy.split("—")[0].trim()}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-medium">{summary.recommendation}</p>
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <Button
                    onClick={() => setQuoteStatus(q.id, "approved", `Approved at ${t.blendedDiscount.toFixed(1)}% blended`)}
                    className="bg-success text-success-foreground hover:bg-success/90"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => setQuoteStatus(q.id, "changes_requested", "Discount staging requested")}>
                    <RotateCcw className="h-4 w-4" /> Request changes
                  </Button>
                  <Button variant="outline" onClick={() => setQuoteStatus(q.id, "rejected", "Outside policy, no precedent")}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {decided.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Recently decided</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {decided.map((q) => {
                  const t = quoteTotals(q.lines, products);
                  return (
                    <tr key={q.id} className="hover:bg-accent/40">
                      <td className="px-5 py-3">
                        <Link to="/quotes/$quoteId" params={{ quoteId: q.id }} className="font-medium hover:underline">
                          {q.customer}
                        </Link>
                        <p className="num text-[11px] text-muted-foreground">{q.number} · {fmtMoney(t.net)} · {t.blendedDiscount.toFixed(1)}%</p>
                      </td>
                      <td className="px-5 py-3 text-right"><QuoteStatusBadge status={q.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
