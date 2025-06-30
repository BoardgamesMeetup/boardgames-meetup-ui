import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Divider,
  CircularProgress,
  Paper,
  Chip,
  FormControl,
  FormLabel,
  Badge,
  Alert,
  Skeleton
} from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSession } from '../cognito';
import EventIcon from '@mui/icons-material/Event';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RecommendIcon from '@mui/icons-material/Recommend';

import '../utils/home.css';

function EventCard({
  event,
  isParticipating,
  isOwner,
  isPlanner,
  onViewDetails,
  onEditEvent,
  onJoinEvent,
  onWithdrawEvent,
  isPast,
  isRecommended,
  recommendationScore,
  recommendationExplanation
}) {
  return (
    <Card
      sx={{
        width: '100%',
        boxShadow: 2,
        '&:hover': { boxShadow: 6 },
        borderRadius: 1,
        opacity: isPast ? 0.7 : 1,
        position: 'relative',
        ...(isRecommended && {
          border: '2px solid',
          borderColor: 'primary.main',
          background: 'linear-gradient(45deg, rgba(25, 118, 210, 0.05) 0%, rgba(255, 255, 255, 0) 100%)'
        })
      }}
    >
      {isRecommended && recommendationScore && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'primary.main',
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            boxShadow: 2
          }}
        >
          {Math.round(recommendationScore * 10)}
        </Box>
      )}
      
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <EventIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
            {event.day}, {event.startHour} - {event.endHour}
          </Typography>

          {isRecommended ? (
            <Chip
              label="AI Recommended"
              color="primary"
              size="small"
              icon={<AutoAwesomeIcon />}
            />
          ) : isParticipating ? (
            <Chip
              label="Participating"
              color="success"
              size="small"
              icon={<CheckCircleIcon />}
            />
          ) : isOwner ? (
            <Chip
              label="Own Event"
              color="primary"
              size="small"
              icon={<EventIcon />}
            />
          ) : null}
        </Box>

        <Typography variant="h6" sx={{ mb: 1 }}>
          {event.title}
        </Typography>

        <Typography variant="body2" sx={{ mb: 1 }}>
          <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
          {event.city}, {event.address}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          <PeopleIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
          {event.participantsIds?.length || 0}/{event.maxParticipants} participants
        </Typography>

        {isRecommended && recommendationExplanation && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: 'primary.light',
              borderRadius: 1,
              opacity: 0.1
            }}
          >
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.dark' }}>
              <RecommendIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
              {recommendationExplanation}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onViewDetails(event.id)}
          >
            View Details
          </Button>

          {!isPast && (
            isPlanner && isOwner ? (
              <Button
                variant="contained"
                size="small"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={() => onEditEvent(event.id)}
              >
                Edit
              </Button>
            ) : (
              !isOwner && (
                isParticipating ? (
                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    startIcon={<EventBusyIcon />}
                    onClick={() => onWithdrawEvent(event.id)}
                    disabled={isPast}
                  >
                    Withdraw
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => onJoinEvent(event.id)}
                    disabled={event.participantsIds?.length >= event.maxParticipants || isPast}
                  >
                    Join
                  </Button>
                )
              )
            )
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function RecommendationSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[1, 2, 3].map((index) => (
        <Card key={index} sx={{ width: '100%' }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={30} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function Home() {

  const HOME_STATE_KEY = 'homePageState';
  const HOME_STATE_TIMESTAMP_KEY = 'homePageStateTimestamp';

  const location = useLocation();
  const navigate = useNavigate();
  
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventDates, setEventDates] = useState([]);
  const [user, setUser] = useState({ userId: '', role: '', groups: [] });
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [filterOption, setFilterOption] = useState('calendar');

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isPastDate = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateStr);
    return checkDate < today;
  };

  const saveHomePageState = () => {
    const state = {
      filterOption,
      selectedDate: date.toISOString()
    };
    
    localStorage.setItem(HOME_STATE_KEY, JSON.stringify(state));
    localStorage.setItem(HOME_STATE_TIMESTAMP_KEY, Date.now().toString());
  };

  // Restore state from localStorage
  const restoreHomePageState = () => {
    try {
      const savedState = localStorage.getItem(HOME_STATE_KEY);
      const timestamp = localStorage.getItem(HOME_STATE_TIMESTAMP_KEY);
      
      // Check if state is recent (within 1 hour)
      const isRecentState = timestamp && 
        (Date.now() - parseInt(timestamp)) < 60 * 60 * 1000;
      
      if (savedState && isRecentState) {
        const state = JSON.parse(savedState);
        setFilterOption(state.filterOption);
        setDate(new Date(state.selectedDate));
        console.log('Restored home page state:', state);
        return true;
      }
    } catch (error) {
      console.error('Error restoring home page state:', error);
    }
    return false;
  };

  // Clear saved state
  const clearHomePageState = () => {
    localStorage.removeItem(HOME_STATE_KEY);
    localStorage.removeItem(HOME_STATE_TIMESTAMP_KEY);
  };


  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();
        const groups = session.getIdToken().payload['cognito:groups'] || [];

        const response = await fetch('http://localhost:9013/user-service/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch user profile');

        const userProfile = await response.json();

        setUser({
          userId: userProfile.userId,
          role: userProfile.role,
          groups: groups
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, []);

   // Restore state when component mounts
   useEffect(() => {
    // Check if we're returning from an event details page
    const isReturningFromEventDetails = location.state?.fromEventDetails;
    
    if (isReturningFromEventDetails) {
      const restored = restoreHomePageState();
      if (!restored) {
        console.log('No recent state to restore');
      }
    }
  }, [location]);

  useEffect(() => {
    if (user.userId) {
      fetchHomeEvents();
    }
  }, [filterOption, date, user.userId]);

  useEffect(() => {
    if (user.userId) {
      fetchNextEvent();
      fetchEventDates();
    }
  }, [user.userId]);

  // Save state whenever it changes
  useEffect(() => {
    if (user.userId) {
      saveHomePageState();
    }
  }, [filterOption, date, user.userId]);

  useEffect(() => {
    if (user.userId) {
      fetchHomeEvents();
    }
  }, [filterOption, date, user.userId]);

  useEffect(() => {
    if (user.userId) {
      fetchNextEvent();
      fetchEventDates();
    }
  }, [user.userId]);


  const fetchHomeEvents = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      if (filterOption === 'suggestedEvents') {
        await fetchSuggestedEvents();
        return;
      }

      const payload = {
        showCalendarEvents: filterOption === 'calendar',
        showMyNextEvents: filterOption === 'myNextEvents',
        showAllMyEvents: filterOption === 'allMyEvents',
        date: filterOption === 'calendar' ? formatDate(date) : null
      };

      const response = await fetch('http://localhost:9013/events/home-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedEvents = async () => {
    setLoadingRecommendations(true);
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      const userId = user.userId;

      const recommendationRequest = {
        city: 'Bucharest', 
        eventType: null, 
        preferredDate: null, 
        preferredBoardgames: [], 
        maxBudget: null,
        groupSize: null 
      };

      const response = await fetch('http://localhost:9013/api/events/recommendations?page=1&size=10', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'user-id': userId
        },
        body: JSON.stringify(recommendationRequest)
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      
      const recommendedEventsList = data.content || [];
      
      setEvents(recommendedEventsList);
      setRecommendedEvents(recommendedEventsList);
    } catch (error) {
      console.error('Error fetching suggested events:', error);
      setEvents([]);
      setRecommendedEvents([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchEventDates = async () => {
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const response = await fetch('http://localhost:9013/events/dates', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch event dates');

      const dates = await response.json();
      setEventDates(dates.map(d => new Date(d)));
    } catch (error) {
      console.error('Error fetching event dates:', error);
    }
  };

  const fetchNextEvent = async () => {
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      const response = await fetch('http://localhost:9013/events/next-event', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        if (response.status === 404) {
          setNextEvent(null);
          return;
        }
        throw new Error('Failed to fetch next event');
      }
  
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || contentLength === null) {
        setNextEvent(null);
        return;
      }
  
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '' || responseText.trim() === 'null') {
        setNextEvent(null);
        return;
      }
  
      try {
        const data = JSON.parse(responseText);
        setNextEvent(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setNextEvent(null);
      }
  
    } catch (error) {
      console.error('Error fetching next event:', error);
      setNextEvent(null);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const response = await fetch(`http://localhost:9013/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to register for event');

      fetchHomeEvents();
      fetchNextEvent();
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Failed to register for event. Please try again.');
    }
  };

  const handleWithdrawEvent = async (eventId) => {
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const response = await fetch(`http://localhost:9013/events/${eventId}/withdraw`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to withdraw from event');

      fetchHomeEvents();
      fetchNextEvent();
    } catch (error) {
      console.error('Error withdrawing from event:', error);
      alert('Failed to withdraw from event. Please try again.');
    }
  };

  const handleViewDetails = (eventId) => {
    saveHomePageState();
    navigate(`/events/${eventId}`, {
      state: { fromHomePage: true }
    });  };

  const handleEditEvent = (eventId) => {
    saveHomePageState();
    navigate(`/events-edit/${eventId}`, {
      state: { fromHomePage: true }
    });
    };

  const handleFilterChange = (event) => {
    setFilterOption(event.target.value);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setFilterOption('calendar');
  };

  const isParticipating = (event) => {
    return event.participantsIds?.includes(user.userId);
  };

  const isOwner = (event) => {
    return event.owner === user.userId;
  };

  const isPlanner = () => {
    return user.role === 'EVENT_PLANNER' || user.groups?.includes('eventPlanner');
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasEvent = eventDates.some(eventDate =>
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );

      return hasEvent ? <div className="event-dot"></div> : null;
    }
    return null;
  };

  const formatDisplayDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1600px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        <Box sx={{
          width: { xs: '100%', md: '320px' },
          flexShrink: 0,
          '& > .MuiPaper-root': {
            boxShadow: 3,
            borderRadius: 2
          }
        }}>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              width: '100%'
            }}
          >
            <Calendar
              onChange={handleDateChange}
              value={date}
              tileContent={tileContent}
              className="small-calendar"
            />
          </Paper>

          <Paper
            sx={{
              p: 2,
              mb: 3,
              width: '100%'
            }}
          >
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormLabel component="legend" sx={{ fontSize: '1rem', mb: 0.75, fontWeight: 'bold' }}>Event Filters</FormLabel>
              <RadioGroup
                name="filter-options"
                value={filterOption}
                onChange={handleFilterChange}
                sx={{ width: '100%' }}
              >
                <FormControlLabel
                  value="calendar"
                  control={<Radio sx={{ p: 0.5 }} />}
                  label={<Typography fontSize="0.95rem">Calendar Events</Typography>}
                  sx={{ margin: 0, height: '36px' }}
                />
                <FormControlLabel
                  value="myNextEvents"
                  control={<Radio sx={{ p: 0.5 }} />}
                  label={<Typography fontSize="0.95rem">Show My Next Events</Typography>}
                  sx={{ margin: 0, height: '36px' }}
                />
                <FormControlLabel
                  value="allMyEvents"
                  control={<Radio sx={{ p: 0.5 }} />}
                  label={<Typography fontSize="0.95rem">View All My Events</Typography>}
                  sx={{ margin: 0, height: '36px' }}
                />
                {/* <FormControlLabel
                  value="suggestedEvents"
                  control={<Radio sx={{ p: 0.5 }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AutoAwesomeIcon sx={{ mr: 0.5, fontSize: '1rem', color: 'primary.main' }} />
                      <Typography fontSize="0.95rem">Event Recommendations</Typography>
                    </Box>
                  }
                  sx={{ margin: 0, height: '36px' }}
                /> */}
              </RadioGroup>
            </FormControl>
          </Paper>

          <Paper
            sx={{
              p: 2,
              width: '100%'
            }}
          >
            <Typography variant="subtitle1" gutterBottom fontSize="1rem" sx={{ fontWeight: 'bold', mb: 0.75 }}>
              <EventAvailableIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.1rem' }} />
              Your Next Event
            </Typography>

            {nextEvent ? (
              <Card sx={{ boxShadow: 1, mt: 0.5 }}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ mb: 0.75, fontSize: '0.95rem' }}>
                    {nextEvent.title}
                  </Typography>

                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.75, fontSize: '0.9rem' }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                    {nextEvent.day}, {nextEvent.startHour}
                  </Typography>

                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                    {nextEvent.venueName || nextEvent.city}
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<VisibilityIcon sx={{ fontSize: '0.85rem' }} />}
                    onClick={() => handleViewDetails(nextEvent.id)}
                    sx={{ mt: 1.5, fontSize: '0.85rem', py: 0.5, minHeight: '32px' }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ boxShadow: 1, mt: 0.5, bgcolor: 'background.default' }}>
                <CardContent sx={{ p: 1.5, textAlign: 'center', "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.9rem">
                    You have no events registered in the future!
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              minHeight: '80vh',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              boxShadow: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                {filterOption === 'calendar' && `Events for ${formatDisplayDate(date)}`}
                {filterOption === 'myNextEvents' && 'My Upcoming Events'}
                {filterOption === 'allMyEvents' && 'All My Events'}
                {filterOption === 'suggestedEvents' && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AutoAwesomeIcon sx={{ mr: 1, color: 'primary.main' }} />
                    AI-Powered Event Recommendations
                  </Box>
                )}
              </Typography>
            </Box>

            {filterOption === 'suggestedEvents' && (
              <Alert 
                severity="info" 
                sx={{ mb: 2 }}
                icon={<AutoAwesomeIcon />}
              >
                These recommendations are personalized based on your search history, preferences, and past event participation using AI.
              </Alert>
            )}

            {(loading || (filterOption === 'suggestedEvents' && loadingRecommendations)) ? (
              filterOption === 'suggestedEvents' ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    AI is analyzing your preferences...
                  </Typography>
                  <RecommendationSkeleton />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <CircularProgress />
                </Box>
              )
            ) : events.length > 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  maxHeight: 'calc(80vh - 100px)',
                  overflowY: 'auto',
                  pr: 1,
                  scrollbarWidth: 'thin',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                  },
                }}
              >
                {filterOption === 'allMyEvents' ? (
                  (() => {
                    const groupedEvents = events.reduce((acc, event) => {
                      if (!acc[event.day]) {
                        acc[event.day] = [];
                      }
                      acc[event.day].push(event);
                      return acc;
                    }, {});

                    const sortedDates = Object.keys(groupedEvents).sort();

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const pastDates = sortedDates.filter(date => new Date(date) < today);
                    const futureDates = sortedDates.filter(date => new Date(date) >= today);

                    return (
                      <>
                        {futureDates.length > 0 && (
                          <>
                            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Upcoming Events</Typography>
                            {futureDates.map(date => (
                              <Box key={date}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2, mb: 3 }}>
                                  {groupedEvents[date].map(event => (
                                    <EventCard
                                      key={event.id}
                                      event={event}
                                      isParticipating={isParticipating(event)}
                                      isOwner={isOwner(event)}
                                      isPlanner={isPlanner()}
                                      onViewDetails={handleViewDetails}
                                      onEditEvent={handleEditEvent}
                                      onJoinEvent={handleJoinEvent}
                                      onWithdrawEvent={handleWithdrawEvent}
                                      isPast={false}
                                      isRecommended={false}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </>
                        )}

                        {pastDates.length > 0 && (
                          <>
                            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Past Events</Typography>
                            {pastDates.reverse().map(date => (
                              <Box key={date}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2, mb: 3 }}>
                                  {groupedEvents[date].map(event => (
                                    <EventCard
                                      key={event.id}
                                      event={event}
                                      isParticipating={isParticipating(event)}
                                      isOwner={isOwner(event)}
                                      isPlanner={isPlanner()}
                                      onViewDetails={handleViewDetails}
                                      onEditEvent={handleEditEvent}
                                      onJoinEvent={handleJoinEvent}
                                      onWithdrawEvent={handleWithdrawEvent}
                                      isPast={true}
                                      isRecommended={false}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </>
                        )}
                      </>
                    );
                  })()
                )
                 : (
                  events.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isParticipating={isParticipating(event)}
                      isOwner={isOwner(event)}
                      isPlanner={isPlanner()}
                      onViewDetails={handleViewDetails}
                      onEditEvent={handleEditEvent}
                      onJoinEvent={handleJoinEvent}
                      onWithdrawEvent={handleWithdrawEvent}
                      isPast={isPastDate(event.day)}
                      isRecommended={filterOption === 'suggestedEvents'}
                      recommendationScore={event.recommendationScore}
                      recommendationExplanation={event.recommendationExplanation}
                    />
                  ))
                )}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                {filterOption === 'calendar' && `There are no events taking place on ${formatDisplayDate(date)}.`}
                {filterOption === 'myNextEvents' && "You don't have any upcoming events."}
                {filterOption === 'allMyEvents' && "You haven't participated in any events yet."}
                {/* {filterOption === 'suggestedEvents' && "No personalized recommendations available. Try searching for some events first to help us learn your preferences!"} */}
              </Alert>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default Home;