/**
 * Menu API Client
 * Meal sessions and which areas this delivery person covers in each
 */

import { BaseApiClient } from './base-api.client';

/** A session today that this driver is assigned to. `mine` = areas they cover, `taken` = areas other active drivers cover; every other area is free to take. */
export interface DeliverySession {
  id: number;
  date: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
  start_time: string;
  end_time: string;
  notes: string | null;
  state: 'upcoming' | 'open' | 'closed';
  mine: number[];
  taken: number[];
}

export class MenuApiClient extends BaseApiClient {
  constructor() {
    super('MENU_SERVICE');
  }

  /**
   * Today's sessions (Sri Lanka date) this driver is assigned to
   */
  async getMyDeliverySessions(): Promise<DeliverySession[]> {
    const response = await this.get<{ data: { sessions: DeliverySession[] } }>('/meal-sessions/delivery/mine');
    return response.data.data.sessions;
  }

  /**
   * Replace this driver's areas in a session. Fails (409) when an added area is held by another active driver,
   * (403) when the driver is not assigned to the session.
   */
  async setMyDeliveryAreas(sessionId: number, areaIds: number[]): Promise<void> {
    await this.put(`/meal-sessions/${sessionId}/delivery/me`, { area_ids: areaIds });
  }
}
