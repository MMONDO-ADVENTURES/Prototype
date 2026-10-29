import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import OperatorCard from "../components/OperatorCard";
import { Icon } from "../utils";

export default function TourOperators() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/tours")
      .then((data) => setTours(data.tours || []))
      .catch(() => setTours([]))
      .finally(() => setLoading(false));
  }, []);

  const operators = useMemo(() => {
    const grouped = new Map();
    tours.forEach((tour) => {
      const creator = tour.creator || {};
      const name = creator.company_name || creator.full_name;
      if (!name) return;
      const key = String(creator.id || name);
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          name,
          full_name: creator.full_name,
          company_name: creator.company_name,
          company_link: creator.company_link,
          email: creator.email,
          phone: creator.phone,
          picture: creator.picture,
          bio: creator.bio,
          created_at: creator.created_at,
          address: creator.address,
          location: creator.address || tour.country || "Uganda",
          photos: [],
          tours: [],
        });
      }
      const entry = grouped.get(key);
      entry.tours.push(tour);
      if (!entry.picture) entry.picture = creator.picture;
      if (!entry.phone) entry.phone = creator.phone;
      if (!entry.location || entry.location === "Uganda") entry.location = creator.address || entry.location || tour.country || "Uganda";
      const urls = [tour.image_url, ...(tour.images || []).map((image) => image.image_url)].filter(Boolean);
      entry.photos.push(...urls);
    });
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [tours]);

  return (
    <div className="w-full bg-surface">
      <section className="relative w-full h-[420px] md:h-[520px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/yqsld0pd/image/upload/v1793285204/roman-derrick-okello-kHzomTLWuAQ-unsplash.svg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/35 to-charcoal/80" />
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col justify-end pb-12 md:pb-16">
          <h1 className="font-display-lg text-[32px] md:text-[44px] leading-[1.15] text-white max-w-3xl">Tour operators on Mmondo</h1>
          <p className="font-body-lg text-surface-container-highest max-w-2xl mt-3">
            Book with verified Ugandan companies. Every listing is hosted by an operator who runs the journey on the ground.
          </p>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16 scroll-mt-16" id="operators">
        {loading ? (
          <p className="text-center text-secondary py-16">Loading operators…</p>
        ) : operators.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {operators.map((operator) => (
              <OperatorCard
                key={operator.id}
                operator={{
                  ...operator,
                  bio: operator.bio || `${operator.tours.length} tour${operator.tours.length === 1 ? "" : "s"} on Mmondo`,
                }}
                photos={operator.photos}
                toursHref={`/tours?q=${encodeURIComponent(operator.name)}#packages`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-surface-container">
            <Icon name="groups" className="text-slate-gray text-[40px] mb-3" />
            <p className="text-charcoal font-headline-sm mb-2">Operators are joining soon</p>
            <p className="text-secondary text-[14px] mb-6">List your company and start receiving bookings from travellers.</p>
            <Link className="inline-flex bg-primary text-white font-label-md px-6 py-3 rounded-full hover:bg-primary-container" to="/operator#register-section">
              Become a tour operator
            </Link>
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-charcoal text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-headline-sm text-[22px]">Are you a tour operator?</h2>
            <p className="text-white/75 mt-2 max-w-xl">Create a company account, list your itineraries, and let travellers find you on Mmondo Adventures.</p>
          </div>
          <Link className="shrink-0 bg-primary text-white font-label-md px-6 py-3 rounded-full hover:bg-primary-container text-center" to="/operator#register-section">
            Become a tour operator
          </Link>
        </div>
      </section>
    </div>
  );
}
