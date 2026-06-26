import { Box, Typography, Button } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Log } from '../api/client';
import { useEffect } from 'react';

export function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    Log('frontend', 'warn', 'page', '404 page visited', { path: window.location.pathname });
  }, []);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh" textAlign="center">
      <Typography variant="h1" color="primary" sx={{ fontSize: '8rem', fontWeight: 'bold' }}>404</Typography>
      <Typography variant="h4" gutterBottom>Page Not Found</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        The page you are looking for does not exist or has been moved.
      </Typography>
      <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')} sx={{ mt: 2 }}>
        Go Home
      </Button>
    </Box>
  );
}