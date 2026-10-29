import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import NewsletterSignup from "../components/NewsletterSignup";
import TourCard from "../components/TourCard";
import {
  activitiesOf,
  durationDays,
  formatMoney,
  Icon,
  matchesSearchTerm,
  placesOf,
  priceUnit,
  splitCsv,
  titleCase,
  tourTypes,
} from "../utils";

const PAGE_SIZE = 12;
const DURATION_OPTIONS = [
  { min: 1, max: 3, label: "1-3 days" },
  { min: 4, max: 7, label: "4-7 days" },
  { min: 8, max: 14, label: "8-14 days" },
  { min: 15, max: 999, label: "15+ days" },
];
const GROUP_OPTIONS = [
  { min: 1, max: 4, label: "1-4 guests" },
  { min: 5, max: 8, label: "5-8 guests" },
  { min: 9, max: 999, label: "9+ guests" },
];
const RATING_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 3, label: "3.0+" },
  { value: 4, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
];
const PRICE_UNIT_OPTIONS = [
  { value: "person", label: "Per person" },
  { value: "group", label: "Per group" },
  { value: "tour", label: "Per tour" },
];
const AMENITIES = [
  { key: "free_cancellation", label: "Free cancellation" },
  { key: "live_tour_guide", label: "Live tour guide" },
  { key: "reserve_now_pay_later", label: "Reserve now, pay later" },
];

function languagesOf(tour) {
  return splitCsv(tour?.languages).map(titleCase).filter(Boolean);
}

function operatorOf(tour) {
  return titleCase(tour?.creator?.company_name || tour?.creator?.full_name || "");
}

function matchesQuery(tour, term) {
  if (!term) return true;
  const haystack = [
    tour.title,
    tour.description,
    tour.destinations,
    tour.locations,
    tour.accommodations,
    tour.included,
    tour.country,
    operatorOf(tour),
    tour.free_cancellation ? "free cancellation" : "",
    tour.live_tour_guide ? "live tour guide" : "",
    tour.reserve_now_pay_later ? "reserve now pay later" : "",
    tourTypes(tour).join(" "),
    placesOf(tour).join(" "),
    activitiesOf(tour).join(" "),
    languagesOf(tour).join(" "),
    "uganda",
  ]
    .filter(Boolean)
    .join(" ");
  return matchesSearchTerm(haystack, term);
}

function FilterCheck({ checked, label, onChange }) {
  return (
    <label className="flex items-center group cursor-pointer">
      <input
        checked={checked}
        className="w-4 h-4 rounded border-outline text-primary accent-primary focus:ring-primary"
        onChange={onChange}
        type="checkbox"
      />
      <span className="ml-2.5 font-body-md text-[13px] text-secondary group-hover:text-ink capitalize">{label}</span>
    </label>
  );
}

function Chip({ label, onClear }) {
  return (
    <button
      className="inline-flex items-center gap-1 bg-primary/10 text-charcoal rounded-full pl-3 pr-1.5 py-1 text-[12px] font-medium hover:bg-primary/20"
      onClick={onClear}
      type="button"
    >
      {label}
      <Icon name="close" className="text-[14px] text-slate-gray" />
    </button>
  );
}

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [priceCap, setPriceCap] = useState(5000);
  const [durations, setDurations] = useState([]);
  const [types, setTypes] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [activities, setActivities] = useState([]);
  const [groupSizes, setGroupSizes] = useState([]);
  const [priceUnits, setPriceUnits] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [operators, setOperators] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("recommended");
  const [page, setPage] = useState(1);

  const query = params.get("q") || params.get("destination") || "";
  const features = splitCsv(params.get("features") || params.get("feature"));
  const startDate = params.get("date") || "";
  const adults = Math.max(1, Number(params.get("adults")) || 1);
  const children = Math.max(0, Number(params.get("children")) || 0);
  const hasParty = params.has("adults") || params.has("children");
  const partySize = hasParty ? adults + children : 0;
  const urlMin = Math.max(0, Number(params.get("min")) || 0);
  const urlMax = params.get("max");

  useEffect(() => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set("date", startDate);
    api(queryParams.toString() ? `/tours?${queryParams}` : "/tours")
      .then((data) => {
        const list = data.tours || [];
        setTours(list);
        const prices = list.map((tour) => Number(tour.price) || 0).filter(Boolean);
        const cap = prices.length ? Math.ceil(Math.max(...prices) / 500) * 500 : 5000;
        setPriceCap(cap);
        setMinPrice(Math.min(urlMin, cap));
        setMaxPrice(urlMax != null && urlMax !== "" ? Math.min(Math.max(Number(urlMax) || cap, 0), cap) : cap);
      })
      .catch(() => setTours([]))
      .finally(() => setLoading(false));
  }, [startDate, urlMin, urlMax]);

  useEffect(() => {
    if (!filterOpen) return undefined;
    function onPointer(event) {
      if (!filterRef.current?.contains(event.target)) setFilterOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  const typeOptions = useMemo(
    () => [...new Set(tours.flatMap((tour) => tourTypes(tour).map((typeName) => typeName.toLowerCase())).filter(Boolean))].sort(),
    [tours]
  );
  const destinationOptions = useMemo(
    () => [...new Set(tours.flatMap(placesOf))].sort((a, b) => a.localeCompare(b)),
    [tours]
  );
  const languageOptions = useMemo(
    () => [...new Set(tours.flatMap(languagesOf))].sort((a, b) => a.localeCompare(b)),
    [tours]
  );
  const operatorOptions = useMemo(
    () => [...new Set(tours.map(operatorOf).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [tours]
  );
  const activityOptions = useMemo(
    () => [...new Set(tours.flatMap(activitiesOf))].sort((a, b) => a.localeCompare(b)),
    [tours]
  );
  const visibleDestinations = useMemo(() => {
    const term = placeQuery.trim().toLowerCase();
    if (!term) return destinationOptions;
    return destinationOptions.filter((place) => place.toLowerCase().includes(term));
  }, [destinationOptions, placeQuery]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = tours.filter((tour) => {
      if (!matchesQuery(tour, term)) return false;
      if (features.length && !features.some((feature) => matchesQuery(tour, feature))) return false;
      if (availableOnly && !tour.is_active) return false;
      if (partySize && Number(tour.max_participants || 5) < partySize) return false;
      const price = Number(tour.price || 0);
      if (minPrice > 0 && price < minPrice) return false;
      if (maxPrice < priceCap && price > maxPrice) return false;
      if (durations.length) {
        const days = durationDays(tour.duration);
        if (!durations.some(([min, max]) => days >= min && days <= max)) return false;
      }
      if (types.length && !tourTypes(tour).some((typeName) => types.includes(typeName.toLowerCase()))) return false;
      if (destinations.length) {
        const places = placesOf(tour).map((place) => place.toLowerCase());
        if (!destinations.some((place) => places.some((item) => matchesSearchTerm(item, place)))) return false;
      }
      if (activities.length) {
        const offered = activitiesOf(tour).map((item) => item.toLowerCase());
        if (!activities.some((item) => offered.includes(item.toLowerCase()))) return false;
      }
      if (groupSizes.length) {
        const capacity = Number(tour.max_participants || 5);
        if (!groupSizes.some(([min, max]) => capacity >= min && capacity <= max)) return false;
      }
      if (priceUnits.length && !priceUnits.includes(priceUnit(tour))) return false;
      if (amenities.includes("free_cancellation") && !tour.free_cancellation) return false;
      if (amenities.includes("live_tour_guide") && !tour.live_tour_guide) return false;
      if (amenities.includes("reserve_now_pay_later") && !tour.reserve_now_pay_later) return false;
      if (languages.length) {
        const spoken = languagesOf(tour).map((item) => item.toLowerCase());
        if (!languages.some((item) => spoken.includes(item.toLowerCase()))) return false;
      }
      if (operators.length && !operators.includes(operatorOf(tour))) return false;
      if (minRating && Number(tour.avg_rating || 0) < minRating) return false;
      return true;
    });
    if (sort === "price-asc") list = list.slice().sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    else if (sort === "price-desc") list = list.slice().sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    else if (sort === "duration-asc") list = list.slice().sort((a, b) => durationDays(a.duration) - durationDays(b.duration));
    else if (sort === "duration-desc") list = list.slice().sort((a, b) => durationDays(b.duration) - durationDays(a.duration));
    else if (sort === "rating-desc") list = list.slice().sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0));
    return list;
  }, [
    tours,
    query,
    features,
    availableOnly,
    partySize,
    minPrice,
    maxPrice,
    priceCap,
    durations,
    types,
    destinations,
    activities,
    groupSizes,
    priceUnits,
    amenities,
    languages,
    operators,
    minRating,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filterCount =
    destinations.length +
    durations.length +
    types.length +
    activities.length +
    groupSizes.length +
    priceUnits.length +
    amenities.length +
    languages.length +
    operators.length +
    (availableOnly ? 1 : 0) +
    (minPrice > 0 ? 1 : 0) +
    (maxPrice < priceCap ? 1 : 0) +
    (minRating ? 1 : 0);

  const chips = [
    query && { key: "q", label: query, clear: () => patchSearch({ q: "" }) },
    ...features.map((feature) => ({
      key: `feature-${feature}`,
      label: titleCase(feature),
      clear: () => patchSearch({ features: features.filter((item) => item !== feature).join(",") }),
    })),
    startDate && { key: "date", label: startDate, clear: () => patchSearch({ date: "" }) },
    partySize > 1 && {
      key: "party",
      label: `${partySize} travellers`,
      clear: () => patchSearch({ adults: "", children: "" }),
    },
    ...destinations.map((place) => ({
      key: `dest-${place}`,
      label: place,
      clear: () => toggleValue(destinations, setDestinations, place),
    })),
    ...durations.map(([min, max]) => ({
      key: `dur-${min}-${max}`,
      label: DURATION_OPTIONS.find((option) => option.min === min && option.max === max)?.label || `${min}–${max} days`,
      clear: () => setDurations((current) => current.filter(([a, b]) => !(a === min && b === max))),
    })),
    ...groupSizes.map(([min, max]) => ({
      key: `group-${min}-${max}`,
      label: GROUP_OPTIONS.find((option) => option.min === min && option.max === max)?.label || `${min}–${max} guests`,
      clear: () => setGroupSizes((current) => current.filter(([a, b]) => !(a === min && b === max))),
    })),
    ...types.map((typeName) => ({
      key: `type-${typeName}`,
      label: titleCase(typeName),
      clear: () => toggleValue(types, setTypes, typeName),
    })),
    ...activities.map((item) => ({
      key: `act-${item}`,
      label: item,
      clear: () => toggleValue(activities, setActivities, item),
    })),
    ...priceUnits.map((unit) => ({
      key: `unit-${unit}`,
      label: PRICE_UNIT_OPTIONS.find((option) => option.value === unit)?.label || unit,
      clear: () => toggleValue(priceUnits, setPriceUnits, unit),
    })),
    ...amenities.map((key) => ({
      key: `amenity-${key}`,
      label: AMENITIES.find((item) => item.key === key)?.label || key,
      clear: () => toggleValue(amenities, setAmenities, key),
    })),
    ...languages.map((item) => ({
      key: `lang-${item}`,
      label: item,
      clear: () => toggleValue(languages, setLanguages, item),
    })),
    ...operators.map((item) => ({
      key: `op-${item}`,
      label: item,
      clear: () => toggleValue(operators, setOperators, item),
    })),
    minRating ? { key: "rating", label: `${minRating}+ rating`, clear: () => setMinRating(0) } : null,
    minPrice > 0 ? {
      key: "min",
      label: `From $${formatMoney(minPrice)}`,
      clear: () => {
        setMinPrice(0);
        if (params.has("min")) patchSearch({ min: "" });
      },
    } : null,
    maxPrice < priceCap || params.has("max") ? {
      key: "max",
      label: `Up to $${formatMoney(maxPrice)}`,
      clear: () => {
        setMaxPrice(priceCap);
        if (params.has("max")) patchSearch({ max: "" });
      },
    } : null,
    availableOnly ? { key: "avail", label: "Available only", clear: () => setAvailableOnly(false) } : null,
  ].filter(Boolean);

  function resetPage() {
    setPage(1);
  }

  function patchSearch(patch) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === "" || value == null) next.delete(key);
      else next.set(key, String(value));
    });
    const queryString = next.toString();
    navigate(queryString ? `/tours?${queryString}#packages` : "/tours#packages");
    resetPage();
  }

  function clearFilters() {
    setAvailableOnly(false);
    setMinPrice(0);
    setMaxPrice(priceCap);
    setDurations([]);
    setTypes([]);
    setDestinations([]);
    setPlaceQuery("");
    setActivities([]);
    setGroupSizes([]);
    setPriceUnits([]);
    setAmenities([]);
    setLanguages([]);
    setOperators([]);
    setMinRating(0);
    setSort("recommended");
    setPage(1);
    navigate("/tours#packages");
  }

  function toggleRange(setter, option) {
    const key = `${option.min}-${option.max}`;
    setter((current) => {
      const exists = current.some(([min, max]) => `${min}-${max}` === key);
      return exists ? current.filter(([min, max]) => `${min}-${max}` !== key) : [...current, [option.min, option.max]];
    });
    resetPage();
  }

  function toggleDuration(option) {
    toggleRange(setDurations, option);
  }

  function toggleValue(list, setter, value) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    resetPage();
  }

  return (
    <div className="bg-background text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      <main className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-8 scroll-mt-16" id="packages">
        {params.get("just_logged_in") && (
          <div className="mb-6 flex items-start gap-3 bg-tertiary-container/15 border border-tertiary/30 rounded-xl p-4">
            <Icon fill name="check_circle" className="text-tertiary" />
            <p className="font-label-md text-label-md text-ink">Welcome back! You have successfully logged in.</p>
          </div>
        )}
        <div className="mb-6">
          <h1 className="font-bold text-[28px] md:text-[36px] mb-1">Explore Ugandan Adventures</h1>
          <p className="font-body-md text-body-md text-secondary">Discover authentic safaris, cultural journeys, and hidden gems.</p>
        </div>

        <div className="sticky top-16 z-[45] -mx-margin-mobile md:-mx-margin-desktop px-margin-mobile md:px-margin-desktop py-3 mb-4 bg-background/95 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-h-[2rem]">
            <p className="font-label-md text-label-md text-secondary mb-0">
              Showing {filtered.length} tour{filtered.length === 1 ? "" : "s"}
              {filtered.length !== tours.length ? ` of ${tours.length}` : ""}
              {query ? ` for “${query}”` : ""}
              {features.length ? ` · ${features.join(", ")}` : ""}
              {startDate ? ` on ${startDate}` : ""}
              {urlMin ? ` from $${formatMoney(urlMin)}` : ""}
              {urlMax ? ` up to $${formatMoney(urlMax)}` : ""}
              {partySize > 1 ? ` · ${partySize} travellers` : ""}
            </p>
            {chips.map((chip) => (
              <Chip key={chip.key} label={chip.label} onClear={() => { chip.clear(); resetPage(); }} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative" ref={filterRef}>
              <button
                aria-expanded={filterOpen}
                className="inline-flex items-center gap-2 bg-white border border-outline-variant rounded-lg font-label-md text-label-md py-2 px-4 text-ink hover:border-primary hover:text-primary transition-all shadow-sm"
                onClick={() => setFilterOpen((open) => !open)}
                type="button"
              >
                <Icon name="tune" className="text-[20px]" />
                Filters
                {filterCount > 0 && (
                  <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-white text-[11px] items-center justify-center">
                    {filterCount}
                  </span>
                )}
                <Icon name={filterOpen ? "expand_less" : "expand_more"} className="text-[18px] text-slate-gray" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-[min(100vw-2rem,42rem)] bg-white border border-surface-variant rounded-xl shadow-soft z-[70] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-container">
                    <h3 className="font-label-md text-label-md text-ink uppercase tracking-wider">Filters</h3>
                    <button className="text-primary font-label-md text-label-md hover:text-brand-secondary hover:underline" onClick={clearFilters} type="button">
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-[min(70vh,36rem)] overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div className="sm:col-span-2">
                      <h4 className="font-label-md text-label-md text-ink mb-3">Price (USD)</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <label className="text-[12px] text-slate-gray">
                          Min
                          <input
                            className="mt-1 w-full rounded-lg border border-outline-variant px-3 py-2 text-[14px] text-charcoal focus:border-primary focus:ring-1 focus:ring-primary"
                            max={priceCap}
                            min={0}
                            onChange={(e) => {
                              const next = Math.max(0, Number(e.target.value) || 0);
                              setMinPrice(Math.min(next, maxPrice));
                              resetPage();
                            }}
                            type="number"
                            value={minPrice}
                          />
                        </label>
                        <label className="text-[12px] text-slate-gray">
                          Max
                          <input
                            className="mt-1 w-full rounded-lg border border-outline-variant px-3 py-2 text-[14px] text-charcoal focus:border-primary focus:ring-1 focus:ring-primary"
                            max={priceCap}
                            min={0}
                            onChange={(e) => {
                              const next = Math.min(priceCap, Math.max(0, Number(e.target.value) || 0));
                              setMaxPrice(Math.max(next, minPrice));
                              resetPage();
                            }}
                            type="number"
                            value={maxPrice}
                          />
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 text-[12px] text-slate-gray">
                          Min
                          <input
                            className="mt-1 w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                            max={priceCap}
                            min={0}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setMinPrice(Math.min(next, maxPrice));
                              resetPage();
                            }}
                            step={100}
                            type="range"
                            value={minPrice}
                          />
                        </label>
                        <label className="flex-1 text-[12px] text-slate-gray">
                          Max
                          <input
                            className="mt-1 w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                            max={priceCap}
                            min={0}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setMaxPrice(Math.max(next, minPrice));
                              resetPage();
                            }}
                            step={100}
                            type="range"
                            value={maxPrice}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <h4 className="font-label-md text-label-md text-ink mb-3">Guest rating</h4>
                      <div className="flex flex-wrap gap-2">
                        {RATING_OPTIONS.map((option) => (
                          <button
                            className={`px-3 py-1.5 rounded-full border text-[13px] font-medium ${
                              minRating === option.value
                                ? "bg-primary text-white border-primary"
                                : "border-surface-container-high text-charcoal hover:border-primary"
                            }`}
                            key={option.value}
                            onClick={() => { setMinRating(option.value); resetPage(); }}
                            type="button"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-ink mb-3">Duration</h4>
                      <div className="space-y-2">
                        {DURATION_OPTIONS.map((option) => (
                          <FilterCheck
                            checked={durations.some(([min, max]) => min === option.min && max === option.max)}
                            key={option.label}
                            label={option.label}
                            onChange={() => toggleDuration(option)}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-ink mb-3">Group size</h4>
                      <div className="space-y-2">
                        {GROUP_OPTIONS.map((option) => (
                          <FilterCheck
                            checked={groupSizes.some(([min, max]) => min === option.min && max === option.max)}
                            key={option.label}
                            label={option.label}
                            onChange={() => toggleRange(setGroupSizes, option)}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-ink mb-3">Price type</h4>
                      <div className="space-y-2">
                        {PRICE_UNIT_OPTIONS.map((option) => (
                          <FilterCheck
                            checked={priceUnits.includes(option.value)}
                            key={option.value}
                            label={option.label}
                            onChange={() => toggleValue(priceUnits, setPriceUnits, option.value)}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-container">
                        <span className="font-label-md text-label-md text-on-surface">Available only</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input checked={availableOnly} className="sr-only peer" onChange={(e) => { setAvailableOnly(e.target.checked); resetPage(); }} type="checkbox" />
                          <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                        </label>
                      </div>
                    </div>
                    {typeOptions.length > 0 && (
                      <div>
                        <h4 className="font-label-md text-label-md text-ink mb-3">Tour type</h4>
                        <div className="space-y-2">
                          {typeOptions.map((typeName) => (
                            <FilterCheck
                              checked={types.includes(typeName)}
                              key={typeName}
                              label={typeName}
                              onChange={() => toggleValue(types, setTypes, typeName)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="font-label-md text-label-md text-ink mb-3">Amenities</h4>
                      <div className="space-y-2">
                        {AMENITIES.map((item) => (
                          <FilterCheck
                            checked={amenities.includes(item.key)}
                            key={item.key}
                            label={item.label}
                            onChange={() => toggleValue(amenities, setAmenities, item.key)}
                          />
                        ))}
                      </div>
                    </div>
                    {activityOptions.length > 0 && (
                      <div className="sm:col-span-2">
                        <h4 className="font-label-md text-label-md text-ink mb-3">Activities</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                          {activityOptions.map((item) => (
                            <FilterCheck
                              checked={activities.includes(item)}
                              key={item}
                              label={item}
                              onChange={() => toggleValue(activities, setActivities, item)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {destinationOptions.length > 0 && (
                      <div className="sm:col-span-2">
                        <h4 className="font-label-md text-label-md text-ink mb-3">Destinations</h4>
                        <input
                          className="mb-3 w-full rounded-lg border border-outline-variant px-3 py-2 text-[14px] text-charcoal placeholder:text-slate-gray focus:border-primary focus:ring-1 focus:ring-primary"
                          onChange={(e) => setPlaceQuery(e.target.value)}
                          placeholder="Search destinations"
                          type="search"
                          value={placeQuery}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                          {visibleDestinations.map((place) => (
                            <FilterCheck
                              checked={destinations.includes(place)}
                              key={place}
                              label={place}
                              onChange={() => toggleValue(destinations, setDestinations, place)}
                            />
                          ))}
                          {!visibleDestinations.length && (
                            <p className="text-[13px] text-slate-gray sm:col-span-2">No destinations match that search.</p>
                          )}
                        </div>
                      </div>
                    )}
                    {languageOptions.length > 0 && (
                      <div>
                        <h4 className="font-label-md text-label-md text-ink mb-3">Languages</h4>
                        <div className="space-y-2">
                          {languageOptions.map((item) => (
                            <FilterCheck
                              checked={languages.includes(item)}
                              key={item}
                              label={item}
                              onChange={() => toggleValue(languages, setLanguages, item)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {operatorOptions.length > 0 && (
                      <div>
                        <h4 className="font-label-md text-label-md text-ink mb-3">Tour operator</h4>
                        <div className="space-y-2">
                          {operatorOptions.map((item) => (
                            <FilterCheck
                              checked={operators.includes(item)}
                              key={item}
                              label={item}
                              onChange={() => toggleValue(operators, setOperators, item)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-surface-container p-3">
                    <button
                      className="w-full bg-primary text-white font-label-md text-label-md py-2.5 rounded-lg hover:bg-primary-container transition-all"
                      onClick={() => setFilterOpen(false)}
                      type="button"
                    >
                      Show {filtered.length} result{filtered.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-label-md text-label-md text-secondary">Sort by:</span>
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-outline-variant rounded-lg font-label-md text-label-md py-2 pl-4 pr-10 focus:border-primary focus:ring-0 cursor-pointer shadow-sm"
                  onChange={(e) => { setSort(e.target.value); resetPage(); }}
                  value={sort}
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="duration-asc">Duration: Shortest</option>
                  <option value="duration-desc">Duration: Longest</option>
                  <option value="rating-desc">Rating: Highest</option>
                </select>
                <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-secondary">Loading tours…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
            {!filtered.length && (
              <div className="text-center py-12 bg-white border border-surface-variant rounded-xl shadow-soft mt-4">
                <Icon name="explore" className="text-5xl text-slate-gray mb-3" />
                <h3 className="font-headline-sm text-headline-sm text-ink mb-2">No tours found</h3>
                <p className="font-body-md text-body-md text-secondary mb-5">
                  {tours.length ? "No tours match your filters. Try adjusting your criteria." : "Check back soon for new adventures!"}
                </p>
                {tours.length ? (
                  <button className="bg-primary text-white font-label-md text-label-md px-6 py-2 rounded-lg hover:bg-primary-container transition-all" onClick={clearFilters} type="button">
                    Clear filters
                  </button>
                ) : (
                  <Link className="inline-block bg-primary text-white font-label-md text-label-md px-6 py-2 rounded-lg hover:bg-primary-container transition-all" to="/">
                    Explore homepage
                  </Link>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center gap-2">
                  <button
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border border-surface-variant text-secondary ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:text-primary"}`}
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                    type="button"
                  >
                    <Icon name="chevron_left" />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                    <button
                      className={
                        number === currentPage
                          ? "w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white font-label-md text-label-md"
                          : "w-10 h-10 flex items-center justify-center rounded-lg border border-surface-variant text-secondary hover:border-primary hover:text-primary font-label-md text-label-md"
                      }
                      key={number}
                      onClick={() => setPage(number)}
                      type="button"
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border border-surface-variant text-secondary ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:text-primary"}`}
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                    type="button"
                  >
                    <Icon name="chevron_right" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </main>
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop pb-14">
        <NewsletterSignup />
      </div>
    </div>
  );
}
