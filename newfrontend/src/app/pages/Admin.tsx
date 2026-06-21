import { useEffect, useMemo, useState } from "react";
import { Users, Activity, TrendingUp, DollarSign, Shield, AlertTriangle, Database, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { getAdminDashboard, getMarketDataSummary, refreshMarketData } from "../lib/services";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderRadius: "1rem",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [refreshingMarket, setRefreshingMarket] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [data, marketSummary] = await Promise.all([
          getAdminDashboard(),
          getMarketDataSummary().catch(() => null),
        ]);
        if (!active) return;
        setDashboard(data);
        setMarketData(marketSummary);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load admin dashboard");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: "Total Users", value: String(Number(dashboard?.totalUsers || 0)), icon: Users, color: "#a78bfa", bg: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.25)" },
      { label: "Portfolios", value: String(Number(dashboard?.totalPortfolios || 0)), icon: Activity, color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)" },
      { label: "Total AUM", value: money(Number(dashboard?.totalPortfolioValue || 0)), icon: DollarSign, color: "#22d3ee", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.2)" },
      { label: "Active Alerts", value: String(Number(dashboard?.activeAlerts || 0)), icon: AlertTriangle, color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" },
      { label: "Market Snapshots", value: String(Number(dashboard?.marketSnapshotCount || 0)), icon: Database, color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.2)" },
    ],
    [dashboard],
  );

  const distribution = dashboard?.riskDistribution || {};
  const totalProfiles = Object.values(distribution).reduce((sum: number, v: any) => sum + Number(v || 0), 0);

  if (loading) return <div className="p-8 text-white/70">Loading admin dashboard...</div>;
  if (error) return <div className="p-8 text-rose-300">{error}</div>;

  const handleRefreshMarket = async () => {
    setRefreshingMarket(true);
    try {
      const [dashboardData, marketSummary] = await Promise.all([
        getAdminDashboard(),
        refreshMarketData(),
      ]);
      setDashboard(dashboardData);
      setMarketData(marketSummary);
    } catch (err: any) {
      setError(err?.message || "Failed to refresh market data");
    } finally {
      setRefreshingMarket(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-white" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Admin Panel</h1>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            <Shield className="w-3 h-3" />
            Admin Only
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Live platform-level health and portfolio metrics</p>
      </motion.div>

      <div className="flex justify-end mb-4">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleRefreshMarket} disabled={refreshingMarket} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 12px rgba(124,58,237,0.3)" }}>
          <RefreshCw className={`w-4 h-4 ${refreshingMarket ? "animate-spin" : ""}`} />
          {refreshingMarket ? "Refreshing Market Data" : "Refresh Market Data"}
        </motion.button>
      </div>

      <div className="grid md:grid-cols-5 gap-5 mb-7">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.07 }} whileHover={{ y: -4 }} className="p-5 rounded-2xl lift-card" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-white" style={{ fontSize: "1.45rem", fontWeight: 800 }}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} className="p-6" style={cardStyle}>
          <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Risk Distribution</h2>
          <div className="space-y-4">
            {Object.entries(distribution).map(([label, count]) => {
              const value = Number(count || 0);
              const pct = totalProfiles > 0 ? (value / totalProfiles) * 100 : 0;
              const color = label === "AGGRESSIVE" ? "#f59e0b" : label === "MODERATE" ? "#22d3ee" : "#34d399";
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>{label}</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{value} users ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9 }} className="h-full rounded-full" style={{ background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.28 }} className="p-6" style={cardStyle}>
          <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Platform Snapshot</h2>
          <div className="space-y-3">
            {[
              ["Goals Tracked", Number(dashboard?.totalGoals || 0)],
              ["Users", Number(dashboard?.totalUsers || 0)],
              ["Portfolios", Number(dashboard?.totalPortfolios || 0)],
              ["Total Managed Value", money(Number(dashboard?.totalPortfolioValue || 0))],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{String(label)}</span>
                <span className="text-sm text-white" style={{ fontWeight: 700 }}>{String(val)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            This panel is now fully backed by /admin/dashboard API.
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.34 }} className="p-6 mt-6" style={cardStyle}>
        <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Persisted Market Data</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Latest Asset Snapshots</div>
            <div className="space-y-3">
              {(marketData?.latestMarketSnapshots || []).map((item: any, idx: number) => (
                <div key={`${item.assetClass}-${idx}`} className="p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white" style={{ fontWeight: 700 }}>{item.assetClass}</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item.asOfDate}</span>
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Return adj {Number(item.returnAdjustment || 0).toFixed(2)} | Vol adj {Number(item.volatilityAdjustment || 0).toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "#a78bfa" }}>{item.marketRegime}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Latest Fund NAV Samples</div>
            <div className="space-y-3">
              {(marketData?.latestFundNavs || []).slice(0, 8).map((item: any, idx: number) => (
                <div key={`${item.fundName}-${idx}`} className="p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-white" style={{ fontWeight: 700 }}>{item.fundName}</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item.navDate}</span>
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{item.assetClass}</div>
                  <div className="mt-1 text-xs" style={{ color: "#34d399" }}>NAV {item.navValue}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
