import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import CancelModal from '@/components/popupmodel/popupModel';


interface OrderItem {
    name: string;
    quantity: number;
}

interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    price: number;
    paid: boolean;
}

const ordersData: Order[] = [
    {
        id: '5012',
        userId: '423',
        items: [
            { name: 'Chicken - Full', quantity: 2 },
            { name: 'Vegetarian - Half', quantity: 1 },
        ],
        price: 580,
        paid: true,
    },
    {
        id: '5012',
        userId: '423',
        items: [
            { name: 'Chicken - Full', quantity: 2 },
            { name: 'Vegetarian - Half', quantity: 1 },
        ],
        price: 580,
        paid: true,
    },
    {
        id: '5012',
        userId: '423',
        items: [
            { name: 'Chicken - Full', quantity: 2 },
            { name: 'Vegetarian - Half', quantity: 1 },
        ],
        price: 580,
        paid: true,
    },
    {
        id: '5012',
        userId: '423',
        items: [
            { name: 'Chicken - Full', quantity: 2 },
            { name: 'Vegetarian - Half', quantity: 1 },
        ],
        price: 580,
        paid: true,
    },
    {
        id: '5012',
        userId: '423',
        items: [
            { name: 'Chicken - Full', quantity: 2 },
            { name: 'Vegetarian - Half', quantity: 1 },
        ],
        price: 580,
        paid: true,
    },
    {
        id: '5012',
        userId: '423',
        items: [
            { name: 'Chicken - Full', quantity: 2 },
            { name: 'Vegetarian - Half', quantity: 1 },
        ],
        price: 580,
        paid: true,
    },
    {
        id: '5012',
        userId: '423',
        items: [
            { name: 'Chicken - Full', quantity: 2 },
            { name: 'Vegetarian - Half', quantity: 1 },
        ],
        price: 580,
        paid: true,
    },

];
type Params = {
    area?: string;
};


;

const HomeScreen = () => {
const [feedbackVisible, setFeedbackVisible] = useState(false);
const [feedbackMessage, setFeedbackMessage] = useState('');

    const { area } = useLocalSearchParams();
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalTitle, setModalTitle] = React.useState('');
    const [modalMessage, setModalMessage] = React.useState('');
    const [onConfirmAction, setOnConfirmAction] = React.useState(() => () => { });
   const handlePress = (type: 'paid' | 'unpaid') => {
  const title = type === 'paid' ? 'Mark as Paid?' : 'Mark as Unpaid?';
  const action = () => {
    setModalVisible(false); // close first modal
    setTimeout(() => {
      setFeedbackMessage(type === 'paid' ? 'Marked as Paid' : 'Marked as Unpaid');
      setFeedbackVisible(true);
      setTimeout(() => setFeedbackVisible(false), 1200);
    }, 300); // short delay to let first modal close
  };

  setModalTitle(title);
  setModalMessage('');
  setOnConfirmAction(() => action);
  setModalVisible(true);
};



    const renderOrder = ({ item }: { item: Order }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderText}>Order ID : {item.id}</Text>
                <Text style={styles.orderText}>User ID : {item.userId}</Text>
            </View>
            {item.items.map((orderItem: OrderItem, index: number) => (
                <Text key={index} style={styles.itemText}>
                    {orderItem.name} - {orderItem.quantity}
                </Text>
            ))}
            <Text style={styles.priceText}>Price : Rs. {item.price.toFixed(2)}</Text>
            <View style={styles.paymentRow}>
                <TouchableOpacity style={styles.unpaidButton} onPress={() => handlePress('unpaid')}>
                    <Text style={styles.unpaidText}>UNPAID</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.paidButton} onPress={() => handlePress('paid')}>
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

                <Text style={styles.pendingText}>Pending Deliveries : 116</Text>

                <FlatList
                    data={ordersData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderOrder}
                    contentContainerStyle={{ paddingBottom: 180 }} // more bottom space
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Fixed Summary ABOVE Tab Bar */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Parcel Quantity:</Text>
                    <Text style={styles.summaryValue}>21</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total:</Text>
                    <Text style={styles.summaryValue}>Rs. 9580.00</Text>
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





export default HomeScreen;
