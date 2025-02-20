import React, { useState } from 'react';
import {
  registerUser,
  confirmRegistration,
  loginUser,
  getIdToken
} from '../cognito';
import {
  Box,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

function Register() {
  const [stage, setStage] = useState('REGISTER'); // REGISTER -> CONFIRM -> (auto login) -> PROFILE
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Player');
  const [confirmationCode, setConfirmationCode] = useState('');

  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerUser(username, password, email);
      setModalMessage('Registration successful! Check email for code.');
      setShowModal(true);
      setStage('CONFIRM');
    } catch (err) {
      setModalMessage(err.message || JSON.stringify(err));
      setShowModal(true);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    try {
      await confirmRegistration(username, confirmationCode);
      setModalMessage('User confirmed! Now logging you in...');
      setShowModal(true);
      setStage('DONE');

      // Optionally auto-login after confirmation
      const session = await loginUser(username, password);
      console.log('Logged in, ID Token =', session.getIdToken().getJwtToken());

      // Now we can call the gateway to store the user profile
      await saveProfile();

    } catch (err) {
      setModalMessage(err.message || JSON.stringify(err));
      setShowModal(true);
    }
  };

  /**
   * Saves the user profile (including role) in your user-management service (via gateway).
   */
  const saveProfile = async () => {
    try {
      const token = await getIdToken();
      const response = await fetch('http://localhost:8080/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: role
        })
      });
      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Register</Typography>
      
      {stage === 'REGISTER' && (
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onSubmit={handleRegister}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Typography>Select Role:</Typography>
          <RadioGroup row value={role} onChange={e => setRole(e.target.value)}>
            <FormControlLabel value="Player" control={<Radio />} label="Player" />
            <FormControlLabel value="Event Planner" control={<Radio />} label="Event Planner" />
          </RadioGroup>
          <Button variant="contained" type="submit">Register</Button>
        </Box>
      )}

      {stage === 'CONFIRM' && (
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onSubmit={handleConfirm}>
          <TextField
            label="Confirmation Code"
            value={confirmationCode}
            onChange={e => setConfirmationCode(e.target.value)}
            required
          />
          <Button variant="contained" type="submit">Confirm</Button>
        </Box>
      )}

      {stage === 'DONE' && (
        <Typography variant="body1">Registration complete! You can go to <a href="/login">login</a> or Home.</Typography>
      )}

      {/* Modal for messages */}
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

export default Register;
