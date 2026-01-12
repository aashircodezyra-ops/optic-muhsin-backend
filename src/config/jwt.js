const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (userId, role = null, isVIP = false) => {
  const payload = { userId };
  if (role) {
    payload.role = role;
  }
  if (isVIP !== undefined && isVIP !== null) {
    payload.isVIP = isVIP;
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRE,
};

