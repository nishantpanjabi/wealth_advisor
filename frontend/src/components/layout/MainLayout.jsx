import { Link, NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/profile", label: "Profile" },
  { to: "/app/goals", label: "Goals" },
  { to: "/app/portfolio", label: "Portfolio" },
  { to: "/app/risk", label: "Risk" },
  { to: "/app/predictions", label: "Predictions" },
  { to: "/app/insights", label: "Insights" },
  { to: "/app/simulation", label: "Simulation" },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-4 sm:px-8 sm:py-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[250px_1fr]">
        <aside className="glass rounded-3xl border border-white/70 p-4 shadow-soft lg:h-[calc(100vh-3rem)] lg:sticky lg:top-6">
          <Link to="/" className="block border-b border-black/10 pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rust">Wealth Advisor</p>
            <h1 className="font-display text-2xl text-ink">Private Wealth OS</h1>
          </Link>

          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-ink text-white"
                      : "bg-mist/70 text-ink hover:bg-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 rounded-2xl bg-sea p-3 text-mist">
            <p className="text-xs uppercase tracking-wide text-mist/70">Signed in as</p>
            <p className="truncate text-sm font-bold">{user?.fullName || user?.email}</p>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-2 w-full rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25 disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        <div className="space-y-4">
          <header className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/70 px-4 py-3 shadow-soft">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/60">Advisor Workspace</p>
              <p className="font-display text-xl text-ink">Build wealth with structure, not noise</p>
            </div>
            <Link
              to="/app/goals"
              className="rounded-xl bg-rust px-4 py-2 text-sm font-bold text-white transition hover:bg-ink"
            >
              Update Goals
            </Link>
          </header>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
