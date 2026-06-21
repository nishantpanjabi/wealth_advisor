import { useCallback, useEffect, useState } from "react";
import { Lightbulb, ShieldAlert, Sparkles, RefreshCw, Wallet, ArrowUpRight, ArrowDownRight, PauseCircle } from "lucide-react";
import { motion } from "motion/react";
import { dismissAlert, generateInsights, getAlerts, getHealthScore, getRecommendations, PROFILE_UPDATED_EVENT, snoozeAlert } from "../lib/services";

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

function scoreTone(score: number) {
  if (score >= 75) return { text: "Strong", color: "#34d399" };
  if (score >= 50) return { text: "Moderate", color: "#fbbf24" };
  return { text: "Needs Attention", color: "#f87171" };
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default function Insights() {
  const [health, setHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [recommendationForm, setRecommendationForm] = useState({
    investmentAmount: "10000",
    years: "10",
  });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [healthData, alertsData, insightsData, recommendationData] = await Promise.all([
        getHealthScore().catch(() => null),
        getAlerts().catch(() => []),
        generateInsights().catch(() => []),
        getRecommendations(Number(recommendationForm.investmentAmount), Number(recommendationForm.years)).catch(() => null),
      ]);
      setHealth(healthData);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      const normalized = Array.isArray(insightsData)
        ? insightsData
        : Array.isArray(insightsData?.insights)
          ? insightsData.insights
          : Array.isArray(insightsData?.alerts)
            ? insightsData.alerts
            : [];
      setInsights(normalized);
      setRecommendation(recommendationData);
    } catch (err: any) {
      setError(err?.message || "Failed to load insights");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [recommendationForm.investmentAmount, recommendationForm.years]);

  useEffect(() => {
    load();

    const onProfileUpdated = () => {
      setRefreshing(true);
      load(true);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
  };

  const handleDismiss = async (alertId: number) => {
    await dismissAlert(alertId);
    await load(true);
  };

  const handleSnooze = async (alertId: number) => {
    await snoozeAlert(alertId, 7);
    await load(true);
  };

  const handleRecommendationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshing(true);
    try {
      const data = await getRecommendations(Number(recommendationForm.investmentAmount), Number(recommendationForm.years));
      setRecommendation(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load recommendations");
    } finally {
      setRefreshing(false);
    }
  };

  const healthScore = Number(health?.healthScore || 0);
  const tone = scoreTone(healthScore);
  const criticalAlerts = alerts.filter((a) => ["CRITICAL", "HIGH"].includes((a?.severity || "").toString().toUpperCase())).length;
  const warningAlerts = alerts.filter((a) => ["WARNING", "MEDIUM"].includes((a?.severity || "").toString().toUpperCase())).length;
  const recommendationCount = Array.isArray(recommendation?.fundsToBuy) ? recommendation.fundsToBuy.length : 0;

  if (loading) return <div className="p-8 text-white/70">Loading insights...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Smart Insights</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Actionable recommendations generated from your portfolio, goals, and risk profile</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onRefresh} disabled={refreshing} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 12px rgba(124,58,237,0.3)" }}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing" : "Refresh Insights"}
        </motion.button>
      </motion.div>

      {error && <p className="text-sm mb-4" style={{ color: "#fda4af" }}>{error}</p>}

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }} className="p-5 lift-card" style={cardStyle}>
          <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Financial Health Score</div>
          <div className="text-white" style={{ fontSize: "2rem", fontWeight: 800 }}>{healthScore}/100</div>
          <div className="text-sm mt-1" style={{ color: tone.color }}>{tone.text}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="p-5 lift-card" style={cardStyle}>
          <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Open Alerts</div>
          <div className="text-white" style={{ fontSize: "2rem", fontWeight: 800 }}>{alerts.length}</div>
          <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Critical: {criticalAlerts} | Warning: {warningAlerts}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }} className="p-5 lift-card" style={cardStyle}>
          <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Funds To Buy</div>
          <div className="text-white" style={{ fontSize: "2rem", fontWeight: 800 }}>{recommendationCount}</div>
          <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Model: {recommendation?.modelSource || "n/a"}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} className="p-5 lift-card" style={cardStyle}>
          <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Projected Maturity Value</div>
          <div className="text-white" style={{ fontSize: "1.6rem", fontWeight: 800 }}>{money(Number(recommendation?.projectedValueAtMaturity || 0))}</div>
          <div className="text-sm mt-1" style={{ color: recommendation?.fallbackUsed ? "#fbbf24" : "#34d399" }}>{recommendation?.fallbackUsed ? "Spring fallback active" : "Python ML service active"}</div>
        </motion.div>
      </div>

      <div className="grid xl:grid-cols-[360px_1fr] gap-6">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="p-6 h-fit" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5" style={{ color: "#a78bfa" }} />
            <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Recommendation Inputs</h2>
          </div>

          <form onSubmit={handleRecommendationSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Monthly Investment Amount</label>
              <input
                type="number"
                min="1"
                value={recommendationForm.investmentAmount}
                onChange={(e) => setRecommendationForm((prev) => ({ ...prev, investmentAmount: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Years</label>
              <input
                type="number"
                min="1"
                max="30"
                value={recommendationForm.years}
                onChange={(e) => setRecommendationForm((prev) => ({ ...prev, years: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600 }}>
              Generate Recommendations
            </motion.button>
          </form>

          <div className="mt-5 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Recommendation Context</div>
            <div className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              <div>Risk matched: {recommendation?.riskMatchedTo || "Unknown"}</div>
              <div>Total SIP / month: {money(Number(recommendation?.totalSipPerMonth || 0))}</div>
              <div>Fallback used: {String(Boolean(recommendation?.fallbackUsed))}</div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }} className="p-6" style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 floating-glow" style={{ color: "#a78bfa" }} />
              <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Recommended Funds To Buy</h2>
            </div>

            {recommendationCount ? (
              <div className="grid md:grid-cols-2 gap-4">
                {recommendation.fundsToBuy.map((fund: any, index: number) => (
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
            ) : (
              <div className="p-6 rounded-xl text-center text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>
                No recommendations yet. Generate one from your current portfolio context.
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="grid lg:grid-cols-2 gap-6">
            <div className="p-6" style={cardStyle}>
              <h2 className="text-white mb-4" style={{ fontSize: "1.1rem", fontWeight: 700 }}>BUY / SELL / HOLD</h2>
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
              <h2 className="text-white mb-4" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Sell Signals And Reasons</h2>
              <div className="space-y-3">
                {(recommendation?.fundsToSell || []).length ? (
                  recommendation.fundsToSell.map((line: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl text-sm" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.16)", color: "rgba(255,255,255,0.75)" }}>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.16)", color: "rgba(255,255,255,0.75)" }}>
                    No immediate sell pressure detected. Current portfolio is reasonably aligned or underallocated versus target.
                  </div>
                )}
              </div>

              <h3 className="text-white mt-6 mb-3" style={{ fontSize: "1rem", fontWeight: 700 }}>Why This Was Chosen</h3>
              <div className="space-y-2">
                {(recommendation?.keyReasons || []).map((reason: string, idx: number) => (
                  <div key={idx} className="text-sm" style={{ color: "rgba(255,255,255,0.58)" }}>
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="p-6" style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 floating-glow" style={{ color: "#a78bfa" }} />
              <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Operational Alerts</h2>
            </div>
            <div className="space-y-3">
              {insights.length ? (
                insights.map((insight, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: idx * 0.04 }} className="p-4 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.16)" }}>
                    <div className="flex items-start gap-3">
                      {String(insight.severity || "").toUpperCase() === "HIGH" ? (
                        <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#f87171" }} />
                      ) : (
                        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
                      )}
                      <div>
                        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>{insight.title || insight.type || "Insight"}</p>
                        <p className="text-sm mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{insight.message || insight.description || "Review this recommendation to improve your portfolio resilience."}</p>
                        {insight.id ? (
                          <div className="mt-3 flex items-center gap-2">
                            <button onClick={() => handleDismiss(Number(insight.id))} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}>
                              Dismiss
                            </button>
                            <button onClick={() => handleSnooze(Number(insight.id))} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" }}>
                              Snooze 7d
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-6 rounded-xl text-center text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>
                  No insights generated yet. Click Refresh Insights to generate the latest recommendations.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
