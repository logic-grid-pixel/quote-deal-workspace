export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return fmtMoney(n);
};

export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const fmtInt = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const fmtDate = (d: string | number) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export const fmtDateTime = (d: string | number) =>
  new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function addYearsISO(iso: string, years: number) {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
}
