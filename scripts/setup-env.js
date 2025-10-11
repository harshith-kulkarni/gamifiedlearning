/**
 * Environment Setup Script
 * Ensures proper environment configuration for new developers
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateSecureSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function setupEnvironment() {
  console.log('🔧 Setting up environment configuration...');
  
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env.local already exists
  if (fs.existsSync(envLocalPath)) {
    console.log('ℹ️  .env.local already exists');
    
    // Validate existing .env.local
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const requiredVars = [
      'GEMINI_API_KEY',
      'MONGODB_URI',
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'NEXTAUTH_URL'
    ];
    
    const missingVars = requiredVars.filter(varName => 
      !envContent.includes(`${varName}=`) || 
      envContent.includes(`${varName}=your_`) ||
      envContent.includes(`${varName}=your-`)
    );
    
    if (missingVars.length > 0) {
      console.log('⚠️  Missing or incomplete environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('\n📝 Please update your .env.local file with proper values');
      console.log('   Refer to .env.example for the required format');
    } else {
      console.log('✅ Environment variables are properly configured');
    }
    
    return;
  }
  
  // Create .env.local from .env.example
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example not found');
    return;
  }
  
  let envTemplate = fs.readFileSync(envExamplePath, 'utf8');
  
  // Generate secure secrets
  const nextAuthSecret = generateSecureSecret();
  const jwtSecret = generateSecureSecret();
  
  // Replace placeholders with generated values
  envTemplate = envTemplate
    .replace('your-nextauth-secret-here-minimum-32-characters', nextAuthSecret)
    .replace('your-jwt-secret-here-minimum-32-characters', jwtSecret);
  
  // Write .env.local
  fs.writeFileSync(envLocalPath, envTemplate);
  
  console.log('✅ Created .env.local with secure generated secrets');
  console.log('⚠️  IMPORTANT: You still need to configure:');
  console.log('   - GEMINI_API_KEY: Get from Google AI Studio');
  console.log('   - MONGODB_URI: Get from MongoDB Atlas');
  console.log('\n📖 See README.md for detailed setup instructions');
}

setupEnvironment();