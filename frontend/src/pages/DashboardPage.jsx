import { useQuery } from "@tanstack/react-query";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import StatCard from "../components/ui/StatCard";
import { formatCurrency, formatPercent } from "../lib/format";
import { getGoals } from "../services/goalsService";
import { getPortfolio } from "../services/portfolioService";
import { getProfile } from "../services/profileService";
import { getLatestRisk } from "../services/riskService";

export default function DashboardPage() {
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile, retry: false });
  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: getGoals });
  const portfolioQuery = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });
  const latestRiskQuery = useQuery({ queryKey: ["risk", "latest"], queryFn: getLatestRisk, retry: false });

  const showLoading =
    (profileQuery.isLoading || goalsQuery.isLoading || portfolioQuery.isLoading) &&
    !profileQuery.data &&
    !goalsQuery.data &&
    !portfolioQuery.data;

  if (showLoading) {
    return <LoadingState label="Loading dashboard data..." />;
  }

  const allFailed =
    profileQuery.isError &&
    goalsQuery.isError &&
    portfolioQuery.isError &&
    latestRiskQuery.isError;

  if (allFailed) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        message="Could not fetch your financial data from backend."
        onRetry={() => {
          profileQuery.refetch();
          goalsQuery.refetch();
          portfolioQuery.refetch();
          latestRiskQuery.refetch();
        }}
      />
    );
  }

  const profile = profileQuery.data || {};
  const goals = goalsQuery.data || [];
  const portfolio = portfolioQuery.data || {};
  const latestRisk = latestRiskQuery.data;

  const monthlySurplus =
    Number(profile.monthlyIncome || 0) - Number(profile.monthlyExpenses || 0);

  const netWorth = Number(profile.netWorth || 0);
  const portfolioValue = Number(portfolio.totalCurrentValue || 0);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Net Worth" value={formatCurrency(netWorth)} hint="From live profile" />
        <StatCard
          label="Monthly Surplus"
          value={formatCurrency(monthlySurplus)}
          hint="Income minus expenses"
        />
        <StatCard
          label="Portfolio Value"
          value={formatCurrency(portfolioValue)}
          hint={`Return ${formatPercent(portfolio.totalReturnPercent || 0)}`}
        />
        <StatCard
          label="Latest Risk"
          value={latestRisk ? `${latestRisk.riskScore}/100` : "N/A"}
          hint={latestRisk?.riskCategory || "No risk record yet"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
          <h3 className="font-display text-2xl text-ink">Priority Goals</h3>
          <div className="mt-3 space-y-3">
            {goals.slice(0, 4).map((goal) => {
              const progress = Math.min(100, Number(goal.progressPercent || 0));
              return (
                <div key={goal.id} className="rounded-xl bg-mist/70 p-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-ink">
                    <span>{goal.name}</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-sea" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
            {goals.length === 0 ? (
              <p className="rounded-xl bg-white/70 p-3 text-sm text-ink/70">
                No goals found. Add your first goal to start tracking progress.
              </p>
            ) : null}
          </div>
        </article>

        <article className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
          <h3 className="font-display text-2xl text-ink">Execution Rhythm</h3>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-ink/80">
            <li className="rounded-xl bg-white/60 p-3">Review budget weekly and keep emergency reserve healthy.</li>
            <li className="rounded-xl bg-white/60 p-3">Rebalance allocation quarterly based on optimization output.</li>
            <li className="rounded-xl bg-white/60 p-3">Run risk and scenario simulation before major allocation shifts.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
