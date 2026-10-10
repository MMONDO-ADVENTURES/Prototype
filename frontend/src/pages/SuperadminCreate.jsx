import { useEffect, useState } from "react";
import { api } from "../api";
import DashboardShell from "../components/DashboardShell";

export default function SuperadminCreate() {
  const [allowed, setAllowed] = useState(false);
  const [first, setFirst] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirm_password: "", full_name: "", company_name: "", company_link: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/superadmin/create")
      .then((data) => {
        setAllowed(true);
        setFirst(data.is_first_superadmin);
      })
      .catch(() => setError("This setup page is not available."));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/superadmin/create", { method: "POST", body: form });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!allowed && error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-secondary">{error}</p>
      </div>
    );
  }
  if (!allowed) return <div className="p-12 text-center">Loading…</div>;

  return (
    <DashboardShell subtitle={first ? "Set up the first platform administrator." : "Add another superadmin account."} title={first ? "Create the first superadmin" : "Create superadmin"}>
      {message && <p className="text-tertiary mb-3 font-label-md">{message}</p>}
      {error && <p className="text-error mb-3">{error}</p>}
      <form className="max-w-md bg-white rounded-xl p-6 shadow-sm space-y-3" onSubmit={submit}>
        <input className="w-full px-4 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" required />
        <input className="w-full px-4 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" required type="email" />
        <input className="w-full px-4 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" required type="password" />
        <input className="w-full px-4 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} placeholder="Confirm password" required type="password" />
        <button className="w-full bg-primary text-white py-3 rounded-lg font-label-md" type="submit">Create</button>
      </form>
    </DashboardShell>
  );
}
