import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth";
import { setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("taska_token");
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem("taska_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .getCurrentUser()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("taska_token"))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(credentials) {
    const { user, token } = await authApi.login(credentials);
    localStorage.setItem("taska_token", token);
    setUser(user);
    return user;
  }

  async function register(details) {
    const { user, token } = await authApi.register(details);
    localStorage.setItem("taska_token", token);
    setUser(user);
    return user;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
