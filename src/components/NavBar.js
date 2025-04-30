import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Avatar,
  Button,
  Divider
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';


const NavBar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const openProfileMenu = (event) => setAnchorEl(event.currentTarget);
  const closeProfileMenu = () => setAnchorEl(null);

  const handleViewProfile = () => {
    closeProfileMenu();
    navigate('/user-profile');
  };

  const handleHelp = () => {
    alert('Open help page.');
    closeProfileMenu();
  };

  const handleLogout = () => {
    closeProfileMenu();
    onLogout();
    localStorage.clear();
    navigate('/login')
  };

  return (
    <AppBar position="static" sx={{ borderBottom: '1px solid #ccc' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
          Boardgames Meetup
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!user?.isLoggedIn && (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          )}

          {user?.isLoggedIn && (
            <>
              <Button color="inherit" component={Link} to="/home">Home</Button>
              <Button color="inherit" component={Link} to="/boardgames">Boardgames</Button>

                <Button color="inherit" component={Link} to="/events/search">Events</Button>

              <IconButton onClick={openProfileMenu} sx={{ p: 0 }}>
                <Avatar alt="User Avatar" src="" />
                <ArrowDropDownIcon />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeProfileMenu}
                sx={{ mt: '45px' }}
              >
                <MenuItem onClick={handleViewProfile}>View profile</MenuItem>
                <MenuItem onClick={handleHelp}>Help</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Log out</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
