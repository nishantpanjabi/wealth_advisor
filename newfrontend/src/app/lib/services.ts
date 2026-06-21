import { apiRequest } from "./api";
import { clearAuthSession, getAuthSession, setAuthSession } from "./auth";

export const PROFILE_UPDATED_EVENT = "wealthadvisor:profile-updated";

export function notifyProfileUpdated(profile: any) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: profile }));
}

type AuthResponse = {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
};

export async function login(email: string, password: string) {
  const data = await apiRequest<AuthResponse>({
    path: "/auth/login",
    method: "POST",
    auth: false,
    body: { email, password },
  });

  setAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
    },
  });

  return data;
}

export async function register(fullName: string, email: string, password: string) {
  const data = await apiRequest<AuthResponse>({
    path: "/auth/register",
    method: "POST",
    auth: false,
    body: { fullName, email, password },
  });

  setAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
    },
  });

  return data;
}

export async function logout() {
  const session = getAuthSession();
  try {
    if (session?.refreshToken) {
      await apiRequest<void>({
        path: "/auth/logout",
        method: "POST",
        auth: false,
        body: { refreshToken: session.refreshToken },
      });
    }
  } finally {
    clearAuthSession();
  }
}

export async function getProfile() {
  return apiRequest<any>({ path: "/profile" });
}

export async function saveProfile(payload: any) {
  const updated = await apiRequest<any>({ path: "/profile", method: "PUT", body: payload });
  notifyProfileUpdated(updated);
  return updated;
}

export async function getGoals() {
  return apiRequest<any[]>({ path: "/goals" });
}

export async function getGoal(goalId: string) {
  return apiRequest<any>({ path: `/goals/${goalId}` });
}

export async function createGoal(payload: any) {
  return apiRequest<any>({ path: "/goals", method: "POST", body: payload });
}

export async function getPortfolio() {
  return apiRequest<any>({ path: "/portfolio" });
}

export async function getPortfolioOptimization() {
  return apiRequest<any>({ path: "/portfolio/optimize" });
}

export async function getPortfolioTransactions() {
  return apiRequest<any[]>({ path: "/portfolio/transactions" });
}

export async function getPortfolioPerformance() {
  return apiRequest<any[]>({ path: "/portfolio/performance" });
}

export async function getPortfolioXirr() {
  return apiRequest<any>({ path: "/portfolio/xirr" });
}

export async function getPortfolioBenchmark() {
  return apiRequest<any>({ path: "/portfolio/benchmark" });
}

export async function addInvestment(payload: any) {
  return apiRequest<any>({ path: "/portfolio/investments", method: "POST", body: payload });
}

export async function getRiskLatest() {
  return apiRequest<any>({ path: "/risk/latest" });
}

export async function getRiskHistory() {
  return apiRequest<any[]>({ path: "/risk/history" });
}

export async function calculateRisk(payload: any) {
  return apiRequest<any>({ path: "/risk/calculate", method: "POST", body: payload });
}

export async function getPredictionSummary(years: number) {
  return apiRequest<any>({ path: "/predictions/summary", params: { years } });
}

export async function getPredictionPortfolioForecast(years: number) {
  return apiRequest<any>({ path: "/predictions/portfolio-forecast", params: { years } });
}

export async function getPredictionSipRecommendation() {
  return apiRequest<any>({ path: "/predictions/sip-recommendation" });
}

export async function getPredictionAnomalies() {
  return apiRequest<any[]>({ path: "/predictions/anomalies" });
}

export async function getSimulationHistory() {
  return apiRequest<any[]>({ path: "/simulation/history" });
}

export async function getSimulationPresets() {
  return apiRequest<any[]>({ path: "/simulation/presets" });
}

export async function runPresetSimulation(scenarioType: string) {
  return apiRequest<any>({ path: `/simulation/presets/${scenarioType}`, method: "POST" });
}

export async function runCustomSimulation(payload: any) {
  return apiRequest<any>({ path: "/simulation/custom", method: "POST", body: payload });
}

export async function getRecommendations(investmentAmount?: number, years?: number) {
  return apiRequest<any>({
    path: "/recommendations",
    params: {
      investmentAmount: investmentAmount ?? undefined,
      years: years ?? undefined,
    },
  });
}

export async function getHealthScore() {
  return apiRequest<any>({ path: "/insights/health-score" });
}

export async function getAlerts() {
  return apiRequest<any[]>({ path: "/insights/alerts" });
}

export async function dismissAlert(alertId: number) {
  return apiRequest<any>({ path: `/insights/alerts/${alertId}/dismiss`, method: "PATCH" });
}

export async function snoozeAlert(alertId: number, days = 7) {
  return apiRequest<any>({ path: `/insights/alerts/${alertId}/snooze`, method: "PATCH", params: { days } });
}

export async function generateInsights() {
  return apiRequest<any>({ path: "/insights/generate", method: "POST" });
}

export async function getAdminDashboard() {
  return apiRequest<any>({ path: "/admin/dashboard" });
}

export async function getMarketDataSummary() {
  return apiRequest<any>({ path: "/admin/market-data" });
}

export async function refreshMarketData() {
  return apiRequest<any>({ path: "/admin/market-data/refresh", method: "POST" });
}
