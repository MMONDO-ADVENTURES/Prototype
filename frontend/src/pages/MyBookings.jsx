import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import {
  CANCELLATION_NOTICE_DAYS,
  Icon,
  canCancelBooking,
  canEditBooking,
  lastFreeChangeDate,
  parseTourDate,
  startOfDay,
  tourEndDate,
} from "../utils";

function categoryFor(booking, now) {
  const status = (booking.payment_status || "pending").toLowerCase();
  if (status === "cancelled") return "cancelled";
  const start = parseTourDate(booking.tour_date);
  if (!start) return "upcoming";
  const end = tourEndDate(start, booking.tour?.duration) || start;
  const today = startOfDay(now);
  if (!today) return "upcoming";
  return end >= today ? "upcoming" : "past";
}

function companionSlots(adults, kids, existing) {
  const extraAdults = Math.max(0, Number(adults || 1) - 1);
  const childCount = Math.max(0, Number(kids || 0));
  const slots = [
    ...Array.from({ length: extraAdults }, () => ({ full_name: "", role: "adult", details: "" })),
    ...Array.from({ length: childCount }, () => ({ full_name: "", role: "child", details: "" })),
  ];
  (existing || []).forEach((item, index) => {
    if (!slots[index]) return;
    slots[index] = {
      ...slots[index],
      full_name: item.full_name || "",
      details: item.details || "",
    };
  });
  return slots;
}

function isoInputDate(value) {
  const date = parseTourDate(value);
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formFromBooking(booking) {
  const adults = Number(booking.adults || 1);
  const kids = Number(booking.kids || 0);
  const companions = companionSlots(adults, kids, booking.companions);
  return {
    tour_date: isoInputDate(booking.tour_date),
    adults,
    kids,
    special_requirements: booking.special_requirements || "",
    add_companions: companions.length > 0 && companions.some((person) => person.full_name),
    companions,
  };
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(new Date());
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [tab, setTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await api("/bookings/mine");
    setBookings(data.bookings || []);
    setNow(new Date());
  }

  useEffect(() => {
    load().catch(() => setBookings([]));
  }, []);

  const rows = useMemo(
    () => bookings.map((booking) => ({ booking, category: categoryFor(booking, now) })),
    [bookings, now]
  );
  const counts = {
    upcoming: rows.filter((row) => row.category === "upcoming").length,
    past: rows.filter((row) => row.category === "past").length,
    cancelled: rows.filter((row) => row.category === "cancelled").length,
  };
  const visible = rows.filter((row) => {
    if (row.category !== tab) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const haystack = `${row.booking.tour?.title || ""} ${row.booking.tour?.destinations || row.booking.tour?.locations || ""} bk-${String(row.booking.id).padStart(4, "0")}`.toLowerCase();
    return haystack.includes(term);
  });

  function note(text, isError = false) {
    setMessage(text);
    setMessageError(isError);
  }

  function clearNote() {
    setMessage("");
    setMessageError(false);
  }

  async function cancel(id) {
    try {
      await api(`/bookings/${id}/cancel`, { method: "POST" });
      setConfirmingId(null);
      setEditingId(null);
      note("Booking cancelled");
      await load();
    } catch (err) {
      note(err.message, true);
    }
  }

  async function remove(id) {
    await api(`/bookings/${id}/delete`, { method: "POST" });
    clearNote();
    await load();
  }

  function startEdit(booking) {
    clearNote();
    setConfirmingId(null);
    setEditingId(booking.id);
    setEditForm(formFromBooking(booking));
  }

  function patchEdit(patch) {
    clearNote();
    setEditForm((current) => {
      const next = { ...current, ...patch };
      if (patch.adults != null || patch.kids != null) {
        next.companions = companionSlots(next.adults, next.kids, next.companions);
      }
      return next;
    });
  }

  async function saveEdit(booking) {
    if (!editForm) return;
    if (editForm.add_companions && editForm.companions.some((person) => !String(person.full_name || "").trim())) {
      note("Please enter a name for each additional traveller, or uncheck adding other travellers.", true);
      return;
    }
    setSaving(true);
    try {
      await api(`/bookings/${booking.id}`, {
        method: "PATCH",
        body: {
          tour_date: editForm.tour_date,
          adults: Number(editForm.adults),
          kids: Number(editForm.kids),
          special_requirements: editForm.special_requirements,
          add_companions: editForm.add_companions,
          companions: editForm.add_companions ? editForm.companions : [],
        },
      });
      setEditingId(null);
      setEditForm(null);
      note("Booking details updated");
      await load();
    } catch (err) {
      note(err.message, true);
    } finally {
      setSaving(false);
    }
  }

  function tabButton(id, label, count) {
    const active = tab === id;
    return (
      <button
        className={`flex-1 md:flex-none px-5 py-3.5 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 ${
          active ? "bg-charcoal text-white" : "bg-surface-container border border-slate-gray/20 text-on-surface-variant hover:bg-surface-container-high"
        }`}
        onClick={() => {
          setTab(id);
          clearNote();
          setEditingId(null);
          setConfirmingId(null);
        }}
        type="button"
      >
        <span>{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? "bg-primary-container text-on-primary-container" : "bg-surface-container-highest text-on-surface-variant"}`}>{count}</span>
      </button>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="flex flex-col w-full px-margin-mobile sm:px-margin-desktop py-10 gap-10 relative overflow-hidden max-w-[1440px] mx-auto">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary-fixed/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
        <div className="relative z-10 flex flex-col gap-2 max-w-4xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-2 bg-surface-tint rounded-full shrink-0" />
            <h1 className="font-headline-sm text-headline-sm md:text-[32px] text-on-surface tracking-tight font-bold">Your Adventures</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl pl-6">
            Track your upcoming journeys into the wild heart of Uganda, review past expeditions, and manage your travel details.
          </p>
        </div>
        {message && (
          <div className={`relative z-10 flex items-start gap-2 rounded-lg p-3 ${messageError ? "bg-error-container/50 border border-error/20 text-on-error-container" : "bg-primary/10 text-primary"}`}>
            <p className="font-label-md flex-1">{message}</p>
            <button aria-label="Dismiss" onClick={clearNote} type="button">
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        )}

        <div className="relative z-10 bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] p-6 flex flex-col md:flex-row gap-5 items-end justify-between w-full">
          <div className="flex-1 w-full relative">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="booking-search">Find a Booking</label>
            <div className="relative w-full">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-gray" />
              <input
                className="w-full bg-surface-container-low border border-slate-gray/20 rounded-lg py-3.5 pl-12 pr-4 font-body-md text-body-md"
                id="booking-search"
                onChange={(e) => {
                  setSearch(e.target.value);
                  clearNote();
                }}
                placeholder="Search by tour name, booking ID, or location..."
                type="search"
                value={search}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
            {tabButton("upcoming", "Upcoming", counts.upcoming)}
            {tabButton("past", "Past", counts.past)}
            {tabButton("cancelled", "Cancelled", counts.cancelled)}
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-5 w-full">
          {visible.map(({ booking, category }) => {
            const status = (booking.payment_status || "pending").toLowerCase();
            const image = booking.tour?.images?.[0]?.image_url || booking.tour?.image_url;
            const date = parseTourDate(booking.tour_date);
            const editable = canEditBooking(booking, now);
            const cancellable = canCancelBooking(booking, now);
            const cancelBy = lastFreeChangeDate(booking.tour_date);
            const editing = editingId === booking.id && editForm;
            return (
              <article className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] overflow-hidden group hover:shadow-[0_8px_30px_-4px_rgba(30,30,30,0.12)] transition-shadow" key={booking.id}>
                <div className="flex flex-col lg:flex-row h-full">
                  <div className="lg:w-[300px] h-56 lg:h-auto relative overflow-hidden shrink-0 bg-surface-container-high">
                    {image ? <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url('${image}')` }} /> : <div className="absolute inset-0 flex items-center justify-center text-slate-gray"><Icon name="image" className="text-5xl" /></div>}
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="font-data-mono text-data-mono text-primary mb-2">BK-{String(booking.id).padStart(4, "0")}-UG</div>
                      <h2 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface mb-2">
                        <Link className="hover:text-primary" to={`/tour/${booking.tour_id}`}>{booking.tour?.title || "Tour"}</Link>
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-on-surface-variant font-body-md">
                        <div className="flex items-center gap-2"><Icon name="calendar_month" className="text-[18px]" />{date ? date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }) : "Date to confirm"}</div>
                        <div className="flex items-center gap-2"><Icon name="group" className="text-[18px]" />{booking.adults} Adult{booking.adults === 1 ? "" : "s"}{booking.kids ? `, ${booking.kids} Child${booking.kids === 1 ? "" : "ren"}` : ""}</div>
                        {status === "completed" && <div className="flex items-center gap-2"><Icon name="payments" className="text-[18px]" /> Paid in Full</div>}
                        {status === "pending" && <div className="flex items-center gap-2 text-surface-tint font-bold"><Icon name="warning" className="text-[18px]" /> Action Required</div>}
                      </div>
                      {category === "upcoming" && cancelBy && (
                        <p className="mt-2 text-[13px] text-slate-gray">
                          {cancellable
                            ? `Free cancellation until ${cancelBy.toLocaleDateString(undefined, { month: "short", day: "numeric" })} (${CANCELLATION_NOTICE_DAYS} days before departure).`
                            : `Free cancellation closed on ${cancelBy.toLocaleDateString(undefined, { month: "short", day: "numeric" })}. You can still update traveller details.`}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="font-headline-sm text-ink">${Number(booking.total_price || 0).toFixed(2)}</p>
                      <div className="flex flex-wrap gap-2">
                        {editable && !editing && (
                          <button className="border border-outline px-4 py-2 rounded-lg font-label-md hover:border-primary hover:text-primary" onClick={() => startEdit(booking)} type="button">
                            Edit details
                          </button>
                        )}
                        {cancellable && confirmingId !== booking.id && (
                          <button className="border border-outline px-4 py-2 rounded-lg font-label-md hover:border-primary hover:text-primary" onClick={() => { clearNote(); setConfirmingId(booking.id); }} type="button">
                            Cancel trip
                          </button>
                        )}
                        {confirmingId === booking.id && (
                          <>
                            <button className="bg-primary text-white px-4 py-2 rounded-lg font-label-md hover:bg-primary-container" onClick={() => cancel(booking.id)} type="button">
                              Confirm cancel
                            </button>
                            <button className="border border-outline px-4 py-2 rounded-lg font-label-md" onClick={() => setConfirmingId(null)} type="button">
                              Keep booking
                            </button>
                          </>
                        )}
                        {category === "cancelled" && <button className="border border-outline px-4 py-2 rounded-lg font-label-md" onClick={() => remove(booking.id)} type="button">Remove</button>}
                      </div>
                    </div>
                    {editing && (
                      <form
                        className="mt-5 pt-5 border-t border-surface-container grid grid-cols-1 sm:grid-cols-2 gap-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveEdit(booking);
                        }}
                      >
                        <label className="flex flex-col gap-1 text-[13px] text-slate-gray">
                          Tour date
                          <input className="p-2.5 rounded-lg border border-surface-container-high text-charcoal text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" onChange={(e) => patchEdit({ tour_date: e.target.value })} required type="date" value={editForm.tour_date} />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1 text-[13px] text-slate-gray">
                            Adults
                            <input className="p-2.5 rounded-lg border border-surface-container-high text-charcoal text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" min={1} onChange={(e) => patchEdit({ adults: Number(e.target.value) })} type="number" value={editForm.adults} />
                          </label>
                          <label className="flex flex-col gap-1 text-[13px] text-slate-gray">
                            Children
                            <input className="p-2.5 rounded-lg border border-surface-container-high text-charcoal text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" min={0} onChange={(e) => patchEdit({ kids: Number(e.target.value) })} type="number" value={editForm.kids} />
                          </label>
                        </div>
                        <label className="sm:col-span-2 flex flex-col gap-1 text-[13px] text-slate-gray">
                          Special requirements
                          <textarea className="p-2.5 rounded-lg border border-surface-container-high text-charcoal text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" maxLength={500} onChange={(e) => patchEdit({ special_requirements: e.target.value })} rows={2} value={editForm.special_requirements} />
                        </label>
                        {editForm.companions.length > 0 && (
                          <label className="sm:col-span-2 flex items-start gap-2 cursor-pointer text-[14px] text-charcoal">
                            <input checked={editForm.add_companions} className="mt-1 w-4 h-4 accent-primary" onChange={(e) => patchEdit({ add_companions: e.target.checked })} type="checkbox" />
                            Add names for other travellers
                          </label>
                        )}
                        {editForm.add_companions && editForm.companions.map((person, index) => (
                          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2" key={`${person.role}-${index}`}>
                            <input className="p-2.5 rounded-lg border border-surface-container-high text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" onChange={(e) => patchEdit({ companions: editForm.companions.map((item, itemIndex) => (itemIndex === index ? { ...item, full_name: e.target.value } : item)) })} placeholder={person.role === "child" ? "Child name" : "Adult name"} value={person.full_name} />
                            <input className="p-2.5 rounded-lg border border-surface-container-high text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" onChange={(e) => patchEdit({ companions: editForm.companions.map((item, itemIndex) => (itemIndex === index ? { ...item, details: e.target.value } : item)) })} placeholder="Details (optional)" value={person.details} />
                          </div>
                        ))}
                        <div className="sm:col-span-2 flex flex-wrap gap-2">
                          <button className="bg-primary text-white px-4 py-2 rounded-lg font-label-md hover:bg-primary-container disabled:opacity-60" disabled={saving} type="submit">
                            {saving ? "Saving…" : "Save changes"}
                          </button>
                          <button className="border border-outline px-4 py-2 rounded-lg font-label-md" onClick={() => { setEditingId(null); setEditForm(null); clearNote(); }} type="button">
                            Close
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {!visible.length && (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <Icon name="explore" className="text-5xl text-slate-gray mb-3" />
              <h3 className="font-headline-sm text-headline-sm mb-2">No {tab} bookings</h3>
              <p className="text-secondary mb-4">When you book a tour, it will appear here.</p>
              <Link className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-label-md" to="/tours#packages">Browse tours</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
