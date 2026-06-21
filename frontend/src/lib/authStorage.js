const STORAGE_KEY = "wa_auth_session";

export function getAuthSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setAuthSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken() {
  return getAuthSession()?.accessToken || "";
}

export function getRefreshToken() {
  return getAuthSession()?.refreshToken || "";
}

export function updateAuthTokens(accessToken, refreshToken) {
  const session = getAuthSession();
  if (!session) {
    return;
  }

  setAuthSession({
    ...session,
    accessToken: accessToken || session.accessToken,
    refreshToken: refreshToken || session.refreshToken,
  });
}
