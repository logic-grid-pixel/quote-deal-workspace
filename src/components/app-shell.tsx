import { Link } from "@tanstack/react-router";
import {
  FileSignature,
  FilePlus2,
  Handshake,
  LayoutDashboard,
  ScrollText,
  Stamp,
} from "lucide-react";
import type { ReactNode } from "react";
import { useDealStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  {
    section: "Workspace",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    section: "Quoting",
    items: [
      { to: "/quotes/new", label: "New quote", icon: FilePlus2 },
      { to: "/quotes", label: "Quotes", icon: ScrollText },
      { to: "/approvals", label: "Approvals", icon: Stamp, badge: "approvals" as const },
    ],
  },
  {
    section: "Contracts",
    items: [
      { to: "/contracts", label: "Contracts", icon: FileSignature },
      { to: "/partners", label: "Partners", icon: Handshake },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pending = useDealStore((s) => s.quotes.filter((q) => q.status === "submitted").length);

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <div>
          <Link to="/" className="block">
            <p className="num text-[10px] uppercase tracking-[0.25em] text-sidebar-primary-foreground/70 opacity-80">
              Palo Alto Networks · vision demo
            </p>
            <h1 className="mt-1 font-display text-[26px] leading-tight text-sidebar-foreground">
              Deal Workspace
            </h1>
          </Link>
          <nav className="mt-8 space-y-6">
            {NAV.map((group) => (
              <div key={group.section}>
                <p className="num px-2 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
                  {group.section}
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      activeOptions={item.to === "/" ? { exact: true } : undefined}
                      className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeProps={{
                        className:
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                      }}
                    >
                      <item.icon className="h-4 w-4 opacity-70" />
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge === "approvals" && pending > 0 && (
                        <span className="num rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground">
                          {pending}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2.5 border-t border-sidebar-border pt-4">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-accent font-display text-sm text-sidebar-accent-foreground">
            AC
          </div>
          <div className="text-xs leading-tight">
            <p className="font-medium text-sidebar-foreground">Alex Chen</p>
            <p className="text-sidebar-foreground/60">Deal Desk Analyst</p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="font-display text-xl">Deal Workspace</Link>
        <nav className="flex items-center gap-1 text-xs">
          {NAV.flatMap((g) => g.items).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={item.to === "/" ? { exact: true } : undefined}
              className={cn(
                "rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
