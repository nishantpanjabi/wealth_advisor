import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Target, TrendingUp, Calendar, DollarSign, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { getGoal } from "../lib/services";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderRadius: "1rem",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default function GoalDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [goal, setGoal] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getGoal(id);
        if (!active) return;
        setGoal(data);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load goal");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [id]);

  const progressData = useMemo(() => {
    const target = Number(goal?.targetAmount || 0);
    const current = Number(goal?.currentAmount || 0);
    return [
      { month: "Start", amount: Math.round(current * 0.5) },
      { month: "Now", amount: Math.round(current) },
      { month: "Target", amount: Math.round(target) },
    ];
  }, [goal]);

  if (loading) return <div className="p-8 text-white/70">Loading goal...</div>;
  if (error) return <div className="p-8 text-rose-300">{error}</div>;
  if (!goal) return <div className="p-8 text-white/70">Goal not found.</div>;

  const progress = Number(goal.progressPercent || 0);
  const remaining = Number(goal.targetAmount || 0) - Number(goal.currentAmount || 0);
  const monthsRemaining = Number(goal.monthsRemaining || 1);

  const stats = [
    { label: "Target", value: money(Number(goal.targetAmount || 0)), icon: Target, color: "#a78bfa", bg: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.25)" },
    { label: "Current", value: money(Number(goal.currentAmount || 0)), sub: `${progress.toFixed(1)}% complete`, icon: DollarSign, color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)" },
    { label: "Remaining", value: money(remaining), icon: TrendingUp, color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" },
    { label: "Timeline", value: `${monthsRemaining} months`, sub: goal.trackingStatus || "Active", icon: Calendar, color: "#22d3ee", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.2)" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <Link to="/goals" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
        <ArrowLeft className="w-4 h-4" />
        Back to Goals
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>{goal.name}</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>{goal.goalType} • {goal.status}</p>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-5 mb-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.07 }} className="p-5 rounded-2xl" style={cardStyle}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</span>
            </div>
            <div className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{stat.value}</div>
            {stat.sub && <div className="text-xs mt-0.5" style={{ color: stat.color }}>{stat.sub}</div>}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="p-6 mb-6" style={cardStyle}>
        <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Progress Over Time</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={progressData}>
            <defs>
              <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#0f1428", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" }} />
            <Area type="monotone" dataKey="amount" stroke="#7c3aed" strokeWidth={2.5} fill="url(#goalGrad)" dot={{ fill: "#7c3aed", r: 4, stroke: "#0f1428", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="p-6" style={cardStyle}>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 floating-glow" style={{ color: "#a78bfa" }} />
          <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Savings Plan</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Required Monthly SIP", value: money(Number(goal.requiredMonthlyInvestment || 0)), sub: `To reach goal in ${monthsRemaining} months`, highlight: true },
            { label: "Expected Annual Return", value: `${Number(goal.expectedAnnualReturn || 0).toFixed(1)}%`, sub: "Configured growth assumption", highlight: false },
            { label: "Inflation Adjusted Target", value: money(Number(goal.inflationAdjustedTarget || 0)), sub: "Future value target", highlight: false },
          ].map((item) => (
            <div key={item.label} className="p-5 rounded-xl" style={{ background: item.highlight ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.04)", border: item.highlight ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: item.highlight ? "#a78bfa" : "#fff" }}>{item.value}</div>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
