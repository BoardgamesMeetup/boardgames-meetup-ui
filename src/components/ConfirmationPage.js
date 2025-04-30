import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
  Alert
} from '@mui/material';
import axios from 'axios';
import {
  confirmRegistration,
  resendConfirmationCode
} from '../cognito';

export default function ConfirmationPage() {

    const alreadyExecuted = useRef(false);

  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({
    loading: true,
    message: 'Confirming your account...',
    error: null,
    success: false
  });
  const [username, setUsername] = useState(searchParams.get('username'));
  const [resendStatus, setResendStatus] = useState({
    loading: false,
    success: false,
    error: null
  });

  useEffect(() => {

    const confirmUser = async () => {
        if (alreadyExecuted.current) return;
        alreadyExecuted.current = true;
      const code = searchParams.get('code');
      
      console.log('Starting confirmation process:', { username, codeExists: !!code });
      
      if (!username || !code) {
        console.error('Missing parameters:', { username, code });
        setStatus({
          loading: false,
          message: 'Invalid confirmation link. Missing parameters.',
          error: null,
          success: false
        });
        return;
      }
      
      try {
        console.log('Attempting Cognito confirmation for user:', username);
        const cognitoResult = await confirmRegistration(username, code);
        console.log('Cognito confirmation successful:', cognitoResult);
        
        try {
          console.log('Attempting backend confirmation for user:', username);
          const res = await axios.put('http://localhost:9013/user-service/confirm', {
            userId: username
          });
          console.log('Backend confirmation successful:', res.data);
          
          setStatus({
            loading: false,
            message: res.data?.message || 'Your account has been confirmed!',
            error: null,
            success: true
          });
        } catch (backendErr) {
          console.error('Backend update error:', backendErr);
          console.error('Backend response:', backendErr.response?.data);
          
          setStatus({
            loading: false,
            message: 'Your account has been confirmed, but there was an issue updating our database. You can still log in.',
            error: null,
            success: true
          });
        }
      } catch (cognitoErr) {
        console.error('Cognito confirm error:', cognitoErr);
        console.error('Error name:', cognitoErr.name);
        console.error('Error message:', cognitoErr.message);
        console.error('Error code:', cognitoErr.code);
        
        setStatus({
          loading: false,
          message: cognitoErr?.name === 'ExpiredCodeException' 
            ? 'Verification code has expired. Please request a new code.'
            : (cognitoErr?.message || 'Error confirming your account.'),
          error: cognitoErr,
          success: false
        });
      }
    };
    
    confirmUser();
  }, [searchParams, username]);
  
  const handleResendCode = async () => {
    if (!username) {
      console.error('Cannot resend: missing username');
      setResendStatus({
        loading: false,
        success: false,
        error: new Error('Username is required to resend verification code')
      });
      return;
    }
    
    setResendStatus({
      loading: true,
      success: false,
      error: null
    });
    
    try {
      console.log(`Attempting to resend confirmation code for username: ${username}`);
      const result = await resendConfirmationCode(username);
      console.log('Resend confirmation code result:', result);
      
      setResendStatus({
        loading: false,
        success: true,
        error: null
      });
    } catch (err) {
      console.error('Error resending confirmation code:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      
      setResendStatus({
        loading: false,
        success: false,
        error: err
      });
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  return (
    <Box sx={{ mt: 5, textAlign: 'center', maxWidth: '600px', mx: 'auto', p: 2 }}>
      {status.loading ? (
        <>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>{status.message}</Typography>
        </>
      ) : (
        <Box>
          <Typography 
            variant="h6" 
            color={status.success ? "success.main" : (status.error ? "error.main" : "text.primary")}
            sx={{ mb: 3 }}
          >
            {status.message}
          </Typography>
          
          {!status.success && (
            <Box sx={{ mt: 3, mb: 3 }}>
              {!username && (
                <TextField
                  label="Username or Email"
                  variant="outlined"
                  fullWidth
                  value={username || ''}
                  onChange={handleUsernameChange}
                  sx={{ mb: 2 }}
                  helperText="Please enter your username to resend the verification code"
                />
              )}
              
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleResendCode}
                disabled={resendStatus.loading || !username}
                sx={{ mt: 1 }}
              >
                {resendStatus.loading ? 'Sending...' : 'Resend Verification Code'}
              </Button>
              
              {resendStatus.success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  A new verification code has been sent to your email address. 
                  Please check your inbox and spam folder.
                </Alert>
              )}
              
              {resendStatus.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to send verification code: {resendStatus.error.message}
                </Alert>
              )}
            </Box>
          )}
          
          {status.error && (
            <Box sx={{ mt: 3, textAlign: 'left', color: 'error.main', p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">Error Details (Debug):</Typography>
              <Typography variant="body2">Name: {status.error.name}</Typography>
              <Typography variant="body2">Message: {status.error.message}</Typography>
              {status.error.code && <Typography variant="body2">Code: {status.error.code}</Typography>}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}