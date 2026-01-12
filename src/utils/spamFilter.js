/**
 * Spam Detection Utility
 * Detects spam comments based on various patterns
 */

// NSFW/Abusive keywords (basic list - can be expanded)
const ABUSIVE_KEYWORDS = [
  'spam', 'scam', 'click here', 'buy now', 'free money',
  'viagra', 'casino', 'lottery', 'winner', 'congratulations',
  // Add more as needed
];

// Common spam patterns
const SPAM_PATTERNS = [
  /(http|https|www\.)/gi, // URLs
  /[A-Z]{10,}/g, // Excessive caps
  /(.)\1{5,}/g, // Repeated characters (e.g., "aaaaaa")
];

/**
 * Check if a message is spam
 * @param {String} message - The comment message
 * @param {Array} recentMessages - Array of recent messages from same user
 * @returns {Object} { isSpam: boolean, reason?: string }
 */
const detectSpam = (message, recentMessages = []) => {
  if (!message || typeof message !== 'string') {
    return { isSpam: false };
  }

  const normalizedMessage = message.toLowerCase().trim();

  // Check 1: Excessive length (likely spam)
  if (normalizedMessage.length > 500) {
    return { isSpam: true, reason: 'Message too long' };
  }

  // Check 2: Empty or too short (likely not spam, but invalid)
  if (normalizedMessage.length < 2) {
    return { isSpam: false }; // Let validation handle this
  }

  // Check 3: Abusive/NSFW keywords
  for (const keyword of ABUSIVE_KEYWORDS) {
    if (normalizedMessage.includes(keyword.toLowerCase())) {
      return { isSpam: true, reason: 'Contains prohibited keywords' };
    }
  }

  // Check 4: Spam patterns (URLs, excessive caps, repeated chars)
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(message)) {
      // URLs are suspicious but not always spam
      if (pattern.source.includes('http')) {
        // Allow URLs but flag if multiple
        const urlMatches = message.match(/(http|https|www\.)/gi);
        if (urlMatches && urlMatches.length > 2) {
          return { isSpam: true, reason: 'Multiple URLs detected' };
        }
      } else {
        return { isSpam: true, reason: 'Suspicious pattern detected' };
      }
    }
  }

  // Check 5: Repeated messages (same user posting same thing)
  if (recentMessages && recentMessages.length > 0) {
    const exactMatches = recentMessages.filter(
      msg => msg.toLowerCase().trim() === normalizedMessage
    );
    if (exactMatches.length >= 2) {
      return { isSpam: true, reason: 'Repeated message detected' };
    }
  }

  // Check 6: Too many special characters (likely spam)
  const specialCharCount = (message.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  if (specialCharCount > message.length * 0.5) {
    return { isSpam: true, reason: 'Excessive special characters' };
  }

  // Check 7: Only numbers or only special chars
  if (/^[\d\s]+$/.test(message) || /^[^\w\s]+$/.test(message)) {
    return { isSpam: true, reason: 'Invalid message format' };
  }

  return { isSpam: false };
};

/**
 * Sanitize message (remove potentially dangerous content)
 * @param {String} message - The comment message
 * @returns {String} Sanitized message
 */
const sanitizeMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = message.replace(/<[^>]*>/g, '');

  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }

  return sanitized;
};

module.exports = {
  detectSpam,
  sanitizeMessage,
};

