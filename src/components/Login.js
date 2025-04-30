import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
  Link
} from '@mui/material';
import {
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { loginUser } from '../cognito';

function Login() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (location.state?.sessionExpired) {
      setSessionExpired(true);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSessionExpired(false);
    setLoading(true);
    
    try {
      const session = await loginUser(formData.email, formData.password);
      console.log('Login successful', session);
      window.location.href = '/home';
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.code === 'UserNotConfirmedException') {
        setError('Please confirm your email before logging in.');
      } else if (err.code === 'NotAuthorizedException') {
        setError('Incorrect email or password.');
      } else if (err.code === 'UserNotFoundException') {
        setError('No account found with this email.');
      } else {
        setError(err.message || 'An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const goToResendConfirmation = () => {
    if (formData.email) {
      window.location.href = `/resend-confirmation?email=${encodeURIComponent(formData.email)}`;
    } else {
      window.location.href = '/resend-confirmation';
    }
  };



  return (
    <Box
      sx={{
        width: 400,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        mt: 5
      }}
    >
      <Typography variant="h5" align="center">
        Login
      </Typography>
      
      {sessionExpired && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Your session has expired. Please log in again.
        </Alert>
      )}
      
      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}

      <TextField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <TextField
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={handleChange}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleTogglePasswordVisibility}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      <Button
        variant="contained"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Login'}
      </Button>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Button
          variant="text"
          size="small"
          onClick={() => window.location.href = '/register'}
        >
          Create Account
        </Button>
        
        <Button
          variant="text"
          size="small"
          onClick={() => window.location.href = '/forgot-password'}
        >
          Forgot Password?
        </Button>
      </Box>

      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        Need to confirm your account?{' '}
        <Link
          component="button"
          variant="body2"
          onClick={goToResendConfirmation}
          sx={{ cursor: 'pointer' }}
        >
          Resend confirmation email
        </Link>
      </Typography>

    </Box>
  );
}

export default Login;