/**
 * Authentication Hook Usage Example
 * This component demonstrates how to use the useAuth hook in React Native components
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function AuthExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await login({ email, password });
      Alert.alert('Success', `Welcome ${user?.full_name}!`);
    } catch (error) {
      // Error is already handled by the hook and displayed in the error state
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            setEmail('');
            setPassword('');
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#69bf70" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>RC Delivery Authentication</Text>
      
      {!isAuthenticated ? (
        // Login Form
        <View style={styles.loginContainer}>
          <Text style={styles.subtitle}>Delivery Personnel Login</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
                <Text style={styles.clearErrorText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.noteText}>
            Only delivery personnel can access this application
          </Text>
        </View>
      ) : (
        // User Profile
        <View style={styles.profileContainer}>
          <Text style={styles.subtitle}>Welcome Back!</Text>
          
          <View style={styles.userInfo}>
            <Text style={styles.userInfoLabel}>Name:</Text>
            <Text style={styles.userInfoValue}>{user?.full_name}</Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userInfoLabel}>Email:</Text>
            <Text style={styles.userInfoValue}>{user?.email}</Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userInfoLabel}>Role:</Text>
            <Text style={styles.userInfoValue}>{user?.role}</Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userInfoLabel}>Phone:</Text>
            <Text style={styles.userInfoValue}>{user?.phone}</Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userInfoLabel}>Status:</Text>
            <Text style={[
              styles.userInfoValue,
              { color: user?.approved ? '#69bf70' : '#ff6b6b' }
            ]}>
              {user?.approved ? 'Approved' : 'Pending Approval'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Debug Information */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>
          Authenticated: {isAuthenticated ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.debugText}>
          Loading: {isLoading ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.debugText}>
          User ID: {user?.id || 'None'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  loginContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#69bf70',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  errorText: {
    color: '#d63031',
    fontSize: 14,
  },
  clearErrorButton: {
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  clearErrorText: {
    color: '#74b9ff',
    fontSize: 12,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfoLabel: {
    fontWeight: '600',
    color: '#333',
    width: 80,
  },
  userInfoValue: {
    flex: 1,
    color: '#666',
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  debugTitle: {
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});
