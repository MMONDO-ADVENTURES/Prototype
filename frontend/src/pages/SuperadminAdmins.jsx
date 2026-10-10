import { useEffect, useState } from "react";
import { api } from "../api";
import DashboardShell from "../components/DashboardShell";

export default function SuperadminAdmins() {
  const [operators, setOperators] = useState([]);
  const [search, setSearch] = useState("");

  async function load(query = "") {
    const data = await api(`/superadmin/operators${query ? `?search=${encodeURIComponent(query)}` : ""}`);
    setOperators(data.operators || data.admins || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    await api(`/superadmin/operators/${id}/delete`, { method: "POST" });
    await load(search);
  }

  return (
    <DashboardShell subtitle="Search and deactivate tour operators." title="Operators">
      <form className="mb-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); load(search); }}>
        <input className="flex-1 px-4 py-2 bg-white rounded-lg" onChange={(e) => setSearch(e.target.value)} placeholder="Search operators" value={search} />
        <button className="bg-primary text-white px-4 rounded-lg font-label-md" type="submit">Search</button>
      </form>
      <div className="space-y-3">
        {operators.map((operator) => (
          <div className="bg-white rounded-xl p-4 flex justify-between shadow-sm" key={operator.id}>
            <div>
              <p className="font-label-md">{operator.full_name}</p>
              <p className="text-sm text-secondary">{operator.email} · {operator.company_name || "No company"}</p>
            </div>
            {!operator.is_superadmin && (
              <button className="border border-outline px-3 py-1 rounded-lg font-label-md" onClick={() => remove(operator.id)} type="button">Deactivate</button>
            )}
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
