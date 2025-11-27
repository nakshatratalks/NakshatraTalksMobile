/**
 * useCallHistoryData Hook
 * Fetches user's call history with astrologers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { callService, astrologerService } from '../services';
import { ChatSession, Astrologer } from '../types/api.types';
import { handleApiError } from '../utils/errorHandler';

// Call history item combining session and astrologer data
export interface CallHistoryItem {
  id: string;
  astrologerId: string;
  astrologerName: string;
  astrologerImage?: string;
  callTime: string;
  endTime?: string;
  duration: number | null;
  totalCost: number | null;
  isOnline: boolean;
  sessionStatus: 'active' | 'completed' | 'cancelled';
  sessionId: string;
  pricePerMinute: number;
}

interface UseCallHistoryDataReturn {
  callHistory: CallHistoryItem[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refetch: () => Promise<void>;
}

export const useCallHistoryData = (): UseCallHistoryDataReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [allCallHistory, setAllCallHistory] = useState<CallHistoryItem[]>([]);

  // Debounce timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Fetch call history from API
   */
  const fetchCallHistory = async (): Promise<CallHistoryItem[]> => {
    try {
      // Get all call sessions (both completed and active)
      const response = await callService.getSessionHistory({
        limit: 50,
        offset: 0,
      });

      const sessions = response.data || [];

      // Filter only call sessions
      const callSessions = sessions.filter(
        (session) => session.sessionType === 'call'
      );

      // Get unique astrologer IDs
      const astrologerIds = [...new Set(callSessions.map((s) => s.astrologerId))];

      // Fetch astrologer details for all unique astrologers
      const astrologerDetailsPromises = astrologerIds.map(async (id) => {
        try {
          const astrologer = await astrologerService.getAstrologerDetails(id);
          return astrologer;
        } catch (err) {
          console.warn(`Failed to fetch astrologer ${id}:`, err);
          return null;
        }
      });

      const astrologerDetails = await Promise.all(astrologerDetailsPromises);
      const astrologerMap = new Map<string, Astrologer>();

      astrologerDetails.forEach((astrologer) => {
        if (astrologer) {
          astrologerMap.set(astrologer.id, astrologer);
        }
      });

      // Create call history items (one per session, not grouped by astrologer)
      const historyItems: CallHistoryItem[] = callSessions.map((session) => {
        const astrologer = astrologerMap.get(session.astrologerId);

        return {
          id: session.id,
          astrologerId: session.astrologerId,
          astrologerName: astrologer?.name || session.astrologerName || 'Unknown',
          astrologerImage: astrologer?.image,
          callTime: session.startTime,
          endTime: session.endTime || undefined,
          duration: session.duration || null,
          totalCost: session.totalCost || null,
          isOnline: astrologer?.callAvailable || astrologer?.isAvailable || false,
          sessionStatus: session.status,
          sessionId: session.id,
          pricePerMinute: session.pricePerMinute,
        };
      });

      // Sort by call time (most recent first)
      historyItems.sort(
        (a, b) =>
          new Date(b.callTime).getTime() - new Date(a.callTime).getTime()
      );

      return historyItems;
    } catch (err: any) {
      console.error('Error fetching call history:', err);
      throw err;
    }
  };

  /**
   * Load call history data
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const history = await fetchCallHistory();
      setAllCallHistory(history);
      setCallHistory(history);
    } catch (err: any) {
      console.error('Error loading call history:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter call history based on search query
   */
  const filterCallHistory = (query: string, history: CallHistoryItem[]) => {
    if (!query.trim()) {
      return history;
    }

    const lowerQuery = query.toLowerCase();
    return history.filter((item) =>
      item.astrologerName.toLowerCase().includes(lowerQuery)
    );
  };

  /**
   * Handle search query change with debouncing
   */
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer (300ms debounce for local filtering)
      debounceTimer.current = setTimeout(() => {
        const filtered = filterCallHistory(query, allCallHistory);
        setCallHistory(filtered);
      }, 300);
    },
    [allCallHistory]
  );

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadData();

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    callHistory,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refetch: loadData,
  };
};
