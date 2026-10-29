import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { CANCELLATION_POLICY, durationDays, formatMoney, Icon, joinName, priceUnit, priceUnitPhrase, splitCsv, splitName, tourDestinations, tourTypes } from "../utils";

const SAVED_CARDS_KEY = "mmondo.savedCards";

function loadPaypalSdk(clientId) {
  if (window.paypal) return Promise.resolve(window.paypal);
  const existing = document.getElementById("paypal-sdk");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.paypal), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load PayPal")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons&enable-funding=paypal&disable-funding=card,credit,paylater,venmo,sepa`;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error("Could not load PayPal"));
    document.body.appendChild(script);
  });
}

function extraCompanionSlots(adults, kids) {
  const extraAdults = Math.max(0, Number(adults || 1) - 1);
  const childCount = Math.max(0, Number(kids || 0));
  return [
    ...Array.from({ length: extraAdults }, () => ({ full_name: "", role: "adult", details: "" })),
    ...Array.from({ length: childCount }, () => ({ full_name: "", role: "child", details: "" })),
  ];
}

function mergeCompanionSlots(adults, kids, existing) {
  const slots = extraCompanionSlots(adults, kids);
  (existing || []).forEach((item, index) => {
    if (!slots[index]) return;
    slots[index] = {
      ...slots[index],
      full_name: item.full_name || "",
      details: item.details || "",
    };
  });
  return slots;
}

function companionLabel(person, index, list) {
  if (person.role === "child") {
    const number = list.slice(0, index + 1).filter((item) => item.role === "child").length;
    return `Child ${number}`;
  }
  const number = list.slice(0, index + 1).filter((item) => item.role === "adult").length + 1;
  return `Adult ${number}`;
}

function formatDateRange(startValue, duration) {
  if (!startValue) return "Dates to be confirmed";
  const start = new Date(`${startValue}T00:00:00`);
  if (Number.isNaN(start.getTime())) return startValue;
  const span = Math.max(durationDays(duration) - 1, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + span);
  const month = start.toLocaleDateString(undefined, { month: "short" });
  if (span === 0) return `${start.getDate()} ${month}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${end.getDate()} ${month}`;
  }
  return `${start.getDate()} ${month} - ${end.getDate()} ${end.toLocaleDateString(undefined, { month: "short" })}`;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function detectBrand(number) {
  const digits = digitsOnly(number);
  if (digits.startsWith("4")) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (digits.startsWith("3")) return "amex";
  return "card";
}

function maskNumber(last4) {
  if (!last4) return "";
  return `•••• •••• •••• ${last4}`;
}

function loadSavedCards(userId) {
  if (!userId) return [];
  try {
    const all = JSON.parse(localStorage.getItem(SAVED_CARDS_KEY) || "{}");
    const list = all[String(userId)] || [];
    return Array.isArray(list) ? list.filter((card) => card?.last4) : [];
  } catch {
    return [];
  }
}

function persistSavedCards(userId, cards) {
  if (!userId) return;
  try {
    const all = JSON.parse(localStorage.getItem(SAVED_CARDS_KEY) || "{}");
    all[String(userId)] = cards;
    localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(all));
  } catch {
    /* Ignore quota / private-mode failures. */
  }
}

function PaypalMark() {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#003087] shrink-0" aria-hidden>
      <span className="text-white font-bold italic text-[17px] leading-none">P</span>
    </span>
  );
}

function MastercardMark() {
  return (
    <span className="inline-flex items-center shrink-0 w-9 justify-center" aria-hidden>
      <span className="w-[18px] h-[18px] rounded-full bg-[#eb001b]" />
      <span className="w-[18px] h-[18px] rounded-full bg-[#f79e1b] -ml-2.5 opacity-90" />
    </span>
  );
}

function VisaMark() {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 shrink-0" aria-hidden>
      <span className="font-black italic text-[#1a1f71] text-[15px] tracking-tighter">VISA</span>
    </span>
  );
}

function AmexMark() {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#006fcf] shrink-0" aria-hidden>
      <span className="text-white font-bold text-[9px] tracking-tight">AMEX</span>
    </span>
  );
}

function CardMark({ brand }) {
  if (brand === "visa") return <VisaMark />;
  if (brand === "mastercard") return <MastercardMark />;
  if (brand === "amex") return <AmexMark />;
  return <Icon name="credit_card" className="text-[28px] text-charcoal shrink-0" />;
}

function WalletTile({ selected, onSelect, dashed, children }) {
  return (
    <button
      className={`relative text-left rounded-xl px-3.5 py-3 min-h-[78px] w-full transition-colors ${
        dashed
          ? selected
            ? "border border-dashed border-primary bg-primary/5"
            : "border border-dashed border-slate-gray/40 bg-white hover:border-primary/50"
          : selected
            ? "border border-primary bg-primary/5"
            : "border border-surface-container-high bg-white hover:border-primary/40"
      }`}
      onClick={onSelect}
      type="button"
    >
      {selected && (
        <span className="absolute -top-2.5 right-3 bg-primary text-white text-[11px] font-label-md px-2 py-0.5 rounded-full">
          Selected
        </span>
      )}
      {children}
    </button>
  );
}

const emptyCard = { name: "", number: "", expiry: "", cvv: "" };

export default function Payment() {
  const [booking, setBooking] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [addCompanions, setAddCompanions] = useState(false);
  const [companions, setCompanions] = useState([]);
  const [wallet, setWallet] = useState("card");
  const [saveCard, setSaveCard] = useState(true);
  const [card, setCard] = useState({ ...emptyCard });
  const [savedCards, setSavedCards] = useState([]);
  const navigate = useNavigate();
  const [params, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const paypalButtonsRef = useRef(null);
  const payStateRef = useRef({});

  function clearCheckoutError() {
    setError("");
    setTermsError(false);
    if (params.get("error")) {
      const next = new URLSearchParams(params);
      next.delete("error");
      setSearchParams(next, { replace: true });
    }
  }

  useEffect(() => {
    Promise.all([api("/bookings/pending"), api("/payment/config")])
      .then(([pending, payConfig]) => {
        if (!pending.tour) {
          navigate("/tours");
          return;
        }
        setBooking(pending);
        setConfig(payConfig);
        setAddCompanions(Boolean(pending.add_companions) && pending.travelers > 1);
        setCompanions(mergeCompanionSlots(pending.adults, pending.kids, pending.companions));
      })
      .catch((err) => setError(err.message));
  }, [navigate]);

  useEffect(() => {
    const cards = loadSavedCards(user?.id);
    setSavedCards(cards);
    if (user?.full_name) {
      setCard((prev) => (prev.name ? prev : { ...prev, name: user.full_name }));
    }
    if (cards.length && (wallet === "card" || wallet === "paypal")) {
      const first = cards[0];
      setWallet(first.id);
      setCard({
        name: first.name || user?.full_name || "",
        number: maskNumber(first.last4),
        expiry: first.expiry || "",
        cvv: "",
      });
    }
  }, [user]);

  function requireLogin() {
    navigate(`/login?next=${encodeURIComponent("/payment")}`);
  }

  async function persistCompanions(nextAdd, nextList) {
    try {
      await api("/bookings/pending", {
        method: "PATCH",
        body: { add_companions: nextAdd, companions: nextAdd ? nextList : [] },
      });
    } catch {
      /* Keep local names even if the session save fails; checkout still sends them. */
    }
  }

  payStateRef.current = { agreed, addCompanions, companions, user, booking, config };

  useEffect(() => {
    if (wallet !== "paypal" || !config?.paypal_client_id || !paypalButtonsRef.current) return undefined;
    let buttons;
    let cancelled = false;
    const host = paypalButtonsRef.current;

    loadPaypalSdk(config.paypal_client_id)
      .then((paypal) => {
        if (cancelled || !paypal?.Buttons) throw new Error("PayPal failed to load");
        buttons = paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 45 },
          onClick(_data, actions) {
            const state = payStateRef.current;
            if (!state.agreed) {
              setTermsError(true);
              return actions.reject();
            }
            if (!state.user) {
              persistCompanions(state.addCompanions, state.companions);
              navigate(`/login?next=${encodeURIComponent("/payment")}`);
              return actions.reject();
            }
            if (state.addCompanions && state.companions.some((person) => !String(person.full_name || "").trim())) {
              setError("Please enter a name for each additional traveller, or uncheck adding other travellers.");
              return actions.reject();
            }
            setError("");
            return actions.resolve();
          },
          async createOrder(_data, actions) {
            const state = payStateRef.current;
            await persistCompanions(state.addCompanions, state.companions);
            if (state.config?.paypal_configured) {
              const order = await api("/payment/create-paypal-order", {
                method: "POST",
                body: {
                  add_companions: state.addCompanions,
                  companions: state.addCompanions ? state.companions : [],
                },
              });
              if (!order.id) throw new Error("PayPal did not return an order");
              return order.id;
            }
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: { currency_code: "USD", value: Number(state.booking?.total_price || 0).toFixed(2) },
                  description: String(state.booking?.tour?.title || "Tour booking").slice(0, 127),
                },
              ],
            });
          },
          async onApprove(data, actions) {
            const state = payStateRef.current;
            setBusy(true);
            if (state.config?.paypal_configured) {
              window.location.href = `/api/payment/paypal/return?token=${encodeURIComponent(data.orderID)}`;
              return;
            }
            const details = await actions.order.capture();
            const captureId = details?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
            await api("/payment/complete", {
              method: "POST",
              body: {
                payment_id: String(captureId || details?.id || data.orderID).slice(0, 100),
                payment_method: "paypal",
                status: "completed",
                add_companions: state.addCompanions,
                companions: state.addCompanions ? state.companions : [],
              },
            });
            navigate("/confirmation");
          },
          onCancel() {
            setBusy(false);
            setError("PayPal checkout was cancelled. You can try again whenever you're ready.");
          },
          onError(err) {
            setBusy(false);
            setError(err?.message || "PayPal checkout failed. Please try again.");
          },
        });
        return buttons.render(host);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load PayPal");
      });

    return () => {
      cancelled = true;
      host.innerHTML = "";
      try {
        buttons?.close();
      } catch {
        /* already unmounted */
      }
    };
  }, [wallet, config?.paypal_client_id, config?.paypal_configured, navigate]);

  function toggleAddCompanions(checked) {
    clearCheckoutError();
    const nextList = checked ? mergeCompanionSlots(booking.adults, booking.kids, companions) : companions;
    setAddCompanions(checked);
    setCompanions(nextList);
    persistCompanions(checked, nextList);
  }

  function updateCompanion(index, patch) {
    clearCheckoutError();
    setCompanions((current) => {
      const nextList = current.map((person, itemIndex) => (itemIndex === index ? { ...person, ...patch } : person));
      persistCompanions(true, nextList);
      return nextList;
    });
  }

  function selectWallet(next) {
    clearCheckoutError();
    setWallet(next);
    const leadName = user?.full_name || card.name || "";
    if (next === "paypal") return;
    if (next === "card" || next === "new") {
      setCard({ name: leadName, number: "", expiry: "", cvv: "" });
      return;
    }
    const saved = savedCards.find((item) => item.id === next);
    if (saved) {
      setCard({
        name: saved.name || leadName,
        number: maskNumber(saved.last4),
        expiry: saved.expiry || "",
        cvv: "",
      });
    }
  }

  function rememberCard() {
    if (!saveCard || !user?.id || wallet === "paypal") return;
    const last4 = digitsOnly(card.number).slice(-4);
    if (last4.length !== 4) return;
    const nextCard = {
      id: `card-${last4}-${card.expiry || "none"}`,
      brand: detectBrand(card.number),
      last4,
      expiry: card.expiry || "",
      name: card.name || user.full_name || "",
    };
    const nextList = [nextCard, ...savedCards.filter((item) => item.last4 !== last4 || item.expiry !== nextCard.expiry)].slice(0, 4);
    persistSavedCards(user.id, nextList);
    setSavedCards(nextList);
  }

  async function complete() {
    if (!agreed) {
      setTermsError(true);
      return;
    }
    if (loading) return;
    if (!user) {
      persistCompanions(addCompanions, companions);
      requireLogin();
      return;
    }
    if (addCompanions && companions.some((person) => !String(person.full_name || "").trim())) {
      setError("Please enter a name for each additional traveller, or uncheck adding other travellers.");
      return;
    }
    const kind = wallet === "paypal" ? "paypal" : "card";
    setBusy(true);
    setError("");
    try {
      await persistCompanions(addCompanions, companions);
      rememberCard();
      if (kind === "card" && config?.stripe_configured) {
        const session = await api("/payment/create-stripe-session", { method: "POST" });
        if (session.url) window.location.href = session.url;
        else setBusy(false);
        return;
      }
      if (kind === "paypal") {
        if (config?.paypal_configured) {
          const order = await api("/payment/create-paypal-order", {
            method: "POST",
            body: {
              add_companions: addCompanions,
              companions: addCompanions ? companions : [],
            },
          });
          if (order.url) window.location.href = order.url;
          else setBusy(false);
          return;
        }
        setError(config?.paypal_client_id
          ? "Use the PayPal button above to approve payment with PayPal."
          : "PayPal is not configured. Add PAYPAL_CLIENT_SECRET to open PayPal checkout.");
        setBusy(false);
        return;
      }
      await api("/payment/complete", {
        method: "POST",
        body: {
          payment_id: `${kind}-${Date.now()}`,
          payment_method: kind,
          status: "completed",
          add_companions: addCompanions,
          companions: addCompanions ? companions : [],
        },
      });
      navigate("/confirmation");
    } catch (err) {
      const message = err.message || "";
      if (/log in|unauthoriz|authentication required/i.test(message)) {
        requireLogin();
        return;
      }
      setError(message);
      setBusy(false);
    }
  }

  if (!booking) return <div className="p-12 text-center">Loading payment…</div>;

  const paymentError = params.get("error");
  const tour = booking.tour || {};
  const destination = tourDestinations(tour)[0] || "Uganda";
  const places = tourDestinations(tour);
  const stay = splitCsv(tour.accommodations)[0] || "Accommodation";
  const dates = formatDateRange(booking.tour_date, tour.duration);
  const image = booking.tour_image || tour.images?.[0]?.image_url || tour.image_url;
  const operator = tour.creator?.company_name || tour.creator?.full_name || "";
  const typeLabel = (tourTypes(tour)[0] || "Safari").replace(/[-_]/g, " ");
  const hasSavedCards = savedCards.length > 0;
  const showCardForm = wallet !== "paypal";
  const inputClass =
    "w-full p-3 pr-10 rounded-lg border border-surface-container-high bg-white text-[14px] text-charcoal placeholder:text-slate-gray/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="bg-white min-h-[70vh] font-body-md text-charcoal">
      <div className="max-w-[1120px] mx-auto px-margin-mobile lg:px-margin-desktop py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] gap-8 xl:gap-12 items-start">
          <div className="min-w-0">
            {hasSavedCards ? (
              <>
                <h2 className="font-headline-sm text-[22px] text-charcoal mb-4">Saved Card</h2>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {savedCards.map((saved) => (
                    <WalletTile key={saved.id} onSelect={() => selectWallet(saved.id)} selected={wallet === saved.id}>
                      <span className="flex items-center gap-3">
                        <CardMark brand={saved.brand} />
                        <span>
                          <span className="block font-semibold text-[14px] text-charcoal leading-snug">
                            {saved.brand === "visa" ? "Visa" : saved.brand === "mastercard" ? "Mastercard" : saved.brand === "amex" ? "Amex" : "Card"} ending in {saved.last4}
                          </span>
                          <span className="block text-[12px] text-slate-gray mt-0.5">Expiry {saved.expiry || "—"}</span>
                        </span>
                      </span>
                    </WalletTile>
                  ))}
                  <WalletTile dashed onSelect={() => selectWallet("new")} selected={wallet === "new"}>
                    <span className="flex items-center justify-center gap-2 h-full min-h-[54px] text-slate-gray">
                      <Icon name="add" className="text-[20px]" />
                      <span className="font-medium text-[14px]">Add new card</span>
                    </span>
                  </WalletTile>
                  <WalletTile onSelect={() => selectWallet("paypal")} selected={wallet === "paypal"}>
                    <span className="flex items-center gap-3">
                      <PaypalMark />
                      <span>
                        <span className="block font-semibold text-[14px] text-charcoal leading-snug">PayPal</span>
                        <span className="block text-[12px] text-slate-gray mt-0.5">Pay with your PayPal account</span>
                      </span>
                    </span>
                  </WalletTile>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-headline-sm text-[22px] text-charcoal mb-4">Payment method</h2>
                <p className="text-[13px] text-slate-gray mb-4">Choose how you would like to pay for this tour.</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <WalletTile onSelect={() => selectWallet("card")} selected={wallet === "card"}>
                    <span className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <VisaMark />
                        <MastercardMark />
                      </span>
                      <span>
                        <span className="block font-semibold text-[14px] text-charcoal leading-snug">Card</span>
                        <span className="block text-[12px] text-slate-gray mt-0.5">Visa, Mastercard, Amex</span>
                      </span>
                    </span>
                  </WalletTile>
                  <WalletTile onSelect={() => selectWallet("paypal")} selected={wallet === "paypal"}>
                    <span className="flex items-center gap-3">
                      <PaypalMark />
                      <span>
                        <span className="block font-semibold text-[14px] text-charcoal leading-snug">PayPal</span>
                        <span className="block text-[12px] text-slate-gray mt-0.5">Pay with your PayPal account</span>
                      </span>
                    </span>
                  </WalletTile>
                </div>
              </>
            )}

            {(error || paymentError) && (
              <div className="mb-6 flex items-start gap-3 bg-error-container/50 border border-error/20 text-on-error-container rounded-lg p-4">
                <Icon name="error" className="text-[20px] mt-0.5" />
                <p className="text-[14px] flex-1">
                  {error || (paymentError === "cancelled" ? "Payment was cancelled. You can try again whenever you're ready." : "Something went wrong with checkout. Please try again.")}
                </p>
                <button className="text-on-error-container/80 hover:text-on-error-container" onClick={clearCheckoutError} type="button">
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>
            )}

            {showCardForm && (
              <div className="border-t border-surface-container pt-6">
                <h2 className="font-headline-sm text-[22px] text-charcoal mb-4">Card Details</h2>
                <div className="space-y-4">
                  <label className="flex flex-col gap-1.5 text-[13px] text-charcoal">
                    Cardholder name
                    <span className="relative">
                      <input className={inputClass} onChange={(e) => { clearCheckoutError(); setCard({ ...card, name: e.target.value }); }} placeholder="Name on card" value={card.name} />
                      <Icon name="person" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray text-[20px]" />
                    </span>
                  </label>
                  <label className="flex flex-col gap-1.5 text-[13px] text-charcoal">
                    Card number
                    <span className="relative">
                      <input className={`${inputClass} tracking-wide`} inputMode="numeric" onChange={(e) => { clearCheckoutError(); setCard({ ...card, number: e.target.value }); }} placeholder="ACCT-000003" value={card.number} />
                      <Icon name="credit_card" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray text-[20px]" />
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5 text-[13px] text-charcoal">
                      Expiry date
                      <span className="relative">
                        <input className={inputClass} onChange={(e) => { clearCheckoutError(); setCard({ ...card, expiry: e.target.value }); }} placeholder="MM/YYYY" value={card.expiry} />
                        <Icon name="calendar_today" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray text-[18px]" />
                      </span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13px] text-charcoal">
                      CVV
                      <span className="relative">
                        <input className={inputClass} inputMode="numeric" maxLength={4} onChange={(e) => { clearCheckoutError(); setCard({ ...card, cvv: e.target.value }); }} placeholder="***" type="password" value={card.cvv} />
                        <Icon name="help" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray text-[18px]" />
                      </span>
                    </label>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-[14px] text-charcoal">
                    <input checked={saveCard} className="w-4 h-4 accent-primary" onChange={(e) => setSaveCard(e.target.checked)} type="checkbox" />
                    Save my card details
                  </label>
                </div>
              </div>
            )}

            {wallet === "paypal" && (
              <p className="text-[14px] text-slate-gray border-t border-surface-container pt-6">
                PayPal will open so you can approve payment. After PayPal returns you here, the booking is confirmed.
              </p>
            )}

            <section className="mt-8 pt-6 border-t border-surface-container">
              <h2 className="font-headline-sm text-[22px] text-charcoal mb-2">Traveler Information</h2>
              {!user && (
                <p className="text-[13px] text-slate-gray mb-3">Sign in when you complete this booking to confirm your name and email.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-[13px] text-slate-gray">
                  First name
                  <input className="p-2.5 rounded-lg border border-surface-container-high bg-surface-container-low text-charcoal text-[14px]" placeholder="Added after you sign in" readOnly value={splitName(user?.full_name).first_name} />
                </label>
                <label className="flex flex-col gap-1 text-[13px] text-slate-gray">
                  Last name
                  <input className="p-2.5 rounded-lg border border-surface-container-high bg-surface-container-low text-charcoal text-[14px]" placeholder="Added after you sign in" readOnly value={splitName(user?.full_name).last_name} />
                </label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-[13px] text-slate-gray">
                  Email Address
                  <input className="p-2.5 rounded-lg border border-surface-container-high bg-surface-container-low text-charcoal text-[14px]" placeholder="Added after you sign in" readOnly value={user?.email || ""} />
                </label>
              </div>
              {booking.travelers > 1 && (
                <label className="flex items-start gap-3 mt-3 cursor-pointer">
                  <input checked={addCompanions} className="mt-1 w-4 h-4 accent-primary" onChange={(e) => toggleAddCompanions(e.target.checked)} type="checkbox" />
                  <span>
                    <span className="font-label-md text-[14px] text-charcoal">Add names and details for other travellers</span>
                    <span className="block text-[12px] text-slate-gray">Share who is joining you so the operator can prepare permits, rooms, and transfers.</span>
                  </span>
                </label>
              )}
              {addCompanions && companions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {companions.map((person, index) => (
                    <div className="rounded-xl border border-surface-container p-3 bg-surface-container-low space-y-2" key={`${person.role}-${index}`}>
                      <p className="font-label-md text-[13px] text-charcoal">{companionLabel(person, index, companions)}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input className="p-2.5 rounded-lg bg-white border border-surface-container-high text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" onChange={(e) => updateCompanion(index, { full_name: joinName(e.target.value, splitName(person.full_name).last_name) })} placeholder="First name" value={splitName(person.full_name).first_name} />
                        <input className="p-2.5 rounded-lg bg-white border border-surface-container-high text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" onChange={(e) => updateCompanion(index, { full_name: joinName(splitName(person.full_name).first_name, e.target.value) })} placeholder="Last name" value={splitName(person.full_name).last_name} />
                        <input className="sm:col-span-2 p-2.5 rounded-lg bg-white border border-surface-container-high text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" onChange={(e) => updateCompanion(index, { details: e.target.value })} placeholder="Details (age, diet, passport name)" value={person.details} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <label className="flex items-start gap-2 cursor-pointer text-[13px] text-charcoal mt-6">
              <input checked={agreed} className="mt-0.5 w-4 h-4 accent-primary" onChange={(e) => { setAgreed(e.target.checked); clearCheckoutError(); }} type="checkbox" />
              <span>
                I agree to the {tour.cancellation_policy || CANCELLATION_POLICY}{" "}
                <Link className="text-primary hover:text-primary-container" to="/about">Booking Terms</Link>.
              </span>
            </label>
            {termsError && <p className="mt-2 text-[13px] text-error">Please agree to the terms before paying.</p>}

            <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
              <Link className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-charcoal text-charcoal font-label-md text-[14px] hover:bg-surface-container-low" to={tour.id ? `/tour/${tour.id}` : "/tours"}>
                <Icon name="arrow_back" className="text-[18px]" /> Back
              </Link>
              {wallet === "paypal" && config?.paypal_client_id ? (
                <div className="w-full sm:w-[280px]" ref={paypalButtonsRef} />
              ) : (
                <button className="px-8 py-2.5 rounded-lg bg-primary text-white font-label-md text-[15px] hover:bg-primary-container disabled:opacity-60" disabled={busy} onClick={complete} type="button">
                  {busy ? "Processing…" : `Pay $${formatMoney(booking.total_price, 0)}`}
                </button>
              )}
            </div>
          </div>

          <aside className="md:sticky md:top-24">
            <div className="rounded-2xl bg-surface-container-low overflow-hidden">
              {image ? (
                <div className="relative h-36 bg-surface-container-high">
                  <img alt={tour.title || "Tour"} className="w-full h-full object-cover" src={image} />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 to-transparent" />
                  <p className="absolute bottom-3 left-4 right-4 text-white font-headline-sm text-[16px] leading-snug line-clamp-2">{tour.title || "Your tour"}</p>
                </div>
              ) : null}
              <div className="p-6">
                <h2 className="font-headline-sm text-[20px] text-charcoal mb-1">{image ? "Booking Summary" : tour.title || "Your tour"}</h2>
                {!image && <p className="text-[12px] text-slate-gray uppercase tracking-wider font-label-md mb-4">Booking Summary</p>}
                {image && <p className="text-[13px] text-slate-gray mb-4 line-clamp-2">{tour.title}</p>}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tour.duration ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-charcoal">{tour.duration}</span> : null}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-charcoal capitalize">{typeLabel}</span>
                  {tour.free_cancellation ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-primary">Free cancellation</span> : null}
                </div>
                {operator ? (
                  <p className="text-[13px] text-slate-gray mb-4 flex items-center gap-1.5">
                    <Icon name="storefront" className="text-[16px]" />
                    Operated by {operator}
                  </p>
                ) : null}
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-xl bg-white/70 p-3.5">
                    <Icon name="location_on" className="text-slate-gray text-[20px] mt-0.5" />
                    <div>
                      <p className="text-[12px] text-slate-gray">Destination</p>
                      <p className="font-semibold text-[15px] text-charcoal">{places.length ? places.join(", ") : destination}{tour.country ? `, ${tour.country}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl bg-white/70 p-3.5">
                    <Icon name="calendar_today" className="text-slate-gray text-[20px] mt-0.5" />
                    <div>
                      <p className="text-[12px] text-slate-gray">Dates</p>
                      <p className="font-semibold text-[15px] text-charcoal">{dates}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl bg-white/70 p-3.5">
                    <Icon name="group" className="text-slate-gray text-[20px] mt-0.5" />
                    <div>
                      <p className="text-[12px] text-slate-gray">Travelers</p>
                      <p className="font-semibold text-[15px] text-charcoal">
                        {booking.adults} Adult{booking.adults === 1 ? "" : "s"}
                        {booking.kids ? ` · ${booking.kids} Child${booking.kids === 1 ? "" : "ren"}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-container space-y-2.5 text-[14px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-gray">
                      {priceUnit(tour) === "person"
                        ? `$${formatMoney(booking.base_price || tour.price, 0)} × ${booking.travelers}`
                        : `$${formatMoney(booking.base_price || tour.price, 0)} ${priceUnitPhrase(tour)}`}
                    </span>
                    <span className="text-charcoal">${formatMoney(booking.base_subtotal || booking.total_price, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal">{stay}</span>
                    <span className="font-semibold text-primary">Included</span>
                  </div>
                  {tour.meeting_pickup ? (
                    <div className="flex items-center justify-between">
                      <span className="text-charcoal">Airport Pickup</span>
                      <span className="font-semibold text-primary">Included</span>
                    </div>
                  ) : null}
                  {Number(booking.donation) > 0 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-charcoal">Conservation donation</span>
                      <span className="text-charcoal">${formatMoney(booking.donation, 0)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 pt-4 border-t border-surface-container flex items-center justify-between">
                  <span className="font-bold text-[16px] text-charcoal">Total Amount</span>
                  <span className="font-bold text-[20px] text-charcoal">${formatMoney(booking.total_price, 0)}</span>
                </div>
                {tour.id ? (
                  <Link className="mt-4 inline-flex items-center gap-1 text-[13px] text-primary hover:text-primary-container" to={`/tour/${tour.id}`}>
                    View tour details
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </Link>
                ) : null}
                <p className="mt-4 flex items-center gap-1.5 text-[12px] text-slate-gray">
                  <Icon name="lock" className="text-[14px]" />
                  256-Bit SSL Encrypted · Safe Checkout
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
