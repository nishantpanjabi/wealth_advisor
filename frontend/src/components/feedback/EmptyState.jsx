export default function EmptyState({ title, message }) {
  return (
    <div className="glass rounded-2xl border border-white/70 p-5 text-center shadow-soft">
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink/70">{message}</p>
    </div>
  );
}
