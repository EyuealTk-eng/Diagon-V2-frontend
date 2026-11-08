import { Component, type ErrorInfo, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Diagon UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center bg-cream p-6 text-center text-ink">
        <div className="space-y-4">
          <p className="font-display text-2xl font-extrabold">DIAGON<span className="text-clay">.</span></p>
          <p>Something went wrong. Please reload the page.</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-clay px-4 py-2.5 font-semibold text-white">
            Reload
          </button>
        </div>
      </div>
    );
  }
}
