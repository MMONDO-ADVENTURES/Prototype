import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { formatMoney, Icon, priceUnitSuffix, tourHighlights } from "../utils";

export default function TourCard({ tour, large = false }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, wishlistIds, toggleWishlist } = useAuth();
  const [saving, setSaving] = useState(false);
  const image = tour.images?.[0]?.image_url || tour.image_url;
  const query = params.toString();
  const href = query ? `/tour/${tour.id}?${query}` : `/tour/${tour.id}`;
  const rating = Number(tour.avg_rating || 0);
  const reviewCount = Number(tour.review_count || 0);
  const highlights = tourHighlights(tour, 3);
  const saved = wishlistIds.includes(Number(tour.id));
  const reviewsLabel = reviewCount
    ? `${rating.toFixed(1)} · ${reviewCount} Review${reviewCount === 1 ? "" : "s"}`
    : rating
      ? `${rating.toFixed(1)} Reviews`
      : "No reviews";

  async function saveTour(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      const next = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?next=${next}`);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await toggleWishlist(tour.id);
    } catch {
      /* keep current saved state */
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="bg-white rounded-[24px] shadow-[0_18px_40px_-20px_rgba(30,30,30,0.28)] p-2.5 flex flex-col h-full w-full">
      <div className="relative">
        <Link className="block" tabIndex={-1} to={href}>
          <div className={`relative ${large ? "h-[196px]" : "h-[176px]"} w-full overflow-hidden rounded-[18px] bg-surface-container-high`}>
            {image ? (
              <img alt={tour.title} className="w-full h-full object-cover" src={image} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-gray">
                <Icon name="image" className="text-4xl" />
              </div>
            )}
            {!tour.is_active && (
              <span className="absolute top-2.5 left-2.5 bg-error text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                Unavailable
              </span>
            )}
          </div>
        </Link>
        <button
          aria-label={saved ? `Remove ${tour.title} from wishlist` : `Save ${tour.title} to wishlist`}
          aria-pressed={saved}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm transition-colors ${
            saved ? "text-primary hover:text-brand-secondary" : "text-slate-gray hover:text-primary"
          }`}
          disabled={saving}
          onClick={saveTour}
          type="button"
        >
          <Icon fill={saved} name="favorite" className="text-[18px]" />
        </button>
      </div>

      <div className="px-2.5 pt-3.5 pb-2 flex flex-col flex-1">
        <Link to={href}>
          <h3 className="font-bold text-[18px] leading-snug text-charcoal line-clamp-1">{tour.title}</h3>
        </Link>

        <div className="mt-2 flex items-center gap-2.5 text-[13px] text-slate-gray">
          <p className="mb-0 flex items-center gap-1.5 min-w-0">
            <Icon name="calendar_month" className="text-[16px] shrink-0" />
            <span className="truncate">{tour.duration || "Flexible"}</span>
          </p>
          <span className="text-outline-variant">|</span>
          <p className="mb-0 flex items-center gap-1.5 min-w-0">
            <Icon fill={rating > 0} name="star" className="text-[16px] shrink-0" />
            <span className="truncate">{reviewsLabel}</span>
          </p>
        </div>

        {highlights.length ? (
          <div className="mt-2.5 flex flex-nowrap items-center gap-1.5 overflow-hidden">
            {highlights.map((item) => (
              <span
                className="inline-flex items-center gap-1 max-w-[38%] rounded-full bg-primary/10 text-charcoal px-2 py-[3px] text-[11px] font-medium leading-none"
                key={item}
                title={item}
              >
                <Icon fill name="check_circle" className="text-primary text-[13px] shrink-0" />
                <span className="truncate">{item}</span>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <p className="mb-0 text-[22px] font-bold text-primary leading-none">
            ${formatMoney(tour.price)}
            <span className="text-[13px] font-semibold text-primary">{priceUnitSuffix(tour)}</span>
          </p>
          <Link
            className="shrink-0 bg-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-lg font-label-md text-[13px] transition-colors"
            to={href}
          >
            Explore Now
          </Link>
        </div>
      </div>
    </article>
  );
}
