import { apiRequest } from "../lib/httpClient";

export async function getPortfolio() {
  return apiRequest({ path: "/portfolio" });
}

export async function getOptimization() {
  return apiRequest({ path: "/portfolio/optimize" });
}

export async function getPerformance() {
  return apiRequest({ path: "/portfolio/performance" });
}

export async function getXirr() {
  return apiRequest({ path: "/portfolio/xirr" });
}

export async function addInvestment(payload) {
  return apiRequest({
    path: "/portfolio/investments",
    method: "POST",
    body: payload,
  });
}

export async function deleteInvestment(investmentId) {
  return apiRequest({
    path: `/portfolio/investments/${investmentId}`,
    method: "DELETE",
  });
}
