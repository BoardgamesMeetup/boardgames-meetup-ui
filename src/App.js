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
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import UserProfile from './components/UserProfile';
import Events from './components/Events';
import EventsCreation from './components/EventsCreation';
import Boardgames from './components/Boardgames';
import ConfirmationPage from './components/ConfirmationPage';
import BoardgameProfile from './components/BoardgameProfile';
import EventBoardgames from './components/EventBoardgames';
import ProtectedRoute from './components/ProtectedRoute';
import { getSession, logoutUser } from "./cognito";
import { jwtDecode } from 'jwt-decode';
import EventDetails from './components/EventDetails';
import { getSessionIfExists } from './cognito';
import EventUpdate from './components/EventUpdate';
import  ResendConfirmation from './components/ResendConfirmation';


function App() {
  const [user, setUser] = React.useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    return await getSessionIfExists();
  };

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await fetchSession();
        if (session) {
          setAuthenticated(true);
          const token = session.getAccessToken().getJwtToken();
          if (token) {
            try {
              const decoded = jwtDecode(token);
              console.log('TOKEN: ', decoded);
              const role = decoded['cognito:groups']?.[0] || 'player';
              setUser({ isLoggedIn: true, role });
            } catch (e) {
              setUser(null);
              console.warn('Invalid token');
            }
          }
        } else { setAuthenticated(true) }
      } catch (error) {
        console.log('Error checking authentication:', error);
        setAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  }
  return (
    <Box sx={{ flexGrow: 1 }}>
      <NavBar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/confirm" element={<ConfirmationPage />} />
        <Route path="/resend-confirmation" element={< ResendConfirmation />} /> 
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<ProtectedRoute/>}>

            <Route exact path="/home" element={<Home />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/events/search" element={<Events />} />
            <Route path="/events/create" element={ <EventsCreation />}/>
            <Route path="/events/:eventId/select-boardgames" element={<EventBoardgames />} />
            <Route path="/events/:eventId" element={<EventDetails />} />
            <Route path="events/edit/:eventId" element={<EventUpdate />} />
            <Route path="/boardgames" element={<Boardgames />} />

            <Route path="/boardgame/:id" element={<BoardgameProfile />} />


        </Route>
      </Routes>
    </Box>
  );
}

export default App;
