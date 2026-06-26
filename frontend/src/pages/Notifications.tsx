import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton, Chip, Checkbox,
  Toolbar, TextField, MenuItem, Button, Skeleton, Alert, useMediaQuery, useTheme
} from '@mui/material';
import { Delete as DeleteIcon, MarkEmailRead as ReadIcon } from '@mui/icons-material';
import { useNotifications, useMarkAsRead, useBulkMarkAsRead, useDeleteNotification } from '../hooks/useNotifications';
import { useNotificationStore } from '../store/notificationStore';
import { Log } from '../api/client';
import type { Notification, NotificationType, NotificationPriority } from '../types';

const typeColors: Record<string, any> = {
  placement: 'success', result: 'info', event: 'warning', announcement: 'secondary', reminder: 'default'
};

const priorityColors: Record<string, any> = {
  low: 'default', medium: 'info', high: 'warning', urgent: 'error'
};

export function Notifications() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { notifications, page, totalPages, hasNext, hasPrev, filters, isLoading, error, setFilters, setPagination } = useNotificationStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { isFetching } = useNotifications({
    page, limit: 20, notification_type: filters.type, priority: filters.priority,
    isRead: filters.isRead, search: filters.search
  });

  const markAsRead = useMarkAsRead();
  const bulkMarkAsRead = useBulkMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(event.target.checked ? notifications.map(n => n._id) : []);
  }, [notifications]);

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleBulkRead = () => { bulkMarkAsRead.mutate(selected); setSelected([]); };
  const handleBulkDelete = () => { setSelected([]); };

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Notifications</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField select label="Type" value={filters.type || ''} onChange={(e) => setFilters({ type: (e.target.value as NotificationType) || undefined })}
            sx={{ minWidth: 120 }} size="small">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="placement">Placement</MenuItem>
            <MenuItem value="result">Result</MenuItem>
            <MenuItem value="event">Event</MenuItem>
            <MenuItem value="announcement">Announcement</MenuItem>
            <MenuItem value="reminder">Reminder</MenuItem>
          </TextField>

          <TextField select label="Status" value={filters.isRead === undefined ? '' : filters.isRead ? 'read' : 'unread'}
            onChange={(e) => { const v = e.target.value; setFilters({ isRead: v === '' ? undefined : v === 'read' }); }}
            sx={{ minWidth: 120 }} size="small">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="unread">Unread</MenuItem>
            <MenuItem value="read">Read</MenuItem>
          </TextField>

          <TextField placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setFilters({ search: searchQuery })}
            size="small" sx={{ flexGrow: 1, maxWidth: 300 }} />
        </Box>
      </Paper>

      {selected.length > 0 && (
        <Toolbar sx={{ bgcolor: 'action.selected', mb: 1 }}>
          <Typography sx={{ flex: 1 }}>{selected.length} selected</Typography>
          <Button startIcon={<ReadIcon />} onClick={handleBulkRead} sx={{ mr: 1 }}>Mark Read</Button>
          <Button startIcon={<DeleteIcon />} color="error" onClick={handleBulkDelete}>Delete</Button>
        </Toolbar>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox indeterminate={selected.length > 0 && selected.length < notifications.length}
                  checked={notifications.length > 0 && selected.length === notifications.length} onChange={handleSelectAll} />
              </TableCell>
              <TableCell>Title</TableCell>
              {!isMobile && <TableCell>Type</TableCell>}
              {!isMobile && <TableCell>Priority</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={isMobile ? 4 : 6}><Skeleton height={40} /></TableCell></TableRow>
              ))
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 4 : 6} align="center">
                  <Typography color="textSecondary" py={4}>No notifications found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow key={n._id} hover selected={selected.includes(n._id)}
                  sx={{ bgcolor: n.isRead ? 'inherit' : 'action.hover', cursor: 'pointer' }}
                  onClick={() => navigate(`/notifications/${n._id}`)}>
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.includes(n._id)} onChange={() => handleSelect(n._id)} />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={n.isRead ? 'normal' : 'bold'}>{n.title}</Typography>
                  </TableCell>
                  {!isMobile && <TableCell><Chip label={n.type} color={typeColors[n.type]} size="small" /></TableCell>}
                  {!isMobile && <TableCell><Chip label={n.priority} color={priorityColors[n.priority]} size="small" variant="outlined" /></TableCell>}
                  <TableCell><Chip label={n.isRead ? 'Read' : 'Unread'} color={n.isRead ? 'default' : 'primary'} size="small" /></TableCell>
                  <TableCell>{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {!n.isRead && <IconButton size="small" onClick={() => markAsRead.mutate(n._id)}><ReadIcon /></IconButton>}
                    <IconButton size="small" color="error" onClick={() => deleteNotification.mutate(n._id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination component="div" count={totalPages * 20} page={page - 1}
        onPageChange={(_, newPage) => setPagination(newPage + 1, totalPages, hasNext, hasPrev)}
        rowsPerPage={20} rowsPerPageOptions={[20]} />
    </Box>
  );
}