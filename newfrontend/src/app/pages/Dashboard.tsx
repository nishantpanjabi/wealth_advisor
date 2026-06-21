import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { TrendingUp, Plus, Target, Briefcase, Sparkles, ArrowUpRight, Brain, Zap, Shield } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { getGoals, getPortfolio, getProfile, getRiskLatest, PROFILE_UPDATED_EVENT } from "../lib/services";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);

  const run = useCallback(async (activeRef?: { current: boolean }) => {
      setLoading(true);
      setError("");
      try {
        const [profileData, goalsData, portfolioData, riskData] = await Promise.all([
          getProfile().catch(() => null),
          getGoals().catch(() => []),
          getPortfolio().catch(() => null),
          getRiskLatest().catch(() => null),
        ]);
        if (activeRef && !activeRef.current) return;
        setProfile(profileData);
        setGoals(goalsData || []);
        setPortfolio(portfolioData);
        setRisk(riskData);
      } catch (err: any) {
        if (activeRef && !activeRef.current) return;
        setError(err?.message || "Failed to load dashboard");
      } finally {
        if (!activeRef || activeRef.current) setLoading(false);
      }
  }, []);

  useEffect(() => {
    const activeRef = { current: true };
    run(activeRef);

    const onProfileUpdated = () => {
      run(activeRef);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);

    return () => {
      activeRef.current = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [run]);

  const stats = useMemo(() => {
    const currentValue = Number(portfolio?.totalCurrentValue || 0);
    const invested = Number(portfolio?.totalInvestedValue || 0);
    const monthlySurplus = Number(profile?.monthlyIncome || 0) - Number(profile?.monthlyExpenses || 0);
    return [
      { label: "Portfolio Value", value: money(currentValue), change: `${portfolio?.holdingsCount || 0} holdings`, icon: TrendingUp, gradient: "from-violet-500 to-purple-600", glow: "rgba(124,58,237,0.3)", positive: true },
      { label: "Total Investment", value: money(invested), change: `Saved monthly ${money(monthlySurplus)}`, icon: Briefcase, gradient: "from-blue-500 to-cyan-600", glow: "rgba(59,130,246,0.3)", positive: null },
      { label: "Total Returns", value: money(Number(portfolio?.totalProfitLoss || 0)), change: `${Number(portfolio?.totalReturnPercent || 0).toFixed(2)}% return`, icon: TrendingUp, gradient: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.3)", positive: Number(portfolio?.totalProfitLoss || 0) >= 0 },
      { label: "Risk Score", value: risk ? `${risk.riskScore}/10` : "N/A", change: risk?.riskCategory || "Not calculated", icon: Shield, gradient: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.3)", positive: null },
    ];
  }, [portfolio, profile, risk]);

  const chartData = useMemo(() => {
    const base = Number(portfolio?.totalCurrentValue || 0);
    if (base <= 0) {
      return [
        { month: "Jan", value: 0 },
        { month: "Feb", value: 0 },
        { month: "Mar", value: 0 },
        { month: "Apr", value: 0 },
        { month: "May", value: 0 },
        { month: "Jun", value: 0 },
      ];
    }

    return [
      { month: "Jan", value: Math.round(base * 0.84) },
      { month: "Feb", value: Math.round(base * 0.88) },
      { month: "Mar", value: Math.round(base * 0.9) },
      { month: "Apr", value: Math.round(base * 0.94) },
      { month: "May", value: Math.round(base * 0.98) },
      { month: "Jun", value: Math.round(base) },
    ];
  }, [portfolio]);

  if (loading) {
    return <div className="p-8 text-white/70">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-rose-300">{error}</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-white" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Dashboard</h1>
          <Sparkles className="w-5 h-5 floating-glow" style={{ color: "#a78bfa" }} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem" }}>
          Welcome back! Here is your live financial overview.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="p-5 rounded-2xl relative overflow-hidden group cursor-default lift-card"
            style={cardStyle}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient}`} style={{ boxShadow: `0 4px 14px ${stat.glow}` }}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-white mb-1" style={{ fontSize: "1.65rem", fontWeight: 700 }}>{stat.value}</div>
            <div className="text-sm" style={{ color: stat.positive === true ? "#34d399" : stat.positive === false ? "#f87171" : "rgba(255,255,255,0.35)" }}>
              {stat.change}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="lg:col-span-2 p-6 rounded-2xl" style={cardStyle}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white mb-0.5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Portfolio Performance</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Estimated trend from current value</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0f1428", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" }} />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2.5} fill="url(#portfolioGrad)" dot={{ fill: "#7c3aed", r: 4, strokeWidth: 2, stroke: "#0f1428" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="p-6 rounded-2xl" style={cardStyle}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Active Goals</h2>
            <Link to="/goals/create" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.4)" }}>
              <Plus className="w-4 h-4" style={{ color: "#a78bfa" }} />
            </Link>
          </div>
          <div className="space-y-5">
            {goals.slice(0, 3).map((goal: any, index) => {
              const progress = Number(goal.progressPercent || 0);
              return (
                <div key={goal.id || index}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{goal.name}</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, progress)}%` }} transition={{ duration: 1.1, delay: 0.4 + index * 0.12 }} className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)", boxShadow: "0 0 8px rgba(124,58,237,0.6)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/goals" className="block mt-6 text-center py-2 text-sm rounded-xl transition-all" style={{ color: "#a78bfa", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
            View All Goals
          </Link>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }} className="p-6 rounded-2xl" style={cardStyle}>
          <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Quick Actions</h2>
          <div className="space-y-3">
            {[
              { to: "/portfolio/add", icon: Plus, label: "Add Investment", gradient: "from-violet-500 to-purple-600", glow: "rgba(124,58,237,0.35)" },
              { to: "/goals/create", icon: Target, label: "Create Goal", gradient: "from-blue-500 to-cyan-600", glow: "rgba(59,130,246,0.35)" },
              { to: "/risk-analysis", icon: Brain, label: "Analyze Risk", gradient: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.35)" },
              { to: "/predictions", icon: Zap, label: "AI Predictions", gradient: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.35)" },
            ].map((action) => (
              <motion.div key={action.to} whileHover={{ scale: 1.02, x: 3 }} whileTap={{ scale: 0.98 }}>
                <Link to={action.to} className={`flex items-center gap-3 p-3.5 rounded-xl text-white transition-all bg-gradient-to-r ${action.gradient}`} style={{ boxShadow: `0 4px 14px ${action.glow}` }}>
                  <action.icon className="w-4 h-4" />
                  <span className="text-sm" style={{ fontWeight: 600 }}>{action.label}</span>
                  <ArrowUpRight className="w-4 h-4 ml-auto opacity-60" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
