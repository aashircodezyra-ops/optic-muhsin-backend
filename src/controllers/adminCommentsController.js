const Comment = require('../models/Comment');
const { paginate } = require('../utils/helpers');
const {
  sendSuccess,
  sendError,
  sendNotFound,
} = require('../utils/responseHandler');

/**
 * Get all comments for admin panel
 * GET /api/admin/comments
 * Admin-only (verifyAdminAuth)
 */
const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, filter } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    const query = {};

    // Search by username
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    // Filter by spam/normal
    if (filter === 'spam') {
      query.isSpam = true;
    } else if (filter === 'normal') {
      query.isSpam = false;
    } else if (filter === 'flagged') {
      query.isFlagged = true;
    }

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email')
      .lean();

    const total = await Comment.countDocuments(query);

    console.log(`[AdminCommentsController] Fetched ${comments.length} comments (page ${page})`);
    return sendSuccess(
      res,
      {
        comments: comments || [],
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        count: comments.length,
      },
      'Comments retrieved successfully'
    );
  } catch (error) {
    console.error('[AdminCommentsController] Error fetching comments:', error);
    return sendError(res, error.message || 'Failed to fetch comments', 500);
  }
};

/**
 * Delete a comment
 * DELETE /api/admin/comments/:id
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
    console.log(`[AdminCommentsController] Comment deleted: ${id}`);

    return sendSuccess(res, null, 'Comment deleted successfully');
  } catch (error) {
    console.error('[AdminCommentsController] Error deleting comment:', error);
    return sendError(res, error.message || 'Failed to delete comment', 500);
  }
};

/**
 * Toggle comment approval (unflag/flag)
 * PUT /api/admin/comments/:id/approve
 * Admin-only (verifyAdminAuth)
 */
const toggleCommentApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return sendNotFound(res, 'Comment not found');
    }

    // Toggle isFlagged (unflagging = approving)
    comment.isFlagged = !comment.isFlagged;
    await comment.save();
    console.log(`[AdminCommentsController] Comment ${comment.isFlagged ? 'flagged' : 'approved'}: ${id}`);

    return sendSuccess(
      res,
      { comment },
      comment.isFlagged ? 'Comment flagged' : 'Comment approved'
    );
  } catch (error) {
    console.error('[AdminCommentsController] Error toggling comment approval:', error);
    return sendError(res, error.message || 'Failed to toggle comment approval', 500);
  }
};

module.exports = {
  getAllComments,
  deleteComment,
  toggleCommentApproval,
};
