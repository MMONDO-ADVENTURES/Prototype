import { useEffect, useState } from "react";
import { api } from "../api";
import DashboardShell from "../components/DashboardShell";

export default function SuperadminBookings() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    api(`/superadmin/bookings?status_filter=${status}`).then((data) => setBookings(data.bookings || []));
  }, [status]);

  return (
    <DashboardShell subtitle="Filter every booking across operators." title="All bookings">
      <select className="bg-white rounded-lg px-3 py-2 mb-6" onChange={(e) => setStatus(e.target.value)} value={status}>
        {["all", "completed", "pending", "cancelled"].map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div className="bg-white rounded-xl p-4 shadow-sm" key={booking.id}>
            #{booking.id} · {booking.tour?.title} · {booking.user?.full_name} · {booking.payment_status} · ${booking.total_price}
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
