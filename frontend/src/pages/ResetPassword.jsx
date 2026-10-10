import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { Icon } from "../utils";

const AUTH_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD1j-IeWegnfhetMl7xQd9Q2OIAuW3z1owdS1TtjTBQh1vDkXKbCOJM7oi2jNDlT5sPMJQNSkUrnhrssgR4B9_6hfr5hrWACuPTFU8Vr4fkG8KPX5wKJCpQTKU0Vl6kPpHD6zUZVOqmVZBUwKzoKWtrQTZp7oUKfkxue-Uq0b6Agkd6Usy5F-2avQpkz0_sCBnIu7GJww1kryV22k7FxG0-jeDOknwyLTZswqrF0YLU4O014kGB5XrJ";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await api("/auth/reset-password", {
        method: "POST",
        body: { token, new_password: newPassword, confirm_password: confirmPassword },
      });
      setMessage(data.message || "Password updated. Please log in.");
      setTimeout(() => navigate("/login"), 1200);
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
            Choose a new<br />
            <span className="text-primary-fixed">secure password.</span>
          </h1>
          <p className="font-body-md text-body-md text-inverse-on-surface/90 drop-shadow-md">
            After resetting, you can sign in and pick up your Ugandan adventure.
          </p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-6 lg:py-4 px-margin-mobile bg-surface relative overflow-y-auto">
        <div className="w-full max-w-md z-10 my-auto">
          <div className="bg-surface-container-lowest rounded-xl auth-card-shadow p-6 md:p-8 relative border border-surface-container">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="password" className="text-primary text-[28px]" />
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Reset Password</h2>
              <p className="font-body-md text-[14px] text-on-surface-variant">Enter a new password with at least 8 characters.</p>
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
                <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide">New Password</label>
                <input className="w-full px-4 py-2.5 bg-surface border border-slate-gray/30 rounded-lg font-body-md text-[15px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" minLength={8} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" required type="password" value={newPassword} />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide">Confirm Password</label>
                <input className="w-full px-4 py-2.5 bg-surface border border-slate-gray/30 rounded-lg font-body-md text-[15px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required type="password" value={confirmPassword} />
              </div>
              <button className="w-full bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md py-3 px-6 rounded-lg shadow-sm disabled:opacity-70" disabled={loading} type="submit">
                {loading ? "Updating…" : "Reset Password"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary" to="/login">
                <Icon name="arrow_back" className="text-[18px]" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
