import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
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
          link: creator.company_link,
          image: tour.image_url || tour.images?.[0]?.image_url,
          tours: [],
        });
      }
      const entry = grouped.get(key);
      entry.tours.push(tour);
      if (!entry.image) entry.image = tour.image_url || tour.images?.[0]?.image_url;
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
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBDE26FgCKHPsjFiQI-0kuNFBaDjWlw7d-jSAiQyQ5QXPsvrkrDO45cr90y9xOoFzJDZbM8hyJ71gCI6rQa_6EtdxTKDpibsiVqr4SdrsOzuPXB4Gr0-AhK-Og1re4zTYzrREudkS9UhCOW8z2Lfc1EA5hb7OmxesTNl87SzZun-ay8aTWdtfAyJcbnqkuTT8osHkhO8yPMo0Uc3B0GjVfiMk64CyAixG0WfzdXzwjJLgysQtw1si4c')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/45 to-transparent" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {operators.map((operator) => (
              <article className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_24px_-12px_rgba(30,30,30,0.18)] flex flex-col" key={operator.id}>
                <div className="h-40 bg-surface-container-high overflow-hidden">
                  {operator.image ? (
                    <img alt="" className="w-full h-full object-cover" src={operator.image} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-gray">
                      <Icon name="apartment" className="text-4xl" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-headline-sm text-[18px] text-charcoal">{operator.name}</h2>
                  <p className="text-[14px] text-secondary mt-1">
                    {operator.tours.length} tour{operator.tours.length === 1 ? "" : "s"} on Mmondo
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      className="inline-flex items-center gap-1 bg-primary text-white font-label-md text-[13px] px-4 py-2 rounded-full hover:bg-primary-container"
                      to={`/tours?q=${encodeURIComponent(operator.name)}#packages`}
                    >
                      View tours
                    </Link>
                    {operator.link && (
                      <a
                        className="inline-flex items-center gap-1 text-primary font-label-md text-[13px] hover:text-brand-secondary"
                        href={operator.link}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Website <Icon name="open_in_new" className="text-[14px]" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
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
