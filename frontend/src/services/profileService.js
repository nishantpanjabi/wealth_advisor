import { apiRequest } from "../lib/httpClient";

export async function getProfile() {
  return apiRequest({ path: "/profile" });
}

export async function saveProfile(payload) {
  return apiRequest({
    path: "/profile",
    method: "PUT",
    body: payload,
  });
}
