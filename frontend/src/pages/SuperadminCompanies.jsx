import { useEffect, useState } from "react";
import { api } from "../api";
import DashboardShell from "../components/DashboardShell";

export default function SuperadminCompanies() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    api("/superadmin/companies").then((data) => setCompanies(data.companies || []));
  }, []);

  return (
    <DashboardShell subtitle="Registered operator companies on the platform." title="Tour companies">
      <div className="space-y-3">
        {companies.map((company) => (
          <div className="bg-white rounded-xl p-4 shadow-sm" key={company.id}>
            <p className="font-label-md">{company.company_name}</p>
            <p className="text-sm text-secondary">{company.full_name} · {company.email}</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
