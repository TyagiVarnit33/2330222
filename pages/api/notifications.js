const Log = require('../../../logging_middleware/logging.js');

const NOTIFICATIONS_API_URL = 'http://4.224.186.213/evaluation-service/notifications';

async function fetchNotifications(query) {
  const url = new URL(NOTIFICATIONS_API_URL);
  url.searchParams.set('limit', query.limit || '20');
  url.searchParams.set('page', query.page || '1');
  if (query.notification_type) {
    url.searchParams.set('notification_type', query.notification_type);
  }

  const headers = {};
  if (process.env.ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.ACCESS_TOKEN}`;
  }

  const response = await fetch(url.toString(), { headers });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.message || `Remote API error: ${response.status}`;
    throw new Error(message);
  }

  return body;
}

module.exports = async function handler(req, res) {
  try {
    const payload = await fetchNotifications(req.query);
    await Log('api/notifications', 'info', 'notification_app_fe', `Fetched notifications page=${req.query.page || 1} limit=${req.query.limit || 20} type=${req.query.notification_type || 'All'}`);
    res.status(200).json(payload);
  } catch (error) {
    await Log('api/notifications', 'error', 'notification_app_fe', `Notification fetch failed: ${error.message}`);
    res.status(502).json({ message: error.message });
  }
};
