import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  FileSignature,
  Gavel,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useDealStore } from "@/lib/store";
import { HISTORICAL_QUOTES } from "@/lib/seed";
import { computeApproval, compsSummary, lineNet, quoteTotals, rankComps } from "@/lib/pricing";
import { fmtDateTime, fmtMoney, fmtPct } from "@/lib/format";
import { QuoteStatusBadge, badge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Quote } from "@/lib/types";

export const Route = createFileRoute("/quotes/$quoteId")({
  component: BuilderPage,
  head: () => ({
    meta: [
      { title: "Quote Builder — Deal Workspace" },
      {
        name: "description",
        content: "Build the quote with AI bundle suggestions, approved-deal comps, policy checks, and a full audit trail.",
      },
      { property: "og:title", content: "Quote Builder — Deal Workspace" },
      {
        property: "og:description",
        content: "Build quotes with precedent from approved deals and instant policy checks.",
      },
    ],
  }),
});

function BuilderPage() {
  const { quoteId } = Route.useParams();
  const navigate = useNavigate();
  const { quotes, products, updateLine, removeLine, addLines, submitQuote, convertQuote } =
    useDealStore();
  const quote = quotes.find((q) => q.id === quoteId);
  if (!quote) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl">Quote not found</h1>
        <Button className="mt-4" onClick={() => navigate({ to: "/quotes" })}>Back to quotes</Button>
      </div>
    );
  }
  return <Builder quote={quote} onUpdate={updateLine} onRemove={removeLine} onAdd={addLines} onSubmit={submitQuote} onConvert={convertQuote} products={products} />;
}

function Builder({
  quote,
  onUpdate,
  onRemove,
  onAdd,
  onSubmit,
  onConvert,
  products,
}: {
  quote: Quote;
  onUpdate: (quoteId: string, lineId: string, patch: Partial<Quote["lines"][number]>) => void;
  onRemove: (quoteId: string, lineId: string) => void;
  onAdd: (quoteId: string, lines: Omit<Quote["lines"][number], "id">[]) => void;
  onSubmit: (quoteId: string) => void;
  onConvert: (quoteId: string) => void;
  products: ReturnType<typeof useDealStore.getState>["products"];
}) {
  const [addProduct, setAddProduct] = useState<string>("");
  const totals = quoteTotals(quote.lines, products);
  const approval = computeApproval(totals.blendedDiscount);
  const matches = useMemo(() => rankComps(quote, HISTORICAL_QUOTES), [quote]);
  const summary = useMemo(() => compsSummary(quote, matches, products), [quote, matches, products]);
  const bundles = useMemo(() => recommendBundles(quote, products), [quote, products]);
  const suggested = bundles.filter(
    (b) => !b.items.every((i) => quote.lines.some((l) => l.productId === i.productId)),
  );

  const toneClass =
    approval.tone === "success" ? "text-success" : approval.tone === "warning" ? "text-warning-foreground" : "text-destructive";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="num text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{quote.number}</span>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <h1 className="mt-1 font-display text-4xl">{quote.customer}</h1>
          <p className="num mt-1 text-xs text-muted-foreground">
            {quote.industry || "—"} · {quote.seats.toLocaleString()} seats · {quote.termYears}yr ·{" "}
            {quote.region} · {quote.channel} · owner {quote.owner}
          </p>
        </div>
        <div className="flex gap-2">
          {quote.status === "draft" && (
            <Button onClick={() => onSubmit(quote.id)}>
              <Send className="h-4 w-4" /> Submit for approval
            </Button>
          )}
          {quote.status === "submitted" && (
            <Link to="/approvals">
              <Button variant="secondary"><Gavel className="h-4 w-4" /> Track in approvals</Button>
            </Link>
          )}
          {quote.status === "approved" && (
            <Button onClick={() => onConvert(quote.id)}>
              <FileSignature className="h-4 w-4" /> Convert to contract
            </Button>
          )}
          {quote.status === "converted" && (
            <Link to="/contracts">
              <Button variant="secondary"><FileSignature className="h-4 w-4" /> View contracts</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* LEFT: line items + totals */}
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="font-display text-xl">Line items</h2>
              <span className="num text-[11px] text-muted-foreground">{quote.lines.length} SKUs</span>
            </div>
            <div className="divide-y divide-border">
              {quote.lines.length === 0 && (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  No line items yet — add products below or accept a copilot suggestion.
                </p>
              )}
              {quote.lines.map((l) => {
                const p = products.find((x) => x.id === l.productId);
                return (
                  <div key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[1.4fr_90px_90px_110px_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p?.name}</p>
                      <p className="num text-[11px] text-muted-foreground">
                        {p?.sku} · {fmtMoney(p?.unitPrice ?? 0)}/{p?.unit}/yr
                        {l.source === "bundle" ? " · copilot" : l.source === "renewal" ? " · renewal" : ""}
                      </p>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Qty
                      <Input
                        type="number"
                        min={0}
                        className="num h-8 w-[68px] text-right"
                        value={l.qty}
                        onChange={(e) => onUpdate(quote.id, l.id, { qty: Math.max(0, Number(e.target.value)) })}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Disc %
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        className="num h-8 w-[68px] text-right"
                        value={l.discountPct}
                        onChange={(e) => onUpdate(quote.id, l.id, { discountPct: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      />
                    </label>
                    <p className="num text-right text-sm">{fmtMoney(lineNet(l, products))}</p>
                    <button
                      onClick={() => onRemove(quote.id, l.id)}
                      className="justify-self-end rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${p?.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 border-t border-border bg-secondary/40 px-5 py-3">
              <Select value={addProduct} onValueChange={setAddProduct}>
                <SelectTrigger className="h-8 w-64 bg-card text-xs">
                  <SelectValue placeholder="Add product from catalog…" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {fmtMoney(p.unitPrice)}/{p.unit}/yr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                disabled={!addProduct}
                onClick={() => {
                  const p = products.find((x) => x.id === addProduct);
                  if (!p) return;
                  onAdd(quote.id, [{ productId: p.id, qty: quote.seats || 100, discountPct: 0, termYears: quote.termYears, source: "manual" }]);
                  setAddProduct("");
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="num text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Commercials</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">List value</dt><dd className="num">{fmtMoney(totals.list)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Net value (TCV)</dt><dd className="num font-semibold">{fmtMoney(totals.net)}</dd></div>
                <div className="flex justify-between border-t border-border pt-2"><dt className="text-muted-foreground">Blended discount</dt><dd className="num font-semibold">{fmtPct(totals.blendedDiscount)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Annualized (ARR)</dt><dd className="num">{fmtMoney(totals.net / Math.max(1, quote.termYears))}</dd></div>
              </dl>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="num text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Approval path</h3>
              <p className={`mt-3 flex items-center gap-1.5 font-display text-xl ${toneClass}`}>
                <BadgeCheck className="h-5 w-5" /> {approval.label}
              </p>
              <p className="num mt-1 text-xs text-muted-foreground">
                ~{approval.likelihood}% approval likelihood · ~{approval.avgHours < 1 ? `${Math.round(approval.avgHours * 60)} min` : `${approval.avgHours} hr`} · {approval.similarDeals} similar deals approved
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {approval.required.map((r) => (
                  <span key={r} className={badge({ tone: approval.tone === "success" ? "success" : "progress" })}>{r}</span>
                ))}
              </div>
            </div>
          </section>

          {suggested.length > 0 && (
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display text-xl">Copilot bundle suggestions</h2>
              </div>
              <div className="divide-y divide-border">
                {suggested.map((b) => (
                  <div key={b.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.rationale}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="num text-xs text-muted-foreground">{b.confidence}% confidence</span>
                        <Button size="sm" variant="outline" onClick={() => onAdd(quote.id, b.items.map((i) => ({ ...i, source: "bundle" as const })))}>
                          Add bundle
                        </Button>
                      </div>
                    </div>
                    <p className="num mt-1.5 text-[11px] text-muted-foreground">
                      {b.items.map((i) => `${products.find((p) => p.id === i.productId)?.sku} ×${i.qty.toLocaleString()}`).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT: comps / policy / audit */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Tabs defaultValue="comps">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comps">Comps</TabsTrigger>
              <TabsTrigger value="policy">Policy</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="comps" className="mt-3 space-y-3">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Comps summary
                </p>
                <p className="mt-1.5 text-xs leading-relaxed">{summary.headline}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {summary.bullets.map((b, i) => <li key={i} className="flex gap-1.5"><span className="text-primary">–</span>{b}</li>)}
                </ul>
                <p className="mt-2 border-t border-primary/20 pt-2 text-xs font-medium">{summary.recommendation}</p>
              </div>
              {matches.map((m) => (
                <details key={m.id} className="group rounded-lg border border-border bg-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{m.customer}</p>
                      <p className="num text-[10px] text-muted-foreground">{m.id} · {m.termMonths}mo · {m.region} · {m.channel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`num rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.matchPct >= 80 ? "bg-success/15 text-success" : m.matchPct >= 60 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                        {m.matchPct}%
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="border-t border-border px-4 py-3">
                    <ul className="space-y-1 text-[11px] text-muted-foreground">
                      {m.reasons.map((r, i) => <li key={i}>· {r}</li>)}
                    </ul>
                    <p className="num mt-2 text-[11px]">
                      {fmtMoney(m.lines.reduce((s, l) => s + lineNet(l, products), 0))} approved{" "}
                      {new Date(m.approvedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} by {m.approvedBy.split("—")[0].trim()}
                    </p>
                    <table className="num mt-2 w-full text-[10px] text-muted-foreground">
                      <tbody>
                        {m.lines.map((l) => {
                          const p = products.find((x) => x.id === l.productId);
                          return (
                            <tr key={l.id}>
                              <td className="py-0.5">{p?.sku}</td>
                              <td className="text-right">×{l.qty.toLocaleString()}</td>
                              <td className="text-right">{l.discountPct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </TabsContent>

            <TabsContent value="policy" className="mt-3">
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <PolicyGroup tone="Standard" items={["Net 30 / Net 45 payment terms", "Standard 99.9% uptime SLA", "60-day non-renewal notice"]} />
                <PolicyGroup tone="Pre-approved Exception" items={["Net 60 with Tier 1–2 partners", "Termination for convenience (12-mo notice)", "Co-terming to existing MSA end date"]} />
                <PolicyGroup tone="Requires Legal" items={["Unlimited liability carve-outs", "Non-standard data processing terms", "Source code escrow"]} />
                <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
                  Clauses above are checked against the current deal desk policy pack (v4.2, effective Jul 2026).
                </p>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="mt-3">
              <ol className="space-y-0 rounded-lg border border-border bg-card p-4">
                {[...quote.audit].reverse().map((a, i, arr) => (
                  <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < arr.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-border" />}
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                    <div className="min-w-0">
                      <p className="text-xs">
                        <span className="font-semibold">{a.actor}</span> — {a.action}
                      </p>
                      {a.detail && <p className="text-[11px] text-muted-foreground">{a.detail}</p>}
                      <p className="num text-[10px] text-muted-foreground">{fmtDateTime(a.ts)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function PolicyGroup({ tone, items }: { tone: string; items: string[] }) {
  const toneClass =
    tone === "Standard" ? "success" : tone === "Pre-approved Exception" ? "progress" : "destructive";
  return (
    <div>
      <span className={badge({ tone: toneClass as "success" })}>{tone}</span>
      <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
        {items.map((i) => <li key={i}>· {i}</li>)}
      </ul>
    </div>
  );
}

function recommendBundles(quote: Quote, products: Quote["lines"] extends never ? never : ReturnType<typeof useDealStore.getState>["products"]) {
  const seats = quote.seats || 500;
  const term = quote.termYears || 3;
  const industry = quote.industry || "enterprise";
  const mk = (productId: string, qty: number, discountPct = 0) => ({
    productId,
    qty,
    discountPct,
    termYears: term,
  });
  return [
    {
      id: "b1",
      name: "Endpoint consolidation + SOC",
      rationale: `Matches 87% of ${industry} deals at ${seats.toLocaleString()} seats — consolidates endpoint and SOC tooling.`,
      confidence: 91,
      items: [mk("xdr-pro", seats), mk("xsiam", seats), mk("sup-247", 1)],
    },
    {
      id: "b2",
      name: "Cloud + network security attach",
      rationale: "Common attach when the customer consolidates cloud and network security under one renewal.",
      confidence: 74,
      items: [mk("prisma-cloud", Math.max(50, Math.round(seats / 25))), mk("sase", seats)],
    },
    {
      id: "b3",
      name: "Incident response readiness",
      rationale: "Unit 42 retainer attaches at list in 6 of 10 comparable approvals — low friction, high stickiness.",
      confidence: 58,
      items: [mk("u42-ir", 1), mk("autofocus", seats)],
    },
  ].map((b) => ({ ...b, items: b.items.filter((i) => products.some((p) => p.id === i.productId)) }));
}
