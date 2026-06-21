import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Target, Calendar, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { getGoals } from "../lib/services";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
};

const goalColors = [
  { main: "#7c3aed", glow: "rgba(124,58,237,0.25)" },
  { main: "#3b82f6", glow: "rgba(59,130,246,0.25)" },
  { main: "#10b981", glow: "rgba(16,185,129,0.25)" },
  { main: "#f59e0b", glow: "rgba(245,158,11,0.25)" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default function GoalsList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getGoals();
        if (!active) return;
        setGoals(data || []);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load goals");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0);
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0);
    return { totalTarget, totalSaved };
  }, [goals]);

  if (loading) return <div className="p-8 text-white/70">Loading goals...</div>;
  if (error) return <div className="p-8 text-rose-300">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Financial Goals</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Track your progress toward your financial aspirations</p>
        </div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link to="/goals/create" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.35)", fontWeight: 600 }}>
            <Plus className="w-4 h-4" />
            Create Goal
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5 mb-7">
        {[
          { label: "Total Target", value: money(totals.totalTarget), sub: `${goals.length} active goals`, color: "#a78bfa" },
          { label: "Total Saved", value: money(totals.totalSaved), sub: `${totals.totalTarget > 0 ? ((totals.totalSaved / totals.totalTarget) * 100).toFixed(1) : "0.0"}% of total target`, color: "#34d399" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08 }} className="p-5 rounded-2xl" style={cardStyle}>
            <div className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{card.label}</div>
            <div className="text-white mb-1" style={{ fontSize: "1.6rem", fontWeight: 700 }}>{card.value}</div>
            <div className="text-sm" style={{ color: card.color }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {goals.map((goal, index) => {
          const progress = Number(goal.progressPercent || 0);
          const daysRemaining = Number(goal.monthsRemaining || 0) * 30;
          const color = goalColors[index % goalColors.length];

          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 + index * 0.08 }} whileHover={{ y: -4, scale: 1.01 }}>
              <Link
                to={`/goals/${goal.id}`}
                className="block p-6 rounded-2xl transition-all duration-300 lift-card"
                style={cardStyle}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)", border: `1px solid ${color.main}40` }}>
                      <Target className="w-5 h-5" style={{ color: color.main }} />
                    </div>
                    <div>
                      <h3 className="text-white" style={{ fontSize: "1rem", fontWeight: 700 }}>{goal.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {money(Number(goal.currentAmount || 0))} / {money(Number(goal.targetAmount || 0))}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm px-2.5 py-1 rounded-full" style={{ background: `${color.main}20`, color: color.main, fontWeight: 600 }}>
                    {progress.toFixed(0)}%
                  </div>
                </div>

                <div className="mb-5">
                  <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${color.main}, ${color.main}cc)`, boxShadow: `0 0 8px ${color.glow}` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                    <div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Timeline</div>
                      <div className="text-sm text-white" style={{ fontWeight: 500 }}>{goal.targetYears || 0} years</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                    <div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Monthly SIP</div>
                      <div className="text-sm text-white" style={{ fontWeight: 500 }}>{money(Number(goal.requiredMonthlyInvestment || 0))}</div>
                    </div>
                  </div>
                </div>

                {daysRemaining > 0 && <div className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{daysRemaining} days remaining</div>}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
