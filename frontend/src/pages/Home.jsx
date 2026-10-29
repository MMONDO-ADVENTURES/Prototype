import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import NewsletterSignup from "../components/NewsletterSignup";
import TourCard from "../components/TourCard";
import TourSearch from "../components/TourSearch";
import { Icon } from "../utils";

const BIG8 = [
  {
    title: "The Lion",
    subtitle: "King of the Savanna",
    span: "md:col-span-2 md:row-span-2",
    alt: "Tree-climbing lion in Queen Elizabeth National Park",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793294407/Tree_climbing_lion_in_Uganda.svg",
  },
  {
    title: "Mountain Gorilla",
    subtitle: "Gentle Giants",
    span: "md:col-span-2",
    alt: "Mountain gorilla mother",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391526/gabriel-schumacher-kcKJTpYTdIQ-unsplash.svg",
  },
  {
    title: "Leopard",
    alt: "Leopard camouflaged in tall grass",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793300224/Yala_rewards_patience_.svg",
  },
  {
    title: "Elephant",
    alt: "African elephant bull in Murchison Falls",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391515/pexels-rachel-claire-4577507.svg",
  },
  {
    title: "Rhino",
    alt: "White rhinos at Ziwa sanctuary",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793285199/africa_white_rhinos_rhino.svg",
  },
  {
    title: "Chimp",
    alt: "Chimpanzee in Kibale Forest canopy",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391520/max-christian-sMjVNtvYkD0-unsplash.svg",
  },
  {
    title: "Buffalo",
    alt: "Cape buffalo in Lake Mburo National Park",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793297801/download_1.jpg",
  },
];

const DESTINATIONS = [
  { name: "Bwindi", alt: "Bwindi Impenetrable Forest", src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391526/gabriel-schumacher-kcKJTpYTdIQ-unsplash.svg" },
  { name: "Queen Elizabeth", alt: "Kazinga Channel boat safari", src:"https://res.cloudinary.com/yqsld0pd/image/upload/v1793294407/Tree_climbing_lion_in_Uganda.svg" },
  { name: "Murchison Falls", alt: "Murchison Falls on the Nile", src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391523/jonathan-gohner-I2toBB2sBgc-unsplash.svg" },
  { name: "Kibale", alt: "Kibale Forest primate research", src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391520/max-christian-sMjVNtvYkD0-unsplash.svg" },
  { name: "Ziwa", alt: "Rhino at Ziwa sanctuary", src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292050/Ziwa_Rhino_Sanctuary_Full-Day_Small-Group_Tour_from_Kampala_2026_-_BOOK_NOW.svg" },
  { name: "Jinja", alt: "White-water rafting on the Nile in Jinja", src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391518/jackalope-west-nBNROOkE0W8-unsplash.svg" },
];

const STAYS = [
  {
    variant: "hero",
    name: "Clouds Mountain Gorilla Lodge",
    place: "Bwindi, Uganda",
    query: "Bwindi",
    alt: "Clouds Mountain Gorilla Lodge lounge",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793285208/aurelie-sgnl-fMdw9JsMetg-unsplash.svg",
  },
  {
    variant: "mid",
    name: "Chobe Safari Lodge",
    place: "Queen Elizabeth, Uganda",
    query: "Queen Elizabeth",
    alt: "Chobe Safari Lodge infinity pool",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793285207/uzuri-safaris-tanzania-Ti9XCg6QOn4-unsplash.svg",
  },
  {
    variant: "small",
    name: "Wildwaters Lodge",
    place: "Jinja, Uganda",
    query: "Jinja",
    alt: "Wildwaters Lodge boutique safari tents",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793285214/rafael-peier-Gq9DqlF2H7I-unsplash.svg",
  },
];

const HIGHLIGHTS = [
  {
    title: "Rwenzori Mountains",
    place: "Adventure",
    text: "What a trek in the Mountains of the Moon is like, from the trail to the altitude.",
    alt: "Sunrise over the Rwenzori Mountains",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292048/Rwenzori_Mountains__tough_trekking_in_Scenic_Paradise.svg",
  },
  {
    title: "The taste of Luwombo",
    place: "Culture & food",
    text: "Uganda’s royal dish, steamed in banana leaves, and where it is still cooked the traditional way.",
    alt: "Traditional Ugandan luwombo meal",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793286282/Luwombo.svg",
  },
  {
    title: "Guides of Bwindi",
    place: "People",
    text: "The trackers who know the forest, and how they keep a gorilla visit respectful and well run.",
    alt: "Local Ugandan forest guide",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292049/Safari_en_Tanzania_la_aventura_de_tu_vida.svg",
  },
];

const HERO_AVATARS = [BIG8[1].src, BIG8[0].src, DESTINATIONS[0].src];

const HERO_TILES = [
  {
    title: "Gorilla Tracking",
    text: "Walk into Bwindi and experience mountain gorillas up close.",
    alt: "Mountain gorilla in Bwindi Impenetrable Forest",
    src: BIG8[1].src,
  },
  {
    alt: "African elephant on a Ugandan safari",
    src: BIG8[3].src,
  },
  {
    alt: "Tree-climbing lion in Queen Elizabeth National Park",
    src: BIG8[0].src,
  },
  {
    alt: "Hiker at sunrise over the Rwenzori Mountains",
    src: HIGHLIGHTS[0].src,
  },
];

const HERO_HOLD_MS = 6500;

export default function Home() {
  const [tours, setTours] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    api("/tours")
      .then((data) => setTours(data.tours || []))
      .catch(() => setTours([]));
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;
    const next = (heroIndex + 1) % HERO_TILES.length;
    const id = window.setTimeout(() => {
      setHeroIndex(next);
    }, HERO_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [heroIndex]);

  return (
    <div className="bg-surface">
      <section className="relative h-dvh overflow-x-hidden text-white">
        <div className="absolute inset-0 overflow-hidden bg-charcoal">
          {HERO_TILES.map((tile, index) => (
            <img
              alt=""
              className={`hero-bg-image${index === heroIndex ? " is-active" : ""}`}
              key={tile.src}
              src={tile.src}
            />
          ))}
          <div className="absolute inset-0 z-[2] bg-gradient-to-b from-charcoal/60 via-charcoal/30 to-charcoal/50" />
        </div>
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col pt-20 pb-6 md:pt-20 md:pb-8">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-white/85 text-[13px] md:text-[15px] tracking-wide mb-3 md:mb-4">The Pearl of Africa</p>
            <h1 className="font-semibold text-[30px] md:text-[44px] lg:text-[52px] leading-[1.12] tracking-tight max-w-4xl">
              Unforgettable Uganda
              <br />
              Safari Experience
            </h1>
            <div className="mt-6 md:mt-8 w-full relative z-30">
              <TourSearch />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-12 shrink-0">
            <div className="bg-white/15 backdrop-blur-md rounded-[28px] p-6 border border-white/20 w-full max-w-[300px] shrink-0 lg:mb-[4.25rem]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex -space-x-2">
                  {HERO_AVATARS.map((src) => (
                    <img alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/70" key={src} src={src} />
                  ))}
                </div>
                <p className="text-[14px] text-white/90">30+ Travellers Joined</p>
              </div>
              <p className="text-[14px] leading-relaxed text-white/90 mb-6">
                Travel through savanna landscapes, golden skies, and timeless beauty with expertly guided Uganda tours.
              </p>
              <Link
                className="inline-flex items-center gap-2 bg-white text-charcoal hover:bg-primary hover:text-white transition-colors rounded-full px-5 py-2.5 font-medium text-[14px]"
                to="/tours#packages"
              >
                Book Now
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>

            <div className="hero-tiles min-w-0 flex-1">
              <div className="hero-tiles-inner">
                {HERO_TILES.map((tile, index) => {
                  const active = index === heroIndex;
                  return (
                    <div className={`hero-tile-card${active ? " is-active" : ""}`} key={tile.alt}>
                      <button
                        aria-label={`Show ${tile.alt}`}
                        aria-pressed={active}
                        className="block p-0 border-0 bg-transparent"
                        onClick={() => setHeroIndex(index)}
                        type="button"
                      >
                        <img alt={tile.alt} className="hero-tile" src={tile.src} />
                      </button>
                      {tile.title ? (
                        <div className="mt-3 max-w-[220px]">
                          <p className="font-medium text-[15px] leading-snug">{tile.title}</p>
                          <p className="text-[13px] text-white/75 leading-snug mt-1">{tile.text}</p>
                        </div>
                      ) : (
                        <div className="hidden lg:block h-[4.25rem]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-margin-mobile md:px-margin-desktop overflow-hidden" id="featured-tours">
        <div className="max-w-[1440px] mx-auto mb-8 flex flex-wrap gap-4 justify-between items-end">
          <div>
            <h2 className="font-headline-md text-headline-md text-charcoal">Popular tours right now</h2>
            <p className="text-secondary font-body-md">
              {tours.length ? `${tours.length} hand-picked experiences from our local community` : "Hand-picked by our local community"}
            </p>
          </div>
          <Link className="text-primary font-label-md hover:underline" to="/tours#packages">View all tours</Link>
        </div>
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tours.slice(0, 8).map((tour) => (
            <TourCard key={tour.id} large tour={tour} />
          ))}
          {!tours.length && (
            <div className="w-full text-center py-16 border border-surface-variant rounded-xl bg-surface-container-lowest">
              <Icon name="explore" className="text-6xl text-slate-gray mb-4" />
              <h3 className="font-headline-sm text-headline-sm text-charcoal mb-2">No tours available</h3>
              <p className="text-secondary font-body-md">Check back soon for new adventures!</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-14 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto mb-8 text-center">
          <h2 className="font-bold text-[28px] md:text-[36px] text-charcoal">Uganda's Big 8</h2>
          <p className="text-secondary font-body-lg">The definitive list of flagship experiences</p>
        </div>
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
          {BIG8.map((item) => (
            <div className={`relative group overflow-hidden rounded-xl ${item.span || ""}`} key={item.title}>
              <img alt={item.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={item.src} />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
              <div className={item.subtitle ? "absolute bottom-6 left-6" : "absolute bottom-4 left-4"}>
                <h4 className={item.subtitle ? "text-white font-headline-sm text-headline-sm" : "text-white font-label-md text-lg"}>{item.title}</h4>
                {item.subtitle && <p className="text-primary-fixed font-label-md">{item.subtitle}</p>}
              </div>
            </div>
          ))}
          <Link className="relative group overflow-hidden rounded-xl block" to="/blogs">
            <img alt="Ugandan marketplace filled with tropical fruits" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://res.cloudinary.com/yqsld0pd/image/upload/v1791391521/ivan-sabayuki-2WmVYrCwEKg-unsplash.svg" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h4 className="text-white font-label-md text-lg">Culture</h4>
            </div>
          </Link>
        </div>
      </section>

      <section className="py-14 px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-headline-md text-headline-md text-charcoal">How it works</h2>
            <div className="w-24 h-1 bg-primary mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[
              ["travel_explore", "1. Choose your adventure", "Browse hundreds of curated tours and safaris from verified local operators."],
              ["event_available", "2. Instant booking", "Secure your dates instantly with transparent pricing and no hidden fees."],
              ["forest", "3. Experience Uganda", "Travel with confidence knowing you have 24/7 local support and verified guides."],
            ].map(([icon, title, text]) => (
              <div className="text-center px-4" key={title}>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-surface-container">
                  <Icon name={icon} className="text-primary text-3xl" />
                </div>
                <h4 className="font-headline-sm text-headline-sm text-charcoal mb-4">{title}</h4>
                <p className="text-secondary font-body-md">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="font-headline-md text-headline-md text-charcoal mb-8">Trending destinations</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-gutter">
            {DESTINATIONS.map((place) => (
              <Link className="group" key={place.name} to={`/tours?q=${encodeURIComponent(place.name)}#packages`}>
                <div className="aspect-square rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-primary transition-all">
                  <img alt={place.alt} className="w-full h-full object-cover" src={place.src} />
                </div>
                <p className="text-center font-label-md text-charcoal">{place.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-margin-mobile md:px-margin-desktop bg-surface-container-low" id="stays">
        <div className="max-w-[1440px] mx-auto mb-10">
          <h2 className="font-headline-md text-headline-md text-charcoal">Stays included</h2>
          <p className="text-secondary font-body-lg">Premium lodges and boutique camps in the heart of the wild</p>
        </div>
        <div className="stays-mosaic max-w-[1440px] mx-auto">
          {STAYS.map((stay) => {
            const caption = (
              <>
                <h3 className="stay-card-title">{stay.name}</h3>
                <p className="stay-card-place">
                  <Icon name="location_on" className="stay-card-pin" fill />
                  {stay.place}
                </p>
              </>
            );
            return (
              <Link
                className={`stay-card stay-card--${stay.variant} group`}
                key={stay.name}
                to={`/tours?q=${encodeURIComponent(stay.query)}#packages`}
              >
                <div className="stay-card-media">
                  <img alt={stay.alt} src={stay.src} />
                  {stay.variant !== "small" ? <div className="stay-card-copy">{caption}</div> : null}
                </div>
                {stay.variant === "small" ? <div className="stay-card-caption">{caption}</div> : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="py-10 px-margin-mobile md:px-margin-desktop bg-surface-container-low border-b border-surface-container">
        <div className="max-w-[1440px] mx-auto flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-80">
          {[
            ["verified_user", "100% Secure Payment", "PCI-DSS compliant booking"],
            ["support_agent", "Local Support", "24/7 help in Uganda"],
            ["eco", "Ethical Tourism", "Supporting local communities"],
            ["thumb_up", "Hand-picked", "Only the best experiences"],
          ].map(([icon, title, text]) => (
            <div className="flex items-center gap-3" key={title}>
              <Icon name={icon} className="text-primary text-4xl" />
              <div>
                <h5 className="font-label-md text-charcoal">{title}</h5>
                <p className="text-xs text-secondary">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 px-margin-mobile md:px-margin-desktop bg-white">
        <div className="max-w-[1440px] mx-auto mb-8 flex flex-wrap gap-4 justify-between items-end">
          <div>
            <h2 className="font-headline-md text-headline-md text-charcoal">Blogs from Uganda</h2>
            <p className="text-secondary font-body-md">Short reads on places, food, and people</p>
          </div>
          <Link className="text-primary font-label-md text-[14px] hover:text-brand-secondary inline-flex items-center gap-1" to="/blogs">
            More blogs
            <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {HIGHLIGHTS.map((card) => (
            <Link
              className="group bg-white rounded-2xl overflow-hidden border border-surface-container shadow-[0_8px_24px_-18px_rgba(30,30,30,0.35)] hover:border-primary/30 transition-colors flex flex-col"
              key={card.title}
              to="/blogs"
            >
              <div className="aspect-[16/10] overflow-hidden bg-charcoal">
                <img
                  alt={card.alt}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                  src={card.src}
                />
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
                <p className="text-[11px] tracking-[0.16em] uppercase text-primary font-label-md">{card.place}</p>
                <h3 className="font-headline-sm text-[18px] text-charcoal mt-2 leading-snug">{card.title}</h3>
                <p className="text-[14px] text-secondary mt-2 leading-relaxed">{card.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-14 px-margin-mobile md:px-margin-desktop bg-white">
        <div className="max-w-[1440px] mx-auto">
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
