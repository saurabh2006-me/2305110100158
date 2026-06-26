import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { Log } from '../api/client';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In production, call auth API
      // const response = await authApi.login(email, password);
      // localStorage.setItem('token', response.data.data.token);

      // Mock login for demo
      localStorage.setItem('token', 'mock_token');
      Log('frontend', 'info', 'page', 'User logged in', { email });
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
      Log('frontend', 'error', 'page', 'Login failed', { email, error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" align="center" gutterBottom>NotifyHub</Typography>
        <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
          Notification Platform
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            margin="normal" required />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            margin="normal" required />

          <Button type="submit" fullWidth variant="contained" size="large" startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
            disabled={loading} sx={{ mt: 2 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}