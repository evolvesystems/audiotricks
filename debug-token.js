// Quick script to test login and get token for debugging
import fetch from 'node-fetch';

const testLogin = async () => {
  try {
    console.log('🔐 Testing login to get valid token...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'john@audiotricks.com',
        password: 'password123'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Login failed:', response.status, error);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Login successful');
    console.log('👤 User:', data.user);
    
    const token = data.token;
    console.log('🎫 Token:', token.substring(0, 20) + '...');
    
    // Test the users API with this token
    console.log('\n📊 Testing users API...');
    const usersResponse = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!usersResponse.ok) {
      const error = await usersResponse.text();
      console.log('❌ Users API failed:', usersResponse.status, error);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log('✅ Users API successful');
    console.log('👥 Users found:', usersData.users?.length || 0);
    console.log('📋 Sample user:', usersData.users?.[0] ? {
      id: usersData.users[0].id,
      username: usersData.users[0].username,
      email: usersData.users[0].email,
      hasCount: !!usersData.users[0]._count
    } : 'No users');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

testLogin();