import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useFonts, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';

export default function AreaSelectionScreen() {
 const [fontsLoaded] = useFonts({
        Raleway_700Bold,
    });

    if (!fontsLoaded) {
        return null; // Return null while fonts are loading
    }

    const handleAreaSelection = (area: string) => {
  router.push({
    pathname: '/(tabs)',
    params: { area }, // Pass area as a route parameter
  });
};


    return (
        <GestureHandlerRootView style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {/* Header with green background */}
                <View style={styles.header}>
                    <Text style={[styles.headerText, { fontFamily: 'Raleway_700Bold' }]}>
                        RC FoodService
                    </Text>
                </View>

                {/* White Curved Area Selection Container */}
                <View style={styles.areaContainer}>
                    <Text style={[styles.title, { fontFamily: 'Raleway_700Bold' }]}>
                        Select Delivery Area
                    </Text>

                    {/* List of Areas */}
                    {['AREA 1', 'AREA 2', 'AREA 3', 'AREA 4', 'AREA 5', 'AREA 6'].map((area, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.areaButton}
                            onPress={() => handleAreaSelection(area)}
                        >
                            <Text style={styles.areaText}>{area}</Text>
                        </TouchableOpacity>
                    ))}
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
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 24, // Larger text size
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'left',
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
});

