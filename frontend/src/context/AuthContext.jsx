import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('access_token', data.access_token);
    setToken(data.access_token);
  }, []);

  const signup = useCallback(async (email, password) => {
    await api.signup(email, password);
    await login(email, password); // sign up, then log straight in
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setToken(null);
  }, []);

  const value = { token, isAuthenticated: Boolean(token), login, signup, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
