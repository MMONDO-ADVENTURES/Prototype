import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import PhoneField from "../components/PhoneField";
import { Icon, joinName, splitName } from "../utils";

const COUNTRIES = ["Uganda", "Kenya", "Tanzania", "Rwanda", "United Kingdom", "United States", "Germany", "Canada", "Other"];
const DIETARY = ["Vegetarian", "Vegan", "Gluten-Free"];

function defaultsFrom(preferences) {
  return {
    dietary: preferences?.dietary || [],
    pace: preferences?.pace || "moderate",
    country: preferences?.country || "Uganda",
    two_factor: Boolean(preferences?.two_factor),
    passport_expiry: preferences?.passport_expiry || "",
    has_passport: Boolean(preferences?.has_passport),
  };
}

export default function Profile() {
  const { user, preferences, refresh, setPreferences } = useAuth();
  const [params] = useSearchParams();
  const [section, setSection] = useState(params.get("section") || "profile");
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", country: "Uganda" });
  const [prefs, setPrefs] = useState(defaultsFrom(preferences));
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const next = params.get("section");
    if (next) setSection(next);
  }, [params]);

  useEffect(() => {
    if (user) {
      const next = defaultsFrom(preferences);
      const names = splitName(user.full_name);
      setForm({
        first_name: names.first_name,
        last_name: names.last_name,
        email: user.email || "",
        phone: user.phone || "",
        country: next.country,
      });
      setPrefs(next);
    }
  }, [user, preferences]);

  function flash(text, isError = false) {
    setError(isError ? text : "");
    setMessage(isError ? "" : text);
  }

  async function savePrefs(partial) {
    const payload = { ...prefs, ...partial };
    const data = await api("/auth/profile/preferences", { method: "PUT", body: payload });
    setPrefs(data.preferences);
    setPreferences(data.preferences);
    flash(data.message);
  }

  async function saveProfile(event) {
    event.preventDefault();
    try {
      const data = await api("/auth/profile", {
        method: "PUT",
        body: { ...form, full_name: joinName(form.first_name, form.last_name) },
      });
      flash(data.message);
      await refresh();
    } catch (err) {
      flash(err.message, true);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    try {
      const data = await api("/auth/profile/password", { method: "POST", body: passwords });
      flash(data.message);
      setPasswords({ current_password: "", new_password: "" });
    } catch (err) {
      flash(err.message, true);
    }
  }

  async function uploadPicture(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("picture", file);
    await api("/auth/profile/picture", { method: "POST", body });
    await refresh();
    flash("Profile picture updated");
  }

  function toggleDietary(key) {
    const dietary = prefs.dietary.includes(key) ? prefs.dietary.filter((item) => item !== key) : [...prefs.dietary, key];
    setPrefs({ ...prefs, dietary });
  }

  if (!user) return null;

  const navItem = (id, icon, label) => (
    <button
      className={`flex items-center gap-3 p-3 rounded-lg font-label-md text-label-md text-left ${
        section === id ? "bg-white/10 text-white" : "text-secondary-fixed-dim hover:bg-white/5 hover:text-white"
      }`}
      onClick={() => setSection(id)}
      type="button"
    >
      <Icon name={icon} className={`text-[20px] ${section === id ? "text-primary-fixed" : ""}`} />
      {label}
    </button>
  );

  return (
    <div className="w-full min-h-screen bg-surface-container-low">
      <div className="max-w-[1280px] w-full mx-auto px-margin-mobile lg:px-margin-desktop py-12 flex flex-col lg:flex-row gap-gutter relative">
        {(message || error) && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg shadow-lg font-label-md text-label-md ${error ? "bg-error text-white" : "bg-tertiary text-white"}`}>
            {error || message}
          </div>
        )}
        <aside className="w-full lg:w-72 flex-shrink-0 relative">
          <div className="sticky top-28 bg-charcoal rounded-xl shadow-lg p-6 flex flex-col gap-6">
            <div className="flex flex-col items-center mb-4">
              <label className="w-24 h-24 rounded-full bg-surface-container-high mb-4 relative overflow-hidden group shadow-md cursor-pointer block" htmlFor="picture-input">
                {user.picture ? <img alt={user.full_name} className="w-full h-full object-cover" src={user.picture} /> : <div className="w-full h-full flex items-center justify-center bg-primary/20"><Icon name="person" className="text-white text-4xl" /></div>}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="photo_camera" className="text-white" />
                </div>
                <input accept="image/*" className="hidden" id="picture-input" onChange={uploadPicture} type="file" />
              </label>
              <h2 className="font-headline-sm text-headline-sm text-white text-center">{user.full_name || "Traveler"}</h2>
              <p className="font-body-md text-body-md text-secondary-fixed-dim text-center mt-1">{user.is_admin || user.is_operator ? "Tour Operator" : "Avid Explorer"}</p>
            </div>
            <nav className="flex flex-col gap-2 w-full">
              {navItem("profile", "person", "Profile Information")}
              {navItem("security", "shield", "Account Security")}
              {navItem("preferences", "tune", "Travel Preferences")}
              {navItem("documents", "description", "Travel Documents")}
              {navItem("payment", "credit_card", "Payment Methods")}
            </nav>
          </div>
        </aside>

        <div className="flex-grow flex flex-col gap-12 max-w-4xl">
          {section === "profile" && (
            <section className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[100px] -z-10" />
              <h3 className="font-headline-sm text-headline-sm text-ink mb-2">Profile Information</h3>
              <p className="font-body-md text-body-md text-secondary mb-8">Manage your personal details and how we contact you.</p>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={saveProfile}>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">First Name</label>
                  <input className="p-3 bg-surface-bright rounded-lg focus:ring-2 focus:ring-primary" onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Jane" required value={form.first_name} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">Last Name</label>
                  <input className="p-3 bg-surface-bright rounded-lg focus:ring-2 focus:ring-primary" onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Okello" required value={form.last_name} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">Email Address</label>
                  <input className="p-3 bg-surface-bright rounded-lg focus:ring-2 focus:ring-primary" onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email" value={form.email} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">Phone Number</label>
                  <PhoneField onChange={(phone) => setForm({ ...form, phone })} value={form.phone} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">Country of Residence</label>
                  <select className="p-3 bg-surface-bright rounded-lg focus:ring-2 focus:ring-primary appearance-none" onChange={(e) => setForm({ ...form, country: e.target.value })} value={form.country}>
                    {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                  <button className="bg-primary text-white font-label-md text-label-md px-8 py-3 rounded-lg hover:bg-primary-container shadow-md" type="submit">Save Changes</button>
                </div>
              </form>
            </section>
          )}

          {section === "security" && (
            <section className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] p-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-surface-container-high">
                <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center"><Icon name="lock" className="text-error" /></div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-ink mb-1">Account Security</h3>
                  <p className="font-body-md text-body-md text-secondary">Keep your account safe with a strong password.</p>
                </div>
              </div>
              <div className="flex flex-col gap-8">
                {user.auth_method === "google" ? (
                  <p className="font-body-md text-secondary">You signed in with Google. Password changes are managed through your Google account.</p>
                ) : (
                  <form className="flex flex-col md:flex-row gap-6 md:items-end" onSubmit={savePassword}>
                    <div className="flex-grow flex flex-col gap-2">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">Current Password</label>
                      <input className="p-3 bg-surface-bright rounded-lg" onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required type="password" value={passwords.current_password} />
                    </div>
                    <div className="flex-grow flex flex-col gap-2">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">New Password</label>
                      <input className="p-3 bg-surface-bright rounded-lg" minLength={8} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} placeholder="Min. 8 characters" required type="password" value={passwords.new_password} />
                    </div>
                    <button className="border-2 border-outline text-on-surface-variant font-label-md px-6 py-3 rounded-lg hover:border-primary hover:text-primary" type="submit">Update Password</button>
                  </form>
                )}
                <div className="bg-surface rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-label-md text-label-md text-ink mb-1">Two-Factor Authentication (2FA)</h4>
                    <p className="font-body-md text-body-md text-secondary">Add an extra layer of security to your account.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      checked={prefs.two_factor}
                      className="sr-only peer"
                      onChange={(e) => savePrefs({ two_factor: e.target.checked })}
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary" />
                    <span className={`ml-3 font-label-md text-label-md ${prefs.two_factor ? "text-tertiary" : "text-secondary"}`}>{prefs.two_factor ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {section === "preferences" && (
            <section className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center"><Icon name="psychology" className="text-primary" /></div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-ink mb-1">Travel Preferences</h3>
                  <p className="font-body-md text-body-md text-secondary">Help us tailor your safari experience.</p>
                </div>
              </div>
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  savePrefs({ country: form.country });
                }}
              >
                <div className="flex flex-col gap-4">
                  <h4 className="font-label-md text-label-md text-ink uppercase tracking-wider text-xs">Dietary Requirements</h4>
                  <div className="flex flex-col gap-3">
                    {DIETARY.map((option) => {
                      const key = option.toLowerCase();
                      const checked = prefs.dietary.includes(key);
                      return (
                        <label className="flex items-center gap-3 cursor-pointer group" key={key}>
                          <input checked={checked} className="sr-only" onChange={() => toggleDietary(key)} type="checkbox" />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? "border-primary bg-primary" : "border-outline bg-white"}`}>
                            {checked && <Icon name="check" className="text-white text-[14px]" />}
                          </div>
                          <span className="font-body-md text-body-md text-ink">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="font-label-md text-label-md text-ink uppercase tracking-wider text-xs">Preferred Tour Pace</h4>
                  {[["moderate", "Moderate", "directions_walk", "Balanced mix of activity and relaxation."], ["active", "Active", "hiking", "Fast-paced, physically demanding itineraries."]].map(([value, label, icon, copy]) => (
                    <label className="cursor-pointer" key={value}>
                      <input checked={prefs.pace === value} className="sr-only" onChange={() => setPrefs({ ...prefs, pace: value })} type="radio" />
                      <div className={`bg-white p-4 rounded-lg border ${prefs.pace === value ? "bg-surface-bright border-l-4 border-primary shadow-sm" : "border-surface-container hover:border-outline"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-label-md text-label-md text-ink">{label}</span>
                          <Icon name={icon} className={prefs.pace === value ? "text-primary text-[18px]" : "text-on-surface-variant text-[18px]"} />
                        </div>
                        <p className="font-body-md text-body-md text-secondary text-sm">{copy}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="md:col-span-2 flex justify-end mt-2">
                  <button className="bg-primary text-white font-label-md text-label-md px-8 py-3 rounded-lg hover:bg-primary-container shadow-md" type="submit">Save Preferences</button>
                </div>
              </form>
            </section>
          )}

          {section === "documents" && (
            <section className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] p-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-surface-container-high">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center"><Icon name="description" className="text-primary" /></div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-ink mb-1">Travel Documents</h3>
                  <p className="font-body-md text-body-md text-secondary">Manage your essential travel documentation.</p>
                </div>
              </div>
              <form
                className="grid grid-cols-1 gap-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  savePrefs({ has_passport: true, passport_expiry: prefs.passport_expiry });
                }}
              >
                <div className="bg-surface-bright p-6 rounded-xl border border-surface-container-high">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm"><Icon name="passport" className="text-primary" /></div>
                      <div>
                        <h4 className="font-label-md text-label-md text-ink">Passport</h4>
                        <p className={`text-xs font-label-md ${prefs.has_passport ? "text-tertiary" : "text-error"}`}>{prefs.has_passport ? "On file" : "Not Uploaded"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-end gap-4 w-full md:w-auto">
                      <div className="flex flex-col gap-1 w-full md:w-48">
                        <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label-md">Expiry Date</label>
                        <input className="p-2 bg-white border border-outline-variant rounded text-sm" onChange={(e) => setPrefs({ ...prefs, passport_expiry: e.target.value })} type="date" value={prefs.passport_expiry} />
                      </div>
                      <button className="bg-primary text-white font-label-md text-label-md px-6 py-2 rounded-lg flex items-center gap-2" type="submit">
                        <Icon name="upload" className="text-[18px]" /> Save
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="font-label-md text-label-md text-ink uppercase tracking-wider text-xs">Other Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-4 border-2 border-dashed border-surface-container-high rounded-xl flex flex-col items-center justify-center gap-2" disabled type="button">
                      <Icon name="add_circle" className="text-secondary" />
                      <span className="text-sm text-secondary font-label-md">Add Visa</span>
                    </button>
                    <button className="p-4 border-2 border-dashed border-surface-container-high rounded-xl flex flex-col items-center justify-center gap-2" disabled type="button">
                      <Icon name="vaccines" className="text-secondary" />
                      <span className="text-sm text-secondary font-label-md">Add Vaccination Certificate</span>
                    </button>
                  </div>
                </div>
              </form>
            </section>
          )}

          {section === "payment" && (
            <section className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(30,30,30,0.08)] p-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-surface-container-high">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center"><Icon name="credit_card" className="text-primary" /></div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-ink mb-1">Payment Methods</h3>
                  <p className="font-body-md text-body-md text-secondary">Cards are entered securely at checkout — nothing is stored on this page.</p>
                </div>
              </div>
              <div className="bg-surface-bright rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm"><Icon name="lock" className="text-primary" /></div>
                <div className="flex-1">
                  <h4 className="font-label-md text-label-md text-ink mb-1">Secure checkout</h4>
                  <p className="font-body-md text-body-md text-secondary text-sm">Pay with card, PayPal, or mobile money when you book a tour. Your payment details are handled by our processors and are not saved here.</p>
                </div>
                <Link className="bg-primary text-white font-label-md text-label-md px-6 py-3 rounded-lg whitespace-nowrap" to="/tours#packages">Browse Tours</Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
