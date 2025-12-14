/**
 * API Types
 * Common types and interfaces used across all services for Delivery App
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User related types - specific to delivery persons
export interface User extends BaseEntity {
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  role: 'delivery_person' | 'admin' | 'super_admin';
  approved: boolean;
  status: 'active' | 'inactive' | 'deleted';
  area_id?: number;
  fcm_token?: string;
  unpaid_orders_count?: number;
  deleted_at?: string;
  refresh_token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  fcm_token?: string;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  role: 'delivery_person';
  fcm_token?: string;
}

export interface SignupResponse {
  message: string;
  user: User;
}

// Delivery-specific types (based on backend delivery service)
export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  address: string;
  timestamp: Date;
}

export interface DeliveryOrder {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address: string;
  area_id: number;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
  total_price: number;
  payment_status: 'pending' | 'paid' | 'unpaid';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id?: string;
  food_item_id?: number;
  food_name: string;
  food_description?: string;
  quantity: number;
  price: number;
  meal_type: 'veg' | 'non-veg' | 'other';
  special_instructions?: string;
}

export interface GetAreaOrdersRequest {
  area_id?: number;
  meal_time?: 'breakfast' | 'lunch' | 'dinner';
  date?: string; // Format: YYYY-MM-DD
  payment_status?: 'pending' | 'paid' | 'unpaid';
  timestamp?: string; // ISO timestamp for meal session determination
}

export interface UpdatePaymentStatusRequest {
  order_id: string;
  payment_status: 'pending' | 'paid' | 'unpaid';
}

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

// Common request/response types
export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Area/Location types (based on backend Area model)
export interface Area {
  area_id: number;
  area_name: string;
}

// Notification types
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushNotificationRequest {
  fcm_token: string;
  notification: NotificationPayload;
}
