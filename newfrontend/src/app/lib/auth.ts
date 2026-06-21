export type AuthUser = {
  userId: number;
  fullName: string;
  email: string;
  role: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const AUTH_KEY = "wealth_advisor_auth";

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function setAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  const session = getAuthSession();
  return Boolean(session?.accessToken);
}

export function getAccessToken() {
  return getAuthSession()?.accessToken || "";
}

export function getRefreshToken() {
  return getAuthSession()?.refreshToken || "";
}
