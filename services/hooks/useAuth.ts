/**
 * useAuth Hook
 * React hook for authentication state management in delivery app
 */

import { useCallback, useEffect, useState } from 'react';
import { AuthenticationService } from '../auth/authentication.service';
import { LoginRequest, SignupRequest, User } from '../types/api.types';
import { ErrorUtils } from '../utils/error.utils';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const authService = new AuthenticationService();

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        setAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      });
    }
  };

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.login(credentials);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ Login failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      }));
      throw error;
    }
  }, [authService]);

  const signup = useCallback(async (userData: SignupRequest) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await authService.signup(userData);
      
      // After signup, user needs approval, so don't authenticate yet
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ Signup failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      }));
      throw error;
    }
  }, [authService]);

  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await authService.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      });
    }
  }, [authService]);

  const refreshUser = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const user = await authService.getCurrentUser();
      
      setAuthState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ Refresh user failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      });
    }
  }, [authService]);

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const updatedUser = await authService.updateProfile(userData);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      }));
      throw error;
    }
  }, [authService]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await authService.changePassword(currentPassword, newPassword);
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('❌ Password change failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      }));
      throw error;
    }
  }, [authService]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    signup,
    logout,
    refreshUser,
    clearError,
    updateProfile,
    changePassword,
  };
}
