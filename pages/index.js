import { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
  Alert
} from '@mui/material';

const NOTIFICATION_TYPES = ['All', 'Event', 'Result', 'Placement'];
const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1
};

const buildApiUrl = ({ limit, page, type }) => {
  const params = new URLSearchParams();
  params.set('limit', limit);
  params.set('page', page);
  if (type && type !== 'All') {
    params.set('notification_type', type);
  }
  return `/api/notifications?${params.toString()}`;
};

const scoreNotification = (notification) => {
  const weight = TYPE_WEIGHT[notification.Type] || 0;
  const timestamp = new Date(notification.Timestamp).getTime();
  return weight * 1e12 + timestamp;
};

const persistReadIds = (ids) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('notification_read_ids', JSON.stringify([...ids]));
};

const loadReadIds = () => {
  if (typeof window === 'undefined') return new Set();
  const raw = window.localStorage.getItem('notification_read_ids');
  return raw ? new Set(JSON.parse(raw)) : new Set();
};

export default function Home() {
  const [tab, setTab] = useState('priority');
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('All');
  const [topN, setTopN] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    setReadIds(loadReadIds());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetch(buildApiUrl({ limit, page, type: filterType }), {
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || `Failed to fetch notifications (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data.notifications) ? data.notifications : [];
        setNotifications(items);
        logEvent('notifications_loaded', { count: items.length, page, limit, filterType });
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message);
          logEvent('notifications_error', { message: fetchError.message });
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [limit, page, filterType, refreshCounter]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !readIds.has(notification.ID)),
    [notifications, readIds]
  );

  const priorityNotifications = useMemo(() => {
    return unreadNotifications
      .slice()
      .sort((a, b) => scoreNotification(b) - scoreNotification(a))
      .slice(0, topN);
  }, [unreadNotifications, topN]);

  const filteredNotifications = useMemo(() => {
    return filterType === 'All'
      ? notifications.slice().sort((a, b) => scoreNotification(b) - scoreNotification(a))
      : notifications
          .filter((notification) => notification.Type === filterType)
          .sort((a, b) => scoreNotification(b) - scoreNotification(a));
  }, [notifications, filterType]);

  const handleMarkRead = (id) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    persistReadIds(next);
    logEvent('mark_read', { notificationId: id });
  };

  const handleRefresh = () => {
    setRefreshCounter((current) => current + 1);
    logEvent('refresh', { page, limit, filterType });
  };

  const handleTabChange = (_, next) => {
    setTab(next);
    logEvent('tab_changed', { tab: next });
  };

  const logEvent = async (action, details) => {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details })
      });
    } catch {
      // Client logging is fire-and-forget; server will handle remote track if available.
    }
  };

  return (
    <>
      <AppBar position="sticky" color="primary" elevation={4}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Campus Notifications Dashboard
          </Typography>
          <Button color="inherit" onClick={handleRefresh} disabled={loading}>
            Refresh
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Paper sx={{ p: { xs: 3, md: 4 }, backgroundImage: 'linear-gradient(180deg, rgba(63,81,181,0.14), transparent)' }} elevation={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Stay on top of campus updates
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  View priority unread notifications first, filter by type, and keep your student community informed with a responsive and mobile-friendly notification dashboard.
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gap: 1, width: '100%', maxWidth: 320 }}>
                <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'success.main' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority logic
                  </Typography>
                  <Typography variant="body2">
                    Placements &gt; Results &gt; Events, sorted with newer items first.
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'info.main' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mobile ready
                  </Typography>
                  <Typography variant="body2">
                    Layout adjusts automatically for phones and tablets.
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }} elevation={2}>
                <Typography variant="h6" gutterBottom>
                  Request settings
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="limit-label">Page size</InputLabel>
                    <Select
                      labelId="limit-label"
                      value={limit}
                      label="Page size"
                      onChange={(event) => setLimit(Number(event.target.value))}
                    >
                      {[10, 20, 30, 50, 100].map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel id="filter-label">Notification type</InputLabel>
                    <Select
                      labelId="filter-label"
                      value={filterType}
                      label="Notification type"
                      onChange={(event) => setFilterType(event.target.value)}
                    >
                      {NOTIFICATION_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    type="number"
                    label="Priority inbox size"
                    value={topN}
                    inputProps={{ min: 1, max: 20 }}
                    onChange={(event) => setTopN(Math.max(1, Number(event.target.value) || 1))}
                  />
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }} elevation={2}>
                <Tabs value={tab} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
                  <Tab value="priority" label="Priority Inbox" />
                  <Tab value="all" label="All Notifications" />
                </Tabs>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
                    <Box>
                      <Typography variant="subtitle1">
                        {tab === 'priority' ? `Top ${topN} unread priority notifications` : 'All notifications from the current page'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {unreadNotifications.length} unread • {notifications.length} loaded
                      </Typography>
                    </Box>
                    <Button variant="contained" onClick={handleRefresh} disabled={loading}>
                      Refresh now
                    </Button>
                  </Stack>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Alert severity="error">{error}</Alert>
                  ) : tab === 'priority' ? (
                    priorityNotifications.length === 0 ? (
                      <Alert severity="info">No unread priority notifications available. Try refreshing or adjusting filters.</Alert>
                    ) : (
                      <Stack spacing={2}>
                        {priorityNotifications.map((notification) => (
                          <Card key={notification.ID} variant="outlined" sx={{ p: 2 }}>
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" flexWrap="wrap" spacing={2}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    {notification.Message}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {new Date(notification.Timestamp).toLocaleString()}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={notification.Type}
                                    color={notification.Type === 'Placement' ? 'success' : notification.Type === 'Result' ? 'warning' : 'info'}
                                  />
                                  {!readIds.has(notification.ID) && (
                                    <Button size="small" onClick={() => handleMarkRead(notification.ID)}>
                                      Mark as read
                                    </Button>
                                  )}
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )
                  ) : filteredNotifications.length === 0 ? (
                    <Alert severity="info">No notifications match this filter.</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {filteredNotifications.map((notification) => (
                        <Paper key={notification.ID} sx={{ p: 2, borderLeft: 4, borderColor: readIds.has(notification.ID) ? 'divider' : 'primary.main' }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {notification.Message}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {new Date(notification.Timestamp).toLocaleString()} • {readIds.has(notification.ID) ? 'Read' : 'Unread'}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={notification.Type}
                                color={notification.Type === 'Placement' ? 'success' : notification.Type === 'Result' ? 'warning' : 'info'}
                              />
                              {!readIds.has(notification.ID) && (
                                <Button size="small" onClick={() => handleMarkRead(notification.ID)}>
                                  Mark as read
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination count={10} page={page} onChange={(_, value) => setPage(value)} color="primary" />
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}
