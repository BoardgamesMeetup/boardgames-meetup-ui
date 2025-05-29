import React, { useEffect, useState } from 'react';
import {
  Box, TextField, Button, Grid, Card, CardContent, Typography, CardActions,
  FormControl, InputLabel, Select, MenuItem, Pagination, OutlinedInput,
  FormHelperText, Chip, Divider, Checkbox, FormControlLabel, Alert
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
import RecommendIcon from '@mui/icons-material/Recommend';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';

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
    ownedOnly: false,
    address: '',
    minPrice: '',
    maxPrice: '',
    minParticipants: '',
    maxParticipants: ''
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
  const [priceErrors, setPriceErrors] = useState({
    minPrice: '',
    maxPrice: ''
  });
  const [participantErrors, setParticipantErrors] = useState({
    minParticipants: '',
    maxParticipants: ''
  });
  const [loading, setLoading] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);
  const [isShowingRecommendations, setIsShowingRecommendations] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState(null);

  const cityOptions = ['Cluj', 'Bucuresti', 'Timisoara'];
  const availabilityOptions = ['All', 'Available Seats', 'Full'];
  const pageSizeOptions = [5, 10, 15];

  useEffect(() => {
    const restoreStateFromLocalStorage = () => {
      try {
        const savedFilters = JSON.parse(localStorage.getItem('eventSearchFilters'));
        if (savedFilters) {
          const restoredFilters = { ...defaultFilters };
          Object.keys(savedFilters).forEach(key => {
            if (savedFilters[key] !== null && savedFilters[key] !== undefined) {
              restoredFilters[key] = savedFilters[key];
            }
          });
          
          restoredFilters.ownedOnly = savedFilters.ownedOnly === true;
          
          console.log('Restored filters from localStorage:', restoredFilters);
          setFilters(restoredFilters);
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

  useEffect(() => {
    validatePrices(filters.minPrice, filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    validateParticipants(filters.minParticipants, filters.maxParticipants);
  }, [filters.minParticipants, filters.maxParticipants]);


useEffect(() => {
  const restoreSearchContext = () => {
    const savedSearchId = localStorage.getItem('currentSearchId');
    const searchTimestamp = localStorage.getItem('searchTimestamp');
    
    if (savedSearchId && searchTimestamp) {
      const isRecentSearch = (Date.now() - parseInt(searchTimestamp)) < 60 * 60 * 1000;
      if (isRecentSearch) {
        setCurrentSearchId(savedSearchId);
        console.log('Restored searchId:', savedSearchId);
      } else {
        localStorage.removeItem('currentSearchId');
        localStorage.removeItem('searchTimestamp');
        console.log('Cleaned up old search context');
      }
    }
  };
  
  restoreSearchContext();
}, []);

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

  const validatePrices = (minPrice, maxPrice) => {
    const newErrors = {
      minPrice: '',
      maxPrice: ''
    };
    
    const minPriceNum = parseFloat(minPrice);
    const maxPriceNum = parseFloat(maxPrice);
    
    if (minPrice && (isNaN(minPriceNum) || minPriceNum < 0)) {
      newErrors.minPrice = 'Min price must be a positive number';
    }
    
    if (maxPrice && (isNaN(maxPriceNum) || maxPriceNum < 0)) {
      newErrors.maxPrice = 'Max price must be a positive number';
    }
    
    if (minPrice && maxPrice && !isNaN(minPriceNum) && !isNaN(maxPriceNum) && minPriceNum > maxPriceNum) {
      newErrors.maxPrice = 'Max price must be greater than min price';
    }
    
    setPriceErrors(newErrors);
  };

  const validateParticipants = (minParticipants, maxParticipants) => {
    const newErrors = {
      minParticipants: '',
      maxParticipants: ''
    };
    
    const minParticipantsNum = parseInt(minParticipants);
    const maxParticipantsNum = parseInt(maxParticipants);
    
    if (minParticipants && (isNaN(minParticipantsNum) || minParticipantsNum < 0)) {
      newErrors.minParticipants = 'Min participants must be a positive number';
    }
    
    if (maxParticipants && (isNaN(maxParticipantsNum) || maxParticipantsNum < 0)) {
      newErrors.maxParticipants = 'Max participants must be a positive number';
    }
    
    if (minParticipants && maxParticipants && !isNaN(minParticipantsNum) && !isNaN(maxParticipantsNum) && minParticipantsNum > maxParticipantsNum) {
      newErrors.maxParticipants = 'Max participants must be greater than min participants';
    }
    
    setParticipantErrors(newErrors);
  };

  const hasErrors = () => {
    return dateErrors.fromDate !== '' || dateErrors.toDate !== '' ||
           priceErrors.minPrice !== '' || priceErrors.maxPrice !== '' ||
           participantErrors.minParticipants !== '' || participantErrors.maxParticipants !== '';
  };

  const isPlanner = user.groups?.includes('eventPlanner') || user.role === 'EVENT_PLANNER';

  const createSearchParams = (searchFilters) => {
    const params = {};
    
    if (searchFilters.title && searchFilters.title.trim()) {
      params.title = searchFilters.title.trim();
    }
    if (searchFilters.venueName && searchFilters.venueName.trim()) {
      params.venueName = searchFilters.venueName.trim();
    }
    if (searchFilters.city && searchFilters.city.trim()) {
      params.city = searchFilters.city.trim();
    }
    if (searchFilters.fromDate && searchFilters.fromDate.trim()) {
      params.fromDate = searchFilters.fromDate.trim();
    }
    if (searchFilters.toDate && searchFilters.toDate.trim()) {
      params.toDate = searchFilters.toDate.trim();
    }
    if (searchFilters.boardGame && searchFilters.boardGame.trim()) {
      params.boardGame = searchFilters.boardGame.trim();
    }
    if (searchFilters.availability && searchFilters.availability.trim() && searchFilters.availability !== 'All') {
      params.availability = searchFilters.availability.trim();
    }
    if (searchFilters.address && searchFilters.address.trim()) {
      params.address = searchFilters.address.trim();
    }
    
    if (searchFilters.minPrice && searchFilters.minPrice.toString().trim()) {
      const minPrice = parseFloat(searchFilters.minPrice);
      if (!isNaN(minPrice) && minPrice >= 0) {
        params.minPrice = minPrice;
      }
    }
    if (searchFilters.maxPrice && searchFilters.maxPrice.toString().trim()) {
      const maxPrice = parseFloat(searchFilters.maxPrice);
      if (!isNaN(maxPrice) && maxPrice >= 0) {
        params.maxPrice = maxPrice;
      }
    }
    if (searchFilters.minParticipants && searchFilters.minParticipants.toString().trim()) {
      const minParticipants = parseInt(searchFilters.minParticipants);
      if (!isNaN(minParticipants) && minParticipants >= 0) {
        params.minParticipants = minParticipants;
      }
    }
    if (searchFilters.maxParticipants && searchFilters.maxParticipants.toString().trim()) {
      const maxParticipants = parseInt(searchFilters.maxParticipants);
      if (!isNaN(maxParticipants) && maxParticipants >= 0) {
        params.maxParticipants = maxParticipants;
      }
    }
    
    if (searchFilters.ownedOnly) {
      if (isPlanner) {
        params.owner = user.userId;
      } else {
        params.participant = user.userId;
      }
    }
    
    return params;
  };

  async function searchEvents(searchFilters, page, size) {
    try {
      setLoading(true);
      setIsShowingRecommendations(false);
      
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const filteredParams = createSearchParams(searchFilters);
      
      console.log('=== SEARCH DEBUG ===');
      console.log('Original filters state:', searchFilters);
      console.log('FromDate in state:', JSON.stringify(searchFilters.fromDate));
      console.log('ToDate in state:', JSON.stringify(searchFilters.toDate));
      console.log('Processed search params:', filteredParams);
      console.log('Search request - page:', page, 'size:', size);
      
      const filtersToSave = { ...searchFilters };
      delete filtersToSave.ownedOnly;
      
      localStorage.setItem('eventSearchFilters', JSON.stringify(filtersToSave));
      localStorage.setItem('eventPageNumber', page.toString());
      localStorage.setItem('eventPageSize', size.toString());

      const url = `http://localhost:9013/events/search?page=${page}&size=${size}`;
      
      const requestBody = JSON.stringify(filteredParams);
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: requestBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} ${errorText}`);
      }

      const results = await response.json();
       // Handle searchId from response (if your backend returns it)
    if (results.searchId) {
      setCurrentSearchId(results.searchId);
      localStorage.setItem('currentSearchId', results.searchId);
      localStorage.setItem('searchTimestamp', Date.now().toString());
      console.log('Received searchId from backend:', results.searchId);
    } else {
      // Generate client-side searchId as fallback
      const clientSearchId = generateClientSearchId();
      setCurrentSearchId(clientSearchId);
      localStorage.setItem('currentSearchId', clientSearchId);
      localStorage.setItem('searchTimestamp', Date.now().toString());
      console.log('Generated client-side searchId:', clientSearchId);
    }
    
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

  const generateClientSearchId = () => {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  async function getRecommendations(page = 1, size = 10) {
    try {
      setRecommendationsLoading(true);
      setIsShowingRecommendations(true);
      
      setCurrentSearchId(null);
    localStorage.removeItem('currentSearchId');
    localStorage.removeItem('searchTimestamp');

      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const recommendationRequest = {};

      if (filters.city && filters.city.trim()) {
        recommendationRequest.city = filters.city.trim();
      }
      
      console.log('Getting recommendations for user:', user.userId, 'with request:', recommendationRequest);
      
      const url = `http://localhost:9013/events/recommendations/${user.userId}?page=${page}&size=${size}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recommendationRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Recommendations failed: ${response.status} ${errorText}`);
      }

      const results = await response.json();
      
      setEvents(results.content || []);
      setPaginationInfo({
        totalItems: results.totalItems || 0,
        totalPages: results.totalPages || 0,
        isFirst: results.first || false,
        isLast: results.last || false
      });
      
      setPageNumber(page);
      setPageSize(size);
      
      return results;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setEvents([]);
      setPaginationInfo({
        totalItems: 0,
        totalPages: 0,
        isFirst: true,
        isLast: true
      });
    } finally {
      setRecommendationsLoading(false);
    }
  }

  const handleSearchClick = () => {
    console.log('Search button clicked - current filters:', filters);
    setPageNumber(1);
    searchEvents(filters, 1, pageSize);
  };

  const handleSuggestionsClick = () => {
    setPageNumber(1);
    getRecommendations(1, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPageNumber(value);
    if (isShowingRecommendations) {
      getRecommendations(value, pageSize);
    } else {
      searchEvents(filters, value, pageSize);
    }
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPageNumber(1);
    
    if (isShowingRecommendations) {
      getRecommendations(1, newSize);
    } else {
      searchEvents(filters, 1, newSize);
    }
  };

  const handleViewDetails = (eventId) => {
const searchId = currentSearchId || localStorage.getItem('currentSearchId');
  
const searchTimestamp = localStorage.getItem('searchTimestamp');
const isRecentSearch = searchTimestamp && 
  (Date.now() - parseInt(searchTimestamp)) < 60 * 60 * 1000;

if (searchId && isRecentSearch && !isShowingRecommendations) {
  navigate(`/events/${eventId}?searchId=${searchId}`);
  console.log('Navigating with searchId:', searchId);
} else {
  navigate(`/events/${eventId}`);
  console.log('Navigating without searchId - recommendations or no recent search');
}
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
    localStorage.removeItem('currentSearchId');
    localStorage.removeItem('searchTimestamp');

    const clearedFilters = { ...defaultFilters };
    
    console.log('Clearing filters, setting to:', clearedFilters);
    setFilters(clearedFilters);
    setDateErrors({
      fromDate: '',
      toDate: ''
    });
    setPriceErrors({
      minPrice: '',
      maxPrice: ''
    });
    setParticipantErrors({
      minParticipants: '',
      maxParticipants: ''
    });
    
    setPageNumber(1);
    setPageSize(10); 
    setIsShowingRecommendations(false);
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

  const handleFromDateChange = (event) => {
    const newValue = event.target.value;
    console.log('From date changing from:', JSON.stringify(filters.fromDate), 'to:', JSON.stringify(newValue));
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, fromDate: newValue };
      console.log('New filters state will be:', newFilters);
      return newFilters;
    });
  };

  const handleToDateChange = (event) => {
    const newValue = event.target.value;
    console.log('To date changing from:', JSON.stringify(filters.toDate), 'to:', JSON.stringify(newValue));
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, toDate: newValue };
      console.log('New filters state will be:', newFilters);
      return newFilters;
    });
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

            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                value={filters.address}
                onChange={(e) => setFilters({ ...filters, address: e.target.value })}
                sx={inputStyle}
                InputProps={{
                  startAdornment: <LocationSearchingIcon color="action" sx={{ mr: 1 }} />,
                }}
                placeholder="Search in venue address"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.fromDate}
                onChange={handleFromDateChange}
                sx={inputStyle}
                error={!!dateErrors.fromDate}
                helperText={dateErrors.fromDate}
                InputProps={{
                  startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />,
                  inputProps: { min: getTodayFormatted() }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.toDate}
                onChange={handleToDateChange}
                sx={inputStyle}
                error={!!dateErrors.toDate}
                helperText={dateErrors.toDate}
                InputProps={{
                  startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />,
                  inputProps: { min: getMinDateForToDate() }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Min Price"
                type="number"
                fullWidth
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                sx={inputStyle}
                error={!!priceErrors.minPrice}
                helperText={priceErrors.minPrice}
                InputProps={{
                  startAdornment: <AttachMoneyIcon color="action" sx={{ mr: 1 }} />,
                  inputProps: { min: 0, step: 0.01 }
                }}
                placeholder="0.00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Max Price"
                type="number"
                fullWidth
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                sx={inputStyle}
                error={!!priceErrors.maxPrice}
                helperText={priceErrors.maxPrice}
                InputProps={{
                  startAdornment: <AttachMoneyIcon color="action" sx={{ mr: 1 }} />,
                  inputProps: { min: 0, step: 0.01 }
                }}
                placeholder="0.00"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Min Participants"
                type="number"
                fullWidth
                value={filters.minParticipants}
                onChange={(e) => setFilters({ ...filters, minParticipants: e.target.value })}
                sx={inputStyle}
                error={!!participantErrors.minParticipants}
                helperText={participantErrors.minParticipants}
                InputProps={{
                  startAdornment: <PeopleIcon color="action" sx={{ mr: 1 }} />,
                  inputProps: { min: 0, step: 1 }
                }}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Max Participants"
                type="number"
                fullWidth
                value={filters.maxParticipants}
                onChange={(e) => setFilters({ ...filters, maxParticipants: e.target.value })}
                sx={inputStyle}
                error={!!participantErrors.maxParticipants}
                helperText={participantErrors.maxParticipants}
                InputProps={{
                  startAdornment: <PeopleIcon color="action" sx={{ mr: 1 }} />,
                  inputProps: { min: 0, step: 1 }
                }}
                placeholder="0"
              />
            </Grid>

            <Grid item xs={12} md={8} sx={{ display: 'flex', alignItems: 'center' }}>
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
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleSuggestionsClick}
                startIcon={<RecommendIcon />}
                sx={{ height: '56px', minWidth: '120px' }}
                disabled={recommendationsLoading || !user.userId}
              >
                {recommendationsLoading ? 'Loading...' : 'Suggestions'}
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSearchClick}
                startIcon={<SearchIcon />}
                sx={{ height: '56px', minWidth: '120px' }}
                disabled={hasErrors() || loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isShowingRecommendations && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Showing personalized event recommendations based on your preferences
          </Typography>
        </Alert>
      )}

      <Box sx={{ width: '100%', position: 'relative', mb: 2 }}>
        {(loading || recommendationsLoading) && (
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
            <Typography>
              {isShowingRecommendations ? 'Loading recommendations...' : 'Loading events...'}
            </Typography>
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
                overflow: 'hidden',
                ...(isShowingRecommendations && {
                  border: '2px solid',
                  borderColor: 'primary.light',
                  backgroundColor: 'primary.50'
                })
              }}
            >
              <Box sx={{ 
                height: '8px', 
                width: '100%',
                backgroundColor: event.participantsIds?.length >= event.maxParticipants ? 'error.main' : 'success.main' 
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
                          label={event.participantsIds?.length >= event.maxParticipants ? 'Full' : 'Available'} 
                          color={event.participantsIds?.length >= event.maxParticipants ? 'error' : 'success'}
                          size="small"
                        />
                        {isShowingRecommendations && (
                          <Chip 
                            label="Recommended" 
                            color="primary"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {(event.ticketPrice !== undefined && event.ticketPrice !== null) && (
  <Chip
    label={event.ticketPrice === 0 ? 'Free' : `Price: $${event.ticketPrice}`}
    color={event.ticketPrice === 0 ? 'success' : 'info'}
    size="small"
    sx={{ ml: 1 }}
    icon={<AttachMoneyIcon />}
  />
)}
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
                          Participants: {event.participantsIds?.length || 0}/{event.maxParticipants || 'Unlimited'}
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
            <Typography variant="h6" color="text.secondary">
              {isShowingRecommendations ? 'No recommendations found' : 'No events found'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isShowingRecommendations 
                ? 'Try adjusting your city filter for better recommendations' 
                : 'Try adjusting your search filters'
              }
            </Typography>
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
            disabled={loading || recommendationsLoading}
          />
          
          <Typography variant="body2" color="text.secondary">
            Showing {events.length} of {paginationInfo.totalItems} {isShowingRecommendations ? 'recommended ' : ''}events
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Events;