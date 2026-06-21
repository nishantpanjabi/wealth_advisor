import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import { ApiError } from "../lib/httpClient";
import { getProfile, saveProfile } from "../services/profileService";

const defaultForm = {
  monthlyIncome: "",
  monthlyExpenses: "",
  assetsValue: "",
  liabilitiesValue: "",
  age: "",
  dependents: "",
  employmentType: "SALARIED",
  investmentExperienceYears: "",
  investmentKnowledge: "INTERMEDIATE",
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      window.setTimeout(() => setSaved(false), 1300);
    },
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      monthlyIncome: profileQuery.data.monthlyIncome || "",
      monthlyExpenses: profileQuery.data.monthlyExpenses || "",
      age: profileQuery.data.age || "",
      dependents: profileQuery.data.dependents || "",
      employmentType: profileQuery.data.employmentType || "SALARIED",
      investmentExperienceYears: profileQuery.data.investmentExperienceYears || "",
      investmentKnowledge: profileQuery.data.investmentKnowledge || "INTERMEDIATE",
    }));
  }, [profileQuery.data]);

  if (profileQuery.isLoading) {
    return <LoadingState label="Loading profile..." />;
  }

  const isNotFound =
    profileQuery.error instanceof ApiError && profileQuery.error.status === 404;

  if (profileQuery.isError && !isNotFound) {
    return (
      <ErrorState
        title="Unable to load profile"
        message={profileQuery.error.message}
        onRetry={profileQuery.refetch}
      />
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      monthlyIncome: Number(form.monthlyIncome || 0),
      monthlyExpenses: Number(form.monthlyExpenses || 0),
      assetsValue: Number(form.assetsValue || 0),
      liabilitiesValue: Number(form.liabilitiesValue || 0),
      age: Number(form.age || 0),
      dependents: Number(form.dependents || 0),
      employmentType: form.employmentType,
      investmentExperienceYears: Number(form.investmentExperienceYears || 0),
      investmentKnowledge: form.investmentKnowledge,
    });
  };

  return (
    <div className="glass rounded-2xl border border-white/70 p-5 shadow-soft">
      <h2 className="font-display text-3xl text-ink">Profile</h2>
      <p className="mt-1 text-sm text-ink/70">Maintain your financial profile for better projections.</p>

      {isNotFound ? (
        <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-ink/70">
          No profile found yet. Fill details below to create your profile.
        </p>
      ) : null}

      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        {[
          ["monthlyIncome", "Monthly income"],
          ["monthlyExpenses", "Monthly expenses"],
          ["assetsValue", "Assets value"],
          ["liabilitiesValue", "Liabilities value"],
          ["age", "Age"],
          ["dependents", "Dependents"],
          ["employmentType", "Employment type"],
          ["investmentExperienceYears", "Investment experience (years)"],
          ["investmentKnowledge", "Investment knowledge"],
        ].map(([key, label]) => (
          <label key={key} className="text-sm font-semibold text-ink/80">
            {label}
            <input
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
          </label>
        ))}

        <div className="md:col-span-2">
          <button
            disabled={saveMutation.isPending}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-sea disabled:opacity-60"
          >
            {saveMutation.isPending ? "Saving..." : "Save profile"}
          </button>
          {saved ? <span className="ml-3 text-sm font-bold text-sea">Saved</span> : null}
          {saveMutation.error ? (
            <p className="mt-2 text-sm font-semibold text-rust">{saveMutation.error.message}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
