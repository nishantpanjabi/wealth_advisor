import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, Briefcase, Target, TrendingUp, Brain, Zap, PieChart, User, Shield, LogOut, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { logout } from "../lib/services";

export default function DashboardLayout() {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Portfolio", path: "/portfolio", icon: Briefcase },
    { name: "Goals", path: "/goals", icon: Target },
    { name: "Risk Analysis", path: "/risk-analysis", icon: Shield },
    { name: "Predictions", path: "/predictions", icon: Brain },
    { name: "Recommendations", path: "/recommendations", icon: Sparkles },
    { name: "Simulation", path: "/simulation", icon: Zap },
    { name: "Insights", path: "/insights", icon: PieChart },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080b18" }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col flex-shrink-0 relative"
        style={{
          background: "rgba(255,255,255,0.025)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div className="p-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.5)" }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white" style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>WealthWise</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>AI Advisor</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <Link
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
                  style={{
                    background: active ? "rgba(124,58,237,0.2)" : "transparent",
                    border: active ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                    color: active ? "#c4b5fd" : "rgba(255,255,255,0.45)",
                    boxShadow: active ? "0 0 16px rgba(124,58,237,0.1)" : "none",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; } }}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: "#a78bfa" }} />
                  )}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm" style={{ fontWeight: active ? 600 : 400 }}>{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{
              background: isActive("/profile") ? "rgba(124,58,237,0.2)" : "transparent",
              border: isActive("/profile") ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
              color: isActive("/profile") ? "#c4b5fd" : "rgba(255,255,255,0.45)",
            }}
            onMouseEnter={e => { if (!isActive("/profile")) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; } }}
            onMouseLeave={e => { if (!isActive("/profile")) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; } }}
          >
            <User className="w-4 h-4" />
            <span className="text-sm">Profile</span>
          </Link>
          <button
            onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative" style={{ zIndex: 5 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="min-h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
