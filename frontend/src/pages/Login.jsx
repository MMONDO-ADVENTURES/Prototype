import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { cldHero } from "../cloudinary";
import { AppleIcon, GoogleIcon, Icon } from "../utils";

const AUTH_IMAGE =
  "https://res.cloudinary.com/yqsld0pd/image/upload/v1791391526/gabriel-schumacher-kcKJTpYTdIQ-unsplash.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "";
  const query = next ? `?next=${encodeURIComponent(next)}` : "";

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password, next } });
      await refresh();
      navigate(data.redirect || next || "/tours");
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
          <h2 className="text-white font-headline-sm text-headline-sm mb-2">Discover the Pearl of Africa</h2>
          <p className="text-white/90 font-body-md text-body-md max-w-md">
            Immerse yourself in authentic Ugandan experiences and cinematic landscapes.
          </p>
        </div>
      </div>
      <div className="w-full md:w-1/2 h-full min-h-0 flex flex-col items-center justify-center px-margin-mobile py-3 overflow-hidden">
        <div className="w-full max-w-[400px] max-h-full flex flex-col min-h-0">
          <div className="bg-white rounded-xl auth-card-shadow overflow-y-auto overscroll-contain border border-surface-container">
            <div className="flex bg-surface-container-low p-1 m-3 mb-0 rounded-lg">
              <Link className="flex-1 py-1.5 text-center text-label-md font-label-md rounded-md bg-white text-primary shadow-sm" to={`/login${query}`}>Log in</Link>
              <Link className="flex-1 py-1.5 text-center text-label-md font-label-md rounded-md text-secondary hover:text-charcoal transition-colors" to={`/signup${query}`}>Sign up</Link>
            </div>
            <div className="px-4 md:px-5 pt-4 pb-4">
              <div className="text-center mb-3">
                <h1 className="font-headline-sm text-[22px] leading-tight text-charcoal mb-0.5">Welcome Back</h1>
                <p className="font-body-md text-[13px] text-secondary">Continue your Ugandan journey</p>
              </div>
              {error && (
                <div className="mb-2.5 flex items-start gap-2 bg-error-container/50 border border-error/20 text-on-error-container rounded-lg p-2">
                  <Icon name="error" className="text-[18px] mt-0.5" />
                  <p className="font-body-md text-[13px]">{error}</p>
                </div>
              )}
              {params.get("error") && (
                <div className="mb-2.5 flex items-start gap-2 bg-error-container/50 border border-error/20 text-on-error-container rounded-lg p-2">
                  <Icon name="error" className="text-[18px] mt-0.5" />
                  <p className="font-body-md text-[13px]">{params.get("error")}</p>
                </div>
              )}
              {next && (
                <div className="mb-2.5 flex items-start gap-2 bg-primary-fixed/40 border border-primary/20 text-on-primary-fixed rounded-lg p-2">
                  <Icon name="info" className="text-[18px] mt-0.5" />
                  <p className="font-body-md text-[13px]">Please sign in to continue with your booking.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <a className="flex items-center justify-center gap-2 py-2 px-3 border border-surface-container-high rounded-lg hover:bg-surface-container-low transition-colors" href={`/auth/google${query}`}>
                  <GoogleIcon />
                  <span className="font-label-md text-label-md text-charcoal">Google</span>
                </a>
                <a className="flex items-center justify-center gap-2 py-2 px-3 border border-surface-container-high rounded-lg hover:bg-surface-container-low transition-colors" href="/auth/apple">
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
                <div>
                  <label className="block font-label-md text-[13px] text-secondary mb-1" htmlFor="email">Email Address</label>
                  <input className="w-full px-3.5 py-2 border border-surface-container-high rounded-lg font-body-md text-[15px] focus:ring-2 focus:ring-primary focus:border-primary outline-none" id="email" onChange={(e) => { setError(""); setEmail(e.target.value); }} placeholder="name@example.com" required type="email" value={email} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-label-md text-[13px] text-secondary" htmlFor="password">Password</label>
                    <Link className="text-primary font-label-md text-[13px] hover:text-primary-container" to="/forgot-password">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <input className="w-full px-3.5 py-2 pr-11 border border-surface-container-high rounded-lg font-body-md text-[15px] focus:ring-2 focus:ring-primary focus:border-primary outline-none" id="password" onChange={(e) => { setError(""); setPassword(e.target.value); }} placeholder="••••••••" required type={showPassword ? "text" : "password"} value={password} />
                    <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray hover:text-charcoal" onClick={() => setShowPassword((open) => !open)} type="button">
                      <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
                    </button>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input className="rounded border-surface-container-high text-primary accent-primary focus:ring-primary" type="checkbox" />
                  <span className="font-body-md text-[13px] text-secondary">Remember me</span>
                </label>
                <button className="w-full bg-primary text-white py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary-container active:scale-[0.99] shadow-sm flex items-center justify-center gap-2" disabled={loading} type="submit">
                  {loading ? <><Icon name="progress_activity" className="text-[18px] animate-spin" /> Signing in…</> : "Log in"}
                </button>
              </form>
              <p className="text-center mt-3 font-body-md text-[13px] text-secondary">
                Don't have an account? <Link className="text-primary font-label-md hover:text-primary-container" to={`/signup${query}`}>Create account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
