import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Image } from 'react-native'
import { TabBar } from '@/components/tabBar/tabBar'

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <TabBar {...props} />}>  
    <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
    <Tabs.Screen name="pendingPayments/index" options={{ title: 'Orders', headerShown: false  }} />
  
</Tabs>
  )
}