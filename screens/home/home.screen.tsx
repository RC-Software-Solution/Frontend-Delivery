import CancelModal from '@/components/popupmodel/popupModel';
import { DeliveryOrder, deliveryService, ErrorUtils } from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


type Params = {
    area?: string;
    areaId?: string;
};

const HomeScreen = () => {
const [feedbackVisible, setFeedbackVisible] = useState(false);
const [feedbackMessage, setFeedbackMessage] = useState('');

    const { area, areaId } = useLocalSearchParams<Params>();
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalTitle, setModalTitle] = React.useState('');
    const [modalMessage, setModalMessage] = React.useState('');
    const [onConfirmAction, setOnConfirmAction] = React.useState(() => () => { });

    // New state for orders
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Separate tracking for paid orders (for bottom summary)
    const [paidOrders, setPaidOrders] = useState<DeliveryOrder[]>([]);
    const [paidTotalAmount, setPaidTotalAmount] = useState(0);
    const [paidTotalQuantity, setPaidTotalQuantity] = useState(0);

    // Persist paid summary per area
    const SUMMARY_KEY_PREFIX = 'rc_delivery_paid_summary_area_';

    useEffect(() => {
        fetchOrders();
        // Load persisted summary for this area (if any)
        const loadSummary = async () => {
            try {
                if (!areaId) return;
                const key = `${SUMMARY_KEY_PREFIX}${areaId}`;
                const saved = await AsyncStorage.getItem(key);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setPaidOrders(Array.isArray(parsed.paidOrders) ? parsed.paidOrders : []);
                    setPaidTotalAmount(typeof parsed.paidTotalAmount === 'number' ? parsed.paidTotalAmount : 0);
                    setPaidTotalQuantity(typeof parsed.paidTotalQuantity === 'number' ? parsed.paidTotalQuantity : 0);
                } else {
                    setPaidOrders([]);
                    setPaidTotalAmount(0);
                    setPaidTotalQuantity(0);
                }
            } catch (e) {
                // ignore persistence errors; keep runtime state
            }
        };
        loadSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [areaId]);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log(`🚚 Fetching orders for area: ${area} (ID: ${areaId})`);
            
            if (!areaId) {
                throw new Error('Area ID is required');
            }

            const response = await deliveryService.getTodaysOrders(parseInt(areaId));
            
            // Ensure orders is always an array
            const ordersArray = Array.isArray(response.orders) ? response.orders : [];
            setOrders(ordersArray);
            
            // Do not reset paid summary here; it should persist until logout
            
            console.log(`✅ Loaded ${ordersArray.length} orders for area ${area}`);
        } catch (error: any) {
            console.error('❌ Failed to fetch orders:', error);
            const errorMessage = ErrorUtils.getErrorMessage(error);
            setError(errorMessage);
            
            Alert.alert(
                'Error Loading Orders',
                errorMessage,
                [
                    { text: 'Retry', onPress: fetchOrders },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } finally {
            setIsLoading(false);
        }
    };
    const handlePress = async (orderId: string, type: 'paid' | 'unpaid') => {
  const title = type === 'paid' ? 'Mark as Paid?' : 'Mark as Unpaid?';
        const action = async () => {
    setModalVisible(false); // close first modal
            
            try {
                console.log(`🚚 Updating payment status for order ${orderId} to ${type}`);
                await deliveryService.updatePaymentStatus(orderId, type);
                
                // Update local state
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.order_id === orderId 
                            ? { ...order, payment_status: type }
                            : order
                    )
                );

                // If marking as paid, add to paid orders tracking
                if (type === 'paid') {
                    const orderToMarkPaid = orders.find(order => order.order_id === orderId);
                    if (orderToMarkPaid) {
                        // Check if order is already in paid orders to prevent duplicates
                        setPaidOrders(prevPaid => {
                            const alreadyExists = prevPaid.some(paidOrder => paidOrder.order_id === orderId);
                            if (alreadyExists) {
                                return prevPaid; // Don't add duplicate
                            }
                            return [...prevPaid, { ...orderToMarkPaid, payment_status: 'paid' }];
                        });
                        
                        // Update paid totals (only if not already counted)
                        setPaidTotalAmount(prev => {
                            const alreadyExists = paidOrders.some(paidOrder => paidOrder.order_id === orderId);
                            if (alreadyExists) {
                                return prev; // Don't add duplicate
                            }
                            return prev + (orderToMarkPaid.total_price || 0);
                        });
                        
                        const orderQuantity = orderToMarkPaid.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                        setPaidTotalQuantity(prev => {
                            const alreadyExists = paidOrders.some(paidOrder => paidOrder.order_id === orderId);
                            if (alreadyExists) {
                                return prev; // Don't add duplicate
                            }
                            return prev + orderQuantity;
                        });
                        // Persist latest summary per area
                        if (areaId) {
                            setTimeout(async () => {
                                try {
                                    const key = `${SUMMARY_KEY_PREFIX}${areaId}`;
                                    const snapshot = {
                                        paidOrders: [...paidOrders, { ...orderToMarkPaid, payment_status: 'paid' }].filter((v, i, arr) => arr.findIndex(a => a.order_id === v.order_id) === i),
                                        paidTotalAmount: paidTotalAmount + (orderToMarkPaid.total_price || 0),
                                        paidTotalQuantity: paidTotalQuantity + orderQuantity,
                                    };
                                    await AsyncStorage.setItem(key, JSON.stringify(snapshot));
                                } catch (e) {
                                    // ignore persistence errors
                                }
                            }, 0);
                        }
                    }
                }
                
    setTimeout(() => {
      setFeedbackMessage(type === 'paid' ? 'Marked as Paid' : 'Marked as Unpaid');
      setFeedbackVisible(true);
      setTimeout(() => setFeedbackVisible(false), 1200);
                }, 300);

                // Auto-refresh list after status update (summary stays as-is)
                fetchOrders();
                
            } catch (error: any) {
                console.error('❌ Failed to update payment status:', error);
                setTimeout(() => {
                    Alert.alert('Error', 'Failed to update payment status. Please try again.');
                }, 300);
            }
  };

  setModalTitle(title);
        setModalMessage(`Order ID: ${orderId}`);
  setOnConfirmAction(() => action);
  setModalVisible(true);
};



    const renderOrder = ({ item }: { item: DeliveryOrder }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderIdText}>Order ID: {item.order_id || 'N/A'}</Text>
            </View>
            <Text style={styles.customerNameText}>Customer: {item.customer_name || 'N/A'}</Text>
            <Text style={styles.customerInfo}>Address: {item.customer_address || 'N/A'}</Text>
            <Text style={styles.customerInfo}>Meal: {typeof item.meal_time === 'string' && item.meal_time.length > 0 ? (item.meal_time.charAt(0).toUpperCase() + item.meal_time.slice(1)) : 'N/A'}</Text>
            
            {Array.isArray(item.items) && item.items.map((orderItem, index) => (
                <Text key={index} style={styles.itemText}>
                    {orderItem.food_name || 'Unknown Item'} - {orderItem.quantity || 0} ({orderItem.meal_type || 'unknown'})
                </Text>
            ))}
            {(!item.items || !Array.isArray(item.items)) && (
                <Text style={styles.itemText}>No items available</Text>
            )}
            <Text style={styles.priceText}>Price : Rs. {Number(item.total_price || 0).toFixed(2)}</Text>
            
            <View style={styles.paymentRow}>
                <TouchableOpacity 
                    style={[styles.unpaidButton, item.payment_status === 'unpaid' && styles.activeButton]} 
                    onPress={() => handlePress(item.order_id, 'unpaid')}
                >
                    <Text style={styles.unpaidText}>UNPAID</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.paidButton, item.payment_status === 'paid' && styles.activePaidButton]} 
                    onPress={() => handlePress(item.order_id, 'paid')}
                >
                    <Text style={styles.paidText}>PAID</Text>
                </TouchableOpacity>
            </View>
        </View>
    );


    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color="#69bf70" />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Filter orders based on search (safe guards for undefined fields)
    const filteredOrders = orders.filter(order => {
        const query = (search || '').toLowerCase();
        const orderId = String(order.order_id || '').toLowerCase();
        const customerName = String(order.customer_name || '').toLowerCase();
        const itemMatch = Array.isArray(order.items) && order.items.some(item =>
            String(item.food_name || '').toLowerCase().includes(query)
        );
        return orderId.includes(query) || customerName.includes(query) || itemMatch;
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>RC FoodService</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#69bf70', marginBottom: 25 }}>
  Active Orders{area ? ` - ${area}` : ''}
</Text>
              
                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search orders"
                        placeholderTextColor="#888"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={styles.statsContainer}>
                    <Text style={styles.pendingText}>Pending Deliveries: {filteredOrders.length}</Text>
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Error: {error}</Text>
                        <TouchableOpacity onPress={fetchOrders} style={styles.retryButton}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {filteredOrders.length === 0 && !isLoading && !error ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders found for this area</Text>
                    </View>
                ) : (
                <FlatList
                        data={filteredOrders}
                        keyExtractor={(item) => item.order_id}
                    renderItem={renderOrder}
                        contentContainerStyle={{ paddingBottom: 180 }}
                    showsVerticalScrollIndicator={false}
                        refreshing={isLoading}
                />
                )}
            </View>

            {/* Fixed Summary ABOVE Tab Bar - Shows only paid orders */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Paid Parcels:</Text>
                    <Text style={styles.summaryValue}>{paidTotalQuantity}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Paid Total:</Text>
                    <Text style={styles.summaryValue}>Rs. {Number(paidTotalAmount || 0).toFixed(2)}</Text>
                </View>
            </View>
           <CancelModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onConfirm={onConfirmAction}
  title={modalTitle}
  message={modalMessage}
/>

<CancelModal
  visible={feedbackVisible}
  onClose={() => setFeedbackVisible(false)}
  onConfirm={() => setFeedbackVisible(false)}
  title={feedbackMessage}
  message=""
  hideButtons={true} 
/>

        </SafeAreaView>


    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20, // pushes RC FoodService down more
    },
    header: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 24, // more space under the title
        color: '#000',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchInput: {
        marginLeft: 10,
        fontSize: 16,
        flex: 1,
        color: '#000',
    },
    pendingText: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 14,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20, // more space between cards
        marginHorizontal: 4, // allow shadow visibility
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    orderHeader: {
        marginBottom: 4,
    },
    orderIdText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },
    customerNameText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    itemText: {
        fontSize: 14,
        color: '#000',
        marginVertical: 1,
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'green',
        marginTop: 8,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    unpaidButton: {
        backgroundColor: '#ccc',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginLeft: 10,
    },
    unpaidText: {
        color: '#000',
        fontWeight: '600',
    },
    paidButton: {
        backgroundColor: '#000',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginLeft: 10,
    },
    paidText: {
        color: '#fff',
        fontWeight: '600',
    },

    summaryContainer: {
        position: 'absolute',
        bottom: 110, // safely above navbar
        left: 14,
        right: 24,
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    summaryLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    subHeader: {
        fontSize: 18,
        fontWeight: '500',
        color: '#555',
        marginBottom: 20,
        marginTop: -12, // slight overlap if needed
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    refreshButton: {
        backgroundColor: '#69bf70',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    refreshText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    errorContainer: {
        backgroundColor: '#ffe6e6',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    errorText: {
        color: '#d63031',
        flex: 1,
        marginRight: 10,
    },
    retryButton: {
        backgroundColor: '#ff6b6b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    retryText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    customerInfo: {
        fontSize: 12,
        color: '#666',
        marginVertical: 1,
    },
    activeButton: {
        backgroundColor: '#ff6b6b',
    },
    activePaidButton: {
        backgroundColor: '#69bf70',
    },

});





export default HomeScreen;
