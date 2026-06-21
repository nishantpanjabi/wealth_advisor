import { Link } from "react-router-dom";

const features = [
  {
    title: "Goal-led planning",
    copy: "Convert every life milestone into measurable capital strategy.",
  },
  {
    title: "Risk clarity",
    copy: "Continuously evaluate risk posture and adjust before markets force you.",
  },
  {
    title: "Predictive layer",
    copy: "Run forecasts and simulation scenarios before taking any allocation decision.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="glass animate-slide-up rounded-3xl border border-white/70 p-6 shadow-soft sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rust">Wealth Advisor</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight text-ink sm:text-6xl">
            Strategic wealth operating system for disciplined growth.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink/70 sm:text-lg">
            Plan goals, map risk, project outcomes, and execute with confidence in one integrated platform.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-sea">
              Create account
            </Link>
            <Link to="/login" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-mist">
              Sign in
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature, idx) => (
            <article
              key={feature.title}
              className="glass rounded-2xl border border-white/70 p-5 shadow-soft"
              style={{ animationDelay: `${idx * 90}ms` }}
            >
              <h3 className="font-display text-2xl text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/70">{feature.copy}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
