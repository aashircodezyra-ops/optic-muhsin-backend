const { notifyVIPUsers, notifySubscribedUsers } = require('../services/oneSignal');
const { translate } = require('../utils/translations');

// Send notification to VIP users
const notifyVIP = async (req, res) => {
  try {
    const { title, message, data } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    const result = await notifyVIPUsers(title, message, data);

    res.json({
      success: result.success,
      message: result.success ? 'Notification sent' : result.message,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Send notification to specific users
const notifyUsers = async (req, res) => {
  try {
    const { playerIds, title, message, data } = req.body;

    if (!playerIds || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Player IDs, title, and message are required',
      });
    }

    const result = await notifySubscribedUsers(playerIds, title, message, data);

    res.json({
      success: result.success,
      message: result.success ? 'Notification sent' : result.message,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

module.exports = {
  notifyVIP,
  notifyUsers,
};

