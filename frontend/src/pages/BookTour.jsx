import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import TourInquiryModal from "../components/TourInquiryModal";
import { useLocale } from "../LocaleContext";
import { Icon, priceUnitPhrase, tourBaseTotal } from "../utils";

export default function BookTour() {
  const { formatPrice } = useLocale();
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [form, setForm] = useState({ adults: 1, kids: 0, tour_date: "", donate: false, special_requirements: "" });
  const [error, setError] = useState("");
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [today, setToday] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api(`/tours/${id}`).then((data) => {
      setTour(data.tour);
      setToday(data.today);
      setForm((prev) => ({ ...prev, tour_date: data.today }));
    });
    api("/payment/config")
      .then((config) => setPaymentsEnabled(Boolean(config.payments_enabled)))
      .catch(() => setPaymentsEnabled(false));
  }, [id]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!paymentsEnabled) {
      setInquiryOpen(true);
      return;
    }
    try {
      await api("/bookings", {
        method: "POST",
        body: { ...form, tour_id: Number(id), adults: Number(form.adults), kids: Number(form.kids) },
      });
      navigate("/payment");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!tour) return <div className="p-12 text-center">Loading…</div>;
  const travelers = Number(form.adults) + Number(form.kids);
  const base = tourBaseTotal(tour, travelers);
  const donation = form.donate ? 10 : 0;
  const total = base + donation;

  return (
    <div className="bg-surface-container-low min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-margin-mobile lg:px-margin-desktop">
        <Link className="inline-flex items-center gap-2 font-label-md text-on-surface-variant hover:text-primary mb-6" to={`/tour/${id}`}>
          <Icon name="arrow_back" className="text-[18px]" /> Back to tour details
        </Link>
        <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] overflow-hidden">
          <div className="bg-charcoal p-6 md:p-8 text-white">
            <p className="font-label-md text-primary-fixed uppercase tracking-wider mb-2">{paymentsEnabled ? "Step 1 of 3 · Details" : "Expression of interest"}</p>
            <h1 className="font-headline-sm text-headline-sm mb-2">Book {tour.title}</h1>
            <p className="text-white/80 font-body-md">
              {formatPrice(tour.price)} {priceUnitPhrase(tour)}
              {!paymentsEnabled ? ". This is an expression of interest, not a booking. No payment is taken online." : ""}
            </p>
          </div>
          <form className="p-6 md:p-8 space-y-6" onSubmit={submit}>
            {error && (
              <div className="flex items-start gap-2 bg-error-container/50 border border-error/20 text-on-error-container rounded-lg p-3">
                <Icon name="error" className="text-[18px] mt-0.5" />
                <p className="font-body-md text-[13px]">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="flex flex-col gap-2 font-label-md">Adults
                <input className="p-3 bg-surface-bright rounded-lg" max="5" min="1" onChange={(e) => setForm({ ...form, adults: e.target.value })} type="number" value={form.adults} />
              </label>
              <label className="flex flex-col gap-2 font-label-md">Children
                <input className="p-3 bg-surface-bright rounded-lg" max="4" min="0" onChange={(e) => setForm({ ...form, kids: e.target.value })} type="number" value={form.kids} />
              </label>
              <label className="md:col-span-2 flex flex-col gap-2 font-label-md">Tour date
                <input className="p-3 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, tour_date: e.target.value })} required type="date" value={form.tour_date} />
              </label>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input checked={form.donate} onChange={(e) => setForm({ ...form, donate: e.target.checked })} type="checkbox" />
              <span className="font-body-md">Add {formatPrice(10)} conservation donation</span>
            </label>
            <textarea className="w-full p-3 bg-surface-bright rounded-lg" onChange={(e) => setForm({ ...form, special_requirements: e.target.value })} placeholder="Special requirements" rows={3} value={form.special_requirements} />
            <div className="flex items-center justify-between pt-4 border-t border-surface-container">
              <div>
                <p className="font-data-mono text-[12px] text-slate-gray uppercase">Estimated total</p>
                <p className="font-headline-sm text-primary">{formatPrice(total, 2)}</p>
              </div>
              <button className="bg-primary text-white px-8 py-3 rounded-lg font-label-md hover:bg-primary-container" type="submit">
                {paymentsEnabled ? (tour.reserve_now_pay_later ? "Reserve now" : "Continue to payment") : "Register interest"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <TourInquiryModal
        minDate={today}
        onClose={() => setInquiryOpen(false)}
        open={inquiryOpen}
        people={Number(form.adults || 0) + Number(form.kids || 0)}
        preferredDate={form.tour_date}
        tour={tour}
      />
    </div>
  );
}
