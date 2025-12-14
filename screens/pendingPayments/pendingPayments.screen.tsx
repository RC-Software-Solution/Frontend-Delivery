import CancelModal from '@/components/popupmodel/popupModel';
import { DeliveryOrder, deliveryService, ErrorUtils } from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Params = {
  area?: string;
  areaId?: string;
};

const PendingPaymentsScreen = () => {
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  const { area, areaId } = useLocalSearchParams<Params>();
      const [search, setSearch] = useState('');
      const [modalVisible, setModalVisible] = React.useState(false);
      const [modalTitle, setModalTitle] = React.useState('');
      const [modalMessage, setModalMessage] = React.useState('');
      const [onConfirmAction, setOnConfirmAction] = React.useState(() => () => { });

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-area collected summary for unpaid -> paid actions
  const [collectedOrderIds, setCollectedOrderIds] = useState<string[]>([]);
  const [collectedTotal, setCollectedTotal] = useState(0);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const SUMMARY_KEY_PREFIX = 'rc_delivery_unpaid_collected_area_';

  useEffect(() => {
    const init = async () => {
      let effectiveAreaId = areaId;
      let effectiveArea = area;
      if (!effectiveAreaId) {
        try {
          const saved = await AsyncStorage.getItem('rc_selected_area');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.areaId) {
              effectiveAreaId = String(parsed.areaId);
              effectiveArea = parsed.area;
            }
          }
        } catch (e) {}
      }

      if (effectiveAreaId) {
        setSelectedAreaId(effectiveAreaId);
        await fetchUnpaidOrders(effectiveAreaId);
        const key = `${SUMMARY_KEY_PREFIX}${effectiveAreaId}`;
        try {
          const saved = await AsyncStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            setCollectedOrderIds(Array.isArray(parsed.collectedOrderIds) ? parsed.collectedOrderIds : []);
            setCollectedTotal(typeof parsed.collectedTotal === 'number' ? parsed.collectedTotal : 0);
          } else {
            setCollectedOrderIds([]);
            setCollectedTotal(0);
          }
        } catch (e) {}
      } else {
        setError('Area ID is required');
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId]);

  const fetchUnpaidOrders = async (idOverride?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const idToUse = idOverride ?? selectedAreaId ?? areaId;
      if (!idToUse) throw new Error('Area ID is required');
      const response = await deliveryService.getAreaOrders({ area_id: parseInt(idToUse), payment_status: 'unpaid' });
      const ordersArray = Array.isArray(response.orders) ? response.orders : [];
      setOrders(ordersArray);
    } catch (err: any) {
      const message = ErrorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = (orderId: string) => {
    const title = 'Mark as Paid?';
    const action = async () => {
      setModalVisible(false);
      try {
        await deliveryService.updatePaymentStatus(orderId, 'paid');
        // Update local list state
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, payment_status: 'paid' } : o));

        // Update collected summary if not already counted
        const target = orders.find(o => o.order_id === orderId);
        if (target) {
          setCollectedOrderIds(prevIds => {
            if (prevIds.includes(orderId)) return prevIds;
            const nextIds = [...prevIds, orderId];
            const nextTotal = collectedTotal + (target.total_price || 0);
            const areaKeyId = selectedAreaId ?? areaId;
            if (areaKeyId) {
              AsyncStorage.setItem(`${SUMMARY_KEY_PREFIX}${areaKeyId}`, JSON.stringify({
                collectedOrderIds: nextIds,
                collectedTotal: nextTotal,
              })).catch(() => {});
            }
            setCollectedTotal(nextTotal);
            return nextIds;
          });
        }

        // Feedback toast modal
        setTimeout(() => {
          setFeedbackMessage('Marked as Paid');
          setFeedbackVisible(true);
          setTimeout(() => setFeedbackVisible(false), 1200);
        }, 200);

        // Auto refresh list (summary persists)
        fetchUnpaidOrders();
      } catch (err: any) {
      setTimeout(() => {
          setFeedbackMessage('Failed to update');
        setFeedbackVisible(true);
        setTimeout(() => setFeedbackVisible(false), 1200);
        }, 200);
      }
    };

  setModalTitle(title);
    setModalMessage(`Order ID: ${orderId}`);
  setOnConfirmAction(() => action);
  setModalVisible(true);
};

  const filteredOrders = orders.filter(order => {
    const query = (search || '').toLowerCase();
    const orderId = String(order.order_id || '').toLowerCase();
    const customerName = String(order.customer_name || '').toLowerCase();
    const itemMatch = Array.isArray(order.items) && order.items.some(item => String(item.food_name || '').toLowerCase().includes(query));
    return orderId.includes(query) || customerName.includes(query) || itemMatch;
  });

  const renderOrder = ({ item }: { item: DeliveryOrder }) => (
  <View style={styles.orderCard}>
    <View style={styles.orderHeader}>
        <Text style={styles.orderText}>Order ID : {item.order_id || 'N/A'}</Text>
    </View>
      <Text style={styles.itemText}>Customer: {item.customer_name || 'N/A'}</Text>
      <Text style={styles.itemText}>Address: {item.customer_address || 'N/A'}</Text>
      <Text style={styles.itemText}>Meal: {typeof item.meal_time === 'string' && item.meal_time.length > 0 ? (item.meal_time.charAt(0).toUpperCase() + item.meal_time.slice(1)) : 'N/A'}</Text>
      <Text style={styles.priceText}>Price : Rs. {Number(item.total_price || 0).toFixed(2)}</Text>
    <View style={styles.paymentRow}>
        <TouchableOpacity style={styles.paidButton} onPress={() => handleMarkPaid(item.order_id)}>
        <Text style={styles.paidText}>PAID</Text>
      </TouchableOpacity>
    </View>
  </View>
);

  return (
   <SafeAreaView style={styles.safeArea}>
  <View style={styles.container}>
    <Text style={styles.header}>RC FoodService</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#69bf70', marginBottom: 25 }}>
          Pending Payments{area ? ` - ${area}` : ''}
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

        {error && (
          <View style={{ backgroundColor: '#ffe6e6', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ color: '#d63031' }}>Error: {error}</Text>
          </View>
        )}

    <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.order_id}
      renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 180 }}
      showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchUnpaidOrders}
    />
  </View>

  {/* Fixed Summary ABOVE Tab Bar */}
  <View style={styles.summaryContainer}>
    <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Collected Total:</Text>
          <Text style={styles.summaryValue}>Rs. {Number(collectedTotal || 0).toFixed(2)}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
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
}

});





export default PendingPaymentsScreen;
