import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAuthTokens,
} from "./authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path, params = {}) {
  const root = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${root}${cleanPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function parseResponsePayload(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshPromise = null;
let authFailureHandler = null;

export function setAuthFailureHandler(handler) {
  authFailureHandler = handler;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    if (authFailureHandler) {
      authFailureHandler();
    }
    throw new ApiError("Session expired. Please log in again.", 401, null);
  }

  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok || !payload?.success || !payload?.data?.accessToken) {
    clearAuthSession();
    if (authFailureHandler) {
      authFailureHandler();
    }
    throw new ApiError("Session expired. Please log in again.", 401, payload);
  }

  updateAuthTokens(payload.data.accessToken, payload.data.refreshToken);
  return payload.data.accessToken;
}

async function ensureFreshToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest({
  path,
  method = "GET",
  params,
  body,
  requiresAuth = true,
  _retry = false,
}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new ApiError("You are not logged in.", 401, null);
    }
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponsePayload(response);

  if (response.status === 401 && requiresAuth && !_retry) {
    try {
      await ensureFreshToken();
      return apiRequest({
        path,
        method,
        params,
        body,
        requiresAuth,
        _retry: true,
      });
    } catch (error) {
      throw error;
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  if (payload && payload.success === false) {
    throw new ApiError(payload.message || "Request failed", response.status, payload);
  }

  return payload?.data !== undefined ? payload.data : payload;
}
