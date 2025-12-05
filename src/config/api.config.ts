// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.nakshatratalks.com', // Production API URL (fixed)
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

  // Astrologers (API v2.0.0)
  ASTROLOGERS: {
    LIVE: '/api/v1/astrologers/live',
    TOP_RATED: '/api/v1/astrologers/top-rated',
    DETAILS: (id: string) => `/api/v1/astrologers/${id}`,
    SEARCH: '/api/v1/astrologers/search', // Updated endpoint for advanced search
    AVAILABLE: '/api/v1/astrologers/available', // Get available astrologers
    REVIEWS: (id: string) => `/api/v1/astrologers/${id}/reviews`,
    FOLLOW: (id: string) => `/api/v1/astrologers/${id}/follow`,
    UNFOLLOW: (id: string) => `/api/v1/astrologers/${id}/unfollow`,
    // Photo Gallery (API v2.0.0)
    PHOTOS: (id: string) => `/api/v1/astrologers/${id}/photos`,
    PHOTO_DELETE: (id: string, photoId: string) => `/api/v1/astrologers/${id}/photos/${photoId}`,
    PHOTO_REORDER: (id: string) => `/api/v1/astrologers/${id}/photos/reorder`,
    // Statistics (API v2.0.0)
    STATS: (id: string) => `/api/v1/astrologers/${id}/stats`,
    // Availability Management (API v2.0.0)
    TOGGLE_AVAILABILITY: (id: string) => `/api/v1/astrologers/${id}/toggle-availability`,
    TOGGLE_CHAT_AVAILABILITY: (id: string) => `/api/v1/astrologers/${id}/toggle-chat-availability`,
    TOGGLE_CALL_AVAILABILITY: (id: string) => `/api/v1/astrologers/${id}/toggle-call-availability`,
    // Working Hours (API v2.0.0)
    WORKING_HOURS: (id: string) => `/api/v1/astrologers/${id}/working-hours`,
  },

  // Wallet
  WALLET: {
    BALANCE: '/api/v1/wallet/balance',
    SUMMARY: '/api/v1/wallet/summary',
    RECHARGE_OPTIONS: '/api/v1/wallet/recharge-options',
    RECHARGE_INITIATE: '/api/v1/wallet/recharge/initiate',
    RECHARGE_VERIFY: '/api/v1/wallet/recharge/verify',
    RECHARGE: '/api/v1/wallet/recharge', // Legacy endpoint
    TRANSACTIONS: '/api/v1/wallet/transactions',
    RECHARGES: '/api/v1/wallet/recharges',
    PENDING_ORDERS: '/api/v1/wallet/orders/pending',
    CANCEL_ORDER: (orderId: string) => `/api/v1/wallet/orders/${orderId}/cancel`,
  },

  // Content
  CONTENT: {
    CATEGORIES: '/api/v1/categories',
    BANNERS: '/api/v1/banners',
    SPECIALIZATIONS: '/api/v1/specializations',
  },

  // Feedback
  FEEDBACK: '/api/v1/feedback',

  // Chat
  CHAT: {
    AVAILABLE_ASTROLOGERS: '/api/v1/chat/astrologers/available',
    VALIDATE_BALANCE: '/api/v1/chat/validate-balance',
    SESSIONS: '/api/v1/chat/sessions',
    ACTIVE_SESSION: '/api/v1/chat/sessions/active',
    END_SESSION: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/end`,
    MESSAGES: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/messages`,
    RATING: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/rating`,
  },

  // Call
  CALL: {
    AVAILABLE_ASTROLOGERS: '/api/v1/call/astrologers',
    SPECIALIZATIONS: '/api/v1/call/specializations',
    VALIDATE_BALANCE: '/api/v1/call/validate-balance',
    SESSIONS: '/api/v1/call/sessions',
    ACTIVE_SESSION: '/api/v1/call/sessions/active',
    END_SESSION: (sessionId: string) => `/api/v1/call/sessions/${sessionId}/end`,
    SESSION_DETAILS: (sessionId: string) => `/api/v1/call/sessions/${sessionId}`,
    RATING: (sessionId: string) => `/api/v1/call/sessions/${sessionId}/rating`,
    // Call Request Flow
    REQUEST: '/api/v1/call/request',
    PENDING_REQUEST: '/api/v1/call/request/pending',
    REQUEST_STATUS: (requestId: string) => `/api/v1/call/request/${requestId}/status`,
    CANCEL_REQUEST: (requestId: string) => `/api/v1/call/request/${requestId}/cancel`,
    // Queue
    QUEUE_JOIN: '/api/v1/call/queue/join',
    QUEUE_STATUS: '/api/v1/call/queue/status',
    QUEUE_POSITION: (astrologerId: string) => `/api/v1/call/queue/${astrologerId}/position`,
    QUEUE_INFO: (astrologerId: string) => `/api/v1/call/queue/${astrologerId}/info`,
    QUEUE_LEAVE: (queueId: string) => `/api/v1/call/queue/${queueId}/leave`,
    QUEUE_CALL_NOW: (queueId: string) => `/api/v1/call/queue/${queueId}/call-now`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/read-all',
  },

  // Live Sessions
  LIVE_SESSIONS: {
    LIST: '/api/v1/live-sessions',
    DETAILS: (sessionId: string) => `/api/v1/live-sessions/${sessionId}`,
    JOIN: (sessionId: string) => `/api/v1/live-sessions/${sessionId}/join`,
    LEAVE: (sessionId: string) => `/api/v1/live-sessions/${sessionId}/leave`,
    MESSAGES: (sessionId: string) => `/api/v1/live-sessions/${sessionId}/messages`,
    SEND_MESSAGE: (sessionId: string) => `/api/v1/live-sessions/${sessionId}/messages`,
    VIEWERS: (sessionId: string) => `/api/v1/live-sessions/${sessionId}/viewers`,
    // Astrologer-side endpoints (for reference)
    CREATE: '/api/v1/live-sessions',
    UPDATE: (sessionId: string) => `/api/v1/live-sessions/${sessionId}`,
    START: (sessionId: string) => `/api/v1/live-sessions/${sessionId}/start`,
    END: (sessionId: string) => `/api/v1/live-sessions/${sessionId}/end`,
  },

  // Daily Horoscope (Public API)
  HOROSCOPE: {
    DAILY: '/api/v1/horoscope/daily',
    SIGNS: '/api/v1/horoscope/signs',
  },

  // Places Search (Public API)
  PLACES: {
    SEARCH: '/api/v1/places/search',
    POPULAR: '/api/v1/places/popular',
    REVERSE: '/api/v1/places/reverse',
  },

  // Kundli (Protected API)
  KUNDLI: {
    GENERATE: '/api/v1/kundli/generate',
    LIST: '/api/v1/kundli/list',
    GET_BY_ID: (kundliId: string) => `/api/v1/kundli/${kundliId}`,
    GET_REPORT: (kundliId: string) => `/api/v1/kundli/${kundliId}/report`,
    UPDATE: (kundliId: string) => `/api/v1/kundli/${kundliId}`,
    DELETE: (kundliId: string) => `/api/v1/kundli/${kundliId}`,
  },

  // Kundli Matching (Protected API)
  MATCHING: {
    GENERATE: '/api/v1/matching/generate',
    LIST: '/api/v1/matching/list',
    GET_BY_ID: (matchingId: string) => `/api/v1/matching/${matchingId}`,
    GET_REPORT: (matchingId: string) => `/api/v1/matching/${matchingId}/report`,
    DELETE: (matchingId: string) => `/api/v1/matching/${matchingId}`,
  },
};
