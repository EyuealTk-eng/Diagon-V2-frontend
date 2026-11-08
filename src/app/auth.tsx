import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, tokens } from "../services/api";
import type { Me } from "../types/api";

interface AuthState {
  user: Me | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<Me>;
  logout: () => void;
  reload: () => Promise<void>;
  setUser: (user: Me) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (!tokens.access && !tokens.refresh) {
      setUser(null);
      return;
    }
    try {
      setUser(await api<Me>("/users/me/"));
    } catch {
      tokens.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    reload().finally(() => setReady(true));
  }, [reload]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ access: string; refresh: string }>("/auth/login/", {
      method: "POST",
      body: { email, password },
    });
    tokens.set(data.access, data.refresh);
    const me = await api<Me>("/users/me/");
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    tokens.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout, reload, setUser }), [user, ready, login, logout, reload]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
