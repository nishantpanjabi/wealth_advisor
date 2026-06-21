import { Link } from "react-router";
import { TrendingUp, Shield, Brain, Target, ArrowRight, Play, Star, Zap, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import FloatingParticles from "../components/FloatingParticles";

function DashboardMockup() {
  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.15)",
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <div className="flex-1 mx-3 px-3 py-1 rounded-md text-xs text-white/30" style={{ background: "rgba(255,255,255,0.06)" }}>
          app.wealthwise.ai
        </div>
      </div>
      {/* Dashboard content */}
      <div className="p-5 grid grid-cols-3 gap-4">
        {/* Left - chart area */}
        <div className="col-span-2 space-y-3">
          <div className="text-xs text-white/40">Total Portfolio Value</div>
          <div className="text-2xl text-white" style={{ fontWeight: 700 }}>$1,245,890.00</div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}>
            +14.5%
          </div>
          {/* Mini chart */}
          <div className="h-28 relative mt-2">
            <svg viewBox="0 0 280 80" className="w-full h-full">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,60 C30,55 50,45 80,40 C110,35 130,50 160,35 C190,20 210,25 240,15 C260,10 270,8 280,5" stroke="#7c3aed" strokeWidth="2.5" fill="none" />
              <path d="M0,60 C30,55 50,45 80,40 C110,35 130,50 160,35 C190,20 210,25 240,15 C260,10 270,8 280,5 L280,80 L0,80 Z" fill="url(#chartGrad)" />
              {/* Labels */}
              {["Jan","Feb","Mar","Apr","May","Jun"].map((m, i) => (
                <text key={m} x={i * 50 + 15} y="78" fill="rgba(255,255,255,0.3)" fontSize="9">{m}</text>
              ))}
            </svg>
          </div>
        </div>
        {/* Right - stats */}
        <div className="space-y-3">
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-xs text-white/40 mb-1">AI Risk Score</div>
            <div className="text-xl text-white" style={{ fontWeight: 700 }}>24</div>
            <div className="text-xs" style={{ color: "#10b981" }}>Low (Safe)</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-xs text-white/40 mb-1">Predicted Growth</div>
            <div className="text-xl text-white" style={{ fontWeight: 700 }}>+8.2%</div>
            <div className="text-xs text-white/40">Next 30 days</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-xs text-white/40 mb-1">Top Performer</div>
            <div className="text-sm text-white" style={{ fontWeight: 600 }}>AAPL</div>
            <div className="text-xs" style={{ color: "#10b981" }}>+3.4%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const features = [
    {
      icon: TrendingUp,
      title: "Portfolio Tracking",
      description: "Real-time sync across all your brokerages, wallets, and accounts. See your true net worth in one beautiful dashboard.",
      link: "Explore Tracking",
      color: "from-violet-500 to-purple-600",
      glow: "rgba(124,58,237,0.3)",
    },
    {
      icon: Shield,
      title: "Risk Analysis",
      description: "Advanced machine learning models analyze your exposure and suggest rebalancing strategies to protect your downside.",
      link: "View Risk Models",
      color: "from-blue-500 to-cyan-600",
      glow: "rgba(59,130,246,0.3)",
    },
    {
      icon: Brain,
      title: "AI Predictions",
      description: "Get predictive insights on market trends and personal portfolio performance based on historical data and sentiment analysis.",
      link: "See Predictions",
      color: "from-pink-500 to-rose-600",
      glow: "rgba(236,72,153,0.3)",
    },
    {
      icon: Target,
      title: "Financial Goal Planning",
      description: "Set targets for retirement, real estate, or major purchases. Our AI builds a dynamic roadmap to get you there.",
      link: "Start Planning",
      color: "from-emerald-500 to-teal-600",
      glow: "rgba(16,185,129,0.3)",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Connect Accounts",
      description: "Securely link your brokerages and wallets via Plaid integration.",
    },
    {
      number: "2",
      title: "AI Analysis",
      description: "Our engine scans your holdings for risk, fees, and opportunities.",
    },
    {
      number: "3",
      title: "Get Insights",
      description: "Receive actionable alerts and automated rebalancing suggestions.",
    },
  ];

  const trustedLogos = ["stripe", "AWS", "G", "⊞", ""];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#080b18" }}>
      <FloatingParticles />

      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(79,46,220,0.15) 50%, transparent 70%)", filter: "blur(80px)" }}
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-32 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(37,99,235,0.1) 50%, transparent 70%)", filter: "blur(80px)" }}
          animate={{ x: [0, -40, 0], y: [0, -60, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: "rgba(8,11,24,0.8)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "1.1rem" }}>WealthWise AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it Works", "Pricing"].map((item) => (
              <a key={item} href="#" className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm px-4 py-2 rounded-lg transition-colors" style={{ color: "rgba(255,255,255,0.6)" }}>
              Log In
            </Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/signup"
                className="flex items-center gap-2 text-sm px-5 py-2 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}
              >
                Get Started
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "rgba(196,181,253,0.9)" }}
          >
            <span style={{ color: "#a78bfa" }}>✦</span>
            The Future of AI Finance
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-white mb-4"
            style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}
          >
            Smarter Wealth
            <br />
            Management
            <br />
            <span style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              with AI
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.1rem" }}
          >
            Track, analyze, and grow your investments with intelligent insights.{" "}
            <span style={{ color: "rgba(167,139,250,0.8)" }}>Eliminate guesswork</span> and automate your financial future.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/signup"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 30px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.3)", fontWeight: 600 }}
              >
                Start Building Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <button
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}
              >
                <Play className="w-4 h-4 fill-current" style={{ color: "#a78bfa" }} />
                Watch Demo
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="mt-20"
        >
          <DashboardMockup />
        </motion.div>
      </section>

      {/* Trust Bar */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
            Trusted by 10,000+ forward-thinking investors
          </p>
        </div>
        <div className="flex items-center justify-center gap-10 flex-wrap">
          {["stripe", "AWS", "Google", "Microsoft", "Apple"].map((logo, i) => (
            <div key={i} className="px-4 py-2">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: "0.05em" }}>{logo}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800 }}>
            Intelligent tools for modern wealth
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.05rem" }}>
            Everything you need to manage, analyze, and grow your assets in{" "}
            <span style={{ color: "rgba(167,139,250,0.8)" }}>one beautiful platform.</span>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative p-8 rounded-2xl cursor-pointer transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(20px)",
                }}
                onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.14)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${feature.color}`}
                  style={{ boxShadow: `0 4px 20px ${feature.glow}` }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white mb-3" style={{ fontSize: "1.15rem", fontWeight: 700 }}>{feature.title}</h3>
                <p className="mb-5 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>{feature.description}</p>
                <div className="flex items-center gap-1 text-sm" style={{ color: "#a78bfa" }}>
                  {feature.link}
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800 }}>
            How it works
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)" }} />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="text-center relative"
            >
              <motion.div
                whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(124,58,237,0.5)" }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.35)",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {step.number}
              </motion.div>
              <h3 className="text-white mb-3" style={{ fontSize: "1.05rem", fontWeight: 700 }}>{step.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden p-16 text-center"
          style={{ background: "linear-gradient(135deg, #1e0a3c 0%, #0f0726 40%, #080b18 70%, #0a1628 100%)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          {/* Glow orbs inside CTA */}
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full -translate-y-1/2" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full translate-y-1/2" style={{ background: "radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)", filter: "blur(40px)" }} />

          <div className="relative z-10">
            <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800 }}>
              Start building your financial
              <br />future today.
            </h2>
            <p className="mb-10 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>
              Join thousands of investors using AI to outsmart the market. Setup takes less than 3 minutes.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/signup"
                  className="px-7 py-3.5 rounded-xl text-white"
                  style={{ background: "rgba(255,255,255,0.95)", color: "#080b18", fontWeight: 700 }}
                >
                  Get Started for Free
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/login"
                  className="px-7 py-3.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}
                >
                  Contact Sales
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-white" style={{ fontWeight: 700 }}>WealthWise AI</span>
            </div>
            <div className="flex gap-8">
              {["Privacy", "Terms", "Security"].map((link) => (
                <a key={link} href="#" className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
                >
                  {link}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {[
                { icon: "𝕏", label: "Twitter" },
                { icon: "in", label: "LinkedIn" },
                { icon: "⌨", label: "GitHub" },
              ].map((s) => (
                <a key={s.label} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 text-center text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
            © 2026 WealthWise AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
