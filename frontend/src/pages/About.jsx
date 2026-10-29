import { useEffect } from "react";
import { Link } from "react-router-dom";

const PARTNERS = ["Serena Hotels", "Mweya Safari Lodge", "Protea Hotel"];

const STATS = [
  { target: 10, suffix: "K+", label: "Happy travellers" },
  { target: 150, suffix: "+", label: "Tour packages" },
  { target: 50, suffix: "+", label: "Destinations" },
  { target: 15, suffix: "+", label: "Years experience" },
];

export default function About() {
  useEffect(() => {
    const counters = document.querySelectorAll(".stat-number");
    if (!counters.length || !("IntersectionObserver" in window)) return;

    const animateCount = (counter) => {
      const target = Number(counter.dataset.target) || 0;
      const suffix = counter.dataset.suffix || "";
      let count = 0;
      const increment = Math.max(1, Math.ceil(target / 48));

      const updateCount = () => {
        count += increment;
        if (count < target) {
          counter.textContent = `${count.toLocaleString()}${suffix}`;
          requestAnimationFrame(updateCount);
        } else {
          counter.textContent = `${target.toLocaleString()}${suffix}`;
        }
      };

      updateCount();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((counter) => observer.observe(counter));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-surface">
      <div className="flex flex-col w-full">
        <section className="relative w-full h-screen min-h-[100dvh] overflow-hidden bg-charcoal">
          <img
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_42%]"
            src="https://res.cloudinary.com/yqsld0pd/image/upload/v1791391528/pexels-mike-van-schoonderwalt-1884800-5504224.svg"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/35 to-charcoal/80" />
          <div className="absolute inset-0 z-10 flex flex-col justify-end">
            <div className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop pt-24 pb-10 md:pb-16">
              <span className="inline-flex items-center bg-primary text-white font-label-md text-[12px] md:text-[13px] tracking-[0.18em] uppercase px-4 py-1.5 rounded-full mb-4">
                About us
              </span>
              <h1 className="font-display-lg text-[32px] md:text-[48px] lg:text-[52px] leading-[1.1] tracking-tight text-white max-w-3xl">
                Our Mission: Connecting You to the Heart of Uganda<span className="text-primary">.</span>
              </h1>
              <p className="mt-4 font-body-lg text-[16px] md:text-[18px] leading-relaxed text-white/85 max-w-xl">
                We are more than a booking platform. We bring Ugandan tour operators and travellers together, working
                with trusted local guides to deliver authentic, well-organised adventures.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-20 relative scroll-mt-16" id="story">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] rounded-xl overflow-hidden shadow-xl">
                <img
                  alt="A Mmondo guide in the field"
                  className="w-full h-full object-cover"
                  src="https://res.cloudinary.com/yqsld0pd/image/upload/v1793292049/Safari_en_Tanzania_la_aventura_de_tu_vida.svg"
                />
              </div>
              <div className="absolute -bottom-8 -right-4 xl:-right-8 bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-md max-w-[280px] hidden md:block">
                <span className="font-bold text-[28px] text-primary block mb-2">15+</span>
                <span className="font-label-md text-label-md text-charcoal">
                  Years of local expertise
                </span>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6 lg:pl-12">
              <h2 className="font-headline-md text-headline-md text-charcoal">
                Born from a profound respect for our homeland.
              </h2>
              <div className="space-y-5 text-on-surface-variant font-body-md text-body-md">
                <p>
                  Mmondo Adventures began with a simple realisation: the true essence of Uganda wasn't reaching the
                  world. Founded by local experts who grew up exploring these trails, tracking the gorillas, and
                  navigating the mighty Nile, we set out to change that.
                </p>
                <p>
                  We connect Ugandan tour operators with travellers in the European market, bridging the gap and
                  opening new opportunities in international tourism. Every itinerary is delivered with trusted local
                  guides, so your journey leaves a positive, lasting impact on the communities and ecosystems we cherish.
                </p>
                <p className="font-body-lg text-body-lg text-charcoal italic pt-2">
                  "To travel with Mmondo is to walk alongside the custodians of the land."
                </p>
              </div>
              <Link
                className="w-fit bg-primary hover:bg-primary-container text-on-primary px-8 py-3.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-2"
                to="/tours#packages"
              >
                Explore our tours
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full bg-surface-container py-16 md:py-20">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col gap-12">
            <div className="max-w-2xl">
              <h2 className="font-headline-md text-headline-md text-charcoal mb-4">The Pillars of Our Promise</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                The principles that guide every itinerary we list and every interaction we have.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="bg-surface rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center mb-5 text-primary">
                  <span className="material-symbols-outlined text-[28px]">explore</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-charcoal mb-3 relative z-10">Authentic Experiences</h3>
                <p className="font-body-md text-body-md text-on-surface-variant relative z-10">
                  We bypass the tourist traps. Our listings dive into the cultural fabric of Uganda, offering
                  unscripted encounters and genuine hospitality.
                </p>
              </div>

              <div className="bg-surface rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-tertiary-fixed/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 bg-tertiary-fixed rounded-lg flex items-center justify-center mb-5 text-on-tertiary-fixed-variant">
                  <span className="material-symbols-outlined text-[28px]">handshake</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-charcoal mb-3 relative z-10">Trusted Local Operators</h3>
                <p className="font-body-md text-body-md text-on-surface-variant relative z-10">
                  Every operator and guide on Mmondo is verified before they can list a tour. Your money stays in the
                  region, supporting the families who make your journey possible.
                </p>
              </div>

              <div className="bg-surface rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-outline-variant/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center mb-5 text-charcoal">
                  <span className="material-symbols-outlined text-[28px]">verified_user</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-charcoal mb-3 relative z-10">Secure Booking & Support</h3>
                <p className="font-body-md text-body-md text-on-surface-variant relative z-10">
                  Flexible payments, free cancellation up to 3 days before the start date, and a team that answers
                  before, during, and after your trip.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-20">
          <div className="flex flex-col gap-10 md:gap-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-headline-md text-headline-md text-charcoal mb-4">Meet the Experts</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                The passionate professionals behind your perfect trip. Born locally, trained globally.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <div className="group">
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-5 bg-surface-container-high">
                  <img
                    alt="Mr. Kyamuwendo Oscar"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src="https://res.cloudinary.com/yqsld0pd/image/upload/v1791391513/oscar.svg"
                  />
                </div>
                <h4 className="font-headline-sm text-headline-sm text-charcoal">Mr. Kyamuwendo Oscar</h4>
                <span className="font-label-md text-label-md text-primary text-[14px] block mt-1">
                  Destination Expert
                </span>
              </div>

              <div className="group">
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-5 bg-surface-container-high">
                  <img
                    alt="Mr. Lubega Rhyan"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src="https://res.cloudinary.com/yqsld0pd/image/upload/v1791391517/rhyan.svg"
                  />
                </div>
                <h4 className="font-headline-sm text-headline-sm text-charcoal">Mr. Lubega Rhyan</h4>
                <span className="font-label-md text-label-md text-primary text-[14px] block mt-1">
                  Customer Support
                </span>
              </div>

              <div className="group">
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-5 bg-surface-container-high">
                  <img
                    alt="Mr. Mutale George"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src="https://res.cloudinary.com/yqsld0pd/image/upload/v1791391512/george.svg"
                  />
                </div>
                <h4 className="font-headline-sm text-headline-sm text-charcoal">Mr. Mutale George</h4>
                <span className="font-label-md text-label-md text-primary text-[14px] block mt-1">
                  Operations Manager
                </span>
              </div>

              <div className="group">
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-5 bg-surface-container-high">
                  <img
                    alt="Mr. Onyango Boaz"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src="https://res.cloudinary.com/yqsld0pd/image/upload/v1791391510/boaz.svg"
                  />
                </div>
                <h4 className="font-headline-sm text-headline-sm text-charcoal">Mr. Onyango Boaz</h4>
                <span className="font-label-md text-label-md text-primary text-[14px] block mt-1">
                  Wildlife Consultant
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="stat-band w-full bg-charcoal text-white py-16 md:py-20 relative overflow-hidden" id="stats">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
            <h2 className="text-center font-semibold text-[28px] md:text-[36px] text-white mb-10 md:mb-12">
              Travel that gives back.
            </h2>
            <div className="stat-row">
              {STATS.map((stat, index) => (
                <div className="stat-slot" key={stat.label}>
                  <article className="stat-card">
                    <span
                      className="stat-number font-semibold text-[32px] md:text-[40px] leading-none tracking-tight text-white"
                      data-suffix={stat.suffix}
                      data-target={stat.target}
                    >
                      {stat.target.toLocaleString()}
                      {stat.suffix}
                    </span>
                    <span className="text-[13px] md:text-[14px] text-white/70">{stat.label}</span>
                  </article>
                  {index < STATS.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={`stat-joint ${index % 2 === 0 ? "stat-joint-top" : "stat-joint-bottom"}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {index === 1 ? "expand_less" : "expand_more"}
                      </span>
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full bg-surface-container-low py-16 md:py-20">
          <div className="max-w-[760px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col gap-10">
            <div>
              <h2 className="font-headline-md text-headline-md text-charcoal mb-3">Travel information</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Practical details for planning your trip. If you need anything else, write to us on the contact page.
              </p>
            </div>
            <article className="scroll-mt-20" id="visa">
              <h3 className="font-headline-sm text-[20px] text-charcoal mb-2">Visa information</h3>
              <p className="font-body-md text-[15px] leading-relaxed text-on-surface-variant">
                Most nationalities need a visa to enter Uganda. Apply for an e-Visa before you travel, and keep a copy of
                your passport, itinerary, and yellow-fever certificate if required. Our team can point you to the current
                rules for your passport.
              </p>
            </article>
            <article className="scroll-mt-20" id="cancellation">
              <h3 className="font-headline-sm text-[20px] text-charcoal mb-2">Cancellation policy</h3>
              <p className="font-body-md text-[15px] leading-relaxed text-on-surface-variant">
                Free cancellation is allowed up to 3 days before the tour start date. After you book, you can change
                dates, companions, or cancel from My Bookings if you have an account. Closer to departure, contact us and
                we will work with the operator on what is possible.
              </p>
            </article>
            <article className="scroll-mt-20" id="privacy">
              <h3 className="font-headline-sm text-[20px] text-charcoal mb-2">Privacy policy</h3>
              <p className="font-body-md text-[15px] leading-relaxed text-on-surface-variant">
                We use your details to run bookings, payments, and support. We do not sell your data. You can ask us to
                update or delete your account information by emailing info@mmondoadventures.ug.
              </p>
            </article>
            <article className="scroll-mt-20" id="terms">
              <h3 className="font-headline-sm text-[20px] text-charcoal mb-2">Terms &amp; conditions</h3>
              <p className="font-body-md text-[15px] leading-relaxed text-on-surface-variant">
                Mmondo connects travellers with verified Ugandan tour operators. Each tour’s dates, price, and inclusions
                are set by the operator. By booking you agree to those details, our cancellation window, and to treat
                communities and wildlife with respect.
              </p>
            </article>
          </div>
        </section>

        <section className="w-full bg-surface py-14 border-b border-surface-container-high">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-8">
            <span className="font-label-md text-label-md text-on-surface-variant text-center">
              Working with
            </span>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {PARTNERS.map((partner, index) => (
                <span key={partner} className="contents">
                  {index > 0 && <span className="h-8 w-px bg-surface-container-high hidden md:block" />}
                  <span className="font-headline-sm text-headline-sm text-charcoal opacity-60 hover:opacity-100 transition-opacity">
                    {partner}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
