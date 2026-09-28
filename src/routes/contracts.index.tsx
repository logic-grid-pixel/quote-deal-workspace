import { createFileRoute, Link } from "@tanstack/react-router";
import { useDealStore } from "@/lib/store";
import { contractArr, contractTcv } from "@/lib/pricing";
import { daysUntil, fmtCompact, fmtDate } from "@/lib/format";
import { ContractStatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/contracts/")({
  component: ContractsPage,
  head: () => ({
    meta: [
      { title: "Contracts — Deal Workspace" },
      {
        name: "description",
        content: "Multi-year customer agreements with amendments, co-terming, and auto-renewal status.",
      },
      { property: "og:title", content: "Contracts — Deal Workspace" },
      {
        property: "og:description",
        content: "Multi-year agreements with amendments, co-terming, and renewal tracking.",
      },
    ],
  }),
});

function ContractsPage() {
  const { contracts, products, partners, toggleAutoRenew } = useDealStore();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <header>
        <h1 className="font-display text-4xl">Contracts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {contracts.length} master agreements · amendments co-term to each MSA's end date
        </p>
      </header>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <Th>Contract</Th>
              <Th className="hidden md:table-cell">Term</Th>
              <Th className="text-right">ARR</Th>
              <Th className="hidden text-right sm:table-cell">TCV</Th>
              <Th>Status</Th>
              <Th className="text-right">Auto-renew</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contracts.map((c) => {
              const days = daysUntil(c.endDate);
              const partner = partners.find((p) => p.id === c.partnerId);
              return (
                <tr key={c.id} className="transition-colors hover:bg-accent/40">
                  <td className="px-5 py-3">
                    <Link to="/contracts/$contractId" params={{ contractId: c.id }} className="font-medium hover:underline">
                      {c.customer}
                    </Link>
                    <p className="num text-[11px] text-muted-foreground">
                      {c.number}
                      {partner ? ` · via ${partner.name}` : ""}
                      {c.lines.some((l) => l.source === "amendment") ? ` · ${c.amendments.length} amendment${c.amendments.length === 1 ? "" : "s"}` : ""}
                    </p>
                  </td>
                  <td className="num hidden px-5 py-3 text-xs text-muted-foreground md:table-cell">
                    {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                    {days >= 0 && days <= 90 && <span className="block text-accent-foreground">renews in {days}d</span>}
                  </td>
                  <td className="num px-5 py-3 text-right">{fmtCompact(contractArr(c.lines, products))}</td>
                  <td className="num hidden px-5 py-3 text-right text-muted-foreground sm:table-cell">
                    {fmtCompact(contractTcv(c.lines, products))}
                  </td>
                  <td className="px-5 py-3"><ContractStatusBadge status={c.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleAutoRenew(c.id)}
                      className={`num inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${c.autoRenew ? "bg-success" : "bg-muted"}`}
                      aria-label={`Toggle auto-renew for ${c.customer}`}
                    >
                      <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${c.autoRenew ? "translate-x-4" : ""}`} />
                    </button>
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
