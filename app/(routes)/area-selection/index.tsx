import { View, Text } from 'react-native'
import React from 'react'
import AreaSelectionScreen from "../../../screens/area-selection/area-selection.screen";
import {GestureHandlerRootView} from 'react-native-gesture-handler'
export default function Login() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AreaSelectionScreen />
</GestureHandlerRootView>
  )
} 