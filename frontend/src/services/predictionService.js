import { apiRequest } from "../lib/httpClient";

export async function getPredictionSummary(years = 5) {
  return apiRequest({
    path: "/predictions/summary",
    params: { years },
  });
}

export async function getPortfolioForecast(years = 5) {
  return apiRequest({
    path: "/predictions/portfolio-forecast",
    params: { years },
  });
}

export async function getSipRecommendation() {
  return apiRequest({ path: "/predictions/sip-recommendation" });
}

export async function getPredictionAnomalies() {
  return apiRequest({ path: "/predictions/anomalies" });
}
