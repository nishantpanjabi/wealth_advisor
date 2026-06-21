import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowLeft, TrendingUp, Sparkles, Shield, Brain, Target } from "lucide-react";
import { motion } from "motion/react";
import { register } from "../lib/services";

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Registration failed.");
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
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Left Panel - Form */}
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
            <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 800 }}>Create account</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem" }}>Start your wealth management journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
                placeholder="John Doe"
                onFocus={e => { e.target.style.border = "1px solid rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

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
              <label className="block mb-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Password</label>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: "3rem" }}
                  placeholder="••••••••"
                  onFocus={e => { e.target.style.border = "1px solid rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                  onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(124,58,237,0.6)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl text-white mt-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontWeight: 600, boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </motion.button>
            {error && (
              <p className="text-sm mt-2" style={{ color: "#fda4af" }}>{error}</p>
            )}
          </form>

          <p className="mt-7 text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#a78bfa", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Branding */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f0a2a 50%, #1e0a3c 100%)", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full -translate-y-1/3 -translate-x-1/4" style={{ background: "radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full translate-y-1/3 translate-x-1/4" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative z-10 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "1.1rem" }}>WealthWise AI</span>
          </div>

          <h2 className="text-white mb-4" style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.15 }}>
            Welcome to<br />WealthWise
          </h2>
          <p className="mb-12" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            Join thousands of investors who trust us to grow their wealth through intelligent AI analysis.
          </p>

          <div className="space-y-4">
            {[
              { icon: TrendingUp, label: "Advanced portfolio tracking" },
              { icon: Brain, label: "AI-powered predictions" },
              { icon: Sparkles, label: "Personalized insights" },
              { icon: Shield, label: "Bank-level security" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <item.icon className="w-4 h-4" style={{ color: "#a78bfa" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
