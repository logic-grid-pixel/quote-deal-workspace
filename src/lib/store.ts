import { create } from "zustand";
import type {
  Amendment,
  AuditEntry,
  Contract,
  Intake,
  Partner,
  Product,
  Quote,
  QuoteLine,
  QuoteStatus,
} from "./types";
import { HISTORICAL_QUOTES, INITIAL_CONTRACTS, INITIAL_QUOTES, PARTNERS, PRODUCTS } from "./seed";
import { addYearsISO, daysUntil, todayISO } from "./format";
import { annualValue, quoteTotals } from "./pricing";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const log = (audit: AuditEntry[], e: Omit<AuditEntry, "id" | "ts">): AuditEntry[] => [
  ...audit,
  { ...e, id: uid(), ts: Date.now() },
];

function contractStatus(endDate: string): Contract["status"] {
  const days = daysUntil(endDate);
  if (days < 0) return "Expired";
  if (days <= 90) return "Expiring";
  return "Active";
}

interface State {
  products: Product[];
  partners: Partner[];
  quotes: Quote[];
  contracts: Contract[];

  createQuoteFromIntake: (intake: Intake) => string;
  addLines: (quoteId: string, lines: Omit<QuoteLine, "id">[]) => void;
  addLine: (quoteId: string, line: Omit<QuoteLine, "id">) => void;
  updateLine: (quoteId: string, lineId: string, patch: Partial<QuoteLine>) => void;
  removeLine: (quoteId: string, lineId: string) => void;
  setQuoteStatus: (quoteId: string, status: QuoteStatus, detail?: string) => void;
  submitQuote: (quoteId: string) => void;
  convertQuote: (quoteId: string) => void;
  createRenewalQuote: (contractId: string) => string;

  toggleAutoRenew: (contractId: string) => void;
  addAmendment: (
    contractId: string,
    input: { productId: string; qty: number; discountPct: number; effectiveDate: string; type: Amendment["type"] },
  ) => void;
}

function nextQuoteNumber(quotes: Quote[]) {
  const year = new Date().getFullYear();
  const nums = quotes.map((q) => Number(q.number.split("-")[2]) || 0);
  return `Q-${year}-${String(Math.max(800, ...nums) + 1).padStart(4, "0")}`;
}

export const useDealStore = create<State>((set, get) => ({
  products: PRODUCTS,
  partners: PARTNERS,
  quotes: INITIAL_QUOTES,
  contracts: INITIAL_CONTRACTS,

  createQuoteFromIntake: (intake) => {
    const id = uid();
    const number = nextQuoteNumber(get().quotes);
    const quote: Quote = {
      id,
      number,
      customer: intake.customer || "Untitled prospect",
      industry: intake.industry,
      region: intake.region,
      channel: intake.channel,
      partnerId: intake.partnerId,
      seats: intake.seats,
      termYears: intake.termYears,
      owner: "Alex Chen",
      createdAt: Date.now(),
      status: "draft",
      lines: [],
      audit: [
        {
          id: uid(),
          ts: Date.now(),
          actor: "Seller",
          action: "Quote created from intake",
          detail: `${intake.seats.toLocaleString()} seats · ${intake.termYears}yr · ${intake.region} · ${intake.channel}`,
        },
      ],
    };
    set({ quotes: [quote, ...get().quotes] });
    return id;
  },

  addLines: (quoteId, lines) =>
    set({
      quotes: get().quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              lines: [...q.lines, ...lines.map((l) => ({ ...l, id: uid() }))],
              audit: log(q.audit, {
                actor: "Copilot",
                action: `Added ${lines.length} line item${lines.length > 1 ? "s" : ""}`,
                detail: lines.map((l) => get().products.find((p) => p.id === l.productId)?.sku).join(", "),
              }),
            }
          : q,
      ),
    }),

  addLine: (quoteId, line) => get().addLines(quoteId, [line]),

  updateLine: (quoteId, lineId, patch) =>
    set({
      quotes: get().quotes.map((q) =>
        q.id === quoteId
          ? { ...q, lines: q.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) }
          : q,
      ),
    }),

  removeLine: (quoteId, lineId) =>
    set({
      quotes: get().quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              lines: q.lines.filter((l) => l.id !== lineId),
              audit: log(q.audit, { actor: "Seller", action: "Removed line item" }),
            }
          : q,
      ),
    }),

  setQuoteStatus: (quoteId, status, detail) =>
    set({
      quotes: get().quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              status,
              submittedAt: status === "submitted" ? Date.now() : q.submittedAt,
              decidedAt:
                status === "approved" || status === "rejected" || status === "changes_requested"
                  ? Date.now()
                  : q.decidedAt,
              audit: log(q.audit, { actor: "Deal Desk", action: `Status → ${status}`, detail }),
            }
          : q,
      ),
    }),

  submitQuote: (quoteId) => {
    const q = get().quotes.find((x) => x.id === quoteId);
    if (!q) return;
    const { blendedDiscount } = quoteTotals(q.lines, get().products);
    get().setQuoteStatus(quoteId, "submitted", `Blended discount ${blendedDiscount.toFixed(1)}%`);
  },

  convertQuote: (quoteId) => {
    const q = get().quotes.find((x) => x.id === quoteId);
    if (!q) return;
    const start = todayISO();
    const end = addYearsISO(start, q.termYears);
    const contract: Contract = {
      id: uid(),
      number: `MSA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      quoteId: q.number,
      customer: q.customer,
      partnerId: q.partnerId,
      startDate: start,
      endDate: end,
      status: "Active",
      autoRenew: true,
      lines: q.lines.map((l) => ({
        ...l,
        startDate: start,
        endDate: end,
        source: "original" as const,
      })),
      amendments: [],
      notes: `Converted from quote ${q.number}.`,
    };
    set({
      contracts: [contract, ...get().contracts],
      quotes: get().quotes.map((x) =>
        x.id === quoteId
          ? {
              ...x,
              status: "converted",
              audit: log(x.audit, { actor: "System", action: `Converted to contract ${contract.number}` }),
            }
          : x,
      ),
    });
  },

  createRenewalQuote: (contractId) => {
    const c = get().contracts.find((x) => x.id === contractId);
    if (!c) return "";
    const id = uid();
    const number = nextQuoteNumber(get().quotes);
    const termYears = 3;
    const quote: Quote = {
      id,
      number,
      customer: c.customer,
      industry: "Renewal",
      region: "NA",
      channel: "Direct",
      partnerId: c.partnerId,
      seats: c.lines.reduce((s, l) => s + l.qty, 0),
      termYears,
      owner: "Alex Chen",
      createdAt: Date.now(),
      status: "draft",
      lines: c.lines.map((l) => ({
        id: uid(),
        productId: l.productId,
        qty: l.qty,
        discountPct: l.discountPct,
        termYears,
        source: "renewal" as const,
      })),
      audit: [
        {
          id: uid(),
          ts: Date.now(),
          actor: "Seller",
          action: "Renewal quote drafted",
          detail: `Pre-filled from contract ${c.number}`,
        },
      ],
    };
    set({ quotes: [quote, ...get().quotes] });
    return id;
  },

  toggleAutoRenew: (contractId) =>
    set({
      contracts: get().contracts.map((c) =>
        c.id === contractId ? { ...c, autoRenew: !c.autoRenew } : c,
      ),
    }),

  addAmendment: (contractId, input) => {
    const { products } = get();
    set({
      contracts: get().contracts.map((c) => {
        if (c.id !== contractId) return c;
        const product = products.find((p) => p.id === input.productId);
        if (!product) return c;
        const line: Contract["lines"][number] = {
          id: uid(),
          productId: input.productId,
          qty: input.qty,
          discountPct: input.discountPct,
          termYears: 1,
          startDate: input.effectiveDate,
          endDate: c.endDate,
          source: "amendment",
        };
        const months =
          (new Date(c.endDate).getTime() - new Date(input.effectiveDate).getTime()) /
          (86_400_000 * 30.44);
        const delta = annualValue(line, products) * (months / 12);
        const amendment: Amendment = {
          id: uid(),
          date: input.effectiveDate,
          type: input.type,
          description: `Added ${input.qty.toLocaleString()} ${product.name} ${product.unit}${input.qty > 1 ? "s" : ""} at ${input.discountPct}% discount, co-termed to ${c.endDate}.`,
          deltaValue: delta,
          author: "Maya Chen",
        };
        return {
          ...c,
          lines: [...c.lines, line],
          amendments: [...c.amendments, amendment],
          status: contractStatus(c.endDate),
        };
      }),
    });
  },
}));
