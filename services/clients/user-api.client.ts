/**
 * User API Client
 * Handles all user-related API calls for delivery personnel
 */

import {
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    User,
} from '../types/api.types';
import { BaseApiClient } from './base-api.client';

export class UserApiClient extends BaseApiClient {
  constructor() {
    super('USER_SERVICE');
  }

  /**
   * User login - validates delivery_person role
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/users/login', credentials);
    
    // Validate role after successful login
    if (response.data.user.role !== 'delivery_person') {
      throw new Error('Only delivery personnel are allowed to access this application');
    }
    
    // Check if account is approved
    if (!response.data.user.approved) {
      throw new Error('Your account is pending approval. Please contact support');
    }
    
    // Check if account is active
    if (response.data.user.status === 'deleted') {
      throw new Error('Your account has been deleted. Please contact support');
    }
    
    return response.data;
  }

  /**
   * User signup - only for delivery_person role
   */
  async signup(userData: SignupRequest): Promise<SignupResponse> {
    // Ensure role is set to delivery_person
    const deliveryUserData = {
      ...userData,
      role: 'delivery_person' as const,
    };
    
    const response = await this.post<SignupResponse>('/users/signup', deliveryUserData);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await this.get<User>('/users/profile');
    
    // Validate user is still a delivery person
    if (response.data.role !== 'delivery_person') {
      throw new Error('Access denied: Invalid user role');
    }
    
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    // Prevent role changes
    const { role, ...updateData } = userData;
    
    const response = await this.put<User>('/users/profile', updateData);
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/users/change-password', data);
    return response.data;
  }

  /**
   * Forgot password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/users/forgot-password', data);
    return response.data;
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/users/reset-password', data);
    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.post<RefreshTokenResponse>('/users/refresh-token', data);
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/users/logout');
    return response.data;
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>('/users/account');
    return response.data;
  }

  /**
   * Get user by ID (for internal service calls)
   */
  async getUserById(userId: string): Promise<User> {
    const response = await this.get<User>(`/users/${userId}`);
    return response.data;
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFcmToken(fcmToken: string): Promise<{ message: string }> {
    const response = await this.put<{ message: string }>('/users/fcm-token', { fcm_token: fcmToken });
    return response.data;
  }
}
