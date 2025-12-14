/**
 * Delivery API Client
 * Handles all delivery-related API calls for delivery app
 */

import { DeliveryOrder, GetAreaOrdersRequest } from '../types/api.types';
import { BaseApiClient } from './base-api.client';

export class DeliveryApiClient extends BaseApiClient {
  constructor() {
    super('DELIVERY_SERVICE');
  }

  /**
   * Get orders for a specific area
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
    const queryParams = new URLSearchParams();
    
    if (params.area_id) queryParams.append('area_id', params.area_id.toString());
    if (params.meal_time) queryParams.append('meal_time', params.meal_time);
    if (params.date) queryParams.append('date', params.date);
    if (params.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params.timestamp) queryParams.append('timestamp', params.timestamp);

    // Add cache-busting param to avoid 304 with empty body on some devices
    queryParams.append('_ts', Date.now().toString());

    const response = await this.get<{
      message: string;
      area_id: number;
      meal_time: string;
      date: string;
      payment_status: string;
      orders: DeliveryOrder[];
      total: number;
    }>(`/delivery/orders/area?${queryParams.toString()}`);
    
    return response.data;
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
    const response = await this.get<{
      message: string;
      area_id: number;
      orders: DeliveryOrder[];
      total: number;
    }>('/delivery/orders/my-area');
    
    return response.data;
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
    console.log(`🔧 [DELIVERY_API] Updating payment status for order ${orderId} to ${paymentStatus}`);
    console.log(`🔧 [DELIVERY_API] Request URL: /delivery/orders/${orderId}/payment`);
    console.log(`🔧 [DELIVERY_API] Request body:`, { payment_status: paymentStatus });
    
    const response = await this.put<{
      message: string;
      order_id: string;
      payment_status: string;
      result: any;
    }>(`/delivery/orders/${orderId}/payment`, { payment_status: paymentStatus });
    
    console.log(`🔧 [DELIVERY_API] Response received:`, response.data);
    return response.data;
  }
}
