import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ContractStatus, QuoteStatus } from "@/lib/types";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        draft: "bg-secondary text-secondary-foreground",
        progress: "bg-accent text-accent-foreground",
        success: "bg-success/15 text-success",
        destructive: "bg-destructive/12 text-destructive",
        outline: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const QUOTE_TONE: Record<QuoteStatus, NonNullable<VariantProps<typeof badge>["tone"]>> = {
  draft: "draft",
  submitted: "progress",
  changes_requested: "destructive",
  approved: "success",
  rejected: "destructive",
  converted: "success",
};

const QUOTE_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Contracted",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <span className={badge({ tone: QUOTE_TONE[status] })}>{QUOTE_LABEL[status]}</span>;
}

const CONTRACT_TONE: Record<ContractStatus, NonNullable<VariantProps<typeof badge>["tone"]>> = {
  Active: "success",
  Expiring: "progress",
  Expired: "neutral",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return <span className={badge({ tone: CONTRACT_TONE[status] })}>{status}</span>;
}

export function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={badge({
        tone: tier === "Platinum" ? "success" : tier === "Gold" ? "progress" : "outline",
      })}
    >
      {tier}
    </span>
  );
}

export { badge };
