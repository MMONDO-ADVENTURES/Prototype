import { useEffect, useState } from "react";
import { api } from "../api";
import DashboardShell from "../components/DashboardShell";

export default function SuperadminList() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/superadmin/list").then(setData);
  }, []);

  if (!data) return <DashboardShell title="Superadmins"><p>Loading…</p></DashboardShell>;

  return (
    <DashboardShell subtitle={`${data.total_superadmins} accounts with platform access.`} title="Superadmins">
      <div className="space-y-3">
        {data.superadmins?.map((admin) => (
          <div className="bg-white rounded-xl p-4 shadow-sm" key={admin.id}>
            <p className="font-label-md">{admin.full_name}</p>
            <p className="text-sm text-secondary">{admin.email}</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
