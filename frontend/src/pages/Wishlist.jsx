import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import PhoneField from "../components/PhoneField";
import { useLocale } from "../LocaleContext";
import { Icon, joinName, priceUnitPhrase, splitName } from "../utils";

export default function Wishlist() {
  const { formatPrice } = useLocale();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", adults: 1, kids: 0, country: "", preferred_date: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/wishlist/${id}`).then((payload) => {
      setData(payload);
      const names = splitName(payload.prefill?.full_name);
      setForm((prev) => ({ ...prev, ...payload.prefill, first_name: names.first_name, last_name: names.last_name }));
    });
  }, [id]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api(`/wishlist/${id}`, {
        method: "POST",
        body: { ...form, full_name: joinName(form.first_name, form.last_name), adults: Number(form.adults), kids: Number(form.kids) },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) return <div className="p-12 text-center">Loading…</div>;
  const tour = data.tour || {};

  return (
    <div className="bg-surface-container-low min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-margin-mobile lg:px-margin-desktop">
        <Link className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary mb-6" to={`/tour/${id}`}>
          <Icon name="arrow_back" className="text-[18px]" /> Back to Tour
        </Link>
        <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] overflow-hidden">
          <div className="bg-charcoal p-8 text-white">
            <h1 className="font-headline-sm text-headline-sm mb-2">Register Your Interest</h1>
            <p className="font-body-md text-body-md text-white/80">
              Bookings are not live yet. Share your details to join our wishlist and help us demonstrate demand for this tour.
            </p>
          </div>
          <div className="p-6 md:p-8">
            <div className="bg-primary-fixed/30 border-l-4 border-primary rounded-lg p-4 mb-8">
              <h2 className="font-headline-sm text-[20px] text-ink mb-1">{tour.title}</h2>
              <p className="font-body-md text-secondary flex items-center gap-2">
                <Icon name="location_on" className="text-[18px]" />
                {tour.country}
                {tour.duration ? ` · ${tour.duration}` : ""}
                {` · From ${formatPrice(tour.price)} ${priceUnitPhrase(tour)}`}
              </p>
            </div>
            {submitted ? (
              <div>
                <div className="flex items-start gap-3 bg-tertiary-container/15 border border-tertiary/30 text-on-tertiary-container rounded-lg p-4 mb-6">
                  <Icon name="check_circle" className="text-[22px]" fill />
                  <p>Thank you! Your interest has been recorded. We'll contact you when bookings open for this tour.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link className="bg-primary text-white px-5 py-3 rounded-lg font-label-md" to="/tours#packages">Browse More Tours</Link>
                  <Link className="border border-outline px-5 py-3 rounded-lg font-label-md" to={`/tour/${id}`}>Back to Tour</Link>
                </div>
              </div>
            ) : (
              <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={submit}>
                {error && <p className="md:col-span-2 text-error">{error}</p>}
                <label className="flex flex-col gap-2 font-label-md text-label-md">First Name *
                  <input className="p-3 bg-surface-bright rounded-lg font-body-md" onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Jane" required value={form.first_name} />
                </label>
                <label className="flex flex-col gap-2 font-label-md text-label-md">Last Name *
                  <input className="p-3 bg-surface-bright rounded-lg font-body-md" onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Okello" required value={form.last_name} />
                </label>
                <label className="flex flex-col gap-2 font-label-md text-label-md">Email *
                  <input className="p-3 bg-surface-bright rounded-lg font-body-md" onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email" value={form.email} />
                </label>
                <label className="flex flex-col gap-2 font-label-md text-label-md">Phone Number *
                  <PhoneField onChange={(phone) => setForm({ ...form, phone })} required value={form.phone} />
                </label>
                <label className="flex flex-col gap-2 font-label-md text-label-md">Country of Residence
                  <input className="p-3 bg-surface-bright rounded-lg font-body-md" onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. Germany" value={form.country} />
                </label>
                <label className="flex flex-col gap-2 font-label-md text-label-md">Adults *
                  <input className="p-3 bg-surface-bright rounded-lg font-body-md" min="1" onChange={(e) => setForm({ ...form, adults: e.target.value })} required type="number" value={form.adults} />
                </label>
                <label className="flex flex-col gap-2 font-label-md text-label-md">Children
                  <input className="p-3 bg-surface-bright rounded-lg font-body-md" min="0" onChange={(e) => setForm({ ...form, kids: e.target.value })} type="number" value={form.kids} />
                </label>
                <label className="md:col-span-2 flex flex-col gap-2 font-label-md text-label-md">Preferred Travel Date
                  <input className="p-3 bg-surface-bright rounded-lg font-body-md" onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} type="date" value={form.preferred_date} />
                </label>
                <label className="md:col-span-2 flex flex-col gap-2 font-label-md text-label-md">Notes
                  <textarea className="p-3 bg-surface-bright rounded-lg font-body-md" onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us anything else about your trip plans..." rows={3} value={form.message} />
                </label>
                <p className="md:col-span-2 font-body-md text-[14px] text-secondary bg-surface-container-low rounded-lg p-3">
                  No payment is required. We are collecting interest to validate demand before official bookings launch.
                </p>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button className="bg-primary text-white px-6 py-3 rounded-lg font-label-md flex items-center gap-2" type="submit">
                    <Icon name="favorite" /> Join Wishlist
                  </button>
                  <Link className="border border-outline px-6 py-3 rounded-lg font-label-md" to={`/tour/${id}`}>Cancel</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
