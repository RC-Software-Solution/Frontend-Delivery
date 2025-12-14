/**
 * Services Index
 * Main entry point for all services in the delivery app
 */

// Export configuration
export { API_CONFIG } from './config/api.config';
export type { ServiceName } from './config/api.config';

// Export types
export * from './types/api.types';

// Export utilities
export { ErrorUtils } from './utils/error.utils';
export { TokenUtils } from './utils/token.utils';

// Export API clients
export { BaseApiClient } from './clients/base-api.client';
export { DeliveryApiClient } from './clients/delivery-api.client';
export { LocationApiClient } from './clients/location-api.client';
export { UserApiClient } from './clients/user-api.client';

// Export services
export { AuthenticationService } from './auth/authentication.service';
export { DeliveryService } from './delivery/delivery.service';
export { LocationService } from './location/location.service';

// Export hooks
export { useAuth } from './hooks/useAuth';
export { useLocation } from './hooks/useLocation';

// Create singleton instances for easy use
import { AuthenticationService } from './auth/authentication.service';
import { DeliveryService } from './delivery/delivery.service';
import { LocationService } from './location/location.service';

// Singleton instances
export const authService = new AuthenticationService();
export const deliveryService = new DeliveryService();
export const locationService = new LocationService();

// Legacy API client for backward compatibility (if needed)
import axios from 'axios';
import { API_CONFIG } from './config/api.config';

export const legacyApi = axios.create({
  baseURL: API_CONFIG.BASE_URLS.USER_SERVICE,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Export commonly used error messages for delivery app
export const DELIVERY_ERROR_MESSAGES = {
  ROLE_NOT_ALLOWED: 'Only delivery personnel are allowed to access this application',
  ACCOUNT_PENDING: 'Your account is pending approval. Please contact support',
  ACCOUNT_DELETED: 'Your account has been deleted. Please contact support',
  NETWORK_ERROR: 'Please check your internet connection and try again',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
} as const;
