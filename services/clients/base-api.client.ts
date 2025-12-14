/**
 * Base API Client
 * Provides common functionality for all service-specific API clients
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, ServiceName } from '../config/api.config';
import { ApiResponse } from '../types/api.types';
import { ErrorUtils } from '../utils/error.utils';
import { TokenUtils } from '../utils/token.utils';

export class BaseApiClient {
  protected client: AxiosInstance;
  protected serviceName: ServiceName;

  constructor(serviceName: ServiceName, customConfig?: AxiosRequestConfig) {
    this.serviceName = serviceName;
    this.client = this.createClient(customConfig);
    this.setupInterceptors();
  }

  /**
   * Create axios instance with base configuration
   */
  private createClient(customConfig?: AxiosRequestConfig): AxiosInstance {
    const baseURL = API_CONFIG.BASE_URLS[this.serviceName];
    
    return axios.create({
      baseURL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
      ...customConfig,
    });
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Setup request interceptor for authentication
   */
  private setupRequestInterceptor(): void {
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Add authentication token if available
          const token = await TokenUtils.getAccessToken();
          if (token && !TokenUtils.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`🔐 [${this.serviceName}] Request authenticated`);
          } else if (token) {
            // Token is expired, remove it
            console.log(`⏰ [${this.serviceName}] Token expired, removing from storage`);
            await TokenUtils.removeAccessToken();
          }
        } catch (error) {
          console.error(`❌ [${this.serviceName}] Error in request interceptor:`, error);
        }
        
        console.log(`🚀 [${this.serviceName}] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error(`❌ [${this.serviceName}] Request interceptor error:`, error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup response interceptor for error handling
   */
  private setupResponseInterceptor(): void {
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ [${this.serviceName}] Response received:`, response.status);
        return response;
      },
      async (error: AxiosError) => {
        const apiError = ErrorUtils.createApiError(error);
        
        console.error(`❌ [${this.serviceName}] API Error:`, {
          status: apiError.status,
          message: apiError.message,
          code: apiError.code,
        });

        // Handle specific error cases
        if (ErrorUtils.isAuthError(error)) {
          console.log(`🔐 [${this.serviceName}] Authentication error, clearing tokens`);
          await TokenUtils.clearTokens();
        }

        // Handle role-based errors for delivery app
        if (ErrorUtils.isRoleError(error)) {
          console.log(`👤 [${this.serviceName}] Role-based access error`);
          // Could trigger navigation to error screen or logout
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Make a GET request
   */
  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Make a POST request
   */
  protected async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Make a PUT request
   */
  protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Make a PATCH request
   */
  protected async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Format response to standard API response format
   */
  private formatResponse<T>(response: AxiosResponse): ApiResponse<T> {
    return {
      success: true,
      data: response.data,
      message: response.data?.message,
    };
  }

  /**
   * Get the underlying axios instance (for advanced usage)
   */
  public getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}
