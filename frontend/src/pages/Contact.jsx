import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import PhoneField from "../components/PhoneField";
import { Icon, joinName, splitName } from "../utils";

const HERO =
  "https://res.cloudinary.com/yqsld0pd/image/upload/v1793285204/roman-derrick-okello-kHzomTLWuAQ-unsplash.svg";

const INQUIRIES = ["Booking", "General", "Wedding", "Corporate", "Others"];

const SOCIALS = ["Instagram", "LinkedIn", "Facebook", "TikTok"];

const FAQ_BANNER =
  "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391518/jackalope-west-nBNROOkE0W8-unsplash.svg";

const FAQS = [
  {
    question: "What is the best time to visit Uganda?",
    answer:
      "Uganda is a year-round destination, but the dry seasons (June to August and December to February) are generally best for wildlife viewing and gorilla trekking. Trails are drier and animals gather around water sources.",
  },
  {
    question: "Do I need a visa to travel to Uganda?",
    answer:
      "Most nationalities need a visa. We recommend applying for an e-Visa online before you travel. Keep a copy of your passport, itinerary, and yellow-fever certificate if required. Our team can point you to the current rules for your passport.",
  },
  {
    question: "How do I register interest in a tour?",
    answer:
      "Open the tour you like and tap Book This Tour. Fill in the inquiry form with your dates, group size, and contact details. This is an expression of interest, not a confirmed booking. We will contact you to confirm availability and next steps.",
  },
  {
    question: "Is payment taken online?",
    answer:
      "Not at the moment. Online checkout is paused while we are in startup mode. Share your interest through the form and we will follow up by email or phone. No payment is taken until we confirm the trip with you.",
  },
  {
    question: "Are your tours suitable for children?",
    answer:
      "Many cultural tours and wildlife safaris are family-friendly. Gorilla and chimpanzee trekking have a strict minimum age of 15, set by the Uganda Wildlife Authority.",
  },
  {
    question: "Do I need vaccinations or malaria tablets?",
    answer:
      "Yellow fever vaccination is often required or strongly recommended for entry. Malaria is present in much of Uganda, so talk to a travel clinic about prophylaxis and bite prevention. We are not a medical service — follow current advice for your nationality.",
  },
  {
    question: "What should I pack?",
    answer:
      "Bring layers, rain protection, closed walking shoes, a hat, and insect repellent. Neutral colours work best on safari. For gorilla trekking, pack long sleeves, long trousers, and garden gloves. A valid passport is required for park entry and permits.",
  },
  {
    question: "How do gorilla permits work?",
    answer:
      "Gorilla trekking permits are issued by the Uganda Wildlife Authority and are limited each day. Availability and price are set by the park, not by Mmondo. Tell us your preferred dates on the inquiry form and we will check what the operator can arrange.",
  },
  {
    question: "Who operates the tours?",
    answer:
      "Mmondo connects travellers with verified Ugandan tour operators. Each tour’s dates, price, and inclusions are set by the operator listed on the tour page. We help you find the right trip and stay in touch until details are confirmed.",
  },
  {
    question: "What languages do guides speak?",
    answer:
      "Most operators guide in English. Some also speak Swahili, Luganda, or other languages listed on the tour page. If you need a specific language, mention it in your inquiry message.",
  },
  {
    question: "What if I need to cancel or change a trip?",
    answer:
      "Free cancellation is allowed up to 3 days before the start date once a booking is confirmed. You can change dates, companions, or cancel from My Bookings if you have an account. Closer to departure, contact us and we will work with the operator on what is possible.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "For gorilla trekking and peak dry-season dates, start three to six months ahead. Other safaris and cultural trips can often be arranged with shorter notice. Send your preferred window on the inquiry form and we will check what is still available.",
  },
  {
    question: "What is included in the tour price?",
    answer:
      "Each tour page lists inclusions set by the operator — typically guiding, park fees listed on the itinerary, and listed meals or transport. Flights, visas, travel insurance, drinks, tips, and personal expenses are usually extra unless the page says otherwise.",
  },
  {
    question: "Can I request a private or custom itinerary?",
    answer:
      "Yes. Many operators can run a private departure or adjust days, lodges, and parks. Describe what you want in the inquiry message, including dates, group size, and any must-see stops, and we will pass it to the operator.",
  },
  {
    question: "Do you arrange airport transfers and hotels?",
    answer:
      "Transfers and nights before or after a tour can often be added by the operator. Ask on the inquiry form if you need Entebbe or Kampala pickup, extra hotel nights, or help connecting two tours.",
  },
  {
    question: "How physically demanding is gorilla trekking?",
    answer:
      "Treks can last from one to eight hours on steep, muddy forest trails. A reasonable fitness level is needed. Porters are usually available to hire at the park. If you have mobility concerns, tell us before you travel so we can advise on what is realistic.",
  },
  {
    question: "Is travel insurance required?",
    answer:
      "We strongly recommend comprehensive travel insurance that covers medical care, evacuation, and trip changes. Some parks and activities assume you travel insured. Check that gorilla trekking and adventure activities are included in your policy.",
  },
  {
    question: "How many people are in a group?",
    answer:
      "Group size depends on the operator and the activity. Gorilla trekking is limited by the park, typically eight visitors per gorilla family. Safari vehicle numbers vary — check the tour page, or ask if you prefer a private vehicle.",
  },
  {
    question: "Is tipping expected?",
    answer:
      "Tipping is customary but not mandatory. Many travellers tip guides, drivers, and porters in cash (US dollars or Ugandan shillings). Your operator can suggest typical amounts for the itinerary you choose.",
  },
  {
    question: "How can I reach you?",
    answer:
      "Use the form on this page, email info@mmondoadventures.ug, or call +256 80004 36640. We are available Monday to Saturday, 9:00AM to 6:00PM local time.",
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
  const [openFaq, setOpenFaq] = useState(null);

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
      <section className="relative z-10 bg-charcoal min-h-[100svh] lg:h-[100svh] lg:max-h-[100svh] lg:overflow-hidden scroll-mt-16" id="inquiry">
        <div className="absolute inset-0 bg-cover bg-[center_70%]" style={{ backgroundImage: `url('${HERO}')` }} />
        <div className="absolute inset-0 bg-charcoal/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-charcoal/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 z-[3] bg-gradient-to-t from-charcoal via-charcoal/80 to-transparent pointer-events-none" />

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

            <div className="w-full lg:w-[52%] lg:max-w-[680px] lg:min-w-[440px] flex">
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
                    <div>
                      <PhoneField
                        onChange={(next) => {
                          clearStatus();
                          setPhone(next);
                        }}
                        placeholder=""
                        rounded="full"
                        value={phone}
                      />
                    </div>
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

      <section className="relative z-0 w-full bg-charcoal scroll-mt-16" id="faq">
        <div className="relative -mt-px h-[260px] md:h-[320px] overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${FAQ_BANNER}')` }} />
          <div className="absolute inset-0 bg-charcoal/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal from-0% via-charcoal/55 via-45% to-charcoal/55" />
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-charcoal to-transparent pointer-events-none" />
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

        <div className="bg-white">
        <div className="max-w-[760px] mx-auto px-margin-mobile py-10 md:py-14">
          <div className="text-center mb-5 md:mb-6">
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
            {FAQS.map((item, index) => {
              const open = openFaq === index;
              return (
                <article className="border-b border-slate-gray/20" key={item.question}>
                  <h3>
                    <button
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-4 py-1.5 text-left font-sans text-[15px] md:text-[16px] font-semibold text-charcoal hover:text-primary transition-colors"
                      onClick={() => setOpenFaq(open ? null : index)}
                      type="button"
                    >
                      <span>{item.question}</span>
                      <Icon
                        name="expand_more"
                        className={`text-[22px] text-primary shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                  </h3>
                  {open && (
                    <p className="pb-2 pt-0.5 text-[14px] leading-relaxed text-slate-gray">{item.answer}</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
