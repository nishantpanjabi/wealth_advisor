import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-xl glass rounded-3xl border border-white/70 p-8 shadow-soft text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-rust">404</p>
        <h1 className="mt-2 font-display text-5xl text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink/70">The route you entered does not exist.</p>
        <Link to="/" className="mt-5 inline-block rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-sea">
          Back to home
        </Link>
      </div>
    </div>
  );
}
