import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { Icon, joinAddress, joinName } from "../utils";

const HERO_IMAGES = [
  {
    alt: "Mountain gorilla in Bwindi Impenetrable Forest",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391526/gabriel-schumacher-kcKJTpYTdIQ-unsplash.svg",
  },
  {
    alt: "African elephant on a Ugandan safari",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391515/pexels-rachel-claire-4577507.svg",
  },
  {
    alt: "Tree-climbing lion in Queen Elizabeth National Park",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793294407/Tree_climbing_lion_in_Uganda.svg",
  },
  {
    alt: "Sunrise over the Rwenzori Mountains",
    src: "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292048/Rwenzori_Mountains__tough_trekking_in_Scenic_Paradise.svg",
  },
];

const HERO_HOLD_MS = 6500;

const emptyRegister = {
  company_name: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  district: "",
  country: "",
  password: "",
};

const fieldClass =
  "w-full px-4 py-3 rounded-lg border border-slate-gray/30 bg-surface-container-low text-ink focus:outline-none focus:border-primary focus:border-2";

const ADVANTAGES = [
  {
    icon: "payments",
    tag: "Multi-Currency Payouts",
    title: "Guaranteed Timely Payouts",
    text: "Disbursements in USD wire or direct local UGX Mobile Money (MTN & Airtel). Transparent commissions, zero hidden listing fees, and guaranteed pre-departure payouts.",
    note: "Direct MTN & Airtel Mobile Money",
  },
  {
    icon: "public",
    tag: "International Exposure",
    title: "Global Reach & Direct Verified Leads",
    text: "Connect directly with qualified travelers from Europe, North America, and beyond seeking gorilla treks, wildlife safaris, and cultural immersions without costly ad spend.",
    note: "Verified high-intent travelers",
  },
  {
    icon: "dashboard",
    tag: "Intuitive Toolkit",
    title: "Operator Dashboard & Inventory",
    text: "Full control over custom itineraries, multi-tier seasonal pricing, safari vehicle & guide scheduling, live departure calendars, and instant booking confirmations.",
    note: "Real-time calendar & fleet sync",
  },
  {
    icon: "forum",
    tag: "Direct Communication",
    title: "Direct Client Messaging",
    text: "Communicate directly with booked guests to coordinate dietary requirements, pickup logistics at Entebbe, gear preparations, and bespoke safari add-ons before arrival.",
    note: "In-app chat & WhatsApp sync",
  },
  {
    icon: "verified_user",
    tag: "Permits & Margin Safety",
    title: "UWA Permitting & Protection",
    text: "Seamless liaison for securing Uganda Wildlife Authority (UWA) gorilla and chimpanzee permits. Tiered cancellation policies safeguard your operational margins.",
    note: "UWA gorilla permit coordination",
  },
  {
    icon: "support_agent",
    tag: "Kampala Operations Desk",
    title: "Local Partner Success Manager",
    text: "Dedicated on-the-ground support team based in Kampala offering personalized onboarding within 48 hours, guide training, and 24/7 emergency incident resolution.",
    note: "Dedicated Kampala account manager",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Register & Verify",
    text: "Submit your agency registration documents, Uganda Tourism Board (UTB) licenses, and safety credentials for fast-track verification.",
    icon: "schedule",
    note: "48-hour review period",
  },
  {
    num: "02",
    title: "List Your Tours",
    text: "Upload your multi-day itineraries, add high-resolution photography, define inclusions, and set flexible pricing tiers.",
    icon: "edit_note",
    note: "Easy builder tool",
  },
  {
    num: "03",
    title: "Welcome & Get Paid",
    text: "Receive instant booking confirmations, prepare unforgettable experiences for your travelers, and get paid securely upon trip fulfillment.",
    icon: "verified_user",
    note: "Guaranteed disbursement",
  },
];

export default function OperatorHome() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.hash === "#login-section" ? "login" : "register");
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (location.hash === "#login-section") setTab("login");
    if (location.hash === "#register-section") setTab("register");
  }, [location.hash]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;
    const next = (heroIndex + 1) % HERO_IMAGES.length;
    const id = window.setTimeout(() => setHeroIndex(next), HERO_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [heroIndex]);

  function openTab(next) {
    setTab(next);
    setError("");
    navigate({ pathname: location.pathname, hash: next === "login" ? "login-section" : "register-section" }, { replace: true });
  }

  async function submitRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/operator/register", {
        method: "POST",
        body: {
          ...registerForm,
          full_name: joinName(registerForm.first_name, registerForm.last_name),
          address: joinAddress(registerForm),
        },
      });
      await refresh();
      navigate("/operator/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { ...loginForm, next: "/operator/dashboard" },
      });
      await refresh();
      navigate(data.redirect || "/operator/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isOperator = Boolean(user?.is_admin || user?.is_operator || user?.is_superadmin);

  return (
    <div className="bg-background text-on-background">
      <section className="relative min-h-[100dvh] flex bg-charcoal text-white overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden bg-charcoal">
          {HERO_IMAGES.map((image, index) => (
            <img
              alt={image.alt}
              className={`hero-bg-image${index === heroIndex ? " is-active" : ""}`}
              key={image.src}
              src={image.src}
            />
          ))}
          <div className="absolute inset-0 z-[2] bg-charcoal/45" />
          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-charcoal/70 via-charcoal/25 to-charcoal/40" />
        </div>
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop pt-24 pb-12 min-h-[100dvh] flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl flex flex-col items-center">
            <div className="inline-flex items-center gap-2 bg-primary px-3.5 py-1.5 rounded-full">
              <Icon className="text-white text-[16px]" fill name="verified" />
              <span className="font-label-md text-white text-[13px]">Operator portal</span>
            </div>
            <h1 className="mt-5 font-display-lg text-[34px] md:text-[48px] leading-[1.12] tracking-tight text-white">
              Grow your safari business with Mmondo
            </h1>
            <p className="mt-4 font-body-lg text-[17px] md:text-[18px] text-white/80 max-w-xl">
              List tours, reach verified travelers, and get paid in USD or UGX.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-3 mt-8 w-full sm:w-auto">
              {isOperator ? (
                <Link
                  className="bg-primary hover:bg-primary-container text-white px-7 py-3.5 rounded-lg font-label-md text-label-md transition-all shadow-natural inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                  to="/operator/dashboard"
                >
                  Go to dashboard
                  <Icon name="arrow_forward" />
                </Link>
              ) : (
                <>
                  <a
                    className="bg-primary hover:bg-primary-container text-white px-7 py-3.5 rounded-lg font-label-md text-label-md transition-all shadow-natural inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                    href="#register-section"
                    onClick={() => setTab("register")}
                  >
                    Operator Sign Up
                    <Icon name="arrow_forward" />
                  </a>
                  <a
                    className="bg-white text-charcoal hover:bg-primary hover:text-white px-7 py-3.5 rounded-lg font-label-md text-label-md transition-all inline-flex items-center justify-center w-full sm:w-auto"
                    href="#login-section"
                    onClick={() => setTab("login")}
                  >
                    Operator Login
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-charcoal text-white py-10 md:py-12 border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-3 gap-4 md:gap-10 text-center">
          <div>
            <div className="font-display-lg text-[28px] md:text-headline-md text-primary leading-none">100%</div>
            <div className="mt-2 font-body-md text-white/70 text-[12px] md:text-sm leading-snug">Secure USD/UGX payouts</div>
          </div>
          <div>
            <div className="font-display-lg text-[28px] md:text-headline-md text-primary leading-none">48 hrs</div>
            <div className="mt-2 font-body-md text-white/70 text-[12px] md:text-sm leading-snug">Average verification time</div>
          </div>
          <div>
            <div className="font-display-lg text-[28px] md:text-headline-md text-primary leading-none">Global</div>
            <div className="mt-2 font-body-md text-white/70 text-[12px] md:text-sm leading-snug">Traveler reach</div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 py-16 md:py-20" id="register-section">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-5">
            <h2 className="font-headline-md text-[28px] md:text-headline-md text-charcoal">Join Uganda's Premier Adventure Network</h2>
            <p className="font-body-md text-on-surface-variant max-w-md">
              Whether you run gorilla trekking expeditions in Bwindi, wildlife safaris in Murchison Falls, or cultural tours across the Pearl of Africa, our platform gives you the tools to scale.
            </p>
            <div className="space-y-5 pt-1">
              <div className="flex items-start gap-3">
                <Icon className="text-primary mt-0.5" name="check_circle" />
                <div className="space-y-1">
                  <h4 className="font-label-md text-ink">Zero Listing Fees</h4>
                  <p className="text-sm text-slate-gray leading-relaxed">Only pay a small commission when you secure a confirmed booking.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon className="text-primary mt-0.5" name="check_circle" />
                <div className="space-y-1">
                  <h4 className="font-label-md text-ink">Direct Traveler Messaging</h4>
                  <p className="text-sm text-slate-gray leading-relaxed">Communicate directly with clients before they arrive for their safari.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 scroll-mt-24 bg-white p-6 md:p-8 rounded-xl shadow-natural" id="login-section">
            <div className="flex border-b border-surface-variant mb-6">
              <button
                className={`flex-1 pb-3 font-label-md text-center transition-all ${tab === "register" ? "text-primary border-b-2 border-primary" : "text-slate-gray hover:text-charcoal"}`}
                onClick={() => openTab("register")}
                type="button"
              >
                Register Agency
              </button>
              <button
                className={`flex-1 pb-3 font-label-md text-center transition-all ${tab === "login" ? "text-primary border-b-2 border-primary" : "text-slate-gray hover:text-charcoal"}`}
                onClick={() => openTab("login")}
                type="button"
              >
                Sign In
              </button>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 bg-error-container/50 border border-error/20 text-on-error-container rounded-lg p-2.5">
                <Icon className="text-[18px] mt-0.5" name="error" />
                <p className="font-body-md text-[13px]">{error}</p>
              </div>
            )}

            {tab === "register" ? (
              <form className="space-y-5" onSubmit={submitRegister}>
                <label className="space-y-2 block">
                  <span className="font-label-md text-ink">Agency / Company Name</span>
                  <input
                    className={fieldClass}
                    onChange={(e) => setRegisterForm({ ...registerForm, company_name: e.target.value })}
                    placeholder="e.g. Pearl Safaris Ltd"
                    required
                    value={registerForm.company_name}
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                  <label className="space-y-2 block">
                    <span className="font-label-md text-ink">First Name</span>
                    <input
                      className={fieldClass}
                      onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                      placeholder="Jane"
                      required
                      value={registerForm.first_name}
                    />
                  </label>
                  <label className="space-y-2 block">
                    <span className="font-label-md text-ink">Last Name</span>
                    <input
                      className={fieldClass}
                      onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                      placeholder="Okello"
                      required
                      value={registerForm.last_name}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                  <label className="space-y-2 block">
                    <span className="font-label-md text-ink">Business Email</span>
                    <input
                      className={fieldClass}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="partner@pearlsafaris.com"
                      required
                      type="email"
                      value={registerForm.email}
                    />
                  </label>
                  <label className="space-y-2 block">
                    <span className="font-label-md text-ink">Phone Number (WhatsApp preferred)</span>
                    <input
                      className={fieldClass}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      placeholder="+256 700 000000"
                      required
                      type="tel"
                      value={registerForm.phone}
                    />
                  </label>
                </div>
                <div className="space-y-4">
                  <p className="font-label-md text-ink">Address</p>
                  <label className="space-y-2 block">
                    <span className="font-label-md text-[13px] text-slate-gray">Street</span>
                    <input
                      className={fieldClass}
                      onChange={(e) => setRegisterForm({ ...registerForm, street: e.target.value })}
                      placeholder="Plot 12, Kitooro Road"
                      required
                      value={registerForm.street}
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                    <label className="space-y-2 block">
                      <span className="font-label-md text-[13px] text-slate-gray">Town / City</span>
                      <input
                        className={fieldClass}
                        onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                        placeholder="Entebbe"
                        required
                        value={registerForm.city}
                      />
                    </label>
                    <label className="space-y-2 block">
                      <span className="font-label-md text-[13px] text-slate-gray">District</span>
                      <input
                        className={fieldClass}
                        onChange={(e) => setRegisterForm({ ...registerForm, district: e.target.value })}
                        placeholder="Wakiso"
                        required
                        value={registerForm.district}
                      />
                    </label>
                    <label className="space-y-2 block">
                      <span className="font-label-md text-[13px] text-slate-gray">Country</span>
                      <input
                        className={fieldClass}
                        onChange={(e) => setRegisterForm({ ...registerForm, country: e.target.value })}
                        placeholder="Uganda"
                        required
                        value={registerForm.country}
                      />
                    </label>
                  </div>
                </div>
                <label className="space-y-2 block">
                  <span className="font-label-md text-ink">Password</span>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-slate-gray/30 bg-surface-container-low text-ink focus:outline-none focus:border-primary focus:border-2"
                    minLength={8}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="At least 8 characters"
                    required
                    type="password"
                    value={registerForm.password}
                  />
                </label>
                <button
                  className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-label-md text-label-md transition-all shadow-natural inline-flex items-center justify-center gap-2 disabled:opacity-70"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Submitting…" : "Submit Operator Application"}
                  <Icon name="send" />
                </button>
                <p className="text-xs text-center text-slate-gray leading-relaxed">By submitting, you agree to Mmondo Adventures Operator Terms and verification protocols.</p>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={submitLogin}>
                <label className="space-y-2 block">
                  <span className="font-label-md text-ink">Business Email</span>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-slate-gray/30 bg-surface-container-low text-ink focus:outline-none focus:border-primary focus:border-2"
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="partner@pearlsafaris.com"
                    required
                    type="email"
                    value={loginForm.email}
                  />
                </label>
                <label className="space-y-2 block">
                  <span className="font-label-md text-ink">Password</span>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-slate-gray/30 bg-surface-container-low text-ink focus:outline-none focus:border-primary focus:border-2"
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={loginForm.password}
                  />
                </label>
                <div className="flex justify-end">
                  <Link className="text-sm font-label-md text-primary hover:text-primary-container" to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>
                <button
                  className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-label-md text-label-md transition-all shadow-natural inline-flex items-center justify-center gap-2 disabled:opacity-70"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Signing in…" : "Operator Login"}
                  <Icon name="login" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
          <header className="max-w-2xl mb-10 md:mb-12">
            <h2 className="font-headline-md text-[28px] md:text-headline-md text-charcoal">Why join Mmondo as a tour operator?</h2>
            <p className="font-body-md text-on-surface-variant mt-3">
              Scale internationally while keeping full ownership of your safari company, lodge, or guiding practice.
            </p>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <article className="lg:col-span-6 relative min-h-[340px] rounded-xl overflow-hidden">
              <img alt={HERO_IMAGES[1].alt} className="absolute inset-0 w-full h-full object-cover" src={HERO_IMAGES[1].src} />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/35 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 text-white">
                <h3 className="font-headline-sm text-[24px] leading-snug">{ADVANTAGES[0].title}</h3>
                <p className="mt-2 text-white/80 text-[15px] max-w-md">{ADVANTAGES[0].text}</p>
                <p className="mt-4 text-[13px] text-primary-fixed">{ADVANTAGES[0].note}</p>
              </div>
            </article>
            <div className="lg:col-span-6 divide-y divide-surface-container">
              {ADVANTAGES.slice(1).map((item) => (
                <article className="py-5 first:pt-0 last:pb-0 flex gap-4" key={item.title}>
                  <Icon className="text-primary text-[22px] mt-0.5 shrink-0" fill name={item.icon} />
                  <div>
                    <h3 className="font-headline-sm text-[18px] leading-snug text-charcoal">{item.title}</h3>
                    <p className="mt-1 text-slate-gray text-[15px] leading-relaxed">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-10 rounded-xl px-6 py-6 md:px-8 md:py-7 bg-white border-l-4 border-primary flex flex-col md:flex-row md:items-center gap-6">
            <div className="min-w-0 flex-1">
              <p className="font-headline-sm text-[20px] leading-snug text-charcoal italic pb-1">
                “Partnering with Mmondo increased our gorilla safari bookings by 70% in our first season.”
              </p>
              <p className="mt-3 text-sm">
                <span className="font-label-md text-ink">Brian Mugisha</span>
                <span className="text-slate-gray"> - Founder, Pearls of Kigezi Safaris, Kabale</span>
              </p>
            </div>
            <a className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-lg font-label-md text-label-md transition-all inline-flex items-center justify-center gap-2 shrink-0 w-full md:w-auto" href="#register-section" onClick={() => setTab("register")}>
              Operator Sign Up
              <Icon className="text-sm" name="arrow_forward" />
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-4">
            <h2 className="font-headline-md text-[28px] md:text-headline-md text-charcoal">How it works</h2>
            <p className="font-body-md text-on-surface-variant mt-3">Start welcoming guests in days, not months.</p>
          </div>
          <ol className="md:col-span-8 space-y-8">
            {STEPS.map((step) => (
              <li className="flex gap-4 md:gap-5" key={step.title}>
                <Icon className="text-primary text-[24px] mt-1 shrink-0" name={step.icon} />
                <div>
                  <h3 className="font-headline-sm text-[22px] text-charcoal">{step.title}</h3>
                  <p className="mt-1 text-slate-gray text-[15px] leading-relaxed max-w-[55ch]">{step.text}</p>
                  <p className="mt-2 text-[13px] text-slate-gray">{step.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-charcoal text-white py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-8 space-y-3">
            <h2 className="font-headline-md text-[28px] md:text-headline-md text-white">Vetting you can stand behind</h2>
            <p className="font-body-md text-white/70 max-w-2xl">
              We partner with certified, insured, and experienced local operators so travelers feel secure and your business keeps its edge.
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <a className="bg-primary hover:bg-primary-container text-white px-7 py-3.5 rounded-lg font-label-md text-label-md transition-all text-center w-full sm:w-auto" href="#register-section" onClick={() => setTab("register")}>
              Operator Sign Up
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
