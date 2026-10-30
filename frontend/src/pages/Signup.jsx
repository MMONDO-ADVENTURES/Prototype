import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { cldHero } from "../cloudinary";
import { AppleIcon, GoogleIcon, Icon, joinName } from "../utils";

const AUTH_IMAGE =
  "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391515/pexels-rachel-claire-4577507.svg";

export default function Signup() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: params.get("email") || "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const next = params.get("next") || "";
  const query = next ? `?next=${encodeURIComponent(next)}` : "";
  const password = form.password;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const widths = ["0%", "25%", "50%", "75%", "100%"];
  const colors = ["bg-error", "bg-error", "bg-primary-container", "bg-primary", "bg-tertiary"];
  const labels = [
    "Use at least 8 characters with letters and numbers.",
    "Weak — keep going.",
    "Fair — add more variety.",
    "Good password.",
    "Strong password.",
  ];

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/signup", {
        method: "POST",
        body: { ...form, full_name: joinName(form.first_name, form.last_name) },
      });
      navigate(`/login${query}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-full min-h-0 overflow-hidden bg-surface-container-low">
      <div className="hidden md:flex md:w-1/2 relative bg-cover bg-center h-full min-h-0" style={{ backgroundImage: `url('${cldHero(AUTH_IMAGE)}')` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/55 via-charcoal/35 to-charcoal/70" />
        <div className="absolute inset-0 p-10 flex flex-col items-center justify-center text-center z-10">
          <h2 className="text-white font-headline-sm text-headline-sm mb-2">Join the journey</h2>
          <p className="text-white/90 font-body-md text-body-md max-w-md">
            Create your account to book safaris, manage trips, and explore Uganda with local experts.
          </p>
        </div>
      </div>
      <div className="w-full md:w-1/2 h-full min-h-0 flex flex-col items-center justify-center px-margin-mobile py-3 overflow-hidden">
        <div className="w-full max-w-[400px] max-h-full flex flex-col min-h-0">
          <div className="bg-white rounded-xl auth-card-shadow overflow-y-auto overscroll-contain border border-surface-container">
            <div className="flex bg-surface-container-low p-1 m-3 mb-0 rounded-lg">
              <Link className="flex-1 py-1.5 text-center text-label-md font-label-md rounded-md text-secondary hover:text-charcoal transition-colors" to={`/login${query}`}>Log in</Link>
              <Link className="flex-1 py-1.5 text-center text-label-md font-label-md rounded-md bg-white text-primary shadow-sm" to={`/signup${query}`}>Sign up</Link>
            </div>
            <div className="px-4 md:px-5 pt-4 pb-4">
              <div className="text-center mb-3">
                <h1 className="font-headline-sm text-[22px] leading-tight text-charcoal mb-0.5">Create Account</h1>
                <p className="font-body-md text-[13px] text-secondary">Join the Mmondo traveler community</p>
              </div>
              {error && (
                <div className="mb-2.5 flex items-start gap-2 bg-error-container/50 border border-error/20 text-on-error-container rounded-lg p-2">
                  <Icon name="error" className="text-[18px] mt-0.5" />
                  <p className="font-body-md text-[13px]">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <a className="flex items-center justify-center gap-2 py-2 px-3 border border-surface-container-high rounded-lg hover:bg-surface-container-low" href={`/auth/google${query}`}>
                  <GoogleIcon />
                  <span className="font-label-md text-label-md text-charcoal">Google</span>
                </a>
                <a className="flex items-center justify-center gap-2 py-2 px-3 border border-surface-container-high rounded-lg hover:bg-surface-container-low" href="/auth/apple">
                  <AppleIcon />
                  <span className="font-label-md text-label-md text-charcoal">Apple</span>
                </a>
              </div>
              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-surface-container-high" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-slate-gray font-label-md text-[11px] uppercase tracking-wider">Or email</span>
                </div>
              </div>
              <form className="space-y-2.5" onSubmit={submit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-label-md text-[13px] text-secondary mb-1" htmlFor="first_name">First Name</label>
                    <input className="w-full px-3.5 py-2 border border-surface-container-high rounded-lg font-body-md text-[15px] focus:ring-2 focus:ring-primary outline-none" id="first_name" maxLength={50} minLength={2} onChange={(e) => { setError(""); setForm({ ...form, first_name: e.target.value }); }} placeholder="Jane" required value={form.first_name} />
                  </div>
                  <div>
                    <label className="block font-label-md text-[13px] text-secondary mb-1" htmlFor="last_name">Last Name</label>
                    <input className="w-full px-3.5 py-2 border border-surface-container-high rounded-lg font-body-md text-[15px] focus:ring-2 focus:ring-primary outline-none" id="last_name" maxLength={50} minLength={2} onChange={(e) => { setError(""); setForm({ ...form, last_name: e.target.value }); }} placeholder="Okello" required value={form.last_name} />
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-[13px] text-secondary mb-1" htmlFor="email">Email Address</label>
                  <input className="w-full px-3.5 py-2 border border-surface-container-high rounded-lg font-body-md text-[15px] focus:ring-2 focus:ring-primary outline-none" id="email" onChange={(e) => { setError(""); setForm({ ...form, email: e.target.value }); }} placeholder="name@example.com" required type="email" value={form.email} />
                </div>
                <div>
                  <label className="block font-label-md text-[13px] text-secondary mb-1" htmlFor="password">Password</label>
                  <div className="relative">
                    <input className="w-full px-3.5 py-2 pr-11 border border-surface-container-high rounded-lg font-body-md text-[15px] focus:ring-2 focus:ring-primary outline-none" id="password" minLength={8} onChange={(e) => { setError(""); setForm({ ...form, password: e.target.value }); }} placeholder="••••••••" required type={showPassword ? "text" : "password"} />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray hover:text-charcoal" onClick={() => setShowPassword((open) => !open)} type="button">
                      <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
                    </button>
                  </div>
                  <div className="mt-1.5 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 rounded-full ${colors[score]}`} style={{ width: widths[score] }} />
                  </div>
                  <p className="mt-1 font-body-md text-[11px] text-slate-gray">{labels[score]}</p>
                </div>
                <div className="flex items-start gap-2">
                  <input className="mt-0.5 rounded border-surface-container-high text-primary accent-primary focus:ring-primary" id="terms" required type="checkbox" />
                  <label className="font-body-md text-[13px] text-secondary leading-snug" htmlFor="terms">
                    I agree to the <Link className="text-primary hover:text-primary-container" to="/about">Terms of Service</Link> and <Link className="text-primary hover:text-primary-container" to="/about">Privacy Policy</Link>.
                  </label>
                </div>
                <button className="w-full bg-primary text-white py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary-container active:scale-[0.99] shadow-sm flex items-center justify-center gap-2" disabled={loading} type="submit">
                  {loading ? <><Icon name="progress_activity" className="text-[18px] animate-spin" /> Creating account…</> : "Sign up"}
                </button>
              </form>
              <p className="text-center mt-3 font-body-md text-[13px] text-secondary">
                Already have an account? <Link className="text-primary font-label-md hover:text-primary-container" to={`/login${query}`}>Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
