#!/usr/bin/env node

/**
 * Environment Switcher for Medora Frontend
 * Switches between local and production API configurations
 */

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');

const localConfig = `REACT_APP_USE_API=true              
REACT_APP_API_URL=http://localhost:3000/api/v1
VITE_API_BASE_URL=http://localhost:3000/api/v1
REACT_APP_ENABLE_AI_ANALYSIS=true
REACT_APP_ENABLE_NOTIFICATIONS=true`;

const productionConfig = `REACT_APP_USE_API=true              
REACT_APP_API_URL=https://api.medora.dev/api/v1
VITE_API_BASE_URL=https://api.medora.dev/api/v1
REACT_APP_ENABLE_AI_ANALYSIS=true
REACT_APP_ENABLE_NOTIFICATIONS=true`;

const command = process.argv[2];

if (command === 'local') {
    fs.writeFileSync(envFile, localConfig);
    console.log('✅ Switched to LOCAL development environment');
    console.log('🔗 API URL: http://localhost:3000/api/v1');
    console.log('💡 Make sure your local server is running: cd medora-server && npm start');
} else if (command === 'production') {
    fs.writeFileSync(envFile, productionConfig);
    console.log('✅ Switched to PRODUCTION environment');
    console.log('🔗 API URL: https://api.medora.dev/api/v1');
    console.log('⚠️  Note: Production server must have updated /user/signin endpoint');
} else {
    console.log('🔧 Medora Environment Switcher\n');
    console.log('Usage:');
    console.log('  node switch-env.js local      - Switch to local development');
    console.log('  node switch-env.js production - Switch to production server');
    console.log('\nCurrent configuration:');
    
    if (fs.existsSync(envFile)) {
        const currentConfig = fs.readFileSync(envFile, 'utf8');
        if (currentConfig.includes('localhost')) {
            console.log('📍 Currently using: LOCAL development');
            console.log('🔗 API URL: http://localhost:3000/api/v1');
        } else {
            console.log('📍 Currently using: PRODUCTION');
            console.log('🔗 API URL: https://api.medora.dev/api/v1');
        }
    } else {
        console.log('❌ No .env file found');
    }
}