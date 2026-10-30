import { useEffect } from "react";
import { cldHero } from "../cloudinary";

export default function Culture() {
  useEffect(() => {
    const groups = document.querySelectorAll("[data-animate-group]");
    if (!groups.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 }
    );

    groups.forEach((group) => {
      Array.from(group.children).forEach((card, index) => {
        card.style.transitionDelay = `${index * 100}ms`;
        card.classList.add("transition-all", "duration-700", "opacity-0", "translate-y-8");
        observer.observe(card);
      });
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-background">
      <div className="flex flex-col w-full relative overflow-x-hidden bg-background" id="culture-content">
        <div className="relative w-full h-[560px] md:h-[720px] overflow-hidden group">
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('${cldHero("https://res.cloudinary.com/yqsld0pd/image/upload/v1793292632/Instruments.jpg")}')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end pb-16 md:pb-24 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto z-10">
            <h1 className="font-display-lg text-[32px] md:text-[44px] leading-[1.15] text-white max-w-4xl mb-6">
              The Soul of Uganda: A Journey Through Heritage
            </h1>
            <p className="font-body-lg text-body-lg text-surface-container-highest max-w-2xl">
              Beyond the wildlife lies a profound human tapestry. Discover fifty-six distinct indigenous tribes, forty
              living languages, and a ten-thousand-year-old rhythm that beats in the heart of Uganda.
            </p>
          </div>
        </div>

        <div className="w-full relative bg-charcoal text-white py-16 md:py-20">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8" data-animate-group>
              <div className="flex flex-col items-start relative group">
                <div className="text-[120px] leading-none font-bold text-white/5 absolute -top-8 -left-4 transition-transform duration-700 group-hover:-translate-y-4">
                  56+
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <span className="font-bold text-[28px] text-primary-fixed-dim">56+</span>
                  <h3 className="font-headline-sm text-headline-sm text-white">Indigenous Tribes</h3>
                  <p className="font-body-md text-body-md text-surface-dim/80 max-w-sm">
                    A kaleidoscope of distinct cultural identities, from the pastoralist Karamojong in the northeast to
                    the agrarian Baganda in the central region.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start relative group">
                <div className="text-[120px] leading-none font-bold text-white/5 absolute -top-8 -left-4 transition-transform duration-700 group-hover:-translate-y-4">
                  40+
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <span className="font-bold text-[28px] text-primary-fixed-dim">40+</span>
                  <h3 className="font-headline-sm text-headline-sm text-white">Living Languages</h3>
                  <p className="font-body-md text-body-md text-surface-dim/80 max-w-sm">
                    Rooted in Bantu, Nilotic, and Central Sudanic linguistic families, preserving ancient oral traditions
                    and storytelling lineages.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start relative group">
                <div className="text-[120px] leading-none font-bold text-white/5 absolute -top-8 -left-4 transition-transform duration-700 group-hover:-translate-y-4">
                  10k
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <span className="font-bold text-[28px] text-primary-fixed-dim">10k</span>
                  <h3 className="font-headline-sm text-headline-sm text-white">Years of History</h3>
                  <p className="font-body-md text-body-md text-surface-dim/80 max-w-sm">
                    Continuous human habitation dating back to the late Stone Age, evidenced by ancient rock art and
                    deeply rooted traditional governance systems.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full py-16 md:py-20 relative bg-surface">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop mb-12 md:mb-16">
            <div className="max-w-3xl">
              <h2 className="font-headline-md text-[28px] md:text-[36px] text-charcoal mb-5">Immersive encounters</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                A closer look at three traditions that shape everyday life in Uganda: where they come from, who keeps them
                alive, and what a respectful visit looks like.
              </p>
            </div>
          </div>

          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter" data-animate-group>
              <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                <div className="w-full h-72 relative overflow-hidden">
                  <img
                    alt="The domed, thatched Kasubi Royal Tombs in Kampala"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7eVn8XDUtlbGLkBWVUxUqW-xNUju9gv52czi6jKpo1Ao_JXx7x-RfkUD6p3NOmOQN8wZrAXkToyFsuJBnDNstExAyrwB5XSjfhA21gei9OIUmHxWNf33c5MGBECaiBxj3VxJL7ZwnP2AFmuYvr7wKpLjFK7pVVrbWaILUhi3qqX4l5OkTVOBAnnHqRDJCBv1SRpKIP9J6k6jf6oiMNS_bbNbhciLYB83Et1BH9o3mV2UEYDXeY6uF"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-outline text-[18px]">location_on</span>
                    <span className="font-label-md text-label-md text-outline">Kampala Region</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-charcoal mb-3">The Royal Tombs of Kasubi</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                    The burial grounds of four Kabakas (Kings) of Buganda. Built entirely from wood, thatch and reed, it
                    is a masterpiece of Ganda architecture and remains a living spiritual centre for the Baganda people.
                  </p>
                  <div className="mt-auto pt-5 border-t border-surface-container-high grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="font-data-mono text-outline uppercase text-[11px] mb-1">Custodians</span>
                      <span className="font-label-md text-label-md text-charcoal">Buganda Kingdom</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-data-mono text-outline uppercase text-[11px] mb-1">Recognised</span>
                      <span className="font-label-md text-label-md text-charcoal">UNESCO, 2001</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                <div className="w-full h-72 relative overflow-hidden">
                  <img
                    alt="A Batwa elder in the misty Mgahinga forest"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj4TfxvcZVkQuZpNgwTLetSLF75EG2Ct9M9BEtyZDsGoLhzeHhJzTKegbBWVJvf85aF5HfIbkBfU0JE_Gk0TiEPt8t2BA8xFkPw17i8rjMCzcOr0gBlCtjQ96_ZFR9H9g0Toi-xSKk81UkQ-nyypU5mWcCp2Jxny6ctvkH98TkLAH40HKXGb5oQC8Fp79XMzaHdg3GcjIXGA72fwodSsaxazZAbf7dX--osnDUg7ddAVWvFil6ZvF5"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-outline text-[18px]">location_on</span>
                    <span className="font-label-md text-label-md text-outline">Mgahinga Forest</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-charcoal mb-3">The Batwa and the Forest</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                    The Batwa were the forest's first inhabitants. Their botanical knowledge, hunting techniques and
                    musical traditions carry thousands of years of life beneath the canopy of Mgahinga.
                  </p>
                  <div className="mt-auto pt-5 border-t border-surface-container-high grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="font-data-mono text-outline uppercase text-[11px] mb-1">Custodians</span>
                      <span className="font-label-md text-label-md text-charcoal">Batwa communities</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-data-mono text-outline uppercase text-[11px] mb-1">Passed down</span>
                      <span className="font-label-md text-label-md text-charcoal">Orally, for millennia</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full md:col-span-2 lg:col-span-1">
                <div className="w-full h-72 relative overflow-hidden">
                  <img
                    alt="Hands weaving a traditional Ugandan basket from dyed raffia"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjd2aoKxsxerV3Dt480hopx7N23T9KNeNWmWP2BO84nLJD7cKNCWHgui0AosAIVW5q7CItVL3yELduXkJp2NifzsRv7KkgIWOnjFSU9S1P3Ihrb2YRhZXrlURxLHclcysgE0TIAwX2D9i-uK5xfQz03rK2AHvzlTP9j_ov4LBgIzUp7AHTGaZf9sBWa3GIi492iMq74Hi3rITpRYNyfoQnlSIYlygHb9kUNcTUsfpnFhC2i2pjZ3SY"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-outline text-[18px]">location_on</span>
                    <span className="font-label-md text-label-md text-outline">Fort Portal</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-charcoal mb-3">The Art of Basketry</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                    Master weavers in rural cooperatives work complex geometry and cultural symbolism into every coil.
                    Patterns record clan, occasion and place.
                  </p>
                  <div className="mt-auto pt-5 border-t border-surface-container-high grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="font-data-mono text-outline uppercase text-[11px] mb-1">Custodians</span>
                      <span className="font-label-md text-label-md text-charcoal">Women's cooperatives</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-data-mono text-outline uppercase text-[11px] mb-1">Materials</span>
                      <span className="font-label-md text-label-md text-charcoal">Raffia & banana fibre</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full py-16 md:py-20 bg-surface-container-high relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-outline-variant/10 rounded-l-full blur-3xl -z-10" />
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 flex flex-col relative z-10">
                <h2 className="font-headline-md text-[28px] md:text-[36px] text-charcoal mb-6 leading-tight">
                  The Legacy of <br />
                  <span className="italic font-light">Bark Cloth</span>
                </h2>
                <div className="bg-surface p-6 md:p-8 rounded-xl shadow-sm mb-6 relative">
                  <div className="absolute -left-3 top-8 w-1 h-12 bg-primary" />
                  <p className="font-body-lg text-body-lg text-on-surface-variant mb-5">
                    Recognized by UNESCO as a Masterpiece of the Oral and Intangible Heritage of Humanity, bark cloth
                    making is an ancient craft of the Baganda people, predating the invention of weaving.
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    The process involves harvesting the inner bark of the Mutuba tree without destroying it, an early
                    masterclass in sustainable harvesting. The bark is meticulously beaten with wooden mallets to create a
                    soft, terracotta-colored fabric historically reserved for royalty.
                  </p>
                </div>
                <div className="w-fit flex items-start gap-3 border-l-2 border-primary pl-4">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  <span className="font-label-md text-label-md text-charcoal leading-relaxed">
                    Inscribed on the UNESCO list of Intangible Cultural Heritage in 2005
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 relative">
                <div className="grid grid-cols-2 gap-5 relative z-10">
                  <div className="flex flex-col gap-5 mt-10">
                    <div className="w-full h-[320px] md:h-[380px] rounded-xl overflow-hidden shadow-lg relative">
                      <img
                        alt="A craftsman beating Mutuba bark with a grooved wooden mallet"
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkLleMH05eF5cHqmzgUINrKSLMYbWNjza1RXz8pJAi-aspyMD0Nsp57RtcGux4I_XNq8haWnXMGZacob3Odp0xEnROJffru-bGeLN8sfXuU2RoEBO8u9VZOIQy6fwgR7HsJVEbOuFgaMohvoQxi8YBrUV7ROsBffVP84aljZYcWHWj-r_Ni0eUGDo6kbXUlx-5fwiBFdMeKab6d6iHN-M-lV5N7oa40_fVipEqf8plmNMtDjOa2KFW"
                      />
                    </div>
                    <div className="bg-primary-container p-5 rounded-xl flex items-start gap-4">
                      <span className="material-symbols-outlined text-on-primary-container">eco</span>
                      <p className="font-label-md text-label-md text-on-primary-container leading-relaxed">
                        100% regenerative process. The Mutuba tree regrows its bark within a year, sustaining the craft
                        indefinitely.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-5">
                    <div className="w-full h-[400px] md:h-[470px] rounded-xl overflow-hidden shadow-xl relative">
                      <img
                        alt="A modern garment crafted from traditional Ugandan bark cloth"
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcA0t3ZWKyp7lM1APFXgPzO27SX57hve6ZgWhcrfqxpCdnFerHEV9X7b_zQ31L3LYht7o71XyS5bT0EcxMW0cHKDmK4qKkMVM35ciXZR1Sb1llELUtl1HMvu5WHTwEmKB4VbaGt6LZVMUhwwh7F_Srr0TJsinnF7NbpiqXaSs7UTXxRTkBQXrsja0_4fh8_VEQRXd-nzLKm4ffxC8H1AQHG7KZTmrACRabKGEelz266d_Opv78a6JY"
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -left-10 font-headline-sm text-surface-variant [writing-mode:vertical-rl] tracking-widest hidden xl:block">
                  UNESCO INTANGIBLE HERITAGE
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full py-16 md:py-20 bg-charcoal text-white relative scroll-mt-16" id="tips">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center mb-12 relative z-10">
            <span className="material-symbols-outlined text-primary-fixed-dim text-[48px] mb-5">handshake</span>
            <h2 className="font-bold text-[28px] md:text-[36px] text-white mb-5">Traveling with Respect</h2>
            <p className="font-body-lg text-body-lg text-surface-dim/80">
              Engaging with communities is a privilege. Mmondo promotes a model of cultural exchange built on dignity,
              mutual respect, and economic equity.
            </p>
          </div>
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-animate-group>
              <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-xl flex flex-col items-start hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center mb-5">
                  <span className="font-data-mono text-primary-fixed-dim">01</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-white mb-3">Photography Protocol</h4>
                <p className="font-body-md text-body-md text-surface-dim/70">
                  Always seek explicit permission before photographing individuals, particularly elders and children. Put
                  the camera away first; connect human-to-human before documenting.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-xl flex flex-col items-start hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center mb-5">
                  <span className="font-data-mono text-primary-fixed-dim">02</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-white mb-3">Economic Equity</h4>
                <p className="font-body-md text-body-md text-surface-dim/70">
                  Support local artisans directly. We discourage bargaining heavily for crafts, as these pieces represent
                  hours of skilled labor and primary livelihoods.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-xl flex flex-col items-start hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center mb-5">
                  <span className="font-data-mono text-primary-fixed-dim">03</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-white mb-3">Dress & Decorum</h4>
                <p className="font-body-md text-body-md text-surface-dim/70">
                  When visiting rural communities or sacred sites, conservative attire is appreciated. Observe local
                  greetings and gestures as guided by your Mmondo expert.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
