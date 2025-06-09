import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  IconButton,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LoadScript, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import { libraries, CITY_COORDINATES, ROMANIA_CENTER, reverseGeocode } from '../utils/location';
import dayjs from 'dayjs';
import { getSession } from '../cognito';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';

const cityOptions = ['Cluj', 'Bucuresti', 'Timisoara'];
const participantsOptions = [10, 20, 30, 40, 50];

const mechanicsOptions = [
  "Deck Building",
  "Worker Placement",
  "Drafting",
  "Tile Placement",
  "Cooperative",
  "Hidden Role",
];

const domainOptions = [
  "Fantasy",
  "Sci-Fi",
  "Historical",
  "Horror",
  "Wargames",
  "Family",
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function EventUpdate() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  
  const [form, setForm] = useState({
    eventName: '',
    day: null,
    owner: '',
    startHour: null,
    endHour: null,
    city: '',
    venueName: '',
    address: '',
    addressInfo: '',
    participants: '',
    price: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [mapCenter, setMapCenter] = useState(ROMANIA_CENTER);
  const [markerPos, setMarkerPos] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  const [selectedBoardgames, setSelectedBoardgames] = useState([]);
  const [loadingSelected, setLoadingSelected] = useState(true);
  
  const [boardgameName, setBoardgameName] = useState("");
  const [minPlayers, setMinPlayers] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [yearPublished, setYearPublished] = useState("");
  
  const [minAge, setMinAge] = useState("");
  const [maxPlaytime, setMaxPlaytime] = useState("");
  const [minComplexity, setMinComplexity] = useState("");
  const [maxComplexity, setMaxComplexity] = useState("");
  const [selectedMechanics, setSelectedMechanics] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedError, setSelectedError] = useState('');
  const [searchError, setSearchError] = useState('');
  
  const autoRef = useRef(null);
  const mapRef = useRef(null);

  const inputStyle = {
    width: '150px',
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
      '&:hover fieldset': { borderColor: 'primary.light' },
      height: '56px'
    },
    '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }
  };
  const wideStyle = { ...inputStyle, width: '300px' };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();
        
        const response = await fetch(`http://localhost:9013/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch event details: ${response.status}`);
        }
        
        const eventData = await response.json();
        
        const dayObject = eventData.day ? dayjs(eventData.day) : null;
        const startHourObject = eventData.startHour ? dayjs(`2000-01-01T${eventData.startHour}`) : null;
        const endHourObject = eventData.endHour ? dayjs(`2000-01-01T${eventData.endHour}`) : null;
        
        if (eventData.latitude && eventData.longitude) {
          const lat = parseFloat(eventData.latitude);
          const lng = parseFloat(eventData.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            setMarkerPos({ lat, lng });
            setMapCenter({ lat, lng });
          }
        }
        
        setForm({
          eventName: eventData.title || '',
          day: dayObject,
          owner: eventData.owner || '',
          startHour: startHourObject,
          endHour: endHourObject,
          city: eventData.city || '',
          venueName: eventData.venueName || '',
          address: eventData.address || '',
          addressInfo: eventData.addressInfo || '',
          participants: eventData.maxParticipants || '',
          price: eventData.ticketPrice ? eventData.ticketPrice.toString() : '',
          description: eventData.description || ''
        });
      } catch (error) {
        console.error("Error fetching event details:", error);
        setFetchError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);
  
  useEffect(() => {
    const fetchSelectedBoardgames = async () => {
      setLoadingSelected(true);
      setSelectedError('');
      
      try {
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();
        
        const response = await fetch(`http://localhost:9013/boardgames/event/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setSelectedBoardgames([]);
            return;
          }
          throw new Error(`Failed to fetch selected boardgames: ${response.status}`);
        }
        
        const data = await response.json();
        setSelectedBoardgames(data);
      } catch (error) {
        console.error("Error fetching selected boardgames:", error);
        setSelectedError('Failed to load selected boardgames. Please try again.');
      } finally {
        setLoadingSelected(false);
      }
    };
    
    fetchSelectedBoardgames();
  }, [eventId]);

  useEffect(() => {
    if (form.city && CITY_COORDINATES[form.city]) {
      if (!markerPos) {
        setMapCenter(CITY_COORDINATES[form.city]);
        if (mapRef.current) {
          mapRef.current.panTo(CITY_COORDINATES[form.city]);
          mapRef.current.setZoom(13);
        }
      }
    }
  }, [form.city, markerPos]);

  const isDateInPastOrToday = (date) => {
    if (!date) return false;
    const today = dayjs().startOf('day');
    return date.startOf('day').isSame(today) || date.isBefore(today);
  };

  const isEndTimeBeforeStartTime = (startTime, endTime) => {
    if (!startTime || !endTime) return false;
    return endTime.isBefore(startTime);
  };

  const validate = () => {
    const newErr = {};
    if (!form.eventName) newErr.eventName = 'Event Name required';
    
    if (!form.day) {
      newErr.day = 'Day required';
    } else if (isDateInPastOrToday(form.day)) {
      newErr.day = 'Date must be in the future';
    }
    
    if (!form.startHour) {
      newErr.startHour = 'Start Hour required';
    }
    
    if (!form.endHour) {
      newErr.endHour = 'End Hour required';
    } else if (form.startHour && isEndTimeBeforeStartTime(form.startHour, form.endHour)) {
      newErr.endHour = 'End Hour must be after Start Hour';
    }
    
    if (!form.participants) newErr.participants = 'Participants required';
    if (!form.city) newErr.city = 'City required';
    if (!form.venueName && !form.address) newErr.address = 'Venue name or address required';
    if (!markerPos) newErr.map = 'Please select a valid location';
    if (!form.description) newErr.description = 'Description required';
    
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const onPlaceChanged = () => {
    if (!autoRef.current) return;
    
    const place = autoRef.current.getPlace();
    if (!place || !place.geometry || !place.geometry.location) {
      setErrors(prev => ({ ...prev, address: 'Please select a valid address' }));
      return;
    }
    
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const newPos = { lat, lng };
    
    setMarkerPos(newPos);
    setMapCenter(newPos);
    
    if (mapRef.current) {
      mapRef.current.panTo(newPos);
      mapRef.current.setZoom(16);
    }
    
    setForm(prev => ({ ...prev, address: place.formatted_address }));
    setErrors(e => ({ ...e, address: undefined, map: undefined }));
  };

  const handleMapClick = async (e) => {
    const newPos = { 
      lat: e.latLng.lat(), 
      lng: e.latLng.lng() 
    };
    setMarkerPos(newPos);
    setErrors(prev => ({ ...prev, map: undefined }));
    
    setLoadingAddress(true);
    try {
      const result = await reverseGeocode(newPos.lat, newPos.lng);
      setForm(prev => ({ ...prev, address: result.formattedAddress }));
      setErrors(prev => ({ ...prev, address: undefined }));
    } catch (error) {
      console.error("Error getting address:", error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setForm(prev => ({ 
      ...prev, 
      city,
      venueName: '',
      address: '',
      addressInfo: '' 
    }));
    
    setMarkerPos(null);
    
    if (CITY_COORDINATES[city]) {
      setMapCenter(CITY_COORDINATES[city]);
      if (mapRef.current) {
        mapRef.current.panTo(CITY_COORDINATES[city]);
        mapRef.current.setZoom(13);
      }
    }
  };
  
  const handleToggleFilters = () => {
    setExpandedFilters(!expandedFilters);
  };
  
  const handleSearch = async (page = 1, size = pageSize) => {
    setSearchError('');
    setLoadingSearch(true);
    setPageNumber(page);
    
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const filters = {
        name: boardgameName || null,
        minPlayers: minPlayers ? Number(minPlayers) : null,
        maxPlayers: maxPlayers ? Number(maxPlayers) : null,
        minAge: minAge ? Number(minAge) : null,
        maxPlaytime: maxPlaytime ? Number(maxPlaytime) : null,
        minComplexity: minComplexity ? parseFloat(minComplexity) : null,
        maxComplexity: maxComplexity ? parseFloat(maxComplexity) : null,
        mechanics: selectedMechanics.length ? selectedMechanics : null,
        domains: selectedDomains.length ? selectedDomains : null,
        yearPublished: yearPublished ? Number(yearPublished) : null,
      };
      
      const url = `http://localhost:9013/boardgames/search?page=${page}&size=${size}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch boardgames");
      }
      
      const data = await response.json();
      setSearchResults(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error searching boardgames:", error);
      setSearchError('Failed to search boardgames. Please try again.');
    } finally {
      setLoadingSearch(false);
    }
  };
  
  const handleAddBoardgame = (boardgame) => {
    if (selectedBoardgames.some(bg => bg.gameId === boardgame.gameId)) {
      return; 
    }
    setSelectedBoardgames(prev => [...prev, boardgame]);
  };
  
  const handleRemoveBoardgame = (gameId) => {
    setSelectedBoardgames(prev => prev.filter(bg => bg.gameId !== gameId));
  };
  
  const handleClearSearch = () => {
    setBoardgameName("");
    setMinPlayers("");
    setMaxPlayers("");
    setMinAge("");
    setMaxPlaytime("");
    setMinComplexity("");
    setMaxComplexity("");
    setSelectedMechanics([]);
    setSelectedDomains([]);
    setYearPublished("");
    setPageNumber(1);
    setSearchResults([]);
  };
  
  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      handleSearch(pageNumber + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (pageNumber > 1) {
      handleSearch(pageNumber - 1);
    }
  };
  
  const handlePageSizeChange = (e) => {
    const newSize = e.target.value;
    setPageSize(newSize);
    setPageNumber(1);
    handleSearch(1, newSize);
  };

  const handleUpdate = async () => {
    if (!validate()) {
      setTabValue(0);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const boardgameIds = selectedBoardgames.map(bg => bg.gameId);
      
      const completePayload = {
        id: eventId,
        title: form.eventName,
        day: form.day.format('YYYY-MM-DD'),
        startHour: form.startHour.format('HH:mm'),
        endHour: form.endHour.format('HH:mm'),
        city: form.city,
        address: form.address,
        venueName: form.venueName,
        latitude: markerPos.lat.toString(),
        longitude: markerPos.lng.toString(),
        maxParticipants: form.participants,
        ticketPrice: form.price === '' ? 0 : Number(form.price), 
        addressInfo: form.addressInfo,
        description: form.description,
        boardgameIds: boardgameIds
      };
      
      console.log('Sending update with complete payload:', completePayload);
      
      const response = await fetch(`http://localhost:9013/events/edit/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(completePayload)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status} when updating event`);
      }
      
      navigate(`/events/${eventId}`);
    } catch (error) {
      console.error("Error updating event:", error);
      setSubmitError("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
    setMapLoaded(true);
  };

  const shouldDisableDate = (date) => {
    const today = dayjs().startOf('day');
    return date.isSame(today) || date.isBefore(today);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" ml={2}>Loading event details...</Typography>
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchError}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <LoadScript 
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} 
      libraries={libraries}
      onError={(error) => console.error("Google Maps loading error:", error)}
    >
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, ml: -1 }}>
          <Button
            onClick={() => navigate(`/events/${eventId}`)}
            startIcon={<ArrowBackIcon />}
            sx={{ 
              fontWeight: 500,
              color: 'primary.main',
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            BACK TO EVENT
          </Button>
        </Box>
        
        <Typography variant="h4" mb={3}>Edit Event</Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}
        
        <Paper sx={{ maxWidth: 1000, mx: 'auto', mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Event Details" id="event-tab-0" />
            <Tab label="Boardgames" id="event-tab-1" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Card sx={{ maxWidth: 1000, mx: 'auto', mb: 4, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" mb={3} fontWeight="medium">Event Details</Typography>
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={3}>
                    <Typography mb={1}>Event Name</Typography>
                    <TextField 
                      required 
                      value={form.eventName} 
                      onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} 
                      sx={wideStyle} 
                      error={!!errors.eventName} 
                      helperText={errors.eventName} 
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography mb={1}>Day</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker 
                        value={form.day} 
                        onChange={v => setForm(f => ({ ...f, day: v }))} 
                        slotProps={{ 
                          textField: { 
                            sx: inputStyle, 
                            error: !!errors.day, 
                            helperText: errors.day 
                          } 
                        }}
                        shouldDisableDate={shouldDisableDate}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography mb={1}>Start Hour</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker 
                        value={form.startHour} 
                        onChange={v => {
                          setForm(f => {
                            const newForm = { ...f, startHour: v };
                            if (f.endHour && v && f.endHour.isBefore(v)) {
                              newForm.endHour = null;
                            }
                            return newForm;
                          });
                        }}
                        slotProps={{ 
                          textField: { 
                            sx: inputStyle, 
                            error: !!errors.startHour, 
                            helperText: errors.startHour 
                          } 
                        }} 
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography mb={1}>End Hour</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker 
                        value={form.endHour}
                        onChange={v => setForm(f => ({ ...f, endHour: v }))}
                        slotProps={{ 
                          textField: { 
                            sx: inputStyle, 
                            error: !!errors.endHour, 
                            helperText: errors.endHour 
                          } 
                        }}
                        disabled={!form.startHour}
                        minTime={form.startHour}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>Participants</Typography>
                    <FormControl sx={inputStyle} error={!!errors.participants}>
                      <InputLabel>Participants</InputLabel>
                      <Select 
                        value={form.participants} 
                        onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} 
                        label="Participants"
                      >
                        {participantsOptions.map(p => (
                          <MenuItem key={p} value={p}>{p}</MenuItem>
                        ))}
                      </Select>
                      {errors.participants && <FormHelperText>{errors.participants}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>Ticket Price (optional)</Typography>
                    <TextField
                      type="number"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      sx={inputStyle}
                      InputProps={{ inputProps: { min: 0 } }}
                      placeholder="Leave empty for free events"
                    />
                  </Grid>
                </Grid>
                
                <Box mt={4}>
                  <Typography mb={1}>Description</Typography>
                  <TextField 
                    required
                    multiline 
                    rows={6}
                    fullWidth
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                    placeholder="Provide a detailed description of your event"
                    error={!!errors.description}
                    helperText={errors.description}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                        '&:hover fieldset': { borderColor: 'primary.light' }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ maxWidth: 1000, mx: 'auto', mb: 4, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" mb={3} fontWeight="medium">Address Details</Typography>
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>City</Typography>
                    <FormControl required sx={inputStyle} error={!!errors.city}>
                      <InputLabel>City</InputLabel>
                      <Select 
                        value={form.city} 
                        onChange={handleCityChange} 
                        label="City"
                      >
                        {cityOptions.map(c => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </Select>
                      {errors.city && <FormHelperText>{errors.city}</FormHelperText>}
                    </FormControl>

                    <Typography mb={1} mt={2}>Venue Name</Typography>
                    <TextField 
                      value={form.venueName} 
                      onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))} 
                      sx={wideStyle} 
                      error={!!errors.address && !form.address} 
                    />

                    <Typography mb={1} mt={2}>Address</Typography>
                    <Box sx={{ position: 'relative' }}>
                      <Autocomplete 
                        onLoad={ref => (autoRef.current = ref)} 
                        onPlaceChanged={onPlaceChanged} 
                        options={{ 
                          componentRestrictions: { country: 'ro' }, 
                          fields: ['formatted_address', 'geometry'] 
                        }}
                      >
                        <TextField 
                          value={form.address} 
                          onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                          sx={wideStyle} 
                          error={!!errors.address && !form.venueName} 
                          helperText={errors.address} 
                          placeholder="Search for address"
                        />
                      </Autocomplete>
                      {loadingAddress && (
                        <CircularProgress 
                          size={20} 
                          sx={{ 
                            position: 'absolute', 
                            right: 10, 
                            top: '50%', 
                            transform: 'translateY(-50%)' 
                          }} 
                        />
                      )}
                    </Box>

                    <Typography mb={1} mt={2}>Address Information (optional)</Typography>
                    <TextField 
                      multiline 
                      rows={3} 
                      fullWidth 
                      value={form.addressInfo} 
                      onChange={e => setForm(f => ({ ...f, addressInfo: e.target.value }))} 
                      placeholder="Additional details like floor, entrance, etc."
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>Location on Map</Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      You can either search for an address above or click on the map to set the event location
                    </Typography>
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: 300, 
                        border: errors.map ? '1px solid #d32f2f' : '1px solid #ccc',
                        borderRadius: 1
                      }}
                    >
                      <GoogleMap 
                        mapContainerStyle={{ width: '100%', height: '100%' }} 
                        center={mapCenter} 
                        zoom={form.city ? 13 : 7}
                        onClick={handleMapClick}
                        onLoad={handleMapLoad}
                        options={{
                          streetViewControl: false,
                          mapTypeControl: false
                        }}
                      >
                        {markerPos && <Marker position={markerPos} />}
                      </GoogleMap>
                    </Box>
                    {errors.map && (
                      <FormHelperText error>{errors.map}</FormHelperText>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Card sx={{ maxWidth: 1000, mx: 'auto', mb: 4, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" mb={3} fontWeight="medium">Selected Boardgames</Typography>
                
                {selectedError && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {selectedError}
                  </Alert>
                )}
                
                {loadingSelected ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  selectedBoardgames.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'center', py: 4 }}>
                      No boardgames selected for event
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedBoardgames.map((boardgame) => (
                        <Card key={boardgame.gameId} sx={{ 
                          width: '100%',
                          display: 'flex',
                          height: 60,
                          alignItems: 'center'
                        }}>
                          <CardContent sx={{ 
                            py: 1, 
                            px: 2,
                            display: 'flex', 
                            alignItems: 'center', 
                            width: '100%',
                            maxWidth: '100%',
                            justifyContent: 'space-between'
                          }}>
                            <Typography variant="subtitle1" sx={{ 
                              width: '60%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {boardgame.name}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'flex-end', 
                              gap: 2, 
                              width: '40%',
                              minWidth: 'fit-content'
                            }}>
                              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                Year: {boardgame.yearPublished}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                Players: {boardgame.minPlayers} - {boardgame.maxPlayers}
                              </Typography>
                              <IconButton 
                                color="error" 
                                onClick={() => handleRemoveBoardgame(boardgame.gameId)}
                                aria-label="remove boardgame"
                                size="small"
                                sx={{ flexShrink: 0 }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )
                )}
              </CardContent>
            </Card>

            <Card sx={{ maxWidth: 1000, mx: 'auto', mb: 4, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" mb={3} fontWeight="medium">Search Boardgames</Typography>
                
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Boardgame Name"
                      fullWidth
                      size="small"
                      value={boardgameName}
                      onChange={(e) => setBoardgameName(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Min Players"
                      fullWidth
                      size="small"
                      value={minPlayers}
                      onChange={(e) => setMinPlayers(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Max Players"
                      fullWidth
                      size="small"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Year Published"
                      fullWidth
                      size="small"
                      value={yearPublished}
                      onChange={(e) => setYearPublished(e.target.value)}
                    />
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
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Min Age"
                          fullWidth
                          size="small"
                          value={minAge}
                          onChange={(e) => setMinAge(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Max Playtime"
                          fullWidth
                          size="small"
                          value={maxPlaytime}
                          onChange={(e) => setMaxPlaytime(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Min Complexity"
                          fullWidth
                          size="small"
                          inputProps={{ step: "0.1" }}
                          value={minComplexity}
                          onChange={(e) => setMinComplexity(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Max Complexity"
                          fullWidth
                          size="small"
                          inputProps={{ step: "0.1" }}
                          value={maxComplexity}
                          onChange={(e) => setMaxComplexity(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="mechanics-label">Mechanics</InputLabel>
                          <Select
                            labelId="mechanics-label"
                            label="Mechanics"
                            multiple
                            value={selectedMechanics}
                            onChange={(e) => setSelectedMechanics(e.target.value)}
                            input={<OutlinedInput label="Mechanics" />}
                            renderValue={(selected) => selected.join(", ")}
                            sx={{ minWidth: 200 }}
                          >
                            {mechanicsOptions.map((mechanic) => (
                              <MenuItem key={mechanic} value={mechanic}>
                                <Checkbox checked={selectedMechanics.indexOf(mechanic) > -1} />
                                <ListItemText primary={mechanic} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="domains-label">Domains</InputLabel>
                          <Select
                            labelId="domains-label"
                            label="Domains"
                            multiple
                            value={selectedDomains}
                            onChange={(e) => setSelectedDomains(e.target.value)}
                            input={<OutlinedInput label="Domains" />}
                            renderValue={(selected) => selected.join(", ")}
                            sx={{ minWidth: 200 }}
                          >
                            {domainOptions.map((domain) => (
                              <MenuItem key={domain} value={domain}>
                                <Checkbox checked={selectedDomains.indexOf(domain) > -1} />
                                <ListItemText primary={domain} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => handleSearch(1)} 
                    disabled={loadingSearch}
                    startIcon={<SearchIcon />}
                  >
                    {loadingSearch ? <CircularProgress size={24} color="inherit" /> : "Search"}
                  </Button>
                  <Button variant="outlined" onClick={handleClearSearch} disabled={loadingSearch}>
                    Clear All
                  </Button>
                  <Box sx={{ flexGrow: 1 }}></Box>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="page-size-label">Page Size</InputLabel>
                    <Select
                      labelId="page-size-label"
                      label="Page Size"
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      disabled={loadingSearch}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={15}>15</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {searchError && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {searchError}
                  </Alert>
                )}
                
                {loadingSearch ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : searchResults.length > 0 ? (
                  <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {searchResults.map((boardgame) => (
                        <Card key={boardgame.gameId} sx={{ 
                          width: '100%',
                          display: 'flex',
                          height: 60,
                          alignItems: 'center',
                          position: 'relative',
                          boxShadow: 1,
                          '&:hover': { boxShadow: 3 }
                        }}>
                          <CardContent sx={{ 
                            py: 1, 
                            px: 2,
                            display: 'flex', 
                            alignItems: 'center', 
                            width: '100%',
                            maxWidth: '100%',
                            justifyContent: 'space-between'
                          }}>
                            <Typography variant="subtitle1" sx={{ 
                              width: '60%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {boardgame.name}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'flex-end', 
                              gap: 2, 
                              width: '40%',
                              minWidth: 'fit-content'
                            }}>
                              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                Year: {boardgame.yearPublished}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                Players: {boardgame.minPlayers} - {boardgame.maxPlayers}
                              </Typography>
                              <IconButton 
                                color="primary" 
                                onClick={() => handleAddBoardgame(boardgame)}
                                disabled={selectedBoardgames.some(bg => bg.gameId === boardgame.gameId)}
                                aria-label="add boardgame"
                                size="small"
                                sx={{ flexShrink: 0 }}
                              >
                                <AddIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                          {selectedBoardgames.some(bg => bg.gameId === boardgame.gameId) && (
                            <Box sx={{ 
                              position: 'absolute', 
                              top: 0, 
                              right: 0, 
                              backgroundColor: 'success.main', 
                              color: 'white',
                              px: 1,
                              borderBottomLeftRadius: 4
                            }}>
                              <Typography variant="body2">Added</Typography>
                            </Box>
                          )}
                        </Card>
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handlePrevPage} 
                        disabled={pageNumber <= 1 || loadingSearch}
                      >
                        Previous
                      </Button>
                      <Typography>
                        Page {pageNumber} of {totalPages}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        onClick={handleNextPage} 
                        disabled={pageNumber >= totalPages || loadingSearch}
                      >
                        Next
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {searchResults.length === 0 && pageNumber > 1 
                      ? "No more boardgames found. Try a different search." 
                      : "Use the filters above to search for boardgames."}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', maxWidth: 1000, mx: 'auto' }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate(`/events/${eventId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdate}
            disabled={!mapLoaded || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Saving...
              </>
            ) : (
              "Update Event"
            )}
          </Button>
        </Box>
      </Box>
    </LoadScript>
  );
}