import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { addInvestment } from "../lib/services";

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

export default function AddInvestment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    assetName: "", assetType: "STOCK", investedAmount: "", currentValue: "", purchaseDate: "", quantity: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addInvestment({
        assetName: formData.assetName,
        assetType: formData.assetType,
        buyPrice: Number(formData.investedAmount),
        quantity: Number(formData.quantity),
        currentValue: Number(formData.currentValue || formData.investedAmount),
        purchaseDate: formData.purchaseDate,
      });
      navigate("/portfolio");
    } catch (err: any) {
      setError(err?.message || "Could not add investment");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
        <ArrowLeft className="w-4 h-4" />
        Back to Portfolio
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-white mb-1" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Add Investment</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Add a new asset to your portfolio</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="p-7" style={cardStyle}>
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <TrendingUp className="w-5 h-5" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Investment Details</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Enter information about your investment</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Asset Name</label>
            <input id="assetName" name="assetName" type="text" required value={formData.assetName}
              onChange={handleChange} style={inputStyle} placeholder="e.g., Apple Inc, Vanguard S&P 500"
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)} />
          </div>

          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Asset Type</label>
            <select id="assetType" name="assetType" value={formData.assetType}
              onChange={handleChange} style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)}>
              {["STOCK", "MUTUAL_FUND", "ETF", "BOND", "GOLD", "CASH", "OTHER"].map(t => (
                <option key={t} value={t} style={{ background: "#0f1428" }}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Invested Amount ($)</label>
              <input id="investedAmount" name="investedAmount" type="number" step="0.01" required
                value={formData.investedAmount} onChange={handleChange} style={inputStyle} placeholder="5000"
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Quantity</label>
              <input id="quantity" name="quantity" type="number" step="0.01" required
                value={formData.quantity} onChange={handleChange} style={inputStyle} placeholder="10"
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Current Value ($)</label>
              <input id="currentValue" name="currentValue" type="number" step="0.01" required
                value={formData.currentValue} onChange={handleChange} style={inputStyle} placeholder="5000"
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)} />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Purchase Date</label>
            <input id="purchaseDate" name="purchaseDate" type="date" required
              value={formData.purchaseDate} onChange={handleChange} style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)} />
          </div>

          <div className="flex items-center gap-4 pt-3">
            <motion.button type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(124,58,237,0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600 }}>
              {loading ? "Adding..." : "Add Investment"}
            </motion.button>
            <Link to="/portfolio" className="px-6 py-3 rounded-xl text-sm transition-all"
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
