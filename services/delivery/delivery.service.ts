/**
 * Delivery Service
 * Handles delivery and order-related operations for delivery app
 */

import { DeliveryApiClient } from '../clients/delivery-api.client';
import { DeliveryOrder, GetAreaOrdersRequest } from '../types/api.types';
import { ErrorUtils } from '../utils/error.utils';

export class DeliveryService {
  private deliveryApiClient: DeliveryApiClient;
  private cachedOrders: Map<string, { orders: DeliveryOrder[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for orders (shorter cache)

  constructor() {
    this.deliveryApiClient = new DeliveryApiClient();
  }

  /**
   * Get orders for a specific area with caching
   */
  async getAreaOrders(params: GetAreaOrdersRequest): Promise<{
    message: string;
    area_id: number;
    meal_time: string;
    date: string;
    payment_status: string;
    orders: DeliveryOrder[];
    total: number;
  }> {
    try {
      console.log('🚚 Fetching area orders...', params);

      // Create cache key
      const cacheKey = JSON.stringify(params);
      const cached = this.cachedOrders.get(cacheKey);
      const now = Date.now();

      // Check if we have cached data and it's still valid
      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        console.log('✅ Returning cached orders');
        return {
          message: 'Orders retrieved successfully (cached)',
          area_id: params.area_id || 0,
          meal_time: params.meal_time || 'all',
          date: params.date || 'today',
          payment_status: params.payment_status || 'pending',
          orders: cached.orders,
          total: cached.orders.length,
        };
      }

      // Fetch fresh data from API
      const response = await this.deliveryApiClient.getAreaOrders(params);
      
      console.log('🔍 Raw API response:', {
        hasOrders: !!response.orders,
        ordersType: typeof response.orders,
        isArray: Array.isArray(response.orders),
        ordersLength: response.orders?.length,
        responseKeys: Object.keys(response || {}),
      });
      
      // Log first order structure if available
      if (response.orders && response.orders.length > 0) {
        console.log('🔍 First order structure:', JSON.stringify(response.orders[0], null, 2));
      }
      
      // Ensure orders is always an array
      const ordersArray = Array.isArray(response.orders) ? response.orders : [];

      // Normalize backend payload to UI-friendly shape
      const normalizedOrders = ordersArray.map((raw: any) => {
        const rawItems = Array.isArray(raw.items)
          ? raw.items
          : (Array.isArray(raw.order_items) ? raw.order_items : []);

        const items = rawItems.map((ri: any) => ({
          food_name: ri.food_name ?? ri.name ?? ri.item_name ?? '',
          quantity: typeof ri.quantity === 'number' ? ri.quantity : Number(ri.quantity || 0),
          meal_type: ri.meal_type ?? ri.mealTime ?? raw.meal_type ?? raw.meal_time ?? 'unknown',
        }));

        const orderId = raw.order_id ?? raw.id ?? raw.orderId ?? raw.orderId ?? '';
        const customerName = raw.customer_name ?? raw.customerName ?? raw.customer_full_name ?? raw.customer?.full_name ?? raw.customer?.name ?? raw.user?.full_name ?? raw.user?.name ?? '';
        const customerAddress = raw.customer_address ?? raw.customerAddress ?? raw.address ?? raw.customer?.address ?? raw.user?.address ?? raw.delivery_address ?? '';
        const mealTime = raw.meal_time ?? raw.meal_type ?? raw.mealTime ?? raw.mealTime ?? '';
        const totalPrice = typeof raw.total_price === 'number' ? raw.total_price : Number(raw.total_price || raw.total || raw.totalAmount || raw.amount || 0);
        const paymentStatus = raw.payment_status ?? raw.paymentStatus ?? raw.paymentStatus ?? 'pending';

        return {
          ...raw,
          order_id: orderId,
          customer_name: customerName,
          customer_address: customerAddress,
          meal_time: mealTime,
          total_price: totalPrice,
          payment_status: paymentStatus,
          items,
        };
      });

      const safeResponse = {
        ...response,
        orders: normalizedOrders,
        total: normalizedOrders.length,
      };
      
      // Cache the results
      this.cachedOrders.set(cacheKey, {
        orders: normalizedOrders,
        timestamp: now,
      });

      if (normalizedOrders[0]) {
        console.log('🧪 Sample normalized order keys:', Object.keys(normalizedOrders[0]));
        console.log('🧪 Sample normalized order data:', {
          order_id: normalizedOrders[0].order_id,
          customer_name: normalizedOrders[0].customer_name,
          customer_address: normalizedOrders[0].customer_address,
          meal_time: normalizedOrders[0].meal_time,
          total_price: normalizedOrders[0].total_price,
          payment_status: normalizedOrders[0].payment_status,
          items: normalizedOrders[0].items
        });
      }
      console.log(`✅ Fetched ${normalizedOrders.length} orders from API`);
      return safeResponse;
    } catch (error) {
      console.error('❌ Failed to fetch area orders:', error);
      
      // Return cached data if available, even if expired
      const cacheKey = JSON.stringify(params);
      const cached = this.cachedOrders.get(cacheKey);
      if (cached) {
        console.log('⚠️ Returning expired cached orders due to API error');
        return {
          message: 'Orders retrieved successfully (cached - expired)',
          area_id: params.area_id || 0,
          meal_time: params.meal_time || 'all',
          date: params.date || 'today',
          payment_status: params.payment_status || 'pending',
          orders: cached.orders,
          total: cached.orders.length,
        };
      }
      
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get orders for delivery person's assigned area
   */
  async getMyAreaOrders(): Promise<{
    message: string;
    area_id: number;
    orders: DeliveryOrder[];
    total: number;
  }> {
    try {
      console.log('🚚 Fetching my area orders...');
      
      const response = await this.deliveryApiClient.getMyAreaOrders();
      
      // Ensure orders is always an array
      const ordersArray = Array.isArray(response.orders) ? response.orders : [];
      const safeResponse = {
        ...response,
        orders: ordersArray,
        total: ordersArray.length,
      };
      
      console.log(`✅ Fetched ${ordersArray.length} orders for my area`);
      return safeResponse;
    } catch (error) {
      console.error('❌ Failed to fetch my area orders:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Update payment status of an order
   */
  async updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'unpaid'): Promise<{
    message: string;
    order_id: string;
    payment_status: string;
    result: any;
  }> {
    try {
      console.log(`🚚 Updating payment status for order ${orderId} to ${paymentStatus}`);
      console.log(`🔍 Order ID type: ${typeof orderId}, length: ${orderId?.length}`);
      console.log(`🔍 Payment status type: ${typeof paymentStatus}`);
      
      const response = await this.deliveryApiClient.updatePaymentStatus(orderId, paymentStatus);
      
      // Clear cache to force refresh on next fetch
      this.clearCache();
      
      console.log(`✅ Updated payment status for order ${orderId}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to update payment status for order ${orderId}:`, error);
      console.error(`❌ Error details:`, JSON.stringify(error, null, 2));
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Refresh orders cache
   */
  async refreshAreaOrders(params: GetAreaOrdersRequest): Promise<{
    message: string;
    area_id: number;
    meal_time: string;
    date: string;
    payment_status: string;
    orders: DeliveryOrder[];
    total: number;
  }> {
    console.log('🔄 Refreshing area orders cache...');
    const cacheKey = JSON.stringify(params);
    this.cachedOrders.delete(cacheKey);
    return await this.getAreaOrders(params);
  }

  /**
   * Clear orders cache
   */
  clearCache(): void {
    console.log('🗑️ Clearing orders cache');
    this.cachedOrders.clear();
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Get current meal time based on time of day
   */
  getCurrentMealTime(): 'breakfast' | 'lunch' | 'dinner' {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 6 && hour < 11) {
      return 'breakfast';
    } else if (hour >= 11 && hour < 16) {
      return 'lunch';
    } else {
      return 'dinner';
    }
  }

  /**
   * Get all pending orders for the area (regardless of meal time or date)
   */
  async getTodaysOrders(areaId: number): Promise<{
    message: string;
    area_id: number;
    meal_time: string;
    date: string;
    payment_status: string;
    orders: DeliveryOrder[];
    total: number;
  }> {
    // Get all pending orders for the area (no meal_time or date filtering)
    const params: GetAreaOrdersRequest = {
      area_id: areaId,
      payment_status: 'pending',
      // Don't send meal_time or date to get all pending orders
    };

    const response = await this.getAreaOrders(params);
    
    // Return all pending orders without filtering
    return {
      ...response,
      orders: response.orders,
      total: response.orders.length,
      meal_time: 'all',
    };
  }

  /**
   * Get orders for a specific timestamp (for testing meal session logic)
   */
  async getOrdersForTimestamp(areaId: number, timestamp: string): Promise<{
    message: string;
    area_id: number;
    meal_time: string;
    date: string;
    payment_status: string;
    orders: DeliveryOrder[];
    total: number;
  }> {
    // Determine meal time from timestamp
    const date = new Date(timestamp);
    const hour = date.getHours();
    let mealTime: 'breakfast' | 'lunch' | 'dinner';
    
    if (hour >= 6 && hour < 11) {
      mealTime = 'breakfast';
    } else if (hour >= 11 && hour < 16) {
      mealTime = 'lunch';
    } else {
      mealTime = 'dinner';
    }

    const params: GetAreaOrdersRequest = {
      area_id: areaId,
      meal_time: mealTime, // Send determined meal time
      date: date.toISOString().split('T')[0], // Extract date from timestamp
      payment_status: 'pending',
    };

    return await this.getAreaOrders(params);
  }

  /**
   * Check if orders cache is valid for given parameters
   */
  isCacheValid(params: GetAreaOrdersRequest): boolean {
    const cacheKey = JSON.stringify(params);
    const cached = this.cachedOrders.get(cacheKey);
    const now = Date.now();
    return cached !== undefined && (now - cached.timestamp) < this.CACHE_DURATION;
  }

  /**
   * Get cached orders (without API call)
   */
  getCachedOrders(params: GetAreaOrdersRequest): DeliveryOrder[] | null {
    const cacheKey = JSON.stringify(params);
    const cached = this.cachedOrders.get(cacheKey);
    return cached ? cached.orders : null;
  }
}
