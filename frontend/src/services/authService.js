import { apiRequest } from "../lib/httpClient";

export async function login(payload) {
  return apiRequest({
    path: "/auth/login",
    method: "POST",
    body: payload,
    requiresAuth: false,
  });
}

export async function register(payload) {
  return apiRequest({
    path: "/auth/register",
    method: "POST",
    body: payload,
    requiresAuth: false,
  });
}

export async function refresh(payload) {
  return apiRequest({
    path: "/auth/refresh",
    method: "POST",
    body: payload,
    requiresAuth: false,
  });
}

export async function logout(payload) {
  return apiRequest({
    path: "/auth/logout",
    method: "POST",
    body: payload,
    requiresAuth: false,
  });
}
