import { apiRequest } from "../lib/httpClient";

export async function getLatestRisk() {
  return apiRequest({ path: "/risk/latest" });
}

export async function getRiskHistory() {
  return apiRequest({ path: "/risk/history" });
}

export async function calculateRisk(payload) {
  return apiRequest({
    path: "/risk/calculate",
    method: "POST",
    body: payload,
  });
}
