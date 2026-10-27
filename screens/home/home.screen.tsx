import FailReasonModal from '@/components/failReasonModal/failReasonModal';
import CancelModal from '@/components/popupmodel/popupModel';
import { DeliveryOrder, DeliverySession, DriverSummary, ErrorUtils, deliveryService, menuApi } from '@/services';
import { OrderAction, OrderFilter, STATUS_LABEL, formatRs, needsStart, orderActions, parcelsOf, visibleOrders } from '@/services/delivery/orderView';
import { DeliverySelection, loadSelection } from '@/services/delivery/selection';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FILTERS: { key: OrderFilter; label: string }[] = [
    { key: 'to_deliver', label: 'To deliver' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'failed', label: 'Failed' },
    { key: 'all', label: 'All' },
];
const ACTION_LABEL: Record<OrderAction, string> = { delivered: 'DELIVERED', failed: 'FAILED', paid: 'PAID', unpaid: 'UNPAID' };
const SESSION_STATE: Record<DeliverySession['state'], string> = {
    upcoming: 'Ordering not open yet',
    open: 'Ordering open',
    closed: 'Ordering closed',
};

type Confirm = { title: string; message: string; confirmText: string; run: () => Promise<unknown> };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const HomeScreen = () => {
    const [selection, setSelection] = useState<DeliverySelection | null>(null);
    const [session, setSession] = useState<DeliverySession | null>(null);
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [summary, setSummary] = useState<DriverSummary | null>(null);
    const [filter, setFilter] = useState<OrderFilter>('to_deliver');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<Confirm | null>(null);
    const [failing, setFailing] = useState<DeliveryOrder | null>(null);
    const [askPaid, setAskPaid] = useState<DeliveryOrder | null>(null);

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
            const scope = { area_id: sel.areaId, meal_time: sel.mealTime };
            const [list, counters, sessions] = await Promise.all([
                deliveryService.getSessionOrders({ ...scope, target_date: sel.date }),
                deliveryService.getSummary(scope),
                menuApi.getMyDeliverySessions(),
            ]);
            setOrders(list);
            setSummary(counters);
            setSession(sessions.find((s) => s.id === sel.sessionId) ?? null);
        } catch (e) {
            setError(ErrorUtils.getErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    // One write at a time, then a full reload so the list and the counters match the server
    const act = async (run: () => Promise<unknown>) => {
        if (busy) return;
        setBusy(true);
        try {
            await run();
        } catch (e) {
            Alert.alert('Could not update', ErrorUtils.getErrorMessage(e));
        } finally {
            setBusy(false);
            await load();
        }
    };

    const onAction = (order: DeliveryOrder, action: OrderAction) => {
        const id = order.order_id;
        if (action === 'failed') {
            setFailing(order);
        } else if (action === 'delivered') {
            setConfirm({
                title: 'Mark as Delivered?',
                message: `Order ID: ${id}`,
                // not 'Delivered': that is also a filter chip label on this screen
                confirmText: 'Yes, delivered',
                run: async () => {
                    await deliveryService.markDelivered(id);
                    if (order.payment_status === 'pending') setAskPaid(order);
                },
            });
        } else {
            setConfirm({
                title: action === 'paid' ? 'Mark as Paid?' : 'Mark as Unpaid?',
                message: `Order ID: ${id}`,
                confirmText: action === 'paid' ? 'Paid' : 'Unpaid',
                run: () => deliveryService.setPayment(id, action),
            });
        }
    };

    const onStart = () => {
        if (!selection) return;
        setConfirm({
            title: 'Start delivery?',
            message: `Waiting orders in ${selection.area} will be marked "On the way" and their customers notified.`,
            confirmText: 'Start',
            run: async () => {
                const result = await deliveryService.startDelivery({ area_id: selection.areaId, meal_time: selection.mealTime });
                Alert.alert('Delivery started', result.message);
            },
        });
    };

    const shown = visibleOrders(orders, filter, search);
    const canStart = session?.state === 'closed' && !busy;

    const renderOrder = ({ item }: { item: DeliveryOrder }) => (
        <View testID={`order-${item.order_id}`} style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderIdText}>Order ID: {item.order_id}</Text>
                <Text style={styles.badge}>{STATUS_LABEL[item.status]}</Text>
            </View>
            <Text style={styles.customerNameText}>Customer: {item.customer_name || 'N/A'}</Text>
            <Text style={styles.customerInfo}>Phone: {item.customer_phone || 'N/A'}</Text>
            <Text style={styles.customerInfo}>Address: {item.customer_address || 'N/A'}</Text>
            {item.items.map((orderItem, index) => (
                <Text key={index} style={styles.itemText}>{orderItem.food_name} × {orderItem.quantity}</Text>
            ))}
            <Text style={styles.customerInfo}>Parcels: {parcelsOf(item)}</Text>
            <Text style={styles.priceText}>Price : {formatRs(item.total_price)}</Text>
            {item.status === 'delivery_failed' && item.failure_reason ? (
                <Text style={styles.customerInfo}>Reason: {item.failure_reason}</Text>
            ) : null}
            <View style={styles.paymentRow}>
                {orderActions(item).map((action) => (
                    <TouchableOpacity
                        key={action}
                        accessibilityRole="button"
                        disabled={busy}
                        style={[styles.actionButton, styles[action]]}
                        onPress={() => onAction(item, action)}
                    >
                        <Text style={action === 'unpaid' ? styles.unpaidText : styles.actionText}>{ACTION_LABEL[action]}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (isLoading && orders.length === 0 && !error) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color="#69bf70" />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>RC FoodService</Text>
                <Text style={styles.title}>Active Orders{selection ? ` - ${selection.area}` : ''}</Text>
                {selection ? (
                    <Text style={styles.sessionText}>
                        {capitalize(selection.mealTime)}{session ? ` · ${SESSION_STATE[session.state]}` : ''}
                    </Text>
                ) : null}

                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search orders"
                        placeholderTextColor="#888"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={styles.chipRow}>
                    {FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f.key}
                            accessibilityRole="button"
                            accessibilityState={{ selected: filter === f.key }}
                            style={[styles.chip, filter === f.key && styles.chipActive]}
                            onPress={() => setFilter(f.key)}
                        >
                            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {needsStart(orders) ? (
                    <View style={styles.startRow}>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !canStart }}
                            disabled={!canStart}
                            style={[styles.startButton, !canStart && styles.startDisabled]}
                            onPress={onStart}
                        >
                            <Text style={styles.startText}>Start delivery</Text>
                        </TouchableOpacity>
                        {session?.state !== 'closed' ? <Text style={styles.startCaption}>Available after ordering closes</Text> : null}
                    </View>
                ) : null}

                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity accessibilityRole="button" onPress={load} style={styles.retryButton}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {shown.length === 0 && !error ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders here</Text>
                    </View>
                ) : (
                    <FlatList
                        data={shown}
                        keyExtractor={(item) => item.order_id}
                        renderItem={renderOrder}
                        contentContainerStyle={{ paddingBottom: 220 }}
                        showsVerticalScrollIndicator={false}
                        refreshing={isLoading}
                        onRefresh={load}
                    />
                )}
            </View>

            {summary ? (
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryLine}>To deliver: {summary.to_deliver.orders} orders · {summary.to_deliver.parcels} parcels</Text>
                    <Text style={styles.summaryLine}>Delivered: {summary.delivered.orders} orders · {summary.delivered.parcels} parcels</Text>
                    <Text style={styles.summaryLine}>Collected: {formatRs(summary.collected.amount)}</Text>
                    <Text style={styles.summaryLine}>Unpaid: {summary.unpaid.orders} orders · {formatRs(summary.unpaid.amount)}</Text>
                </View>
            ) : null}

            <CancelModal
                visible={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                confirmText={confirm?.confirmText}
                cancelText="Back"
                onClose={() => setConfirm(null)}
                onConfirm={() => {
                    const c = confirm;
                    setConfirm(null);
                    if (c) act(c.run);
                }}
            />

            <CancelModal
                visible={!!askPaid}
                title="Was it paid?"
                message={askPaid ? `Order ID: ${askPaid.order_id} · ${formatRs(askPaid.total_price)}` : ''}
                confirmText="Paid"
                cancelText="Not paid"
                onRequestClose={() => setAskPaid(null)}
                onConfirm={() => {
                    const o = askPaid;
                    setAskPaid(null);
                    if (o) act(() => deliveryService.setPayment(o.order_id, 'paid'));
                }}
                onClose={() => {
                    const o = askPaid;
                    setAskPaid(null);
                    if (o) act(() => deliveryService.setPayment(o.order_id, 'unpaid'));
                }}
            />

            <FailReasonModal
                visible={!!failing}
                orderId={failing?.order_id ?? ''}
                onCancel={() => setFailing(null)}
                onSubmit={(reason) => {
                    const o = failing;
                    setFailing(null);
                    if (o) act(() => deliveryService.markFailed(o.order_id, reason));
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    header: { fontSize: 30, fontWeight: 'bold', marginBottom: 24, color: '#000' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#69bf70', marginBottom: 4 },
    sessionText: { fontSize: 14, color: '#555', marginBottom: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12 },
    searchInput: { marginLeft: 10, fontSize: 16, flex: 1, color: '#000' },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
    chipActive: { backgroundColor: '#69bf70' },
    chipText: { color: '#333', fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    startRow: { marginBottom: 12 },
    startButton: { backgroundColor: '#000', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    startDisabled: { opacity: 0.35 },
    startText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    startCaption: { marginTop: 6, color: '#666', textAlign: 'center' },
    orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    orderIdText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
    badge: { fontSize: 12, fontWeight: '700', color: '#69bf70' },
    customerNameText: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 6 },
    customerInfo: { fontSize: 12, color: '#666', marginVertical: 1 },
    itemText: { fontSize: 14, color: '#000', marginVertical: 1 },
    priceText: { fontSize: 14, fontWeight: 'bold', color: 'green', marginTop: 8 },
    paymentRow: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 10, gap: 8 },
    actionButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    delivered: { backgroundColor: '#69bf70' },
    failed: { backgroundColor: '#d63031' },
    paid: { backgroundColor: '#000' },
    unpaid: { backgroundColor: '#ccc' },
    actionText: { color: '#fff', fontWeight: '600' },
    unpaidText: { color: '#000', fontWeight: '600' },
    summaryContainer: { position: 'absolute', bottom: 110, left: 14, right: 24, backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
    summaryLine: { fontSize: 15, fontWeight: '600', color: '#000', marginVertical: 2 },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#666', textAlign: 'center' },
    errorContainer: { backgroundColor: '#ffe6e6', padding: 15, borderRadius: 8, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    errorText: { color: '#d63031', flex: 1, marginRight: 10 },
    retryButton: { backgroundColor: '#ff6b6b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    retryText: { color: 'white', fontSize: 12, fontWeight: '600' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
});

export default HomeScreen;
