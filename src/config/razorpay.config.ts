/**
 * Razorpay Configuration
 * Payment gateway settings for wallet recharge
 *
 * NOTE: The backend creates the Razorpay order using its own credentials.
 * The KEY_ID here is a fallback for opening checkout if backend doesn't return one.
 */

export const RAZORPAY_CONFIG = {
  // Razorpay Key ID - Uses env variable or fallback
  // The actual key should come from the backend's initiateRecharge response
  KEY_ID: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER',

  // Currency
  CURRENCY: 'INR',

  // App Information
  NAME: 'NakshatraTalks',
  DESCRIPTION: 'Wallet Recharge',
  IMAGE: 'https://api.nakshatratalks.com/assets/logo.png', // App logo for checkout

  // Theme
  THEME_COLOR: '#2930A6', // Primary blue color

  // Amount Limits (in INR)
  MIN_AMOUNT: 50,
  MAX_AMOUNT: 50000,

  // Default Recharge Options (fallback if API fails)
  DEFAULT_RECHARGE_OPTIONS: [
    { amount: 50, label: '₹50' },
    { amount: 100, label: '₹100' },
    { amount: 200, label: '₹200' },
    { amount: 500, label: '₹500', isPopular: true },
    { amount: 1000, label: '₹1000' },
    { amount: 2000, label: '₹2000' },
  ],
};

// Error Messages
export const RAZORPAY_ERRORS = {
  PAYMENT_CANCELLED: 'Payment was cancelled',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  VERIFICATION_FAILED: 'Payment verification failed. If amount was deducted, it will be refunded.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_AMOUNT: `Amount must be between ₹${RAZORPAY_CONFIG.MIN_AMOUNT} and ₹${RAZORPAY_CONFIG.MAX_AMOUNT}`,
  ORDER_CREATION_FAILED: 'Failed to create payment order. Please try again.',
};
