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
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import { libraries, CITY_COORDINATES, ROMANIA_CENTER, reverseGeocode } from '../utils/location';
import dayjs from 'dayjs';
import { getSession } from '../cognito';
import { useLoadScript } from '@react-google-maps/api';
import { Add, Remove, Schedule, CheckCircle } from '@mui/icons-material';
import ClockTimePicker from './ClockTimePicker';

const cityOptions = ['Cluj', 'Bucuresti', 'Timisoara'];
const participantsOptions = [10, 20, 30, 40, 50];

// Validation rules
const validationRules = {
  eventName: {
    required: true,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-.,!?'&]+$/,
    message: 'Event name must be 1-50 characters, letters/numbers/basic punctuation only'
  },
  venueName: {
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-.,&']+$/,
    message: 'Venue name must be max 50 characters'
  },
  description: {
    required: true,
    maxLength: 500,
    minLength: 10,
    message: 'Description must be 10-500 characters'
  },
  addressInfo: {
    maxLength: 200,
    message: 'Address info must be max 200 characters'
  },
  price: {
    min: 0,
    max: 10000,
    message: 'Price must be between 0 and 10,000'
  }
};

export default function EventsCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [addressSelected, setAddressSelected] = useState(false);
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

  // Character counter
  const CharacterCounter = ({ current, max, fieldName }) => {
    const remaining = max - current;
    const isOverLimit = remaining < 0;
    const isNearLimit = remaining < 50 && remaining >= 0;
    
    return (
      <Typography 
        variant="caption" 
        color={isOverLimit ? 'error' : isNearLimit ? 'warning' : 'text.secondary'}
        sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}
      >
        {current}/{max} characters
        {isOverLimit && ` (${Math.abs(remaining)} over limit)`}
      </Typography>
    );
  };

  // old Time Picker Component
  // const EnhancedTimePicker = ({ label, value, onChange, error, helperText, disabled, minTime }) => {
  //   const adjustTime = (minutes) => {
  //     if (!value) {
  //       const newTime = dayjs().hour(9).minute(0);
  //       onChange(newTime);
  //       return;
  //     }
  //     const newTime = value.add(minutes, 'minute');
  //     if (minTime && newTime.isBefore(minTime)) {
  //       return;
  //     }
  //     onChange(newTime);
  //   };

  //   return (
  //     <Box>
  //       <Typography mb={1}>{label}</Typography>
  //       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
  //         <LocalizationProvider dateAdapter={AdapterDayjs}>
  //           <TimePicker 
  //             value={value} 
  //             onChange={onChange}
  //             disabled={disabled}
  //             minTime={minTime}
  //             slotProps={{ 
  //               textField: { 
  //                 sx: { ...inputStyle, width: '120px' }, 
  //                 error: !!error, 
  //                 helperText: error
  //               } 
  //             }} 
  //           />
  //         </LocalizationProvider>
          
  //         {/* Time adjustment buttons */}
  //         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
  //           <IconButton 
  //             size="small" 
  //             onClick={() => adjustTime(15)}
  //             disabled={disabled}
  //             sx={{ height: '24px', width: '24px' }}
  //           >
  //             <Add fontSize="small" />
  //           </IconButton>
  //           <IconButton 
  //             size="small" 
  //             onClick={() => adjustTime(-15)}
  //             disabled={disabled}
  //             sx={{ height: '24px', width: '24px' }}
  //           >
  //             <Remove fontSize="small" />
  //           </IconButton>
  //         </Box>
  //       </Box>
        
  //       {/* Preset time chips */}
  //       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '200px' }}>
  //         {presetTimes.map(time => {
  //           const timeObj = dayjs(`2000-01-01 ${time}`);
  //           const isDisabled = disabled || (minTime && timeObj.isBefore(minTime));
            
  //           return (
  //             <Chip
  //               key={time}
  //               label={time}
  //               size="small"
  //               onClick={() => !isDisabled && onChange(dayjs(`2000-01-01 ${time}`))}
  //               color={value && value.format('HH:mm') === time ? 'primary' : 'default'}
  //               variant={value && value.format('HH:mm') === time ? 'filled' : 'outlined'}
  //               disabled={isDisabled}
  //               sx={{ 
  //                 fontSize: '0.7rem',
  //                 height: '20px',
  //                 cursor: isDisabled ? 'not-allowed' : 'pointer'
  //               }}
  //             />
  //           );
  //         })}
  //       </Box>
  //       {helperText && (
  //         <FormHelperText error={!!error}>{helperText}</FormHelperText>
  //       )}
  //     </Box>
  //   );
  // };

  // Field validation function
  const validateField = (fieldName, value) => {
    const rule = validationRules[fieldName];
    if (!rule) return '';

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') return '';

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return `Minimum ${rule.minLength} characters required`;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return `Maximum ${rule.maxLength} characters allowed`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message;
    }

    // Number validations
    if (fieldName === 'price') {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Price must be a valid number';
      if (rule.min !== undefined && num < rule.min) return `Price must be at least ${rule.min}`;
      if (rule.max !== undefined && num > rule.max) return `Price cannot exceed ${rule.max}`;
    }

    return '';
  };

  // Handle field changes with validation
  const handleFieldChange = (fieldName, value) => {
    setForm(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Validate field
    const error = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  useEffect(() => {
    console.log('EventsCreation mounted');
    setMapLoaded(false);
    setLoadingAddress(false);
    setIsSubmitting(false);
    setSubmitError('');
    setMarkerPos(null);
    setMapCenter(ROMANIA_CENTER);
    setErrors({});
    setAddressSelected(false);
    
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
    return endTime.isBefore(startTime) || endTime.isSame(startTime);
  };

  const validate = () => {
    const newErr = {};
    
    // Text field validations
    ['eventName', 'description', 'venueName', 'addressInfo'].forEach(field => {
      const error = validateField(field, form[field]);
      if (error) newErr[field] = error;
    });

    // Price validation
    if (form.price) {
      const error = validateField('price', form.price);
      if (error) newErr.price = error;
    }
    
    // Date validation
    if (!form.day) {
      newErr.day = 'Event date is required';
    } else if (isDateInPastOrToday(form.day)) {
      newErr.day = 'Date must be in the future (after today)';
    } else {
      const maxDate = dayjs('2025-12-31');
      if (form.day.isAfter(maxDate)) {
        newErr.day = 'Date cannot be after December 31, 2025';
      }
    }
    
    // Time validations
    if (!form.startHour) {
      newErr.startHour = 'Start time is required';
    }
    
    if (!form.endHour) {
      newErr.endHour = 'End time is required';
    } else if (form.startHour && isEndTimeBeforeStartTime(form.startHour, form.endHour)) {
      const startTimeStr = form.startHour.format('HH:mm');
      newErr.endHour = `End time must be after start time (${startTimeStr}). Please select a time after ${startTimeStr}.`;
      } else if (form.startHour && form.endHour) {
      const duration = form.endHour.diff(form.startHour, 'hours', true);
      if (duration > 12) {
        newErr.endHour = 'Event duration cannot exceed 12 hours';
      }
    }
    
    // Other required fields
    if (!form.participants) newErr.participants = 'Number of participants is required';
    if (!form.city) newErr.city = 'City is required';
    
    // Address validation - either venue name OR address is required
    if (!form.venueName && !form.address) {
      newErr.address = 'Either venue name or address is required';
    }
    
    // Map location validation
    if (!markerPos) {
      newErr.map = 'Please select a location on the map or search for an address';
    }
    
    // Address selection validation (if address is provided, it must be selected)
    if (form.address && !addressSelected && !markerPos) {
      newErr.address = 'Please select an address from suggestions or click on the map';
    }
    
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const onPlaceChanged = () => {
    if (!autoRef.current) return;
    
    const place = autoRef.current.getPlace();
    if (!place || !place.geometry || !place.geometry.location) {
      setErrors(prev => ({ ...prev, address: 'Please select a valid address from the suggestions' }));
      setAddressSelected(false);
      return;
    }
    
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const newPos = { lat, lng };
    
    setMarkerPos(newPos);
    setMapCenter(newPos);
    setAddressSelected(true);
    
    if (mapRef.current) {
      mapRef.current.panTo(newPos);
      mapRef.current.setZoom(16);
    }
    
    setForm(prev => ({ ...prev, address: place.formatted_address }));
    setErrors(prev => ({ ...prev, address: '', map: '' }));
  };

  const handleMapClick = async (e) => {
    const newPos = { 
      lat: e.latLng.lat(), 
      lng: e.latLng.lng() 
    };
    setMarkerPos(newPos);
    setAddressSelected(true);
    setErrors(prev => ({ ...prev, map: '', address: '' }));
    
    setLoadingAddress(true);
    try {
      const result = await reverseGeocode(newPos.lat, newPos.lng);
      setForm(prev => ({ ...prev, address: result.formattedAddress }));
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
    setAddressSelected(false);
    
    if (CITY_COORDINATES[city]) {
      setMapCenter(CITY_COORDINATES[city]);
      if (mapRef.current) {
        mapRef.current.panTo(CITY_COORDINATES[city]);
        mapRef.current.setZoom(13);
      }
    }
  };

  const handleNext = async () => {
    if (!validate()) {
      setSubmitError('Please fix all validation errors before submitting.');
      return;
    }

    const session = await getSession();
    const token = session.getAccessToken().getJwtToken();

    const payload = {
      title: form.eventName.trim(),
      owner: '',
      day: form.day.format('YYYY-MM-DD'),
      startHour: form.startHour.format('HH:mm'),
      endHour: form.endHour.format('HH:mm'),
      city: form.city,
      address: form.address.trim(),
      venueName: form.venueName.trim(),
      latitude: markerPos.lat,
      longitude: markerPos.lng,
      maxParticipants: form.participants,
      ticketPrice: form.price === '' ? 0 : Number(form.price), 
      addressInfo: form.addressInfo.trim(),
      description: form.description.trim()
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
        const errorData = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorData}`);
      }
      
      const data = await response.json();
      const eventId = data.id;
      
      navigate(`/events/${eventId}/select-boardgames`);
    } catch (error) {
      console.error("Error creating event:", error);
      setSubmitError(`Failed to create event: ${error.message}`);
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
    const maxDate = dayjs('2025-12-31');
    return date.isSame(today) || date.isBefore(today) || date.isAfter(maxDate);
  };

  // Check if form is valid
  const isFormValid = () => {
    const hasErrors = Object.values(errors).some(error => error !== '');
    const requiredFields = ['eventName', 'day', 'startHour', 'endHour', 'participants', 'city', 'description'];
    const hasAllRequired = requiredFields.every(field => 
      form[field] && form[field].toString().trim() !== ''
    );
    const hasLocationOrVenue = form.venueName || (form.address && addressSelected);
    const hasMapLocation = markerPos !== null;
    
    return !hasErrors && hasAllRequired && (hasLocationOrVenue || hasMapLocation);
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

      {/* Form validation status */}
      <Alert 
        severity={isFormValid() ? "success" : "info"} 
        sx={{ mb: 3 }}
        icon={isFormValid() ? <CheckCircle /> : <Schedule />}
      >
        {isFormValid() 
          ? "Form is complete and ready to submit!" 
          : "Please fill in all required fields and fix any validation errors"
        }
      </Alert>

      <Card sx={{ maxWidth: 1000, mx: 'auto', mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" mb={3} fontWeight="medium">Event Details</Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Typography mb={1}>Event Name *</Typography>
              <TextField 
                required 
                value={form.eventName} 
                onChange={e => handleFieldChange('eventName', e.target.value)}
                sx={wideStyle} 
                error={!!errors.eventName} 
                helperText={
                  <Box>
                    {errors.eventName && <span>{errors.eventName}</span>}
                    <CharacterCounter 
                      current={form.eventName.length} 
                      max={50} 
                      fieldName="eventName" 
                    />
                  </Box>
                }
                inputProps={{ maxLength: 60 }}
                placeholder="Enter event name..."
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Typography mb={1}>Event Date *</Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker 
                  value={form.day} 
                  onChange={v => setForm(f => ({ ...f, day: v }))} 
                  shouldDisableDate={shouldDisableDate}
                  slotProps={{ 
                    textField: { 
                      sx: inputStyle, 
                      error: !!errors.day, 
                      helperText: errors.day || "Must be between tomorrow and Dec 31, 2025"
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <ClockTimePicker
                label="Start Time *"
                value={form.startHour}
                onChange={v => {
                  setForm(f => {
                    const newForm = { ...f, startHour: v };
                    // Clear end time if it becomes invalid
                    if (f.endHour && v && (f.endHour.isBefore(v) || f.endHour.isSame(v))) {
                      newForm.endHour = null;
                    }
                    return newForm;
                  });
                }}
                error={errors.startHour}
                helperText="Click clock icon for full time picker"
                inputStyle={inputStyle}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <ClockTimePicker
                label="End Time *"
                value={form.endHour}
                onChange={v => setForm(f => ({ ...f, endHour: v }))}
                error={errors.endHour}
                disabled={!form.startHour}
                minTime={form.startHour}
                helperText={form.startHour ? "Must be after start time" : "Select start time first"}
                inputStyle={inputStyle}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography mb={1}>Max Participants *</Typography>
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
              <Typography mb={1}>Ticket Price (RON)</Typography>
              <TextField
                type="number"
                value={form.price}
                onChange={e => handleFieldChange('price', e.target.value)}
                sx={inputStyle}
                error={!!errors.price}
                helperText={errors.price || "Leave empty for free events"}
                InputProps={{ 
                  inputProps: { min: 0, max: 10000, step: 0.01 }
                }}
                placeholder="0.00"
              />
            </Grid>
          </Grid>
          
          <Box mt={4}>
            <Typography mb={1}>Description *</Typography>
            <TextField 
              required
              multiline 
              rows={6}
              fullWidth
              value={form.description} 
              onChange={e => handleFieldChange('description', e.target.value)}
              placeholder="Provide a detailed description of your event (10-500 characters)"
              error={!!errors.description}
              helperText={
                <Box>
                  {errors.description && <span>{errors.description}</span>}
                  <CharacterCounter 
                    current={form.description.length} 
                    max={500} 
                    fieldName="description" 
                  />
                </Box>
              }
              inputProps={{ maxLength: 510 }}
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
          <Typography variant="h5" mb={3} fontWeight="medium">Location Details</Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography mb={1}>City *</Typography>
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
                onChange={e => handleFieldChange('venueName', e.target.value)}
                sx={wideStyle} 
                error={!!errors.venueName}
                helperText={
                  <Box>
                    {errors.venueName && <span>{errors.venueName}</span>}
                    <CharacterCounter 
                      current={form.venueName.length} 
                      max={50} 
                      fieldName="venueName" 
                    />
                  </Box>
                }
                inputProps={{ maxLength: 60 }}
                placeholder="Enter venue name..."
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
                    error={!!errors.address}
                    helperText={errors.address || "Search for an address or click on the map"}
                    placeholder="Type to search for address..."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {addressSelected && <CheckCircle color="success" />}
                          {loadingAddress && <CircularProgress size={20} />}
                        </InputAdornment>
                      )
                    }}
                  />
                </Autocomplete>
              </Box>

              <Typography mb={1} mt={2}>Additional Address Info</Typography>
              <TextField 
                multiline 
                rows={3} 
                fullWidth 
                value={form.addressInfo} 
                onChange={e => handleFieldChange('addressInfo', e.target.value)}
                placeholder="Floor, entrance, parking instructions, etc. (max 200 chars)"
                error={!!errors.addressInfo}
                helperText={
                  <Box>
                    {errors.addressInfo && <span>{errors.addressInfo}</span>}
                    <CharacterCounter 
                      current={form.addressInfo.length} 
                      max={200} 
                      fieldName="addressInfo" 
                    />
                  </Box>
                }
                inputProps={{ maxLength: 210 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography mb={1}>Location on Map *</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Search for an address above or click on the map to set the exact event location
              </Typography>
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 300, 
                  border: errors.map ? '2px solid #d32f2f' : '1px solid #ccc',
                  borderRadius: 1,
                  position: 'relative'
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
                
                {/* Map status overlay */}
                {markerPos && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: 'success.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <CheckCircle sx={{ fontSize: '1rem' }} />
                    Location selected
                  </Box>
                )}
              </Box>
              {errors.map && (
                <FormHelperText error sx={{ mt: 1 }}>{errors.map}</FormHelperText>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isFormValid() && (
            <Typography variant="body2" color="text.secondary">
              Complete all required fields to continue
            </Typography>
          )}
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!mapLoaded || isSubmitting || !isFormValid()}
            size="large"
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Creating Event...
              </>
            ) : (
              "Next: Select Board Games"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}