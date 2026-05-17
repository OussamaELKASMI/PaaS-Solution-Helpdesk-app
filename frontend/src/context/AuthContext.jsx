import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, loginRequest, registerRequest } from "../lib/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "mini-helpdesk-token";
const USER_KEY = "mini-helpdesk-user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  });

  useEffect(() => {
    async function syncCurrentUser() {
      if (!token) {
        return;
      }

      try {
        const currentUser = await getCurrentUser(token);
        setUser(currentUser);
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    syncCurrentUser();
  }, [token]);

  async function login(credentials) {
    const response = await loginRequest(credentials);
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response.user;
  }

  async function register(data) {
    await registerRequest(data);
    return login({ email: data.email, password: data.password });
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      register,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
