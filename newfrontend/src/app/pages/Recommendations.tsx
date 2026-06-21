import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, PauseCircle, RefreshCw, Sparkles, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { getRecommendations, PROFILE_UPDATED_EVENT } from "../lib/services";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderRadius: "1rem",
};

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  borderRadius: "0.75rem",
  padding: "0.8rem 1rem",
  width: "100%",
  outline: "none",
  transition: "all 0.2s",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default function Recommendations() {
  const [form, setForm] = useState({
    investmentAmount: "10000",
    years: "10",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [recommendation, setRecommendation] = useState<any>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await getRecommendations(Number(form.investmentAmount), Number(form.years));
      setRecommendation(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();

    const onProfileUpdated = () => {
      setRefreshing(true);
      load(true);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshing(true);
    await load(true);
  };

  if (loading) return <div className="p-8 text-white/70">Loading recommendations...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>AI Recommendations</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Ranked funds, SIP allocation, and rebalance actions from the recommendation engine</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setRefreshing(true); load(true); }} disabled={refreshing} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 12px rgba(124,58,237,0.3)" }}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing" : "Refresh"}
        </motion.button>
      </motion.div>

      {error && <p className="text-sm mb-4" style={{ color: "#fda4af" }}>{error}</p>}

      <div className="grid xl:grid-cols-[340px_1fr] gap-6">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="p-6" style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5" style={{ color: "#a78bfa" }} />
              <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Scenario</h2>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Monthly SIP Budget</label>
                <input type="number" min="1" value={form.investmentAmount} onChange={(e) => setForm((prev) => ({ ...prev, investmentAmount: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Years To Invest</label>
                <input type="number" min="1" max="30" value={form.years} onChange={(e) => setForm((prev) => ({ ...prev, years: e.target.value }))} style={inputStyle} />
              </div>
              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600 }}>
                Generate
              </motion.button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.05 }} className="p-6" style={cardStyle}>
            <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Recommendation Summary</div>
            <div className="space-y-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              <div>Risk matched: {recommendation?.riskMatchedTo || "Unknown"}</div>
              <div>Monthly SIP: {money(Number(recommendation?.totalSipPerMonth || 0))}</div>
              <div>Projected maturity value: {money(Number(recommendation?.projectedValueAtMaturity || 0))}</div>
              <div>Model source: {recommendation?.modelSource || "n/a"}</div>
              <div style={{ color: recommendation?.fallbackUsed ? "#fbbf24" : "#34d399" }}>
                {recommendation?.fallbackUsed ? "Fallback heuristic active" : "Python ML service active"}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }} className="p-6" style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 floating-glow" style={{ color: "#a78bfa" }} />
              <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Funds To Buy</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {(recommendation?.fundsToBuy || []).map((fund: any, index: number) => (
                <motion.div key={`${fund.fundName}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.05 }} className="p-4 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.16)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white" style={{ fontWeight: 700 }}>{fund.fundName}</div>
                      <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{fund.assetClass}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm" style={{ color: "#c4b5fd", fontWeight: 700 }}>{Number(fund.allocationPercent || 0).toFixed(0)}%</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Score {Number(fund.score || 0).toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.82)" }}>SIP: {money(Number(fund.monthlySipAmount || 0))}</div>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>{fund.rationale}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="grid lg:grid-cols-2 gap-6">
            <div className="p-6" style={cardStyle}>
              <h2 className="text-white mb-4" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Rebalance Actions</h2>
              <div className="space-y-3">
                {(recommendation?.rebalanceActions || []).map((action: any, idx: number) => {
                  const icon = action.action === "BUY"
                    ? <ArrowUpRight className="w-4 h-4" style={{ color: "#34d399" }} />
                    : action.action === "SELL"
                      ? <ArrowDownRight className="w-4 h-4" style={{ color: "#f87171" }} />
                      : <PauseCircle className="w-4 h-4" style={{ color: "#fbbf24" }} />;
                  return (
                    <div key={`${action.assetClass}-${idx}`} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className="text-white" style={{ fontWeight: 700 }}>{action.assetClass}</span>
                        </div>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{action.action}</span>
                      </div>
                      <div className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                        Current {Number(action.currentAllocationPct || 0).toFixed(1)}% {"->"} Target {Number(action.targetAllocationPct || 0).toFixed(1)}%
                      </div>
                      <div className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{action.rationale}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6" style={cardStyle}>
              <h2 className="text-white mb-4" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Sell Signals</h2>
              <div className="space-y-3">
                {(recommendation?.fundsToSell || []).length ? (
                  recommendation.fundsToSell.map((line: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl text-sm" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.16)", color: "rgba(255,255,255,0.75)" }}>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.16)", color: "rgba(255,255,255,0.75)" }}>
                    No immediate sell signal detected for the current allocation model.
                  </div>
                )}
              </div>

              <h3 className="text-white mt-6 mb-3" style={{ fontSize: "1rem", fontWeight: 700 }}>Why This Was Chosen</h3>
              <div className="space-y-2">
                {(recommendation?.keyReasons || []).map((reason: string, idx: number) => (
                  <div key={idx} className="text-sm" style={{ color: "rgba(255,255,255,0.58)" }}>{reason}</div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
