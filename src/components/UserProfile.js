import React, { useEffect, useState } from 'react';
import {
  getCurrentUser,
  getIdToken,
  logoutUser,
  changePassword
} from '../cognito';
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

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [preferredBoardGames, setPreferredBoardGames] = useState('');

  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const cognitoUser = getCurrentUser();
    if (!cognitoUser) {
      setModalMessage('You must be logged in to view your profile.');
      setShowModal(true);
      return;
    }
    try {
      const token = await getIdToken();
      const response = await fetch('http://localhost:8080/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load profile');
      const data = await response.json();
      setProfile(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setPreferredBoardGames(data.preferredBoardGames || '');
    } catch (err) {
      setModalMessage(err.message);
      setShowModal(true);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!profile) return;

    try {
      const token = await getIdToken();
      const response = await fetch('http://localhost:8080/profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: profile.username || '',
          email: profile.email || '',
          role: profile.role || '',
          name,
          description,
          preferredBoardGames
        })
      });
      if (!response.ok) throw new Error('Failed to update profile');
      setModalMessage('Profile updated successfully!');
      setShowModal(true);
      loadProfile();
    } catch (err) {
      setModalMessage(err.message);
      setShowModal(true);
    }
  }

  const handleLogout = () => {
    logoutUser();
    setProfile(null);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setModalMessage('New password and confirmation do not match!');
      setShowModal(true);
      return;
    }
    try {
      await changePassword(oldPassword, newPassword);
      setModalMessage('Password changed successfully.');
      setShowModal(true);
      setShowChangePasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setModalMessage(err.message || JSON.stringify(err));
      setShowModal(true);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>User Profile</Typography>

      {!profile ? (
        <Typography>Please log in or wait while we load your profile...</Typography>
      ) : (
        <Box
          component="form"
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}
          onSubmit={handleSave}
        >
          <TextField
            label="Username (read-only)"
            value={profile.username || ''}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Email (read-only)"
            value={profile.email || ''}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Role (read-only)"
            value={profile.role || ''}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <TextField
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline
          />
          <TextField
            label="Preferred Board Games"
            helperText="Comma-separated list"
            value={preferredBoardGames}
            onChange={e => setPreferredBoardGames(e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" type="submit">Save</Button>
            <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
            <Button variant="text" onClick={() => setShowChangePasswordModal(true)}>
              Change Password
            </Button>
          </Box>
        </Box>
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

      <Dialog open={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Old Password"
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
          />
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={e => setConfirmNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangePasswordModal(false)}>Cancel</Button>
          <Button onClick={handleChangePassword}>Change</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserProfile;
