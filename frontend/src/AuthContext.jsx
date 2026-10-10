import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadWishlist(loggedIn) {
    if (!loggedIn) {
      setWishlistIds([]);
      return;
    }
    try {
      const wish = await api("/wishlist");
      setWishlistIds((wish.entries || []).map((entry) => entry.tour_id).filter(Boolean));
    } catch {
      setWishlistIds([]);
    }
  }

  async function refresh() {
    try {
      const data = await api("/auth/me");
      setUser(data.user || null);
      setPreferences(data.preferences || null);
      await loadWishlist(Boolean(data.user));
    } catch {
      setUser(null);
      setPreferences(null);
      setWishlistIds([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleWishlist(tourId) {
    const id = Number(tourId);
    const saved = wishlistIds.includes(id);
    if (saved) {
      await api(`/wishlist/${id}/save`, { method: "DELETE" });
      setWishlistIds((current) => current.filter((value) => value !== id));
      return false;
    }
    await api(`/wishlist/${id}/save`, { method: "POST" });
    setWishlistIds((current) => (current.includes(id) ? current : [...current, id]));
    return true;
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      user,
      preferences,
      setPreferences,
      loading,
      refresh,
      setUser,
      wishlistIds,
      toggleWishlist,
    }),
    [user, preferences, loading, wishlistIds]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
