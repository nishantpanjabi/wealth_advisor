import { useCallback, useEffect, useState } from "react";
import { Brain, TrendingUp, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { getPredictionSummary, PROFILE_UPDATED_EVENT } from "../lib/services";

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

export default function Predictions() {
  const [years, setYears] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState<any>(null);

  const runPrediction = useCallback(async (silent = false) => {
    setError("");
    if (!silent) setLoading(true);
    try {
      const data = await getPredictionSummary(Number(years));
      setPrediction(data);
    } catch (err: any) {
      setError(err?.message || "Prediction failed");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [years]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runPrediction(false);
  };

  useEffect(() => {
    const onProfileUpdated = () => {
      if (prediction) {
        runPrediction(true);
      }
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [prediction, runPrediction]);

  const chartData = prediction?.portfolioForecast
    ? [
        { year: 0, value: Number(prediction.portfolioForecast.currentPortfolioValue || 0) },
        { year: Number(prediction.portfolioForecast.projectionYears || years), value: Number(prediction.portfolioForecast.projectedPortfolioValue || 0) },
      ]
    : [];

  const focusStyle = { border: "1px solid rgba(124,58,237,0.6)", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" };
  const blurStyle = { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" };

  return (
    <div className="p-8 max-w-6xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>AI Predictions</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Backend-driven forecasts for your investment growth potential</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <Brain className="w-5 h-5" style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Prediction Parameters</h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Use backend prediction models</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Projection Horizon (years)</label>
              <input id="years" name="years" type="number" min="1" max="20" required value={years} onChange={(e) => setYears(e.target.value)} style={inputStyle} onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, blurStyle)} />
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(124,58,237,0.5)" }} whileTap={{ scale: 0.98 }} className="w-full py-3 rounded-xl text-white mt-2" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600, boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}>
              {loading ? "Generating..." : "Generate Prediction"}
            </motion.button>
            {error && <p className="text-sm" style={{ color: "#fda4af" }}>{error}</p>}
          </form>
        </motion.div>

        {prediction ? (
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="p-6" style={cardStyle}>
              <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Future Portfolio Value</h2>
              <div className="text-center mb-6">
                <div style={{ fontSize: "2.8rem", fontWeight: 800, background: "linear-gradient(135deg, #a78bfa, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {money(Number(prediction.portfolioForecast?.projectedPortfolioValue || 0))}
                </div>
                <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Projected value in {prediction.portfolioForecast?.projectionYears || years} years
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Current Value</div>
                  <div className="text-white" style={{ fontSize: "1.3rem", fontWeight: 700 }}>{money(Number(prediction.portfolioForecast?.currentPortfolioValue || 0))}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Projected Gain</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#34d399" }}>{money(Number(prediction.portfolioForecast?.projectedGain || 0))}</div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.08 }} className="p-6" style={cardStyle}>
              <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Growth Chart</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#0f1428", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" }} />
                  <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2.5} fill="url(#predGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {prediction.sipRecommendation && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.16 }} className="p-6" style={cardStyle}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 floating-glow" style={{ color: "#a78bfa" }} />
                  <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>AI Suggestions</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
                    <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Recommended monthly investment: {money(Number(prediction.sipRecommendation.recommendedMonthlyInvestment || 0))}
                    </p>
                  </div>
                  {(prediction.sipRecommendation.notes || []).slice(0, 3).map((note: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{note}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="p-6 flex items-center justify-center" style={{ ...cardStyle, minHeight: "400px" }}>
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <Brain className="w-10 h-10" style={{ color: "rgba(167,139,250,0.5)" }} />
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Run a prediction to view forecast outcomes</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
