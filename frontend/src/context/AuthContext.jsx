import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAuthSession, getAuthSession, setAuthSession } from "../lib/authStorage";
import { setAuthFailureHandler } from "../lib/httpClient";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getAuthSession());

  useEffect(() => {
    setAuthFailureHandler(() => {
      setSession(null);
    });

    return () => {
      setAuthFailureHandler(null);
    };
  }, []);

  const persistAuth = (authResponse) => {
    const nextSession = {
      user: {
        userId: authResponse.userId,
        fullName: authResponse.fullName,
        email: authResponse.email,
        role: authResponse.role,
      },
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    };

    setAuthSession(nextSession);
    setSession(nextSession);
    return nextSession;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    persistAuth(data);
    return data;
  };

  const login = async (payload) => {
    const data = await authService.login(payload);
    persistAuth(data);
    return data;
  };

  const logout = async () => {
    try {
      const refreshToken = session?.refreshToken;
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch {
    } finally {
      clearAuthSession();
      setSession(null);
    }
  };

  const value = useMemo(
    () => ({
      user: session?.user || null,
      accessToken: session?.accessToken || "",
      isAuthenticated: Boolean(session?.accessToken),
      register,
      login,
      logout,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
