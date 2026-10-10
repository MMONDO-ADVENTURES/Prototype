import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

const operatorLinks = [{ to: "/operator/dashboard", label: "Dashboard" }];
const superadminLinks = [
  { to: "/superadmin/dashboard", label: "Overview" },
  { to: "/superadmin/operators", label: "Operators" },
  { to: "/superadmin/companies", label: "Companies" },
  { to: "/superadmin/bookings", label: "Bookings" },
  { to: "/superadmin/revenue", label: "Revenue" },
  { to: "/superadmin/list", label: "Superadmins" },
  { to: "/superadmin/create", label: "Create" },
];

export default function DashboardShell({ title, subtitle, children }) {
  const { user } = useAuth();
  const links = user?.is_superadmin ? superadminLinks : operatorLinks;

  return (
    <div className="bg-surface-container-low min-h-screen">
      <div className="bg-charcoal text-white">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop py-8">
          <p className="font-label-md text-primary-fixed uppercase tracking-wider mb-2">{user?.is_superadmin ? "Superadmin" : "Operator"}</p>
          <h1 className="font-headline-sm text-headline-sm md:text-[32px] mb-2">{title}</h1>
          {subtitle && <p className="font-body-md text-white/75 max-w-2xl">{subtitle}</p>}
        </div>
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop pb-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <NavLink
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-label-md text-label-md ${isActive ? "bg-primary text-white" : "bg-white/10 text-white hover:bg-white/20"}`
              }
              end={link.to.endsWith("dashboard")}
              key={link.to}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
          <Link className="px-4 py-2 rounded-lg font-label-md text-label-md bg-white/10 text-white hover:bg-white/20" to="/tours">View site</Link>
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop py-10">{children}</div>
    </div>
  );
}
