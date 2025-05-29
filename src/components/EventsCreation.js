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
  Alert
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import { libraries, CITY_COORDINATES, ROMANIA_CENTER, reverseGeocode } from '../utils/location';
import dayjs from 'dayjs';
import { getSession } from '../cognito';
import { useLoadScript } from '@react-google-maps/api';

const cityOptions = ['Cluj', 'Bucuresti', 'Timisoara'];
const participantsOptions = [10, 20, 30, 40, 50];

export default function EventsCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Google Maps loading
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

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

  useEffect(() => {
    console.log('EventsCreation mounted');
    setMapLoaded(false);
    setLoadingAddress(false);
    setIsSubmitting(false);
    setSubmitError('');
    setMarkerPos(null);
    setMapCenter(ROMANIA_CENTER);
    setErrors({});
    
    autoRef.current = null;
    mapRef.current = null;
  }, [location.pathname]);

  useEffect(() => {
    if (form.city && CITY_COORDINATES[form.city]) {
      setMapCenter(CITY_COORDINATES[form.city]);
      if (mapRef.current) {
        mapRef.current.panTo(CITY_COORDINATES[form.city]);
        mapRef.current.setZoom(13);
      }
    }
  }, [form.city]);

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

  const handleNext = async () => {
    if (!validate()) return;

    const session = await getSession();
    const token = session.getAccessToken().getJwtToken();

    const payload = {
      title: form.eventName,
      owner: '',
      day: form.day.format('YYYY-MM-DD'),
      startHour: form.startHour.format('HH:mm'),
      endHour: form.endHour.format('HH:mm'),
      city: form.city,
      address: form.address,
      venueName: form.venueName,
      latitude: markerPos.lat,
      longitude: markerPos.lng,
      maxParticipants: form.participants,
      ticketPrice: form.price === '' ? 0 : Number(form.price), 
      addressInfo: form.addressInfo,
      description: form.description 
    };
    
    try {
      setIsSubmitting(true);
      setSubmitError('');

      const response = await fetch('http://localhost:9013/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const eventId = data.id;
      
      navigate(`/events/${eventId}/select-boardgames`);
    } catch (error) {
      console.error("Error creating event:", error);
      setSubmitError("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMapLoad = (map) => {
    console.log('Map loaded successfully');
    mapRef.current = map;
    setMapLoaded(true);
  };

  const shouldDisableDate = (date) => {
    const today = dayjs().startOf('day');
    return date.isSame(today) || date.isBefore(today);
  };

  if (loadError) {
    console.error('Google Maps load error:', loadError);
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6" mb={2}>
          Error loading Google Maps
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Please check your internet connection and try again.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Loading Google Maps...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" mb={3}>Create Event</Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

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

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleNext}
          disabled={!mapLoaded || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              Saving...
            </>
          ) : (
            "Next"
          )}
        </Button>
      </Box>
    </Box>
  );
}