import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Chip, Paper, Divider, Skeleton, Alert } from '@mui/material';
import { useQuery } from 'react-query';
import { notificationApi } from '../api/notifications';
import { useNotificationStore } from '../store/notificationStore';
import { Log } from '../api/client';
import type { Notification } from '../types';

export function PriorityInbox() {
  const navigate = useNavigate();
  const { priorityNotifications, setPriorityNotifications, isLoading, setLoading } = useNotificationStore();

  const { data, isFetching } = useQuery(
    ['priority-inbox'],
    async () => {
      setLoading(true);
      const response = await notificationApi.getPriorityInbox(50);
      setPriorityNotifications(response.data.data);
      return response.data.data;
    },
    { staleTime: 60000 }
  );

  useEffect(() => {
    Log('frontend', 'info', 'page', 'Priority Inbox mounted');
  }, []);

  const getPriorityScore = (n: Notification): number => {
    const typeWeights: Record<string, number> = { placement: 100, result: 80, event: 60, announcement: 40, reminder: 20 };
    const priorityWeights: Record<string, number> = { urgent: 50, high: 30, medium: 15, low: 5 };
    const hoursSince = (Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60);
    const recency = Math.max(0, 50 - hoursSince);
    const unreadBoost = n.isRead ? 0 : 25;
    return (typeWeights[n.type] || 0) + (priorityWeights[n.priority] || 0) + recency + unreadBoost;
  };

  const sorted = [...(data || [])].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Priority Inbox</Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Sorted by: Placement &gt; Result &gt; Event | Unread first | Latest higher
      </Typography>

      <Paper>
        {isFetching ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={60} sx={{ mx: 2, my: 1 }} />)
        ) : sorted.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>No priority notifications</Alert>
        ) : (
          <List>
            {sorted.map((n, index) => (
              <Box key={n._id}>
                <ListItemButton onClick={() => navigate(`/notifications/${n._id}`)}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontWeight={n.isRead ? 'normal' : 'bold'}>{index + 1}. {n.title}</Typography>
                        {!n.isRead && <Chip label="NEW" color="primary" size="small" />}
                        <Chip label={n.type} color={n.type === 'placement' ? 'success' : n.type === 'result' ? 'info' : 'warning'} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">{n.message.substring(0, 100)}...</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Score: {getPriorityScore(n).toFixed(1)} | {new Date(n.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
                {index < sorted.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}