import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('tripnest_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('tripnest_token') || null);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState('Checking...');

  useEffect(() => {
    let isCancelled = false;
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (isCancelled) return;
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('tripnest_user', JSON.stringify(res.user));
            if (res.databaseMode) {
              setDbMode(res.databaseMode.mode === 'mongodb' ? 'MongoDB' : 'Local Data Engine');
            }
          }
        } catch (err) {
          if (isCancelled) return;
          const msg = (err.message || '').toLowerCase();
          // ONLY force logout if the token is definitely rejected by server (401, 403, invalid token)
          // If it's a network glitch, timeout, or Render server spinning up, keep the user logged in!
          if (msg.includes('401') || msg.includes('403') || msg.includes('expired') || msg.includes('no token')) {
            console.warn('Session expired or invalid, signing out:', err.message);
            handleLogout();
          } else {
            console.warn('Backend waking up or network pause, maintaining session:', err.message);
          }
        }
      } else {
        // Check health to know DB mode even when logged out
        api.checkHealth()
          .then((h) => {
            if (!isCancelled && h.database) {
              setDbMode(h.database.mode === 'mongodb' ? 'MongoDB' : 'Local Data Engine');
            }
          })
          .catch(() => {});
      }
      if (!isCancelled) setLoading(false);
    }
    loadUser();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleLogin = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('tripnest_token', res.token);
      if (res.user) {
        localStorage.setItem('tripnest_user', JSON.stringify(res.user));
        setUser(res.user);
      }
      setToken(res.token);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const handleSignup = async (userData) => {
    const res = await api.signup(userData);
    if (res.success && res.token) {
      localStorage.setItem('tripnest_token', res.token);
      if (res.user) {
        localStorage.setItem('tripnest_user', JSON.stringify(res.user));
        setUser(res.user);
      }
      setToken(res.token);
      return res;
    }
    throw new Error(res.message || 'Signup failed');
  };

  const handleDemoLogin = async () => {
    const res = await api.demoLogin();
    if (res.success && res.token) {
      localStorage.setItem('tripnest_token', res.token);
      if (res.user) {
        localStorage.setItem('tripnest_user', JSON.stringify(res.user));
        setUser(res.user);
      }
      setToken(res.token);
      return res;
    }
    throw new Error(res.message || 'Demo login failed');
  };

  const handleLogout = () => {
    localStorage.removeItem('tripnest_token');
    localStorage.removeItem('tripnest_user');
    localStorage.removeItem('tripnest_friends');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        dbMode,
        login: handleLogin,
        signup: handleSignup,
        demoLogin: handleDemoLogin,
        logout: handleLogout,
        refreshUser: async () => {
          if (token) {
            const res = await api.getMe();
            if (res.user) setUser(res.user);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
