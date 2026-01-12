// Calculate VIP expiry date based on plan
const calculateVIPExpiry = (plan) => {
  const now = new Date();
  const expiryDate = new Date();

  switch (plan) {
    case 'monthly':
      expiryDate.setMonth(now.getMonth() + 1);
      break;
    case '3months':
      expiryDate.setMonth(now.getMonth() + 3);
      break;
    case 'yearly':
      expiryDate.setFullYear(now.getFullYear() + 1);
      break;
    default:
      return null;
  }

  return expiryDate;
};

// Format date to ISO string
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

// Check if date is today
const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  const checkDate = new Date(date);
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
};

// Sanitize string
const sanitize = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

// Generate random string
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Extract image URL from HTML content
const extractImageFromContent = (html) => {
  if (!html) return null;
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch ? imgMatch[1] : null;
};

// Parse RSS date
const parseRSSDate = (dateString) => {
  try {
    return new Date(dateString);
  } catch (error) {
    return new Date();
  }
};

module.exports = {
  calculateVIPExpiry,
  formatDate,
  isToday,
  paginate,
  sanitize,
  generateRandomString,
  extractImageFromContent,
  parseRSSDate,
};

