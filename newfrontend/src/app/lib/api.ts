import { clearAuthSession, getAccessToken, getRefreshToken, setAuthSession } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const root = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${root}${p}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function parseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    throw new ApiError("Session expired. Please login again.", 401);
  }

  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = (await parseBody(response)) as ApiResponse<{
    userId: number;
    fullName: string;
    email: string;
    role: string;
    accessToken: string;
    refreshToken: string;
  }> | null;

  if (!response.ok || !payload?.success || !payload.data?.accessToken) {
    clearAuthSession();
    throw new ApiError("Session expired. Please login again.", 401, payload);
  }

  const current = getAuthSessionSafe();
  if (!current) {
    throw new ApiError("Session expired. Please login again.", 401, payload);
  }

  setAuthSession({
    ...current,
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
  });

  return payload.data.accessToken;
}

function getAuthSessionSafe() {
  try {
    const raw = localStorage.getItem("wealth_advisor_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function withRefreshToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RequestOptions = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  auth?: boolean;
  retry?: boolean;
};

export async function apiRequest<T>({
  path,
  method = "GET",
  body,
  params,
  auth = true,
  retry = false,
}: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new ApiError("Not authenticated. Please login.", 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await parseBody(response)) as ApiResponse<T> | null;

  if (response.status === 401 && auth && !retry) {
    await withRefreshToken();
    return apiRequest<T>({ path, method, body, params, auth, retry: true });
  }

  if (!response.ok) {
    throw new ApiError(payload?.message || "Request failed", response.status, payload);
  }

  if (payload && payload.success === false) {
    throw new ApiError(payload.message || "Request failed", response.status, payload);
  }

  return (payload?.data ?? payload) as T;
}
