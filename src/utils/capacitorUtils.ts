/**
 * Centralized Capacitor utilities with safe access patterns.
 * Uses static ESM import — `require` is not available in the Vite/WebView ESM bundle.
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if running on a native platform (iOS/Android).
 */
export const isNativePlatform = (): boolean => {
  try {
    return Capacitor?.isNativePlatform?.() ?? false;
  } catch (error) {
    console.error('CapacitorUtils: isNativePlatform check failed:', error);
    return false;
  }
};

/**
 * Get the current platform.
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  try {
    return (Capacitor?.getPlatform?.() ?? 'web') as 'ios' | 'android' | 'web';
  } catch (error) {
    console.error('CapacitorUtils: getPlatform check failed:', error);
    return 'web';
  }
};

/**
 * Resolve once we know whether we're on a native platform.
 * The Capacitor singleton is available synchronously when the JS bundle runs
 * inside the WebView, so no polling is needed.
 */
export const waitForCapacitor = async (_timeoutMs: number = 1000): Promise<boolean> => {
  return isNativePlatform();
};

/**
 * Safe wrapper for executing native-only code with an automatic fallback.
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
