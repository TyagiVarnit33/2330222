const Log = require('../../../logging_middleware/logging.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { action, details } = req.body || {};
    await Log('api/log', 'info', 'notification_app_fe', `User action: ${action} ${JSON.stringify(details || {})}`);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to send log' });
  }
};
