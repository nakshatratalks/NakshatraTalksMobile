/**
 * Cache Keys Constants
 * Standardized keys for React Query cache and AsyncStorage persistence
 */

// React Query cache keys (arrays for hierarchical organization)
export const QUERY_KEYS = {
  // User related
  USER_PROFILE: ['user', 'profile'] as const,

  // Astrologers
  TOP_ASTROLOGERS: ['astrologers', 'top-rated'] as const,
  CHAT_ASTROLOGERS: ['astrologers', 'chat', 'available'] as const,
  CALL_ASTROLOGERS: ['astrologers', 'call', 'available'] as const,
  ASTROLOGER_DETAILS: (id: string) => ['astrologers', 'details', id] as const,

  // Live sessions
  LIVE_SESSIONS: ['live', 'sessions'] as const,
  LIVE_SESSION_MESSAGES: (sessionId: string) => ['live', 'sessions', sessionId, 'messages'] as const,

  // Content
  CATEGORIES: ['content', 'categories'] as const,
  SPECIALIZATIONS: ['content', 'specializations'] as const,
  BANNERS: ['content', 'banners'] as const,

  // Wallet
  WALLET_BALANCE: ['wallet', 'balance'] as const,
  WALLET_SUMMARY: ['wallet', 'summary'] as const,
  WALLET_TRANSACTIONS: ['wallet', 'transactions'] as const,
  RECHARGE_OPTIONS: ['wallet', 'recharge-options'] as const,
};

// Type helper for query keys
export type QueryKeyType = typeof QUERY_KEYS[keyof typeof QUERY_KEYS];

// AsyncStorage keys for persistence (strings)
export const STORAGE_KEYS = {
  // Critical data - persisted to survive app restarts
  USER_PROFILE: '@cache_user_profile',
  CATEGORIES: '@cache_categories',
  SPECIALIZATIONS: '@cache_specializations',
  TOP_ASTROLOGERS: '@cache_top_astrologers',

  // Cache metadata
  CACHE_TIMESTAMPS: '@cache_timestamps',
};

// TTL (Time to Live) in milliseconds
export const CACHE_TTL = {
  USER_PROFILE: 1 * 60 * 60 * 1000, // 1 hour
  CATEGORIES: 24 * 60 * 60 * 1000, // 24 hours (static content)
  SPECIALIZATIONS: 24 * 60 * 60 * 1000, // 24 hours (static content)
  TOP_ASTROLOGERS: 30 * 60 * 1000, // 30 minutes

  // React Query stale time
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  GC_TIME: 10 * 60 * 1000, // 10 minutes (garbage collection)
};
