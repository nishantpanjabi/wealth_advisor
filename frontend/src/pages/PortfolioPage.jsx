import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import { formatCurrency, formatPercent } from "../lib/format";
import {
  addInvestment,
  deleteInvestment,
  getOptimization,
  getPortfolio,
  getXirr,
} from "../services/portfolioService";

const initialForm = {
  assetName: "",
  assetType: "ETF",
  buyPrice: "",
  quantity: "",
  currentValue: "",
  purchaseDate: "",
};

export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const portfolioQuery = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });
  const xirrQuery = useQuery({ queryKey: ["portfolio", "xirr"], queryFn: getXirr, retry: false });
  const optimizationQuery = useQuery({
    queryKey: ["portfolio", "optimize"],
    queryFn: getOptimization,
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: addInvestment,
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", "xirr"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", "optimize"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", "xirr"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", "optimize"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addMutation.mutate({
      assetName: form.assetName,
      assetType: form.assetType,
      buyPrice: Number(form.buyPrice),
      quantity: Number(form.quantity),
      currentValue: Number(form.currentValue),
      purchaseDate: form.purchaseDate,
    });
  };

  if (portfolioQuery.isLoading) {
    return <LoadingState label="Loading portfolio..." />;
  }

  if (portfolioQuery.isError) {
    return (
      <ErrorState
        title="Unable to load portfolio"
        message={portfolioQuery.error.message}
        onRetry={portfolioQuery.refetch}
      />
    );
  }

  const portfolio = portfolioQuery.data || {};
  const investments = portfolio.investments || [];

  return (
    <div className="grid gap-4 lg:grid-cols-[350px_1fr]">
      <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
        <h2 className="font-display text-2xl text-ink">Add Investment</h2>
        <div className="mt-3 space-y-2">
          <input
            value={form.assetName}
            onChange={(e) => setForm((prev) => ({ ...prev, assetName: e.target.value }))}
            placeholder="Asset name"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <select
            value={form.assetType}
            onChange={(e) => setForm((prev) => ({ ...prev, assetType: e.target.value }))}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          >
            <option>STOCK</option>
            <option>MUTUAL_FUND</option>
            <option>ETF</option>
            <option>BOND</option>
            <option>GOLD</option>
            <option>CASH</option>
            <option>OTHER</option>
          </select>
          <input
            value={form.buyPrice}
            onChange={(e) => setForm((prev) => ({ ...prev, buyPrice: e.target.value }))}
            placeholder="Buy price"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            placeholder="Quantity"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={form.currentValue}
            onChange={(e) => setForm((prev) => ({ ...prev, currentValue: e.target.value }))}
            placeholder="Current value"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
          <button
            disabled={addMutation.isPending}
            className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-sea disabled:opacity-60"
          >
            {addMutation.isPending ? "Adding..." : "Add"}
          </button>
          {addMutation.error ? (
            <p className="text-sm font-semibold text-rust">{addMutation.error.message}</p>
          ) : null}
        </div>
      </form>

      <section className="space-y-3">
        <article className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-ink/60">Portfolio Value</p>
          <p className="font-display text-4xl text-ink">{formatCurrency(portfolio.totalCurrentValue)}</p>
          <p className="text-sm text-ink/70">
            P/L {formatCurrency(portfolio.totalProfitLoss)} | Return {formatPercent(portfolio.totalReturnPercent || 0)}
          </p>
          <p className="text-sm text-ink/70">
            XIRR {xirrQuery.data?.xirrPercent ? `${xirrQuery.data.xirrPercent.toFixed(2)}%` : "N/A"}
          </p>
          <p className="text-sm text-ink/70">
            Recommended profile {optimizationQuery.data?.allocationProfile || "N/A"}
          </p>
        </article>

        {investments.length === 0 ? (
          <EmptyState title="No investments yet" message="Add holdings to build your portfolio." />
        ) : null}

        {investments.map((inv) => (
          <article key={inv.id} className="glass rounded-2xl border border-white/70 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-ink">{inv.assetName}</h3>
              <span className="rounded-full bg-sea/15 px-3 py-1 text-xs font-bold text-sea">{inv.assetType}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70">Quantity: {inv.quantity}</p>
            <p className="text-sm text-ink/70">Buy Price: {formatCurrency(inv.buyPrice)}</p>
            <p className="text-sm text-ink/70">Invested: {formatCurrency(inv.investedValue)}</p>
            <p className="text-sm font-bold text-ink">Current Value: {formatCurrency(inv.currentValue)}</p>
            <p className="text-sm text-ink/70">Return: {formatPercent(inv.returnPercent || 0)}</p>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => deleteMutation.mutate(inv.id)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-rust px-3 py-1.5 text-xs font-bold text-white hover:bg-ink disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
