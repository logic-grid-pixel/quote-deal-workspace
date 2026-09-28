import { createFileRoute, Link } from "@tanstack/react-router";
import { useDealStore } from "@/lib/store";
import { contractArr } from "@/lib/pricing";
import { fmtCompact, fmtDate } from "@/lib/format";
import { ContractStatusBadge, TierBadge } from "@/components/status-badge";

export const Route = createFileRoute("/partners")({
  component: PartnersPage,
  head: () => ({
    meta: [
      { title: "Partners — Deal Workspace" },
      {
        name: "description",
        content: "Channel partners with tier, owned contracts, and influenced ARR.",
      },
      { property: "og:title", content: "Partners — Deal Workspace" },
      { property: "og:description", content: "Channel partners, their tiers, and the contracts they influence." },
    ],
  }),
});

function PartnersPage() {
  const { partners, contracts, products } = useDealStore();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <header>
        <h1 className="font-display text-4xl">Partners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {partners.length} channel partners · contracts and renewal posture per partner
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {partners.map((p) => {
          const owned = contracts.filter((c) => c.partnerId === p.id);
          const arr = owned.reduce((s, c) => s + contractArr(c.lines, products), 0);
          return (
            <article key={p.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{p.name}</h2>
                  <p className="num mt-0.5 text-xs text-muted-foreground">
                    {p.region} · owner {p.accountOwner}
                  </p>
                </div>
                <TierBadge tier={p.tier} />
              </div>

              <div className="mt-4 flex gap-6">
                <div>
                  <p className="num text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Contracts</p>
                  <p className="num text-lg font-semibold">{owned.length}</p>
                </div>
                <div>
                  <p className="num text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Influenced ARR</p>
                  <p className="num text-lg font-semibold">{fmtCompact(arr)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                {owned.length === 0 && (
                  <p className="text-xs text-muted-foreground">No contracts on record.</p>
                )}
                {owned.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                    <Link to="/contracts/$contractId" params={{ contractId: c.id }} className="truncate font-medium hover:underline">
                      {c.customer}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="num text-muted-foreground">ends {fmtDate(c.endDate)}</span>
                      <ContractStatusBadge status={c.status} />
                    </span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
