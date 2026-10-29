import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLocale } from "../LocaleContext";
import { Icon } from "../utils";
import LocalePickers from "./LocalePickers";

const NAV_LINKS = [
  { to: "/", key: "nav.home" },
  { to: "/tours#packages", key: "nav.tours" },
  { to: "/parks", key: "nav.parks" },
  { to: "/operators", key: "nav.operators" },
  { to: "/blogs", key: "nav.blogs" },
  { to: "/about", key: "nav.about" },
];

function FooterLink({ to, children }) {
  return (
    <Link className="text-white/75 text-[14px] leading-6 hover:text-primary transition-colors" to={to}>
      {children}
    </Link>
  );
}

function PayLogo({ label, children }) {
  return (
    <span
      aria-label={label}
      className="inline-flex items-center justify-center h-9 w-9 bg-white rounded-full shadow-sm"
    >
      {children}
    </span>
  );
}

function FooterHeading({ children }) {
  return <h5 className="text-white text-[15px] font-semibold mb-4">{children}</h5>;
}

function initialsFor(user) {
  const source = String(user?.full_name || user?.email || "T").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function ProfileAvatar({ user, className = "w-10 h-10" }) {
  if (user?.picture) {
    return <img alt="" className={`${className} rounded-full object-cover`} src={user.picture} />;
  }
  return (
    <span className={`${className} rounded-full bg-primary text-white inline-flex items-center justify-center font-label-md text-[13px]`}>
      {initialsFor(user)}
    </span>
  );
}

function AccountMenuLink({ to, children }) {
  return (
    <Link className="block px-5 py-[11px] text-[15px] text-charcoal hover:text-primary hover:bg-surface-container-low transition-colors" to={to}>
      {children}
    </Link>
  );
}

function SocialIcon({ label, to, children }) {
  return (
    <Link
      aria-label={label}
      className="text-white hover:text-primary transition-colors"
      to={to}
    >
      {children}
    </Link>
  );
}

export default function Layout() {
  const { user, refresh } = useAuth();
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const authPages = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const isAuthPage = authPages.includes(location.pathname);
  const sitsOnHero =
    ["/", "/about", "/contact", "/blogs", "/careers", "/parks", "/operators", "/operator", "/operator/register"].includes(location.pathname) ||
    location.pathname.startsWith("/tour/");
  const navSolid = !sitsOnHero || scrolled || mobileOpen;

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!id) {
      window.scrollTo({ top: 0, left: 0 });
      return undefined;
    }
    let frame = 0;
    let tries = 0;
    function go() {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (tries < 24) {
        tries += 1;
        frame = requestAnimationFrame(go);
      }
    }
    frame = requestAnimationFrame(go);
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.search]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    await refresh();
    navigate("/");
  }

  return (
    <div className={`flex flex-col bg-surface text-ink font-body-md overflow-x-hidden ${isAuthPage ? "h-[100vh] max-h-[100vh] overflow-hidden" : "min-h-screen"}`}>
      <header
        className={`${isAuthPage ? "relative shrink-0" : "fixed inset-x-0 top-0"} z-50 h-16 border-transparent transition-colors duration-300 ${
          navSolid
            ? "bg-charcoal/95 backdrop-blur-md shadow-[0_8px_24px_-16px_rgba(30,30,30,0.65)]"
            : "bg-gradient-to-b from-charcoal/80 via-charcoal/40 to-transparent"
        }`}
      >
        <nav className="flex justify-between items-center h-full w-full px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
          <Link className={`font-headline-sm font-bold text-white tracking-tight whitespace-nowrap drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] ${isAuthPage ? "text-[20px]" : "text-headline-sm"}`} to="/">
            Mmondo Adventures
          </Link>
          <div className={`hidden md:flex items-center ${isAuthPage ? "gap-4" : "gap-4 lg:gap-5 xl:gap-6"}`}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  isActive
                    ? "text-primary border-b-2 border-primary pb-1 font-label-md text-label-md whitespace-nowrap drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]"
                    : "text-white font-label-md text-label-md whitespace-nowrap hover:text-primary-fixed-dim transition-colors drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]"
                }
              >
                {t(link.key)}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              aria-label={t("nav.search")}
              className="inline-flex items-center justify-center w-9 h-9 text-white hover:text-primary transition-colors"
              onClick={() => {
                if (location.pathname === "/") {
                  document.getElementById("search-place")?.focus();
                  return;
                }
                navigate("/tours#packages");
              }}
              type="button"
            >
              <Icon name="search" className="text-[22px]" />
            </button>
            <Link
              aria-label={t("nav.wishlist")}
              className={`inline-flex items-center justify-center w-9 h-9 transition-colors ${
                location.pathname.startsWith("/wishlist") ? "text-primary" : "text-white hover:text-primary"
              }`}
              to="/wishlist"
            >
              <Icon name="favorite" className="text-[22px]" />
            </Link>
            <div className="relative" ref={menuRef}>
              {user ? (
                <button
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label={t("nav.account")}
                  className={`inline-flex rounded-full overflow-hidden ring-2 transition-all ${
                    menuOpen ? "ring-primary" : "ring-white/80 hover:ring-primary"
                  }`}
                  onClick={() => setMenuOpen((open) => !open)}
                  type="button"
                >
                  <ProfileAvatar user={user} />
                </button>
              ) : (
                <Link
                  aria-label={t("nav.login")}
                  className="inline-flex items-center justify-center w-9 h-9 text-white hover:text-primary transition-colors"
                  to="/login"
                >
                  <Icon name="person" className="text-[22px]" />
                </Link>
              )}
              {user && menuOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-[220px] z-50" role="menu">
                  <span className="absolute -top-1.5 right-3 w-3 h-3 bg-white rotate-45 shadow-sm" aria-hidden />
                  <div className="relative bg-white rounded-2xl shadow-[0_12px_40px_-12px_rgba(30,30,30,0.28)] py-2 overflow-hidden">
                    <AccountMenuLink to="/my-bookings">{t("account.trips")}</AccountMenuLink>
                    <AccountMenuLink to="/wishlist">{t("account.saved")}</AccountMenuLink>
                    <AccountMenuLink to="/profile">{t("account.profile")}</AccountMenuLink>
                    <AccountMenuLink to="/my-bookings">{t("account.bookings")}</AccountMenuLink>
                    <AccountMenuLink to="/messages">{t("account.messages")}</AccountMenuLink>
                    <AccountMenuLink to="/profile?section=security">{t("account.info")}</AccountMenuLink>
                    {(user.is_admin || user.is_operator || user.is_superadmin) && (
                      <AccountMenuLink to={user.is_superadmin ? "/superadmin/dashboard" : "/operator/dashboard"}>
                        {user.is_superadmin ? t("account.superadmin") : t("account.dashboard")}
                      </AccountMenuLink>
                    )}
                    <button
                      className="w-full text-left px-5 py-[11px] text-[15px] text-charcoal hover:text-primary hover:bg-surface-container-low transition-colors"
                      onClick={logout}
                      type="button"
                    >
                      {t("account.signOut")}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button aria-label={t("nav.menu")} className="md:hidden text-white" onClick={() => setMobileOpen((open) => !open)} type="button">
              <Icon name="menu" />
            </button>
          </div>
        </nav>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 px-margin-mobile py-4 flex flex-col gap-4 bg-charcoal/80 backdrop-blur-md">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} className="text-white font-label-md text-label-md" to={link.to}>
                {t(link.key)}
              </Link>
            ))}
            <Link className="text-white font-label-md text-label-md" to="/wishlist">
              {t("nav.wishlist")}
            </Link>
            {!user && (
              <Link className="text-primary font-label-md text-label-md" to="/login">
                {t("nav.login")}
              </Link>
            )}
          </div>
        )}
      </header>
      <main className={`flex-1 min-h-0 ${sitsOnHero || isAuthPage ? "" : "pt-16"} ${isAuthPage ? "flex flex-col overflow-hidden" : ""}`}>
        <Outlet />
      </main>
      {isAuthPage ? (
        <footer className="shrink-0 bg-charcoal text-white">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-white/50 text-[12px]">{t("footer.rights")}</p>
            <LocalePickers compact />
          </div>
        </footer>
      ) : (
        <footer className="mt-auto bg-charcoal text-white">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop pt-12 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-8 gap-y-10">
              <div className="col-span-2 md:col-span-1">
                <Link className="inline-flex items-center gap-1 font-headline-sm font-bold text-white text-[22px] tracking-tight" to="/">
                  Mmondo
                  <span className="w-2 h-2 rounded-full bg-primary mb-3" />
                </Link>
                <p className="text-[11px] tracking-[0.18em] uppercase text-white/50 -mt-1 mb-4">Adventures</p>
                <p className="font-headline-sm italic text-[18px] leading-snug text-white mb-5 max-w-[240px]">
                  {t("footer.motto")}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <SocialIcon label="Facebook" to="/contact">
                    <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.6c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="Instagram" to="/blogs">
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect height="16" rx="4" width="16" x="4" y="4" />
                      <circle cx="12" cy="12" r="3.5" />
                      <circle cx="17.2" cy="6.8" fill="currentColor" r="0.8" stroke="none" />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="X" to="/blogs">
                    <svg aria-hidden="true" className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.7 10.3 22 2h-2.2l-6.1 6.8L8.8 2H2l7.7 10.8L2 22h2.2l6.6-7.4L15.2 22H22l-7.3-11.7zm-2.3 2.6-.8-1.1L5 3.5h2.7l5.1 7.1.8 1.1 6.7 9.3h-2.7l-5.2-7.2z" />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="Pinterest" to="/about">
                    <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.5 2 2 6.5 2 12c0 4.1 2.5 7.6 6.1 9.1-.1-.8-.2-2 0-2.8.2-.8 1.3-5.4 1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.7 2-2.7.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3 0-4.9 2.3-4.9 4.8 0 .9.3 1.8.7 2.4.1.1.1.2.1.3l-.3 1c-.1.3-.2.4-.5.2-1.4-.6-2-2.2-2-4 0-3 2.5-6.6 7.4-6.6 3.9 0 6.5 2.8 6.5 5.9 0 4-2.2 7-5.5 7-1.1 0-2.1-.6-2.5-1.3l-.7 2.6c-.2.9-.9 2-1.4 2.7 1.3.4 2.6.6 4 .6 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="YouTube" to="/contact">
                    <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.5 6.2a3.1 3.1 0 0 0-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5A3.1 3.1 0 0 0 .5 6.2 32.4 32.4 0 0 0 0 12a32.4 32.4 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.2 2.2c1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5a3.1 3.1 0 0 0 2.2-2.2A32.4 32.4 0 0 0 24 12a32.4 32.4 0 0 0-.5-5.8zM9.8 15.6V8.4L15.8 12l-6 3.6z" />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="TikTok" to="/blogs">
                    <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.6 3h2.1c.3 1.9 1.5 3.5 3.3 3.9v2.2c-1.1.1-2.2-.2-3.2-.8v6.7A6.6 6.6 0 1 1 10.2 8.4c.2 0 .4 0 .6.1v2.4a4.1 4.1 0 1 0 2.9 3.9V3z" />
                    </svg>
                  </SocialIcon>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <FooterHeading>{t("footer.quickLinks")}</FooterHeading>
                <FooterLink to="/about#story">{t("footer.about")}</FooterLink>
                <FooterLink to="/tours#packages">{t("footer.packages")}</FooterLink>
                <FooterLink to="/parks#parks">{t("footer.parks")}</FooterLink>
                <FooterLink to="/tours#packages">{t("footer.tours")}</FooterLink>
                <FooterLink to="/operators#operators">{t("footer.operators")}</FooterLink>
                <FooterLink to="/blogs#tips">{t("footer.blogs")}</FooterLink>
                <FooterLink to="/contact#inquiry">{t("footer.contact")}</FooterLink>
                <FooterLink to="/operator#register-section">{t("footer.becomeOperator")}</FooterLink>
                <FooterLink to="/careers#roles">{t("footer.career")}</FooterLink>
              </div>

              <div className="flex flex-col gap-2">
                <FooterHeading>{t("footer.destinations")}</FooterHeading>
                <FooterLink to="/parks#park-bwindi">Bwindi</FooterLink>
                <FooterLink to="/parks#park-queen-elizabeth">Queen Elizabeth</FooterLink>
                <FooterLink to="/parks#park-murchison">Murchison Falls</FooterLink>
                <FooterLink to="/parks#park-kibale">Kibale</FooterLink>
                <FooterLink to="/tours?q=Jinja#packages">Jinja</FooterLink>
              </div>

              <div className="flex flex-col gap-2">
                <FooterHeading>{t("footer.guide")}</FooterHeading>
                <FooterLink to="/blogs#tips">{t("footer.tips")}</FooterLink>
                <FooterLink to="/about#visa">{t("footer.visa")}</FooterLink>
                <FooterLink to="/contact#faq">{t("footer.faqs")}</FooterLink>
                <FooterLink to="/about#cancellation">{t("footer.cancellation")}</FooterLink>
                <FooterLink to="/about#privacy">{t("footer.privacy")}</FooterLink>
              </div>

              <div className="flex flex-col gap-3">
                <FooterHeading>{t("footer.support")}</FooterHeading>
                <a className="inline-flex items-center gap-2 text-white/75 text-[14px] hover:text-primary transition-colors" href="tel:+2568000436640">
                  <Icon name="call" className="text-[16px]" />
                  +256 80004 36640
                </a>
                <a className="inline-flex items-center gap-2 text-white/75 text-[14px] hover:text-primary transition-colors" href="mailto:info@mmondoadventures.ug">
                  <Icon name="mail" className="text-[16px]" />
                  info@mmondoadventures.ug
                </a>
                <Link className="inline-flex items-center gap-2 text-white/75 text-[14px] hover:text-primary transition-colors" to="/contact#inquiry">
                  <Icon name="chat" className="text-[16px]" />
                  {t("footer.chat")}
                </Link>
                <p className="inline-flex items-center gap-2 text-white/75 text-[14px]">
                  <Icon name="schedule" className="text-[16px]" />
                  {t("footer.hours")}
                </p>
              </div>

              <div>
                <FooterHeading>{t("footer.accept")}</FooterHeading>
                <div className="grid grid-cols-3 gap-2 w-[132px]">
                  <PayLogo label="Visa">
                    <svg aria-hidden="true" className="h-3 w-7" viewBox="0 0 48 16">
                      <text fill="#1E1E1E" fontFamily="Arial, sans-serif" fontSize="14" fontStyle="italic" fontWeight="800" x="0" y="14">VISA</text>
                    </svg>
                  </PayLogo>
                  <PayLogo label="Mastercard">
                    <svg aria-hidden="true" className="h-4 w-6" viewBox="0 0 40 24">
                      <circle cx="15" cy="12" fill="#EB001B" r="9" />
                      <circle cx="25" cy="12" fill="#F79E1B" r="9" />
                      <path d="M20 5.4a9 9 0 0 1 0 13.2 9 9 0 0 1 0-13.2z" fill="#FF5F00" />
                    </svg>
                  </PayLogo>
                  <PayLogo label="American Express">
                    <span className="text-[8px] font-extrabold tracking-tight text-charcoal">AMEX</span>
                  </PayLogo>
                  <PayLogo label="PayPal">
                    <span className="text-[8px] font-extrabold text-charcoal">PayPal</span>
                  </PayLogo>
                  <PayLogo label="Apple Pay">
                    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24">
                      <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.8-.4 6.8 1.1 9.1.8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.4-.9-2.4-3.7zM14.6 6.8c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1.1.1 2.1-.6 2.7-1.4z" fill="#1E1E1E" />
                    </svg>
                  </PayLogo>
                  <PayLogo label="Google Pay">
                    <span className="text-[8px] font-extrabold text-charcoal">GPay</span>
                  </PayLogo>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-5 border-t border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <p className="text-white/50 text-[13px]">{t("footer.rights")}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <LocalePickers />
                <div className="flex items-center gap-5">
                  <FooterLink to="/about#terms">{t("footer.terms")}</FooterLink>
                  <FooterLink to="/about#privacy">{t("footer.privacy")}</FooterLink>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
