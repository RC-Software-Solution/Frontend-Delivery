/**
 * Location Service Usage Example
 * This component demonstrates how to use the location service and useLocation hook
 */

import React from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocation } from '../hooks/useLocation';

export default function LocationExample() {
  const {
    areas,
    selectedArea,
    isLoading,
    error,
    fetchAreas,
    refreshAreas,
    selectArea,
    clearSelectedArea,
    clearError,
    getAreaById,
  } = useLocation();

  const handleAreaPress = (area: any) => {
    selectArea(area);
    Alert.alert('Area Selected', `You selected: ${area.area_name}`);
  };

  const handleRefresh = async () => {
    try {
      await refreshAreas();
      Alert.alert('Success', 'Areas refreshed successfully!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Location Service Example</Text>
      
      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={fetchAreas}>
          <Text style={styles.buttonText}>Fetch Areas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleRefresh}>
          <Text style={styles.buttonText}>Refresh Areas</Text>
        </TouchableOpacity>
        
        {selectedArea && (
          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearSelectedArea}>
            <Text style={styles.buttonText}>Clear Selection</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Area */}
      {selectedArea && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>Selected Area:</Text>
          <Text style={styles.selectedText}>
            {selectedArea.area_name} (ID: {selectedArea.area_id})
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
            <Text style={styles.clearErrorText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#69bf70" />
          <Text style={styles.loadingText}>Loading areas...</Text>
        </View>
      )}

      {/* Areas List */}
      {!isLoading && (
        <View style={styles.areasContainer}>
          <Text style={styles.areasTitle}>Available Areas ({areas.length}):</Text>
          
          {areas.length === 0 ? (
            <Text style={styles.noAreasText}>No areas available</Text>
          ) : (
            areas.map((area) => (
              <TouchableOpacity
                key={area.area_id}
                style={[
                  styles.areaItem,
                  selectedArea?.area_id === area.area_id && styles.selectedAreaItem
                ]}
                onPress={() => handleAreaPress(area)}
              >
                <Text style={styles.areaText}>
                  {area.area_name}
                </Text>
                <Text style={styles.areaId}>
                  ID: {area.area_id}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Debug Information */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>Areas Count: {areas.length}</Text>
        <Text style={styles.debugText}>Selected Area: {selectedArea?.area_name || 'None'}</Text>
        <Text style={styles.debugText}>Error: {error || 'None'}</Text>
        
        {/* Test getAreaById function */}
        {areas.length > 0 && (
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => {
              const firstArea = getAreaById(areas[0].area_id);
              Alert.alert('Test getAreaById', `Found: ${firstArea?.area_name || 'Not found'}`);
            }}
          >
            <Text style={styles.testButtonText}>Test getAreaById</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#69bf70',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  selectedContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#69bf70',
  },
  selectedTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  selectedText: {
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  errorText: {
    color: '#d63031',
    marginBottom: 10,
  },
  clearErrorButton: {
    alignSelf: 'flex-end',
  },
  clearErrorText: {
    color: '#74b9ff',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  areasContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  areasTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  noAreasText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  areaItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedAreaItem: {
    backgroundColor: '#e8f5e8',
    borderColor: '#69bf70',
    borderWidth: 2,
  },
  areaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  areaId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  testButton: {
    backgroundColor: '#17a2b8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
  },
});
