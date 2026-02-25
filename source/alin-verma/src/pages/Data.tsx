import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Database schema reference page.
 *
 * Shows interns every table, column, and type in SNOWCONE_DB so they
 * can plan their queries without leaving the app. Delete this file
 * when you start building your dashboard.
 */
export default function DataPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="text-xs text-primary hover:underline font-medium"
        >
          ← Back to Home
        </Link>
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          Database Schema
        </span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Database Schema
          </h1>
          <p className="text-muted-foreground mt-2">
            All tables live in{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              SNOWCONE_DB.SNOWCONE
            </code>
            . The connection is already configured — just use{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              querySnowflake()
            </code>{" "}
            in your code.
          </p>
        </div>

        {/* LOCATIONS */}
        <SchemaTable
          name="LOCATIONS"
          description="15 ice cream stores across Texas."
          columns={[
            ["LOCATION_ID", "INT", "Primary key"],
            ["NAME", "VARCHAR", 'Store name (e.g. "Downtown Flagship")'],
            ["CITY", "VARCHAR", "City (Austin, Dallas, Houston, etc.)"],
            ["STATE", "VARCHAR", "State code (TX)"],
            ["ADDRESS", "VARCHAR", "Street address"],
            ["MANAGER_NAME", "VARCHAR", "Store manager"],
            ["OPEN_DATE", "DATE", "Date the store opened"],
            ["SEATING_CAPACITY", "INT", "Number of seats"],
            ["IS_ACTIVE", "BOOLEAN", "Whether the store is currently active"],
          ]}
        />

        {/* DAILY_SALES */}
        <SchemaTable
          name="DAILY_SALES"
          description="Daily revenue broken down by order type. ~90 days of data (Nov 2025 – Jan 2026)."
          columns={[
            ["SALE_ID", "INT", "Primary key (auto-increment)"],
            ["LOCATION_ID", "INT", "Foreign key → LOCATIONS"],
            ["SALE_DATE", "DATE", "Date of the sales record"],
            ["ORDER_TYPE", "VARCHAR", "'dine-in', 'takeout', or 'delivery'"],
            ["REVENUE", "DECIMAL", "Total revenue for this order type on this day"],
            ["NUM_ORDERS", "INT", "Number of orders"],
            ["AVG_ORDER_VALUE", "DECIMAL", "Average order value"],
          ]}
        />

        {/* CUSTOMER_REVIEWS */}
        <SchemaTable
          name="CUSTOMER_REVIEWS"
          description="Customer ratings and review text per location."
          columns={[
            ["REVIEW_ID", "INT", "Primary key (auto-increment)"],
            ["LOCATION_ID", "INT", "Foreign key → LOCATIONS"],
            ["REVIEW_DATE", "DATE", "Date of the review"],
            ["RATING", "DECIMAL", "1.0 to 5.0"],
            ["REVIEW_TEXT", "VARCHAR", "Review comment"],
            ["CUSTOMER_NAME", "VARCHAR", "Reviewer name"],
          ]}
        />

        {/* INVENTORY */}
        <SchemaTable
          name="INVENTORY"
          description="Weekly inventory records by category per location."
          columns={[
            ["INVENTORY_ID", "INT", "Primary key (auto-increment)"],
            ["LOCATION_ID", "INT", "Foreign key → LOCATIONS"],
            ["RECORD_DATE", "DATE", "Week start date (Mondays)"],
            ["CATEGORY", "VARCHAR", "'dairy', 'produce', 'cones_cups', 'toppings', or 'syrups'"],
            ["UNITS_RECEIVED", "INT", "Units received that week"],
            ["UNITS_USED", "INT", "Units consumed"],
            ["UNITS_WASTED", "INT", "Units wasted/expired"],
            ["WASTE_COST", "DECIMAL", "Dollar cost of waste"],
          ]}
        />

        {/* Example Queries */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Example Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-foreground text-background rounded-md p-4 overflow-x-auto whitespace-pre-wrap">
{`-- Revenue by location
SELECT l.NAME, ROUND(SUM(s.REVENUE), 0) AS TOTAL_REVENUE
FROM DAILY_SALES s JOIN LOCATIONS l ON l.LOCATION_ID = s.LOCATION_ID
GROUP BY l.NAME ORDER BY TOTAL_REVENUE DESC;

-- Average rating per location
SELECT l.NAME, ROUND(AVG(r.RATING), 1) AS AVG_RATING
FROM CUSTOMER_REVIEWS r JOIN LOCATIONS l ON l.LOCATION_ID = r.LOCATION_ID
GROUP BY l.NAME ORDER BY AVG_RATING DESC;

-- Waste by location and category
SELECT l.NAME, i.CATEGORY, SUM(i.UNITS_WASTED) AS TOTAL_WASTE,
       ROUND(SUM(i.WASTE_COST), 2) AS TOTAL_WASTE_COST
FROM INVENTORY i JOIN LOCATIONS l ON l.LOCATION_ID = i.LOCATION_ID
GROUP BY l.NAME, i.CATEGORY ORDER BY TOTAL_WASTE_COST DESC;

-- Daily revenue trend for a specific location
SELECT s.SALE_DATE, SUM(s.REVENUE) AS DAILY_REVENUE
FROM DAILY_SALES s WHERE s.LOCATION_ID = 1
GROUP BY s.SALE_DATE ORDER BY s.SALE_DATE;

-- Revenue breakdown by order type
SELECT ORDER_TYPE, ROUND(SUM(REVENUE), 0) AS TOTAL
FROM DAILY_SALES GROUP BY ORDER_TYPE;`}
            </pre>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        Data Mavericks — The Snowcone Warehouse Challenge
      </footer>
    </div>
  );
}

// ── Helper ──────────────────────────────────────────────────────

function SchemaTable({
  name,
  description,
  columns,
}: {
  name: string;
  description: string;
  columns: [string, string, string][];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-base">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium text-muted-foreground">Column</th>
                <th className="pb-2 font-medium text-muted-foreground">Type</th>
                <th className="pb-2 font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {columns.map(([col, type, desc]) => (
                <tr key={col} className="border-b last:border-0">
                  <td className="py-1.5 font-mono text-xs">{col}</td>
                  <td className="py-1.5 text-muted-foreground text-xs">{type}</td>
                  <td className="py-1.5 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
