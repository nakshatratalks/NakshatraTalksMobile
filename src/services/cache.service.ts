/**
 * Cache Service
 * Handles AsyncStorage persistence with TTL support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, CACHE_TTL } from '../constants/cacheKeys';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheTimestamps {
  [key: string]: number;
}

class CacheService {
  private timestamps: CacheTimestamps = {};

  /**
   * Initialize cache service - load timestamps
   */
  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMPS);
      if (stored) {
        this.timestamps = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[CacheService] Failed to load timestamps:', error);
      this.timestamps = {};
    }
  }

  /**
   * Save data to AsyncStorage with TTL
   */
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));

      // Update timestamps
      this.timestamps[key] = entry.timestamp;
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHE_TIMESTAMPS,
        JSON.stringify(this.timestamps)
      );
    } catch (error) {
      console.warn(`[CacheService] Failed to set ${key}:`, error);
    }
  }

  /**
   * Get data from AsyncStorage (returns null if expired or not found)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();

      // Check if expired
      if (now - entry.timestamp > entry.ttl) {
        // Data is stale, remove it
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn(`[CacheService] Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * Get data even if expired (for stale-while-revalidate pattern)
   */
  async getStale<T>(key: string): Promise<{ data: T | null; isStale: boolean }> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return { data: null, isStale: true };

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();
      const isStale = now - entry.timestamp > entry.ttl;

      return { data: entry.data, isStale };
    } catch (error) {
      console.warn(`[CacheService] Failed to getStale ${key}:`, error);
      return { data: null, isStale: true };
    }
  }

  /**
   * Remove a cache entry
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      delete this.timestamps[key];
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHE_TIMESTAMPS,
        JSON.stringify(this.timestamps)
      );
    } catch (error) {
      console.warn(`[CacheService] Failed to remove ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      this.timestamps = {};
    } catch (error) {
      console.warn('[CacheService] Failed to clear all:', error);
    }
  }

  /**
   * Check if cache entry exists and is fresh
   */
  async isFresh(key: string): Promise<boolean> {
    const result = await this.getStale(key);
    return result.data !== null && !result.isStale;
  }

  // Convenience methods for specific data types

  async setUserProfile(data: any): Promise<void> {
    await this.set(STORAGE_KEYS.USER_PROFILE, data, CACHE_TTL.USER_PROFILE);
  }

  async getUserProfile<T>(): Promise<T | null> {
    return this.get<T>(STORAGE_KEYS.USER_PROFILE);
  }

  async setCategories(data: any): Promise<void> {
    await this.set(STORAGE_KEYS.CATEGORIES, data, CACHE_TTL.CATEGORIES);
  }

  async getCategories<T>(): Promise<T | null> {
    return this.get<T>(STORAGE_KEYS.CATEGORIES);
  }

  async setSpecializations(data: any): Promise<void> {
    await this.set(STORAGE_KEYS.SPECIALIZATIONS, data, CACHE_TTL.SPECIALIZATIONS);
  }

  async getSpecializations<T>(): Promise<T | null> {
    return this.get<T>(STORAGE_KEYS.SPECIALIZATIONS);
  }

  async setTopAstrologers(data: any): Promise<void> {
    await this.set(STORAGE_KEYS.TOP_ASTROLOGERS, data, CACHE_TTL.TOP_ASTROLOGERS);
  }

  async getTopAstrologers<T>(): Promise<T | null> {
    return this.get<T>(STORAGE_KEYS.TOP_ASTROLOGERS);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
