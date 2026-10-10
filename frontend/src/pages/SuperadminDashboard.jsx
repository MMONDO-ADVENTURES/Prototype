import { useEffect, useState } from "react";
import { api } from "../api";
import DashboardShell from "../components/DashboardShell";

export default function SuperadminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/superadmin/dashboard").then(setData);
  }, []);

  if (!data) return <DashboardShell title="Superadmin dashboard"><p>Loading…</p></DashboardShell>;
  const stats = data.stats || {};

  return (
    <DashboardShell subtitle="Platform-wide bookings, operators, and revenue." title="Superadmin dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {Object.entries(stats).map(([key, value]) => (
          <div className="bg-white rounded-xl p-5 shadow-sm" key={key}>
            <p className="font-label-md text-label-md text-secondary uppercase tracking-wider">{key.replaceAll("_", " ")}</p>
            <p className="font-headline-sm text-[28px] text-ink mt-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
          </div>
        ))}
      </div>
      <h2 className="font-headline-sm text-headline-sm mb-3">Recent bookings</h2>
      <div className="space-y-3">
        {data.recent_bookings?.map((booking) => (
          <div className="bg-white rounded-xl p-4 shadow-sm" key={booking.id}>
            {booking.tour?.title} · {booking.user?.full_name} · ${booking.total_price}
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
