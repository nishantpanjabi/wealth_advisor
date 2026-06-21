import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowLeft, TrendingUp, Sparkles, Shield, Brain, Target } from "lucide-react";
import { motion } from "motion/react";
import { login } from "../lib/services";

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "0.75rem",
    padding: "0.85rem 1rem",
    width: "100%",
    outline: "none",
    transition: "all 0.2s",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#080b18" }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Left Panel - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e0a3c 0%, #0f0a2a 50%, #080b18 100%)", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/2 translate-x-1/4" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/3 -translate-x-1/4" style={{ background: "radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative z-10 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "1.1rem" }}>WealthWise AI</span>
          </div>

          <h2 className="text-white mb-4" style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.15 }}>
            Welcome<br />Back
          </h2>
          <p className="mb-12" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            Sign in to access your personalized wealth dashboard and continue growing your investments.
          </p>

          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: "Real-time portfolio tracking" },
              { icon: Brain, text: "AI-powered predictions" },
              { icon: Shield, text: "Advanced risk analysis" },
              { icon: Target, text: "Goal milestone tracking" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <item.icon className="w-4 h-4" style={{ color: "#a78bfa" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm mb-10 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mb-9">
            <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 800 }}>Sign in</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem" }}>Continue to your wealth dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
                placeholder="john@example.com"
                onFocus={e => { e.target.style.border = "1px solid rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Password</label>
                <a href="#" className="text-sm" style={{ color: "#a78bfa" }}>Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: "3rem" }}
                  placeholder="••••••••"
                  onFocus={e => { e.target.style.border = "1px solid rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                  onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(124,58,237,0.6)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600, boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>
            {error && (
              <p className="text-sm mt-2" style={{ color: "#fda4af" }}>{error}</p>
            )}
          </form>

          <p className="mt-7 text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#a78bfa", fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
