import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, Button, Divider, Skeleton, Alert } from '@mui/material';
import { ArrowBack as BackIcon, MarkEmailRead as ReadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { notificationApi } from '../api/notifications';
import { useMarkAsRead, useDeleteNotification } from '../hooks/useNotifications';
import { Log } from '../api/client';

export function NotificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery(
    ['notification', id],
    () => notificationApi.getNotificationById(id!),
    { enabled: !!id }
  );

  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const notification = data?.data.data;

  useEffect(() => {
    Log('frontend', 'info', 'page', 'Notification detail mounted', { id });
  }, [id]);

  if (error) return <Alert severity="error">Failed to load notification</Alert>;
  if (isLoading) return <Skeleton height={400} />;
  if (!notification) return <Alert severity="warning">Notification not found</Alert>;

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/notifications')} sx={{ mb: 2 }}>
        Back to Notifications
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h4">{notification.title}</Typography>
          <Box display="flex" gap={1}>
            <Chip label={notification.type} color="primary" />
            <Chip label={notification.priority} color={notification.priority === 'urgent' ? 'error' : 'default'} />
            <Chip label={notification.isRead ? 'Read' : 'Unread'} variant="outlined" />
          </Box>
        </Box>

        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
          Created: {new Date(notification.createdAt).toLocaleString()}
          {notification.readAt && ` | Read: ${new Date(notification.readAt).toLocaleString()}`}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {notification.message}
        </Typography>

        {notification.metadata && Object.keys(notification.metadata).length > 0 && (
          <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
            <Typography variant="subtitle2" gutterBottom>Metadata:</Typography>
            <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
          </Box>
        )}

        <Box display="flex" gap={2} mt={3}>
          {!notification.isRead && (
            <Button variant="contained" startIcon={<ReadIcon />} onClick={() => markAsRead.mutate(notification._id)}>
              Mark as Read
            </Button>
          )}
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => {
            deleteNotification.mutate(notification._id);
            navigate('/notifications');
          }}>
            Delete
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}