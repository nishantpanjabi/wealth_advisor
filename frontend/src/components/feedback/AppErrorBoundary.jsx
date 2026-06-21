import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Unhandled app error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen px-4 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-xl rounded-3xl border border-rust/30 bg-white/80 p-8 shadow-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-rust">Unexpected error</p>
            <h1 className="mt-2 font-display text-4xl text-ink">Application crashed</h1>
            <p className="mt-2 text-sm text-ink/70">Please refresh the page. If the problem continues, contact support.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-sea"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
