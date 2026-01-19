/**
 * Centralized Capacitor utilities with safe access patterns
 * This module handles the timing issues with Capacitor's native bridge initialization
 */

let cachedPlatform: 'ios' | 'android' | 'web' | null = null;
let cachedIsNative: boolean | null = null;

/**
 * Safely check if running on native platform
 * Returns false if Capacitor is not ready
 */
export const isNativePlatform = (): boolean => {
  if (cachedIsNative !== null) {
    return cachedIsNative;
  }

  try {
    // Dynamic import check - if Capacitor isn't available, return false
    const { Capacitor } = require('@capacitor/core');
    if (Capacitor && typeof Capacitor.isNativePlatform === 'function') {
      cachedIsNative = Capacitor.isNativePlatform();
      return cachedIsNative;
    }
  } catch (error) {
    console.log('CapacitorUtils: Not running on native platform or Capacitor not ready');
  }
  
  cachedIsNative = false;
  return false;
};

/**
 * Safely get the current platform
 * Returns 'web' if Capacitor is not ready
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (cachedPlatform !== null) {
    return cachedPlatform;
  }

  try {
    const { Capacitor } = require('@capacitor/core');
    if (Capacitor && typeof Capacitor.getPlatform === 'function') {
      cachedPlatform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
      return cachedPlatform;
    }
  } catch (error) {
    console.log('CapacitorUtils: Could not get platform, defaulting to web');
  }
  
  cachedPlatform = 'web';
  return 'web';
};

/**
 * Wait for Capacitor to be ready before accessing native features
 * This is critical for Android where the bridge takes time to initialize
 */
export const waitForCapacitor = async (timeoutMs: number = 1000): Promise<boolean> => {
  return new Promise((resolve) => {
    // On web, resolve immediately
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // Check if already ready
    try {
      const { Capacitor } = require('@capacitor/core');
      if (Capacitor && Capacitor.isNativePlatform()) {
        resolve(true);
        return;
      }
    } catch {
      // Not ready yet
    }

    // Wait a bit and check again
    const checkInterval = 50;
    let elapsed = 0;
    
    const interval = setInterval(() => {
      elapsed += checkInterval;
      
      try {
        const { Capacitor } = require('@capacitor/core');
        if (Capacitor && typeof Capacitor.isNativePlatform === 'function') {
          clearInterval(interval);
          resolve(Capacitor.isNativePlatform());
          return;
        }
      } catch {
        // Not ready yet
      }

      if (elapsed >= timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, checkInterval);
  });
};

/**
 * Safe wrapper for executing native-only code
 * Automatically handles errors and provides fallback
 */
export const safeNativeCall = async <T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> => {
  if (!isNativePlatform()) {
    return fallback;
  }

  try {
    return await fn();
  } catch (error) {
    console.error('CapacitorUtils: Native call failed:', error);
    return fallback;
  }
};
