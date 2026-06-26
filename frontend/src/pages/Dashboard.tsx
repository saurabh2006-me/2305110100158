import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Card, CardContent, Skeleton, Chip } from '@mui/material';
import { NotificationsActive as UnreadIcon, PriorityHigh as PriorityIcon, TrendingUp as TrendingIcon } from '@mui/icons-material';
import { useUnreadCount } from '../hooks/useNotifications';
import { useNotificationStore } from '../store/notificationStore';
import { Log } from '../api/client';

export function Dashboard() {
  const navigate = useNavigate();
  const { isLoading } = useNotificationStore();
  const { data: unreadCount = 0 } = useUnreadCount();

  useEffect(() => {
    Log('frontend', 'info', 'page', 'Dashboard mounted');
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card onClick={() => navigate('/notifications')} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <UnreadIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>Unread Notifications</Typography>
                  <Typography variant="h3">{isLoading ? <Skeleton width={60} /> : unreadCount}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card onClick={() => navigate('/priority')} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PriorityIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>Priority Items</Typography>
                  <Typography variant="h3">{isLoading ? <Skeleton width={60} /> : '—'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>Total This Week</Typography>
                  <Typography variant="h3">{isLoading ? <Skeleton width={60} /> : '—'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}