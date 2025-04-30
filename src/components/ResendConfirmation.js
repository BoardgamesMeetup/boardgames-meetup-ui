import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Link
} from '@mui/material';
import { resendConfirmationCode } from '../cognito';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

function ResendConfirmation() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    
    try {
        console.log("Retrieved Cognito username for confirm email: ", email);

      const response = await axios.get(`http://localhost:9013/user-service/by-email/${email}`);
      
      console.log("Retrieved Cognito username1: ", response.data);

      if (!response.data) {
        throw new Error('User not found or no Cognito username associated with this email');
      }
      
      const cognitoUsername = response.data;
      console.log("Retrieved Cognito username:", cognitoUsername);
      
      await resendConfirmationCode(cognitoUsername);
      setSuccess(true);
    } catch (err) {
      console.error('Error in resend confirmation process:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError('No account found with this email address.');
        } else {
          setError(err.response.data?.message || 'Error retrieving account information.');
        }
      } 
      else if (err.code) {
        switch (err.code) {
          case 'UserNotFoundException':
            setError('No account found with this email address.');
            break;
          case 'LimitExceededException':
            setError('Too many attempts. Please try again later.');
            break;
          case 'InvalidParameterException':
            setError('Invalid email format or account information.');
            break;
          case 'UserNotConfirmedException':
            setSuccess(true);
            break;
          default:
            setError(err.message || 'Failed to resend confirmation email. Please try again.');
        }
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 450,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Resend Confirmation Email
        </Typography>
        
        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Confirmation email sent successfully! Please check your inbox and follow the instructions to activate your account.
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              If you don't see the email, please check your spam folder.
            </Typography>
            
            <Button 
              variant="contained" 
              onClick={() => window.location.href = '/login?confirmationResent=true'}
              fullWidth
              sx={{ mt: 2 }}
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter your email address below and we'll send you another confirmation email with instructions to activate your account.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Confirmation Email'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => window.location.href = '/login'}
              >
                Back to Login
              </Link>
            </Box>
          </form>
        )}
      </Paper>
    </Box>
  );
}

export default ResendConfirmation;