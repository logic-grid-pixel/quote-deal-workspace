import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useDealStore } from "@/lib/store";
import type { Channel, Intake, Region } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/quotes/new")({
  component: IntakePage,
  head: () => ({
    meta: [
      { title: "New Quote — Deal Workspace" },
      { name: "description", content: "Intake a new deal: customer profile, term, region, and partner of record." },
      { property: "og:title", content: "New Quote — Deal Workspace" },
      { property: "og:description", content: "Intake a new deal in under a minute." },
    ],
  }),
});

const EMPTY: Intake = {
  customer: "",
  industry: "",
  seats: 500,
  termYears: 3,
  region: "NA",
  channel: "Direct",
  partnerId: undefined,
  productsOfInterest: "",
  emailSnippet: "",
};

function IntakePage() {
  const navigate = useNavigate();
  const { partners, createQuoteFromIntake } = useDealStore();
  const [intake, setIntake] = useState<Intake>(EMPTY);
  const patch = (p: Partial<Intake>) => setIntake((i) => ({ ...i, ...p }));

  const loadSample = () =>
    setIntake({
      customer: "Acme FinServ",
      industry: "Financial Services",
      seats: 8500,
      termYears: 3,
      region: "EMEA",
      channel: "Direct",
      partnerId: "p-helix",
      productsOfInterest: "XDR, XSIAM, IR retainer",
      emailSnippet:
        "Following our QBR, Acme FinServ needs to consolidate endpoint + SOC tooling across 8,500 seats in the EU. 3-year term, EU data residency, Net 60. Target landed discount is 22%.",
    });

  const submit = () => {
    if (!intake.customer.trim()) return;
    const id = createQuoteFromIntake(intake);
    navigate({ to: "/quotes/$quoteId", params: { quoteId: id } });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
      <p className="num text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Intake</p>
      <h1 className="mt-1 font-display text-4xl">Start a new quote</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Capture the deal shape once — the builder and comps panel pick it up from here.
      </p>

      <div className="mt-8 space-y-5 rounded-lg border border-border bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="customer">Customer</Label>
            <Input
              id="customer"
              placeholder="e.g. Acme FinServ"
              value={intake.customer}
              onChange={(e) => patch({ customer: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. Financial Services"
              value={intake.industry}
              onChange={(e) => patch({ industry: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seats">Seats</Label>
            <Input
              id="seats"
              type="number"
              min={1}
              value={intake.seats || ""}
              onChange={(e) => patch({ seats: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Term</Label>
            <Select value={String(intake.termYears)} onValueChange={(v) => patch({ termYears: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Region</Label>
            <Select value={intake.region} onValueChange={(v) => patch({ region: v as Region })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["NA", "EMEA", "APAC", "LATAM"].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={intake.channel} onValueChange={(v) => patch({ channel: v as Channel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Direct", "Reseller", "Distributor", "OEM"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Partner of record</Label>
            <Select
              value={intake.partnerId ?? "none"}
              onValueChange={(v) => patch({ partnerId: v === "none" ? undefined : v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (direct)</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} · {p.tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="poi">Products of interest</Label>
            <Input
              id="poi"
              placeholder="e.g. XDR, XSIAM, IR retainer"
              value={intake.productsOfInterest}
              onChange={(e) => patch({ productsOfInterest: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="snippet">Email snippet <span className="text-muted-foreground">(optional — the copilot reads it)</span></Label>
            <Textarea
              id="snippet"
              rows={4}
              placeholder="Paste the customer's ask…"
              value={intake.emailSnippet}
              onChange={(e) => patch({ emailSnippet: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="ghost" size="sm" onClick={loadSample}>
            <Sparkles className="h-4 w-4" /> Load sample intake
          </Button>
          <Button onClick={submit} disabled={!intake.customer.trim()}>
            Build the quote
          </Button>
        </div>
      </div>
    </div>
  );
}
