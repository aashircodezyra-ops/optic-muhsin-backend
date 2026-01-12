const OneSignal = require('onesignal-node');
const User = require('../models/User');

let client = null;

const initializeOneSignal = () => {
  const appId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    console.warn('⚠️ OneSignal credentials not configured');
    return null;
  }

  client = new OneSignal.Client(appId, restApiKey);
  return client;
};

// Initialize on module load
if (!client) {
  initializeOneSignal();
}

const sendNotification = async (playerIds, title, message, data = {}) => {
  try {
    if (!client) {
      console.warn('OneSignal client not initialized');
      return { success: false, message: 'OneSignal not configured' };
    }

    const notification = {
      contents: { en: message },
      headings: { en: title },
      include_player_ids: Array.isArray(playerIds) ? playerIds : [playerIds],
      data: data,
    };

    const response = await client.createNotification(notification);
    return { success: true, response };
  } catch (error) {
    console.error('OneSignal error:', error);
    return { success: false, message: error.message };
  }
};

const notifyVIPUsers = async (title, message, data = {}) => {
  try {
    const vipUsers = await User.find({
      isVIP: true,
      vipExpiryDate: { $gt: new Date() },
      notificationsEnabled: true,
      oneSignalPlayerId: { $ne: null },
    }).select('oneSignalPlayerId');

    const playerIds = vipUsers
      .map(user => user.oneSignalPlayerId)
      .filter(id => id !== null);

    if (playerIds.length === 0) {
      return { success: false, message: 'No VIP users with notifications enabled' };
    }

    return await sendNotification(playerIds, title, message, data);
  } catch (error) {
    console.error('Error notifying VIP users:', error);
    return { success: false, message: error.message };
  }
};

const notifySubscribedUsers = async (playerIds, title, message, data = {}) => {
  if (!playerIds || playerIds.length === 0) {
    return { success: false, message: 'No player IDs provided' };
  }

  return await sendNotification(playerIds, title, message, data);
};

module.exports = {
  initializeOneSignal,
  sendNotification,
  notifyVIPUsers,
  notifySubscribedUsers,
};

