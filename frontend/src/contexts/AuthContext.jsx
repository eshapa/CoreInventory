import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from local storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validate session integrity to prevent crashes from stale data
        if (!parsedUser || !parsedUser.id || !parsedUser.role) {
          throw new Error('Malformed session data');
        }
        setToken(storedToken);
        setUser(parsedUser);
      } catch (err) {
        console.error('Session initialization failed:', err);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', { email, password });
      
      // Backend returns: { success, message, data: { user, accessToken } }
      const { accessToken, user: userData } = res.data.data;
      
      setToken(accessToken);
      setUser(userData);
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success('Successfully logged in');
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to login. Please try again.';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateContextUser = (userData) => {
    // If userData is a nested object from backend { user: {...} }, extract it
    const updatedUser = userData?.user ? { ...user, ...userData.user } : { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateContextUser,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground font-medium animate-pulse">Initializing system...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
