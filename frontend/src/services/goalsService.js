import { apiRequest } from "../lib/httpClient";

export async function getGoals() {
  return apiRequest({ path: "/goals" });
}

export async function createGoal(payload) {
  return apiRequest({
    path: "/goals",
    method: "POST",
    body: payload,
  });
}

export async function deleteGoal(goalId) {
  return apiRequest({
    path: `/goals/${goalId}`,
    method: "DELETE",
  });
}
