import { createFileRoute, Link } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { useDealStore } from "@/lib/store";
import { quoteTotals } from "@/lib/pricing";
import { fmtDate, fmtMoney } from "@/lib/format";
import { QuoteStatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/quotes")({
  component: QuotesPage,
  head: () => ({
    meta: [
      { title: "Quotes — Deal Workspace" },
      { name: "description", content: "Every quote in the pipeline: drafts, in-review, approved, and contracted." },
      { property: "og:title", content: "Quotes — Deal Workspace" },
      { property: "og:description", content: "Every quote in the pipeline, from draft to contracted." },
    ],
  }),
});

function QuotesPage() {
  const { quotes, products } = useDealStore();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Quotes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {quotes.length} quotes in the pipeline
          </p>
        </div>
        <Link
          to="/quotes/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <FilePlus2 className="h-4 w-4" /> New quote
        </Link>
      </header>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <Th>Quote</Th>
              <Th className="hidden md:table-cell">Customer</Th>
              <Th className="hidden lg:table-cell">Owner</Th>
              <Th className="text-right">Net value</Th>
              <Th className="text-right">Disc</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quotes.map((q) => {
              const t = quoteTotals(q.lines, products);
              return (
                <tr key={q.id} className="transition-colors hover:bg-accent/40">
                  <td className="px-5 py-3">
                    <Link to="/quotes/$quoteId" params={{ quoteId: q.id }} className="hover:underline">
                      <span className="num text-xs text-muted-foreground">{q.number}</span>
                      <p className="font-medium md:hidden">{q.customer}</p>
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3 md:table-cell">
                    <Link to="/quotes/$quoteId" params={{ quoteId: q.id }} className="font-medium hover:underline">
                      {q.customer}
                    </Link>
                    <p className="num text-[11px] text-muted-foreground">
                      {q.seats.toLocaleString()} seats · {q.termYears}yr · {q.region} · {q.channel}
                    </p>
                  </td>
                  <td className="hidden px-5 py-3 text-muted-foreground lg:table-cell">{q.owner}</td>
                  <td className="num px-5 py-3 text-right">{fmtMoney(t.net)}</td>
                  <td className="num px-5 py-3 text-right text-muted-foreground">
                    {t.blendedDiscount.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3">
                    <QuoteStatusBadge status={q.status} />
                    <p className="num mt-0.5 text-[11px] text-muted-foreground">
                      {q.status === "draft" ? `created ${fmtDate(q.createdAt)}` : q.submittedAt ? `in queue since ${fmtDate(q.submittedAt)}` : ""}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`num px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground ${className}`}>
      {children}
    </th>
  );
}
