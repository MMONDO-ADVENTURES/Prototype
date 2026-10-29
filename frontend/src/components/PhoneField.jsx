import { useEffect, useId, useMemo, useRef, useState } from "react";
import { composePhone, DIAL_CODE_OPTIONS, dialByIso, flagUrl, parsePhone } from "../data/dialCodes";
import { useLocale } from "../LocaleContext";

function Flag({ iso, className = "w-6 h-4" }) {
  return (
    <img
      alt=""
      className={`${className} object-cover rounded-[2px] shadow-[0_0_0_1px_rgba(30,30,30,0.08)]`}
      height={16}
      src={flagUrl(iso, 40)}
      srcSet={`${flagUrl(iso, 80)} 2x`}
      width={24}
    />
  );
}

export default function PhoneField({
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "",
}) {
  const { t } = useLocale();
  const uid = useId();
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const parsed = parsePhone(value);
  const [iso, setIso] = useState(parsed.iso);
  const [local, setLocal] = useState(parsed.local);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const country = dialByIso(iso);

  useEffect(() => {
    const next = parsePhone(value, iso);
    setIso(next.iso);
    setLocal(next.local);
    // Re-parse when the parent value changes; keep the chosen country for shared dial codes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open]);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return DIAL_CODE_OPTIONS;
    return DIAL_CODE_OPTIONS.filter((item) =>
      `${item.name} ${item.iso} ${item.dial}`.toLowerCase().includes(term)
    );
  }, [query]);

  function emit(nextIso, nextLocal) {
    onChange?.(composePhone(dialByIso(nextIso).dial, nextLocal));
  }

  function choose(nextIso) {
    setIso(nextIso);
    setOpen(false);
    setQuery("");
    emit(nextIso, local);
  }

  return (
    <div className={`relative flex items-stretch gap-2 ${disabled ? "opacity-60" : ""}`} ref={rootRef}>
      <div className="relative shrink-0">
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={t("phone.countryCode")}
          className="h-[46px] w-[54px] rounded border border-slate-gray/30 bg-white inline-flex items-center justify-center gap-0.5 hover:border-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <Flag iso={iso} />
          <span className="text-slate-gray text-[10px] leading-none mt-1" aria-hidden>
            ▾
          </span>
        </button>
        {open && (
          <div className="absolute left-0 top-[calc(100%+6px)] z-[80] w-[280px] max-h-[280px] flex flex-col rounded-lg border border-slate-gray/20 bg-white shadow-[0_12px_36px_-12px_rgba(30,30,30,0.28)] overflow-hidden">
            <input
              className="w-full border-0 border-b border-slate-gray/15 px-3 py-2 text-[13px] text-charcoal placeholder:text-slate-gray/70 focus:outline-none focus:ring-0"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country"
              ref={searchRef}
              type="search"
              value={query}
            />
            <ul className="overflow-y-auto max-h-[232px] py-1" role="listbox">
              {matches.map((item) => (
                <li key={`${item.iso}-${item.dial}-${item.name}`}>
                  <button
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] ${
                      item.iso === iso ? "bg-primary/10 text-primary" : "text-charcoal hover:bg-primary/10 hover:text-primary"
                    }`}
                    onClick={() => choose(item.iso)}
                    role="option"
                    type="button"
                  >
                    <Flag iso={item.iso} />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="text-slate-gray shrink-0">{item.dial}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="px-3 py-3 text-[13px] text-slate-gray">No countries match.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <label className="sr-only" htmlFor={`${uid}-number`}>
        {t("phone.number")}
      </label>
      <div className="flex-1 min-w-0 h-[46px] rounded border border-slate-gray/30 bg-white flex items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <span className="pl-3 pr-2 text-[15px] text-charcoal tabular-nums shrink-0">{country.dial}</span>
        <span className="w-px h-5 bg-slate-gray/30 shrink-0" aria-hidden />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-charcoal placeholder:text-slate-gray/70 px-3 py-0 h-full focus:outline-none focus:ring-0"
          disabled={disabled}
          id={`${uid}-number`}
          inputMode="tel"
          onChange={(event) => {
            const nextLocal = event.target.value;
            setLocal(nextLocal);
            emit(iso, nextLocal);
          }}
          placeholder={placeholder}
          required={required}
          type="tel"
          value={local}
        />
      </div>
    </div>
  );
}
