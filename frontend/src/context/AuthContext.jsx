import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('spotly_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore authenticated session on mount if token is stored
  const restoreSession = useCallback(async () => {
    const savedToken = localStorage.getItem('spotly_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getMe();
      if (data?.user) {
        setUser(data.user);
        setAuthError(null);
      } else {
        // Invalid response, clear session
        localStorage.removeItem('spotly_token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.warn('Session restoration failed:', error.response?.data?.message || error.message);
      localStorage.removeItem('spotly_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen for global auth expired events triggered by API interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('spotly_token');
    };

    window.addEventListener('spotly_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('spotly_auth_expired', handleAuthExpired);
  }, [restoreSession]);

  /**
   * Log in user
   */
  const login = async (credentials) => {
    setAuthError(null);
    try {
      const data = await apiLogin(credentials);
      if (data.token && data.user) {
        localStorage.setItem('spotly_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error('Invalid authentication response from server.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    setAuthError(null);
    try {
      const data = await apiRegister(userData);
      if (data.token && data.user) {
        localStorage.setItem('spotly_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error('Invalid registration response from server.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Log out user
   */
  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('spotly_token');
      setToken(null);
      setUser(null);
      setAuthError(null);
    }
  };

  /**
   * Update local user state after profile edits
   */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateUser,
    refreshSession: restoreSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
