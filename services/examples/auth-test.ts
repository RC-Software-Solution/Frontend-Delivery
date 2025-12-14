/**
 * Authentication Service Test Examples
 * These examples demonstrate how to use the authentication service
 */

import { authService } from '../index';

// Example 1: Basic Login Flow
export async function testLoginFlow() {
  console.log('🧪 Testing Login Flow...');
  
  try {
    // Test login with delivery person credentials
    const response = await authService.login({
      email: 'delivery@example.com',
      password: 'password123',
      fcm_token: 'optional-fcm-token'
    });
    
    console.log('✅ Login successful:', {
      user: response.user.full_name,
      role: response.user.role,
      approved: response.user.approved,
      status: response.user.status,
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('delivery personnel')) {
      console.log('🚫 Role validation failed - not a delivery person');
    } else if (error.message.includes('pending approval')) {
      console.log('⏳ Account pending approval');
    } else if (error.message.includes('Invalid credentials')) {
      console.log('🔑 Invalid email or password');
    }
    
    throw error;
  }
}

// Example 2: Check Authentication Status
export async function testAuthStatus() {
  console.log('🧪 Testing Authentication Status...');
  
  try {
    const isAuthenticated = await authService.isAuthenticated();
    console.log('🔐 Is Authenticated:', isAuthenticated);
    
    if (isAuthenticated) {
      const currentUser = await authService.getCurrentUser();
      console.log('👤 Current User:', {
        name: currentUser?.full_name,
        email: currentUser?.email,
        role: currentUser?.role,
      });
    }
    
    return isAuthenticated;
  } catch (error) {
    console.error('❌ Auth status check failed:', error);
    return false;
  }
}

// Example 3: Test Role Validation
export async function testRoleValidation() {
  console.log('🧪 Testing Role Validation...');
  
  try {
    // This should fail for non-delivery users
    await authService.login({
      email: 'customer@example.com', // Assuming this is a customer
      password: 'password123'
    });
    
    console.log('⚠️ Unexpected success - role validation may be failing');
  } catch (error: any) {
    if (error.message.includes('delivery personnel')) {
      console.log('✅ Role validation working correctly');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Example 4: Test Token Refresh
export async function testTokenRefresh() {
  console.log('🧪 Testing Token Refresh...');
  
  try {
    const success = await authService.refreshAccessToken();
    console.log('🔄 Token refresh:', success ? 'successful' : 'failed');
    return success;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return false;
  }
}

// Example 5: Test Logout
export async function testLogout() {
  console.log('🧪 Testing Logout...');
  
  try {
    await authService.logout();
    console.log('✅ Logout successful');
    
    // Verify tokens are cleared
    const isAuth = await authService.isAuthenticated();
    console.log('🔐 Is authenticated after logout:', isAuth);
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
  }
}

// Example 6: Complete Authentication Flow Test
export async function runCompleteAuthTest() {
  console.log('🚀 Running Complete Authentication Flow Test...\n');
  
  try {
    // 1. Test initial auth status (should be false)
    console.log('1️⃣ Initial Auth Status:');
    await testAuthStatus();
    console.log('');
    
    // 2. Test login
    console.log('2️⃣ Login Test:');
    await testLoginFlow();
    console.log('');
    
    // 3. Test auth status after login (should be true)
    console.log('3️⃣ Auth Status After Login:');
    await testAuthStatus();
    console.log('');
    
    // 4. Test token refresh
    console.log('4️⃣ Token Refresh Test:');
    await testTokenRefresh();
    console.log('');
    
    // 5. Test logout
    console.log('5️⃣ Logout Test:');
    await testLogout();
    console.log('');
    
    console.log('✅ Complete authentication flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error);
  }
}

// Example 7: Error Handling Test
export async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');
  
  const testCases = [
    {
      name: 'Invalid Credentials',
      credentials: { email: 'wrong@email.com', password: 'wrongpassword' }
    },
    {
      name: 'Empty Email',
      credentials: { email: '', password: 'password123' }
    },
    {
      name: 'Empty Password',
      credentials: { email: 'test@email.com', password: '' }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      await authService.login(testCase.credentials);
      console.log('⚠️ Unexpected success');
    } catch (error: any) {
      console.log(`✅ Expected error: ${error.message}`);
    }
  }
}

// Usage Instructions
console.log(`
📋 Authentication Service Test Examples

To run these tests, import and call the functions:

import { 
  testLoginFlow, 
  testAuthStatus, 
  runCompleteAuthTest 
} from '@/services/examples/auth-test';

// Run individual tests
await testLoginFlow();
await testAuthStatus();

// Run complete flow
await runCompleteAuthTest();

⚠️ Note: Make sure your backend is running and you have valid delivery person credentials!
`);
