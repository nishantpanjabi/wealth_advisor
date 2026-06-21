export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
      <p className="text-sm font-semibold text-ink/70">{label}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
        <div className="h-2 w-1/3 animate-pulse rounded-full bg-sea" />
      </div>
    </div>
  );
}
