import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import { formatCurrency, formatDateTime, formatPercent } from "../lib/format";
import {
  getSimulationHistory,
  runCustomSimulation,
  runPresetScenario,
} from "../services/simulationService";

const initialCustom = {
  scenarioType: "BASELINE",
  equityShockPct: "-5",
  debtShockPct: "-2",
  goldShockPct: "3",
  liquidShockPct: "0",
  projectionYears: "8",
  iterations: "1500",
};

export default function SimulationPage() {
  const queryClient = useQueryClient();
  const [presetScenario, setPresetScenario] = useState("STRESS");
  const [customForm, setCustomForm] = useState(initialCustom);

  const historyQuery = useQuery({
    queryKey: ["simulation", "history"],
    queryFn: getSimulationHistory,
    retry: false,
  });

  const presetMutation = useMutation({
    mutationFn: runPresetScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation", "history"] });
    },
  });

  const customMutation = useMutation({
    mutationFn: runCustomSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation", "history"] });
    },
  });

  const latestResult = customMutation.data || presetMutation.data || historyQuery.data?.[0];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    customMutation.mutate({
      scenarioType: customForm.scenarioType,
      equityShockPct: Number(customForm.equityShockPct),
      debtShockPct: Number(customForm.debtShockPct),
      goldShockPct: Number(customForm.goldShockPct),
      liquidShockPct: Number(customForm.liquidShockPct),
      projectionYears: Number(customForm.projectionYears),
      iterations: Number(customForm.iterations),
    });
  };

  if (historyQuery.isLoading) {
    return <LoadingState label="Loading simulation history..." />;
  }

  if (historyQuery.isError) {
    return (
      <ErrorState
        title="Unable to load simulation"
        message={historyQuery.error.message}
        onRetry={historyQuery.refetch}
      />
    );
  }

  const history = historyQuery.data || [];

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <div className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
          <h2 className="font-display text-2xl text-ink">Run Preset Scenario</h2>
          <select
            value={presetScenario}
            onChange={(e) => setPresetScenario(e.target.value)}
            className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          >
            <option>BASELINE</option>
            <option>BULLISH</option>
            <option>BEARISH</option>
            <option>STRESS</option>
          </select>
          <button
            onClick={() => presetMutation.mutate(presetScenario)}
            disabled={presetMutation.isPending}
            className="mt-3 w-full rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-sea disabled:opacity-60"
          >
            {presetMutation.isPending ? "Running..." : "Run preset"}
          </button>
        </div>

        <form onSubmit={handleCustomSubmit} className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
          <h3 className="font-display text-2xl text-ink">Run Custom Scenario</h3>
          <div className="mt-3 grid gap-2">
            {[
              ["scenarioType", "Scenario Type"],
              ["equityShockPct", "Equity Shock %"],
              ["debtShockPct", "Debt Shock %"],
              ["goldShockPct", "Gold Shock %"],
              ["liquidShockPct", "Liquid Shock %"],
              ["projectionYears", "Projection Years"],
              ["iterations", "Iterations"],
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-semibold text-ink/80">
                {label}
                <input
                  value={customForm[key]}
                  onChange={(e) => setCustomForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>
          <button
            disabled={customMutation.isPending}
            className="mt-3 w-full rounded-xl bg-sea px-4 py-2 text-sm font-bold text-white hover:bg-ink disabled:opacity-60"
          >
            {customMutation.isPending ? "Running..." : "Run custom"}
          </button>
        </form>
      </div>

      <section className="space-y-3">
        {latestResult ? (
          <article className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-ink/60">Latest simulation</p>
            <p className="font-display text-3xl text-ink">{latestResult.scenarioType}</p>
            <p className="text-sm text-ink/70">
              Before {formatCurrency(latestResult.portfolioValueBefore)} | After {formatCurrency(latestResult.portfolioValueAfter)}
            </p>
            <p className="text-sm text-ink/70">Change {formatPercent(latestResult.changePercent || 0)}</p>
            <p className="text-sm text-ink/70">Expected {formatCurrency(latestResult.expectedValue)}</p>
          </article>
        ) : null}

        {history.length === 0 ? (
          <EmptyState title="No simulation history" message="Run your first scenario to evaluate stress outcomes." />
        ) : null}

        {history.map((item) => (
          <article key={item.simulationId} className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">{item.scenarioType}</p>
              <p className="text-xs text-ink/60">{formatDateTime(item.runAt)}</p>
            </div>
            <p className="text-sm text-ink/70">Expected: {formatCurrency(item.expectedValue)}</p>
            <p className="text-sm text-ink/70">Worst: {formatCurrency(item.worstCaseValue)}</p>
            <p className="text-sm text-ink/70">Best: {formatCurrency(item.bestCaseValue)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
