import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tripnest_token') || null);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState('Checking...');

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            if (res.databaseMode) {
              setDbMode(res.databaseMode.mode === 'mongodb' ? 'MongoDB' : 'Local Data Engine');
            }
          } else {
            handleLogout();
          }
        } catch (err) {
          console.warn('Session verification failed, signing out:', err.message);
          handleLogout();
        }
      } else {
        // Check health to know DB mode even when logged out
        api.checkHealth()
          .then((h) => {
            if (h.database) {
              setDbMode(h.database.mode === 'mongodb' ? 'MongoDB' : 'Local Data Engine');
            }
          })
          .catch(() => {});
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const handleLogin = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('tripnest_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const handleSignup = async (userData) => {
    const res = await api.signup(userData);
    if (res.success && res.token) {
      localStorage.setItem('tripnest_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Signup failed');
  };

  const handleDemoLogin = async () => {
    const res = await api.demoLogin();
    if (res.success && res.token) {
      localStorage.setItem('tripnest_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Demo login failed');
  };

  const handleLogout = () => {
    localStorage.removeItem('tripnest_token');
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
