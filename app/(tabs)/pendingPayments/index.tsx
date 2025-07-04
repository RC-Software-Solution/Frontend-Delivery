
import React from 'react'
import PendingPaymentScreen from '@/screens/pendingPayments/pendingPayments.screen'
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const index = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
    <PendingPaymentScreen/>
    </GestureHandlerRootView>
  )
}

export default index