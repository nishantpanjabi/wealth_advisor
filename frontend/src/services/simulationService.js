import { apiRequest } from "../lib/httpClient";

export async function runPresetScenario(scenarioType) {
  return apiRequest({
    path: `/simulation/presets/${scenarioType}`,
    method: "POST",
  });
}

export async function runCustomSimulation(payload) {
  return apiRequest({
    path: "/simulation/custom",
    method: "POST",
    body: payload,
  });
}

export async function getSimulationHistory() {
  return apiRequest({ path: "/simulation/history" });
}
