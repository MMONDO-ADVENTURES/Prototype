import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Icon } from "../utils";

const AUTH_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD1j-IeWegnfhetMl7xQd9Q2OIAuW3z1owdS1TtjTBQh1vDkXKbCOJM7oi2jNDlT5sPMJQNSkUrnhrssgR4B9_6hfr5hrWACuPTFU8Vr4fkG8KPX5wKJCpQTKU0Vl6kPpHD6zUZVOqmVZBUwKzoKWtrQTZp7oUKfkxue-Uq0b6Agkd6Usy5F-2avQpkz0_sCBnIu7GJww1kryV22k7FxG0-jeDOknwyLTZswqrF0YLU4O014kGB5XrJ";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api("/auth/forgot-password", { method: "POST", body: { email } });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-0 flex flex-col lg:flex-row w-full h-full bg-surface">
      <div className="hidden lg:flex lg:w-1/2 relative bg-charcoal overflow-hidden h-full">
        <div className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay" style={{ backgroundImage: `url('${AUTH_IMAGE}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
        <div className="relative z-10 p-10 flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
          <h1 className="font-bold text-[28px] xl:text-[36px] text-white mb-4 drop-shadow-lg leading-tight">
            Reconnect with the<br />
            <span className="text-primary-fixed">Pearl of Africa.</span>
          </h1>
          <p className="font-body-md text-body-md text-inverse-on-surface/90 drop-shadow-md">
            Your next adventure awaits. Let's get you back into your account securely.
          </p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-6 lg:py-4 px-margin-mobile bg-surface relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-tertiary-container/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />
        <div className="w-full max-w-md z-10 my-auto">
          <div className="bg-surface-container-lowest rounded-xl auth-card-shadow p-6 md:p-8 relative border border-surface-container">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="lock_reset" className="text-primary text-[28px]" />
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Forgot Password?</h2>
              <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>
            </div>
            {error && (
              <div className="mb-4 flex items-start gap-2 bg-error-container/50 border border-error/20 text-on-error-container rounded-lg p-2.5">
                <Icon name="error" className="text-[18px] mt-0.5" />
                <p className="font-body-md text-[13px]">{error}</p>
              </div>
            )}
            {message && (
              <div className="mb-4 flex items-start gap-2 bg-tertiary-container/15 border border-tertiary/30 text-on-tertiary-container rounded-lg p-2.5">
                <Icon name="check_circle" className="text-[18px] mt-0.5" />
                <p className="font-body-md text-[13px]">{message}</p>
              </div>
            )}
            <form className="space-y-5" onSubmit={submit}>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <Icon name="mail" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary text-[20px]" />
                  <input className="w-full pl-11 pr-4 py-2.5 bg-surface border border-slate-gray/30 rounded-lg font-body-md text-[15px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" id="email" onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required type="email" value={email} />
                </div>
              </div>
              <button className="w-full bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md py-3 px-6 rounded-lg shadow-sm hover:shadow-md flex justify-center items-center gap-2 group disabled:opacity-70" disabled={loading} type="submit">
                {loading ? "Sending…" : "Send Reset Link"}
                <Icon name="arrow_forward" className="text-[20px] group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors group" to="/login">
                <Icon name="arrow_back" className="text-[18px] group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
