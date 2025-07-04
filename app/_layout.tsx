import { View, Text } from 'react-native'
import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import TabsLayout from './(tabs)/_layout'



const  RootLayout = () => {
  const [isLoggedIn,setisLoggedIn] = useState(false);
  
  return (
   
    <>
    {isLoggedIn ? (
      <><TabsLayout />
      <Stack.Screen name="(routes)/area-selection/index" /></>
    ) : (
      <Stack screenOptions={{headerShown: false}}>
          <Stack.Screen name="index" />
         
          <Stack.Screen name="(routes)/login/index" />
         
         
      </Stack>
   
    )}
    </> 
  )
}

export default  RootLayout