import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import { formatDateTime } from "../lib/format";
import { calculateRisk, getLatestRisk, getRiskHistory } from "../services/riskService";

export default function RiskPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    investmentHorizonYears: 15,
    lossTolerance: 7,
    incomeStability: 8,
    investmentExperienceYears: 6,
  });

  const latestQuery = useQuery({
    queryKey: ["risk", "latest"],
    queryFn: getLatestRisk,
    retry: false,
  });
  const historyQuery = useQuery({ queryKey: ["risk", "history"], queryFn: getRiskHistory, retry: false });

  const calculateMutation = useMutation({
    mutationFn: calculateRisk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk", "latest"] });
      queryClient.invalidateQueries({ queryKey: ["risk", "history"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    calculateMutation.mutate({
      investmentHorizonYears: Number(form.investmentHorizonYears),
      lossTolerance: Number(form.lossTolerance),
      incomeStability: Number(form.incomeStability),
      investmentExperienceYears: Number(form.investmentExperienceYears),
    });
  };

  if (historyQuery.isLoading) {
    return <LoadingState label="Loading risk profile..." />;
  }

  if (historyQuery.isError && latestQuery.isError) {
    return (
      <ErrorState
        title="Unable to load risk data"
        message={historyQuery.error.message}
        onRetry={() => {
          latestQuery.refetch();
          historyQuery.refetch();
        }}
      />
    );
  }

  const latest = calculateMutation.data || latestQuery.data;
  const history = historyQuery.data || [];

  return (
    <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
      <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
        <h2 className="font-display text-2xl text-ink">Risk Profiling</h2>
        <div className="mt-4 space-y-3">
          {[
            ["investmentHorizonYears", "Investment horizon (years)", 1, 40],
            ["lossTolerance", "Loss tolerance (1-10)", 1, 10],
            ["incomeStability", "Income stability (1-10)", 1, 10],
            ["investmentExperienceYears", "Investment experience (years)", 0, 40],
          ].map(([key, label, min, max]) => (
            <label key={key} className="block text-sm font-semibold text-ink/80">
              {label}: {form[key]}
              <input
                type="range"
                min={min}
                max={max}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="mt-1 w-full"
              />
            </label>
          ))}
        </div>
        <button
          disabled={calculateMutation.isPending}
          className="mt-3 w-full rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-sea disabled:opacity-60"
        >
          {calculateMutation.isPending ? "Calculating..." : "Calculate score"}
        </button>
        {calculateMutation.error ? (
          <p className="mt-2 text-sm font-semibold text-rust">{calculateMutation.error.message}</p>
        ) : null}
      </form>

      <section className="space-y-3">
        {latest ? (
          <article className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-ink/60">Latest Result</p>
            <p className="font-display text-4xl text-ink">{latest.riskScore}/100</p>
            <p className="text-sm font-semibold text-sea">{latest.riskCategory}</p>
            <p className="text-xs text-ink/60">{formatDateTime(latest.calculatedAt)}</p>
          </article>
        ) : null}

        {history.length === 0 ? (
          <EmptyState title="No risk history" message="Run a risk calculation to create your first profile." />
        ) : null}

        {history.map((item, index) => (
          <article key={`${item.calculatedAt}-${index}`} className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">{item.riskScore}/100</p>
              <p className="text-xs text-ink/60">{formatDateTime(item.calculatedAt)}</p>
            </div>
            <p className="text-sm text-ink/70">{item.riskCategory}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
