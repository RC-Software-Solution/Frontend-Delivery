# Delivery Service Integration

## Overview

This document outlines the complete integration of the delivery service with the RC_Delivery React Native app, enabling dynamic order management for delivery personnel in specific areas.

## ✅ Implementation Summary

### 1. Backend Integration

**Delivery Service Endpoint**: `GET http://localhost:4003/api/delivery/orders/area`

**Query Parameters**:
- `area_id` (required): Area ID for orders
- `meal_time` (optional): breakfast, lunch, dinner
- `date` (optional): YYYY-MM-DD format
- `payment_status` (optional): pending, paid, unpaid

**Authentication**: Requires Bearer token in Authorization header

**Sample Request**:
```bash
curl --location 'http://localhost:4003/api/delivery/orders/area?area_id=1&meal_time=dinner&date=2025-09-06&payment_status=pending' \
--header 'Authorization: Bearer [JWT_TOKEN]'
```

**Response Format**:
```json
{
  "message": "Orders retrieved successfully",
  "area_id": 1,
  "meal_time": "dinner",
  "date": "2025-09-06",
  "payment_status": "pending",
  "orders": [
    {
      "id": "order-uuid",
      "order_id": "ORD-12345",
      "customer_id": "customer-uuid",
      "customer_name": "John Doe",
      "customer_address": "123 Main St",
      "area_id": 1,
      "meal_time": "dinner",
      "total_price": 450.00,
      "payment_status": "pending",
      "status": "confirmed",
      "created_at": "2025-01-01T18:00:00Z",
      "items": [
        {
          "food_name": "Chicken Curry",
          "quantity": 2,
          "price": 225.00,
          "meal_type": "non-veg"
        }
      ]
    }
  ],
  "total": 1
}
```

### 2. Frontend Architecture

Following the same pattern as user and location service integration:

```
services/
├── clients/
│   └── delivery-api.client.ts     # HTTP client for delivery API
├── delivery/
│   └── delivery.service.ts        # Business logic and caching
├── types/
│   └── api.types.ts               # Updated with delivery types
└── index.ts                       # Exports delivery service
```

## 🔧 Components Created/Updated

### 1. Delivery API Client (`delivery-api.client.ts`)

```typescript
export class DeliveryApiClient extends BaseApiClient {
  async getAreaOrders(params: GetAreaOrdersRequest): Promise<OrdersResponse>
  async getMyAreaOrders(): Promise<MyAreaOrdersResponse>
  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<UpdateResponse>
}
```

### 2. Delivery Service (`delivery.service.ts`)

**Features**:
- ✅ **Smart Caching**: 2-minute cache for orders (shorter than areas)
- ✅ **Error Handling**: Fallback to cached data on API errors
- ✅ **Payment Updates**: Real-time payment status updates
- ✅ **Auto Date/Time**: Automatic current meal time detection

```typescript
export class DeliveryService {
  async getAreaOrders(params: GetAreaOrdersRequest): Promise<OrdersResponse>
  async getTodaysOrders(areaId: number): Promise<OrdersResponse>
  async updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<UpdateResponse>
  async refreshAreaOrders(params: GetAreaOrdersRequest): Promise<OrdersResponse>
  getCurrentMealTime(): 'breakfast' | 'lunch' | 'dinner'
}
```

### 3. Updated Home Screen (`home.screen.tsx`)

**Enhanced Features**:
- ✅ **Dynamic Loading**: Fetches real orders from delivery API
- ✅ **Area-Based**: Shows orders for selected area only
- ✅ **Real-Time Updates**: Payment status updates with API calls
- ✅ **Search Functionality**: Filter orders by ID, customer, or food items
- ✅ **Pull to Refresh**: Swipe down to refresh orders
- ✅ **Loading States**: Professional loading and error states

## 📱 Updated Home Screen Features

### Before (Static Data):
```typescript
const ordersData: Order[] = [
  { id: '5012', userId: '423', items: [...], price: 580, paid: true }
];
```

### After (Dynamic Data):
```typescript
const [orders, setOrders] = useState<DeliveryOrder[]>([]);
useEffect(() => {
  fetchOrders();
}, [areaId]);

const response = await deliveryService.getTodaysOrders(parseInt(areaId));
setOrders(response.orders);
```

### Key Enhancements:

1. **Area-Specific Orders**: Only shows orders for selected area
2. **Real Order Data**: Customer names, addresses, food items
3. **Payment Management**: Update payment status with backend sync
4. **Smart Filtering**: Search by order ID, customer, or food items
5. **Auto Totals**: Dynamic calculation of quantities and amounts
6. **Error Recovery**: Graceful error handling with retry options

## 🚀 Usage Flow

### 1. Area Selection → Home Screen
```typescript
// Area selection passes area data
router.push({
  pathname: '/(tabs)',
  params: { 
    area: area.area_name,
    areaId: area.area_id.toString()
  },
});

// Home screen receives and uses area data
const { area, areaId } = useLocalSearchParams<Params>();
const response = await deliveryService.getTodaysOrders(parseInt(areaId));
```

### 2. Order Display
- **Real Customer Data**: Names, addresses, phone numbers
- **Food Items**: Detailed item lists with quantities and types
- **Payment Status**: Visual indicators for paid/unpaid/pending
- **Meal Information**: Breakfast, lunch, dinner categorization

### 3. Payment Status Updates
```typescript
const handlePress = async (orderId: string, type: 'paid' | 'unpaid') => {
  await deliveryService.updatePaymentStatus(orderId, type);
  // Local state updates immediately
  // Backend sync in background
};
```

## 🔐 Security & Backend Compatibility

### Authentication
- **JWT Tokens**: Uses delivery person authentication tokens
- **Role Validation**: Backend validates delivery_person role
- **Area Access**: Only shows orders for accessible areas

### API Integration
- **No Backend Changes**: Uses existing delivery service API
- **Query Parameters**: Flexible filtering by area, meal time, date
- **Error Handling**: Comprehensive error states and recovery

## 🎯 Key Features Implemented

### ✅ Core Functionality
1. **Dynamic Order Loading**: Fetches real orders from backend
2. **Area-Based Filtering**: Shows orders for selected area only
3. **Payment Management**: Update payment status with backend sync
4. **Search & Filter**: Find orders by multiple criteria
5. **Real-Time Updates**: Immediate UI updates with backend sync

### ✅ User Experience
1. **Loading States**: Professional loading indicators
2. **Pull to Refresh**: Swipe down to refresh orders
3. **Error Handling**: Clear error messages with retry options
4. **Empty States**: Handles no orders gracefully
5. **Visual Feedback**: Payment status color coding

### ✅ Performance
1. **Smart Caching**: 2-minute cache for orders
2. **Optimistic Updates**: Immediate UI updates
3. **Background Sync**: API calls don't block UI
4. **Efficient Rendering**: FlatList with proper key extraction

## 📋 Data Flow

1. **Area Selection** → User selects area → Navigation with area ID
2. **Home Screen Mount** → `useEffect` → `fetchOrders()`
3. **API Call** → `deliveryService.getTodaysOrders(areaId)`
4. **Backend Query** → Area orders with current meal time & pending status
5. **Data Processing** → Calculate totals, format data
6. **UI Update** → Render orders, update summary
7. **User Interaction** → Payment status updates → Backend sync

## 🧪 Testing Scenarios

### Manual Testing Checklist
- [ ] Orders load correctly for selected area
- [ ] Loading spinner appears during API calls
- [ ] Error states display properly with retry options
- [ ] Payment status updates work (paid/unpaid)
- [ ] Search functionality filters correctly
- [ ] Pull to refresh works
- [ ] Empty state shows when no orders
- [ ] Totals calculate correctly
- [ ] Area name displays in header

### API Integration Tests
- [ ] Correct area_id parameter sent
- [ ] Current meal time detected correctly
- [ ] Today's date sent in correct format
- [ ] Authentication tokens included
- [ ] Payment status updates sync with backend

## 🔧 Configuration

### Backend URL Configuration
Update `services/config/api.config.ts`:
```typescript
export const API_CONFIG = {
  BASE_URLS: {
    DELIVERY_SERVICE: 'http://your-backend-ip:4003/api',
    // ... other services
  },
};
```

### Meal Time Logic
The service automatically detects current meal time:
- **Breakfast**: 6:00 AM - 11:00 AM
- **Lunch**: 11:00 AM - 4:00 PM  
- **Dinner**: 4:00 PM - 6:00 AM (next day)

## 📞 Troubleshooting

### Common Issues

1. **Orders not loading**:
   - Check backend URL in `api.config.ts`
   - Verify delivery service is running on port 4003
   - Ensure area ID is being passed correctly

2. **Authentication errors**:
   - Confirm user is logged in as delivery_person
   - Check token expiration
   - Verify Bearer token format

3. **Payment updates failing**:
   - Check network connectivity
   - Verify order ID format
   - Check backend payment status validation

### Debug Information

The home screen logs detailed information:
- `🚚 Fetching orders for area: [name] (ID: [id])`
- `✅ Loaded X orders for area [name]`
- `❌ Failed to fetch orders: [error]`
- `🚚 Updating payment status for order [id] to [status]`

## 🎯 Next Steps (Optional Enhancements)

1. **Real-Time Updates**: WebSocket integration for live order updates
2. **Order Status**: Update order status (preparing, ready, delivered)
3. **Delivery Routes**: Optimize delivery routes for multiple orders
4. **Customer Communication**: Call/SMS integration for customer contact
5. **Offline Support**: Cache orders for offline viewing
6. **Analytics**: Track delivery performance and payment collection

---

**Implementation Status: ✅ COMPLETE**

The delivery service integration is fully implemented and provides:
- ✅ Dynamic order loading from backend API
- ✅ Area-specific order filtering
- ✅ Real-time payment status updates
- ✅ Professional user interface with loading states
- ✅ Comprehensive error handling and recovery
- ✅ Search and filter functionality
- ✅ Pull-to-refresh and auto-refresh capabilities

The home screen now displays real orders for the selected area and allows delivery personnel to manage payment status effectively!
