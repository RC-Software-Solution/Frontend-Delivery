import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

import { authService, ErrorUtils } from "@/services";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_700Bold, useFonts } from "@expo-google-fonts/raleway";
import { Entypo, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function LoginScreen() {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [userInfo, setUserInfo] = useState({
    email: "",
    password: "",
  });

  const [required, setRequired] = useState(false);
  const [error, setError] = useState({
    emailError: "",
    passwordError: "",
  });

  const handlePasswordValidation = (value: string) => {
    const password = value;
    const passwordSpecialCharacter = /(?=.*[!@#$%^&*])/;
    const passwordNumber = /(?=.*[0-9])/;
    const passwordEightValue = /(?=.{8,})/;

    if (!passwordSpecialCharacter.test(password)) {
      setError({
        ...error,
        passwordError: "Password must contain at least one special character",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else if (!passwordNumber.test(password)) {
      setError({
        ...error,
        passwordError: "Password must contain at least one number",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else if (!passwordEightValue.test(password)) {
      setError({
        ...error,
        passwordError: "Password must contain at least 8 characters",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else {
      setError({ ...error, passwordError: "" });
      setUserInfo({ ...userInfo, password: value });
    }
  };

  const handleSignIn = async () => {
    const { email, password } = userInfo;

    // Basic validation
    if (email === "" || password === "") {
      setRequired(true);
      return;
    }

    setRequired(false);
    setError({ ...error, passwordError: "" });
    setButtonSpinner(true);

    try {
      console.log("🔐 Attempting login for delivery personnel...");
      
      const response = await authService.login({
        email: email.trim(),
        password,
        fcm_token: "", // You can implement FCM token later
      });

      console.log("✅ Login successful:", response.user.full_name);
      
      // Clear previous session selections and summaries to start fresh
      try {
        const keys = await AsyncStorage.getAllKeys();
        const toRemove = keys.filter(k => 
          k.startsWith('rc_delivery_paid_summary_area_') ||
          k.startsWith('rc_delivery_unpaid_collected_area_') ||
          k === 'rc_selected_area'
        );
        if (toRemove.length) {
          await AsyncStorage.multiRemove(toRemove);
        }
      } catch {}

      // Show success message
      Alert.alert(
        "Login Successful! 🎉", 
        `Welcome back, ${response.user.full_name}!`,
        [
          {
            text: "Continue",
            onPress: () => {
              // Navigate to main delivery app screens
              router.push("/(routes)/area-selection");
            }
          }
        ]
      );

    } catch (error: any) {
      console.error("❌ Login error:", error);
      
      let errorMessage = ErrorUtils.getErrorMessage(error);
      
      // Handle specific delivery app errors
      if (error.message?.includes('delivery personnel')) {
        errorMessage = "Only delivery personnel are allowed to access this application";
      } else if (error.message?.includes('pending approval')) {
        errorMessage = "Your account is pending approval. Please contact support";
      } else if (error.message?.includes('deleted')) {
        errorMessage = "Your account has been deleted. Please contact support";
      } else if (error.message?.includes('Invalid credentials')) {
        errorMessage = "Invalid email or password. Please try again";
      }
      
      setError({ 
        ...error, 
        passwordError: errorMessage 
      });

      // Show error alert for critical errors
      if (errorMessage.includes('delivery personnel') || 
          errorMessage.includes('pending approval') || 
          errorMessage.includes('deleted')) {
        Alert.alert("Access Denied", errorMessage);
      }
      
    } finally {
      setButtonSpinner(false);
    }
  };

  const [fontsLoaded] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
        {/* Logo Text */}
        <Text style={[styles.logoText, { fontFamily: "Raleway_700Bold" }]}>
          RC FoodService
        </Text>

        {/* Circular Image Placeholder */}
        <View style={styles.imageContainer}>
          {/* Replace with your image */}
          <Image
            source={require("@/assets/images/rc.jpg")}
            style={{ width: 250, height: 250, borderRadius: 120 }}
            resizeMode="cover"
          />
        </View>

        {/* Email Input */}
        <Text style={[styles.label, { fontFamily: "Nunito_700Bold" }]}>Email</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          placeholder="Your Email"
          placeholderTextColor="#888"
          value={userInfo.email}
          onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
        />
        {required && !userInfo.email && (
          <View style={styles.errorContainer}>
            <Entypo name="cross" size={18} color="red" />
            <Text style={styles.errorText}>Email is required</Text>
          </View>
        )}

        {/* Password Input */}
        <Text style={[styles.label, { fontFamily: "Nunito_700Bold" }]}>Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="default"
            placeholder="Your Password"
            placeholderTextColor="#888"
            secureTextEntry={!isPasswordVisible}
            value={userInfo.password}
            onChangeText={(text) => setUserInfo({ ...userInfo, password: text })}

          />
          <TouchableOpacity
            style={styles.visibleIcon}
            onPress={() => setPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? (
              <Ionicons name="eye-off-outline" size={20} color="black" />
            ) : (
              <Ionicons name="eye-outline" size={20} color="black" />
            )}
          </TouchableOpacity>
        </View>
        {error.passwordError && (
          <View style={styles.errorContainer}>
            <Entypo name="cross" size={18} color="red" />
            <Text style={styles.errorText}>{error.passwordError}</Text>
          </View>
        )}

        {/* Remember Me and Forgot Password */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
            <Text style={[styles.optionText, { fontFamily: "Nunito_400Regular" }]}>
              Remember me
            </Text>
          </TouchableOpacity>
         
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleSignIn}>
          {buttonSpinner ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={[styles.buttonText, { fontFamily: "Raleway_700Bold" }]}>
              LOGIN
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 30,
    color: "#000",
    marginBottom: 20,
  },
  imageContainer: {
    width: 250,
    height: 250,
    borderRadius: 120,
    backgroundColor: "#D4E9D7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  imagePlaceholder: {
    color: "#888",
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    color: "#000",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  inputContainer: {
    width: "100%",
    position: "relative",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
    marginBottom: 10,
  },
  visibleIcon: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginLeft: 5,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#888",
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#69bf70",
    borderColor: "#69bf70",
  },
  optionText: {
    fontSize: 14,
    color: "#000",
  },
  forgotText: {
    fontSize: 14,
    color: "#800080", // Purple color for the forgot password link
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#69bf70",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});