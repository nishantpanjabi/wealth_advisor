import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import { formatCurrency, formatPercent } from "../lib/format";
import { getPredictionSummary } from "../services/predictionService";

export default function PredictionsPage() {
  const [years, setYears] = useState(5);

  const summaryQuery = useQuery({
    queryKey: ["predictions", "summary", years],
    queryFn: () => getPredictionSummary(years),
  });

  if (summaryQuery.isLoading) {
    return <LoadingState label="Running predictions..." />;
  }

  if (summaryQuery.isError) {
    return (
      <ErrorState
        title="Unable to load predictions"
        message={summaryQuery.error.message}
        onRetry={summaryQuery.refetch}
      />
    );
  }

  const summary = summaryQuery.data || {};
  const forecast = summary.portfolioForecast;
  const sip = summary.sipRecommendation;
  const anomalies = summary.anomalies || [];

  return (
    <div className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
      <h2 className="font-display text-3xl text-ink">Predictions</h2>
      <p className="mt-1 text-sm text-ink/70">Forecast your portfolio path using backend prediction models.</p>

      <div className="mt-4">
        <label className="text-sm font-semibold text-ink/80">
          Projection Years: {years}
          <input
            type="range"
            min="1"
            max="20"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
      </div>

      {forecast ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl bg-mist/80 p-4">
            <p className="text-xs uppercase tracking-wide text-ink/60">Current Portfolio</p>
            <p className="font-display text-2xl text-ink">{formatCurrency(forecast.currentPortfolioValue)}</p>
          </article>
          <article className="rounded-xl bg-mist/80 p-4">
            <p className="text-xs uppercase tracking-wide text-ink/60">Projected Gain</p>
            <p className="font-display text-2xl text-ink">{formatCurrency(forecast.projectedGain)}</p>
          </article>
          <article className="rounded-xl bg-sea p-4 text-mist">
            <p className="text-xs uppercase tracking-wide text-mist/70">Projected Corpus</p>
            <p className="font-display text-2xl">{formatCurrency(forecast.projectedPortfolioValue)}</p>
            <p className="text-xs text-mist/80">CAGR {formatPercent(forecast.projectedCagr || 0)}</p>
          </article>
        </div>
      ) : null}

      {sip ? (
        <article className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4">
          <h3 className="font-display text-2xl text-ink">SIP Recommendation</h3>
          <p className="mt-2 text-sm text-ink/80">
            Recommended Monthly Investment: <strong>{formatCurrency(sip.recommendedMonthlyInvestment)}</strong>
          </p>
          <p className="text-sm text-ink/80">Band: {sip.recommendationBand}</p>
        </article>
      ) : null}

      <div className="mt-4 space-y-3">
        {anomalies.length === 0 ? (
          <EmptyState title="No anomalies" message="No unusual prediction risk flags currently detected." />
        ) : null}
        {anomalies.map((item, idx) => (
          <article key={`${item.title}-${idx}`} className="rounded-2xl border border-black/10 bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-rust">{item.severity}</p>
            <p className="font-semibold text-ink">{item.title}</p>
            <p className="text-sm text-ink/80">{item.recommendation}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
