import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FilePlus2, Plus } from "lucide-react";
import { useDealStore } from "@/lib/store";
import { annualValue, contractArr, contractTcv, proratedValue } from "@/lib/pricing";
import { fmtCompact, fmtDate, fmtMoney, todayISO } from "@/lib/format";
import { ContractStatusBadge, TierBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/contracts/$contractId")({
  component: ContractDetail,
  head: () => ({
    meta: [
      { title: "Contract — Deal Workspace" },
      {
        name: "description",
        content: "Contract detail with prorated amendments, co-terming, and renewal status.",
      },
      { property: "og:title", content: "Contract — Deal Workspace" },
      { property: "og:description", content: "Prorated amendments, co-terming, and renewal status." },
    ],
  }),
});

function ContractDetail() {
  const { contractId } = Route.useParams();
  const navigate = useNavigate();
  const { contracts, products, partners, addAmendment, toggleAutoRenew, createRenewalQuote } =
    useDealStore();
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl">Contract not found</h1>
        <Button className="mt-4" onClick={() => navigate({ to: "/contracts" })}>Back to contracts</Button>
      </div>
    );
  }

  const partner = partners.find((p) => p.id === contract.partnerId);
  const arr = contractArr(contract.lines, products);
  const tcv = contractTcv(contract.lines, products);
  const original = contract.lines.filter((l) => l.source === "original");

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <Link to="/contracts" className="num text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground">
        ← Contracts
      </Link>
      <header className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="num text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{contract.number}</span>
            <ContractStatusBadge status={contract.status} />
          </div>
          <h1 className="mt-1 font-display text-4xl">{contract.customer}</h1>
          <p className="num mt-1 text-xs text-muted-foreground">
            {fmtDate(contract.startDate)} → {fmtDate(contract.endDate)}
            {partner ? ` · via ${partner.name} (${partner.tier})` : ""}
            {contract.quoteId ? ` · from quote ${contract.quoteId}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Auto-renew
            <button
              onClick={() => toggleAutoRenew(contract.id)}
              className={`num inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${contract.autoRenew ? "bg-success" : "bg-muted"}`}
              aria-label="Toggle auto-renew"
            >
              <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${contract.autoRenew ? "translate-x-4" : ""}`} />
            </button>
          </label>
          <Button
            variant="outline"
            onClick={() => {
              const id = createRenewalQuote(contract.id);
              if (id) navigate({ to: "/quotes/$quoteId", params: { quoteId: id } });
            }}
          >
            <FilePlus2 className="h-4 w-4" /> Draft renewal quote
          </Button>
          <AmendDialog contract={contract} onAmend={(input) => addAmendment(contract.id, input)} />
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="ARR" value={fmtCompact(arr)} sub="annualized, discounted" />
        <Stat label="Total contract value" value={fmtCompact(tcv)} sub="prorated across all lines" />
        <Stat
          label="Amendments"
          value={String(contract.amendments.length)}
          sub={contract.amendments.length ? `last ${fmtDate(contract.amendments[contract.amendments.length - 1].date)}` : "none on record"}
        />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-xl">Subscription lines</h2>
            <p className="text-xs text-muted-foreground">Amendment lines are prorated daily and co-termed to the MSA end date.</p>
          </div>
          <div className="divide-y divide-border">
            {contract.lines.map((l) => {
              const p = products.find((x) => x.id === l.productId);
              const value = proratedValue(l, products, l.startDate, l.endDate);
              return (
                <div key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 px-5 py-3 sm:grid-cols-[1.5fr_110px_90px_110px]">
                  <div>
                    <p className="text-sm font-medium">
                      {p?.name}
                      {l.source === "amendment" && (
                        <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase text-accent-foreground">
                          amendment
                        </span>
                      )}
                    </p>
                    <p className="num text-[11px] text-muted-foreground">
                      {p?.sku} · ×{l.qty.toLocaleString()} {p?.unit}s · {l.discountPct}% disc
                    </p>
                  </div>
                  <p className="num hidden text-[11px] text-muted-foreground sm:block">
                    {fmtDate(l.startDate)} → {fmtDate(l.endDate)}
                  </p>
                  <p className="num hidden text-right text-[11px] text-muted-foreground sm:block">
                    {fmtMoney(annualValue(l, products))}/yr
                  </p>
                  <p className="num text-right text-sm">{fmtMoney(value)}</p>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between border-t border-border bg-secondary/40 px-5 py-2.5 text-xs">
            <span className="num text-muted-foreground">
              {original.length} original line{original.length === 1 ? "" : "s"} ·{" "}
              {contract.lines.length - original.length} amendment line
              {contract.lines.length - original.length === 1 ? "" : "s"}
            </span>
            <span className="num font-semibold">{fmtMoney(tcv)} TCV</span>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-xl">Amendment history</h2>
          </div>
          {contract.amendments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No amendments yet. Adding seats or products mid-term lands here, prorated to the
              contract end date.
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {[...contract.amendments].reverse().map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase text-accent-foreground">{a.type}</span>
                    <span className="num text-[11px] text-muted-foreground">effective {fmtDate(a.date)}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed">{a.description}</p>
                  <p className="num mt-1 text-[11px] text-muted-foreground">
                    {a.deltaValue >= 0 ? "+" : "−"}{fmtMoney(Math.abs(a.deltaValue))} prorated · {a.author}
                  </p>
                </li>
              ))}
            </ol>
          )}
          {contract.notes && (
            <p className="border-t border-border px-5 py-3 text-xs italic text-muted-foreground">{contract.notes}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="num text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="num mt-1.5 text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function AmendDialog({
  contract,
  onAmend,
}: {
  contract: ReturnType<typeof useDealStore.getState>["contracts"][number];
  onAmend: (input: { productId: string; qty: number; discountPct: number; effectiveDate: string; type: "add" | "change" }) => void;
}) {
  const { products } = useDealStore();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(50);
  const [discountPct, setDiscountPct] = useState(10);
  const [effectiveDate, setEffectiveDate] = useState(todayISO());

  const product = products.find((p) => p.id === productId);
  const preview = product
    ? proratedValue(
        { id: "preview", productId, qty, discountPct, termYears: 1 },
        products,
        effectiveDate,
        contract.endDate,
      )
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Amend contract
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Amend {contract.customer}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Choose a product…" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="am-qty">Qty</Label>
              <Input id="am-qty" type="number" min={1} className="num" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-disc">Disc %</Label>
              <Input id="am-disc" type="number" min={0} max={100} step="0.5" className="num" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-date">Effective</Label>
              <Input id="am-date" type="date" className="num" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            </div>
          </div>
          <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-xs">
            <p className="num">
              {product ? `${product.name} ×${qty.toLocaleString()} · ${discountPct}% disc` : "Select a product to preview"}
            </p>
            <p className="num mt-1 font-semibold">
              +{fmtMoney(preview)} prorated through {fmtDate(contract.endDate)} (co-term)
            </p>
            <p className="mt-1 text-muted-foreground">
              {product ? `≈ ${fmtMoney(annualValue({ id: "p", productId, qty, discountPct, termYears: 1 }, products))}/yr annualized` : ""}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!product}
            onClick={() => {
              onAmend({ productId, qty, discountPct, effectiveDate, type: "add" });
              setOpen(false);
              setProductId("");
            }}
          >
            Apply amendment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
