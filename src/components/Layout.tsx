import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import ConfirmDialog from "./ConfirmDialog";
import {
  BoxIcon,
  CartIcon,
  CategoryIcon,
  DashboardIcon,
  HeartIcon,
  InvoiceIcon,
  LogoutIcon,
  StoreIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "../icons";
import { logout } from "../store/authSlice";
import { resetCart } from "../store/cartSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const NAV = [
  { to: "/", label: "Dashboard", Icon: DashboardIcon, end: true },
  { to: "/billing", label: "Billing", Icon: CartIcon },
  { to: "/invoices", label: "Invoices", Icon: InvoiceIcon },
  { to: "/customers", label: "Customers", Icon: UsersIcon },
  { to: "/categories", label: "Categories", Icon: CategoryIcon },
  { to: "/products", label: "Products", Icon: BoxIcon },
  { to: "/variants", label: "Variants", Icon: TagIcon },
];

export default function Layout() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    setConfirmLogout(false);
    dispatch(logout());
    dispatch(resetCart());
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? "bg-primary text-white"
        : "text-slate-600 hover:bg-primary-tint hover:text-primary-dark"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <StoreIcon />
            </span>
            <span className="text-lg font-semibold">Billing &amp; Inventory</span>
          </div>

          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
          >
            <LogoutIcon className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-60 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-3 md:flex">
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary p-3 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <UserIcon />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-white/80">{user?.role}</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-3">
            <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              Designed with
              <HeartIcon className="h-3.5 w-3.5 text-red-500" />
              by
            </p>
            <p className="mt-0.5 text-center text-xs font-medium text-slate-600">
              Joydeep Setua
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <nav className="mb-4 flex gap-1 overflow-x-auto pb-1 md:hidden">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${linkClass({ isActive })} shrink-0 whitespace-nowrap ${
                    isActive ? "" : "bg-white"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You will need to sign in again to continue billing."
        confirmLabel="Log out"
        tone="danger"
        icon={LogoutIcon}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
