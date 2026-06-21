import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import { formatDateTime } from "../lib/format";
import {
  dismissAlert,
  generateInsights,
  getAlerts,
  getHealthScore,
  snoozeAlert,
} from "../services/insightsService";

export default function InsightsPage() {
  const queryClient = useQueryClient();

  const healthQuery = useQuery({ queryKey: ["insights", "health"], queryFn: getHealthScore, retry: false });
  const alertsQuery = useQuery({ queryKey: ["insights", "alerts"], queryFn: getAlerts, retry: false });

  const generateMutation = useMutation({
    mutationFn: generateInsights,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights", "health"] });
      queryClient.invalidateQueries({ queryKey: ["insights", "alerts"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: dismissAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights", "alerts"] });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: (alertId) => snoozeAlert(alertId, 7),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights", "alerts"] });
    },
  });

  if (healthQuery.isLoading && alertsQuery.isLoading) {
    return <LoadingState label="Loading insights..." />;
  }

  if (healthQuery.isError && alertsQuery.isError) {
    return (
      <ErrorState
        title="Unable to load insights"
        message={alertsQuery.error.message || healthQuery.error.message}
        onRetry={() => {
          healthQuery.refetch();
          alertsQuery.refetch();
        }}
      />
    );
  }

  const health = healthQuery.data;
  const alerts = alertsQuery.data || [];

  return (
    <div className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-ink">Insights</h2>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-sea disabled:opacity-60"
        >
          {generateMutation.isPending ? "Generating..." : "Generate latest insights"}
        </button>
      </div>

      {health ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <article className="rounded-xl bg-mist/80 p-3">
            <p className="text-xs uppercase tracking-wide text-ink/60">Health Score</p>
            <p className="font-display text-2xl text-ink">{health.score}/100</p>
          </article>
          <article className="rounded-xl bg-mist/80 p-3">
            <p className="text-xs uppercase tracking-wide text-ink/60">Savings</p>
            <p className="font-display text-2xl text-ink">{health.savingsScore?.toFixed(1) || 0}</p>
          </article>
          <article className="rounded-xl bg-mist/80 p-3">
            <p className="text-xs uppercase tracking-wide text-ink/60">Goals</p>
            <p className="font-display text-2xl text-ink">{health.goalScore?.toFixed(1) || 0}</p>
          </article>
          <article className="rounded-xl bg-mist/80 p-3">
            <p className="text-xs uppercase tracking-wide text-ink/60">Diversification</p>
            <p className="font-display text-2xl text-ink">{health.diversificationScore?.toFixed(1) || 0}</p>
          </article>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <EmptyState title="No active alerts" message="Your account currently has no actionable financial alerts." />
        ) : null}

        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-rust">{alert.severity}</p>
              <p className="text-xs text-ink/60">{formatDateTime(alert.createdAt)}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-ink">{alert.message}</p>
            <p className="mt-1 text-sm text-ink/70">{alert.actionSuggestion}</p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => dismissMutation.mutate(alert.id)}
                disabled={dismissMutation.isPending}
                className="rounded-lg bg-sea px-3 py-1.5 text-xs font-bold text-white hover:bg-ink disabled:opacity-60"
              >
                Dismiss
              </button>
              <button
                onClick={() => snoozeMutation.mutate(alert.id)}
                disabled={snoozeMutation.isPending}
                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-sea disabled:opacity-60"
              >
                Snooze 7d
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
