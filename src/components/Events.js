import React, { useEffect, useState } from 'react';
import {
  Box, TextField, Button, Grid, Card, CardContent, Typography, CardActions,
  FormControl, InputLabel, Select, MenuItem, Pagination, OutlinedInput,
  FormHelperText, Chip, Divider, Checkbox, FormControlLabel, Alert, Paper,
  Accordion, AccordionSummary, AccordionDetails
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoIcon from '@mui/icons-material/Info';

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
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const cityOptions = ['Cluj', 'Bucuresti', 'Timisoara'];
  const availabilityOptions = ['Available Seats', 'Full'];
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
          setHasSearched(true);
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
    if (results.searchId) {
      setCurrentSearchId(results.searchId);
      localStorage.setItem('currentSearchId', results.searchId);
      localStorage.setItem('searchTimestamp', Date.now().toString());
      console.log('Received searchId from backend:', results.searchId);
    } else {
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
      setHasSearched(true);
      
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
      setHasSearched(true);
      
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
    navigate(`/events/edit/${eventId}`);
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
    setHasSearched(false);
    setEvents([]);
    setPaginationInfo({
      totalItems: 0,
      totalPages: 0,
      isFirst: true,
      isLast: true
    });
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

  const handleToggleFilters = () => {
    setExpandedFilters(!expandedFilters);
  };
  
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Events
      </Typography>

      <Paper sx={{ maxWidth: 1200, mx: 'auto', mb: 4, p: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="medium">Search Events</Typography>
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

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Title"
              fullWidth
              size="small"
              value={filters.title}
              onChange={(e) => setFilters({ ...filters, title: e.target.value })}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Venue Name"
              fullWidth
              size="small"
              value={filters.venueName}
              onChange={(e) => setFilters({ ...filters, venueName: e.target.value })}
              InputProps={{
                startAdornment: <HomeIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" sx={{ position: 'relative' }}>
              <InputLabel id="city-label">City</InputLabel>
              <Select
                labelId="city-label"
                value={filters.city}
                label="City"
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                sx={{
                  '& .MuiSelect-select': {
                    paddingLeft: '40px',
                    minWidth: '160px',
                    display: 'flex',
                    alignItems: 'center'
                  }
                }}
              >
                <MenuItem value="All Cities">All Cities</MenuItem>
                {cityOptions.map(city => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
              <LocationOnIcon 
                color="action" 
                sx={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  zIndex: 1
                }} 
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Board Game"
              fullWidth
              size="small"
              value={filters.boardGame}
              onChange={(e) => setFilters({ ...filters, boardGame: e.target.value })}
              InputProps={{
                startAdornment: <SportsEsportsIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" sx={{ position: 'relative' }}>
              <InputLabel id="availability-label">Availability</InputLabel>
              <Select
                labelId="availability-label"
                value={filters.availability}
                label="Availability"
                onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                sx={{
                  '& .MuiSelect-select': {
                    paddingLeft: '40px',
                    minWidth: '160px',
                    display: 'flex',
                    alignItems: 'center'
                  }
                }}
              >
                <MenuItem value="All">All</MenuItem>
                {availabilityOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
              <PeopleIcon 
                color="action" 
                sx={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  zIndex: 1
                }} 
              />
            </FormControl>
          </Grid>
        </Grid>

        <Accordion 
          expanded={expandedFilters} 
          onChange={handleToggleFilters}
          sx={{ 
            mb: 3, 
            boxShadow: 'none', 
            '&:before': { display: 'none' },
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 1
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: expandedFilters ? '4px 4px 0 0' : 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography>Advanced Filters</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  size="small"
                  value={filters.address}
                  onChange={(e) => setFilters({ ...filters, address: e.target.value })}
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
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filters.fromDate}
                  onChange={handleFromDateChange}
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
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filters.toDate}
                  onChange={handleToDateChange}
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
                  fullWidth
                  size="small"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
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
                  fullWidth
                  size="small"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
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
                  fullWidth
                  size="small"
                  value={filters.minParticipants}
                  onChange={(e) => setFilters({ ...filters, minParticipants: e.target.value })}
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
                  fullWidth
                  size="small"
                  value={filters.maxParticipants}
                  onChange={(e) => setFilters({ ...filters, maxParticipants: e.target.value })}
                  error={!!participantErrors.maxParticipants}
                  helperText={participantErrors.maxParticipants}
                  InputProps={{
                    startAdornment: <PeopleIcon color="action" sx={{ mr: 1 }} />,
                    inputProps: { min: 0, step: 1 }
                  }}
                  placeholder="0"
                />
              </Grid>

              <Grid item xs={12}>
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
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Search Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <Button 
            variant="contained" 
            onClick={handleSearchClick}
            startIcon={<SearchIcon />}
            disabled={hasErrors() || loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={handleSuggestionsClick}
            startIcon={<RecommendIcon />}
            disabled={recommendationsLoading || !user.userId}
          >
            {recommendationsLoading ? 'Loading...' : 'Suggestions'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleClearFilters}
            startIcon={<ClearIcon />}
          >
            Clear All
          </Button>
          <Box sx={{ flexGrow: 1 }}></Box>
          <Typography mr={1}>Page Size:</Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              disabled={loading || recommendationsLoading}
              sx={{ height: 36 }}
            >
              {pageSizeOptions.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {(isShowingRecommendations && events.length > 0) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Showing personalized event recommendations based on your preferences
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Results Section */}
      {events.length > 0 ? (
        <Paper sx={{ maxWidth: 1200, mx: 'auto', mb: 4, p: 3, boxShadow: 3 }}>
          <Typography variant="h5" mb={3} fontWeight="medium">
            {isShowingRecommendations ? 'Personalized Recommendations' : 'Search Results'}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {events.map(event => (
              <Card key={event.id} sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', width: '100%' }}>
                  <CardContent sx={{ 
                    py: 2, 
                    px: 3,
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ width: '60%' }}>
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
                      gap: 1,
                      width: '40%',
                      minWidth: 'fit-content'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1" noWrap>
                          {event.day}, {event.startHour} - {event.endHour}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          Participants: {event.participantsIds?.length || 0}/{event.maxParticipants || 'Unlimited'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          color="primary" 
                          variant="contained"
                          onClick={() => handleViewDetails(event.id)}
                          size="small"
                          startIcon={<InfoIcon />}
                        >
                          View Details
                        </Button>
                        {(isPlanner && event.owner === user.userId) && (
                          <Button 
                            color="secondary"
                            variant="outlined" 
                            onClick={() => handleEditEvent(event.id)}
                            size="small"
                          >
                            Edit
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Box>
              </Card>
            ))}
          </Box>
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => handlePageChange(null, pageNumber - 1)} 
              disabled={pageNumber <= 1 || loading || recommendationsLoading}
            >
              Previous
            </Button>
            <Typography>
              Page {pageNumber} of {paginationInfo.totalPages}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => handlePageChange(null, pageNumber + 1)} 
              disabled={pageNumber >= paginationInfo.totalPages || loading || recommendationsLoading}
            >
              Next
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          {/* No results messages */}
          {hasSearched && !loading && !recommendationsLoading && (
            <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" mb={2}>
                {isShowingRecommendations ? 'No recommendations found' : 'No events found'}
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                {isShowingRecommendations 
                  ? 'Try adjusting your city filter for better recommendations' 
                  : 'Try adjusting your search filters'
                }
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear All Filters
                </Button>
                {!isShowingRecommendations ? (
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={handleSuggestionsClick}
                    startIcon={<RecommendIcon />}
                  >
                    Get Suggestions Instead
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleSearchClick}
                    startIcon={<SearchIcon />}
                  >
                    Try Regular Search
                  </Button>
                )}
              </Box>
            </Paper>
          )}

          {!hasSearched && !loading && !recommendationsLoading && (
            <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Enter search criteria and click "Search" to find events or "Suggestions" to get personalized recommendations.
              </Typography>
            </Paper>
          )}

          {(loading || recommendationsLoading) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4 }}>
              <Typography variant="h6">
                {isShowingRecommendations ? 'Loading recommendations...' : 'Loading events...'}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Events;