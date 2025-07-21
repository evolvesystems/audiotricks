/**
 * Debug script to test super admin authentication flow
 */

// Check localStorage token
const token = localStorage.getItem('authToken');
console.log('🔐 Auth Token from localStorage:', token ? 'Present' : 'Not found');

if (token) {
  try {
    // Decode JWT payload (without verifying signature - just for debugging)
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('📄 JWT Payload:', payload);
    console.log('👤 User Role:', payload.role);
    console.log('✅ Is Super Admin?:', payload.role === 'super_admin' || payload.role === 'superadmin');
  } catch (error) {
    console.error('❌ Error decoding JWT:', error);
  }
}

// Test auth context values if in React app
if (window.React) {
  console.log('⚛️ React detected - check auth context values in browser console');
}

// Test API endpoint
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('🌐 /api/auth/me response:', data);
  if (data.user) {
    console.log('👤 Current user role from API:', data.user.role);
    console.log('✅ Is Super Admin from API?:', data.user.role === 'super_admin' || data.user.role === 'superadmin');
  }
})
.catch(error => {
  console.error('❌ Error fetching user data:', error);
});