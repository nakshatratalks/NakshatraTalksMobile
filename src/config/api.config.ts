// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.nakshatratalks.com',
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@nakshatra_auth_token',
  REFRESH_TOKEN: '@nakshatra_refresh_token',
  USER_DATA: '@nakshatra_user_data',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    ME: '/auth/me',
  },

  // User
  USER: {
    PROFILE: '/api/v1/users/profile',
  },

  // Astrologers
  ASTROLOGERS: {
    LIVE: '/api/v1/astrologers/live',
    TOP_RATED: '/api/v1/astrologers/top-rated',
    DETAILS: (id: string) => `/api/v1/astrologers/${id}`,
    SEARCH: '/api/v1/search/astrologers',
    REVIEWS: (id: string) => `/api/v1/astrologers/${id}/reviews`,
  },

  // Wallet
  WALLET: {
    BALANCE: '/api/v1/wallet/balance',
    RECHARGE: '/api/v1/wallet/recharge',
    TRANSACTIONS: '/api/v1/wallet/transactions',
  },

  // Content
  CONTENT: {
    CATEGORIES: '/api/v1/categories',
    BANNERS: '/api/v1/banners',
  },

  // Feedback
  FEEDBACK: '/api/v1/feedback',

  // Chat
  CHAT: {
    SESSIONS: '/api/v1/chat/sessions',
    END_SESSION: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/end`,
    MESSAGES: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/messages`,
    RATING: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/rating`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/read-all',
  },
};
