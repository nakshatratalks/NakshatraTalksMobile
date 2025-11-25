/**
 * Data Prefetch Service
 * Orchestrates background data loading on app startup
 */

import { QueryClient } from '@tanstack/react-query';
import { cacheService } from './cache.service';
import { userService } from './user.service';
import { astrologerService } from './astrologer.service';
import { contentService } from './content.service';
import { chatService } from './chat.service';
import { callService } from './call.service';
import { liveSessionService } from './liveSession.service';
import { QUERY_KEYS } from '../constants/cacheKeys';

export interface PrefetchResult {
  success: boolean;
  loadedFromCache: string[];
  fetchedFresh: string[];
  failed: string[];
  duration: number;
}

class DataPrefetchService {
  private queryClient: QueryClient | null = null;

  /**
   * Set the React Query client reference
   */
  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
  }

  /**
   * Load persisted cache and hydrate React Query
   * Called immediately on app start for instant display
   */
  async hydrateFromCache(): Promise<string[]> {
    const hydratedKeys: string[] = [];

    try {
      // Initialize cache service
      await cacheService.init();

      if (!this.queryClient) {
        console.warn('[Prefetch] QueryClient not set');
        return hydratedKeys;
      }

      // Load user profile from cache
      const userProfile = await cacheService.getUserProfile();
      if (userProfile) {
        this.queryClient.setQueryData(QUERY_KEYS.USER_PROFILE, userProfile);
        hydratedKeys.push('userProfile');
      }

      // Load categories from cache
      const categories = await cacheService.getCategories();
      if (categories) {
        this.queryClient.setQueryData(QUERY_KEYS.CATEGORIES, categories);
        hydratedKeys.push('categories');
      }

      // Load specializations from cache
      const specializations = await cacheService.getSpecializations();
      if (specializations) {
        this.queryClient.setQueryData(QUERY_KEYS.SPECIALIZATIONS, specializations);
        hydratedKeys.push('specializations');
      }

      // Load top astrologers from cache
      const topAstrologers = await cacheService.getTopAstrologers();
      if (topAstrologers) {
        this.queryClient.setQueryData(QUERY_KEYS.TOP_ASTROLOGERS, topAstrologers);
        hydratedKeys.push('topAstrologers');
      }

      console.log('[Prefetch] Hydrated from cache:', hydratedKeys);
    } catch (error) {
      console.warn('[Prefetch] Cache hydration failed:', error);
    }

    return hydratedKeys;
  }

  /**
   * Prefetch all screen data in parallel
   * Called after authentication, runs in background
   */
  async prefetchAllData(): Promise<PrefetchResult> {
    const startTime = Date.now();
    const loadedFromCache: string[] = [];
    const fetchedFresh: string[] = [];
    const failed: string[] = [];

    if (!this.queryClient) {
      console.warn('[Prefetch] QueryClient not set');
      return {
        success: false,
        loadedFromCache,
        fetchedFresh,
        failed: ['all'],
        duration: Date.now() - startTime,
      };
    }

    // Define all prefetch tasks
    const tasks = [
      this.prefetchUserProfile(),
      this.prefetchCategories(),
      this.prefetchSpecializations(),
      this.prefetchTopAstrologers(),
      this.prefetchLiveSessions(),
      this.prefetchChatAstrologers(),
      this.prefetchCallAstrologers(),
    ];

    // Execute all in parallel
    const results = await Promise.allSettled(tasks);

    // Process results
    const taskNames = [
      'userProfile',
      'categories',
      'specializations',
      'topAstrologers',
      'liveSessions',
      'chatAstrologers',
      'callAstrologers',
    ];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.fromCache) {
          loadedFromCache.push(taskNames[index]);
        } else {
          fetchedFresh.push(taskNames[index]);
        }
      } else {
        failed.push(taskNames[index]);
        console.warn(`[Prefetch] Failed to fetch ${taskNames[index]}:`, result.reason);
      }
    });

    const duration = Date.now() - startTime;
    console.log(`[Prefetch] Completed in ${duration}ms`, {
      loadedFromCache,
      fetchedFresh,
      failed,
    });

    return {
      success: failed.length === 0,
      loadedFromCache,
      fetchedFresh,
      failed,
      duration,
    };
  }

  // Individual prefetch methods

  private async prefetchUserProfile(): Promise<{ fromCache: boolean }> {
    try {
      const profile = await userService.getProfile();
      this.queryClient?.setQueryData(QUERY_KEYS.USER_PROFILE, profile);
      await cacheService.setUserProfile(profile);
      return { fromCache: false };
    } catch (error) {
      // Try cache if API fails
      const cached = await cacheService.getUserProfile();
      if (cached) {
        this.queryClient?.setQueryData(QUERY_KEYS.USER_PROFILE, cached);
        return { fromCache: true };
      }
      throw error;
    }
  }

  private async prefetchCategories(): Promise<{ fromCache: boolean }> {
    try {
      const categories = await contentService.getCategories();
      this.queryClient?.setQueryData(QUERY_KEYS.CATEGORIES, categories);
      await cacheService.setCategories(categories);
      return { fromCache: false };
    } catch (error) {
      const cached = await cacheService.getCategories();
      if (cached) {
        this.queryClient?.setQueryData(QUERY_KEYS.CATEGORIES, cached);
        return { fromCache: true };
      }
      throw error;
    }
  }

  private async prefetchSpecializations(): Promise<{ fromCache: boolean }> {
    try {
      const specializations = await contentService.getSpecializations();
      this.queryClient?.setQueryData(QUERY_KEYS.SPECIALIZATIONS, specializations);
      await cacheService.setSpecializations(specializations);
      return { fromCache: false };
    } catch (error) {
      const cached = await cacheService.getSpecializations();
      if (cached) {
        this.queryClient?.setQueryData(QUERY_KEYS.SPECIALIZATIONS, cached);
        return { fromCache: true };
      }
      throw error;
    }
  }

  private async prefetchTopAstrologers(): Promise<{ fromCache: boolean }> {
    try {
      const astrologers = await astrologerService.getTopRatedAstrologers(10);
      this.queryClient?.setQueryData(QUERY_KEYS.TOP_ASTROLOGERS, astrologers);
      await cacheService.setTopAstrologers(astrologers);
      return { fromCache: false };
    } catch (error) {
      const cached = await cacheService.getTopAstrologers();
      if (cached) {
        this.queryClient?.setQueryData(QUERY_KEYS.TOP_ASTROLOGERS, cached);
        return { fromCache: true };
      }
      throw error;
    }
  }

  private async prefetchLiveSessions(): Promise<{ fromCache: boolean }> {
    // Live sessions are real-time, don't persist
    const sessions = await liveSessionService.getLiveSessions();
    this.queryClient?.setQueryData(QUERY_KEYS.LIVE_SESSIONS, sessions);
    return { fromCache: false };
  }

  private async prefetchChatAstrologers(): Promise<{ fromCache: boolean }> {
    // Chat availability is real-time, don't persist
    const astrologers = await chatService.getAvailableAstrologers();
    this.queryClient?.setQueryData(QUERY_KEYS.CHAT_ASTROLOGERS, astrologers);
    return { fromCache: false };
  }

  private async prefetchCallAstrologers(): Promise<{ fromCache: boolean }> {
    // Call availability is real-time, don't persist
    const astrologers = await callService.getAvailableAstrologers();
    this.queryClient?.setQueryData(QUERY_KEYS.CALL_ASTROLOGERS, astrologers);
    return { fromCache: false };
  }

  /**
   * Refresh specific data (called on pull-to-refresh)
   */
  async refreshScreenData(screen: 'home' | 'browseChat' | 'browseCall' | 'liveSession' | 'profile'): Promise<void> {
    switch (screen) {
      case 'home':
        await Promise.all([
          this.prefetchUserProfile(),
          this.prefetchTopAstrologers(),
          this.prefetchLiveSessions(),
          this.prefetchCategories(),
        ]);
        break;
      case 'browseChat':
        await Promise.all([
          this.prefetchChatAstrologers(),
          this.prefetchSpecializations(),
        ]);
        break;
      case 'browseCall':
        await Promise.all([
          this.prefetchCallAstrologers(),
          this.prefetchSpecializations(),
        ]);
        break;
      case 'liveSession':
        await this.prefetchLiveSessions();
        break;
      case 'profile':
        await this.prefetchUserProfile();
        break;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await cacheService.clearAll();
    this.queryClient?.clear();
  }
}

// Export singleton instance
export const prefetchService = new DataPrefetchService();
