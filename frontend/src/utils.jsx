export const CANCELLATION_POLICY = "Free cancellation up to 3 days before the start date.";
export const CANCELLATION_NOTICE_DAYS = 3;

export function splitNotes(value) {
  if (Array.isArray(value)) {
    return value.map((part) => String(part).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/\n|;/)
    .map((part) => part.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

export function splitCsv(value) {
  if (Array.isArray(value)) {
    return value.map((part) => String(part).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function titleCase(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function splitName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") };
}

export function joinName(firstName, lastName) {
  return [firstName, lastName].map((part) => String(part || "").trim()).filter(Boolean).join(" ");
}

export function splitAddress(value) {
  const parts = String(value || "").split(",").map((part) => part.trim());
  return {
    street: parts[0] || "",
    city: parts[1] || "",
    district: parts[2] || "",
    country: parts[3] || "",
  };
}

export function joinAddress(parts) {
  return ["street", "city", "district", "country"]
    .map((key) => String(parts?.[key] || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function parseActivity(activity) {
  if (activity && typeof activity === "object" && !Array.isArray(activity)) {
    return {
      title: String(activity.title || activity.name || activity.text || "").trim(),
      duration: String(activity.duration || "").trim(),
    };
  }
  const text = String(activity || "").replace(/\s+/g, " ").trim();
  const match = text.match(/^(.*?)\s*(?:\(|—|-)\s*([^)]*?\b(?:hours?|hrs?|minutes?|mins?|days?|full day|half day)\b[^)]*)\)?$/i);
  if (match?.[1]) return { title: match[1].trim(), duration: match[2].trim() };
  return { title: text, duration: "" };
}

export function isStayPlace(value) {
  return /\b(hotel|lodge|camp|resort|inn|market|guesthouse|guest house)\b/i.test(String(value || ""));
}

export function tourDestinations(tour) {
  return splitCsv(tour?.destinations || tour?.locations);
}

export function placesOf(tour) {
  const stays = new Set(splitCsv(tour?.accommodations).map((item) => item.toLowerCase()));
  const places = [...tourDestinations(tour)];
  tourItinerary(tour).forEach((day) => {
    if (day.destination) places.push(day.destination);
  });
  return [...new Set(places.map((place) => titleCase(place)).filter(Boolean))].filter((place) => {
    const lower = place.toLowerCase();
    return !stays.has(lower) && !isStayPlace(place);
  });
}

export function activitiesOf(tour) {
  const skip = new Set(["live tour guide", "free cancellation", "reserve now, pay later"]);
  const items = [];
  const seen = new Set();
  function add(value) {
    const text = titleCase(String(value || "").replace(/\s+/g, " ").trim());
    if (!text) return;
    const key = text.toLowerCase();
    if (skip.has(key) || seen.has(key) || text.length > 42) return;
    if (/\b(fee|fees|insurance|meals?|chips|drinks?|water|transport|transfer)\b/i.test(text)) return;
    seen.add(key);
    items.push(text);
  }
  tourItinerary(tour).forEach((day) => {
    (day.activities || []).forEach((activity) => add(parseActivity(activity).title));
  });
  return items;
}

export function matchesSearchTerm(haystack, term) {
  const text = String(haystack || "").toLowerCase();
  const query = String(term || "").trim().toLowerCase();
  if (!query) return true;
  if (text.includes(query)) return true;
  const words = query.replace(/,/g, " ").split(/\s+/).filter((word) => word.length > 1);
  return words.length > 0 && words.every((word) => text.includes(word));
}

export function tourTypes(tour) {
  if (Array.isArray(tour?.tour_types) && tour.tour_types.length) {
    return tour.tour_types.map((type) => String(type).trim()).filter(Boolean);
  }
  return splitCsv(tour?.tour_type);
}

export function tourItinerary(tour) {
  const days = Array.isArray(tour?.itinerary) ? tour.itinerary : [];
  return days.filter((day) => day && (day.title || day.destination || day.duration || (day.activities || []).length));
}

export function parseItineraryDayRange(item, index = 0) {
  const fallback = index + 1;
  const fromRaw = item?.day_from ?? item?.day;
  const toRaw = item?.day_to ?? item?.day_end;
  const rangeMatch = String(fromRaw ?? "").match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    const from = Math.max(1, Number(rangeMatch[1]));
    return { from, to: Math.max(from, Number(rangeMatch[2])) };
  }
  const from = Math.max(1, Number(fromRaw) || fallback);
  const to = Math.max(from, Number(toRaw) || from);
  return { from, to };
}

export function itineraryDayBadge(item, index = 0) {
  const { from, to } = parseItineraryDayRange(item, index);
  return from === to ? `Day ${from}` : `Day ${from}-${to}`;
}

export function tourHighlights(tour, limit = 4) {
  const items = [];
  const seen = new Set();
  function add(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key) || items.length >= limit) return;
    seen.add(key);
    items.push(text);
  }
  if (tour?.live_tour_guide) add("Live tour guide");
  if (tour?.free_cancellation) add("Free cancellation");
  if (tour?.reserve_now_pay_later) add("Reserve now, pay later");
  splitCsv(tour?.included).forEach(add);
  tourItinerary(tour).forEach((day) => {
    (day.activities || []).forEach((activity) => add(parseActivity(activity).title));
  });
  return items;
}

export function formatMoney(value, digits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function priceUnit(tour) {
  const unit = String(tour?.price_unit || "person").toLowerCase();
  return ["person", "group", "tour"].includes(unit) ? unit : "person";
}

export function priceUnitSuffix(tour) {
  return { person: "/person", group: "/group", tour: "/tour" }[priceUnit(tour)];
}

export function priceUnitPhrase(tour) {
  return { person: "per person", group: "per group", tour: "per tour" }[priceUnit(tour)];
}

export function tourBaseTotal(tour, travelers) {
  const price = Number(tour?.price || 0);
  if (priceUnit(tour) === "person") return price * Math.max(Number(travelers) || 1, 1);
  return price;
}

export function durationDays(duration) {
  const text = String(duration || "").toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (text.includes("week")) return Math.round(amount * 7);
  if (text.includes("month")) return Math.round(amount * 30);
  if (text.includes("hour")) return Math.max(1, Math.round(amount / 24));
  return Math.round(amount);
}

export function parseTourDate(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function tourEndDate(start, duration) {
  if (!start) return null;
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const days = Math.max(durationDays(duration), 1);
  end.setDate(end.getDate() + days - 1);
  return end;
}

export function startOfDay(value) {
  const date = value instanceof Date ? value : parseTourDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function lastFreeChangeDate(startValue) {
  const start = startOfDay(startValue);
  if (!start) return null;
  const last = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  last.setDate(last.getDate() - CANCELLATION_NOTICE_DAYS);
  return last;
}

export function canCancelBooking(booking, now = new Date()) {
  const status = (booking?.payment_status || "").toLowerCase();
  if (status === "cancelled" || booking?.cancelled_at) return false;
  if (typeof booking?.can_cancel === "boolean") return booking.can_cancel;
  const last = lastFreeChangeDate(booking?.tour_date);
  const today = startOfDay(now);
  if (!last || !today) return false;
  return today.getTime() <= last.getTime();
}

export function canEditBooking(booking, now = new Date()) {
  const status = (booking?.payment_status || "").toLowerCase();
  if (status === "cancelled" || booking?.cancelled_at) return false;
  if (typeof booking?.can_edit === "boolean") return booking.can_edit;
  const start = startOfDay(booking?.tour_date);
  const today = startOfDay(now);
  if (!start || !today) return false;
  return today.getTime() <= start.getTime();
}

export function Icon({ name, className = "", fill = false }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
      translate="no"
    >
      {name}
    </span>
  );
}

export function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function AppleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M17.05 20.28c-.96.95-2.21 1.72-3.72 1.72-1.48 0-2.31-.83-3.41-.83-1.12 0-2.11.82-3.41.82-1.48 0-2.85-.85-3.92-1.96C.68 18.11 0 15.68 0 13.08c0-2.58 1.05-4.52 2.65-5.69 1.1-.79 2.45-1.24 3.73-1.24 1.34 0 2.22.62 3.23.62s1.7-.62 3.16-.62c1.23 0 2.5.39 3.5 1.04.5.33 1.65 1.32 2.05 2.65-.12.06-2.12 1.23-2.12 3.71 0 2.98 2.5 4.02 2.52 4.03-.02.04-.38 1.33-1.67 2.7zM11.95 5.5c-.02-2.13 1.74-4.22 3.84-4.5.23 2.5-2.07 4.75-3.84 4.5z"
        fill="currentColor"
      />
    </svg>
  );
}
