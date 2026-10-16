import { Area, authService, ErrorUtils, locationService, userApi } from '@/services';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function AreaSelectionScreen() {
    const [fontsLoaded] = useFonts({
        Raleway_700Bold,
    });

    const [areas, setAreas] = useState<Area[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // null = the areas lookup failed; fall back to showing every area like before
    const [mine, setMine] = useState<number[] | null>(null);
    const [taken, setTaken] = useState<number[]>([]);

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('📍 Fetching areas for area selection...');
            
            const [fetchedAreas, my] = await Promise.all([
                locationService.getAreas(),
                userApi.getMyAreas().catch(() => null),
            ]);
            setAreas(fetchedAreas);
            setMine(my?.mine ?? null);
            setTaken(my?.taken ?? []);
            console.log(`✅ Loaded ${fetchedAreas.length} areas for selection`);
        } catch (error: any) {
            console.error('❌ Failed to fetch areas:', error);
            const errorMessage = ErrorUtils.getErrorMessage(error);
            setError(errorMessage);
            
            Alert.alert(
                'Error Loading Areas',
                errorMessage,
                [
                    { text: 'Retry', onPress: fetchAreas },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleAreaSelection = async (area: Area) => {
        console.log(`📍 Area selected: ${area.area_name} (ID: ${area.area_id})`);
        try {
            await AsyncStorage.setItem('rc_selected_area', JSON.stringify({ areaId: area.area_id, area: area.area_name }));
        } catch (e) { /* ignore */ }

        router.push({
            pathname: '/(tabs)',
            params: { 
                area: area.area_name,
                areaId: area.area_id.toString()
            },
        });
    };

    // Take a free area: it joins this driver's areas (the server refuses one another driver already holds)
    const claimArea = async (area: Area) => {
        try {
            await userApi.setMyAreas([...(mine ?? []), Number(area.area_id)]);
            setMine([...(mine ?? []), Number(area.area_id)]);
            handleAreaSelection(area);
        } catch (e: any) {
            Alert.alert('Could not take this area', ErrorUtils.getErrorMessage(e));
            fetchAreas();
        }
    };

    // Give an area up so another driver can take it (a driver always keeps at least one)
    const releaseArea = async (area: Area) => {
        try {
            const next = (mine ?? []).filter((id) => id !== Number(area.area_id));
            await userApi.setMyAreas(next);
            setMine(next);
        } catch (e: any) {
            Alert.alert('Could not release this area', ErrorUtils.getErrorMessage(e));
        }
    };

    if (!fontsLoaded) {
        return null; // Return null while fonts are loading
    }


    return (
        <GestureHandlerRootView style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {/* Header with green background */}
                <View style={styles.header}>
                    <Text style={[styles.headerText, { fontFamily: 'Raleway_700Bold' }]}>RC FoodService</Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={async () => {
                        try {
                            // Clear stored selections and per-area summaries
                            const keys = await AsyncStorage.getAllKeys();
                            const toRemove = keys.filter(k => 
                                k.startsWith('rc_delivery_paid_summary_area_') ||
                                k.startsWith('rc_delivery_unpaid_collected_area_') ||
                                k === 'rc_selected_area'
                            );
                            if (toRemove.length) {
                                await AsyncStorage.multiRemove(toRemove);
                            }
                            await authService.logout();
                        } catch (e) {
                            // ignore
                        } finally {
                            router.replace('/(routes)/login');
                        }
                    }}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* White Curved Area Selection Container */}
                <View style={styles.areaContainer}>
                    <Text style={[styles.title, { fontFamily: 'Raleway_700Bold' }]}>
                        Select Delivery Area
                    </Text>

                    {isLoading ? (
                        // Loading State
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#69bf70" />
                            <Text style={styles.loadingText}>Loading areas...</Text>
                        </View>
                    ) : error ? (
                        // Error State
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Failed to load areas</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchAreas}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : areas.length === 0 ? (
                        // No Areas State
                        <View style={styles.noAreasContainer}>
                            <Text style={styles.noAreasText}>No delivery areas available</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchAreas}>
                                <Text style={styles.retryButtonText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Areas List: mine first, then free areas to take, then areas other drivers hold
                        (mine === null
                            ? [{ title: '', kind: 'mine' as const, list: areas }]
                            : [
                                { title: 'My areas', kind: 'mine' as const, list: areas.filter((a) => mine.includes(Number(a.area_id))) },
                                { title: 'Unassigned areas (tap to take)', kind: 'free' as const, list: areas.filter((a) => !mine.includes(Number(a.area_id)) && !taken.includes(Number(a.area_id))) },
                                { title: 'Covered by other drivers', kind: 'taken' as const, list: areas.filter((a) => !mine.includes(Number(a.area_id)) && taken.includes(Number(a.area_id))) },
                            ]
                        ).filter((g) => g.list.length > 0).map((g) => (
                            <View key={g.kind}>
                                {g.title !== '' && <Text style={styles.sectionTitle}>{g.title}</Text>}
                                {g.list.map((area) => (
                                    <TouchableOpacity
                                        key={area.area_id}
                                        style={[styles.areaButton, g.kind === 'taken' && styles.areaButtonDisabled]}
                                        disabled={g.kind === 'taken'}
                                        onPress={() => (g.kind === 'free' ? claimArea(area) : handleAreaSelection(area))}
                                    >
                                        <Text style={styles.areaText}>{area.area_name}</Text>
                                        {g.kind === 'mine' && mine !== null && mine.length > 1 && (
                                            <TouchableOpacity onPress={() => releaseArea(area)}>
                                                <Text style={styles.releaseText}>Release</Text>
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#69bf70', // Green header color
    },
    header: {
        paddingTop: 60, // Increased top padding for status bar
        paddingBottom: 40, // More space below
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 24, // Larger text size
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'left',
    },
    logoutButton: {
        backgroundColor: '#ffffff22',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
    },
    areaContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 30,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#000',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 10,
    },
    areaButtonDisabled: {
        opacity: 0.45,
    },
    releaseText: {
        marginTop: 6,
        color: '#b91c1c',
        fontWeight: '600',
    },
    areaButton: {
        backgroundColor: '#D9D9D9',
        paddingVertical: 25, // Increased height
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2, // Android shadow
        alignItems: 'center',
        justifyContent: 'center',
    },
    areaText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    errorText: {
        fontSize: 16,
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: 20,
    },
    noAreasContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    noAreasText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#69bf70',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

