import { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "motion/react";
import { calculateRisk, getRiskHistory, getRiskLatest, PROFILE_UPDATED_EVENT } from "../lib/services";

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

function mapAllocation(category: string) {
  if (category === "AGGRESSIVE") {
    return [
      { name: "Equity", value: 70, color: "#7c3aed" },
      { name: "Debt", value: 15, color: "#06b6d4" },
      { name: "Gold", value: 10, color: "#10b981" },
      { name: "Liquid", value: 5, color: "#f59e0b" },
    ];
  }
  if (category === "MODERATE") {
    return [
      { name: "Equity", value: 50, color: "#7c3aed" },
      { name: "Debt", value: 30, color: "#06b6d4" },
      { name: "Gold", value: 10, color: "#10b981" },
      { name: "Liquid", value: 10, color: "#f59e0b" },
    ];
  }
  return [
    { name: "Equity", value: 30, color: "#7c3aed" },
    { name: "Debt", value: 45, color: "#06b6d4" },
    { name: "Gold", value: 10, color: "#10b981" },
    { name: "Liquid", value: 15, color: "#f59e0b" },
  ];
}

export default function RiskAnalysis() {
  const [formData, setFormData] = useState({
    investmentHorizonYears: "15",
    lossTolerance: "6",
    incomeStability: "7",
    investmentExperienceYears: "5",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const load = useCallback(async (activeRef?: { current: boolean }) => {
      setLoading(true);
      setError("");
      try {
        const [latestData, historyData] = await Promise.all([
          getRiskLatest().catch(() => null),
          getRiskHistory().catch(() => []),
        ]);
        if (activeRef && !activeRef.current) return;
        setLatest(latestData);
        setHistory(historyData || []);
      } catch (err: any) {
        if (activeRef && !activeRef.current) return;
        setError(err?.message || "Failed to load risk data");
      } finally {
        if (!activeRef || activeRef.current) setLoading(false);
      }
  }, []);

  useEffect(() => {
    const activeRef = { current: true };
    load(activeRef);

    const onProfileUpdated = () => {
      load(activeRef);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);

    return () => {
      activeRef.current = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await calculateRisk({
        investmentHorizonYears: Number(formData.investmentHorizonYears),
        lossTolerance: Number(formData.lossTolerance),
        incomeStability: Number(formData.incomeStability),
        investmentExperienceYears: Number(formData.investmentExperienceYears),
      });
      setLatest(result);
      const freshHistory = await getRiskHistory().catch(() => []);
      setHistory(freshHistory || []);
    } catch (err: any) {
      setError(err?.message || "Risk analysis failed");
    } finally {
      setSubmitting(false);
    }
  };

  const result = latest;
  const allocation = useMemo(() => mapAllocation(result?.riskCategory || "CONSERVATIVE"), [result]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const focusStyle = { border: "1px solid rgba(124,58,237,0.6)", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" };
  const blurStyle = { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" };

  if (loading) return <div className="p-8 text-white/70">Loading risk profile...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Risk Analysis</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Understand your risk profile and get personalized investment recommendations</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <Shield className="w-5 h-5" style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Risk Assessment</h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Use your financial behaviour profile</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              ["investmentHorizonYears", "Investment Horizon (Years)", "15"],
              ["lossTolerance", "Loss Tolerance (1-10)", "6"],
              ["incomeStability", "Income Stability (1-10)", "7"],
              ["investmentExperienceYears", "Investment Experience (Years)", "5"],
            ].map(([id, label, placeholder]) => (
              <div key={id}>
                <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</label>
                <input id={id} name={id} type="number" required value={(formData as any)[id]} onChange={handleChange} style={inputStyle} placeholder={placeholder} onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, blurStyle)} />
              </div>
            ))}

            <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(124,58,237,0.5)" }} whileTap={{ scale: 0.98 }} className="w-full py-3 rounded-xl text-white mt-2" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600, boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}>
              {submitting ? "Analyzing..." : "Analyze Risk Profile"}
            </motion.button>
            {error && <p className="text-sm" style={{ color: "#fda4af" }}>{error}</p>}
          </form>

          <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Recent Calculations</div>
            <div className="space-y-2">
              {history.slice(0, 3).map((h, idx) => (
                <div key={idx} className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Score {h.riskScore}/10 • {h.riskCategory}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {result ? (
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="p-6" style={cardStyle}>
              <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Your Risk Profile</h2>
              <div className="text-center mb-6">
                <div className="text-white mb-2" style={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1 }}>{result.riskScore}</div>
                <div className="mb-1" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#a78bfa" }}>{result.riskCategory}</div>
                <div className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Risk Score</div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Based on your profile, a {result.riskCategory.toLowerCase()} strategy is suggested. Reassess every quarter.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="p-6" style={cardStyle}>
              <h2 className="text-white mb-5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Suggested Allocation</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={allocation} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                    {allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f1428", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="p-6 flex items-center justify-center" style={{ ...cardStyle, minHeight: "400px" }}>
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <Shield className="w-10 h-10" style={{ color: "rgba(167,139,250,0.5)" }} />
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Run analysis to generate your risk profile</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
