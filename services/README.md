# RC Delivery Services

This directory contains all the services, API clients, and utilities for the RC Delivery mobile application.

## Architecture

The services follow a layered architecture pattern:

```
services/
├── config/          # API configuration and constants
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (tokens, errors)
├── clients/         # API clients for backend communication
├── auth/            # Authentication service
└── hooks/           # React hooks for state management
```

## Key Features

### 🔐 Authentication with Role Validation
- **Delivery Personnel Only**: Only users with `delivery_person` role can log in
- **Account Status Validation**: Checks for approved and active accounts
- **JWT Token Management**: Automatic token refresh and storage
- **Secure Session Management**: Encrypted local storage of user data

### 📱 React Native Integration
- **useAuth Hook**: Easy-to-use React hook for authentication state
- **AsyncStorage**: Persistent storage for tokens and user data
- **Error Handling**: User-friendly error messages and alerts

### 🌐 Backend Integration
- **User Service**: Authentication, profile management
- **Axios Integration**: HTTP client with interceptors
- **Automatic Retries**: Network error handling and retries

## Usage

### Basic Authentication

```typescript
import { authService } from '@/services';

// Login
try {
  const response = await authService.login({
    email: 'delivery@example.com',
    password: 'password123',
    fcm_token: 'optional-fcm-token'
  });
  console.log('Login successful:', response.user.full_name);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Check authentication status
const isAuth = await authService.isAuthenticated();
const currentUser = await authService.getCurrentUser();
```

### Using the useAuth Hook

```typescript
import { useAuth } from '@/services';

function LoginScreen() {
  const { login, user, isAuthenticated, isLoading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email, password });
      // Navigation handled automatically
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    // Your UI components
  );
}
```

## Security Features

1. **Role-Based Access Control**: Only delivery personnel can access the app
2. **Token Validation**: JWT tokens are validated for expiration
3. **Secure Storage**: Tokens stored securely using AsyncStorage
4. **Account Status Checks**: Validates account approval and active status
5. **Session Management**: Automatic cleanup on logout or errors

## Configuration

Update `services/config/api.config.ts` to match your backend URLs:

```typescript
export const API_CONFIG = {
  BASE_URLS: {
    USER_SERVICE: 'http://your-backend:4001/api',
    // ... other services
  },
  // ... other config
};
```

## Error Handling

The services provide comprehensive error handling:

- **Network Errors**: Automatic retry and user-friendly messages
- **Authentication Errors**: Automatic token cleanup and re-authentication
- **Role Errors**: Specific messages for delivery personnel access
- **Validation Errors**: Server-side validation error display

## Backend Compatibility

This implementation is designed to work with the existing RC backend:

- **User Service**: `/api/users/login`, `/api/users/profile`, etc.
- **Role Validation**: Validates `delivery_person` role from backend
- **Token Format**: Compatible with existing JWT implementation
- **No Backend Changes**: Works with current backend without modifications

## Development Notes

- All API calls include proper error handling and logging
- TypeScript types ensure type safety across the application
- Services are designed as singletons for consistent state management
- React hooks provide reactive state updates for UI components
