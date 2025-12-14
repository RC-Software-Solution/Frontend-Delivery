/**
 * useLocation Hook
 * React hook for location and area management in delivery app
 */

import { useCallback, useEffect, useState } from 'react';
import { LocationService } from '../location/location.service';
import { Area } from '../types/api.types';
import { ErrorUtils } from '../utils/error.utils';

interface LocationState {
  areas: Area[];
  selectedArea: Area | null;
  isLoading: boolean;
  error: string | null;
}

interface LocationActions {
  fetchAreas: () => Promise<void>;
  refreshAreas: () => Promise<void>;
  selectArea: (area: Area) => void;
  clearSelectedArea: () => void;
  clearError: () => void;
  getAreaById: (areaId: number) => Area | undefined;
}

export function useLocation(): LocationState & LocationActions {
  const [locationState, setLocationState] = useState<LocationState>({
    areas: [],
    selectedArea: null,
    isLoading: false,
    error: null,
  });

  const locationService = new LocationService();

  const fetchAreas = useCallback(async () => {
    try {
      setLocationState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const areas = await locationService.getAreas();
      
      setLocationState(prev => ({
        ...prev,
        areas,
        isLoading: false,
      }));
    } catch (error) {
      console.error('❌ Failed to fetch areas:', error);
      setLocationState(prev => ({
        ...prev,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      }));
    }
  }, [locationService]);

  const refreshAreas = useCallback(async () => {
    try {
      setLocationState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const areas = await locationService.refreshAreas();
      
      setLocationState(prev => ({
        ...prev,
        areas,
        isLoading: false,
      }));
    } catch (error) {
      console.error('❌ Failed to refresh areas:', error);
      setLocationState(prev => ({
        ...prev,
        isLoading: false,
        error: ErrorUtils.getErrorMessage(error),
      }));
    }
  }, [locationService]);

  const selectArea = useCallback((area: Area) => {
    console.log(`📍 Area selected: ${area.area_name} (ID: ${area.area_id})`);
    setLocationState(prev => ({
      ...prev,
      selectedArea: area,
    }));
  }, []);

  const clearSelectedArea = useCallback(() => {
    console.log('📍 Clearing selected area');
    setLocationState(prev => ({
      ...prev,
      selectedArea: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setLocationState(prev => ({ ...prev, error: null }));
  }, []);

  const getAreaById = useCallback((areaId: number): Area | undefined => {
    return locationState.areas.find(area => area.area_id === areaId);
  }, [locationState.areas]);

  // Auto-fetch areas on mount
  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  return {
    ...locationState,
    fetchAreas,
    refreshAreas,
    selectArea,
    clearSelectedArea,
    clearError,
    getAreaById,
  };
}
