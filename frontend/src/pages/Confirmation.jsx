import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { cldCard } from "../cloudinary";
import { useLocale } from "../LocaleContext";
import { Icon, parseTourDate } from "../utils";

const HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBNj4QY0B_OFbzQ6IeORqfUfOZ0XANBVCysRRVKrc5K1msem8Ihg45IFUTFN1AsXlhSLYtFGHPUpeI2gRsekcFTpnRJPGv3kqm7ccMsc8pN0KgWm6-Om5cguGmW9f34N4FsKDVno89Ky0zCEQdM_rQvn7EAiu-Tai1HaYefY25-a3LLh94BeEbjPpef_jvNgyRVX3OkvRYBlog3Z90rAL0pZqNC9Dk48MxaQvSR81h2SbxEqcJsk4Ik";

export default function Confirmation() {
  const { user } = useAuth();
  const { formatPrice } = useLocale();
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/payment/confirmation").then(setData).catch(() => setData({}));
  }, []);

  const booking = data?.booking;
  const tour = data?.tour;
  const firstName = (user?.full_name || "").split(" ")[0];
  const image = tour?.images?.[0]?.image_url || tour?.image_url;
  const status = (booking?.payment_status || "confirmed").toLowerCase();
  const paid = ["completed", "paid", "success"].includes(status);
  const travelers = (booking?.adults || 0) + (booking?.kids || 0);
  const parsedDate = parseTourDate(booking?.tour_date);
  const dateLabel = parsedDate
    ? parsedDate.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
    : "Date to be confirmed";

  return (
    <div className="flex flex-col w-full relative bg-surface-container-low">
      <div className="relative w-full h-[160px] lg:h-[200px] overflow-hidden rounded-b-[1.5rem] lg:rounded-b-[2.5rem] shadow-sm z-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${HERO}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-transparent mix-blend-multiply" />
      </div>

      <div className="max-w-[720px] mx-auto px-margin-mobile lg:px-margin-desktop w-full relative z-10 -mt-16 lg:-mt-20 pb-10">
        <div className="bg-surface-container-lowest rounded-xl shadow-xl p-5 md:p-7 mb-8 flex flex-col items-center text-center relative overflow-hidden" id="confirmation-card">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-tertiary-container/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

          <div className="w-14 h-14 bg-primary-container/10 text-primary-container rounded-full flex items-center justify-center mb-4 relative">
            <Icon name="check_circle" className="text-[32px] relative z-10" fill />
            <div className="absolute inset-0 bg-primary-container/20 rounded-full animate-ping opacity-40" />
          </div>

          <h1 className="font-headline-md text-[28px] md:text-[32px] leading-tight text-ink mb-2 relative z-10">
            Your Ugandan Adventure is Confirmed!
          </h1>
          <p className="font-body-md text-[15px] text-on-secondary-container max-w-xl mx-auto mb-6 relative z-10">
            {firstName ? `Thank you, ${firstName}. ` : ""}We've received your payment and secured your spot.
          </p>

          <div className="w-full bg-surface-container-low rounded-lg p-4 md:p-5 mb-6 text-left relative z-10">
            <h2 className="font-label-md text-label-md uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <Icon name="receipt_long" className="text-[18px]" />
              Booking Summary
            </h2>
            {booking ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-data-mono text-data-mono text-slate-gray mb-0.5 uppercase">Reference Number</p>
                  <p className="font-headline-sm text-[20px] text-ink font-bold tracking-tight">{data.reference}</p>
                </div>
                <div>
                  <p className="font-data-mono text-data-mono text-slate-gray mb-0.5 uppercase">Total Paid</p>
                  <p className="font-headline-sm text-[20px] text-primary-container font-bold tracking-tight">{formatPrice(booking.total_price, 2)}</p>
                </div>
                <div className="md:col-span-2 bg-white rounded-lg p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {image ? <img alt={tour?.title} className="w-full h-full object-cover" decoding="async" src={cldCard(image)} /> : <Icon name="explore" className="text-on-surface-variant" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-md text-[15px] text-ink font-bold truncate">{tour?.title || "Your Tour"}</p>
                      <p className="font-label-md text-[13px] text-slate-gray flex items-center gap-1">
                        <Icon name="calendar_month" className="text-[14px]" />
                        {dateLabel}
                        {travelers ? ` · ${travelers} traveler${travelers === 1 ? "" : "s"}` : ""}
                      </p>
                      {booking.companions?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {booking.companions.map((person, index) => (
                            <li className="text-[13px] text-slate-gray" key={`${person.full_name}-${index}`}>
                              {person.full_name || "Traveller"}
                              {person.role ? ` · ${person.role}` : ""}
                              {person.details ? ` · ${person.details}` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="bg-tertiary-container/10 px-3 py-1 rounded-full text-tertiary font-label-md text-[13px] flex items-center gap-1 w-fit shrink-0">
                    <Icon name="verified" className="text-[16px]" fill />
                    {paid ? "Fully Paid" : (booking.payment_status || "Confirmed")}
                  </div>
                </div>
              </div>
            ) : (
              <p className="font-body-md text-[15px] text-on-secondary-container">
                Your booking is confirmed. Details will appear in <Link className="text-primary underline" to="/my-bookings">My Bookings</Link>.
              </p>
            )}
          </div>

          <div className="w-full max-w-xl mx-auto text-left relative z-10 mb-6">
            <h3 className="font-headline-sm text-[20px] text-ink mb-3">What happens next?</h3>
            <div className="space-y-3">
              {[
                ["1", "Confirmation Email Sent", user?.email ? `A detailed itinerary and receipt have been sent to ${user.email}.` : "A detailed itinerary and receipt have been sent to your registered email address."],
                ["2", "Specialist Follow-up", "Your travel specialist will contact you within 24 hours."],
                ["3", "Manage Your Trip", "Review booking details anytime from your account dashboard."],
              ].map(([step, title, copy]) => (
                <div className="flex gap-3" key={step}>
                  <div className="w-7 h-7 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-data-mono text-[12px] font-bold">{step}</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-ink mb-0.5">{title}</h4>
                    <p className="font-body-md text-[14px] text-on-secondary-container leading-snug">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-center relative z-10">
            <Link className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2" to="/my-bookings">
              View My Bookings
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
            <button className="bg-transparent hover:bg-surface-container text-ink font-label-md text-label-md px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-gray/30" onClick={() => window.print()} type="button">
              <Icon name="print" className="text-[18px]" />
              Print Receipt
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-container flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full relative z-10 text-slate-gray">
            <div className="flex items-center gap-2 font-data-mono text-[12px]">
              <Icon name="lock" className="text-[16px] text-tertiary-container" />
              256-bit Secure Transaction
            </div>
            <Link className="flex items-center gap-2 font-label-md text-[13px] hover:text-primary-container transition-colors" to="/contact">
              <Icon name="help" className="text-[16px]" />
              Contact Support Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
