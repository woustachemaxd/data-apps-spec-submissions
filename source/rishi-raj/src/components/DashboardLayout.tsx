import { Link, NavLink, Outlet } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex">
      <aside className="w-60 border-r bg-[var(--sidebar)]/95 text-[var(--sidebar-foreground)] flex flex-col backdrop-blur-sm">
        <div className="px-4 py-4 border-b">
          <Link to="/" className="text-xs tracking-widest uppercase font-semibold">
            Snowcone Warehouse
          </Link>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <SidebarLink to="/" label="Overview" />
          <SidebarLink to="/by-location" label="By Location" />
        </nav>
        <div className="px-4 py-3 border-t text-[0.7rem] text-muted-foreground">
          <Link
            to="/data"
            className="underline hover:text-foreground"
          >
            View database schema
          </Link>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="border-b px-6 py-3 flex items-center justify-between bg-background/80 backdrop-blur">
          <div className="flex flex-col">
            <span className="text-xs tracking-widest text-muted-foreground uppercase">
              The Snowcone Warehouse
            </span>
            <span className="text-sm font-medium">Operations Dashboard</span>
          </div>
          <ThemeToggle />
        </header>
        <section className="flex-1 px-6 py-6">
          <div className="max-w-6xl mx-auto space-y-4">
            <Card className="border-border/60 shadow-sm p-0 bg-card/80 backdrop-blur-sm">
              <Outlet />
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
            : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

