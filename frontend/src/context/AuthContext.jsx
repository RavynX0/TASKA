import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth";
import { setUnauthorizedHandler } from "../api/client";
import { setStoredToken, clearStoredToken } from "../utils/tokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("taska_token");
    clearStoredToken().catch(() => {});
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
    setStoredToken(token).catch(() => {});
    authApi
      .getCurrentUser()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("taska_token"))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(credentials) {
    const { user, token } = await authApi.login(credentials);
    localStorage.setItem("taska_token", token);
    setStoredToken(token).catch(() => {});
    setUser(user);
    return user;
  }

  async function updateNotificationPreferences(patch) {
    const updated = await authApi.updateNotificationPreferences(patch);
    setUser(updated);
    return updated;
  }

  // Registration no longer starts a session - it just kicks off email
  // verification. The caller routes the user to the Verify Email screen.
  async function register(details) {
    return authApi.register(details);
  }

  async function verifyEmail({ email, code }) {
    const { user, token } = await authApi.verifyEmail({ email, code });
    localStorage.setItem("taska_token", token);
    setStoredToken(token).catch(() => {});
    setUser(user);
    return user;
  }

  async function resendVerification(email) {
    return authApi.resendVerification(email);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        verifyEmail,
        resendVerification,
        logout,
        updateNotificationPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
