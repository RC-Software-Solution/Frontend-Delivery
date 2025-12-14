/**
 * Location Service
 * Handles location and area-related operations for delivery app
 */

import { LocationApiClient } from '../clients/location-api.client';
import { Area } from '../types/api.types';
import { ErrorUtils } from '../utils/error.utils';

export class LocationService {
  private locationApiClient: LocationApiClient;
  private cachedAreas: Area[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.locationApiClient = new LocationApiClient();
  }

  /**
   * Get all areas with caching
   */
  async getAreas(): Promise<Area[]> {
    try {
      console.log('📍 Fetching areas...');

      // Check if we have cached data and it's still valid
      const now = Date.now();
      if (this.cachedAreas && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
        console.log('✅ Returning cached areas');
        return this.cachedAreas;
      }

      // Fetch fresh data from API
      const areas = await this.locationApiClient.getAreas();
      
      // Cache the results
      this.cachedAreas = areas;
      this.cacheTimestamp = now;

      console.log(`✅ Fetched ${areas.length} areas from API`);
      return areas;
    } catch (error) {
      console.error('❌ Failed to fetch areas:', error);
      
      // Return cached data if available, even if expired
      if (this.cachedAreas) {
        console.log('⚠️ Returning expired cached areas due to API error');
        return this.cachedAreas;
      }
      
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get area by ID
   */
  async getAreaById(areaId: number): Promise<Area> {
    try {
      console.log(`📍 Fetching area with ID: ${areaId}`);
      
      // Check cache first
      if (this.cachedAreas) {
        const cachedArea = this.cachedAreas.find(area => area.area_id === areaId);
        if (cachedArea) {
          console.log('✅ Found area in cache');
          return cachedArea;
        }
      }

      // Fetch from API
      const area = await this.locationApiClient.getAreaById(areaId);
      console.log(`✅ Fetched area: ${area.area_name}`);
      return area;
    } catch (error) {
      console.error(`❌ Failed to fetch area ${areaId}:`, error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Refresh areas cache
   */
  async refreshAreas(): Promise<Area[]> {
    console.log('🔄 Refreshing areas cache...');
    this.cachedAreas = null;
    this.cacheTimestamp = 0;
    return await this.getAreas();
  }

  /**
   * Clear areas cache
   */
  clearCache(): void {
    console.log('🗑️ Clearing areas cache');
    this.cachedAreas = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Check if areas cache is valid
   */
  isCacheValid(): boolean {
    const now = Date.now();
    return this.cachedAreas !== null && (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Get cached areas (without API call)
   */
  getCachedAreas(): Area[] | null {
    return this.cachedAreas;
  }

  /**
   * Create new area (admin only)
   */
  async createArea(areaName: string): Promise<Area> {
    try {
      console.log(`📍 Creating new area: ${areaName}`);
      const area = await this.locationApiClient.createArea(areaName);
      
      // Clear cache to force refresh
      this.clearCache();
      
      console.log(`✅ Created area: ${area.area_name}`);
      return area;
    } catch (error) {
      console.error('❌ Failed to create area:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Update area (admin only)
   */
  async updateArea(areaId: number, areaName: string): Promise<Area> {
    try {
      console.log(`📍 Updating area ${areaId}: ${areaName}`);
      const area = await this.locationApiClient.updateArea(areaId, areaName);
      
      // Clear cache to force refresh
      this.clearCache();
      
      console.log(`✅ Updated area: ${area.area_name}`);
      return area;
    } catch (error) {
      console.error(`❌ Failed to update area ${areaId}:`, error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Delete area (admin only)
   */
  async deleteArea(areaId: number): Promise<void> {
    try {
      console.log(`📍 Deleting area: ${areaId}`);
      await this.locationApiClient.deleteArea(areaId);
      
      // Clear cache to force refresh
      this.clearCache();
      
      console.log(`✅ Deleted area: ${areaId}`);
    } catch (error) {
      console.error(`❌ Failed to delete area ${areaId}:`, error);
      throw ErrorUtils.createApiError(error);
    }
  }
}
