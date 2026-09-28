export type Region = "NA" | "EMEA" | "APAC" | "LATAM";
export type Channel = "Direct" | "Reseller" | "Distributor" | "OEM";
export type PartnerTier = "Platinum" | "Gold" | "Silver";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  unitPrice: number; // per unit per year
}

export interface Partner {
  id: string;
  name: string;
  tier: PartnerTier;
  accountOwner: string;
  region: Region;
}

export interface QuoteLine {
  id: string;
  productId: string;
  qty: number;
  discountPct: number;
  termYears: number;
  source?: "manual" | "bundle" | "renewal" | "original" | "amendment" | undefined;
}

export type QuoteStatus =
  | "draft"
  | "submitted"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "converted";

export interface AuditEntry {
  id: string;
  ts: number;
  actor: "Seller" | "Copilot" | "Deal Desk" | "System";
  action: string;
  detail?: string | undefined;
}

export interface Intake {
  customer: string;
  industry: string;
  seats: number;
  termYears: number;
  region: Region;
  channel: Channel;
  partnerId?: string | undefined;
  productsOfInterest: string;
  emailSnippet: string;
}

export interface Quote {
  id: string;
  number: string;
  customer: string;
  industry: string;
  region: Region;
  channel: Channel;
  partnerId?: string | undefined;
  seats: number;
  termYears: number;
  owner: string;
  createdAt: number;
  status: QuoteStatus;
  lines: QuoteLine[];
  narrative?: string | undefined;
  internalNote?: string | undefined;
  audit: AuditEntry[];
  submittedAt?: number | undefined;
  decidedAt?: number | undefined;
}

export type AmendmentType = "add" | "remove" | "change" | "coterm" | "renewal";

export interface Amendment {
  id: string;
  date: string; // ISO effective date
  type: AmendmentType;
  description: string;
  deltaValue: number; // prorated dollar delta vs prior state
  author: string;
}

export interface ContractLine extends QuoteLine {
  startDate: string; // ISO
  endDate: string; // ISO
  source: "original" | "amendment";
}

export type ContractStatus = "Active" | "Expiring" | "Expired";

export interface Contract {
  id: string;
  number: string;
  quoteId?: string | undefined;
  customer: string;
  partnerId?: string | undefined;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  autoRenew: boolean;
  lines: ContractLine[];
  amendments: Amendment[];
  notes?: string | undefined;
}

export interface HistoricalQuote {
  id: string;
  customer: string;
  region: Region;
  channel: Channel;
  termMonths: number;
  approvedBy: string;
  approvedDate: string; // ISO
  lines: QuoteLine[];
  rationale: string[];
}

export interface QuoteMatch extends HistoricalQuote {
  matchPct: number;
  reasons: string[];
}
