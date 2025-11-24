/**
 * Live Session Types
 * Type definitions for live session features
 */

export interface LiveSession {
  id: string;
  astrologerId: string;
  astrologerName: string;
  astrologerImage: string;
  title: string;
  description?: string;
  viewerCount: number;
  startTime: string;
  endTime?: string | null;
  status: 'scheduled' | 'live' | 'ended';
  thumbnailUrl?: string;
  streamUrl?: string;
  twilioRoomSid?: string;
  twilioRoomName?: string;
  category?: string;
  tags?: string[];
  isFollowing?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LiveSessionMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  type: 'text' | 'emoji' | 'system';
  createdAt: string;
}

export interface LiveSessionViewer {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: string;
  leftAt?: string | null;
  isActive: boolean;
}

export interface CreateLiveSessionData {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  scheduledStartTime?: string;
}

export interface UpdateLiveSessionData {
  title?: string;
  description?: string;
  status?: 'scheduled' | 'live' | 'ended';
  category?: string;
  tags?: string[];
}

export interface JoinLiveSessionResponse {
  session: LiveSession;
  twilioToken?: string;
  streamUrl?: string;
  accessGranted: boolean;
}

export interface SendMessageData {
  message: string;
  type?: 'text' | 'emoji';
}
