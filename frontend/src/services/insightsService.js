import { apiRequest } from "../lib/httpClient";

export async function generateInsights() {
  return apiRequest({
    path: "/insights/generate",
    method: "POST",
  });
}

export async function getHealthScore() {
  return apiRequest({ path: "/insights/health-score" });
}

export async function getAlerts() {
  return apiRequest({ path: "/insights/alerts" });
}

export async function dismissAlert(alertId) {
  return apiRequest({
    path: `/insights/alerts/${alertId}/dismiss`,
    method: "PATCH",
  });
}

export async function snoozeAlert(alertId, days = 7) {
  return apiRequest({
    path: `/insights/alerts/${alertId}/snooze`,
    method: "PATCH",
    params: { days },
  });
}
