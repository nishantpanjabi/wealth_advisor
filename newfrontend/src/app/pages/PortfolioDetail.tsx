import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { getPortfolio } from "../lib/services";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderRadius: "1rem",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default function PortfolioDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [investment, setInvestment] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const portfolio = await getPortfolio();
        const found = (portfolio?.investments || []).find((inv: any) => String(inv.id) === String(id));
        if (!active) return;
        setInvestment(found || null);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load investment");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const performanceData = useMemo(() => {
    if (!investment) return [];
    const base = Number(investment.investedValue || 0);
    const current = Number(investment.currentValue || 0);
    return [
      { date: "Purchase", value: base },
      { date: "Mid", value: Math.round((base + current) / 2) },
      { date: "Current", value: current },
    ];
  }, [investment]);

  if (loading) return <div className="p-8 text-white/70">Loading investment...</div>;
  if (error) return <div className="p-8 text-rose-300">{error}</div>;
  if (!investment) return <div className="p-8 text-white/70">Investment not found.</div>;

  const stats = [
    { label: "Current Value", value: money(Number(investment.currentValue || 0)), icon: DollarSign, color: "#a78bfa", bg: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.25)" },
    { label: "Invested", value: money(Number(investment.investedValue || 0)), icon: TrendingUp, color: "#22d3ee", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.2)" },
    { label: "Gain", value: `${money(Number(investment.profitLoss || 0))} (${Number(investment.returnPercent || 0).toFixed(2)}%)`, icon: TrendingUp, color: Number(investment.profitLoss || 0) >= 0 ? "#34d399" : "#f87171", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)" },
    { label: "Quantity", value: `${Number(investment.quantity || 0).toFixed(2)} units`, icon: Calendar, color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
        <ArrowLeft className="w-4 h-4" />
        Back to Portfolio
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-white" style={{ fontSize: "1.9rem", fontWeight: 800 }}>{investment.assetName}</h1>
          <span className="px-2.5 py-1 rounded-full text-xs" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", fontWeight: 600 }}>{investment.assetType}</span>
        </div>
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
            <div className="text-white" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="p-6 mb-6" style={cardStyle}>
        <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Performance Snapshot</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#0f1428", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" }} />
            <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2.5} fill="url(#perfGrad)" dot={{ fill: "#7c3aed", r: 4, stroke: "#0f1428", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
