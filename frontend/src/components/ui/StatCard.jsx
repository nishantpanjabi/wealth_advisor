export default function StatCard({ label, value, hint }) {
  return (
    <article className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-ink/60">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {hint ? <p className="mt-1 text-sm text-ink/70">{hint}</p> : null}
    </article>
  );
}
