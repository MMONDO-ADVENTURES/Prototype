import { CURRENCIES, LANGUAGES } from "../data/localeOptions";
import { useLocale } from "../LocaleContext";

const darkSelect =
  "w-full bg-charcoal text-white border border-white/20 rounded-lg pl-3 pr-8 py-2 text-[13px] leading-tight appearance-none bg-no-repeat focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer";

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23ff7900' d='M1 1.5 6 6.5 11 1.5'/%3E%3C/svg%3E\")";

export default function LocalePickers({ className = "", compact = false }) {
  const { language, currency, setLanguage, setCurrency, t } = useLocale();

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      <label className={`flex flex-col gap-1 min-w-[140px] ${compact ? "min-w-[120px]" : ""}`}>
        {compact ? null : <span className="text-[11px] uppercase tracking-wider text-white/55">{t("footer.language")}</span>}
        <select
          aria-label={t("footer.language")}
          className={darkSelect}
          onChange={(event) => setLanguage(event.target.value)}
          style={{ backgroundImage: chevron, backgroundPosition: "right 10px center" }}
          value={language}
        >
          {LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.native}
            </option>
          ))}
        </select>
      </label>
      <label className={`flex flex-col gap-1 min-w-[168px] ${compact ? "min-w-[150px]" : ""}`}>
        {compact ? null : <span className="text-[11px] uppercase tracking-wider text-white/55">{t("footer.currency")}</span>}
        <select
          aria-label={t("footer.currency")}
          className={darkSelect}
          onChange={(event) => setCurrency(event.target.value)}
          style={{ backgroundImage: chevron, backgroundPosition: "right 10px center" }}
          value={currency}
        >
          {CURRENCIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code} · {item.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
