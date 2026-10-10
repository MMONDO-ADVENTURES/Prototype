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
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbLjL_99iU6y5ZUE7DeABMYFHb_K8BwNPP1LjZErzjI1GQ1_duQeQy5GBlFUHKGH-KngJLmeTU55HPNL1EI7cBm9tgOP9R2uFBo2ubudM6vioLn_LBdGv1ez6DO24pKEIxBkFnw8i9FmPCOLksOhjzy-Sw2cx-pF37cPCmCasQov2V6LN9W24ERB8aAPJxj4vvn6d9p7Zpiha2DKpCfOI4dZRfJ8pd3UPxVoxMIHlvmLZpDNhiHv7g",
  },
  {
    title: "Mountain Gorilla",
    subtitle: "Gentle Giants",
    span: "md:col-span-2",
    alt: "Mountain gorilla mother and infant",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMpb3JBsGnLht1JEdtCHkQme_HYRRhTBsCjgIlA8FVzvdv-odrD0A2m1kzIjhhiUMcVgOUwdho_aiQ6_3dAA3_Z1LGYrrxxzLg0YeFIwYJdmKKA-9uo7tVoocGHfCod8DyT-5Gd5DI3dLbWRtVwG_etlBByt3_UfbD8-SPDo4hdMv3CXiu9XTrgNjH3pKz-i4szyTQVyyjKd7qn_HJPRRNK6ymOBvVDq7ZwlUntncY8Wkp50JkMThM",
  },
  {
    title: "Leopard",
    alt: "Leopard camouflaged in tall grass",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLAz9P05b9p87Py5vN-eGld69tMHjSH_owDwUQC9oYzMj89saIo5CjDs5qPnbAkYJX_dzjVMHNCrG6HiL9dtGvHgpNEGsyD2z9fxdh3NUqoiZPZFFUVJ9yGdfEPg6cH0AgVBc6IhFRQl-eo9atGbd7_crksmDMsAzkDEYzBm94UkdMokTGFNQEgMwwGYEV_uNHoTi-Xxit8KTiWUVBalykzS8bA4bAPEepMw2kiIjM9zTuE8_OxhDq",
  },
  {
    title: "Elephant",
    alt: "African elephant bull in Murchison Falls",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqMhLL1revPHnMo9ClK5oauq0KKnJP01pgUdsbNnneTDnVzVbJMrds8iaQFSbJQ6jV_G3ehXyVA47X5L8r5aQXez3Sq2JHIJVL4GT2LObExZS0npgPN7uc9yLjequ0LGgUlcQ6A7unjKKyzbxcHRhL249pUTKyhE0m0yJtJNzoYsiUhinsv1KVjiE8stDoPlHKyADMR0ZWarbXoP7u-5YB6WwbXqHjBpPGJ6lMj9a_sHDvJd2viwW1",
  },
  {
    title: "Rhino",
    alt: "White rhinos at Ziwa sanctuary",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4vslHFQAtSCVuTgx20faVdAM-a5sDa6r2is8iczeB6Bllj7QyElxgt1-3coXS6BZXNnW0lazZja3EmagZ6n4yv4WMx-DhEq-JDho-9a-tUp5SrNjaDPtjPjyfE8VNUZ0PaxnjyPztuimj3jzkxVq178PjVh8qgRc6RsOnKA2Akkxeuqg9Qk5p70Cc6KxxhIIxEMpKq0JXUTMZwvF1WofxXjG0kHmAY79iY7Ic0yfbGL9UAA0IXOxq",
  },
  {
    title: "Chimp",
    alt: "Chimpanzee in Kibale Forest canopy",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAl9WEKyHmZ_ZEd0BHBiver4_5sbLbZfC_KQuPi5C5LOhFNO_TZ3wPG3IHdvyw9ubFy8gdgo94_xppqZOdu3o3AfRKAVkYlsoEc0GvmicKmtDwxLypVzkY5RE2v3rhmeVJ16oJeJ6gu23kX7811aCPFOv9cwi8sRU3OD4fpefcy9aGTLLJnoWvyo3eMDjFiS9QwqA86rHyOXxtiz6xBXQaKGcd8xpJE2QXtgWpBM-wpmdZ3P-LBgigQ",
  },
  {
    title: "Buffalo",
    alt: "Cape buffalo in Lake Mburo National Park",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-7YRpEFjv9JY3lmXmUN6iTlU2CaRvCbo9y0NvQXpoVaP_5yOAXDo5IzY8fkuk708x4b7Jru54C_PXD5qehQzRvnRFHsEUY-q1_p_dg0_iLRcRbDCMl_mLTV-jsCEr2PZYf0ue1SSqkrCKtezOEnYgYU7uZ7kfRYBGTCIw86rixXKP9-KYnLKHcLJcTq-P31yq1ULCvVTnUD7yFQ-xg_gMkiE-S6oWmUr1WeejfIRIGoBiFkQhLgGQ",
  },
];

const DESTINATIONS = [
  { name: "Bwindi", alt: "Bwindi Impenetrable Forest", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuApn7rFpt9NbpMfMERtDlpRIu1ZgZtovagTuk9_-KooccfEtgPpjJJM4Csb4z7YxM0G3oSCJkjO2A6_jAZwD_dTM54taOBDob3ZGcWEzfthMvUzaNSWuRCjlvD4UmnMsobWw2ypeibuCrW7QzUPuC4wLl_akk4epyHY2ASppCxDrFLceRzaNhPTff-PJxcCIBYeEfV65H8pqFX2XbANAwhZjWK4m9IheNEuLzFQVjg6PWw1OU450RUM" },
  { name: "Queen Elizabeth", alt: "Kazinga Channel boat safari", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAc2PnvLGEF6BJS4c9VOAAHmr_lO25h4nntrjD-Iws3zz2Jw-gaxfWtVpeFuwNTyN7JDD9f15lC6bjxKmdRcVm3UJMULM7A2OJZoSSTnIP29imm1CBtwppTFENrmbLfpXP6rdR4qY1FXuioA-agn4UCUSQXmFwZBcwIjV0G8NvOptyEPqn0FLZLUHH59-vjSWTGkiI2l_iQplpeLcypT90aTDvIZSJMW572E072n8zGHXktq-uV2AL" },
  { name: "Murchison Falls", alt: "Murchison Falls on the Nile", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvGcHmyQD7B_W2bCsJ4IjlY0GWjH3b8J1k0gnVrR58gdHyYBwxtzTtYa0e9UvoU1UiYEosEWdPRxgoUGQ-ECHVuNW_oQfkodYU1Zg1uu26LgHgl83acs1NyQ-ABylvMgnYNWd7D9s_MHnrq0Ezx2mBwjVKK7dvKlGf3Baisxcuh1OotsoDC20vM_QT6xW2sgy-CmnG5fUCMW0PWOTWtIJ0H_0wspiitGwBqqwWZ8Biu38RP83iVERx" },
  { name: "Kibale", alt: "Kibale Forest primate research", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWJYc9mew16doeOiDGPpG0Kn9CKTsELBcqiD4Jg4dTqvaUqDunwtd5IV0-4zDxNzeD_kPYRwODhN8bKUnv5vxaSevwL5JwLCYSfviJ00TQLYkOJSrH3d_SNi4JONDvAmzyYfs8mt1f6__N4Y92gidihPcn3W0vSFauqgPeCV0-7g88ceOYI1xuTSeVt35CyNivlkdQbh2kMVaXP0qdAxvR7bA2PEaU4bW9Pr7OmvZGKUWdzS4wHseu" },
  { name: "Ziwa", alt: "Rhino at Ziwa sanctuary", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoUxU7ionz9ORerfIbwET3Y4_KqJqbtsZh-fzAE2OA2q2MvRJ4NtG6GF0qJo-rTJ7m_XRXSu7Fkb3TOnQZbhMtcQqtNgA3Ta8O7bEGXXYDpBXHZP-f70GpH5tVV-Y4lPxIEDYcXoK1dQ7d7mhOxKIOeC2Oggfppbi2NUKRbbhbKbfH9o8VJtuVqGSAwFGj5M-TkWiCD4sGNRVVl2Cx380DTdRhdhLk0LvxTKNlGIElyd64W2Pb2fe6" },
  { name: "Jinja", alt: "White-water rafting on the Nile in Jinja", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYld_0YlnGPfFDSKhSXYlSUvbfxB5mFs31SpXoAd0AL0WYw7wThm3GSx4ltMs7JMQg_hVYw1v8Y90NLAa6tlvGfWh_2aKl6jm6BhKDEhof-z_zPkC-q6732K0_2UEk1Vn7s1WpFchJS9V0onQntMGSWcIuXc7aWuRv3dz-k3_eKPsY1pSnsf_evknpOjvuCyjgyD2nTKQOJVc_6iOVTjpHDYPf3jkRXnWiD7LrtIm2NjGCapmnQ5x" },
];

const STAYS = [
  {
    variant: "hero",
    name: "Clouds Mountain Gorilla Lodge",
    place: "Bwindi, Uganda",
    query: "Bwindi",
    alt: "Clouds Mountain Gorilla Lodge lounge",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHQXA2sgdt2AnHvSUcqftqsdTn6mSjTNhxqeYUDQeHC9un7Knqefz3aim-QxuILfBQ5fZcaz3wXmABE5sY9WMp1sdPcm3GgiMAegd-Z26wkcsiHxuC1sMwY0W2rjhe9ecSss-y49uvDEdb6jV-d4P9sSn2ZrI8qr_V0IP2m-n7WcbLTxefuTYSl3bWdqiAHyd3WwTmoWJZRuCzGHN6j-e1q6AX5LfGmWVViI5yEZKz6LS82W7jNEx9",
  },
  {
    variant: "mid",
    name: "Chobe Safari Lodge",
    place: "Queen Elizabeth, Uganda",
    query: "Queen Elizabeth",
    alt: "Chobe Safari Lodge infinity pool",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrznXkMVNUgfwpuKFNzOvGofvPLFUrS7A4sku1a-iR9ZiawSb00IT5pkevmJKeARB93J-b6Hc_blDHk5Rm7gsS4R4ZbkqNwfZK3JPVKMkG0fuXF4r3QGor8YCmUwAJdGfZp4eE0Ank2Tthh3BdcumULhpXcAreMqWoCc-0RJY632l1fuy4LKZIrmgVqgcBprOKN8NwiHufrqKgpnxaxfParSXp5HMuEeAhrhkewxy06RJ3DGpZbuAO",
  },
  {
    variant: "small",
    name: "Wildwaters Lodge",
    place: "Jinja, Uganda",
    query: "Jinja",
    alt: "Wildwaters Lodge boutique safari tents",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAtRULLQGmAhtYoBBLeS8C_-3XBZnCmdSeWfBrvlpcCTFgogyEY_Y05zOf_f5x2L6ATCEMTVnTlvDR6hCZ8YzUZaOHfr-9ANnW-G3avHqqWojR1ZlYzhmyZyJPj9_K6vuql9aaZZcrjGqDVAv6rMKQEknedaAPp0VrEmx_j7N6pb1Bru9tLntwx6YRPAane67asgNfsJP4tmVho5lhF1n5rAHTqb5EnjxLnhZtSdl4W4SCoOWQMXrrb",
  },
];

const STORIES = [
  {
    tag: "Adventure Guide",
    title: "Climbing the Mountains of the Moon: What to expect",
    text: "A comprehensive guide to trekking the Rwenzori Mountains, from gear lists to mental preparation for the high-altitude journey.",
    meta: "Oct 12, 2023 · 8 min read",
    alt: "Sunrise over the Rwenzori Mountains",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYu_TtBryPr_Zx_1zglmcL3uAraW_30Xx1sqihGmyVLdF_YHgD572TayeqSFZoLgO2zBudmAJYo9hxnALFQ_8w-tMGTyBjq0t0Gxr2i8g1i8nci30Qd9xliAyugMAJaEp3SiEYLkolKpuvFTK4NEna8UFOLje7nUfpargr9duB-Mvq7OAesjo_MP3nUc7Rl8Dx5r1oWTnxD9N4U9q7nb939U6KGk9wQyaQfAytbwMxJxUMfoZUsZxY",
  },
  {
    tag: "Culture & Food",
    title: "The taste of Buganda: A journey through Luwombo",
    text: "Exploring the history and ritual behind Uganda's most iconic royal dish, and where to find the best authentic versions today.",
    meta: "Sep 28, 2023 · 5 min read",
    alt: "Traditional Ugandan luwombo meal",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBfzprXzTuTVG3UKUzhoh_heJzxgvOKVifZPzHdIQL46PEXOg71vtB8NGfJuLAIzK35XkWtfFvAqfwXPqosasuBkLKr86VFrx9nUR53CDBfeR6nnIkcJHSjbZzaTlj9tueaxn9ftrD5QzBf1UHSeszB0Fut8awloEOz9bbTEsrX-4-J81j1V_P0Os_BkzX3PNRSoGH_sLc9qnOEO1_OwPjYhAtclCd_nTcKfl606Q1HpCc_nojeej--",
  },
  {
    tag: "Expert Voices",
    title: "Meet the guides: David's 15 years in Bwindi",
    text: "An interview with David, one of our most experienced tracking guides, about the changing faces of gorilla conservation.",
    meta: "Sep 15, 2023 · 12 min read",
    alt: "Local Ugandan forest guide",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPpEj3hEx6avTRhM8vf1BZK9_Yj1MiwoWSwMZt0mw6P1-pulAUpkDuNUWtVyTbiWUBzjotIEcTth8Sf2CYrLDm9WgRFdL6GGOPMUBkO-Z_HPUs9o8WzFOJwNaqxboP1L49oxdrTq-3pfVyEGUYfwqS_t_LsDRx6Xgwu6qrS3zP3-NK_rIOBPfzZNboj1dnRaoEnqOwWeANbYqxuXCSJzGlUwyKMm8j544SYaSXDkzi6n_vqkcJ9zQG",
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
    src: STORIES[0].src,
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
      <section className="relative min-h-[100dvh] overflow-x-hidden text-white">
        <div className="absolute inset-0 overflow-hidden bg-charcoal">
          {HERO_TILES.map((tile, index) => (
            <img
              alt=""
              className={`hero-bg-image${index === heroIndex ? " is-active" : ""}`}
              key={tile.src}
              src={tile.src}
            />
          ))}
          <div className="absolute inset-0 z-[2] bg-gradient-to-b from-charcoal/55 via-charcoal/30 to-charcoal/60" />
        </div>
        <div className="relative z-10 min-h-[100dvh] max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center text-center pt-24 pb-16">
          <p className="text-white/80 text-[14px] md:text-[15px] mb-4">The Pearl of Africa</p>
          <h1 className="font-display-lg text-[34px] md:text-[48px] lg:text-[56px] leading-[1.1] tracking-tight max-w-3xl">
            Unforgettable Uganda
            <br />
            Safari Experience
          </h1>
          <div className="mt-8 w-full relative z-30">
            <TourSearch />
          </div>
        </div>
      </section>

      <section className="bg-charcoal text-white py-10 md:py-12 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-12">
          <div className="w-full max-w-[320px] shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                {HERO_AVATARS.map((src) => (
                  <img alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/70" key={src} src={src} />
                ))}
              </div>
              <p className="text-[14px] text-white/90">30+ travellers joined</p>
            </div>
            <p className="text-[15px] leading-relaxed text-white/75 mb-5">
              Savanna, golden skies, and guided Uganda tours with local operators.
            </p>
            <Link
              className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-container transition-colors rounded-lg px-5 py-2.5 font-label-md text-[14px]"
              to="/tours#packages"
            >
              Book now
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
                        <p className="text-[13px] text-white/70 leading-snug mt-1">{tile.text}</p>
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
      </section>

      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop overflow-hidden" id="featured-tours">
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

      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto mb-10">
          <h2 className="font-headline-md text-headline-md text-charcoal">Uganda's Big 8</h2>
          <p className="text-secondary font-body-md mt-2 max-w-[65ch]">The definitive list of flagship experiences</p>
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
            <img alt="Ugandan marketplace filled with tropical fruits" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAz3PtuQZz5W1qDgAYDjKV7NBMo3lB-tb1jcna2h9qpXoogWj0RESVjHBtHNUxxgTY4pN3kwe2JnQOyOvVg8rF09QFG21B8BXt5z0OeOlGLQA94x7HGjfSJol88FYpAJxi9CT8OFttmbrYikspwHH2y2Sn_bdIuIZ5LCv7b5gNIrigAqXTLjpbfqkPu1ZGh7u3ntVQqligS2Ex9mXu2hFBkVhp1gXbhzdBqt6jF2fb4q8ZF9qw4qQY_" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h4 className="text-white font-label-md text-lg">Culture</h4>
            </div>
          </Link>
        </div>
      </section>

      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
          <h2 className="md:col-span-4 font-headline-md text-headline-md text-charcoal">How it works</h2>
          <ol className="md:col-span-8 space-y-8">
            {[
              ["travel_explore", "Choose your adventure", "Browse curated tours and safaris from verified local operators."],
              ["event_available", "Book in minutes", "Lock your dates with transparent pricing and no hidden fees."],
              ["forest", "Travel with local support", "Guides on the ground and help in Uganda around the clock."],
            ].map(([icon, title, text], index) => (
              <li className="flex gap-4 md:gap-6" key={title}>
                <Icon name={icon} className="text-primary text-[28px] mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-headline-sm text-[22px] text-charcoal">{title}</h3>
                  <p className="text-secondary font-body-md mt-1 max-w-[55ch]">{text}</p>
                </div>
                <span className="sr-only">Step {index + 1}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop">
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

      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop bg-surface-container-low" id="stays">
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

      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop bg-white">
        <div className="max-w-[1440px] mx-auto mb-10 flex flex-wrap gap-4 justify-between items-end">
          <div>
            <h2 className="font-headline-md text-headline-md text-charcoal">Stories from Uganda</h2>
            <p className="text-secondary font-body-md mt-2">Dive deeper into the Pearl of Africa</p>
          </div>
          <Link className="text-primary font-label-md hover:text-primary-container" to="/blogs">Read more</Link>
        </div>
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <article className="lg:col-span-7 group">
            <Link to="/blogs">
              <div className="aspect-[16/10] rounded-xl overflow-hidden mb-5">
                <img alt={STORIES[0].alt} className="w-full h-full object-cover" src={STORIES[0].src} />
              </div>
              <p className="text-primary font-label-md text-[13px] mb-2">{STORIES[0].tag}</p>
              <h3 className="font-headline-sm text-[26px] leading-snug text-charcoal group-hover:text-primary transition-colors">{STORIES[0].title}</h3>
              <p className="text-secondary font-body-md mt-3 max-w-[60ch]">{STORIES[0].text}</p>
              <p className="mt-3 text-slate-gray text-[13px]">{STORIES[0].meta.replace(" · ", ", ")}</p>
            </Link>
          </article>
          <div className="lg:col-span-5 flex flex-col gap-6">
            {STORIES.slice(1).map((story) => (
              <article className="group flex gap-4" key={story.title}>
                <Link className="flex gap-4 min-w-0" to="/blogs">
                  <div className="w-28 sm:w-36 h-24 sm:h-28 rounded-xl overflow-hidden shrink-0">
                    <img alt={story.alt} className="w-full h-full object-cover" src={story.src} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-primary font-label-md text-[13px] mb-1">{story.tag}</p>
                    <h3 className="font-headline-sm text-[18px] leading-snug text-charcoal group-hover:text-primary transition-colors">{story.title}</h3>
                    <p className="mt-2 text-slate-gray text-[13px]">{story.meta.replace(" · ", ", ")}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop bg-white">
        <div className="max-w-[1440px] mx-auto">
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
