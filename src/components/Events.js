import React, { useEffect, useState } from 'react';
import {
  Box, TextField, Button, Grid, Card, CardContent, Typography, CardActions,
  FormControl, InputLabel, Select, MenuItem, Pagination, OutlinedInput,
  FormHelperText, Chip, Divider, Checkbox, FormControlLabel
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSession } from '../cognito';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import HomeIcon from '@mui/icons-material/Home';

const Events = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const defaultFilters = {
    title: '',
    venueName: '',
    city: '',
    fromDate: '',
    toDate: '',
    boardGame: '',
    availability: '',
    ownedOnly: false
  };
  
  const [filters, setFilters] = useState(defaultFilters);
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState({ role: '', userId: '', groups: [] });
  
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({
    totalItems: 0,
    totalPages: 0,
    isFirst: true,
    isLast: true
  });
  
  const [dateErrors, setDateErrors] = useState({
    fromDate: '',
    toDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);

  const cityOptions = ['Cluj', 'Bucuresti', 'Timisoara'];
  const availabilityOptions = ['All', 'Available Seats', 'Full'];
  const pageSizeOptions = [5, 10, 15];

  useEffect(() => {
    const restoreStateFromLocalStorage = () => {
      try {
        const savedFilters = JSON.parse(localStorage.getItem('eventSearchFilters'));
        if (savedFilters) {
          Object.keys(savedFilters).forEach(key => {
            if (savedFilters[key] === null) savedFilters[key] = '';
          });
          
          setFilters({
            ...defaultFilters,
            ...savedFilters,
            ownedOnly: savedFilters.ownedOnly === true
          });
        }
        
        const savedPageNumber = localStorage.getItem('eventPageNumber');
        const savedPageSize = localStorage.getItem('eventPageSize');
        
        if (savedPageNumber) setPageNumber(parseInt(savedPageNumber, 10));
        if (savedPageSize) setPageSize(parseInt(savedPageSize, 10));
        
        const savedResults = JSON.parse(localStorage.getItem('eventSearchResults'));
        if (savedResults) {
          setEvents(savedResults.content || []);
          setPaginationInfo({
            totalItems: savedResults.totalItems || 0,
            totalPages: savedResults.totalPages || 0,
            isFirst: savedResults.first || false,
            isLast: savedResults.last || false
          });
          setStateRestored(true);
        }
      } catch (error) {
        console.error('Error restoring state from localStorage:', error);
      }
    };

    restoreStateFromLocalStorage();
  }, []);

  useEffect(() => {
    const loadUserProfileAndEvents = async () => {
      if (stateRestored) return;
      
      try {
        setLoading(true);
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();

        const response = await fetch('http://localhost:9013/user-service/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch user profile');

        const userProfile = await response.json();
        
        const groups = session.getIdToken().payload['cognito:groups'] || [];
        
        setUser({
          role: userProfile.role,
          userId: userProfile.userId,
          groups: groups
        });
  
        await searchEvents(filters, pageNumber, pageSize);
      } catch (error) {
        console.error('Error loading user or events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfileAndEvents();
  }, [stateRestored]);
  
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
          role: userProfile.role,
          userId: userProfile.userId,
          groups: groups
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, []);

  useEffect(() => {
    validateDates(filters.fromDate, filters.toDate);
  }, [filters.fromDate, filters.toDate]);

  const validateDates = (fromDate, toDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newErrors = {
      fromDate: '',
      toDate: ''
    };
    
    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      if (fromDateObj < today) {
        newErrors.fromDate = 'From date cannot be in the past';
      }
    }
    
    if (toDate) {
      const toDateObj = new Date(toDate);
      
      if (fromDate) {
        const fromDateObj = new Date(fromDate);
        if (toDateObj < fromDateObj) {
          newErrors.toDate = 'To date must be after from date';
        }
      } else if (toDateObj < today) {
        newErrors.toDate = 'To date cannot be in the past';
      }
    }
    
    setDateErrors(newErrors);
  };

  const hasErrors = () => {
    return dateErrors.fromDate !== '' || dateErrors.toDate !== '';
  };

  const isPlanner = user.groups?.includes('eventPlanner') || user.role === 'EVENT_PLANNER';

  async function searchEvents(searchFilters, page, size) {
    try {
      setLoading(true);
      
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const filteredParams = { ...searchFilters };
      delete filteredParams.pageNumber;
      delete filteredParams.pageSize;
      delete filteredParams.participants;
      
      if (filteredParams.ownedOnly) {
        if (isPlanner) {
          filteredParams.owner = user.userId;
        } else {
          filteredParams.participant = user.userId;
        }
      }
      
      delete filteredParams.ownedOnly;
      
      console.log('Searching with filters:', filteredParams, 'page:', page, 'size:', size);
      
      localStorage.setItem('eventSearchFilters', JSON.stringify(filteredParams));
      localStorage.setItem('eventPageNumber', page.toString());
      localStorage.setItem('eventPageSize', size.toString());

      const url = `http://localhost:9013/events/search?page=${page}&size=${size}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filteredParams)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} ${errorText}`);
      }

      const results = await response.json();
      localStorage.setItem('eventSearchResults', JSON.stringify(results));

      setEvents(results.content || []);
      setPaginationInfo({
        totalItems: results.totalItems || 0,
        totalPages: results.totalPages || 0,
        isFirst: results.first || false,
        isLast: results.last || false
      });
      
      return results;
    } catch (error) {
      console.error('Error searching events:', error);
      setEvents([]);
      setPaginationInfo({
        totalItems: 0,
        totalPages: 0,
        isFirst: true,
        isLast: true
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSearchClick = () => {
    setPageNumber(1);
    searchEvents(filters, 1, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPageNumber(value);
    searchEvents(filters, value, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPageNumber(1); 
    searchEvents(filters, 1, newSize);
  };

  const handleViewDetails = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleEditEvent = (eventId) => {
    navigate(`/events-edit/${eventId}`);
  };

  const handleCreateEvent = () => {
    navigate('/events/create');
  };

  const handleClearFilters = () => {
    localStorage.removeItem('eventSearchFilters');
    localStorage.removeItem('eventSearchResults');
    localStorage.removeItem('eventPageNumber');
    localStorage.removeItem('eventPageSize');
    
    const clearedFilters = {
      title: '',
      venueName: '',
      city: '',
      fromDate: '',
      toDate: '',
      boardGame: '',
      availability: '',
      ownedOnly: false
    };
    
    setFilters(clearedFilters);
    setDateErrors({
      fromDate: '',
      toDate: ''
    });
    
    setPageNumber(1);
    setPageSize(10); 
    searchEvents(clearedFilters, 1, 10);
  };

  const getTodayFormatted = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinDateForToDate = () => {
    if (filters.fromDate) {
      return filters.fromDate;
    }
    return getTodayFormatted();
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
        borderWidth: 2
      },
      '&:hover fieldset': {
        borderColor: 'primary.light'
      },
      height: '56px'
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'primary.main'
    }
  };
  
  const selectStyle = {
    ...inputStyle, 
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      width: '150px',  
      height: '24px',
      paddingRight: '32px' 
    },
    minHeight: '56px'
  };
  
  const containerStyle = {
    width: '100%',
    maxWidth: '100%',
    mx: 'auto', 
    px: 4,
    boxSizing: 'border-box'
  };
  
  return (
    <Box sx={containerStyle}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Events</Typography>
        {isPlanner && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateEvent}
            sx={{ fontWeight: 'bold' }}
          >
            Create Event
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 4, p: 2, boxShadow: 2, width: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" display="flex" alignItems="center">
              <FilterAltIcon sx={{ mr: 1 }} /> Search Filters
            </Typography>
            <Button 
              startIcon={<ClearIcon />} 
              onClick={handleClearFilters}
              size="small"
            >
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title"
                fullWidth
                value={filters.title}
                onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                sx={inputStyle}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Venue Name"
                fullWidth
                value={filters.venueName}
                onChange={(e) => setFilters({ ...filters, venueName: e.target.value })}
                sx={inputStyle}
                InputProps={{
                  startAdornment: <HomeIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={selectStyle}>
                <InputLabel id="city-label">City</InputLabel>
                <Select
                  labelId="city-label"
                  value={filters.city}
                  label="City"
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  startAdornment={<LocationOnIcon color="action" sx={{ mr: 1 }} />}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200
                      },
                    },
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', width: '100%' }}>
                      {selected || "All Cities"}
                    </Box>
                  )}
                >
                  <MenuItem value="">All Cities</MenuItem>
                  {cityOptions.map(city => (
                    <MenuItem key={city} value={city}>{city}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Board Game"
                fullWidth
                value={filters.boardGame}
                onChange={(e) => setFilters({ ...filters, boardGame: e.target.value })}
                sx={inputStyle}
                InputProps={{
                  startAdornment: <SportsEsportsIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={selectStyle}>
                <InputLabel id="availability-label">Availability</InputLabel>
                <Select
                  labelId="availability-label"
                  value={filters.availability}
                  label="Availability"
                  onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200
                      },
                    },
                  }}
                >
                  {availabilityOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                sx={inputStyle}
                error={!!dateErrors.fromDate}
                helperText={dateErrors.fromDate}
                InputProps={{
                  startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />,
                  inputProps: { min: getTodayFormatted() }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                sx={inputStyle}
                error={!!dateErrors.toDate}
                helperText={dateErrors.toDate}
                InputProps={{
                  startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />,
                  inputProps: { min: getMinDateForToDate() }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.ownedOnly}
                    onChange={(e) => setFilters({ ...filters, ownedOnly: e.target.checked })}
                    color="primary"
                  />
                }
                label={isPlanner ? "Owned" : "Registered"}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button 
                variant="contained" 
                onClick={handleSearchClick}
                startIcon={<SearchIcon />}
                sx={{ height: '56px', minWidth: '150px' }}
                disabled={hasErrors() || loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ width: '100%', position: 'relative', mb: 2 }}>
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(255,255,255,0.7)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            zIndex: 2
          }}>
            <Typography>Loading events...</Typography>
          </Box>
        )}
        
        {events.length > 0 ? (
          events.map(event => (
            <Card 
              key={event.id} 
              sx={{ 
                mb: 3, 
                width: '100%',
                boxShadow: 2, 
                '&:hover': { boxShadow: 6 },
                minHeight: '140px',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ 
                height: '8px', 
                width: '100%',
                backgroundColor: event.participantsIds.length >= event.maxParticipants ? 'error.main' : 'success.main' 
              }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 8px)' }}>
                <Box sx={{ p: 2, flex: '1 0 auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
                          {event.title}
                        </Typography>
                        <Chip 
                          label={event.participantsIds.length >= event.maxParticipants ? 'Full' : 'Available'} 
                          color={event.participantsIds.length >= event.maxParticipants ? 'error' : 'success'}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body1" sx={{ mb: 0.5 }}>
                        <strong>Venue:</strong> {event.venueName}{event.city && `, ${event.city}`}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {event.address}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-end',
                      minWidth: '200px'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1" noWrap>
                          {event.day}, {event.startHour} - {event.endHour}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          {event.participantsIds.length || 0}/{event.maxParticipants || 'Unlimited'}
                        </Typography>
                      </Box>
                      
                      <Button 
                        color="primary" 
                        variant="contained"
                        onClick={() => handleViewDetails(event.id)}
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Box>
                </Box>
                
                {(isPlanner && event.owner === user.userId) && (
                  <Box sx={{ px: 2, pb: 2, pt: 0, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <Button 
                      color="secondary"
                      variant="outlined" 
                      onClick={() => handleEditEvent(event.id)}
                      size="small"
                    >
                      Edit
                    </Button>
                  </Box>
                )}
              </Box>
            </Card>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
            <Typography variant="h6" color="text.secondary">No events found</Typography>
            <Typography variant="body2" color="text.secondary">Try adjusting your search filters</Typography>
          </Box>
        )}
      </Box>

      {events.length > 0 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              input={<OutlinedInput />}
              size="small"
              displayEmpty
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 200
                  },
                },
              }}
            >
              {pageSizeOptions.map(option => (
                <MenuItem key={option} value={option}>{option} per page</MenuItem>
              ))}
            </Select>
            <FormHelperText>Events per page</FormHelperText>
          </FormControl>
          
          <Pagination 
            count={paginationInfo.totalPages} 
            page={pageNumber} 
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            disabled={loading}
          />
          
          <Typography variant="body2" color="text.secondary">
            Showing {events.length} of {paginationInfo.totalItems} events
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Events;