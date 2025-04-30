import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  MobileStepper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid
} from '@mui/material';
import {
  Event as EventIcon,
  Room as RoomIcon,
  ArrowBack as ArrowBackIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Person as PersonIcon,
  EventSeat as EventSeatIcon,
  Edit as EditIcon,
  CalendarToday as CalendarTodayIcon,
  Add as AddIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import SessionCheck from './SessionCheck';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getSession } from '../cognito';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const EventDetails = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [isAttending, setIsAttending] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [boardgames, setBoardgames] = useState([]);
  const [boardgamesLoading, setBoardgamesLoading] = useState(false);
  const [isEventPlanner, setIsEventPlanner] = useState(false);
  const { eventId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfileAndEventDetails = async () => {
      try {
        setLoading(true);
        
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();
        const idToken = session.getIdToken().payload;
        
        const username = idToken['cognito:username'] || idToken.username || '';
        setUserId(username);
        
        const groups = idToken['cognito:groups'] || [];
        const isInEventPlannerGroup = groups.includes('eventPlanner');
        
        const hasEventPlannerProfile = idToken.profile === 'EVENT_PLANNER';
        
        const hasEventPlannerCognitoProfile = idToken['custom:profile'] === 'EVENT_PLANNER';
        
        const eventPlannerStatus = isInEventPlannerGroup || hasEventPlannerProfile || hasEventPlannerCognitoProfile;
        setIsEventPlanner(eventPlannerStatus);
        
        setUserRole(eventPlannerStatus ? 'planner' : 'player');
        
        const response = await axios.get(`http://localhost:9013/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const eventData = response.data;
        setEvent(eventData);
        
        if (eventData.participantsIds.includes(username)) {
          setIsAttending(true);
        }

        if (eventData.boardgameIds && eventData.boardgameIds.length > 0) {
          await fetchBoardgameDetails(token);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch event details');
        setLoading(false);
        console.error('Error fetching event details:', err);
      }
    };

    fetchUserProfileAndEventDetails();
  }, [eventId]);

  const fetchBoardgameDetails = async (token) => {
    try {
      setBoardgamesLoading(true);
      const response = await fetch(`http://localhost:9013/boardgames/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching boardgames: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBoardgames(data);
      console.log('Fetched boardgames:', data);
    } catch (err) {
      console.error('Error fetching boardgame details:', err);
    } finally {
      setBoardgamesLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    try {
      setActionLoading(true);
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const response = await axios.post(`http://localhost:9013/events/${eventId}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        setSnackbarMessage("You have joined this event");
        setIsAttending(true);
        setEvent(prev => ({
          ...prev,
          participantsIds: [...prev.participantsIds, userId]
        }));
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage("Error joining event");
      setSnackbarOpen(true);
      console.error('Error joining event:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawEvent = async () => {
    try {
      setActionLoading(true);
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const response = await axios.post(`http://localhost:9013/events/${eventId}/withdraw`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        setSnackbarMessage("You have withdrawn from this event");
        setIsAttending(false);
        setEvent(prev => ({
          ...prev,
          participantsIds: prev.participantsIds.filter(id => id !== userId)
        }));
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage("Error withdrawing from event");
      setSnackbarOpen(true);
      console.error('Error withdrawing from event:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditEvent = () => {
    navigate(`/events/edit/${eventId}`);
  };

  const handleCancelEvent = async () => {
    setConfirmDialogOpen(false);
    
    try {
      setActionLoading(true);
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const response = await axios.delete(`http://localhost:9013/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200 || response.status === 204) {
        setSnackbarMessage("Event has been cancelled");
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate('/events/search');
        }, 1500);
      }
    } catch (err) {
      setSnackbarMessage("Error cancelling event");
      setSnackbarOpen(true);
      console.error('Error cancelling event:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBoardgameDetails = (gameId) => {
    navigate(`/boardgame/${gameId}`);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  if (!event) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">Event not found</Alert>
      </Container>
    );
  }

  const eventDate = parse(event.day, 'yyyy-MM-dd', new Date());
  const formattedDate = format(eventDate, 'MMMM d, yyyy');
  const dayOfWeek = format(eventDate, 'EEEE');
  
const createGoogleCalendarUrl = () => {
  const startDateTime = `${event.day}T${event.startHour}:00`;
  const endDateTime = `${event.day}T${event.endHour}:00`;
  
  const locationParts = [
    event.address, 
    event.city
  ].filter(part => part && part.trim() !== '');
  
  const location = locationParts.join(', ');
  
  const eventDetails = {
    action: 'TEMPLATE',
    text: `${event.title} - ${event.city}`,
    details: event.description,
    location: location,
    dates: `${startDateTime}/${endDateTime}`.replace(/-/g, '').replace(/:/g, '')
  };
  
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams(eventDetails);
  return `${baseUrl}?${params.toString()}`;
};
  
  const createGoogleMapsUrl = () => {
    if (event.latitude && event.longitude) {
      return `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;
    } else {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${event.venueName} ${event.address} ${event.city}`
      )}`;
    }
  };

  const hasBoardgames = boardgames.length > 0;
  const maxSteps = hasBoardgames ? boardgames.length : 0;
  const isOwner = event.owner === userId;

  return (
    <ThemeProvider theme={theme}>
      {/* <SessionCheck /> */}
      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 8 }}>
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, ml: -1 }}>
            <Button
              component={Link}
              to="/events/search"
              startIcon={<ArrowBackIcon />}
              sx={{ 
                fontWeight: 500, 
                color: 'primary.main', 
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              BACK TO EVENTS
            </Button>
          </Box>
          
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {event.title} - {event.city}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <PersonIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body1" color="text.secondary">
              Organized by: {event.owner}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box 
              sx={{ 
                flex: '3',
                bgcolor: 'white', 
                p: 4, 
                borderRadius: 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
              }}
            >
              <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                {isEventPlanner ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEditEvent}
                    startIcon={<EditIcon />}
                    sx={{ py: 1 }}
                  >
                    EDIT EVENT
                  </Button>
                ) : (
                  isAttending ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleWithdrawEvent}
                      startIcon={<CancelIcon />}
                      disabled={actionLoading}
                      sx={{ py: 1 }}
                    >
                      WITHDRAW FROM EVENT
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleJoinEvent}
                      startIcon={<AddIcon />}
                      disabled={actionLoading || event.participantsIds.length >= event.maxParticipants}
                      sx={{ py: 1 }}
                    >
                      JOIN EVENT
                    </Button>
                  )
                )}
                
                {isEventPlanner && isOwner && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setConfirmDialogOpen(true)}
                    startIcon={<DeleteIcon />}
                    sx={{ py: 1 }}
                  >
                    CANCEL EVENT
                  </Button>
                )}
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" component="h2" sx={{ 
                  fontWeight: 'bold', 
                  mb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ 
                  whiteSpace: 'pre-line', 
                  mb: 4,
                  fontSize: '1.1rem',
                  lineHeight: 1.6
                }}>
                  {event.description || 'No description provided.'}
                </Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', width: '80px' }}>
                      Date:
                    </Typography>
                    <Typography variant="body1">
                      {format(eventDate, 'MMMM d')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', width: '80px' }}>
                      Time:
                    </Typography>
                    <Typography variant="body1">
                      {event.startHour}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', width: '80px' }}>
                      Location:
                    </Typography>
                    <Typography variant="body1">
                      {event.venueName}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventSeatIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Participants</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, ml: 4 }}>
                    {event.participantsIds.length} / {event.maxParticipants}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px', fontSize: '20px' }}>$</span>
                      Ticket Price
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, ml: 4 }}>
                    {event.ticketPrice ? `$${event.ticketPrice}` : 'Free'}
                  </Typography>
                </Box>
                
                {event.addressInfo && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, color: '#1976d2' }} />
                      <Typography variant="h6">Address Information</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, ml: 4 }}>
                      {event.addressInfo}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            
            <Box sx={{ flex: '1' }}>
              <Paper elevation={1} sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Date & Time</Typography>
                    </Box>
                    <Chip 
                      label={dayOfWeek} 
                      size="small" 
                      variant="outlined" 
                      sx={{ borderRadius: 16, color: '#1976d2', borderColor: '#1976d2' }}
                    />
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {formattedDate}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {event.startHour} - {event.endHour}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    href={createGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<CalendarTodayIcon />}
                    sx={{ textTransform: 'uppercase' }}
                  >
                    ADD TO GOOGLE CALENDAR
                  </Button>
                </CardActions>
              </Paper>
              
              <Paper elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RoomIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Venue</Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {event.address}, {event.city}
                  </Typography>
                  
                  {event.latitude && event.longitude && (
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      {event.latitude}°N {event.longitude}°E
                    </Typography>
                  )}
                  
                  <Box 
                    sx={{ 
                      height: 200, 
                      mb: 1, 
                      borderRadius: 1, 
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <iframe
                      title="Map Location"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&q=${event.latitude},${event.longitude}`}
                      allowFullScreen
                    ></iframe>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    href={createGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<RoomIcon />}
                    sx={{ textTransform: 'uppercase' }}
                  >
                    VIEW IN GOOGLE MAPS
                  </Button>
                </CardActions>
              </Paper>
            </Box>
          </Box>
          
          <Box sx={{ mt: 5, mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 1
            }}>
              Boardgames
            </Typography>
            
            {boardgamesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : hasBoardgames ? (
              <Box sx={{ width: '100%', bgcolor: 'white', p: 3, borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    {boardgames[activeStep].image ? (
                      <Box 
                        component="img"
                        src={boardgames[activeStep].image}
                        alt={boardgames[activeStep].name}
                        sx={{
                          width: '100%',
                          maxHeight: 300,
                          objectFit: 'contain',
                          borderRadius: 1,
                          mb: 2
                        }}
                      />
                    ) : (
                      <Box 
                        sx={{
                          width: '100%',
                          height: 300,
                          bgcolor: 'rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          mb: 2
                        }}
                      >
                        <Typography color="text.secondary">No image available</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" fontWeight="medium" gutterBottom>
                      {boardgames[activeStep].name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Chip 
                        label={`${boardgames[activeStep].minPlayers}-${boardgames[activeStep].maxPlayers} players`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      {boardgames[activeStep].yearPublished && (
                        <Chip 
                          label={`Published: ${boardgames[activeStep].yearPublished}`} 
                          size="small" 
                          variant="outlined" 
                        />
                      )}
                    </Box>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mb: 3,
                        maxHeight: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {boardgames[activeStep].description || "No description available."}
                    </Typography>
                    
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate(`/boardgame/${boardgames[activeStep].gameId}?from=events`)}
                      >
                      View Details
                    </Button>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <MobileStepper
                    steps={maxSteps}
                    position="static"
                    activeStep={activeStep}
                    nextButton={
                      <Button
                        size="small"
                        onClick={handleNext}
                        disabled={activeStep === maxSteps - 1}
                      >
                        Next
                        <KeyboardArrowRight />
                      </Button>
                    }
                    backButton={
                      <Button 
                        size="small" 
                        onClick={handleBack} 
                        disabled={activeStep === 0}
                      >
                        <KeyboardArrowLeft />
                        Back
                      </Button>
                    }
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'white', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                <Typography variant="body1" color="text.secondary">
                  No boardgames added yet by organiser.
                </Typography>
              </Box>
            )}
          </Box>
        </Container>
        
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>Cancel Event</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel this event? This action cannot be undone and all participants will be notified.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
              No, Keep Event
            </Button>
            <Button onClick={handleCancelEvent} color="error" variant="contained" disabled={actionLoading}>
              Yes, Cancel Event
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </ThemeProvider>
  );
};

export default EventDetails;