/**
 * API Configuration
 * Centralized configuration for all API endpoints and settings
 */

import Constants from 'expo-constants';

// Reuse the LAN IP the device already reached Metro on, so a new DHCP lease
// doesn't strand the app on a stale host. In tunnel mode hostUri is an
// *.exp.direct name that only proxies Metro's port, so ignore anything
// that isn't a literal IP and fall back to loopback.
const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
const DEV_HOST = metroHost && /^\d{1,3}(\.\d{1,3}){3}$/.test(metroHost)
  ? metroHost
  : '127.0.0.1';

const serviceUrl = (port: number) => `http://${DEV_HOST}:${port}/api`;

export const API_CONFIG = {
  // Base URLs for different services
  BASE_URLS: {
    USER_SERVICE: serviceUrl(4001),
    ORDER_SERVICE: serviceUrl(4002),
    DELIVERY_SERVICE: serviceUrl(4003),
    LOCATION_SERVICE: serviceUrl(4004),
    MENU_SERVICE: serviceUrl(4005),
    PAYMENT_SERVICE: serviceUrl(4007),
  },
  
  // Common settings
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
  },
  
  // Delivery-specific settings
  DELIVERY: {
    ALLOWED_ROLES: ['delivery_person'],
    LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
    ORDER_REFRESH_INTERVAL: 10000, // 10 seconds
  },
} as const;

export type ServiceName = keyof typeof API_CONFIG.BASE_URLS;
