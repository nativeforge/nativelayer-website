/**
 * Shared utility functions for scroll and navigation
 */

/**
 * Calculate scroll offset based on CSS variables
 * @returns {number} The offset in pixels
 */
export const getScrollOffset = () => {
  const navHeight = getComputedStyle(document.documentElement).getPropertyValue('--top-bar-height');
  const spaceUnit = getComputedStyle(document.documentElement).getPropertyValue('--space-unit');
  
  const navHeightPx = parseFloat(navHeight) || 48; // fallback
  const spaceUnitPx = parseFloat(spaceUnit) || 8; // fallback
  
  return navHeightPx + (spaceUnitPx * 4);
};

/**
 * Scroll to a heading by its ID
 * @param {string} headingId - The ID of the heading element
 * @param {boolean} smooth - Whether to use smooth scrolling (default: true)
 * @returns {boolean} Whether the scroll was successful
 */
export const scrollToHeadingById = (headingId, smooth = true) => {
  const element = document.getElementById(headingId);
  if (!element) return false;
  
  const offset = getScrollOffset();
  
  const rect = element.getBoundingClientRect();
  const scrollTo = rect.top + window.pageYOffset - offset;
  
  window.scrollTo({
    top: scrollTo,
    behavior: smooth ? 'smooth' : 'instant'
  });
  
  return true;
};

/**
 * Scroll to a heading element directly
 * @param {HTMLElement} element - The heading element
 * @param {boolean} smooth - Whether to use smooth scrolling (default: true)
 * @returns {boolean} Whether the scroll was successful
 */
export const scrollToHeadingElement = (element, smooth = true) => {
  if (!element) return false;
  
  const offset = getScrollOffset();
  
  const rect = element.getBoundingClientRect();
  const scrollTo = rect.top + window.pageYOffset - offset;
  
  window.scrollTo({
    top: scrollTo,
    behavior: smooth ? 'smooth' : 'instant'
  });
  
  return true;
};

/**
 * Update URL hash without triggering navigation
 * @param {string} headingId - The heading ID to set as hash
 */
export const updateUrlHash = (headingId) => {
  const newUrl = `${window.location.pathname}#${headingId}`;
  window.history.pushState({ headingId }, '', newUrl);
};
