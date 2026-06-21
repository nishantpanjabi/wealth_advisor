import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import { formatCurrency } from "../lib/format";
import { createGoal, deleteGoal, getGoals } from "../services/goalsService";

const initialForm = {
  name: "",
  goalType: "RETIREMENT",
  targetAmount: "",
  currentAmount: "",
  targetYears: "",
  priority: "5",
  expectedAnnualReturn: "10",
  expectedInflationRate: "6",
  status: "PLANNED",
};

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: getGoals });

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      name: form.name,
      goalType: form.goalType,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
      targetYears: Number(form.targetYears),
      priority: Number(form.priority),
      expectedAnnualReturn: Number(form.expectedAnnualReturn),
      expectedInflationRate: Number(form.expectedInflationRate),
      status: form.status,
    });
  };

  if (goalsQuery.isLoading) {
    return <LoadingState label="Loading goals..." />;
  }

  if (goalsQuery.isError) {
    return (
      <ErrorState
        title="Unable to load goals"
        message={goalsQuery.error.message}
        onRetry={goalsQuery.refetch}
      />
    );
  }

  const goals = goalsQuery.data || [];

  return (
    <div className="grid gap-4 lg:grid-cols-[350px_1fr]">
      <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
        <h2 className="font-display text-2xl text-ink">Add Goal</h2>
        <div className="mt-3 space-y-2">
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Goal name"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <select
            value={form.goalType}
            onChange={(e) => setForm((prev) => ({ ...prev, goalType: e.target.value }))}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          >
            <option>RETIREMENT</option>
            <option>EDUCATION</option>
            <option>HOME_PURCHASE</option>
            <option>EMERGENCY_FUND</option>
            <option>VACATION</option>
            <option>VEHICLE</option>
            <option>OTHER</option>
          </select>
          <input
            value={form.targetAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
            placeholder="Target amount"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={form.currentAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, currentAmount: e.target.value }))}
            placeholder="Current amount"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={form.targetYears}
            onChange={(e) => setForm((prev) => ({ ...prev, targetYears: e.target.value }))}
            placeholder="Target years"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={form.priority}
            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            placeholder="Priority 1-10"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          />
          <button
            disabled={createMutation.isPending}
            className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-sea disabled:opacity-60"
          >
            {createMutation.isPending ? "Saving..." : "Save goal"}
          </button>
          {createMutation.error ? (
            <p className="text-sm font-semibold text-rust">{createMutation.error.message}</p>
          ) : null}
        </div>
      </form>

      <section className="space-y-3">
        {goals.length === 0 ? (
          <EmptyState title="No goals yet" message="Create your first financial goal to begin tracking." />
        ) : null}

        {goals.map((goal) => {
          const progress = Math.min(100, Number(goal.progressPercent || 0));
          return (
            <article key={goal.id} className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl text-ink">{goal.name}</h3>
                <span className="rounded-full bg-rust/15 px-3 py-1 text-xs font-bold text-rust">
                  P{goal.priority}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink/70">
                {goal.goalType} | {goal.targetYears} years | {goal.status}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </p>
              <div className="mt-2 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-sea" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => deleteMutation.mutate(goal.id)}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg bg-rust px-3 py-1.5 text-xs font-bold text-white hover:bg-ink disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
