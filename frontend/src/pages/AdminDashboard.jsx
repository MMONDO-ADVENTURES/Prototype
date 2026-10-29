import { useEffect, useState } from "react";
import { api } from "../api";
import DashboardShell from "../components/DashboardShell";
import { Icon, itineraryDayBadge, parseActivity, parseItineraryDayRange, splitCsv } from "../utils";

const TOUR_TYPE_OPTIONS = ["safari", "cultural", "adventure", "wildlife", "trekking", "community"];

const emptyDay = (day = 1) => ({
  day,
  day_from: day,
  day_to: day,
  title: day === 1 ? "Arrival" : `Day ${day}`,
  destination: "",
  accommodation: "",
  duration: "",
  activities: [""],
});

function nextStopStart(itinerary) {
  if (!itinerary.length) return 1;
  const last = itinerary[itinerary.length - 1];
  return parseItineraryDayRange(last, itinerary.length - 1).to + 1;
}

function setDayRange(day, fromValue, toValue, index) {
  const from = Math.max(1, Number(fromValue) || index + 1);
  const to = Math.max(from, Number(toValue) || from);
  return { ...day, day: from, day_from: from, day_to: to };
}

const emptyTour = {
  title: "",
  description: "",
  price: "",
  price_unit: "person",
  duration_value: "6",
  duration_unit: "days",
  destinations: "",
  accommodations: "",
  tour_types: ["safari"],
  max_participants: 5,
  included: "",
  not_included: "",
  languages: "",
  live_tour_guide: false,
  free_cancellation: true,
  reserve_now_pay_later: false,
  meeting_pickup: "",
  additional_information: "",
  itinerary: [emptyDay(1)],
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyTour);
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    setData(await api("/operator/dashboard"));
  }

  useEffect(() => {
    load().catch(() => setData(null));
  }, []);

  function updateDay(index, patch) {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
    }));
  }

  function updateActivity(dayIndex, activityIndex, value) {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((day, index) => {
        if (index !== dayIndex) return day;
        const activities = day.activities.map((item, itemIndex) => (itemIndex === activityIndex ? value : item));
        return { ...day, activities };
      }),
    }));
  }

  async function saveTour(event) {
    event.preventDefault();
    const body = new FormData();
    body.append("title", form.title);
    body.append("description", form.description);
    body.append("price", form.price);
    body.append("price_unit", form.price_unit || "person");
    body.append("duration_value", form.duration_value);
    body.append("duration_unit", form.duration_unit);
    body.append("destinations", form.destinations);
    body.append("accommodations", form.accommodations);
    body.append("tour_types", form.tour_types.join(", "));
    body.append("max_participants", String(Math.min(5, Math.max(1, Number(form.max_participants) || 5))));
    body.append("included", form.included);
    body.append("not_included", form.not_included);
    body.append("languages", form.languages);
    body.append("live_tour_guide", form.live_tour_guide ? "true" : "false");
    body.append("free_cancellation", form.free_cancellation ? "true" : "false");
    body.append("reserve_now_pay_later", form.reserve_now_pay_later ? "true" : "false");
    body.append("meeting_pickup", form.meeting_pickup);
    body.append("additional_information", form.additional_information);
    body.append("country", "Uganda");
    body.append(
      "itinerary",
      JSON.stringify(
        form.itinerary.map((day, index) => {
          const { from, to } = parseItineraryDayRange(day, index);
          return {
            ...day,
            day: from,
            day_from: from,
            day_to: to,
            activities: day.activities.map((item) => parseActivity(item)).filter((item) => item.title),
          };
        })
      )
    );
    Array.from(files).forEach((file) => body.append("images", file));
    if (editingId) {
      body.append("is_active", "true");
      await api(`/operator/tours/${editingId}`, { method: "PUT", body });
      setMessage("Tour updated");
    } else {
      await api("/operator/tours", { method: "POST", body });
      setMessage("Tour created");
    }
    setForm(emptyTour);
    setEditingId(null);
    setFiles([]);
    await load();
  }

  async function editTour(tour) {
    const details = await api(`/operator/tours/${tour.id}`);
    const itinerary = Array.isArray(details.itinerary) && details.itinerary.length
      ? details.itinerary.map((day, index) => {
          const { from, to } = parseItineraryDayRange(day, index);
          return {
            day: from,
            day_from: from,
            day_to: to,
            title: day.title || `Day ${from}`,
            destination: day.destination || "",
            accommodation: day.accommodation || "",
            duration: day.duration || "",
            activities: day.activities?.length ? day.activities : [""],
          };
        })
      : [emptyDay(1)];
    setEditingId(tour.id);
    setForm({
      title: details.title || "",
      description: details.description || "",
      price: details.price || "",
      price_unit: details.price_unit || "person",
      duration_value: details.duration_value || "6",
      duration_unit: details.duration_unit || "days",
      destinations: details.destinations || details.locations || "",
      accommodations: details.accommodations || "",
      tour_types: details.tour_types?.length ? details.tour_types : splitCsv(details.tour_type || "safari"),
      max_participants: details.max_participants || 5,
      included: details.included || "",
      not_included: details.not_included || "",
      languages: details.languages || "",
      live_tour_guide: Boolean(details.live_tour_guide),
      free_cancellation: Boolean(details.free_cancellation),
      reserve_now_pay_later: Boolean(details.reserve_now_pay_later),
      meeting_pickup: details.meeting_pickup || "",
      additional_information: details.additional_information || "",
      itinerary,
    });
  }

  async function removeTour(id) {
    await api(`/operator/tours/${id}`, { method: "DELETE" });
    await load();
  }

  async function setStatus(id, status) {
    await api(`/operator/bookings/${id}/status`, { method: "POST", body: { status } });
    await load();
  }

  if (!data) return <div className="p-12 text-center">Loading operator dashboard…</div>;

  return (
    <DashboardShell subtitle="Create tours, review bookings, and keep your Ugandan itineraries current." title="Operator dashboard">
      {message && <p className="mb-4 text-tertiary font-label-md">{message}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          ["Tours", data.total_tours],
          ["Bookings", data.total_bookings],
          ["Revenue", `$${Number(data.total_revenue || 0).toFixed(0)}`],
          ["Reviews", data.total_reviews],
        ].map(([label, value]) => (
          <div className="bg-white rounded-xl p-5 shadow-sm" key={label}>
            <p className="font-label-md text-label-md text-secondary uppercase tracking-wider">{label}</p>
            <p className="font-headline-sm text-[28px] text-ink mt-1">{value}</p>
          </div>
        ))}
      </div>

      <form className="grid md:grid-cols-2 gap-3 bg-white rounded-xl p-6 mb-10 shadow-sm" onSubmit={saveTour}>
        <h2 className="md:col-span-2 font-headline-sm text-headline-sm">{editingId ? "Edit tour" : "Create tour"}</h2>
        <input className="px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required value={form.title} />
        <div className="flex gap-2">
          <input className="flex-1 min-w-0 px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" required type="number" value={form.price} />
          <select
            className="w-[140px] shrink-0 px-3 py-2 bg-surface-bright rounded-lg"
            onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
            value={form.price_unit}
          >
            <option value="person">Per person</option>
            <option value="group">Per group</option>
            <option value="tour">Per tour</option>
          </select>
        </div>
        <input className="px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, destinations: e.target.value })} placeholder="Destinations (Bwindi, Queen Elizabeth)" required value={form.destinations} />
        <input className="px-3 py-2 bg-surface-bright rounded-lg" disabled readOnly value="Uganda" />
        <input className="px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, duration_value: e.target.value })} placeholder="Duration value" value={form.duration_value} />
        <input className="px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, duration_unit: e.target.value })} placeholder="days" value={form.duration_unit} />
        <input className="px-3 py-2 bg-surface-bright rounded-lg" max={5} min={1} onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })} placeholder="Max travellers" type="number" value={form.max_participants} />
        <input className="px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="Languages (English, Swahili)" value={form.languages} />
        <input className="md:col-span-2 px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, accommodations: e.target.value })} placeholder="Accommodations (Clouds Lodge, Mweya Safari Lodge)" value={form.accommodations} />
        <textarea className="md:col-span-2 px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" required value={form.description} />
        <textarea className="px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, included: e.target.value })} placeholder="Included (comma separated)" value={form.included} />
        <textarea className="px-3 py-2 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, not_included: e.target.value })} placeholder="Not included (comma separated)" value={form.not_included} />

        <div className="md:col-span-2">
          <p className="font-label-md text-[13px] text-charcoal mb-2">Tour types</p>
          <div className="flex flex-wrap gap-2">
            {TOUR_TYPE_OPTIONS.map((typeName) => {
              const active = form.tour_types.includes(typeName);
              return (
                <button
                  className={`px-3 py-1.5 rounded-full border font-label-md text-[13px] capitalize ${
                    active ? "bg-primary text-white border-primary" : "border-surface-container-high text-charcoal hover:border-primary"
                  }`}
                  key={typeName}
                  onClick={() =>
                    setForm({
                      ...form,
                      tour_types: active ? form.tour_types.filter((item) => item !== typeName) : [...form.tour_types, typeName],
                    })
                  }
                  type="button"
                >
                  {typeName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <p className="font-label-md text-[13px] text-charcoal mb-1">Show on tour page</p>
          <p className="text-[12px] text-slate-gray mb-2">Tick only the features this tour offers. Unticked items stay hidden from travellers.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-[14px] text-charcoal">
              <input checked={form.live_tour_guide} className="accent-primary" onChange={(e) => setForm({ ...form, live_tour_guide: e.target.checked })} type="checkbox" />
              Live tour guide
            </label>
            <label className="flex items-center gap-2 text-[14px] text-charcoal">
              <input checked={form.free_cancellation} className="accent-primary" onChange={(e) => setForm({ ...form, free_cancellation: e.target.checked })} type="checkbox" />
              Free cancellation
            </label>
            <label className="flex items-center gap-2 text-[14px] text-charcoal">
              <input checked={form.reserve_now_pay_later} className="accent-primary" onChange={(e) => setForm({ ...form, reserve_now_pay_later: e.target.checked })} type="checkbox" />
              Reserve now and pay later
            </label>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4 border-t border-surface-container pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-[20px]">Day-by-day itinerary</h3>
            <button
              className="inline-flex items-center gap-1 text-primary font-label-md text-[13px] hover:text-primary-container"
              onClick={() => setForm({ ...form, itinerary: [...form.itinerary, emptyDay(nextStopStart(form.itinerary))] })}
              type="button"
            >
              <Icon name="add" className="text-[18px]" /> Add day
            </button>
          </div>
          {form.itinerary.map((day, dayIndex) => {
            const { from, to } = parseItineraryDayRange(day, dayIndex);
            const isRange = to > from;
            return (
            <div className="rounded-xl border border-surface-container p-4 space-y-2 bg-surface" key={`day-${dayIndex}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-label-md text-charcoal">{itineraryDayBadge(day, dayIndex)}</p>
                {form.itinerary.length > 1 && (
                  <button
                    className="text-error text-[13px] font-label-md"
                    onClick={() => setForm({ ...form, itinerary: form.itinerary.filter((_, index) => index !== dayIndex) })}
                    type="button"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <p className="font-label-md text-[12px] text-secondary mb-1">Day numbering</p>
                  <div className="inline-flex rounded-lg overflow-hidden border border-outline">
                    <button
                      className={`px-3 py-1.5 text-[13px] font-label-md ${isRange ? "bg-white text-charcoal hover:text-primary" : "bg-primary text-white"}`}
                      onClick={() => updateDay(dayIndex, setDayRange(day, from, from, dayIndex))}
                      type="button"
                    >
                      Single day
                    </button>
                    <button
                      className={`px-3 py-1.5 text-[13px] font-label-md ${isRange ? "bg-primary text-white" : "bg-white text-charcoal hover:text-primary"}`}
                      onClick={() => updateDay(dayIndex, setDayRange(day, from, Math.max(from + 1, to), dayIndex))}
                      type="button"
                    >
                      Multiple days
                    </button>
                  </div>
                </div>
                <label className="text-[13px] text-secondary">
                  {isRange ? "From" : "Day"}
                  <input
                    className="ml-2 w-20 px-3 py-2 bg-white rounded-lg"
                    min={1}
                    onChange={(e) => updateDay(dayIndex, setDayRange(day, e.target.value, isRange ? to : e.target.value, dayIndex))}
                    type="number"
                    value={from}
                  />
                </label>
                {isRange && (
                  <label className="text-[13px] text-secondary">
                    To
                    <input
                      className="ml-2 w-20 px-3 py-2 bg-white rounded-lg"
                      min={from}
                      onChange={(e) => updateDay(dayIndex, setDayRange(day, from, e.target.value, dayIndex))}
                      type="number"
                      value={to}
                    />
                  </label>
                )}
              </div>
              <input className="w-full px-3 py-2 bg-white rounded-lg" onChange={(e) => updateDay(dayIndex, { title: e.target.value })} placeholder="Day title (Arrival, Gorilla trekking)" value={day.title} />
              <div className="grid md:grid-cols-3 gap-2">
                <input className="px-3 py-2 bg-white rounded-lg" onChange={(e) => updateDay(dayIndex, { destination: e.target.value })} placeholder="Destination" value={day.destination} />
                <input className="px-3 py-2 bg-white rounded-lg" onChange={(e) => updateDay(dayIndex, { accommodation: e.target.value })} placeholder="Accommodation" value={day.accommodation} />
                <input className="px-3 py-2 bg-white rounded-lg" onChange={(e) => updateDay(dayIndex, { duration: e.target.value })} placeholder="Duration (Full day, 3 hours)" value={day.duration} />
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="font-label-md text-[12px] text-secondary">Activities</p>
                <p className="font-label-md text-[12px] text-secondary w-[140px] shrink-0">Duration</p>
              </div>
              {day.activities.map((activity, activityIndex) => {
                const parsed = parseActivity(activity);
                return (
                  <div className="flex gap-2" key={`activity-${dayIndex}-${activityIndex}`}>
                    <input
                      className="flex-1 px-3 py-2 bg-white rounded-lg"
                      onChange={(e) => updateActivity(dayIndex, activityIndex, { title: e.target.value })}
                      placeholder="e.g. Boat safari on the Kazinga Channel"
                      value={parsed.title}
                    />
                    <input
                      className="w-[140px] shrink-0 px-3 py-2 bg-white rounded-lg"
                      onChange={(e) => updateActivity(dayIndex, activityIndex, { duration: e.target.value })}
                      placeholder="e.g. 2 hours"
                      value={parsed.duration}
                    />
                    <button
                      className="text-slate-gray hover:text-error"
                      onClick={() =>
                        updateDay(dayIndex, {
                          activities: day.activities.length > 1 ? day.activities.filter((_, index) => index !== activityIndex) : [{ title: "", duration: "" }],
                        })
                      }
                      type="button"
                    >
                      <Icon name="close" className="text-[18px]" />
                    </button>
                  </div>
                );
              })}
              <button
                className="text-primary font-label-md text-[13px] hover:text-primary-container"
                onClick={() => updateDay(dayIndex, { activities: [...day.activities, { title: "", duration: "" }] })}
                type="button"
              >
                Add activity
              </button>
            </div>
            );
          })}
          <textarea
            className="px-3 py-2 bg-white rounded-lg min-h-[110px]"
            onChange={(e) => setForm({ ...form, meeting_pickup: e.target.value })}
            placeholder="Meeting and pickup (one note per line)"
            value={form.meeting_pickup}
          />
          <textarea
            className="px-3 py-2 bg-white rounded-lg min-h-[110px]"
            onChange={(e) => setForm({ ...form, additional_information: e.target.value })}
            placeholder="Additional information (one note per line)"
            value={form.additional_information}
          />
        </div>

        <input className="md:col-span-2" onChange={(e) => setFiles(e.target.files)} type="file" multiple accept="image/*" />
        <button className="bg-primary text-white py-3 rounded-lg font-label-md hover:bg-primary-container" type="submit">{editingId ? "Update tour" : "Create tour"}</button>
      </form>

      <h2 className="font-headline-sm text-headline-sm mb-3">Tours</h2>
      <div className="space-y-3 mb-10">
        {data.tours?.map((tour) => (
          <div className="bg-white rounded-xl p-4 flex justify-between gap-3 shadow-sm" key={tour.id}>
            <div>
              <p className="font-label-md">{tour.title}</p>
              <p className="text-sm text-secondary">${tour.price} {tour.price_unit ? `/${tour.price_unit}` : "/person"} · {tour.duration} · Max {tour.max_participants}</p>
            </div>
            <div className="flex gap-2">
              <button className="border border-outline px-3 py-1 rounded-lg font-label-md" onClick={() => editTour(tour)} type="button">Edit</button>
              <button className="border border-outline px-3 py-1 rounded-lg font-label-md" onClick={() => removeTour(tour.id)} type="button">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-headline-sm text-headline-sm mb-3">Recent bookings</h2>
      <div className="space-y-3">
        {data.bookings?.map((booking) => (
          <div className="bg-white rounded-xl p-4 flex justify-between gap-3 shadow-sm" key={booking.id}>
            <div>
              <p>{booking.tour?.title} · {booking.user?.full_name}</p>
              <p className="text-sm text-secondary">{booking.status} · ${booking.total_price}</p>
            </div>
            <select className="border border-outline rounded-lg px-2" onChange={(e) => setStatus(booking.id, e.target.value)} value={booking.status}>
              {["pending", "confirmed", "declined", "cancelled"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
