import { useEffect, useState } from "react";
import { User, DollarSign, Settings } from "lucide-react";
import { motion } from "motion/react";
import { getProfile, saveProfile } from "../lib/services";

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

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    monthlyIncome: "",
    monthlyExpenses: "",
    assetsValue: "",
    liabilitiesValue: "",
    age: "",
    dependents: "",
    employmentType: "SALARIED",
    investmentExperienceYears: "",
    investmentKnowledge: "INTERMEDIATE",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const profile = await getProfile();
        if (!active || !profile) return;
        setFormData((prev) => ({
          ...prev,
          name: profile.name || "",
          email: profile.email || "",
          monthlyIncome: String(profile.monthlyIncome || ""),
          monthlyExpenses: String(profile.monthlyExpenses || ""),
          assetsValue: String(profile.assetsValue || ""),
          liabilitiesValue: String(profile.liabilitiesValue || ""),
          age: String(profile.age || ""),
          dependents: String(profile.dependents || ""),
          employmentType: profile.employmentType || "SALARIED",
          investmentExperienceYears: String(profile.investmentExperienceYears || ""),
          investmentKnowledge: profile.investmentKnowledge || "INTERMEDIATE",
        }));
      } catch {
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await saveProfile({
        monthlyIncome: Number(formData.monthlyIncome || 0),
        monthlyExpenses: Number(formData.monthlyExpenses || 0),
        assetsValue: Number(formData.assetsValue || 0),
        liabilitiesValue: Number(formData.liabilitiesValue || 0),
        age: Number(formData.age || 0),
        dependents: Number(formData.dependents || 0),
        employmentType: formData.employmentType,
        investmentExperienceYears: Number(formData.investmentExperienceYears || 0),
        investmentKnowledge: formData.investmentKnowledge,
      });
      if (updated) {
        setFormData((prev) => ({
          ...prev,
          name: updated.name || prev.name,
          email: updated.email || prev.email,
          monthlyIncome: String(updated.monthlyIncome ?? prev.monthlyIncome),
          monthlyExpenses: String(updated.monthlyExpenses ?? prev.monthlyExpenses),
          assetsValue: String(updated.assetsValue ?? prev.assetsValue),
          liabilitiesValue: String(updated.liabilitiesValue ?? prev.liabilitiesValue),
          age: String(updated.age ?? prev.age),
          dependents: String(updated.dependents ?? prev.dependents),
          employmentType: updated.employmentType || prev.employmentType,
          investmentExperienceYears: String(updated.investmentExperienceYears ?? prev.investmentExperienceYears),
          investmentKnowledge: updated.investmentKnowledge || prev.investmentKnowledge,
        }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (err: any) {
      setError(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const focusStyle = { border: "1px solid rgba(124,58,237,0.6)", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" };
  const blurStyle = { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" };

  if (loading) {
    return <div className="p-8 text-white/70">Loading profile...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto page-enter">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Profile Settings</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Manage your account and preferences</p>
      </motion.div>

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <User className="w-5 h-5" style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Personal and Financial Information</h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Used for recommendations and projections</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {[
                ["monthlyIncome", "Monthly Income"],
                ["monthlyExpenses", "Monthly Expenses"],
                ["assetsValue", "Assets Value"],
                ["liabilitiesValue", "Liabilities Value"],
                ["age", "Age"],
                ["dependents", "Dependents"],
                ["employmentType", "Employment Type"],
                ["investmentExperienceYears", "Investment Experience (Years)"],
                ["investmentKnowledge", "Investment Knowledge"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</label>
                  <input
                    id={key}
                    name={key}
                    type="text"
                    required
                    value={(formData as any)[key]}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(124,58,237,0.5)" }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600, boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}>
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>
              {saved && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm" style={{ color: "#34d399" }}>Profile updated successfully</motion.span>}
              {error && <span className="text-sm" style={{ color: "#fda4af" }}>{error}</span>}
            </div>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <Settings className="w-5 h-5" style={{ color: "#fbbf24" }} />
            </div>
            <div>
              <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Account Overview</h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Live profile and planning context</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Employment", value: formData.employmentType || "N/A" },
              { label: "Knowledge", value: formData.investmentKnowledge || "N/A" },
              { label: "Experience", value: `${formData.investmentExperienceYears || 0} years` },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
                <div className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
