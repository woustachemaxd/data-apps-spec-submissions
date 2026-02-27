import { Link } from "react-router-dom";
import ThemeToggle from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          The Snowcone Warehouse — Starter
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-muted-foreground mt-2">Choose a dashboard to open.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scorecard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Overview of all locations.</p>
              <div className="mt-4">
                <Link to="/scorecard" className="rounded border px-3 py-1 text-sm">Open Scorecard →</Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Historical sales and order-type breakdowns.</p>
              <div className="mt-4">
                <Link to="/sales" className="rounded border px-3 py-1 text-sm">Open Sales →</Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waste</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Inventory waste tracking by category.</p>
              <div className="mt-4">
                <Link to="/waste" className="rounded border px-3 py-1 text-sm">Open Waste →</Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="mb-2">Brief overview of what each dashboard provides:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Scorecard:</strong> sortable table of locations with 30-day revenue, avg rating, trend flags, and quick links to drill into a location.</li>
                <li><strong>Sales:</strong> historical revenue charts with order-type breakdowns (dine-in, takeout, delivery), grouping, moving-average smoothing, and multi-location comparison.</li>
                <li><strong>Waste:</strong> inventory waste by category and location, period grouping, summary by location, and threshold flags for follow-up.</li>
                <li><strong>Location drill-down:</strong> per-location sales & waste time series, recent reviews, inventory rows, CSV export, compare overlay, smoothing toggle, quick insights, and snapshot/email demo.</li>
                <li><strong>UX & tooling:</strong> dark mode toggle (top-right), accessible controls, CSV export for charts and tables, and responsive layout for most views.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        Data Mavericks — The Snowcone Warehouse Challenge
      </footer>
    </div>
  );
}
