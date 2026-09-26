"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthResponse,
  AuthUser,
  login as apiLogin,
  logout as apiLogout,
  me as apiMe,
  refresh as apiRefresh,
  register as apiRegister,
} from "@/lib/api";
import {
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "@/lib/auth-storage";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) => Promise<void>;
  applySession: (result: AuthResponse) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function storeSession(result: AuthResponse) {
  setToken(result.accessToken);
  if (result.refreshToken) {
    setRefreshToken(result.refreshToken);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((result: AuthResponse) => {
    storeSession(result);
    setUser(result.user);
    setTokenState(result.accessToken);
  }, []);

  const refresh = useCallback(async () => {
    const existing = getToken();
    const refreshToken = getRefreshToken();

    if (!existing && !refreshToken) {
      setUser(null);
      setTokenState(null);
      setLoading(false);
      return;
    }

    try {
      if (existing) {
        const profile = await apiMe(existing);
        setUser(profile);
        setTokenState(existing);
        return;
      }
    } catch {
      // fall through to refresh token
    }

    if (!refreshToken) {
      clearToken();
      setUser(null);
      setTokenState(null);
      return;
    }

    try {
      const result = await apiRefresh(refreshToken);
      applySession(result);
    } catch {
      clearToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiLogin({ email, password });
      applySession(result);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
    }) => {
      const result = await apiRegister(input);
      applySession(result);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch {
        // ignore network errors on logout
      }
    }
    clearToken();
    setUser(null);
    setTokenState(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      applySession,
      logout,
      refresh,
    }),
    [user, token, loading, login, register, applySession, logout, refresh],
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
