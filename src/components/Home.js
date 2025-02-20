import React, { useEffect, useState } from 'react';
import {
  getCurrentUser,
  getIdToken,
  logoutUser
} from '../cognito';
import {
  Box,
  Typography,
  Button
} from '@mui/material';

function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const cognitoUser = getCurrentUser();
    if (cognitoUser) {
      setUser(cognitoUser);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const token = await getIdToken();
      const response = await fetch('http://localhost:8080/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setProfile(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Welcome to Boardgames Meetup!</Typography>

      {user ? (
        <Box sx={{ mt: 2 }}>
          <Typography>You are logged in as: {user.getUsername()}</Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={loadProfile}>Load Profile</Button>
            <Button variant="outlined" sx={{ ml: 2 }} onClick={handleLogout}>Logout</Button>
          </Box>
          {profile && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Profile:</Typography>
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            </Box>
          )}
        </Box>
      ) : (
        <Typography>Please register or login to see your profile.</Typography>
      )}
    </Box>
  );
}

export default Home;
