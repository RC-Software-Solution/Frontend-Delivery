/**
 * Location API Client
 * Handles all location-related API calls for delivery app
 */

import { Area } from '../types/api.types';
import { BaseApiClient } from './base-api.client';

export class LocationApiClient extends BaseApiClient {
  constructor() {
    super('LOCATION_SERVICE');
  }

  /**
   * Get all areas
   */
  async getAreas(): Promise<Area[]> {
    const response = await this.get<Area[]>('/areas');
    return response.data;
  }

  /**
   * Get area by ID
   */
  async getAreaById(areaId: number): Promise<Area> {
    const response = await this.get<Area>(`/areas/${areaId}`);
    return response.data;
  }

  /**
   * Create new area (admin only)
   */
  async createArea(areaName: string): Promise<Area> {
    const response = await this.post<Area>('/areas', { area_name: areaName });
    return response.data;
  }

  /**
   * Update area (admin only)
   */
  async updateArea(areaId: number, areaName: string): Promise<Area> {
    const response = await this.put<Area>(`/areas/${areaId}`, { area_name: areaName });
    return response.data;
  }

  /**
   * Delete area (admin only)
   */
  async deleteArea(areaId: number): Promise<void> {
    await this.delete(`/areas/${areaId}`);
  }
}
