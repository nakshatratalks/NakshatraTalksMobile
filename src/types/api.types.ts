// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: Pagination;
  error?: ApiError;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Pagination
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// User Model
export interface User {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  profileImage?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  timeOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | null;
  walletBalance?: number;
  role: 'user' | 'astrologer' | 'admin';
  isActive?: boolean;
  app_metadata?: any;
  user_metadata?: any;
  aud?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

// User Profile (from /api/v1/users/profile)
export interface UserProfile {
  userId: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  profileImage?: string | null;
  walletBalance: number;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  timeOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | null;
  createdAt: string;
}

// Update Profile Data
export interface UpdateProfileData {
  name?: string;
  email?: string;
  profileImage?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  timeOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
}

// Astrologer Model
export interface Astrologer {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  image: string;
  description?: string | null; // Renamed from 'bio' as per API v2.0.0
  bio?: string | null; // @deprecated - Use 'description' instead (kept for backward compatibility)
  specialization: string[];
  languages: string[];
  experience: number;
  education?: string[];
  pricePerMinute: number;
  rating: number;
  totalCalls: number;
  totalReviews?: number;
  isAvailable: boolean;
  isLive: boolean;
  // Chat & Call specific fields
  chatAvailable?: boolean;
  callAvailable?: boolean;
  chatPricePerMinute?: number;
  callPricePerMinute?: number;
  lastActivityAt?: string | null;
  workingHours?: Record<string, string>;
  nextAvailableAt?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | 'inactive';
  role?: string;
  photos?: string[]; // Optional photo gallery (API v2.0.0)
  reviews?: Review[]; // Reviews with optional userImage (API v2.0.0)
  createdAt?: string;
  updatedAt?: string;
}

// Review Model
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userImage?: string | null;
  astrologerId?: string;
  sessionId?: string;
  rating: number;
  comment?: string | null;
  tags?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

// Category Model
export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Specialization Model
export interface Specialization {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Banner Model
export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  buttonText?: string | null;
  buttonAction?: string | null;
  image?: string | null;
  backgroundColor?: string | null;
  order: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Wallet Balance
export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

// Transaction Model
export interface Transaction {
  id: string;
  userId?: string;
  type: 'recharge' | 'debit' | 'refund';
  amount: number;
  description: string;
  astrologerId?: string | null;
  astrologerName?: string | null;
  sessionId?: string | null;
  duration?: number | null;
  paymentId?: string | null;
  paymentMethod?: string | null;
  status: 'pending' | 'success' | 'failed' | 'completed';
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt: string;
}

// Recharge Data
export interface RechargeData {
  amount: number;
  paymentMethod: string;
  paymentId: string;
}

// Chat Session Model
export interface ChatSession {
  id: string;
  userId?: string;
  astrologerId: string;
  astrologerName?: string;
  sessionType: 'chat' | 'call' | 'video';
  startTime: string;
  endTime?: string | null;
  duration?: number | null;
  pricePerMinute: number;
  totalCost?: number | null;
  status: 'active' | 'completed' | 'cancelled';
  rating?: number | null;
  review?: string | null;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Chat Message Model
export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'user' | 'astrologer';
  message: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: string;
}

// Notification Model
export interface Notification {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  type: 'wallet' | 'chat' | 'promotion' | 'system';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// Feedback Data
export interface FeedbackData {
  name: string;
  email?: string;
  comments: string;
  rating?: number;
  category?: string;
}

// Search Filters
export interface SearchFilters {
  q?: string;
  language?: string;
  languages?: string;
  specialization?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  onlyLive?: boolean;
  sortBy?: 'rating' | 'price_per_minute' | 'experience' | 'total_calls' | 'chat_price_per_minute' | 'call_price_per_minute';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Balance Validation Response
export interface BalanceValidationResponse {
  canStartChat?: boolean;
  canStartCall?: boolean;
  currentBalance: number;
  pricePerMinute: number;
  minimumRequired: number;
  estimatedMinutes?: number;
  shortfall?: number;
}

// Session Creation Data
export interface CreateSessionData {
  astrologerId: string;
  sessionType: 'chat' | 'call' | 'video';
}

// End Session Data
export interface EndSessionData {
  endReason?: 'user_ended' | 'astrologer_ended' | 'timeout' | 'insufficient_balance';
}

// Search Results
export interface SearchResults {
  results: Astrologer[];
  total: number;
  filters: {
    languages: string[];
    specializations: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

// Auth Responses
export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface GetMeResponse {
  success: boolean;
  user: User;
}

// Error Codes
export enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_OTP = 'INVALID_OTP',
  INVALID_RATING = 'INVALID_RATING',

  // Authentication Errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Authorization Errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Resource Errors (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ASTROLOGER_NOT_FOUND = 'ASTROLOGER_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  // Conflict Errors (409)
  CONFLICT = 'CONFLICT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  ALREADY_REVIEWED = 'ALREADY_REVIEWED',

  // Business Logic Errors (400)
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ASTROLOGER_NOT_AVAILABLE = 'ASTROLOGER_NOT_AVAILABLE',
  SESSION_NOT_ACTIVE = 'SESSION_NOT_ACTIVE',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_OTP_REQUESTS = 'TOO_MANY_OTP_REQUESTS',

  // Server Errors (500)
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
