/**
 * Standardized API Response Handler
 * 
 * Provides consistent response formats for all API endpoints
 * 
 * @module utils/responseHandler
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} errors - Additional error details (optional)
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = new Error().stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {string|Array} errors - Validation error messages
 * @param {number} statusCode - HTTP status code (default: 400)
 */
const sendValidationError = (res, errors, statusCode = 400) => {
  const response = {
    success: false,
    message: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors],
  };

  return res.status(statusCode).json(response);
};

/**
 * Send unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Unauthorized')
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Forbidden')
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, message, 403);
};

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Resource not found')
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, 404);
};

/**
 * Send conflict error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Conflict')
 */
const sendConflict = (res, message = 'Conflict') => {
  return sendError(res, message, 409);
};

/**
 * Handle async errors in route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error(`[${req.method} ${req.path}] Error:`, error);
      sendError(res, error.message || 'Internal Server Error', error.statusCode || 500);
    });
  };
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  asyncHandler,
};

