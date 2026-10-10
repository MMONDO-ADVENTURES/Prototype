import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { CANCELLATION_POLICY, formatMoney, Icon, priceUnitPhrase, priceUnitSuffix, splitCsv, splitNotes, tourBaseTotal, tourDestinations, tourItinerary, tourTypes } from "../utils";

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
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li className="flex items-start gap-2 text-[14px] leading-relaxed text-charcoal" key={item}>
          <span className="text-slate-gray mt-px shrink-0">›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ItineraryHeading({ title, duration, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-2 mb-1 border-b border-dotted border-outline-variant">
      <div className="flex items-baseline gap-2 min-w-0">
        <Icon fill name="location_on" className="text-primary text-[22px] shrink-0 relative top-[3px]" />
        <h3 className="font-semibold text-[16px] text-charcoal">
          {title}
          {children}
        </h3>
      </div>
      {duration ? (
        <span className="text-[13px] text-slate-gray shrink-0">Duration: {duration}</span>
      ) : null}
    </div>
  );
}

export default function TourDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [today, setToday] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
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
  const sideTop = gallery[1] || gallery[0];
  const sideBottom = gallery[2] || gallery[1] || gallery[0];
  const travelers = Number(form.adults || 0) + Number(form.kids || 0);
  let total = tourBaseTotal(tour, travelers);
  if (form.donate) total += 10;

  function patchForm(patch) {
    setError("");
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function book(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
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

  if (error && !tour) return <div className="bg-surface min-h-[60vh] p-12 text-center text-error">{error}</div>;
  if (!tour) return <div className="bg-surface min-h-[60vh] p-12 text-center">Loading tour…</div>;

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
  const bookLabel = tour.reserve_now_pay_later ? "Reserve now" : "Book now";
  const tabs = [
    ["overview", "Overview"],
    ["itinerary", "Itinerary"],
    ["reviews", "Reviews"],
    ["inclusions", "Inclusions"],
    ["offered-by", "Offered By"],
  ];
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

  return (
    <div className="bg-surface text-ink">
      <main className="max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-6 pb-24 lg:pb-10">
        <nav className="flex text-slate-gray font-label-md text-label-md mb-4">
          <ol className="inline-flex items-center flex-wrap gap-y-1">
            <li><Link className="hover:text-primary" to="/">Home</Link></li>
            <li><Icon name="chevron_right" className="text-[16px] mx-1" /><Link className="hover:text-primary" to="/tours">Tours</Link></li>
            {tour.country && <li><Icon name="chevron_right" className="text-[16px] mx-1" /><Link className="hover:text-primary" to="/tours">{tour.country}</Link></li>}
            <li><Icon name="chevron_right" className="text-[16px] mx-1 text-on-surface-variant" /><span className="text-ink">{tour.title}</span></li>
          </ol>
        </nav>

        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
            <h1 className="font-headline-md text-[28px] md:text-[32px] leading-tight text-charcoal">{tour.title}</h1>
            <div className="flex items-center gap-4 shrink-0 text-charcoal font-label-md text-[14px]">
              <Link className="inline-flex items-center gap-1.5 hover:text-primary" to={`/wishlist/${id}`}>
                <Icon name="favorite" className="text-[20px]" /> Add to wishlist
              </Link>
              <button className="inline-flex items-center gap-1.5 hover:text-primary" onClick={shareTour} type="button">
                <Icon name="ios_share" className="text-[20px]" /> {shared ? "Copied" : "Share"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-charcoal mb-5">
            {avgRating >= 4 && (
              <span className="inline-flex items-center gap-1 font-label-md">
                <Icon fill name="verified" className="text-primary text-[16px]" /> Top rated
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Icon fill name="star" className="text-primary text-[16px]" />
              <span className="font-semibold">{avgRating ? avgRating.toFixed(1) : "5.0"}</span>
            </span>
            <span className="text-slate-gray">({reviews.length || 0} review{reviews.length === 1 ? "" : "s"})</span>
            <span className="text-slate-gray">·</span>
            <span className="text-slate-gray">Activity provider: <span className="text-charcoal font-medium">{operatorName}</span></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start">
            <div className="min-w-0">
              <div className="grid grid-cols-3 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[280px] md:h-[420px] bg-surface-container-high">
                <button className="relative col-span-2 row-span-2 overflow-hidden" onClick={() => setGalleryOpen(true)} type="button">
                  {hero ? (
                    <img alt={tour.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" src={hero} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-gray"><Icon name="image" className="text-5xl" /></div>
                  )}
                </button>
                <button className="relative overflow-hidden" onClick={() => setGalleryOpen(true)} type="button">
                  {sideTop ? (
                    <img alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" src={sideTop} />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center text-slate-gray"><Icon name="photo_camera" /></div>
                  )}
                </button>
                <button className="relative overflow-hidden" onClick={() => setGalleryOpen(true)} type="button">
                  {sideBottom ? (
                    <img alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" src={sideBottom} />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center text-slate-gray"><Icon name="add_photo_alternate" /></div>
                  )}
                  <span className="absolute bottom-3 right-3 bg-white text-charcoal font-label-md text-[13px] px-3 py-1.5 rounded-full shadow-sm">
                    View all
                  </span>
                </button>
              </div>

              <div className="mt-6">
          <div className="flex overflow-x-auto hide-scrollbar border-b border-surface-variant bg-surface-container">
            {tabs.map(([target, label]) => {
              const active = activeTab === target;
              return (
                <button
                  className={`whitespace-nowrap px-4 py-2.5 font-label-md text-[13px] border-r border-surface-variant transition-colors ${
                    active
                      ? "bg-white text-primary border-t-2 border-t-primary -mb-px relative z-10"
                      : "bg-surface-container text-slate-gray hover:text-primary"
                  }`}
                  key={target}
                  onClick={() => setActiveTab(target)}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-t-0 border-surface-variant px-4 py-5 md:px-5 md:py-6">
            {activeTab === "overview" && (
              <div>
                <p className="font-body-md text-[15px] text-charcoal leading-relaxed max-w-3xl mb-6">
                  {tour.description || "Details for this journey are being finalised. Register your interest and our team will share the full itinerary."}
                </p>
                <h3 className="font-semibold text-[16px] text-charcoal mb-3">Tour features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ["schedule", tour.duration || "Flexible", "Duration"],
                    ["groups", `Max ${groupCap} people`, "Group size"],
                    languages.length ? ["translate", languages.join(", "), "Languages"] : null,
                    tour.live_tour_guide ? ["interpreter_mode", "Included", "Live tour guide"] : null,
                    tour.free_cancellation ? ["event_busy", "Up to 3 days before", "Free cancellation"] : null,
                    tour.reserve_now_pay_later ? ["payments", "Hold your dates", "Reserve now, pay later"] : null,
                    types.length ? ["category", types.map((type) => type).join(", "), "Tour types"] : null,
                    destinations.length ? ["map", `${destinations.length} stop${destinations.length === 1 ? "" : "s"}`, "Destinations"] : null,
                    accommodations.length ? ["hotel", accommodations[0], "Accommodation"] : null,
                  ]
                    .filter(Boolean)
                    .map(([icon, value, label]) => (
                    <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-surface-container" key={label}>
                      <Icon name={icon} className="text-primary text-[22px] mt-0.5" />
                      <div>
                        <p className="font-label-md text-charcoal text-[13px] capitalize">{value}</p>
                        <p className="text-slate-gray text-[12px]">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "itinerary" && (
              <div className="space-y-8">
                <p className="flex items-center gap-2 text-[14px] text-charcoal -mt-1">
                  <Icon name="schedule" className="text-primary text-[20px]" />
                  <span><span className="font-semibold">Duration:</span> {tour.duration || "Flexible"}</span>
                </p>
                {days.length ? (
                  days.map((day) => (
                    <div key={`itinerary-${day.day}-${day.title}`}>
                      <ItineraryHeading duration={day.duration} title={day.title || `Day ${day.day}`} />
                      {day.destination && <p className="mt-2 text-[14px] font-medium text-charcoal">{day.destination}</p>}
                      {day.accommodation && <p className="text-[13px] text-slate-gray">Stay: {day.accommodation}</p>}
                      <BulletList items={day.activities?.length ? day.activities : [`Time in ${day.destination || "Uganda"}.`]} />
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <ItineraryHeading duration="Arrival day" title="Arrival" />
                      <BulletList
                        items={[
                          "You'll be collected from the airport.",
                          "Accommodation before the tour starts can be arranged for an extra cost.",
                        ]}
                      />
                    </div>
                    {(destinations.length ? destinations : ["Uganda"]).map((place, index) => (
                      <div key={`${place}-${index}`}>
                        <ItineraryHeading duration="Full day" title={`Day ${index + 1}`} />
                        <p className="mt-2 text-[14px] font-medium text-charcoal">{place}</p>
                        <BulletList items={[`Explore ${place}.`, "Guided activities with your local tour guide."]} />
                      </div>
                    ))}
                    <div>
                      <ItineraryHeading duration="Departure day" title="Departure" />
                      <BulletList items={[`The tour ends in ${endPlace}.`, "Post-tour accommodation can be arranged for an extra cost."]} />
                    </div>
                  </>
                )}
                <div>
                  <h3 className="font-semibold text-[16px] text-charcoal mb-2">Meeting and pickup</h3>
                  <p className="text-[13px] text-slate-gray mb-2">Pickup included. Meet your guide at the start of the tour or arrange a hotel/airport transfer.</p>
                  <BulletList items={pickupItems} />
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                {reviews.length ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 6).map((review) => (
                      <article className="border-b border-surface-container pb-4 last:border-0 last:pb-0" key={review.id}>
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
                        {review.comment && <p className="text-[14px] text-charcoal leading-relaxed">"{review.comment}"</p>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <Icon name="rate_review" className="text-slate-gray text-[36px] mb-2" />
                    <p className="text-slate-gray text-[14px]">No reviews yet. Be the first to share your experience.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "inclusions" && (
              <div className="space-y-7">
                {accommodations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[15px] text-charcoal mb-2">Accommodations</h3>
                    <BulletList items={accommodations} />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-[15px] text-charcoal mb-2">What's included</h3>
                  {included.length ? (
                    <BulletList items={included} />
                  ) : (
                    <p className="text-slate-gray text-[14px]">Contact the operator for details.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-charcoal mb-2">What's excluded</h3>
                  {excluded.length ? (
                    <BulletList items={excluded} />
                  ) : (
                    <p className="text-slate-gray text-[14px]">Contact the operator for details.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-charcoal mb-2">Not suitable for</h3>
                  <p className="text-[14px] text-slate-gray leading-relaxed mb-2">
                    This journey involves long travel days, walking on uneven ground, and limited medical facilities. It is not a good fit for:
                  </p>
                  <BulletList items={notSuitableFor} />
                  <p className="mt-3 text-[13px] text-slate-gray leading-relaxed">
                    If you are unsure whether the tour is right for you, contact us before booking. We can advise on fitness, accessibility, and whether a different departure would suit you better.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "offered-by" && (
              <div>
                <ItineraryHeading title="Offered by" />
                <p className="mt-3 text-[16px] font-semibold text-charcoal">{operatorName}</p>
                {tour.creator?.company_name && tour.creator?.full_name && (
                  <p className="text-[14px] text-slate-gray mt-1">{tour.creator.full_name}</p>
                )}
                <BulletList
                  items={[
                    "Verified local operator on Mmondo Adventures.",
                    "Book through Mmondo for secure payment and traveller support.",
                    tour.creator?.company_link ? `Operator site: ${tour.creator.company_link}` : "Contact us if you need help reaching the operator.",
                  ]}
                />
              </div>
            )}
          </div>
              </div>

          <div className="mt-8 bg-white border border-surface-variant rounded-xl px-4 py-5 md:px-5 md:py-6">
            <h2 className="font-semibold text-[16px] text-charcoal mb-2">Additional information</h2>
            <BulletList items={extraItems} />
          </div>
            </div>

            <aside className="md:sticky md:top-24">
              <form className="space-y-3" id="booking-form" onSubmit={book}>
                <div>
                  <p className="text-[13px] text-slate-gray">From</p>
                  <p className="text-[28px] leading-none font-semibold text-charcoal">
                    ${tour.price ? formatMoney(tour.price) : "—"}
                    <span className="text-[15px] font-normal text-slate-gray"> {priceUnitPhrase(tour)}</span>
                  </p>
                </div>

                <label className="flex items-center gap-3 border border-surface-container-high rounded-xl px-4 py-3 cursor-pointer">
                  <Icon name="person" className="text-slate-gray text-[20px]" />
                  <span className="flex-1 font-medium text-[15px] text-charcoal">Adults × {form.adults}</span>
                  <input
                    className="w-16 border-none p-0 text-right focus:ring-0 bg-transparent font-medium text-charcoal"
                    max={groupCap}
                    min={1}
                    onChange={(e) => patchForm({ adults: Number(e.target.value) })}
                    type="number"
                    value={form.adults}
                  />
                </label>

                <label className="flex items-center gap-3 border border-surface-container-high rounded-xl px-4 py-3 cursor-pointer">
                  <Icon name="child_care" className="text-slate-gray text-[20px]" />
                  <span className="flex-1 font-medium text-[15px] text-charcoal">Children × {form.kids}</span>
                  <input
                    className="w-16 border-none p-0 text-right focus:ring-0 bg-transparent font-medium text-charcoal"
                    max={Math.max(0, groupCap - Number(form.adults || 1))}
                    min={0}
                    onChange={(e) => patchForm({ kids: Number(e.target.value) })}
                    type="number"
                    value={form.kids}
                  />
                </label>

                <label className="relative flex items-center gap-3 border border-surface-container-high rounded-xl px-4 py-3 cursor-pointer">
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
                </label>

                {error && (
                  <p className="text-error text-sm flex items-start justify-between gap-2">
                    <span>{error}</span>
                    <button className="text-error" onClick={() => setError("")} type="button">
                      <Icon name="close" className="text-[16px]" />
                    </button>
                  </p>
                )}

                <button className="w-full bg-primary text-white font-label-md text-[16px] py-3.5 rounded-full hover:bg-primary-container transition-colors" disabled={busy} type="submit">
                  {busy ? "Reserving…" : bookLabel}
                </button>

                <div className="pt-2 space-y-3 text-[14px] text-charcoal">
                <p className="flex items-start gap-2">
                    <Icon fill name="check_circle" className="text-primary text-[20px] shrink-0" />
                    <span>
                      <span className="font-semibold">Free cancellation</span>
                      <span className="block text-slate-gray text-[13px]">{tour.cancellation_policy || CANCELLATION_POLICY}</span>
                    </span>
                  </p>
                {tour.reserve_now_pay_later && (
                  <p className="flex items-start gap-2">
                    <Icon fill name="check_circle" className="text-primary text-[20px] shrink-0" />
                    <span>
                      <span className="font-semibold">Reserve now, pay later</span>
                      <span className="block text-slate-gray text-[13px]">Hold your dates today. Payment can wait until you are ready.</span>
                    </span>
                  </p>
                )}
                {tour.live_tour_guide && (
                  <p className="flex items-start gap-2">
                    <Icon fill name="check_circle" className="text-primary text-[20px] shrink-0" />
                    <span>
                      <span className="font-semibold">Live tour guide</span>
                      <span className="block text-slate-gray text-[13px]">
                        {languages.length ? `Guided in ${languages.join(", ")}.` : "An in-person guide leads this tour."}
                      </span>
                    </span>
                  </p>
                )}
                  <p className="flex items-start gap-2">
                    <Icon fill name="check_circle" className="text-primary text-[20px] shrink-0" />
                    <span>
                      <span className="font-semibold">Secure booking</span>
                      <span className="block text-slate-gray text-[13px]">Reserve your spot today. Total ${formatMoney(total, 2)} for {travelers} traveller{travelers === 1 ? "" : "s"}.</span>
                    </span>
                  </p>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-[13px] text-charcoal pt-1">
                  <input checked={form.donate} className="mt-0.5 rounded border-slate-gray text-primary accent-primary" onChange={(e) => patchForm({ donate: e.target.checked })} type="checkbox" />
                  Add $10 conservation donation
                </label>
                <textarea className="w-full border border-surface-container-high rounded-xl py-2 px-3 font-body-md text-[13px]" maxLength={500} onChange={(e) => patchForm({ special_requirements: e.target.value })} placeholder="Special requirements (optional)" rows={2} value={form.special_requirements} />

                <div className="rounded-2xl bg-surface-container-low px-4 py-3.5">
                  <p className="font-semibold text-[15px] text-charcoal flex items-center gap-1.5">
                    Have booking questions?
                    <Icon name="info" className="text-primary text-[18px]" />
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                    <a className="inline-flex items-center gap-1.5 text-charcoal hover:text-primary-container" href="tel:+2568000436640">
                      <Icon name="call" className="text-primary text-[18px]" />
                      +256 80004 36640
                    </a>
                    <Link className="inline-flex items-center gap-1.5 text-charcoal border-b border-charcoal hover:text-primary-container hover:border-primary-container" to="/contact">
                      <Icon name="chat" className="text-primary text-[18px]" />
                      Chat now
                    </Link>
                  </div>
                </div>
              </form>
            </aside>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-variant p-4 z-40 md:hidden flex items-center justify-between">
        <div>
          <span className="font-headline-sm text-headline-sm text-primary">${tour.price ? formatMoney(tour.price) : "—"}</span>
          <span className="text-slate-gray text-[13px] font-label-md"> {priceUnitSuffix(tour)}</span>
        </div>
        <a className="bg-primary text-white font-label-md text-label-md px-8 py-3 rounded-full hover:bg-primary-container" href="#booking-form">
          {bookLabel}
        </a>
      </div>

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
                <img alt={tour.title} className="w-full h-56 object-cover rounded-xl" key={url} src={url} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
