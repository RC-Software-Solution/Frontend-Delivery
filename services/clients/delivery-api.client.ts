/**
 * Delivery API Client
 * HTTP calls to delivery-service for the driver app
 */

import { DriverSummary, GetAreaOrdersRequest, SessionScope, StartDeliveryResponse } from '../types/api.types';
import { BaseApiClient } from './base-api.client';

export interface AreaOrdersResponse {
  message: string;
  orders: any[];
  total: number;
}

export class DeliveryApiClient extends BaseApiClient {
  constructor() {
    super('DELIVERY_SERVICE');
  }

  async getAreaOrders(params: GetAreaOrdersRequest): Promise<AreaOrdersResponse> {
    const q = new URLSearchParams({ area_id: String(params.area_id) });
    if (params.meal_time) q.append('meal_time', params.meal_time);
    if (params.target_date) q.append('target_date', params.target_date);
    if (params.payment_status) q.append('payment_status', params.payment_status);
    if (params.type) q.append('type', params.type);
    // Cache-busting param to avoid 304 with empty body on some devices
    q.append('_ts', Date.now().toString());
    const response = await this.get<AreaOrdersResponse>(`/delivery/orders/area?${q.toString()}`);
    return response.data;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: 'paid' | 'unpaid'): Promise<unknown> {
    const response = await this.put(`/delivery/orders/${encodeURIComponent(orderId)}/payment`, { payment_status: paymentStatus });
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: 'delivered' | 'delivery_failed', failureReason?: string): Promise<unknown> {
    const body = status === 'delivery_failed' ? { status, failure_reason: failureReason } : { status };
    const response = await this.put(`/delivery/orders/${encodeURIComponent(orderId)}/status`, body);
    return response.data;
  }

  async startDelivery(scope: SessionScope): Promise<StartDeliveryResponse> {
    const response = await this.post<StartDeliveryResponse>('/delivery/orders/start-delivery', scope);
    return response.data;
  }

  async getSummary(scope: SessionScope): Promise<{ summary: DriverSummary }> {
    const q = new URLSearchParams({ area_id: String(scope.area_id), meal_time: scope.meal_time, _ts: Date.now().toString() });
    const response = await this.get<{ summary: DriverSummary }>(`/delivery/summary?${q.toString()}`);
    return response.data;
  }
}
