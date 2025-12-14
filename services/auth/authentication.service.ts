/**
 * Authentication Service for Delivery App
 * Handles user authentication, token management, and user state
 * Specifically designed for delivery personnel with role validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserApiClient } from '../clients/user-api.client';
import { API_CONFIG } from '../config/api.config';
import {
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    SignupRequest,
    SignupResponse,
    User
} from '../types/api.types';
import { ErrorUtils } from '../utils/error.utils';
import { TokenUtils } from '../utils/token.utils';

export class AuthenticationService {
  private userApiClient: UserApiClient;
  private currentUser: User | null = null;

  constructor() {
    this.userApiClient = new UserApiClient();
  }

  /**
   * Login user - validates delivery_person role
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login for delivery personnel...');
      
      const response = await this.userApiClient.login(credentials);
      
      // Additional role validation (already done in API client, but double-check)
      if (response.user.role !== 'delivery_person') {
        throw new Error('Only delivery personnel are allowed to access this application');
      }
      
      // Save tokens and user data
      await this.saveUserSession(response);
      
      console.log('✅ Login successful for delivery personnel:', response.user.full_name);
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Handle specific delivery app errors
      if (ErrorUtils.isRoleError(error) || ErrorUtils.isForbiddenError(error)) {
        throw new Error('Only delivery personnel are allowed to access this application');
      }
      
      if (ErrorUtils.isApprovalError(error)) {
        throw new Error('Your account is pending approval. Please contact support');
      }
      
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Signup user - only for delivery_person role
   */
  async signup(userData: SignupRequest): Promise<SignupResponse> {
    try {
      console.log('📝 Attempting signup for delivery personnel...');
      
      // Ensure role is delivery_person
      const deliveryUserData: SignupRequest = {
        ...userData,
        role: 'delivery_person',
      };
      
      const response = await this.userApiClient.signup(deliveryUserData);
      
      console.log('✅ Signup successful for delivery personnel:', response.user.full_name);
      console.log('⏳ Account pending approval - please wait for admin approval');
      
      return response;
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Logging out delivery personnel...');
      
      // Call logout API if user is authenticated
      if (await this.isAuthenticated()) {
        await this.userApiClient.logout();
      }
    } catch (error) {
      console.error('⚠️ Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local session regardless of API call result
      await this.clearUserSession();
      console.log('✅ Logout completed');
    }
  }

  /**
   * Check if user is authenticated and has delivery_person role
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const isAuth = await TokenUtils.isAuthenticated();
      if (!isAuth) return false;
      
      // Additional check: verify user role from token
      const isDeliveryPerson = await TokenUtils.isDeliveryPerson();
      if (!isDeliveryPerson) {
        console.log('⚠️ User does not have delivery_person role, clearing session');
        await this.clearUserSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Return cached user if available
      if (this.currentUser) {
        return this.currentUser;
      }

      // Check if user is authenticated
      if (!(await this.isAuthenticated())) {
        return null;
      }

      // Fetch user from storage
      const userData = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const user = JSON.parse(userData);
        
        // Validate user role
        if (user.role !== 'delivery_person') {
          console.log('⚠️ Stored user does not have delivery_person role, clearing session');
          await this.clearUserSession();
          return null;
        }
        
        this.currentUser = user;
        return this.currentUser;
      }

      // If not in storage, fetch from API
      const user = await this.userApiClient.getProfile();
      this.currentUser = user;
      await this.saveUserData(user);
      
      return user;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      
      // If role error, clear session
      if (ErrorUtils.isRoleError(error) || ErrorUtils.isForbiddenError(error)) {
        await this.clearUserSession();
      }
      
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await TokenUtils.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await this.userApiClient.refreshToken({ refresh_token: refreshToken });
      
      // Save new tokens
      await TokenUtils.saveTokens(response.access_token, response.refresh_token || refreshToken);
      
      console.log('🔄 Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // Clear session if refresh fails
      await this.clearUserSession();
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const updatedUser = await this.userApiClient.updateProfile(userData);
      this.currentUser = updatedUser;
      await this.saveUserData(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const data: ChangePasswordRequest = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      await this.userApiClient.changePassword(data);
      console.log('✅ Password changed successfully');
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await this.userApiClient.forgotPassword({ email });
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Forgot password failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.userApiClient.resetPassword({ token, new_password: newPassword });
      console.log('✅ Password reset successful');
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    try {
      await this.userApiClient.deleteAccount();
      await this.clearUserSession();
      console.log('✅ Account deleted successfully');
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFcmToken(fcmToken: string): Promise<void> {
    try {
      await this.userApiClient.updateFcmToken(fcmToken);
      
      // Update current user data
      if (this.currentUser) {
        this.currentUser.fcm_token = fcmToken;
        await this.saveUserData(this.currentUser);
      }
      
      console.log('✅ FCM token updated successfully');
    } catch (error) {
      console.error('❌ FCM token update failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Save user session (tokens + user data)
   */
  private async saveUserSession(loginResponse: LoginResponse): Promise<void> {
    try {
      await Promise.all([
        TokenUtils.saveTokens(loginResponse.access_token, loginResponse.refresh_token),
        this.saveUserData(loginResponse.user),
      ]);
      
      this.currentUser = loginResponse.user;
    } catch (error) {
      console.error('❌ Error saving user session:', error);
      throw error;
    }
  }

  /**
   * Save user data to storage
   */
  private async saveUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('❌ Error saving user data:', error);
      throw error;
    }
  }

  /**
   * Clear user session (tokens + user data)
   */
  private async clearUserSession(): Promise<void> {
    try {
      await Promise.all([
        TokenUtils.clearTokens(),
        AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA),
      ]);
      
      this.currentUser = null;
    } catch (error) {
      console.error('❌ Error clearing user session:', error);
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    return await TokenUtils.getAccessToken();
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return await TokenUtils.getRefreshToken();
  }
}
