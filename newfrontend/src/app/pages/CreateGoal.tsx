import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Target, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { createGoal } from "../lib/services";

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

const focusStyle = { border: "1px solid rgba(124,58,237,0.6)", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" };
const blurStyle = { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" };

export default function CreateGoal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ goalName: "", targetAmount: "", currentAmount: "", deadline: "", goalType: "OTHER", priority: "5" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const now = new Date();
      const deadline = new Date(formData.deadline);
      const years = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365)));
      await createGoal({
        name: formData.goalName,
        goalType: formData.goalType,
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount),
        targetYears: years,
        priority: Number(formData.priority),
        expectedAnnualReturn: 10,
        expectedInflationRate: 5,
        status: "PLANNED",
      });
      navigate("/goals");
    } catch (err: any) {
      setError(err?.message || "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateMonthlySavings = () => {
    if (formData.targetAmount && formData.currentAmount && formData.deadline) {
      const remaining = parseFloat(formData.targetAmount) - parseFloat(formData.currentAmount);
      const today = new Date();
      const deadlineDate = new Date(formData.deadline);
      const monthsRemaining = Math.max(1, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      return (remaining / monthsRemaining).toFixed(2);
    }
    return "0.00";
  };

  const showSuggestion = formData.targetAmount && formData.currentAmount && formData.deadline;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to="/goals" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
        <ArrowLeft className="w-4 h-4" />
        Back to Goals
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Create New Goal</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Set a financial target and track your progress</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="p-7" style={cardStyle}>
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <Target className="w-5 h-5" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Goal Details</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Define your financial objective</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Goal Name</label>
            <input id="goalName" name="goalName" type="text" required value={formData.goalName}
              onChange={handleChange} style={inputStyle} placeholder="e.g., Emergency Fund, Dream Vacation"
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)} />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Goal Type</label>
              <select id="goalType" name="goalType" value={formData.goalType}
                onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer", appearance: "none" as const }}>
                {[
                  "RETIREMENT",
                  "EDUCATION",
                  "HOME_PURCHASE",
                  "EMERGENCY_FUND",
                  "VACATION",
                  "VEHICLE",
                  "OTHER",
                ].map((t) => (
                  <option key={t} value={t} style={{ background: "#0f1428" }}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Target Amount ($)</label>
              <input id="targetAmount" name="targetAmount" type="number" step="0.01" required
                value={formData.targetAmount} onChange={handleChange} style={inputStyle} placeholder="25000"
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Current Amount ($)</label>
              <input id="currentAmount" name="currentAmount" type="number" step="0.01" required
                value={formData.currentAmount} onChange={handleChange} style={inputStyle} placeholder="5000"
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Priority (1-10)</label>
              <input id="priority" name="priority" type="number" min="1" max="10" required
                value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)} />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Deadline</label>
            <input id="deadline" name="deadline" type="date" required value={formData.deadline}
              onChange={handleChange} style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)} />
          </div>

          {showSuggestion && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
              className="p-5 rounded-xl"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Suggested Monthly Savings</span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a78bfa" }}>${calculateMonthlySavings()}</div>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                To reach your goal by {new Date(formData.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </motion.div>
          )}

          <div className="flex items-center gap-4 pt-3">
            <motion.button type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(124,58,237,0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600 }}>
              {loading ? "Creating..." : "Create Goal"}
            </motion.button>
            <Link to="/goals" className="px-6 py-3 rounded-xl text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Cancel
            </Link>
          </div>
          {error && <p className="text-sm" style={{ color: "#fda4af" }}>{error}</p>}
        </form>
      </motion.div>
    </div>
  );
}
