/**
 * Delivery Service
 * Driver operations for one area and meal session. No caching: every screen refreshes after a write.
 */

import { DeliveryApiClient } from '../clients/delivery-api.client';
import { DeliveryOrder, DriverSummary, SessionScope, StartDeliveryResponse } from '../types/api.types';
import { ErrorUtils } from '../utils/error.utils';
import { normalizeOrder } from './normalizeOrder';

const wrap = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    throw ErrorUtils.createApiError(error);
  }
};

export class DeliveryService {
  private api = new DeliveryApiClient();

  /** Every order of one session in one area, any status and payment */
  getSessionOrders(scope: SessionScope & { target_date: string }): Promise<DeliveryOrder[]> {
    return wrap(async () => (await this.api.getAreaOrders({ ...scope, type: 'all', payment_status: 'any' })).orders.map(normalizeOrder));
  }

  /** Every unpaid order of the area, any status and day */
  getUnpaidOrders(areaId: number): Promise<DeliveryOrder[]> {
    return wrap(async () => (await this.api.getAreaOrders({ area_id: areaId, type: 'all', payment_status: 'unpaid' })).orders.map(normalizeOrder));
  }

  getSummary(scope: SessionScope): Promise<DriverSummary> {
    return wrap(async () => (await this.api.getSummary(scope)).summary);
  }

  startDelivery(scope: SessionScope): Promise<StartDeliveryResponse> {
    return wrap(() => this.api.startDelivery(scope));
  }

  markDelivered(orderId: string): Promise<unknown> {
    return wrap(() => this.api.updateOrderStatus(orderId, 'delivered'));
  }

  markFailed(orderId: string, reason: string): Promise<unknown> {
    return wrap(() => this.api.updateOrderStatus(orderId, 'delivery_failed', reason.trim()));
  }

  setPayment(orderId: string, paymentStatus: 'paid' | 'unpaid'): Promise<unknown> {
    return wrap(() => this.api.updatePaymentStatus(orderId, paymentStatus));
  }
}
