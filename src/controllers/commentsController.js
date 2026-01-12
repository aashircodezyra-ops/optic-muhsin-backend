/**
 * Comments Controller
 * 
 * Handles all comment-related operations including creation, retrieval, and deletion.
 * Includes spam protection and rate limiting.
 * 
 * @module controllers/commentsController
 */

const Comment = require('../models/Comment');
const User = require('../models/User');
const { detectSpam, sanitizeMessage } = require('../utils/spamFilter');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendNotFound,
  sendConflict,
} = require('../utils/responseHandler');

/**
 * Create a new comment
 * 
 * @route POST /api/comments/create
 * @access Private (requires user authentication)
 * @middleware verifyUserAuth, commentLimiter
 * 
 * @param {Object} req.body - Request body
 * @param {string} req.body.message - Comment message (required, 2-1000 chars)
 * @param {string} [req.body.matchId] - Optional match ID to associate comment with
 * @param {Object} req.user - Authenticated user (from middleware)
 * 
 * @returns {Object} JSON response with success status and comment data
 * @returns {boolean} success - Operation success status
 * @returns {Object} comment - Created comment object
 * @returns {boolean} isSpam - Whether comment was flagged as spam
 * 
 * @example
 * POST /api/comments/create
 * Body: { "message": "Great match!", "matchId": "12345" }
 */
const createComment = async (req, res) => {
  try {
    const { message, matchId } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return sendValidationError(res, 'Message is required');
    }

    if (message.trim().length < 2) {
      return sendValidationError(res, 'Message must be at least 2 characters');
    }

    if (message.length > 1000) {
      return sendValidationError(res, 'Message cannot exceed 1000 characters');
    }

    // Get user info
    const user = await User.findById(userId).select('name email');
    if (!user) {
      console.error(`[CommentsController] User not found: ${userId}`);
      return sendNotFound(res, 'User not found');
    }

    // Sanitize message
    const sanitizedMessage = sanitizeMessage(message);

    // Spam protection: Check if user posted within last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5 * 1000);
    const recentComment = await Comment.findOne({
      userId,
      createdAt: { $gte: fiveSecondsAgo }
    }).sort({ createdAt: -1 });

    if (recentComment) {
      return sendError(res, 'Please wait 5 seconds before posting another comment', 429);
    }

    // Get recent messages from this user for spam detection
    const recentComments = await Comment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('message');

    const recentMessages = recentComments.map(c => c.message);

    // Check for spam
    const spamCheck = detectSpam(sanitizedMessage, recentMessages);

    if (spamCheck.isSpam) {
      // Save as spam but don't show to user
      const spamComment = await Comment.create({
        userId,
        matchId: matchId || null,
        message: sanitizedMessage,
        username: user.name || 'Unknown',
        isSpam: true,
        isFlagged: true,
      });

      console.log(`[CommentsController] Spam detected for user: ${userId}`);
      return sendError(res, 'Your comment looks like spam and was not posted.', 200, { isSpam: true });
    }

    // Create comment
    const comment = await Comment.create({
      userId,
      matchId: matchId || null,
      message: sanitizedMessage,
      username: user.name || 'Unknown',
      isSpam: false,
      isFlagged: false,
    });

    console.log(`[CommentsController] Comment created successfully by user: ${userId}`);
    return sendSuccess(
      res,
      {
        comment: {
          _id: comment._id,
          userId: comment.userId,
          matchId: comment.matchId,
          message: comment.message,
          username: comment.username,
          createdAt: comment.createdAt,
          isSpam: false,
          isFlagged: false,
        },
      },
      'Comment posted successfully',
      201
    );
  } catch (error) {
    console.error('[CommentsController] Error creating comment:', error);
    return sendError(res, error.message || 'Failed to create comment', 500);
  }
};

/**
 * Get list of comments
 * 
 * @route GET /api/comments/list
 * @access Public
 * 
 * @param {string} [req.query.matchId] - Optional match ID to filter comments
 * @param {number} [req.query.limit=50] - Maximum number of comments to return
 * 
 * @returns {Object} JSON response with comments array
 * @returns {boolean} success - Operation success status
 * @returns {Object} data - Response data
 * @returns {Array} data.comments - Array of comment objects
 * @returns {number} count - Number of comments returned
 * 
 * @example
 * GET /api/comments/list?matchId=123&limit=20
 */
const getComments = async (req, res) => {
  try {
    const { matchId, limit = 50 } = req.query;

    const filter = {
      isSpam: false,
      isFlagged: false,
    };

    if (matchId) {
      filter.matchId = matchId;
    }

    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('userId matchId message username likes likedBy reports reportedBy createdAt updatedAt')
      .lean();

    return sendSuccess(
      res,
      {
        comments: comments || [],
        count: comments.length,
      },
      'Comments retrieved successfully'
    );
  } catch (error) {
    console.error('[CommentsController] Error fetching comments:', error);
    return sendError(res, error.message || 'Failed to fetch comments', 500);
  }
};

/**
 * Delete a comment
 * DELETE /api/comments/:id
 * Admin-only (verifyAdminAuth)
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return sendNotFound(res, 'Comment not found');
    }

    await Comment.findByIdAndDelete(id);
    console.log(`[CommentsController] Comment deleted: ${id}`);

    return sendSuccess(res, null, 'Comment deleted successfully');
  } catch (error) {
    console.error('[CommentsController] Error deleting comment:', error);
    return sendError(res, error.message || 'Failed to delete comment', 500);
  }
};

/**
 * Like/Unlike a comment
 * 
 * @route POST /api/comments/:id/like
 * @access Private (requires user authentication)
 * @middleware verifyUserAuth
 * 
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Comment ID
 * @param {Object} req.user - Authenticated user (from middleware)
 * 
 * @returns {Object} JSON response with success status and updated comment
 */
const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!id) {
      return sendValidationError(res, 'Comment ID is required');
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Initialize arrays if they don't exist
    if (!comment.likedBy) {
      comment.likedBy = [];
    }
    if (comment.likes === undefined || comment.likes === null) {
      comment.likes = 0;
    }

    // Check if user already liked (compare as strings to handle ObjectId)
    const userIdStr = userId.toString();
    const isLiked = comment.likedBy.some(
      (likedUserId) => likedUserId.toString() === userIdStr
    );

    if (isLiked) {
      // Unlike: remove user from likedBy array
      comment.likedBy = comment.likedBy.filter(
        (likedUserId) => likedUserId.toString() !== userIdStr
      );
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    } else {
      // Like: add user to likedBy array
      comment.likedBy.push(userId);
      comment.likes = (comment.likes || 0) + 1;
    }

    await comment.save();

    console.log(`[CommentsController] Comment ${isLiked ? 'unliked' : 'liked'}: ${id} by user: ${userId}`);
    return sendSuccess(
      res,
      {
        comment: {
          _id: comment._id,
          likes: comment.likes,
          isLiked: !isLiked,
        },
      },
      isLiked ? 'Comment unliked' : 'Comment liked'
    );
  } catch (error) {
    console.error('[CommentsController] Error liking comment:', error);
    return sendError(res, error.message || 'Failed to like comment', 500);
  }
};

/**
 * Report a comment
 * 
 * @route POST /api/comments/:id/report
 * @access Private (requires user authentication)
 * @middleware verifyUserAuth
 * 
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Comment ID
 * @param {Object} req.user - Authenticated user (from middleware)
 * 
 * @returns {Object} JSON response with success status
 */
const reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!id) {
      return sendValidationError(res, 'Comment ID is required');
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return sendNotFound(res, 'Comment not found');
    }

    // Initialize arrays if they don't exist
    if (!comment.reportedBy) {
      comment.reportedBy = [];
    }
    if (comment.reports === undefined || comment.reports === null) {
      comment.reports = 0;
    }

    // Check if user already reported this comment
    const userIdStr = userId.toString();
    const isReported = comment.reportedBy.some(
      (reportedUserId) => reportedUserId.toString() === userIdStr
    );

    if (isReported) {
      return sendError(res, 'You have already reported this comment', 400);
    }

    // Add user to reportedBy array and increment reports
    comment.reportedBy.push(userId);
    comment.reports = (comment.reports || 0) + 1;

    // Auto-flag if reports reach threshold (e.g., 3 reports)
    if (comment.reports >= 3) {
      comment.isFlagged = true;
    }

    await comment.save();
    console.log(`[CommentsController] Comment reported: ${id} by user: ${userId} (Total reports: ${comment.reports})`);

    return sendSuccess(
      res,
      {
        comment: {
          _id: comment._id,
          reports: comment.reports,
          isFlagged: comment.isFlagged,
        },
      },
      'Comment reported successfully'
    );
  } catch (error) {
    console.error('[CommentsController] Error reporting comment:', error);
    return sendError(res, error.message || 'Failed to report comment', 500);
  }
};

module.exports = {
  createComment,
  getComments,
  deleteComment,
  likeComment,
  reportComment,
};

