import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(form);
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-md">
        <form onSubmit={handleSubmit} className="glass rounded-3xl border border-white/70 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.22em] text-rust">Start now</p>
          <h1 className="mt-1 font-display text-4xl text-ink">Create account</h1>

          <div className="mt-5 space-y-3">
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>

          {error ? <p className="mt-3 text-sm font-semibold text-rust">{error}</p> : null}

          <button
            disabled={isSubmitting}
            className="mt-4 w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-sea disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

          <p className="mt-4 text-sm text-ink/70">
            Already have an account? <Link to="/login" className="font-bold text-sea">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
