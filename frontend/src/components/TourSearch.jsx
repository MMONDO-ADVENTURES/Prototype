import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { formatMoney, Icon, titleCase, tourTypes } from "../utils";

const DEFAULT_FEATURES = [
  "Safari",
  "Gorilla Tracking",
  "Chimpanzee Tracking",
  "Rhino Tracking",
  "Game Drive",
  "Boat Safari",
  "White-water Rafting",
  "Hiking",
  "Birding",
  "Cultural Tour",
  "Luxury",
  "Adventure",
  "Free Cancellation",
  "Live Tour Guide",
];

export const BUDGET_OPTIONS = [
  { key: "any", label: "Any budget", min: 0, max: "" },
  { key: "under-1000", label: "Under $1,000", min: 0, max: 1000 },
  { key: "1000-2500", label: "$1,000-$2,500", min: 1000, max: 2500 },
  { key: "2500-5000", label: "$2,500-$5,000", min: 2500, max: 5000 },
  { key: "5000-plus", label: "$5,000+", min: 5000, max: "" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatStartDate(value) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayISO() {
  return toISODate(new Date());
}

function addFeature(list, seen, label) {
  const name = titleCase(label);
  if (!name) return;
  const key = name.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(name);
}

function monthGrid(viewDate) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const days = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  }
  return cells;
}

function budgetFromValues(min, max) {
  const minValue = Number(min) || 0;
  const maxValue = max === "" || max == null ? "" : Number(max);
  return (
    BUDGET_OPTIONS.find((option) => option.min === minValue && String(option.max) === String(maxValue)) || null
  );
}

function SearchPopover({ open, anchorRef, panelRef, width = 320, className = "", children }) {
  const [style, setStyle] = useState({ top: 0, left: 16, width });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function place() {
      const rect = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const openUp = spaceBelow < 340 && rect.top > spaceBelow;
      const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
      setStyle(
        openUp
          ? { top: "auto", bottom: window.innerHeight - rect.top + 12, left, width }
          : { top: rect.bottom + 12, bottom: "auto", left, width }
      );
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, width]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed z-[80] bg-white rounded-2xl shadow-[0_12px_36px_rgba(30,30,30,0.16)] border border-black/5 ${className}`}
      data-search-popover=""
      ref={panelRef}
      style={style}
    >
      {children}
    </div>,
    document.body
  );
}

export default function TourSearch({
  initialFeatures = [],
  initialDate = "",
  initialMin = 0,
  initialMax = "",
}) {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const popoverRef = useRef(null);
  const featuresRef = useRef(null);
  const dateRef = useRef(null);
  const budgetRef = useRef(null);
  const [features, setFeatures] = useState(initialFeatures);
  const [featureQuery, setFeatureQuery] = useState("");
  const [date, setDate] = useState(initialDate);
  const [minPrice, setMinPrice] = useState(Number(initialMin) || 0);
  const [maxPrice, setMaxPrice] = useState(initialMax === 0 || initialMax ? initialMax : "");
  const [open, setOpen] = useState(null);
  const [featureOptions, setFeatureOptions] = useState(DEFAULT_FEATURES);
  const [viewMonth, setViewMonth] = useState(() => {
    const parsed = initialDate ? new Date(`${initialDate}T00:00:00`) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  useEffect(() => {
    setFeatures(initialFeatures);
    setDate(initialDate);
    setMinPrice(Number(initialMin) || 0);
    setMaxPrice(initialMax === 0 || initialMax ? initialMax : "");
    if (initialDate) {
      const parsed = new Date(`${initialDate}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) setViewMonth(parsed);
    }
  }, [initialFeatures, initialDate, initialMin, initialMax]);

  useEffect(() => {
    api("/tours")
      .then((data) => {
        const next = [];
        const seen = new Set();
        DEFAULT_FEATURES.forEach((item) => addFeature(next, seen, item));
        for (const tour of data.tours || []) {
          tourTypes(tour).forEach((typeName) => addFeature(next, seen, typeName));
          if (tour.free_cancellation) addFeature(next, seen, "Free Cancellation");
          if (tour.live_tour_guide) addFeature(next, seen, "Live Tour Guide");
        }
        setFeatureOptions(next);
      })
      .catch(() => setFeatureOptions(DEFAULT_FEATURES));
  }, []);

  useEffect(() => {
    function onPointerDown(event) {
      if (event.target.closest("[data-search-popover]")) return;
      if (formRef.current?.contains(event.target)) return;
      setOpen(null);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const minDate = todayISO();
  const cells = useMemo(() => monthGrid(viewMonth), [viewMonth]);
  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const visibleFeatures = useMemo(() => {
    const term = featureQuery.trim().toLowerCase();
    if (!term) return featureOptions;
    return featureOptions.filter((item) => item.toLowerCase().includes(term));
  }, [featureOptions, featureQuery]);
  const hasBudget = Number(minPrice) > 0 || (maxPrice !== "" && maxPrice != null);
  const budgetOption = hasBudget ? budgetFromValues(minPrice, maxPrice) : null;
  const featuresLabel = !features.length
    ? "Tour features"
    : features.length === 1
      ? features[0]
      : `${features[0]} +${features.length - 1}`;
  const budgetLabel = !hasBudget
    ? "Budget"
    : budgetOption
      ? budgetOption.label
      : `${minPrice ? `$${formatMoney(minPrice)}` : "$0"}${maxPrice === "" || maxPrice == null ? "+" : ` - $${formatMoney(maxPrice)}`}`;

  function toggle(panel) {
    setOpen((current) => (current === panel ? null : panel));
  }

  function toggleFeature(label) {
    setFeatures((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  }

  function chooseDate(nextDate) {
    if (nextDate < minDate) return;
    setDate(nextDate);
    setOpen(null);
  }

  function chooseBudget(option) {
    setMinPrice(option.min);
    setMaxPrice(option.max);
    setOpen(null);
  }

  function submit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (features.length) params.set("features", features.join(","));
    if (date) params.set("date", date);
    if (Number(minPrice) > 0) params.set("min", String(minPrice));
    if (maxPrice !== "" && maxPrice != null) params.set("max", String(maxPrice));
    navigate(params.toString() ? `/tours?${params}#packages` : "/tours#packages");
    setOpen(null);
  }

  return (
    <form className="relative z-30 w-full max-w-[760px] mx-auto px-2" onSubmit={submit} ref={formRef}>
      <div className="bg-white rounded-[32px] md:rounded-full shadow-[0_10px_32px_rgba(30,30,30,0.12)] border border-black/5 px-3 py-2 md:pl-6 md:pr-2 md:py-1.5 flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
        <div className="relative flex-1 min-w-0" ref={featuresRef}>
          <button
            aria-expanded={open === "features"}
            className="w-full px-3 md:px-2 py-2 md:py-3 flex items-center justify-between text-left"
            onClick={() => toggle("features")}
            type="button"
          >
            <span className={`truncate text-[15px] font-medium ${features.length ? "text-charcoal" : "text-slate-gray"}`}>
              {featuresLabel}
            </span>
            <Icon name="expand_more" className="text-slate-gray text-[20px] shrink-0" />
          </button>
          <SearchPopover anchorRef={featuresRef} className="p-3 text-left" open={open === "features"} panelRef={popoverRef} width={340}>
            <input
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-[14px] text-charcoal placeholder:text-slate-gray focus:border-primary focus:ring-1 focus:ring-primary"
              onChange={(event) => setFeatureQuery(event.target.value)}
              placeholder="Search features"
              type="search"
              value={featureQuery}
            />
            <div className="mt-2 max-h-[240px] overflow-y-auto">
              {visibleFeatures.length ? (
                visibleFeatures.map((item) => {
                  const checked = features.includes(item);
                  return (
                    <label className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-primary/10 cursor-pointer" key={item}>
                      <input
                        checked={checked}
                        className="w-4 h-4 rounded border-outline text-primary accent-primary focus:ring-primary"
                        onChange={() => toggleFeature(item)}
                        type="checkbox"
                      />
                      <span className="text-[14px] font-medium text-charcoal">{item}</span>
                    </label>
                  );
                })
              ) : (
                <p className="px-2 py-3 text-[14px] text-slate-gray">No matching features</p>
              )}
            </div>
            <button
              className="mt-2 w-full rounded-full bg-primary text-white font-label-md py-2.5 hover:bg-primary-container"
              onClick={() => setOpen(null)}
              type="button"
            >
              Done
            </button>
          </SearchPopover>
        </div>

        <div className="hidden md:block w-px h-8 bg-surface-container-high" />

        <div className="relative flex-1 min-w-0" ref={dateRef}>
          <button
            aria-expanded={open === "date"}
            aria-haspopup="dialog"
            className="w-full px-3 md:px-4 py-2 md:py-3 flex items-center justify-between text-left"
            onClick={() => toggle("date")}
            type="button"
          >
            <span className={date ? "text-[15px] font-medium text-charcoal" : "text-[15px] font-medium text-slate-gray"}>
              {date ? formatStartDate(date) : "Travel date"}
            </span>
            <Icon name="expand_more" className="text-slate-gray text-[20px]" />
          </button>
          <SearchPopover anchorRef={dateRef} className="p-4 text-charcoal" open={open === "date"} panelRef={popoverRef}>
            <div className="flex items-center justify-between mb-3">
              <button
                aria-label="Previous month"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary"
                onClick={() => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                type="button"
              >
                <Icon name="chevron_left" className="text-[20px]" />
              </button>
              <p className="text-[15px] font-semibold">{monthLabel}</p>
              <button
                aria-label="Next month"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary"
                onClick={() => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                type="button"
              >
                <Icon name="chevron_right" className="text-[20px]" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((day) => (
                <span className="text-center text-[11px] font-medium text-slate-gray py-1" key={day}>
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                if (!cell) return <span key={`empty-${index}`} />;
                const value = toISODate(cell);
                const disabled = value < minDate;
                const selected = value === date;
                return (
                  <button
                    className={`h-9 rounded-full text-[13px] font-medium ${
                      selected
                        ? "bg-primary text-white"
                        : disabled
                          ? "text-slate-gray/40 cursor-not-allowed"
                          : "text-charcoal hover:bg-primary/10 hover:text-primary"
                    }`}
                    disabled={disabled}
                    key={value}
                    onClick={() => chooseDate(value)}
                    type="button"
                  >
                    {cell.getDate()}
                  </button>
                );
              })}
            </div>
            {date ? (
              <button
                className="mt-3 text-[13px] font-medium text-primary hover:text-brand-secondary"
                onClick={() => setDate("")}
                type="button"
              >
                Clear date
              </button>
            ) : null}
          </SearchPopover>
        </div>

        <div className="hidden md:block w-px h-8 bg-surface-container-high" />

        <div className="relative flex-1 min-w-0" ref={budgetRef}>
          <button
            aria-expanded={open === "budget"}
            className="w-full px-3 md:px-4 py-2 md:py-3 flex items-center justify-between text-left"
            onClick={() => toggle("budget")}
            type="button"
          >
            <span className={`truncate text-[15px] font-medium ${hasBudget ? "text-charcoal" : "text-slate-gray"}`}>
              {budgetLabel}
            </span>
            <Icon name="expand_more" className="text-slate-gray text-[20px] shrink-0" />
          </button>
          <SearchPopover anchorRef={budgetRef} className="p-3" open={open === "budget"} panelRef={popoverRef} width={300}>
            <p className="px-1 pb-2 text-[16px] font-semibold text-charcoal">Budget</p>
            <div className="space-y-1">
              {BUDGET_OPTIONS.map((option) => {
                const selected = budgetOption?.key === option.key;
                return (
                  <button
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[14px] font-medium ${
                      selected ? "bg-primary text-white" : "text-charcoal hover:bg-primary/10 hover:text-primary"
                    }`}
                    key={option.key}
                    onClick={() => chooseBudget(option)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </SearchPopover>
        </div>

        <button
          aria-label="Search tours"
          className="w-full md:w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-container shrink-0 transition-colors"
          type="submit"
        >
          <Icon name="search" />
        </button>
      </div>
    </form>
  );
}
