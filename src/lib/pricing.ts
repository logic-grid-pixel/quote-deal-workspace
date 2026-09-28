import { differenceInCalendarDays, parseISO } from "date-fns";
import type { ContractLine, HistoricalQuote, Product, Quote, QuoteLine, QuoteMatch, Region, Channel } from "./types";
import { fmtMoney, fmtPct } from "./format";

// ---------- Line pricing ----------

export const lineList = (line: QuoteLine, products: Product[]) => {
  const p = products.find((x) => x.id === line.productId);
  return (p?.unitPrice ?? 0) * line.qty * line.termYears;
};

export const lineNet = (line: QuoteLine, products: Product[]) =>
  lineList(line, products) * (1 - line.discountPct / 100);

export const quoteTotals = (lines: QuoteLine[], products: Product[]) => {
  const list = lines.reduce((s, l) => s + lineList(l, products), 0);
  const net = lines.reduce((s, l) => s + lineNet(l, products), 0);
  return { list, net, blendedDiscount: list > 0 ? (1 - net / list) * 100 : 0 };
};

export const annualValue = (line: QuoteLine, products: Product[]) => {
  const p = products.find((x) => x.id === line.productId);
  return (p?.unitPrice ?? 0) * line.qty * (1 - line.discountPct / 100);
};

export const contractArr = (lines: ContractLine[], products: Product[]) =>
  lines.filter((l) => l.source === "original" || l.source === "amendment").reduce((s, l) => s + annualValue(l, products), 0);

export const contractTcv = (lines: ContractLine[], products: Product[]) =>
  lines.reduce((s, l) => s + proratedValue(l, products, l.startDate, l.endDate), 0);

// ---------- Proration ----------

export function daysBetween(startISO: string, endISO: string) {
  return Math.max(0, differenceInCalendarDays(parseISO(endISO), parseISO(startISO)) + 1);
}

export function proratedValue(
  line: QuoteLine,
  products: Product[],
  startDate: string,
  endDate: string,
) {
  const days = daysBetween(startDate, endDate);
  return (annualValue(line, products) / 365) * days;
}

// ---------- Approval ladder (mock policy) ----------

export type ApprovalLevel = {
  required: string[];
  label: string;
  tone: "success" | "warning" | "destructive";
  likelihood: number;
  avgHours: number;
  similarDeals: number;
};

export const computeApproval = (discount: number): ApprovalLevel => {
  if (discount <= 10)
    return { required: ["Auto"], label: "No approval required", tone: "success", likelihood: 100, avgHours: 0, similarDeals: 312 };
  if (discount <= 18)
    return { required: ["Manager"], label: "Manager approval", tone: "success", likelihood: 94, avgHours: 0.1, similarDeals: 128 };
  if (discount <= 25)
    return { required: ["VP Sales", "Deal Desk"], label: "VP Sales + Deal Desk", tone: "warning", likelihood: 82, avgHours: 0.25, similarDeals: 47 };
  if (discount <= 35)
    return { required: ["VP Sales", "Deal Desk", "CFO"], label: "VP Sales + Deal Desk + CFO", tone: "destructive", likelihood: 48, avgHours: 1.5, similarDeals: 14 };
  return { required: ["VP Sales", "Deal Desk", "CFO"], label: "Executive escalation", tone: "destructive", likelihood: 22, avgHours: 4, similarDeals: 4 };
};

// ---------- Comps matching ----------

const channelAffinity: Record<Channel, Record<Channel, number>> = {
  Direct: { Direct: 1, Reseller: 0.6, Distributor: 0.5, OEM: 0.4 },
  Reseller: { Direct: 0.6, Reseller: 1, Distributor: 0.7, OEM: 0.5 },
  Distributor: { Direct: 0.5, Reseller: 0.7, Distributor: 1, OEM: 0.5 },
  OEM: { Direct: 0.4, Reseller: 0.5, Distributor: 0.5, OEM: 1 },
};

export function matchQuote(quote: Quote, hist: HistoricalQuote): QuoteMatch {
  const reasons: string[] = [];
  const quoteSkus = new Set(quote.lines.map((l) => products_of(quote).get(l.productId) ?? l.productId));
  void quoteSkus;

  const histSkus = new Set(hist.lines.map((l) => l.productId));
  const quoteLineSkus = new Set(quote.lines.map((l) => l.productId));
  const overlap = [...quoteLineSkus].filter((s) => histSkus.has(s)).length;
  const union = new Set([...quoteLineSkus, ...histSkus]).size || 1;
  let score = (overlap / union) * 55;

  if (overlap > 0) {
    reasons.push(
      overlap === quoteLineSkus.size && overlap === hist.lines.length
        ? `Identical ${overlap}-SKU bundle`
        : `${overlap} of ${quoteLineSkus.size} SKUs match`,
    );
  } else {
    reasons.push("No SKU overlap");
  }

  // Discount proximity on the shared primary SKU
  const shared = quote.lines.filter((l) => histSkus.has(l.productId));
  if (shared.length) {
    const avgDelta =
      shared.reduce((s, ql) => {
        const hl = hist.lines.find((h) => h.productId === ql.productId)!;
        return s + Math.abs(ql.discountPct - hl.discountPct);
      }, 0) / shared.length;
    score += Math.max(0, 20 - avgDelta * 2.5);
    if (avgDelta <= 2) reasons.push(`Discount stack within ${fmtPct(avgDelta, 0)} of proposed`);
    else reasons.push(`Discounts differ by ~${fmtPct(avgDelta, 0)} pts`);
  }

  const termDelta = Math.abs(quote.termYears * 12 - hist.termMonths);
  score += Math.max(0, 10 - termDelta * 0.4);
  if (termDelta <= 3) reasons.push(`Same ${hist.termMonths}-month term`);

  score += quote.region === hist.region ? 8 : 2;
  reasons.push(
    quote.region === hist.region ? `Same region (${hist.region})` : `Different region (${hist.region})`,
  );

  score += channelAffinity[quote.channel][hist.channel] * 7;
  if (quote.channel === hist.channel) reasons.push(`Same channel (${hist.channel})`);

  return {
    ...hist,
    matchPct: Math.max(5, Math.min(99, Math.round(score))),
    reasons,
  };
}

const products_of = (_q: Quote) => new Map<string, string>();

export function rankComps(quote: Quote, historical: HistoricalQuote[]): QuoteMatch[] {
  return historical
    .map((h) => matchQuote(quote, h))
    .sort((a, b) => b.matchPct - a.matchPct);
}

export function compsSummary(quote: Quote, matches: QuoteMatch[], products: Product[]) {
  const top = matches.filter((m) => m.matchPct >= 60);
  const { blendedDiscount } = quoteTotals(quote.lines, products);
  if (!top.length) {
    return {
      headline: "No close precedents in the last 6 months — expect heavier deal desk scrutiny.",
      bullets: [] as string[],
      recommendation: "Consider anchoring to a broader bundle or reducing discount depth.",
    };
  }
  const discounts = top.flatMap((m) => m.lines.map((l) => l.discountPct));
  const median = discounts.sort((a, b) => a - b)[Math.floor(discounts.length / 2)];
  const primary = quote.lines[0] ? products.find((p) => p.id === quote.lines[0].productId) : undefined;
  const best = top[0];
  return {
    headline: `${top.length} recent approval${top.length > 1 ? "s" : ""} match this shape: ${
      primary?.name ?? "core platform"
    }-led bundles close around a ${fmtPct(median, 0)} median discount on a ${best.termMonths}-month term.`,
    bullets: [
      `Median approved discount across matches: ${fmtPct(median, 0)} (you proposed ${fmtPct(blendedDiscount, 0)} blended).`,
      `Closest precedent: ${best.id} · ${best.customer} — ${best.matchPct}% match, approved ${new Date(best.approvedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} by ${best.approvedBy.split("—")[0].trim()}.`,
      `${top.filter((m) => m.region === quote.region).length} of ${top.length} matches are in ${quote.region}; channel profile is ${quote.channel}.`,
    ],
    recommendation:
      blendedDiscount <= median + 2
        ? "Within the approved band for similar deals — approval should be routine."
        : "Above the historical band — attach precedent evidence or stage the discount.",
  };
}

export const fmtMatchValue = (m: QuoteMatch, products: Product[]) =>
  fmtMoney(m.lines.reduce((s, l) => s + lineNet(l, products), 0));

export const regionLabel: Record<Region, string> = {
  NA: "North America",
  EMEA: "EMEA",
  APAC: "APAC",
  LATAM: "LATAM",
};
