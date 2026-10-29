import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLocale } from "../LocaleContext";
import { Icon, splitName } from "../utils";
import PhoneField from "./PhoneField";

export const INTEREST_LEVELS = [
  { value: "just_exploring", labelKey: "inquiry.exploring" },
  { value: "likely_to_book", labelKey: "inquiry.likely" },
  { value: "ready_soon", labelKey: "inquiry.ready" },
];

const fieldClass =
  "w-full p-3 rounded-lg border border-surface-container-high bg-white text-[14px] text-charcoal placeholder:text-slate-gray/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export default function TourInquiryModal({
  open,
  onClose,
  tour,
  preferredDate = "",
  people = 1,
  minDate = "",
}) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    preferred_date: "",
    people: 1,
    interest_level: "likely_to_book",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const names = splitName(user?.full_name);
    setDone(false);
    setError("");
    setForm({
      first_name: names.first_name,
      last_name: names.last_name,
      email: user?.email || "",
      phone: user?.phone || "",
      preferred_date: preferredDate || "",
      people: Number(people) > 0 ? Number(people) : 1,
      interest_level: "likely_to_book",
      message: "",
    });
  }, [open, user, preferredDate, people]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  function patch(next) {
    setError("");
    setForm((prev) => ({ ...prev, ...next }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/inquiries", {
        method: "POST",
        body: {
          tour_id: Number(tour.id),
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          preferred_date: form.preferred_date,
          people: Number(form.people),
          interest_level: form.interest_level,
          message: form.message,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button className="absolute inset-0 bg-charcoal/60" onClick={() => !busy && onClose()} type="button" aria-label={t("inquiry.closeForm")} />
      <div className="relative w-full sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_24px_60px_-20px_rgba(30,30,30,0.45)]">
        <div className="bg-charcoal text-white px-5 py-4 sm:px-6 sm:py-5 flex items-start justify-between gap-3">
          <div>
            <p className="font-label-md text-[11px] uppercase tracking-wider text-primary-fixed mb-1">{t("inquiry.kicker")}</p>
            <h2 className="font-headline-sm text-[22px] leading-tight">{t("inquiry.title")}</h2>
          </div>
          <button className="text-white/80 hover:text-white shrink-0" onClick={() => !busy && onClose()} type="button" aria-label={t("inquiry.close")}>
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>

        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[13px] leading-snug text-slate-gray bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 mb-4">
            {t("inquiry.note")}
          </p>

          {done ? (
            <div>
              <div className="flex items-start gap-3 bg-tertiary-container/15 border border-tertiary/30 rounded-lg p-4 mb-4">
                <Icon fill name="check_circle" className="text-[22px] text-primary shrink-0" />
                <p className="text-[14px] text-charcoal">{t("inquiry.thanks")}</p>
              </div>
              <button className="w-full bg-primary text-white font-label-md py-2.5 rounded-xl hover:bg-primary-container" onClick={onClose} type="button">
                {t("inquiry.close")}
              </button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={submit}>
              {error && <p className="text-error text-[13px]">{error}</p>}
              <label className="block">
                <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.tour")}</span>
                <input className={`${fieldClass} bg-surface-container-low`} readOnly value={tour?.title || ""} />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.firstName")}</span>
                  <input className={fieldClass} onChange={(e) => patch({ first_name: e.target.value })} placeholder="Jane" required value={form.first_name} />
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.lastName")}</span>
                  <input className={fieldClass} onChange={(e) => patch({ last_name: e.target.value })} placeholder="Okello" required value={form.last_name} />
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.email")}</span>
                  <input className={fieldClass} onChange={(e) => patch({ email: e.target.value })} placeholder="you@email.com" required type="email" value={form.email} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.phone")}</span>
                  <PhoneField onChange={(phone) => patch({ phone })} required value={form.phone} />
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.date")}</span>
                  <input className={fieldClass} min={minDate} onChange={(e) => patch({ preferred_date: e.target.value })} required type="date" value={form.preferred_date} />
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.people")}</span>
                  <input className={fieldClass} min={1} max={20} onChange={(e) => patch({ people: Number(e.target.value) })} required type="number" value={form.people} />
                </label>
              </div>
              <label className="block">
                <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.interest")}</span>
                <select className={fieldClass} onChange={(e) => patch({ interest_level: e.target.value })} required value={form.interest_level}>
                  {INTEREST_LEVELS.map((item) => (
                    <option key={item.value} value={item.value}>{t(item.labelKey)}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[12px] font-medium text-slate-gray mb-1">{t("inquiry.message")}</span>
                <textarea className={`${fieldClass} min-h-[80px] resize-y`} maxLength={500} onChange={(e) => patch({ message: e.target.value })} placeholder={t("inquiry.messagePlaceholder")} rows={3} value={form.message} />
              </label>
              <button className="w-full bg-primary text-white font-label-md text-[15px] py-2.5 rounded-xl hover:bg-primary-container disabled:opacity-60" disabled={busy} type="submit">
                {busy ? t("inquiry.sending") : t("inquiry.send")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
