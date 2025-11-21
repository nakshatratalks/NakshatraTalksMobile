/**
 * Authentication Context
 * Manages global authentication state
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services';
import { User } from '../types/api.types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user is authenticated on app launch
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check authentication status
   */
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const authenticated = await authService.isAuthenticated();

      if (authenticated) {
        // Get current user from API
        try {
          const response = await authService.getCurrentUser();
          setUser(response.user);
          setIsAuthenticated(true);
        } catch (error: any) {
          // If token is invalid or expired (401), clear it
          if (error?.response?.status === 401) {
            await authService.logout();
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send OTP to phone number
   * @param phone - Phone number in E.164 format
   */
  const sendOTP = async (phone: string) => {
    await authService.sendOtp(phone);
  };

  /**
   * Login user with OTP
   * @param phone - Phone number
   * @param otp - OTP code
   */
  const login = async (phone: string, otp: string) => {
    try {
      const response = await authService.verifyOtp(phone, otp);

      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('OTP verification failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        sendOTP,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use Auth Context
 * @returns AuthContextType
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
