import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { logout } from "../store/authSlice";
import { resetCart } from "../store/cartSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/billing", label: "Billing" },
  { to: "/invoices", label: "Invoices" },
  { to: "/customers", label: "Customers" },
  { to: "/categories", label: "Categories" },
  { to: "/products", label: "Products" },
  { to: "/variants", label: "Variants" },
];

export default function Layout() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <span className="font-semibold">Billing &amp; Inventory</span>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              {user?.name} · {user?.role}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded px-3 py-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
