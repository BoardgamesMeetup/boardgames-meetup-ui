import React, { useState } from 'react';
import { forgotPassword, confirmNewPassword } from '../cognito';
import {
  Box,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

function ForgotPassword() {
  const [stage, setStage] = useState('REQUEST');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(username);
      setModalMessage('Reset code sent to your email!');
      setShowModal(true);
      setStage('RESET');
    } catch (err) {
      setModalMessage(err.message || JSON.stringify(err));
      setShowModal(true);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    try {
      await confirmNewPassword(username, code, newPassword);
      setModalMessage('Password reset successful! You can now login with your new password.');
      setShowModal(true);
      setStage('DONE');
    } catch (err) {
      setModalMessage(err.message || JSON.stringify(err));
      setShowModal(true);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Forgot Password</Typography>

      {stage === 'REQUEST' && (
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onSubmit={handleRequestReset}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <Button variant="contained" type="submit">Request Reset</Button>
        </Box>
      )}

      {stage === 'RESET' && (
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onSubmit={handleConfirmReset}>
          <TextField
            label="Confirmation Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <Button variant="contained" type="submit">Confirm Reset</Button>
        </Box>
      )}

      {stage === 'DONE' && (
        <Typography variant="body1">
          Password reset complete. Proceed to <a href="/login">Login</a>.
        </Typography>
      )}

      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>Notification</DialogTitle>
        <DialogContent>
          <Typography>{modalMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ForgotPassword;
