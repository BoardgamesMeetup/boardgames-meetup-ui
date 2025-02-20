import React, { useState } from 'react';
import { loginUser } from '../cognito';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
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

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const session = await loginUser(username, password);
      setModalMessage(`Login successful! ID Token: ${session.getIdToken().getJwtToken()}`);
      setShowModal(true);
//      navigate('/');
    } catch (err) {
      setModalMessage(err.message || JSON.stringify(err));
      setShowModal(true);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Login</Typography>
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onSubmit={handleLogin}>
        <TextField
          label="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button variant="contained" type="submit">Login</Button>
        <Box>
          <Link to="/forgot-password">Forgot your password?</Link>
        </Box>
      </Box>

      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>Notification</DialogTitle>
        <DialogContent>
          <Typography>{modalMessage}</Typography>
        </DialogContent>
        <DialogActions>
      <Button onClick={() => {
        setShowModal(false);
        navigate('/');
        }}>OK</Button>
      </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Login;
