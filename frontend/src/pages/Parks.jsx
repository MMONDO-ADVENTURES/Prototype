import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../utils";

const HERO_HOLD_MS = 5500;

const PARKS = [
  {
    name: "Bwindi Impenetrable National Park",
    query: "Bwindi",
    region: "Southwest Uganda",
    highlight: "Mountain gorilla trekking in ancient rainforest",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292057/Bwindi_Impenetrable_National_Park_Wallpaper.svg",
  },
  {
    name: "Queen Elizabeth National Park",
    query: "Queen Elizabeth",
    region: "Western Uganda",
    highlight: "Tree-climbing lions, Kazinga Channel boat safaris",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793294407/Tree_climbing_lion_in_Uganda.svg",
  },
  {
    name: "Murchison Falls National Park",
    query: "Murchison",
    region: "Northwest Uganda",
    highlight: "The Nile exploding through a 7-metre gorge",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391523/jonathan-gohner-I2toBB2sBgc-unsplash.svg",
  },
  {
    name: "Kibale National Park",
    query: "Kibale",
    region: "Western Uganda",
    highlight: "Chimpanzee tracking in Uganda’s primate capital",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391520/max-christian-sMjVNtvYkD0-unsplash.svg",
  },
  {
    name: "Lake Mburo National Park",
    query: "Lake Mburo",
    region: "Western Uganda",
    highlight: "Zebras, lakeshores, and walking safaris",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292054/Beautiful_Zebra_safaris.svg",
  },
  {
    name: "Kidepo Valley National Park",
    query: "Kidepo",
    region: "Northeast Uganda",
    highlight: "Remote wilderness and big-sky savannah",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292052/0.svg",
  },
  {
    name: "Rwenzori Mountains National Park",
    query: "Rwenzori",
    region: "Western Uganda",
    highlight: "The Mountains of the Moon and glacial peaks",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791389600/cld-sample-2.jpg",
  },
  {
    name: "Mgahinga Gorilla National Park",
    query: "Mgahinga",
    region: "Southwest Uganda",
    highlight: "Volcano hiking and golden monkeys",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292056/Bwindi_Impenetrable_National_Park_Uganda.svg",
  },
];

export default function Parks() {
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;
    const id = window.setTimeout(() => {
      setHeroIndex((index) => (index + 1) % PARKS.length);
    }, HERO_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [heroIndex]);

  const activePark = PARKS[heroIndex];

  return (
    <div className="w-full bg-surface">
      <section className="relative w-full h-[420px] md:h-[560px] overflow-hidden bg-charcoal text-white">
        <div className="absolute inset-0 overflow-hidden bg-charcoal">
          {PARKS.map((park, index) => (
            <img
              alt=""
              className={`hero-bg-image${index === heroIndex ? " is-active" : ""}`}
              key={park.src}
              loading={index === 0 ? "eager" : "lazy"}
              src={park.src}
            />
          ))}
          <div className="absolute inset-0 z-[2] bg-gradient-to-b from-charcoal/65 via-charcoal/20 to-charcoal/80" />
        </div>
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col justify-end pb-12 md:pb-16">
          <p className="font-label-md text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-primary mb-3">
            {activePark.name}
          </p>
          <h1 className="font-display-lg text-[32px] md:text-[44px] leading-[1.15] text-white max-w-3xl">
            Uganda’s parks, ready for your next safari
          </h1>
          <p className="font-body-lg text-white/85 max-w-2xl mt-3">
            From gorilla forests to the Nile, explore the parks our operators know best and jump straight into matching
            tours.
          </p>
          <div className="flex items-center gap-2 mt-6" role="tablist" aria-label="Park photos">
            {PARKS.map((park, index) => (
              <button
                aria-label={`Show ${park.name}`}
                aria-selected={index === heroIndex}
                className={`h-1.5 rounded-full transition-all ${
                  index === heroIndex ? "w-8 bg-primary" : "w-2.5 bg-white/45 hover:bg-white/80"
                }`}
                key={park.query}
                onClick={() => setHeroIndex(index)}
                role="tab"
                type="button"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16 scroll-mt-16" id="parks">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PARKS.map((park) => (
            <article
              className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_24px_-12px_rgba(30,30,30,0.18)] flex flex-col scroll-mt-20"
              id={`park-${park.query.toLowerCase().replace(/\s+/g, "-")}`}
              key={park.name}
            >
              <div className="aspect-[4/3] overflow-hidden bg-charcoal">
                <img alt={park.name} className="w-full h-full object-cover object-center" src={park.src} />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-[13px] text-primary font-label-md">{park.region}</p>
                <h2 className="font-headline-sm text-[18px] text-charcoal mt-1 leading-snug">{park.name}</h2>
                <p className="text-[14px] text-secondary mt-2 flex-1">{park.highlight}</p>
                <Link
                  className="mt-4 inline-flex items-center gap-1 text-primary font-label-md text-[14px] hover:text-brand-secondary"
                  to={`/tours?q=${encodeURIComponent(park.query)}#packages`}
                >
                  View tours <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
