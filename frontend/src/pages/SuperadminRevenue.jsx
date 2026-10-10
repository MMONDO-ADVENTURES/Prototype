import { useEffect, useState } from "react";
import { api } from "../api";
import DashboardShell from "../components/DashboardShell";

export default function SuperadminRevenue() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/superadmin/revenue").then(setData);
  }, []);

  if (!data) return <DashboardShell title="Revenue"><p>Loading…</p></DashboardShell>;

  return (
    <DashboardShell subtitle="Completed payments grouped by month and tour." title="Revenue">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-headline-sm text-headline-sm mb-4">By month</h2>
          <div className="space-y-2">
            {data.revenue_by_month?.map((row) => (
              <div className="flex justify-between border-b border-surface-container py-2" key={`${row.year}-${row.month}`}>
                <span>{row.month}/{row.year}</span>
                <span className="font-data-mono">${row.revenue.toFixed(0)} · {row.bookings} bookings</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-headline-sm text-headline-sm mb-4">By tour</h2>
          <div className="space-y-2">
            {data.revenue_by_tour?.map((row) => (
              <div className="flex justify-between border-b border-surface-container py-2" key={row.title}>
                <span>{row.title}</span>
                <span className="font-data-mono">${row.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
