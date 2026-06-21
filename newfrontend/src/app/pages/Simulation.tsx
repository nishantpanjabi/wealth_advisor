import { useCallback, useEffect, useState } from "react";
import { Play, Wand2, Gauge } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { getSimulationHistory, getSimulationPresets, runCustomSimulation, runPresetSimulation, PROFILE_UPDATED_EVENT } from "../lib/services";

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

export default function Simulation() {
  const [presets, setPresets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const [custom, setCustom] = useState({
    scenarioType: "BASELINE",
    equityShockPct: "-5",
    debtShockPct: "-2",
    goldShockPct: "3",
    liquidShockPct: "0",
    projectionYears: "8",
    iterations: "1500",
  });

  const load = useCallback(async (activeRef?: { current: boolean }, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [presetData, historyData] = await Promise.all([
        getSimulationPresets().catch(() => []),
        getSimulationHistory().catch(() => []),
      ]);
      if (activeRef && !activeRef.current) return;
      setPresets(Array.isArray(presetData) ? presetData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err: any) {
      if (activeRef && !activeRef.current) return;
      setError(err?.message || "Failed to load simulation data");
    } finally {
      if ((!activeRef || activeRef.current) && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeRef = { current: true };
    load(activeRef);

    const onProfileUpdated = () => {
      setResult(null);
      load(activeRef, true);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);

    return () => {
      activeRef.current = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [load]);

  const refreshHistory = async () => {
    const historyData = await getSimulationHistory().catch(() => []);
    setHistory(Array.isArray(historyData) ? historyData : []);
  };

  const runPreset = async (preset: string) => {
    setError("");
    setRunning(true);
    try {
      const res = await runPresetSimulation(preset);
      setResult(res);
      await refreshHistory();
    } catch (err: any) {
      setError(err?.message || "Preset simulation failed");
    } finally {
      setRunning(false);
    }
  };

  const runCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRunning(true);
    try {
      const res = await runCustomSimulation({
        scenarioType: custom.scenarioType,
        equityShockPct: Number(custom.equityShockPct),
        debtShockPct: Number(custom.debtShockPct),
        goldShockPct: Number(custom.goldShockPct),
        liquidShockPct: Number(custom.liquidShockPct),
        projectionYears: Number(custom.projectionYears),
        iterations: Number(custom.iterations),
      });
      setResult(res);
      await refreshHistory();
    } catch (err: any) {
      setError(err?.message || "Custom simulation failed");
    } finally {
      setRunning(false);
    }
  };

  const chartData = result ? [
    { stage: "Before", value: Number(result.portfolioValueBefore || 0) },
    { stage: "After Shock", value: Number(result.portfolioValueAfter || 0) },
    { stage: "Worst", value: Number(result.worstCaseValue || 0) },
    { stage: "Expected", value: Number(result.expectedValue || 0) },
    { stage: "Best", value: Number(result.bestCaseValue || 0) },
  ] : [];

  const focusStyle = { border: "1px solid rgba(124,58,237,0.6)", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" };
  const blurStyle = { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" };

  if (loading) return <div className="p-8 text-white/70">Loading simulations...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Financial Simulation</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Run portfolio stress scenarios and projection ranges from your saved allocation</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="lg:col-span-1 p-6 space-y-6" style={cardStyle}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4" style={{ color: "#a78bfa" }} />
              <h2 className="text-white" style={{ fontWeight: 700 }}>Presets</h2>
            </div>
            <div className="space-y-2">
              {(presets.length ? presets : ["BASELINE", "BULLISH", "BEARISH", "STRESS"]).map((preset) => (
                <motion.button key={preset} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={running} onClick={() => runPreset(String(preset))} className="w-full text-left px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
                  {String(preset)}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4" style={{ color: "#a78bfa" }} />
              <h2 className="text-white" style={{ fontWeight: 700 }}>Custom Run</h2>
            </div>
            <form onSubmit={runCustom} className="space-y-2.5">
              {[
                ["scenarioType", "Scenario Type"],
                ["equityShockPct", "Equity Shock %"],
                ["debtShockPct", "Debt Shock %"],
                ["goldShockPct", "Gold Shock %"],
                ["liquidShockPct", "Liquid Shock %"],
                ["projectionYears", "Projection Years"],
                ["iterations", "Iterations"],
              ].map(([key, label]) => (
                <input
                  key={key}
                  type={key === "scenarioType" ? "text" : "number"}
                  required
                  placeholder={label}
                  value={(custom as any)[key]}
                  onChange={(e) => setCustom((p) => ({ ...p, [key]: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                />
              ))}
              <motion.button type="submit" disabled={running} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600 }}>
                {running ? "Running..." : "Run Custom Simulation"}
              </motion.button>
            </form>
          </div>

          <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Recent Simulations</div>
            <div className="space-y-1.5">
              {history.slice(0, 4).map((h, idx) => (
                <div key={idx} className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {h.scenarioType || "Scenario"}: {money(Number(h.expectedValue || h.portfolioValueAfter || 0))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-2 p-6" style={cardStyle}>
          {error && <p className="text-sm mb-4" style={{ color: "#fda4af" }}>{error}</p>}
          {result ? (
            <>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Portfolio Before</div>
                  <div className="text-white" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{money(Number(result.portfolioValueBefore || 0))}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Portfolio After Shock</div>
                  <div className="text-white" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{money(Number(result.portfolioValueAfter || 0))}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Change</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: Number(result.changePercent || 0) >= 0 ? "#34d399" : "#fda4af" }}>
                    {Number(result.changePercent || 0).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Worst Case</div>
                  <div className="text-white" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{money(Number(result.worstCaseValue || 0))}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Expected Value</div>
                  <div className="text-white" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{money(Number(result.expectedValue || 0))}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Recovery Months</div>
                  <div className="text-white" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                    {result.recoveryMonths === null || result.recoveryMonths === undefined
                      ? "-"
                      : Number(result.recoveryMonths) < 0
                        ? "Not reachable"
                        : result.recoveryMonths}
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="stage" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#0f1428", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" }} />
                  <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Portfolio Value" />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-[420px] flex items-center justify-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <div className="text-center">
                <Play className="w-12 h-12 mx-auto mb-3 floating-glow" style={{ color: "rgba(167,139,250,0.5)" }} />
                Run a preset or custom simulation to view charted projections.
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
