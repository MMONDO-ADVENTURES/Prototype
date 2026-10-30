import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { cldCard } from "../cloudinary";
import { Icon } from "../utils";

const NEWSLETTER_IMAGE =
  "https://res.cloudinary.com/yqsld0pd/image/upload/v1793292048/Rwenzori_Mountains__tough_trekking_in_Scenic_Paradise.svg";

export default function NewsletterSignup({ className = "" }) {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const subscribed = Boolean(user?.newsletter_subscribed) || done;

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!user) {
      const next = encodeURIComponent("/newsletter");
      const query = email.trim() ? `&email=${encodeURIComponent(email.trim())}` : "";
      navigate(`/signup?next=${next}${query}`);
      return;
    }
    setBusy(true);
    try {
      await api("/newsletter/subscribe", { method: "POST" });
      await refresh();
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl md:h-[240px]">
        <div className="relative h-[160px] md:h-full">
          <img
            alt="Sunrise over the Rwenzori Mountains"
            className="absolute inset-0 w-full h-full object-cover"
            decoding="async"
            loading="lazy"
            src={cldCard(NEWSLETTER_IMAGE)}
          />
        </div>
        <div className="bg-[#FFF4E8] flex flex-col justify-center px-6 py-6 md:px-10 lg:px-12">
          <h2 className="font-headline-md text-[22px] md:text-[26px] leading-tight text-charcoal mb-2">
            Your Uganda itinerary is waiting.
          </h2>
          <p className="text-[14px] text-slate-gray leading-relaxed mb-4 max-w-xl">
            Receive a curated 48-hour itinerary featuring the most iconic experiences in Uganda, straight to your inbox.
          </p>
          {subscribed ? (
            <p className="inline-flex items-center gap-2 text-charcoal font-medium">
              <Icon fill name="check_circle" className="text-primary text-[22px]" />
              You&apos;re subscribed. Watch your inbox for new journeys.
            </p>
          ) : (
            <form className="flex items-center gap-3 max-w-lg" onSubmit={submit}>
              <label className="relative flex-1">
                <span className="sr-only">Email</span>
                <input
                  className="w-full h-12 rounded-full bg-white border-0 shadow-sm pl-5 pr-12 text-[15px] text-charcoal placeholder:text-slate-gray outline-none focus:ring-2 focus:ring-primary"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  required
                  type="email"
                  value={email}
                />
                <Icon name="mail" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-gray text-[20px] pointer-events-none" />
              </label>
              <button
                className="shrink-0 h-12 px-6 rounded-full bg-primary text-white font-label-md text-[15px] hover:bg-primary-container transition-colors"
                disabled={busy}
                type="submit"
              >
                {busy ? "…" : "Sign up"}
              </button>
            </form>
          )}
          {error && <p className="text-error text-sm mt-3">{error}</p>}
        </div>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-slate-gray max-w-4xl">
        By signing up, you agree to receive promotional emails on activities and insider tips. You can unsubscribe or withdraw your consent at any time with future effect. For more information, read our{" "}
        <Link className="text-charcoal underline hover:text-primary" to="/about">
          Privacy statement
        </Link>
        .
      </p>
    </section>
  );
}
