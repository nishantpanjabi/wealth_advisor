import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  getPortfolio,
  getPortfolioBenchmark,
  getPortfolioOptimization,
  getPortfolioPerformance,
  getPortfolioTransactions,
  getPortfolioXirr,
} from "../lib/services";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderRadius: "1rem",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default function PortfolioList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [portfolio, setPortfolio] = useState<any>(null);
  const [optimization, setOptimization] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [xirr, setXirr] = useState<any>(null);
  const [benchmark, setBenchmark] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [portfolioData, optimizationData, txData, perfData, xirrData, benchmarkData] = await Promise.all([
          getPortfolio().catch(() => null),
          getPortfolioOptimization().catch(() => null),
          getPortfolioTransactions().catch(() => []),
          getPortfolioPerformance().catch(() => []),
          getPortfolioXirr().catch(() => null),
          getPortfolioBenchmark().catch(() => null),
        ]);
        if (!active) return;
        setPortfolio(portfolioData);
        setOptimization(optimizationData);
        setTransactions(Array.isArray(txData) ? txData : []);
        setPerformance(Array.isArray(perfData) ? perfData : []);
        setXirr(xirrData);
        setBenchmark(benchmarkData);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load portfolio");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const investments = portfolio?.investments || [];
  const totalInvested = Number(portfolio?.totalInvestedValue || 0);
  const totalValue = Number(portfolio?.totalCurrentValue || 0);
  const totalReturns = Number(portfolio?.totalProfitLoss || 0);
  const returnsPercentage = Number(portfolio?.totalReturnPercent || 0).toFixed(2);

  const perfData = useMemo(
    () =>
      (performance || []).map((p: any, idx: number) => ({
        name: p.date || p.label || `P${idx + 1}`,
        invested: Number(p.investedValue || 0),
        current: Number(p.currentValue || 0),
      })),
    [performance],
  );

  if (loading) return <div className="p-8 text-white/70">Loading portfolio...</div>;
  if (error) return <div className="p-8 text-rose-300">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Portfolio</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Track investments, optimization, benchmark, and risk-adjusted performance</p>
        </div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link to="/portfolio/add" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.35)", fontWeight: 600 }}>
            <Plus className="w-4 h-4" />
            Add Investment
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-5 mb-7">
        {[
          { label: "Total Invested", value: money(totalInvested), sub: `${investments.length} investments`, color: "#a78bfa" },
          { label: "Current Value", value: money(totalValue), sub: "Portfolio total", color: "#34d399" },
          { label: "Total Returns", value: money(totalReturns), sub: `${totalReturns >= 0 ? "+" : ""}${returnsPercentage}%`, color: totalReturns >= 0 ? "#34d399" : "#f87171" },
          { label: "XIRR", value: `${Number(xirr?.xirrPercent || 0).toFixed(2)}%`, sub: `${Number(xirr?.cashFlowCount || 0)} cash flows`, color: "#22d3ee" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08 }} className="p-5 rounded-2xl lift-card" style={cardStyle}>
            <div className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{card.label}</div>
            <div className="text-white mb-1" style={{ fontSize: "1.4rem", fontWeight: 700 }}>{card.value}</div>
            <div className="text-sm" style={{ color: card.color }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} className="lg:col-span-2 p-6" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" style={{ color: "#a78bfa" }} />
            <h2 className="text-white" style={{ fontWeight: 700 }}>Performance Series</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={perfData}>
              <defs>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0f1428", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" }} />
              <Area type="monotone" dataKey="invested" stroke="#22d3ee" fill="url(#investedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="current" stroke="#7c3aed" fill="url(#currentGrad)" strokeWidth={2.2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.28 }} className="p-6" style={cardStyle}>
          <h2 className="text-white mb-4" style={{ fontWeight: 700 }}>Benchmark vs Portfolio</h2>
          <div className="space-y-3">
            {[
              ["Portfolio Return", `${Number(benchmark?.portfolioReturnPercent || 0).toFixed(2)}%`],
              ["Benchmark Return", `${Number(benchmark?.benchmarkReturnPercent || 0).toFixed(2)}%`],
              ["Benchmark Value", money(Number(benchmark?.benchmarkValue || 0))],
              ["Alpha", money(Number(benchmark?.alphaValue || 0))],
            ].map(([label, value]) => (
              <div key={String(label)} className="p-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{String(label)}</span>
                <span className="text-sm text-white" style={{ fontWeight: 700 }}>{String(value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {optimization?.allocationBuckets?.length ? (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.33 }} className="p-6 mb-6" style={cardStyle}>
          <h2 className="text-white mb-4" style={{ fontWeight: 700 }}>Allocation Drift and Rebalance Suggestions</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {optimization.allocationBuckets.map((b: any) => (
              <div key={b.assetClass} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-white" style={{ fontWeight: 700 }}>{b.assetClass}</span>
                  <span className="text-xs" style={{ color: b.action === "BUY" ? "#34d399" : b.action === "SELL" ? "#f87171" : "rgba(255,255,255,0.45)" }}>{b.action}</span>
                </div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Current {Number(b.currentPct || 0).toFixed(1)}% | Target {Number(b.targetPct || 0).toFixed(1)}%
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Drift {money(Number(b.driftAmount || 0))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 }} className="rounded-2xl overflow-hidden mb-6" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Asset", "Type", "Invested", "Current Value", "Quantity", "Returns"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs ${i >= 2 ? "text-right" : "text-left"}`} style={{ color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.map((inv: any, index: number) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.04 }}
                  className="transition-all cursor-pointer"
                  style={{ borderBottom: index < investments.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                  onClick={() => navigate(`/portfolio/${inv.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="text-white text-sm" style={{ fontWeight: 600 }}>{inv.assetName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs" style={{ fontWeight: 600, background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
                      {inv.assetType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{money(Number(inv.investedValue || 0))}</td>
                  <td className="px-6 py-4 text-right text-sm text-white" style={{ fontWeight: 600 }}>{money(Number(inv.currentValue || 0))}</td>
                  <td className="px-6 py-4 text-right text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{Number(inv.quantity || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {Number(inv.returnPercent || 0) >= 0 ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
                          <span className="text-sm" style={{ color: "#34d399", fontWeight: 600 }}>+{Number(inv.returnPercent || 0).toFixed(2)}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
                          <span className="text-sm" style={{ color: "#f87171", fontWeight: 600 }}>{Number(inv.returnPercent || 0).toFixed(2)}%</span>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.5 }} className="p-6" style={cardStyle}>
        <h2 className="text-white mb-4" style={{ fontWeight: 700 }}>Recent Transactions</h2>
        <div className="space-y-2.5">
          {(transactions || []).slice(0, 6).map((t: any) => (
            <div key={t.transactionId || `${t.assetName}-${t.transactionDate}`} className="p-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <div className="text-sm text-white" style={{ fontWeight: 600 }}>{t.actionType} • {t.assetName}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{t.transactionDate}</div>
              </div>
              <div className="text-sm text-white" style={{ fontWeight: 700 }}>{money(Number(t.amount || 0))}</div>
            </div>
          ))}
          {!transactions.length ? (
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>No transactions yet.</div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
