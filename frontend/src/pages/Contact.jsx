import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { Icon, joinName, splitName } from "../utils";

const HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDrznXkMVNUgfwpuKFNzOvGofvPLFUrS7A4sku1a-iR9ZiawSb00IT5pkevmJKeARB93J-b6Hc_blDHk5Rm7gsS4R4ZbkqNwfZK3JPVKMkG0fuXF4r3QGor8YCmUwAJdGfZp4eE0Ank2Tthh3BdcumULhpXcAreMqWoCc-0RJY632l1fuy4LKZIrmgVqgcBprOKN8NwiHufrqKgpnxaxfParSXp5HMuEeAhrhkewxy06RJ3DGpZbuAO";

const INQUIRIES = ["Booking", "General", "Wedding", "Corporate", "Others"];

const SOCIALS = ["Instagram", "LinkedIn", "Facebook", "TikTok"];

const FAQ_BANNER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCAc2PnvLGEF6BJS4c9VOAAHmr_lO25h4nntrjD-Iws3zz2Jw-gaxfWtVpeFuwNTyN7JDD9f15lC6bjxKmdRcVm3UJMULM7A2OJZoSSTnIP29imm1CBtwppTFENrmbLfpXP6rdR4qY1FXuioA-agn4UCUSQXmFwZBcwIjV0G8NvOptyEPqn0FLZLUHH59-vjSWTGkiI2l_iQplpeLcypT90aTDvIZSJMW572E072n8zGHXktq-uV2AL";

const FAQS = [
  {
    question: "What is the best time to visit Uganda?",
    answer:
      "Uganda is a year-round destination, but the dry seasons (June to August and December to February) are generally best for wildlife viewing and gorilla trekking. Trails are drier and animals gather around water sources.",
    more: { to: "/tours#packages", label: "Learn more" },
  },
  {
    question: "Do I need a visa to travel to Uganda?",
    answer:
      "Most nationalities need a visa. We recommend applying for an e-Visa online before you travel. Our team can point you to the current requirements for your passport.",
    more: { to: "/about#visa", label: "Learn more" },
  },
  {
    question: "Are your tours suitable for children?",
    answer:
      "Many cultural tours and wildlife safaris are family-friendly. Gorilla and chimpanzee trekking have a strict minimum age of 15, set by the Uganda Wildlife Authority.",
    more: { to: "/tours#packages", label: "Learn more" },
  },
  {
    question: "What if I need to cancel or change a booking?",
    answer:
      "Free cancellation is allowed up to 3 days before the start date. You can change dates, companions, or cancel from My Bookings once you have an account. If something goes wrong on the trip, message us and we will help you sort it out.",
    more: { to: "/about#cancellation", label: "Learn more" },
  },
];

const inputClass =
  "w-full rounded-full border !border-slate-gray/25 bg-white px-5 py-[11px] text-[14px] text-charcoal placeholder:text-slate-gray/70 focus:outline-none focus:!border-primary focus:ring-1 focus:ring-primary";

export default function Contact() {
  const { user, preferences, refresh } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [inquiry, setInquiry] = useState("General");
  const [message, setMessage] = useState("");
  const [offers, setOffers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    const names = splitName(user.full_name);
    setFirstName((current) => current || names.first_name);
    setLastName((current) => current || names.last_name);
    setEmail((current) => current || user.email || "");
    setPhone((current) => current || user.phone || "");
    setCountry((current) => current || preferences?.country || "");
  }, [user, preferences]);

  function clearStatus() {
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearStatus();
    const fullName = joinName(firstName, lastName);
    if (!fullName || !email.trim() || !message.trim()) {
      setError("Please add your name, email, and a message.");
      return;
    }
    const body = [
      `Name: ${fullName}`,
      `Email: ${email.trim()}`,
      phone.trim() ? `Phone: ${phone.trim()}` : "",
      country.trim() ? `Country: ${country.trim()}` : "",
      `Inquiry: ${inquiry}`,
      offers ? "Newsletter: yes, send exclusive offers" : "",
      "",
      message.trim(),
    ]
      .filter((line) => line !== "")
      .join("\n");
    const mailto =
      "mailto:info@mmondoadventures.ug" +
      "?subject=" +
      encodeURIComponent(`[Mmondo] ${inquiry}`) +
      "&body=" +
      encodeURIComponent(body);

    setSubmitting(true);
    try {
      if (offers && user) {
        await api("/newsletter/subscribe", { method: "POST" }).catch(() => {});
        await refresh().catch(() => {});
      }
      setSuccess("Opening your email app so you can send this to our team…");
      window.location.href = mailto;
    } catch (err) {
      setError(err.message || "Could not send your message. Please try again.");
    } finally {
      setTimeout(() => setSubmitting(false), 1600);
    }
  }

  return (
    <div className="w-full bg-charcoal">
      <section className="relative min-h-[100svh] lg:h-[100svh] lg:max-h-[100svh] lg:overflow-hidden scroll-mt-16" id="inquiry">
        <div className="absolute inset-0 bg-cover bg-[center_70%]" style={{ backgroundImage: `url('${HERO}')` }} />
        <div className="absolute inset-0 bg-charcoal/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-charcoal/20 to-transparent" />

        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-20 pb-6 lg:pb-8 flex flex-col">
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-8 lg:gap-12 xl:gap-16 flex-1 min-h-0">
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-10">
              <div className="max-w-xl pt-2 lg:pt-4">
                <h1 className="font-headline-md text-[36px] lg:text-[48px] leading-[1.12] text-white font-semibold tracking-tight">
                  You Have Questions,
                  <br />
                  We Have Answers
                </h1>
                <p className="mt-4 text-white/80 text-[14px] lg:text-[15px] leading-relaxed max-w-[420px]">
                  Discover experiences you will not find anywhere else, designed to immerse you in the heart of Uganda.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-8 text-white max-w-xl">
                <div>
                  <h2 className="font-semibold text-[15px] mb-2.5">Location</h2>
                  <p className="text-white/75 text-[13px] leading-[1.7]">
                    Mmondo Adventures
                    <br />
                    Mapeera House
                    <br />
                    Kampala, Uganda
                    <br />
                    Monday-Saturday | 09:00-18:00
                    <br />
                    (local time)
                  </p>
                </div>
                <div>
                  <h2 className="font-semibold text-[15px] mb-2.5">Social Media</h2>
                  <ul className="text-white/75 text-[13px] leading-[1.85]">
                    {SOCIALS.map((item) => (
                      <li key={item}>
                        <Link className="hover:text-primary transition-colors" to="/contact">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="font-semibold text-[15px] mb-2.5">Email</h2>
                  <a className="text-white/75 text-[13px] hover:text-primary transition-colors break-all" href="mailto:info@mmondoadventures.ug">
                    info@mmondoadventures.ug
                  </a>
                </div>
                <div>
                  <h2 className="font-semibold text-[15px] mb-2.5">Contact</h2>
                  <a className="block text-white/75 text-[13px] hover:text-primary transition-colors" href="tel:+2568000436640">
                    +256 80004 36640
                  </a>
                  <a className="block text-white/75 text-[13px] mt-1 hover:text-primary transition-colors" href="tel:+498000436640">
                    +49 80004 36640
                  </a>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[42%] lg:max-w-[520px] lg:min-w-[380px] flex">
              <div className="w-full bg-white rounded-[28px] shadow-[0_24px_60px_-24px_rgba(30,30,30,0.45)] p-6 md:p-8 flex flex-col lg:h-full">
                <h2 className="font-sans text-[22px] lg:text-[24px] text-charcoal font-semibold tracking-tight">Tell Us What You Need</h2>
                <p className="mt-1.5 mb-6 text-[14px] text-slate-gray">Our team is ready to assist you with every detail, big or small.</p>

                <form className="flex flex-col gap-3.5 flex-1 min-h-0" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      className={inputClass}
                      onChange={(event) => {
                        clearStatus();
                        setFirstName(event.target.value);
                      }}
                      placeholder="First Name"
                      required
                      type="text"
                      value={firstName}
                    />
                    <input
                      className={inputClass}
                      onChange={(event) => {
                        clearStatus();
                        setLastName(event.target.value);
                      }}
                      placeholder="Last Name"
                      type="text"
                      value={lastName}
                    />
                    <input
                      className={inputClass}
                      onChange={(event) => {
                        clearStatus();
                        setCountry(event.target.value);
                      }}
                      placeholder="Country"
                      type="text"
                      value={country}
                    />
                    <input
                      className={inputClass}
                      onChange={(event) => {
                        clearStatus();
                        setPhone(event.target.value);
                      }}
                      placeholder="Phone Number"
                      type="tel"
                      value={phone}
                    />
                    <input
                      className={`${inputClass} sm:col-span-2`}
                      onChange={(event) => {
                        clearStatus();
                        setEmail(event.target.value);
                      }}
                      placeholder="Email Address"
                      required
                      type="email"
                      value={email}
                    />
                  </div>

                  <div>
                    <p className="text-[13px] text-charcoal mb-2.5">Type of Inquiry</p>
                    <div className="flex flex-wrap gap-2">
                      {INQUIRIES.map((item) => {
                        const selected = inquiry === item;
                        return (
                          <button
                            className={`px-3.5 py-1.5 rounded-full text-[13px] border transition-colors ${
                              selected
                                ? "bg-charcoal text-white !border-charcoal"
                                : "bg-white text-charcoal !border-slate-gray/30 hover:!border-primary hover:text-primary"
                            }`}
                            key={item}
                            onClick={() => {
                              clearStatus();
                              setInquiry(item);
                            }}
                            type="button"
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <textarea
                    className="w-full flex-1 min-h-[110px] rounded-[22px] border !border-slate-gray/25 bg-white px-5 py-3 text-[14px] text-charcoal placeholder:text-slate-gray/70 focus:outline-none focus:!border-primary focus:ring-1 focus:ring-primary resize-none"
                    onChange={(event) => {
                      clearStatus();
                      setMessage(event.target.value);
                    }}
                    placeholder="Message"
                    required
                    rows={4}
                    value={message}
                  />

                  <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-slate-gray">
                    <input
                      checked={offers}
                      className="w-4 h-4 accent-primary shrink-0"
                      onChange={(event) => {
                        clearStatus();
                        setOffers(event.target.checked);
                      }}
                      type="checkbox"
                    />
                    I’d like to receive exclusive offers and updates
                  </label>

                  {error && (
                    <div className="flex items-start gap-2 text-[13px] text-on-error-container bg-error-container/50 border border-error/20 rounded-xl p-3">
                      <p className="flex-1">{error}</p>
                      <button aria-label="Dismiss" onClick={clearStatus} type="button">
                        <Icon name="close" className="text-[16px]" />
                      </button>
                    </div>
                  )}
                  {success && <p className="text-[13px] text-primary">{success}</p>}

                  <button
                    className="w-full rounded-full border !border-charcoal text-charcoal font-label-md text-[15px] py-3 hover:bg-primary hover:!border-primary hover:text-white transition-colors disabled:opacity-60"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? "Opening…" : "Submit"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white scroll-mt-16" id="faq">
        <div className="relative h-[260px] md:h-[320px] overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${FAQ_BANNER}')` }} />
          <div className="absolute inset-0 bg-charcoal/30" />
          <div className="relative z-10 h-full max-w-[900px] mx-auto px-margin-mobile flex flex-col items-center justify-center text-center">
            <h2 className="font-headline-md text-white text-[28px] md:text-[40px] leading-[1.15] font-semibold">
              Prepared to Start Your
              <br />
              Next Journey?
            </h2>
            <p className="mt-3 text-white/85 text-[14px] md:text-[15px] max-w-xl leading-relaxed">
              Plan your Uganda trip with trusted operators, clear details, and tours that find travellers.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-primary text-white px-6 py-2.5 text-[14px] font-label-md hover:bg-brand-secondary transition-colors"
                to="/tours#packages"
              >
                Book Now
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white text-white px-6 py-2.5 text-[14px] font-label-md hover:bg-white hover:text-charcoal transition-colors"
                to="/tours#packages"
              >
                Explore More
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-[760px] mx-auto px-margin-mobile py-14 md:py-20">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-headline-md text-[28px] md:text-[36px] leading-[1.2] text-charcoal font-semibold">
              Frequently Asked
              <br />
              Questions
            </h2>
            <p className="mt-3 text-[14px] text-slate-gray">
              If you have a question about planning, booking, or travelling with us, start here.
            </p>
          </div>

          <div>
            {FAQS.map((item) => (
              <article className="border-b border-slate-gray/20 py-6 first:pt-0" key={item.question}>
                <h3 className="font-sans text-[16px] md:text-[17px] font-semibold text-charcoal">{item.question}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-gray">{item.answer}</p>
                {item.more && (
                  <Link className="inline-block mt-2 text-[14px] text-primary hover:text-brand-secondary" to={item.more.to}>
                    {item.more.label}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
