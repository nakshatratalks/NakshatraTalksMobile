/**
 * Call Flow Types
 * Types for the voice call request-accept model
 */

// Call Request Status
export type CallRequestStatus =
  | 'pending'    // Waiting for astrologer response
  | 'accepted'   // Astrologer accepted, ready to connect
  | 'rejected'   // Astrologer rejected
  | 'timeout'    // 60s timeout passed
  | 'cancelled'; // User cancelled

// Queue Entry Status
export type QueueStatus =
  | 'waiting'    // In queue waiting
  | 'notified'   // Turn came, user notified
  | 'expired'    // 10 min timeout
  | 'left';      // User left queue

// Call Session End Reason
export type CallEndReason =
  | 'user_ended'
  | 'astrologer_ended'
  | 'timeout'
  | 'insufficient_balance'
  | 'connection_failed';

// Astrologer Queue Info (public)
export interface QueueInfo {
  queueSize: number;
  estimatedWaitMinutes: number;
  isInCall: boolean;
  canJoinQueue: boolean;
  maxQueueSize: number;
}

// Call Request (User creates this)
export interface CallRequest {
  requestId: string;
  astrologerId: string;
  userId: string;
  status: CallRequestStatus;
  pricePerMinute: number;
  createdAt: string;
  expiresAt: string;
  remainingSeconds: number;
}

// Call Request Response (When astrologer accepts)
export interface CallRequestAcceptedResponse {
  status: 'accepted';
  session: {
    sessionId: string;
    twilioToken: string;
    twilioRoomName: string;
    startTime: string;
    pricePerMinute: number;
  };
}

// Call Request Rejected/Timeout Response
export interface CallRequestRejectedResponse {
  status: 'rejected' | 'timeout';
  message?: string;
}

// Queue Entry
export interface QueueEntry {
  queueId: string;
  astrologerId: string;
  astrologerName?: string;
  astrologerImage?: string;
  position: number;
  status: QueueStatus;
  estimatedWaitMinutes: number;
  expiresAt: string;
  remainingSeconds: number;
  createdAt: string;
}

// Active Call Session
export interface ActiveCallSession {
  sessionId: string;
  astrologerId: string;
  astrologerName: string;
  astrologerImage?: string;
  twilioToken: string;
  twilioRoomName: string;
  startTime: string;
  pricePerMinute: number;
  status: 'active' | 'connecting';
}

// Call Summary (After call ends)
export interface CallSummary {
  sessionId: string;
  astrologerId: string;
  astrologerName: string;
  astrologerImage?: string;
  duration: number;
  durationSeconds: number;
  totalCost: number;
  remainingBalance: number;
  startTime: string;
  endTime: string;
}

// Call Rating Request
export interface CallRatingRequest {
  rating: number; // 1-5
  review?: string;
}

// API Response Types
export interface CreateCallRequestResponse {
  requestId: string;
  astrologerId: string;
  status: CallRequestStatus;
  expiresAt: string;
  remainingSeconds: number;
  pricePerMinute: number;
}

export interface PollCallRequestStatusResponse {
  status: CallRequestStatus;
  session?: {
    sessionId: string;
    twilioToken: string;
    twilioRoomName: string;
    startTime: string;
    pricePerMinute: number;
  };
  message?: string;
}

export interface JoinQueueResponse {
  queueId: string;
  position: number;
  estimatedWaitMinutes: number;
  expiresAt: string;
  remainingSeconds: number;
}

export interface EndCallResponse {
  sessionId: string;
  duration: number;
  durationSeconds: number;
  totalCost: number;
  remainingBalance: number;
}

// Call Screen State
export type CallScreenState =
  | 'calling'    // Ringing, waiting for astrologer
  | 'queue'      // In queue waiting
  | 'connecting' // Astrologer accepted, connecting to Twilio
  | 'active'     // Call in progress
  | 'summary';   // Call ended, showing summary

// Call Screen Props
export interface CallScreenParams {
  astrologer: {
    id: string;
    name: string;
    image: string;
    pricePerMinute: number;
    specialization?: string[];
  };
  // Optional: Resume from existing state
  existingRequestId?: string;
  existingQueueId?: string;
  existingSessionId?: string;
}

// Error Codes specific to Call Flow
export enum CallErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ASTROLOGER_OFFLINE = 'ASTROLOGER_OFFLINE',
  ASTROLOGER_BUSY = 'ASTROLOGER_BUSY',
  ALREADY_IN_QUEUE = 'ALREADY_IN_QUEUE',
  QUEUE_FULL = 'QUEUE_FULL',
  REQUEST_EXPIRED = 'REQUEST_EXPIRED',
  REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
  ALREADY_IN_CALL = 'ALREADY_IN_CALL',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
}
