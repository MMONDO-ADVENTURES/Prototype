import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Tours from "./pages/Tours";
import TourDetails from "./pages/TourDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import Blogs from "./pages/Blogs";
import Parks from "./pages/Parks";
import TourOperators from "./pages/TourOperators";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import BookTour from "./pages/BookTour";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import MyBookings from "./pages/MyBookings";
import Wishlist from "./pages/Wishlist";
import WishlistIndex from "./pages/WishlistIndex";
import Newsletter from "./pages/Newsletter";
import AdminDashboard from "./pages/AdminDashboard";
import OperatorHome from "./pages/OperatorHome";
import SuperadminDashboard from "./pages/SuperadminDashboard";
import SuperadminAdmins from "./pages/SuperadminAdmins";
import SuperadminCompanies from "./pages/SuperadminCompanies";
import SuperadminBookings from "./pages/SuperadminBookings";
import SuperadminRevenue from "./pages/SuperadminRevenue";
import SuperadminCreate from "./pages/SuperadminCreate";
import SuperadminList from "./pages/SuperadminList";

function Guard({ children, operator = false, superadmin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="bg-surface min-h-[40vh] py-24 text-center text-secondary">Loading…</div>;
  }
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (superadmin && !user.is_superadmin) {
    return <Navigate to="/" replace />;
  }
  if (operator && !user.is_admin && !user.is_operator && !user.is_superadmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tours" element={<Tours />} />
        <Route path="/parks" element={<Parks />} />
        <Route path="/operators" element={<TourOperators />} />
        <Route path="/tour/:id" element={<TourDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/cultures" element={<Navigate to="/blogs" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/newsletter" element={<Newsletter />} />
        <Route path="/wishlist" element={<WishlistIndex />} />
        <Route path="/wishlist/:id" element={<Wishlist />} />
        <Route path="/operator" element={<OperatorHome />} />
        <Route path="/operator/register" element={<OperatorHome />} />
        <Route path="/admin/register" element={<Navigate to="/operator#register-section" replace />} />
        <Route path="/superadmin/create" element={<SuperadminCreate />} />
        <Route
          path="/profile"
          element={
            <Guard>
              <Profile />
            </Guard>
          }
        />
        <Route
          path="/messages"
          element={
            <Guard>
              <Messages />
            </Guard>
          }
        />
        <Route path="/book/:id" element={<BookTour />} />
        <Route path="/payment" element={<Payment />} />
        <Route
          path="/confirmation"
          element={
            <Guard>
              <Confirmation />
            </Guard>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <Guard>
              <MyBookings />
            </Guard>
          }
        />
        <Route
          path="/operator/dashboard"
          element={
            <Guard operator>
              <AdminDashboard />
            </Guard>
          }
        />
        <Route path="/admin/dashboard" element={<Navigate to="/operator/dashboard" replace />} />
        <Route
          path="/superadmin/dashboard"
          element={
            <Guard superadmin>
              <SuperadminDashboard />
            </Guard>
          }
        />
        <Route
          path="/superadmin/operators"
          element={
            <Guard superadmin>
              <SuperadminAdmins />
            </Guard>
          }
        />
        <Route path="/superadmin/admins" element={<Navigate to="/superadmin/operators" replace />} />
        <Route
          path="/superadmin/companies"
          element={
            <Guard superadmin>
              <SuperadminCompanies />
            </Guard>
          }
        />
        <Route
          path="/superadmin/bookings"
          element={
            <Guard superadmin>
              <SuperadminBookings />
            </Guard>
          }
        />
        <Route
          path="/superadmin/revenue"
          element={
            <Guard superadmin>
              <SuperadminRevenue />
            </Guard>
          }
        />
        <Route
          path="/superadmin/list"
          element={
            <Guard superadmin>
              <SuperadminList />
            </Guard>
          }
        />
        <Route
          path="*"
          element={
            <div className="bg-surface min-h-[60vh] py-24 text-center px-margin-mobile">
              <h1 className="font-headline-sm text-headline-sm mb-2">Page not found</h1>
              <p className="text-secondary mb-6">That route is not part of Mmondo Adventures.</p>
              <Link className="bg-primary text-white px-6 py-3 rounded-lg font-label-md inline-block" to="/">Back home</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
