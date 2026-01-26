/**
 * Amazon Deep Link Utility
 * Attempts to open Amazon app first, falls back to browser if app isn't installed
 */

// Your Amazon affiliate tag - replace with your actual tag
const AMAZON_AFFILIATE_TAG = 'adultinghand-20';

/**
 * Generate Amazon search URL with affiliate tag
 */
export const generateAmazonSearchUrl = (itemName: string): string => {
  const searchQuery = encodeURIComponent(itemName);
  return `https://www.amazon.com/s?k=${searchQuery}&tag=${AMAZON_AFFILIATE_TAG}`;
};

/**
 * Generate Amazon app deep link URI
 */
export const generateAmazonAppUri = (itemName: string): string => {
  const searchQuery = encodeURIComponent(itemName);
  // Amazon app deep link format for search
  return `com.amazon.mobile.shopping://amazon.com/s?k=${searchQuery}&tag=${AMAZON_AFFILIATE_TAG}`;
};

/**
 * Attempt to open Amazon app, fallback to browser
 * On mobile, tries the Amazon app first. If it fails or times out, opens in browser.
 */
export const openAmazonLink = (itemName: string): void => {
  const webUrl = generateAmazonSearchUrl(itemName);
  const appUri = generateAmazonAppUri(itemName);
  
  // Check if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try to open the Amazon app
    const appWindow = window.open(appUri, '_blank');
    
    // Set a timeout to fallback to web if app doesn't open
    const timeout = setTimeout(() => {
      // If the app didn't open, redirect to web
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }, 1500);
    
    // If we're still on the page after trying to open the app,
    // the app likely isn't installed
    window.addEventListener('blur', () => {
      clearTimeout(timeout);
    }, { once: true });
    
    // Alternative approach using visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(timeout);
      }
    }, { once: true });
  } else {
    // On desktop, just open the web URL
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
};
