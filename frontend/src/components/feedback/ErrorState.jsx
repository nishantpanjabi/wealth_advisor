export default function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="glass rounded-2xl border border-rust/40 bg-rust/10 p-4 shadow-soft">
      <p className="text-sm font-bold text-rust">{title}</p>
      <p className="mt-1 text-sm text-ink/80">{message || "Please try again."}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-sea"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
