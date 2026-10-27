import CancelModal from '@/components/popupmodel/popupModel';
import { DeliveryOrder, ErrorUtils, deliveryService } from '@/services';
import { STATUS_LABEL, colomboToday, formatRs, groupByDate, matchesSearch } from '@/services/delivery/orderView';
import { DeliverySelection, loadSelection } from '@/services/delivery/selection';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A');

const PendingPaymentsScreen = () => {
  const [selection, setSelection] = useState<DeliverySelection | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState<DeliveryOrder | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sel = await loadSelection();
      setSelection(sel);
      if (!sel) {
        setError('Choose a delivery area first');
        return;
      }
      setOrders(await deliveryService.getUnpaidOrders(sel.areaId));
    } catch (e) {
      setError(ErrorUtils.getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markPaid = async (order: DeliveryOrder) => {
    if (busy) return;
    setBusy(true);
    try {
      await deliveryService.setPayment(order.order_id, 'paid');
    } catch (e) {
      Alert.alert('Could not update', ErrorUtils.getErrorMessage(e));
    } finally {
      setBusy(false);
      await load();
    }
  };

  const shown = orders.filter((o) => matchesSearch(o, search));
  const sections = groupByDate(shown, colomboToday()).map((g) => ({ ...g, key: g.label, data: g.orders }));
  const outstanding = Math.round(orders.reduce((n, o) => n + o.total_price, 0) * 100) / 100;

  const renderOrder = ({ item }: { item: DeliveryOrder }) => (
    <View testID={`unpaid-${item.order_id}`} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderText}>Order ID : {item.order_id}</Text>
        <Text style={styles.badge}>{STATUS_LABEL[item.status]}</Text>
      </View>
      <Text style={styles.itemText}>Customer: {item.customer_name || 'N/A'}</Text>
      <Text style={styles.itemText}>Phone: {item.customer_phone || 'N/A'}</Text>
      <Text style={styles.itemText}>Address: {item.customer_address || 'N/A'}</Text>
      <Text style={styles.itemText}>Meal: {capitalize(item.meal_time)}</Text>
      <Text style={styles.priceText}>Price : {formatRs(item.total_price)}</Text>
      <View style={styles.paymentRow}>
        <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.paidButton} onPress={() => setPaying(item)}>
          <Text style={styles.paidText}>PAID</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>RC FoodService</Text>
        <Text style={styles.title}>Pending Payments{selection ? ` - ${selection.area}` : ''}</Text>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.order_id}
          renderItem={renderOrder}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.label} · {section.orders.length} orders · {formatRs(section.amount)}</Text>
          )}
          ListEmptyComponent={!isLoading && !error ? <Text style={styles.emptyText}>No unpaid orders</Text> : undefined}
          contentContainerStyle={{ paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={load}
          stickySectionHeadersEnabled={false}
        />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Outstanding: {orders.length} orders · {formatRs(outstanding)}</Text>
      </View>

      <CancelModal
        visible={!!paying}
        title="Mark as Paid?"
        message={paying ? `Order ID: ${paying.order_id} · ${formatRs(paying.total_price)}` : ''}
        confirmText="Paid"
        cancelText="Back"
        onClose={() => setPaying(null)}
        onConfirm={() => {
          const o = paying;
          setPaying(null);
          if (o) markPaid(o);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  header: { fontSize: 30, fontWeight: 'bold', marginBottom: 24, color: '#000' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#69bf70', marginBottom: 25 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { marginLeft: 10, fontSize: 16, flex: 1, color: '#000' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#555', marginTop: 8, marginBottom: 10 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  badge: { fontSize: 12, fontWeight: '700', color: '#69bf70' },
  itemText: { fontSize: 14, color: '#000', marginVertical: 1 },
  priceText: { fontSize: 14, fontWeight: 'bold', color: 'green', marginTop: 8 },
  paymentRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  paidButton: { backgroundColor: '#000', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginLeft: 10 },
  paidText: { color: '#fff', fontWeight: '600' },
  errorContainer: { backgroundColor: '#ffe6e6', padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#d63031' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', paddingVertical: 50 },
  summaryContainer: { position: 'absolute', bottom: 110, left: 14, right: 24, backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  summaryLabel: { fontSize: 15, fontWeight: '600', color: '#000' },
});

export default PendingPaymentsScreen;
