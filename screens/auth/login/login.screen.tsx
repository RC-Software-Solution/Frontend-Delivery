import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Image } from "react-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";

import { Entypo, Ionicons } from "@expo/vector-icons";
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";

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

  const handleSignIn = () => {
  const { email, password } = userInfo;
  const passwordSpecialCharacter = /(?=.*[!@#$%^&*])/;
  const passwordNumber = /(?=.*[0-9])/;
  const passwordEightValue = /(?=.{8,})/;

  let valid = true;
  let passwordError = "";

  if (email === "" || password === "") {
    setRequired(true);
    return;
  }

  if (!passwordSpecialCharacter.test(password)) {
    passwordError = "Password must contain at least one special character";
    valid = false;
  } else if (!passwordNumber.test(password)) {
    passwordError = "Password must contain at least one number";
    valid = false;
  } else if (!passwordEightValue.test(password)) {
    passwordError = "Password must contain at least 8 characters";
    valid = false;
  }

  if (!valid) {
    setError({ ...error, passwordError });
    return;
  }

  // Proceed if everything is valid
  setError({ ...error, passwordError: "" });
  setRequired(false);
  setButtonSpinner(true);

  setTimeout(() => {
    router.push("/(routes)/area-selection");
    setButtonSpinner(false);
  }, 1000);
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