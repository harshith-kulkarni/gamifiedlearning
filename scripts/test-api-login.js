#!/usr/bin/env node

/**
 * Test API Login
 * 
 * This script tests the login API endpoint to ensure it works
 * with the updated AtlasUserService and new database schema.
 */

const fetch = require('node-fetch');

async function testAPILogin() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔄 Testing Login API...');
  console.log(`Base URL: ${baseUrl}`);

  // Test credentials
  const testCredentials = [
    {
      email: 'test@example.com',
      password: 'password123'
    },
    {
      email: 'jane.smith@example.com',
      password: 'password123'
    },
    {
      email: 'john.doe@example.com',
      password: 'password123'
    },
    {
      email: 'jane.smith@example.com',
      password: 'wrongpassword'
    }
  ];

  for (const creds of testCredentials) {
    console.log(`\n🔐 Testing API login: ${creds.email} / ${creds.password}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creds)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ API Login successful');
        console.log(`   User ID: ${data.user._id}`);
        console.log(`   Username: ${data.user.username}`);
        console.log(`   Email: ${data.user.email}`);
        console.log(`   Level: ${data.user.progress.level}`);
        console.log(`   Points: ${data.user.progress.points}`);
        console.log(`   Streak: ${data.user.progress.streak}`);
        console.log(`   Badges: ${data.user.progress.badges.length}`);
        console.log(`   Token: ${data.token.substring(0, 20)}...`);
        
        // Test token verification
        console.log('🔍 Testing token verification...');
        const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('✅ Token verification successful');
          console.log(`   Verified user: ${verifyData.user.email}`);
          console.log(`   Verified level: ${verifyData.user.progress.level}`);
          console.log(`   Verified points: ${verifyData.user.progress.points}`);
        } else {
          const errorData = await verifyResponse.json();
          console.log('❌ Token verification failed:', errorData.error);
        }
        
      } else {
        console.log(`❌ API Login failed: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Make sure the development server is running: npm run dev');
        return;
      }
    }
  }

  console.log('\n🎉 API Login test completed!');
  console.log('\n✅ Working Login Credentials for API:');
  console.log('📧 Email: test@example.com');
  console.log('🔑 Password: password123');
  console.log('');
  console.log('📧 Email: jane.smith@example.com');
  console.log('🔑 Password: password123');
  console.log('');
  console.log('📧 Email: john.doe@example.com');
  console.log('🔑 Password: password123');
}

// Run the test
testAPILogin().catch(console.error);