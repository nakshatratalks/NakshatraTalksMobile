/**
 * Environment Configuration
 * Manages different API URLs for development and production
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Environment-specific configurations
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:4000', // Local backend server
    WS_BASE_URL: 'ws://localhost:4000',
  },
  staging: {
    API_BASE_URL: 'https://staging-api.nakshatratalks.com',
    WS_BASE_URL: 'wss://staging-api.nakshatratalks.com',
  },
  production: {
    API_BASE_URL: 'https://api.nakshatratalks.com',
    WS_BASE_URL: 'wss://api.nakshatratalks.com',
  },
};

/**
 * Get current environment
 * Default to production for safety
 *
 * To switch environments:
 * 1. Change this return value
 * 2. Or use environment variables in the future (e.g., process.env.NODE_ENV)
 */
const getCurrentEnvironment = (): Environment => {
  // TODO: In production, this should be configured via build-time environment variables
  // For now, manually set the environment here

  // Change this line to switch environments:
  return 'production'; // Options: 'development' | 'staging' | 'production'

  // For automated switching based on build type:
  // return __DEV__ ? 'development' : 'production';
};

// Get current environment config
const currentEnv = getCurrentEnvironment();
export const ENV_CONFIG = environments[currentEnv];

// Export current environment name for debugging
export const CURRENT_ENVIRONMENT = currentEnv;

// Helper to check if running in development
export const isDevelopment = currentEnv === 'development';

// Helper to check if running in production
export const isProduction = currentEnv === 'production';

/**
 * Usage example:
 *
 * import { ENV_CONFIG, CURRENT_ENVIRONMENT } from './environment';
 *
 * console.log('Current Environment:', CURRENT_ENVIRONMENT);
 * console.log('API Base URL:', ENV_CONFIG.API_BASE_URL);
 */
