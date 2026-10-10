import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import TourCard from "../components/TourCard";
import { Icon } from "../utils";

export default function WishlistIndex() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api("/wishlist")
      .then((data) => setEntries(data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const tours = entries.map((entry) => entry.tour).filter(Boolean);

  return (
    <div className="bg-background min-h-[calc(100dvh-4rem)]">
      <main className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-10">
        <h1 className="font-bold text-[28px] md:text-[36px] mb-2">Wishlist</h1>
        <p className="font-body-md text-secondary mb-8">Tours you have saved or registered interest in.</p>
        {authLoading || loading ? (
          <p className="text-secondary">Loading Wishlist…</p>
        ) : !user ? (
          <div className="text-center py-16 bg-white border border-surface-variant rounded-xl">
            <Icon name="favorite" className="text-5xl text-primary mb-3" />
            <h2 className="font-headline-sm text-headline-sm mb-2">Log In To See Your Wishlist</h2>
            <p className="text-secondary mb-5">Save tours and pick up where you left off.</p>
            <Link className="inline-block bg-primary text-white font-label-md px-6 py-2.5 rounded-lg hover:bg-primary-container" to="/login?next=/wishlist">
              Log In
            </Link>
          </div>
        ) : !tours.length ? (
          <div className="text-center py-16 bg-white border border-surface-variant rounded-xl">
            <Icon name="favorite" className="text-5xl text-slate-gray mb-3" />
            <h2 className="font-headline-sm text-headline-sm mb-2">Your Wishlist Is Empty</h2>
            <p className="text-secondary mb-5">Browse tours and tap save to add them here.</p>
            <Link className="inline-block bg-primary text-white font-label-md px-6 py-2.5 rounded-lg hover:bg-primary-container" to="/tours#packages">
              Browse Tours
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
