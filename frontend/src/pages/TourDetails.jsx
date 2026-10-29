import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import OperatorCard from "../components/OperatorCard";
import TourCard from "../components/TourCard";
import TourInquiryModal from "../components/TourInquiryModal";
import { useLocale } from "../LocaleContext";
import { CANCELLATION_POLICY, durationDays, Icon, itineraryDayBadge, parseActivity, parseItineraryDayRange, priceUnitPhrase, priceUnitSuffix, splitCsv, splitNotes, tourDestinations, tourItinerary, tourTypes } from "../utils";

function Stars({ rating, size = "text-[14px]" }) {
  return (
    <div className="flex gap-0.5 text-primary">
      {Array.from({ length: 5 }, (_, index) => (
        <Icon
          fill={index < rating}
          key={index}
          name="star"
          className={`${size} ${index >= rating ? "text-surface-variant" : ""}`}
        />
      ))}
    </div>
  );
}

function formatStartDate(value) {
  if (!value) return "Travel Date";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function BulletList({ items }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {items.map((item) => (
        <li className="flex items-start gap-1.5 text-[13px] leading-snug text-charcoal" key={item}>
          <span className="text-slate-gray mt-px shrink-0">›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ActivityList({ activities, day }) {
  const items = (activities?.length ? activities : [{ title: `Time in ${day?.destination || "Uganda"}.` }]).map((activity) => parseActivity(activity)).filter((item) => item.title);
  return (
    <ul className="mt-1 space-y-0.5">
      {items.map((item) => (
        <li className="flex items-start justify-between gap-3 text-[13px] leading-snug text-slate-gray" key={`${item.title}-${item.duration}`}>
          <span className="min-w-0">{item.title}</span>
          {item.duration ? <span className="text-[12px] text-slate-gray shrink-0">{item.duration}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function CheckRow({ included, text }) {
  return (
    <p className="flex items-start gap-1.5 text-[13px] leading-snug text-charcoal">
      <Icon
        fill
        name={included ? "check_circle" : "cancel"}
        className={`${included ? "text-emerald-600" : "text-red-500"} text-[16px] shrink-0 mt-px`}
      />
      <span>{text}</span>
    </p>
  );
}

function itineraryWithDayBadges(items) {
  return items.map((item, index) => {
    const { from, to } = parseItineraryDayRange(item, index);
    return { ...item, dayFrom: from, dayTo: to, dayBadge: itineraryDayBadge(item, index) };
  });
}

function highlightIcon(text) {
  const value = String(text || "").toLowerCase();
  if (/gorilla|wildlife|safari|lion|elephant|chimp/.test(value)) return "pets";
  if (/boat|cruise|ferry|kazinga|nile/.test(value)) return "directions_boat";
  if (/train|rail/.test(value)) return "train";
  if (/city|town|village|kampala|entebbe/.test(value)) return "location_city";
  if (/lake|water|falls|murchison/.test(value)) return "water";
  if (/mountain|hike|trek|peak|bwindi|rwenzori/.test(value)) return "terrain";
  if (/food|meal|chocolate|coffee|tasting/.test(value)) return "restaurant";
  if (/guide|cultural|community/.test(value)) return "groups";
  if (/hotel|lodge|stay|overnight/.test(value)) return "hotel";
  return "landscape";
}

export default function TourDetails() {
  const { formatPrice } = useLocale();
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [today, setToday] = useState("");
  const [error, setError] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [form, setForm] = useState({
    tour_date: "",
    adults: 2,
    kids: 0,
    donate: false,
    special_requirements: "",
  });
  const [busy, setBusy] = useState(false);
  const [related, setRelated] = useState([]);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  useEffect(() => {
    api(`/tours/${id}`)
      .then((data) => {
        setTour(data.tour);
        setToday(data.today);
        const date = params.get("date");
        const adults = Number(params.get("adults"));
        const kids = Number(params.get("children"));
        setForm((prev) => ({
          ...prev,
          tour_date: date || data.today,
          adults: Number.isFinite(adults) && adults > 0 ? adults : prev.adults,
          kids: Number.isFinite(kids) && kids >= 0 ? kids : prev.kids,
        }));
      })
      .catch((err) => setError(err.message));
  }, [id, params]);

  useEffect(() => {
    api("/tours")
      .then((data) => {
        setRelated((data.tours || []).filter((item) => String(item.id) !== String(id)).slice(0, 4));
      })
      .catch(() => setRelated([]));
  }, [id]);

  useEffect(() => {
    api("/payment/config")
      .then((config) => setPaymentsEnabled(Boolean(config.payments_enabled)))
      .catch(() => setPaymentsEnabled(false));
  }, []);

  const destinations = useMemo(() => tourDestinations(tour), [tour]);
  const included = useMemo(() => splitCsv(tour?.included), [tour]);
  const excluded = useMemo(() => splitCsv(tour?.not_included), [tour]);
  const accommodations = useMemo(() => splitCsv(tour?.accommodations), [tour]);
  const languages = useMemo(() => splitCsv(tour?.languages), [tour]);
  const types = useMemo(() => tourTypes(tour), [tour]);
  const days = useMemo(() => tourItinerary(tour), [tour]);
  const meetingPickup = useMemo(() => splitNotes(tour?.meeting_pickup), [tour]);
  const additionalInfo = useMemo(() => splitNotes(tour?.additional_information), [tour]);
  const gallery = useMemo(() => {
    const urls = (tour?.images || []).map((img) => img.image_url).filter(Boolean);
    if (!urls.length && tour?.image_url) urls.push(tour.image_url);
    return urls;
  }, [tour]);

  const reviews = tour?.reviews || [];
  const avgRating = Number(tour?.avg_rating || 0);
  const operatorName = tour?.creator?.company_name || tour?.creator?.full_name || "Mmondo Tour Operator";
  const photoCount = gallery.length;
  const hero = gallery[0];

  function patchForm(patch) {
    setError("");
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function book(event) {
    event.preventDefault();
    setError("");
    if (!paymentsEnabled) {
      setInquiryOpen(true);
      return;
    }
    setBusy(true);
    try {
      await api("/bookings", {
        method: "POST",
        body: {
          tour_id: Number(id),
          adults: Number(form.adults),
          kids: Number(form.kids),
          tour_date: form.tour_date,
          donate: form.donate,
          special_requirements: form.special_requirements,
        },
      });
      navigate("/payment");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function shareTour() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: tour.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      setShared(false);
    }
  }

  if (error && !tour) return <div className="bg-white min-h-[60vh] p-12 text-center text-error">{error}</div>;
  if (!tour) return <div className="bg-white min-h-[60vh] p-12 text-center">Loading tour…</div>;

  const endPlace = destinations[destinations.length - 1] || "Entebbe";
  const startPlace = destinations[0] || "Entebbe International Airport";
  const pickupItems = meetingPickup.length
    ? meetingPickup
    : [
        "Pickup is available from Entebbe International Airport and selected Kampala hotels.",
        `You can also meet your guide at the tour start in ${startPlace}.`,
        `The tour ends in ${endPlace}. Return transfers can be arranged on request.`,
      ];
  const extraItems = additionalInfo.length
    ? additionalInfo
    : [
        "Confirmation is sent after you book.",
        "A valid passport is required for park entry and gorilla permits.",
        "Pack layers, rain protection, and closed walking shoes.",
        "Expect early starts and some long travel days on Uganda's roads.",
        "Most travellers can participate. See Inclusions for who this tour is not suitable for.",
      ];
  const groupCap = Math.min(Number(tour.max_participants) || 5, 5);
  const bookLabel = tour.reserve_now_pay_later ? "Reserve now" : "Book This Tour";
  const dayCount = durationDays(tour.duration) || days.length || destinations.length || 1;
  const nightCount = Math.max(dayCount - 1, 0);
  const durationLabel = `${dayCount} ${dayCount === 1 ? "Day" : "Days"}${nightCount ? ` / ${nightCount} ${nightCount === 1 ? "Night" : "Nights"}` : ""}`;
  const tripType = types[0] || (tour.live_tour_guide ? "Guided Tour" : "Group Tour");
  const tourCode = `MM-${String(id).padStart(3, "0")}`;
  const locationLabel = tour.country || destinations[0] || "Uganda";
  const groupLabel = `2 – ${groupCap} People`;
  const itineraryDays = itineraryWithDayBadges(
    days.length
      ? days
      : [
          { day: 1, day_from: 1, day_to: 1, title: "Arrival", destination: startPlace, activities: [{ title: "You'll be collected from the airport." }, { title: "Accommodation before the tour starts can be arranged for an extra cost." }] },
          ...(destinations.length ? destinations : ["Uganda"]).map((place, index) => ({
            day: index + 2,
            day_from: index + 2,
            day_to: index + 2,
            title: place,
            destination: place,
            activities: [{ title: `Explore ${place}.` }, { title: "Guided activities with your local tour guide." }],
          })),
          { day: (destinations.length || 1) + 2, day_from: (destinations.length || 1) + 2, day_to: (destinations.length || 1) + 2, title: "Departure", destination: endPlace, activities: [{ title: `The tour ends in ${endPlace}.` }, { title: "Post-tour accommodation can be arranged for an extra cost." }] },
        ]
  );
  const highlights = [];
  const seenHighlight = new Set();
  function addHighlight(title, subtitle) {
    const key = String(title || "").toLowerCase();
    if (!title || seenHighlight.has(key) || highlights.length >= 5) return;
    seenHighlight.add(key);
    highlights.push({ title, subtitle: subtitle && subtitle !== title ? subtitle : "", icon: highlightIcon(title) });
  }
  itineraryDays.forEach((day) => {
    addHighlight(day.title || day.destination, parseActivity(day.activities?.[0]).title);
  });
  destinations.forEach((place) => addHighlight(place, "Destination"));
  if (tour.live_tour_guide) addHighlight("Expert Guide", languages.length ? languages.join(", ") : "Live tour guide");
  const galleryThumbs = gallery.slice(0, 5);
  const activitySummary = highlights.slice(0, 3).map((item) => item.title).join(", ") || tripType;
  const notSuitableFor = [
    "Pregnant travellers",
    "Children under 5 years old",
    "Unaccompanied minors",
    "Travellers who use a wheelchair or cannot walk unaided",
    "People with limited mobility who cannot manage uneven trails, boat transfers, or long vehicle days",
    "Anyone with serious heart, respiratory, or circulatory conditions",
    "Travellers with recent surgery, back or neck injuries, or chronic joint pain",
    "People with a severe fear of heights, water, or enclosed spaces where the itinerary includes those activities",
    "Anyone who cannot travel without daily access to specialised medical care",
  ];
  const stats = [
    ["schedule", "Duration", durationLabel],
    ["location_on", "Location", locationLabel],
    ["groups", "Group Size", groupLabel],
    ["map", "Trip Type", tripType],
    ["tag", "Tour ID", tourCode],
  ];

  return (
    <div className="bg-white text-ink">
      <section className="relative bg-charcoal overflow-hidden">
        {hero ? (
          <img alt={tour.title} className="absolute inset-0 w-full h-full object-cover" src={hero} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/50">
            <Icon name="image" className="text-6xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/50 to-charcoal/20" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop pt-20 pb-12 md:pt-24 md:pb-14">
          <div className="flex items-center justify-end gap-2 mb-3">
            <Link
              aria-label="Add to wishlist"
              className="w-10 h-10 rounded-full bg-white/90 text-charcoal hover:text-primary flex items-center justify-center shadow-sm"
              to={`/wishlist/${id}`}
            >
              <Icon name="favorite" className="text-[20px]" />
            </Link>
            <button
              aria-label="Share tour"
              className="w-10 h-10 rounded-full bg-white/90 text-charcoal hover:text-primary flex items-center justify-center shadow-sm"
              onClick={shareTour}
              type="button"
            >
              <Icon name="ios_share" className="text-[20px]" />
            </button>
          </div>
          {avgRating >= 4 && (
            <span className="inline-flex self-start items-center bg-primary text-white text-[11px] font-semibold tracking-wide uppercase px-3 py-1 rounded-full mb-2">
              Best Seller
            </span>
          )}
          <h1 className="font-headline-md text-[28px] md:text-[36px] leading-tight text-white max-w-3xl">
            {tour.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-white">
            <Stars rating={Math.round(avgRating || 5)} size="text-[18px]" />
            <span className="text-[14px] text-white/90">
              {avgRating ? avgRating.toFixed(1) : "5.0"} ({reviews.length || 0} {reviews.length === 1 ? "review" : "reviews"})
            </span>
            <span className="text-white/50">|</span>
            <span className="inline-flex items-center gap-1 text-[14px] text-white/90">
              <Icon name="location_on" className="text-[16px]" />
              {locationLabel}
            </span>
            {shared && <span className="text-[13px] text-white/80">Link copied</span>}
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop -mt-7 md:-mt-8">
        <div className="max-w-[1200px] bg-white rounded-2xl shadow-[0_18px_40px_-24px_rgba(30,30,30,0.4)] px-2 py-2 md:py-2.5">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-surface-container">
            {stats.map(([icon, label, value]) => (
              <div className="flex items-center gap-2.5 px-3 py-1.5 md:py-0" key={label}>
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name={icon} className="text-[20px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] text-slate-gray">{label}</p>
                  <p className="font-semibold text-[14px] text-charcoal truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop pt-4 pb-10">
        <div className="max-w-[1200px] grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="min-w-0">
            <section id="tour-overview">
              <h2 className="font-semibold text-[18px] text-charcoal mb-1.5">Overview</h2>
              <p className="text-[14px] text-slate-gray leading-snug">
                {tour.description || "Details for this journey are being finalised. Register your interest and our team will share the full itinerary."}
              </p>
            </section>

            {highlights.length > 0 && (
              <section className="mt-4">
                <h2 className="font-semibold text-[18px] text-charcoal mb-2">Trip Highlights</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {highlights.map((item) => (
                    <div className="rounded-xl bg-[#f7f8fa] px-2 py-2.5 text-center" key={item.title}>
                      <span className="mx-auto mb-1 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Icon name={item.icon} className="text-[18px]" />
                      </span>
                      <p className="font-semibold text-[12px] text-charcoal leading-snug">{item.title}</p>
                      {item.subtitle ? <p className="text-[11px] text-slate-gray mt-0.5 line-clamp-1">{item.subtitle}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-5" id="tour-itinerary">
              <h2 className="font-semibold text-[18px] text-charcoal mb-2">Itinerary</h2>
              <div className="mb-3 pb-3 border-b border-surface-container">
                <h3 className="font-semibold text-[14px] text-charcoal mb-0.5">Meeting and pickup</h3>
                <p className="text-[12px] text-slate-gray">Pickup included. Meet your guide at the start of the tour or arrange a hotel/airport transfer.</p>
                <BulletList items={pickupItems} />
              </div>
              <ol>
                {itineraryDays.map((day, index) => {
                  const heading = day.title || day.destination || day.dayBadge;
                  return (
                    <li className="flex gap-3" key={`day-${day.dayFrom}-${heading}`}>
                      <div className="flex flex-col items-center">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                        {index < itineraryDays.length - 1 && <span className="w-px flex-1 bg-surface-container my-0.5" />}
                      </div>
                      <div className={`grid grid-cols-[auto_1fr] gap-x-2 items-start ${index < itineraryDays.length - 1 ? "pb-2.5" : "pb-0"}`}>
                        <span className="inline-flex items-center justify-center whitespace-nowrap bg-primary text-white text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded mt-0.5">
                          {day.dayBadge}
                        </span>
                        <div>
                          <h3 className="font-semibold text-[14px] text-charcoal">{heading}</h3>
                          {day.destination && day.destination !== heading && (
                            <p className="text-[12px] text-slate-gray">{day.destination}</p>
                          )}
                          <ActivityList activities={day.activities} day={day} />
                          {day.accommodation && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-slate-gray">
                              <Icon name="bed" className="text-[16px] text-primary" />
                              Overnight in {day.accommodation}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5" id="tour-inclusions">
              <div>
                <h2 className="font-semibold text-[18px] text-charcoal mb-2">What's Included</h2>
                <div className="space-y-1.5">
                  {included.length ? included.map((item) => <CheckRow included key={item} text={item} />) : (
                    <p className="text-slate-gray text-[14px]">Contact the operator for details.</p>
                  )}
                </div>
                {accommodations.length > 0 && (
                  <div className="mt-3">
                    <h3 className="font-semibold text-[14px] text-charcoal mb-1">Accommodations</h3>
                    <BulletList items={accommodations} />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-[18px] text-charcoal mb-2">What's Not Included</h2>
                <div className="space-y-1.5">
                  {excluded.length ? excluded.map((item) => <CheckRow included={false} key={item} text={item} />) : (
                    <p className="text-slate-gray text-[14px]">Contact the operator for details.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-5" id="tour-reviews">
              <h2 className="font-semibold text-[18px] text-charcoal mb-2">Reviews</h2>
              {reviews.length ? (
                <div className="space-y-3">
                  {reviews.slice(0, 6).map((review) => (
                    <article className="border-b border-surface-container pb-3 last:border-0 last:pb-0" key={review.id}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-label-md text-primary text-[14px]">{(review.user?.full_name || "T")[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-label-md text-charcoal text-[14px] truncate">{review.user?.full_name || "Traveller"}</p>
                          <div className="flex items-center gap-2">
                            <Stars rating={review.rating} />
                            <span className="font-label-md text-[12px] text-charcoal">{review.rating}/5</span>
                          </div>
                        </div>
                        {review.created_at && (
                          <span className="text-slate-gray text-[12px] shrink-0">
                            {new Date(review.created_at).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      {review.comment && <p className="text-[13px] text-charcoal leading-snug">"{review.comment}"</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-slate-gray text-[14px]">No reviews yet. Be the first to share your experience.</p>
              )}
            </section>

            <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <h2 className="font-semibold text-[18px] text-charcoal mb-1.5">Additional information</h2>
                <BulletList items={extraItems} />
              </div>
              <div>
                <h2 className="font-semibold text-[18px] text-charcoal mb-1.5">Not suitable for</h2>
                <BulletList items={notSuitableFor} />
              </div>
            </section>
          </div>

          <aside className="md:sticky md:top-20 space-y-2.5">
            <form
              className="bg-white rounded-2xl border border-surface-container shadow-[0_18px_40px_-24px_rgba(30,30,30,0.35)] p-4 space-y-2.5"
              id="booking-form"
              onSubmit={book}
            >
              <h2 className="font-semibold text-[18px] text-charcoal">Book This Tour</h2>
              {!paymentsEnabled && (
                <p className="text-[12px] leading-snug text-slate-gray">This is an expression of interest, not a booking. No payment is taken online.</p>
              )}

              <label className="block">
                <span className="block text-[12px] font-medium text-slate-gray mb-1">Departure Date</span>
                <span className="relative flex items-center gap-3 border border-surface-container-high rounded-lg px-3 py-2 cursor-pointer">
                  <Icon name="calendar_today" className="text-slate-gray text-[20px]" />
                  <span className="flex-1 font-medium text-[15px] text-charcoal">{formatStartDate(form.tour_date)}</span>
                  <Icon name="expand_more" className="text-slate-gray" />
                  <input
                    className="tour-search-date"
                    id="tour_date"
                    min={today}
                    onChange={(e) => patchForm({ tour_date: e.target.value })}
                    required
                    type="date"
                    value={form.tour_date}
                  />
                </span>
              </label>

              <div>
                <span className="block text-[12px] font-medium text-slate-gray mb-1">Travelers</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 border border-surface-container-high rounded-lg px-3 py-2 cursor-pointer">
                    <span className="flex-1 text-[13px] text-charcoal">Adults</span>
                    <input
                      className="w-10 border-none p-0 text-right focus:ring-0 bg-transparent font-medium text-charcoal"
                      max={groupCap}
                      min={1}
                      onChange={(e) => patchForm({ adults: Number(e.target.value) })}
                      type="number"
                      value={form.adults}
                    />
                  </label>
                  <label className="flex items-center gap-2 border border-surface-container-high rounded-lg px-3 py-2 cursor-pointer">
                    <span className="flex-1 text-[13px] text-charcoal">Children</span>
                    <input
                      className="w-10 border-none p-0 text-right focus:ring-0 bg-transparent font-medium text-charcoal"
                      max={Math.max(0, groupCap - Number(form.adults || 1))}
                      min={0}
                      onChange={(e) => patchForm({ kids: Number(e.target.value) })}
                      type="number"
                      value={form.kids}
                    />
                  </label>
                </div>
              </div>

              <textarea
                className="w-full min-h-[64px] border border-surface-container-high rounded-lg py-2 px-3 text-[13px] text-charcoal bg-white placeholder:text-slate-gray resize-y focus:outline-none focus:border-primary"
                maxLength={500}
                onChange={(e) => patchForm({ special_requirements: e.target.value })}
                placeholder="Special requirements (optional)"
                rows={2}
                value={form.special_requirements}
              />

              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] text-slate-gray">Tour Price</p>
                  <p className="text-[24px] leading-none font-semibold text-charcoal">
                    {tour.price ? formatPrice(tour.price) : "—"}
                    <span className="text-[14px] font-normal text-slate-gray">/{priceUnitPhrase(tour).replace("per ", "")}</span>
                  </p>
                </div>
                <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 pb-1">
                  <Icon fill name="verified" className="text-[16px]" />
                  Best Price Guarantee
                </p>
              </div>

              {error && (
                <p className="text-error text-sm flex items-start justify-between gap-2">
                  <span>{error}</span>
                  <button className="text-error" onClick={() => setError("")} type="button">
                    <Icon name="close" className="text-[16px]" />
                  </button>
                </p>
              )}

              <button className="w-full bg-primary text-white font-label-md text-[15px] py-2.5 rounded-xl hover:bg-primary-container transition-colors" disabled={busy} type="submit">
                {busy ? "Reserving…" : bookLabel}
              </button>

              {paymentsEnabled && tour.reserve_now_pay_later && (
                <p className="text-center text-[13px] text-slate-gray">Secure your spot today. Pay later when you are ready.</p>
              )}

              <div className="space-y-1">
                {tour.free_cancellation && (
                  <p className="flex items-center gap-2 text-[13px] text-slate-gray">
                    <Icon fill name="check_circle" className="text-emerald-600 text-[16px]" />
                    Free cancellation
                  </p>
                )}
                <p className="flex items-center gap-2 text-[13px] text-slate-gray">
                  <Icon fill name="bolt" className="text-emerald-600 text-[16px]" />
                  {paymentsEnabled ? "Instant confirmation" : "We'll contact you"}
                </p>
                <p className="flex items-center gap-2 text-[13px] text-slate-gray">
                  <Icon fill name="support_agent" className="text-emerald-600 text-[16px]" />
                  24/7 customer support
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-[13px] text-charcoal">
                <input checked={form.donate} className="mt-0.5 rounded border-slate-gray text-primary accent-primary" onChange={(e) => patchForm({ donate: e.target.checked })} type="checkbox" />
                Add {formatPrice(10)} conservation donation
              </label>
            </form>

            <div className="bg-white rounded-2xl border border-surface-container p-4">
              <h3 className="font-semibold text-[15px] text-charcoal mb-2">Tour Summary</h3>
              <dl className="space-y-1.5 text-[13px]">
                {[
                  ["Duration", durationLabel],
                  ["Location", locationLabel],
                  ["Group Size", groupLabel],
                  ["Trip Type", tripType],
                  ["Tour ID", tourCode],
                  ["Activities", activitySummary],
                  ["Best Time", "Jun – Aug, Dec – Feb"],
                ].map(([label, value]) => (
                  <div className="flex items-start justify-between gap-3" key={label}>
                    <dt className="text-slate-gray shrink-0">{label}</dt>
                    <dd className="text-charcoal font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <section id="tour-offered-by">
              <h2 className="font-semibold text-[16px] text-charcoal mb-2">Offered By</h2>
              <OperatorCard
                landscape
                operator={{
                  ...(tour.creator || {}),
                  name: operatorName,
                  location: tour.creator?.address || tour.country || destinations[0] || "Uganda",
                  bio: tour.creator?.bio || "Verified local operator on Mmondo Adventures",
                }}
                photos={gallery}
                toursHref={`/tours?q=${encodeURIComponent(operatorName)}#packages`}
              />
            </section>
          </aside>
        </div>

        <section className="mt-5" id="tour-gallery">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[18px] text-charcoal">Gallery</h2>
            {photoCount > 0 && (
              <button className="text-[14px] font-medium text-primary hover:text-primary-container" onClick={() => setGalleryOpen(true)} type="button">
                All Photos
              </button>
            )}
          </div>
          {galleryThumbs.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {galleryThumbs.map((url, index) => {
                const extra = photoCount - galleryThumbs.length;
                const isLast = index === galleryThumbs.length - 1 && extra > 0;
                return (
                  <button
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-high"
                    key={url}
                    onClick={() => setGalleryOpen(true)}
                    type="button"
                  >
                    <img alt="" className="w-full h-full object-contain" src={url} />
                    {isLast && (
                      <span className="absolute bottom-2 right-2 bg-charcoal/80 text-white text-[11px] font-medium px-2 py-1 rounded-full">
                        +{extra} photos
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-gray text-[14px]">Photos for this tour will appear here.</p>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-[18px] text-charcoal">You May Also Like</h2>
              <Link className="text-[14px] font-medium text-primary hover:text-primary-container" to="/tours">
                View All Tours
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {related.map((item) => (
                <TourCard key={item.id} tour={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-variant p-4 z-40 md:hidden flex items-center justify-between">
        <div>
          <span className="font-headline-sm text-headline-sm text-primary">{tour.price ? formatPrice(tour.price) : "—"}</span>
          <span className="text-slate-gray text-[13px] font-label-md"> {priceUnitSuffix(tour)}</span>
        </div>
        {paymentsEnabled ? (
          <a className="bg-primary text-white font-label-md text-label-md px-8 py-3 rounded-full hover:bg-primary-container" href="#booking-form">
            {bookLabel}
          </a>
        ) : (
          <button className="bg-primary text-white font-label-md text-label-md px-8 py-3 rounded-full hover:bg-primary-container" onClick={() => setInquiryOpen(true)} type="button">
            {bookLabel}
          </button>
        )}
      </div>

      <TourInquiryModal
        minDate={today}
        onClose={() => setInquiryOpen(false)}
        open={inquiryOpen}
        people={Number(form.adults || 0) + Number(form.kids || 0)}
        preferredDate={form.tour_date}
        tour={tour}
      />

      {galleryOpen && (
        <div className="fixed inset-0 z-[60] bg-charcoal/95 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-8">
            <div className="flex items-center justify-between mb-6">
              <p className="font-headline-sm text-headline-sm text-white">{tour.title} — All photos</p>
              <button className="text-white hover:text-primary-fixed-dim" onClick={() => setGalleryOpen(false)} type="button">
                <Icon name="close" className="text-[32px]" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(photoCount ? gallery : []).map((url) => (
                <div className="bg-charcoal rounded-xl overflow-hidden flex items-center justify-center min-h-[220px]" key={url}>
                  <img alt={tour.title} className="w-full h-auto max-h-[70vh] object-contain" src={url} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

