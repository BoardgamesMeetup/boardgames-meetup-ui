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
import { MECHANIC_CATEGORIES, DOMAIN_OPTIONS } from '../utils/boardgameConstants';
import { useLoadScript } from '@react-google-maps/api';

const cityOptions = ['Cluj-Napoca', 'București', 'Timișoara'];
const participantsOptions = [10, 20, 30, 40, 50];


const defaultFilters = {
  boardgameId: '',
  boardgameName: '',
  minPlayers: '',
  maxPlayers: '',
  minAge: '',
  maxPlaytime: '',
  minComplexity: '',
  maxComplexity: '',
  mechanics: [],
  domains: [],
  yearPublished: ''
};

// Validation rules
const validationRules = {
  eventName: {
    required: true,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-.,!?'&]+$/,
    message: 'Event name must be 3-50 characters, letters/numbers/basic punctuation only'
  },
  venueName: {
    required: true,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-.,&']+$/,
    message: 'Venue name must be 3-50 characters'
  },
  description: {
    required: true,
    maxLength: 500,
    minLength: 10,
    message: 'Description must be 10-500 characters'
  },
  address: {
    required: true,
    maxLength: 100,
    minLength: 10,
    message: 'Address must be 10-100 characters'
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
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

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
  const [addressSelected, setAddressSelected] = useState(true);

  const [selectedBoardgames, setSelectedBoardgames] = useState([]);
  const [loadingSelected, setLoadingSelected] = useState(true);
  
  // const [boardgameName, setBoardgameName] = useState("");
  // const [minPlayers, setMinPlayers] = useState("");
  // const [maxPlayers, setMaxPlayers] = useState("");
  // const [yearPublished, setYearPublished] = useState("");
  
  // const [minAge, setMinAge] = useState("");
  // const [maxPlaytime, setMaxPlaytime] = useState("");
  // const [minComplexity, setMinComplexity] = useState("");
  // const [maxComplexity, setMaxComplexity] = useState("");
  // const [selectedMechanicCategories, setSelectedMechanicCategories] = useState([]);
  // const [selectedDomains, setSelectedDomains] = useState([]);
  
  const [filters, setFilters] = useState(defaultFilters);

  const [expandedFilters, setExpandedFilters] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedError, setSelectedError] = useState('');
  const [searchError, setSearchError] = useState('');
  

  // Validation error states
  const [stringErrors, setStringErrors] = useState({
    eventName: '',
    venueName: '',
    address: '',
    addressInfo: '',
    description: '',
    boardgameName: ''
  });

  const [numberErrors, setNumberErrors] = useState({
    price: '',
    minAge: '',
    maxPlaytime: '',
    yearPublished: ''
  });

  const [playersError, setPlayersError] = useState({
    minPlayers: '',
    maxPlayers: ''
  });
  
  const [complexityError, setComplexityError] = useState({
    minComplexity: '',
    maxComplexity: ''
  });

  const [dateErrors, setDateErrors] = useState({
    day: ''
  });

  const [timeErrors, setTimeErrors] = useState({
    startHour: '',
    endHour: ''
  });

  const autoRef = useRef(null);
  const mapRef = useRef(null);

  const mechanicCategoryOptions = Object.keys(MECHANIC_CATEGORIES);
  const domainOptions = DOMAIN_OPTIONS;

  const getIndividualMechanicsFromCategories = (categories) => {
    const mechanics = [];
    categories.forEach(category => {
      if (MECHANIC_CATEGORIES[category]) {
        mechanics.push(...MECHANIC_CATEGORIES[category]);
      }
    });
    return mechanics;
  };

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



  const createSearchParams = (searchFilters) => {
    const params = {};
    
    if (searchFilters.boardgameName && searchFilters.boardgameName.trim()) {
      params.name = searchFilters.boardgameName.trim();
    }
    if (searchFilters.minPlayers && searchFilters.minPlayers.toString().trim()) {
      const minPlayers = Number(searchFilters.minPlayers);
      if (!isNaN(minPlayers) && minPlayers >= 0) {
        params.minPlayers = minPlayers;
      }
    }
    if (searchFilters.maxPlayers && searchFilters.maxPlayers.toString().trim()) {
      const maxPlayers = Number(searchFilters.maxPlayers);
      if (!isNaN(maxPlayers) && maxPlayers >= 0) {
        params.maxPlayers = maxPlayers;
      }
    }
    if (searchFilters.minAge && searchFilters.minAge.toString().trim()) {
      const minAge = Number(searchFilters.minAge);
      if (!isNaN(minAge) && minAge >= 0) {
        params.minAge = minAge;
      }
    }
    if (searchFilters.maxPlaytime && searchFilters.maxPlaytime.toString().trim()) {
      const maxPlaytime = Number(searchFilters.maxPlaytime);
      if (!isNaN(maxPlaytime) && maxPlaytime >= 0) {
        params.maxPlaytime = maxPlaytime;
      }
    }
    if (searchFilters.minComplexity && searchFilters.minComplexity.toString().trim()) {
      const minComplexity = parseFloat(searchFilters.minComplexity);
      if (!isNaN(minComplexity) && minComplexity >= 0) {
        params.minComplexity = minComplexity;
      }
    }
    if (searchFilters.maxComplexity && searchFilters.maxComplexity.toString().trim()) {
      const maxComplexity = parseFloat(searchFilters.maxComplexity);
      if (!isNaN(maxComplexity) && maxComplexity >= 0) {
        params.maxComplexity = maxComplexity;
      }
    }
    if (searchFilters.yearPublished && searchFilters.yearPublished.toString().trim()) {
      const yearPublished = Number(searchFilters.yearPublished);
      if (!isNaN(yearPublished) && yearPublished >= 0) {
        params.yearPublished = yearPublished;
      }
    }
    
    // Handle mechanics
    if (searchFilters.mechanics && searchFilters.mechanics.length > 0) {
      const individualMechanics = getIndividualMechanicsFromCategories(searchFilters.mechanics);
      if (individualMechanics.length > 0) {
        params.mechanics = individualMechanics;
      }
    }
    
    // Handle domains
    if (searchFilters.domains && searchFilters.domains.length > 0) {
      params.domains = searchFilters.domains;
    }
    
    return params;
  };

  // Field validation function
  const validateField = (fieldName, value) => {
    const rule = validationRules[fieldName];
    if (!rule) return '';

    // Required validation strings
    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
    }

    if (value && value.toString().trim().length > 0 && value.toString().trim().length < 3) {
      return `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} must be at least 3 characters`;
    }

    // Skip other validations if field is empty and not required
    if (!rule.required && (!value || value.toString().trim() === '')) {
      return '';
    }

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

  // Validation functions
  const validateStringFields = (fields) => {
    const newErrors = {
      eventName: '',
      venueName: '',
      address: '',
      addressInfo: '',
      description: '',
      boardgameName: ''
    };
    
    const fieldsToValidate = ['eventName', 'venueName', 'address', 'addressInfo', 'description'];
    
    fieldsToValidate.forEach(fieldName => {
      const value = fields[fieldName] ? fields[fieldName].toString().trim() : '';
      const error = validateField(fieldName, value);
      if (error) newErrors[fieldName] = error;
    });

    // Validate boardgame name from filters
    const boardgameValue = filters.boardgameName ? filters.boardgameName.toString().trim() : '';
    if (boardgameValue.length > 0 && boardgameValue.length < 3) {
      newErrors.boardgameName = 'Name must be at least 3 characters';
    }
    
    setStringErrors(newErrors);
  };

  const validateNumbers = (price, minAge, maxPlaytime, yearPublished) => {
    const newErrors = {
      price: '',
      minAge: '',
      maxPlaytime: '',
      yearPublished: ''
    };

    if (price) {
      const error = validateField('price', price);
      if (error) newErrors.price = error;
    }

    if (minAge && (isNaN(minAge) || minAge < 0)) {
      newErrors.minAge = 'Minimum age must be a positive number';
    }

    if (maxPlaytime && (isNaN(maxPlaytime) || maxPlaytime < 0)) {
      newErrors.maxPlaytime = 'Max playtime must be a positive number';
    }

    if (yearPublished && (isNaN(yearPublished) || yearPublished < 0)) {
      newErrors.yearPublished = 'Year published must be a positive number';
    }

    setNumberErrors(newErrors);
  };

  const validatePlayers = (minPlayers, maxPlayers) => {
    const newErrors = {
      minPlayers: '',
      maxPlayers: ''
    };

    if (minPlayers && (isNaN(minPlayers) || minPlayers < 0)) {
      newErrors.minPlayers = 'Min number of players must be a positive number';
    }

    if (maxPlayers && (isNaN(maxPlayers) || maxPlayers < 0)) {
      newErrors.maxPlayers = 'Max number of players must be a positive number';
    }

    if (minPlayers && maxPlayers && !isNaN(minPlayers) && !isNaN(maxPlayers) && minPlayers > maxPlayers) {
      newErrors.maxPlayers = 'Max number of players must be greater than min number of players';
    }

    setPlayersError(newErrors);
  };

  const validateComplexity = (minComplexity, maxComplexity) => {
    const newErrors = {
      minComplexity: '',
      maxComplexity: ''
    };

    if (minComplexity && (isNaN(minComplexity) || minComplexity < 0 || minComplexity > 5)) {
      newErrors.minComplexity = 'Min complexity must be a positive number between 0 and 5';
    }

    if (maxComplexity && (isNaN(maxComplexity) || maxComplexity < 0 || maxComplexity > 5)) {
      newErrors.maxComplexity = 'Max complexity must be a positive number between 0 and 5';
    }

    if (minComplexity && maxComplexity && !isNaN(minComplexity) && !isNaN(maxComplexity) && minComplexity > maxComplexity) {
      newErrors.maxComplexity = 'Max complexity must be greater than min complexity';
    }

    setComplexityError(newErrors);
  };

  const validateDates = (day) => {
    const newErrors = {
      day: ''
    };

    if (day) {
      const today = dayjs().startOf('day');
      const maxDate = dayjs('2025-12-31');

      if (day.startOf('day').isSame(today) || day.isBefore(today)) {
        newErrors.day = 'Date must be in the future (after today)';
      } else if (day.isAfter(maxDate)) {
        newErrors.day = 'Date cannot be after December 31, 2025';
      }
    }

    setDateErrors(newErrors);
  };

  const validateTimes = (startHour, endHour) => {
    const newErrors = {
      startHour: '',
      endHour: ''
    };

    if (startHour && endHour) {
      if (endHour.isBefore(startHour) || endHour.isSame(startHour)) {
        const startTimeStr = startHour.format('HH:mm');
        newErrors.endHour = `End time must be after start time (${startTimeStr}). Please select a time after ${startTimeStr}.`;
      } else {
        const duration = endHour.diff(startHour, 'hours', true);
        if (duration > 12) {
          newErrors.endHour = 'Event duration cannot exceed 12 hours';
        }
      }
    }

    setTimeErrors(newErrors);
  };

  // Handle field changes with validation
  const handleFieldChange = (fieldName, value) => {
    setForm(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Validate field
    setTimeout(() => {
      validateStringFields({ ...form, [fieldName]: value });
      if (fieldName === 'price') {
        validateNumbers(value, null, null, null);
      }
      if (fieldName === 'day') {
        validateDates(value);
      }
    }, 0);
  };

  const hasErrors = () => {
    return playersError.minPlayers !== '' || playersError.maxPlayers !== '' ||
      complexityError.minComplexity !== '' || complexityError.maxComplexity !== '' ||
      stringErrors.boardgameName !== '' || numberErrors.yearPublished !== '' ||
      numberErrors.minAge !== '' || numberErrors.maxPlaytime !== '' ||
      stringErrors.eventName !== '' || stringErrors.venueName !== '' ||
      stringErrors.address !== '' || stringErrors.addressInfo !== '' ||
      stringErrors.description !== '' || numberErrors.price !== '' ||
      dateErrors.day !== '' || timeErrors.startHour !== '' || timeErrors.endHour !== '';
  };


   // UseEffect hooks for validation
   useEffect(() => {
    validatePlayers(filters.minPlayers, filters.maxPlayers);
  }, [filters.minPlayers, filters.maxPlayers]);

  useEffect(() => {
    validateComplexity(filters.minComplexity, filters.maxComplexity);
  }, [filters.minComplexity, filters.maxComplexity]);

  useEffect(() => {
    validateNumbers(form.price, filters.minAge, filters.maxPlaytime, filters.yearPublished);
  }, [form.price, filters.minAge, filters.maxPlaytime, filters.yearPublished]);

  useEffect(() => {
    validateStringFields(form);
  }, [form.eventName, form.venueName, form.address, form.addressInfo, form.description, filters.boardgameName]);

  useEffect(() => {
    validateDates(form.day);
  }, [form.day]);

  useEffect(() => {
    validateTimes(form.startHour, form.endHour);
  }, [form.startHour, form.endHour]);


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
    ['eventName', 'description', 'venueName', 'addressInfo', 'address'].forEach(field => {
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
    
    if (!form.participants) newErr.participants = 'Number of participants is required';
    if (!form.city) newErr.city = 'City is required';
    
    if (!form.venueName && !form.address) {
      newErr.address = 'Either venue name or address is required';
    }
    
    // Map location validation
    if (!markerPos) {
      newErr.map = 'Please select a location on the map or search for an address';
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
    
      // Extract city from address components
      const cityComponent = place.address_components?.find(
        component => component.types.includes('locality') || 
                    component.types.includes('administrative_area_level_1')
      );
      
      const selectedCity = cityComponent?.long_name;
      
      // Check if city is allowed
      const isCityAllowed = cityOptions.some(city => 
        selectedCity?.toLowerCase().includes(city.toLowerCase()) ||
        place.formatted_address.toLowerCase().includes(city.toLowerCase())
      );
      
      if (!isCityAllowed) {
        setErrors(prev => ({
          ...prev,
          address: 'Address must be from București, Cluj-Napoca, or Timișoara'
        }));
        setAddressSelected(false);
        return;
      }
  
      // Check address with form city
      if (form.city) {
        const isFromSelectedCity = 
          selectedCity?.toLowerCase().includes(form.city.toLowerCase()) ||
          place.formatted_address.toLowerCase().includes(form.city.toLowerCase()) ||
          form.city.toLowerCase().includes(selectedCity?.toLowerCase() || '');
        
        if (!isFromSelectedCity) {
          setErrors(prev => ({
            ...prev,
            address: `Please select an address from ${form.city}. The selected address appears to be from a different city.`
          }));
          setAddressSelected(false);
          return;
        }
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
    setErrors(prev => ({ ...prev, address: '', map: '' }));
  };

  const handleMapClick = async (e) => {
    const newPos = { 
      lat: e.latLng.lat(), 
      lng: e.latLng.lng() 
    };
    setMarkerPos(newPos);
    setErrors(prev => ({ ...prev, map: '', address: '' }));
    
    setLoadingAddress(true);

     try {
      const result = await reverseGeocode(newPos.lat, newPos.lng);
      
      if (form.city) {
        const isInSelectedCity = cityOptions.some(city => 
          result.formattedAddress.toLowerCase().includes(city.toLowerCase()) &&
          (city.toLowerCase().includes(form.city.toLowerCase()) || 
           form.city.toLowerCase().includes(city.toLowerCase()))
        );
        
        if (!isInSelectedCity) {
          setErrors(prev => ({
            ...prev,
            map: `Please select a location within ${form.city}. The clicked location appears to be outside the selected city.`,
            address: `Location must be in ${form.city}`
          }));
          setLoadingAddress(false);
          return;
        }
      }
      setMarkerPos(newPos);
      setAddressSelected(true);
      setForm(prev => ({ ...prev, address: result.formattedAddress }));
      setErrors(prev => ({ ...prev, map: '', address: '' }));
      
    } catch (error) {
      console.error("Error getting address:", error);
      setErrors(prev => ({
        ...prev,
        map: 'Failed to get address for this location. Please try another location.',
        address: 'Failed to get address'
      }));
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

      const searchFilters = createSearchParams(filters);

      const url = `http://localhost:9013/boardgames/search?page=${page}&size=${size}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(searchFilters),
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

    setStringErrors(prev => ({ ...prev, boardgameName: '' }));
    setNumberErrors(prev => ({ ...prev, yearPublished: '', minAge: '', maxPlaytime: '' }));
    setPlayersError({ minPlayers: '', maxPlayers: '' });
    setComplexityError({ minComplexity: '', maxComplexity: '' });
    setFilters(defaultFilters);

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
      setSubmitError('Please fix all validation errors before submitting.');
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
    const maxDate = dayjs('2025-12-31');
    return date.isSame(today) || date.isBefore(today) || date.isAfter(maxDate);
  };

  const isFormValid = () => {
    const hasValidationErrors = hasErrors();
    const requiredFields = ['eventName', 'day', 'startHour', 'endHour', 'participants','venueName', 'city', 'description', 'address'];
    const hasAllRequired = requiredFields.every(field => 
      form[field] && form[field].toString().trim() !== ''
    );
    const hasMapLocation = markerPos !== null;
    const hasValidAddress = addressSelected; 
    
    return !hasValidationErrors && hasAllRequired && hasMapLocation && hasValidAddress;
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
                      onChange={e => handleFieldChange('eventName', e.target.value)}
                      sx={wideStyle} 
                      error={!!errors.eventName} 
                      helperText={
                        <Box>
                          {stringErrors.eventName && <span>{stringErrors.eventName}</span>}
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
                    <Typography mb={1}>Day</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker 
                        value={form.day} 
                        onChange={v => handleFieldChange('day', v)}
                        shouldDisableDate={shouldDisableDate}
                        slotProps={{ 
                          textField: { 
                            sx: inputStyle, 
                            error: !!errors.day, 
                            helperText: dateErrors.day || "Must be between tomorrow and Dec 31, 2025"
                          } 
                        }}
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
                            error: !!timeErrors.endHour, 
                            helperText: timeErrors.endHour || (form.startHour ? "Must be after start time" : "Select start time first")                          } 
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
                      onChange={e => handleFieldChange('price', e.target.value)}
                      sx={inputStyle}
                      error={!!numberErrors.price}
                      helperText={numberErrors.price || "Leave empty for free events"}
                      InputProps={{ 
                        inputProps: { min: 0, max: 10000, step: 1 }
                      }}
                      placeholder="Leave empty for free events"
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
                    error={!!stringErrors.description}
                    helperText={
                      <Box>
                        {stringErrors.description && <span>{stringErrors.description}</span>}
                        <CharacterCounter 
                          current={form.description.length} 
                          max={500} 
                          fieldName="description" 
                        />
                      </Box>
                    }
                    inputProps={{ maxLength: 500 }}
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
                      <InputLabel>City *</InputLabel>
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

                    <Typography mb={1} mt={2}>Venue Name *</Typography>
                    <TextField 
                      value={form.venueName} 
                      required
                      onChange={e => handleFieldChange('venueName', e.target.value)}
                      error={!!stringErrors.venueName}
                      helperText={
                        <Box>
                          {stringErrors.venueName && <span>{stringErrors.venueName}</span>}
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

                    <Typography mb={1} mt={2}>Address *</Typography>
                    <Box sx={{ position: 'relative' }}>
                      <Autocomplete 
                        onLoad={ref => (autoRef.current = ref)} 
                        onPlaceChanged={onPlaceChanged} 
                        options={{ 
                          componentRestrictions: { country: 'ro' }, 
                          fields: ['formatted_address', 'geometry', 'address_components'],
                          ...(form.city && CITY_COORDINATES[form.city] && {
                            location: new window.google.maps.LatLng(
                              CITY_COORDINATES[form.city].lat, 
                              CITY_COORDINATES[form.city].lng
                            ),
                            radius: 20000
                          })
                        }}
                      >
                        <TextField
                          required
                          value={form.address} 
                          onChange={e => {
                            setForm(f => ({ ...f, address: e.target.value }));
                            setTimeout(() => {
                              if (!addressSelected && e.target.value.trim() !== '') {
                                setAddressSelected(false);
                                setMarkerPos(null);
                                setErrors(prev => ({
                                  ...prev,
                                  address: 'Please select an address from the suggestions'
                                }));
                              }
                            }, 100);
                          }}
                          sx={wideStyle} 
                          error={!!stringErrors.address}
                          helperText={stringErrors.address || `Search for an address in ${form.city || 'Bucuresti, Cluj-Napoca, or Timisoara'}`}
                          placeholder="Type to search for address..."
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

                    <Typography mb={1} mt={2}>Additional Address Info</Typography>
                    <TextField 
                      multiline 
                      rows={3} 
                      fullWidth 
                      value={form.addressInfo} 
                      onChange={e => handleFieldChange('addressInfo', e.target.value)}
                      placeholder="Floor, entrance, parking instructions, etc. (max 200 chars)"
                      error={!!stringErrors.addressInfo}
                      helperText={
                        <Box>
                          {stringErrors.addressInfo && <span>{stringErrors.addressInfo}</span>}
                          <CharacterCounter 
                            current={form.addressInfo.length} 
                            max={200} 
                            fieldName="addressInfo" 
                          />
                        </Box>
                      }
                      inputProps={{ maxLength: 200 }}
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
                      <FormHelperText error sx={{ mt: 1 }}>{errors.map}</FormHelperText>
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
                      value={filters.boardgameName}
                      onChange={(e) => setFilters({ ...filters, boardgameName: e.target.value })}
                      error={!!stringErrors.boardgameName}
                      helperText={stringErrors.boardgameName || ""}
                      // InputProps={{
                      //   startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                      // }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Min Players"
                      fullWidth
                      size="small"
                      error={!!playersError.minPlayers}
                      helperText={playersError.minPlayers || ""}
                      value={filters.minPlayers}
                      onChange={(e) => setFilters({ ...filters, minPlayers: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Max Players"
                      fullWidth
                      size="small"
                      error={!!playersError.maxPlayers}
                      helperText={playersError.maxPlayers || ""}
                      value={filters.maxPlayers}
                      onChange={(e) => setFilters({ ...filters, maxPlayers: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Year Published"
                      fullWidth
                      size="small"
                      value={filters.yearPublished}
                      error={!!numberErrors.yearPublished}
                      helperText={numberErrors.yearPublished || ""}
                      onChange={(e) => setFilters({ ...filters, yearPublished: e.target.value })}
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
                          error={!!numberErrors.minAge}
                          helperText={numberErrors.minAge || ""}
                          value={filters.minAge}
                          onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Max Playtime"
                          fullWidth
                          size="small"
                          error={!!numberErrors.maxPlaytime}
                          helperText={numberErrors.maxPlaytime || ""}
                          value={filters.maxPlaytime}
                          onChange={(e) => setFilters({ ...filters, maxPlaytime: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Min Complexity"
                          fullWidth
                          size="small"
                          inputProps={{ step: "0.1" }}
                          error={!!complexityError.minComplexity}
                      helperText={complexityError.minComplexity || ""}
                      value={filters.minComplexity}
                      onChange={(e) => setFilters({ ...filters, minComplexity: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Max Complexity"
                          fullWidth
                          size="small"
                          inputProps={{ step: "0.1" }}
                          error={!!complexityError.maxComplexity}
                      helperText={complexityError.maxComplexity || ""}
                      value={filters.maxComplexity}
                      onChange={(e) => setFilters({ ...filters, maxComplexity: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="mechanics-label">Mechanics</InputLabel>
                          <Select
                            labelId="mechanics-label"
                            label="Mechanics"
                            multiple
                            value={filters.mechanics}
                            onChange={(e) => setFilters({ ...filters, mechanics: e.target.value })}
                            input={<OutlinedInput label="Mechanics" />}
                            renderValue={(selected) => selected.join(", ")}
                            sx={{ minWidth: 200 }}
                          >
                            {mechanicCategoryOptions.map((category) => (
                              <MenuItem key={category} value={category}>
                                <Checkbox checked={filters.mechanics.indexOf(category) > -1} />
                                <ListItemText primary={category} />
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
                            value={filters.domains}
                            onChange={(e) => setFilters({ ...filters, domains: e.target.value })}
                            input={<OutlinedInput label="Domains" />}
                            renderValue={(selected) => selected.join(", ")}
                            sx={{ minWidth: 200 }}
                          >
                            {domainOptions.map((domain) => (
                              <MenuItem key={domain} value={domain}>
                                <Checkbox checked={filters.domains.indexOf(domain) > -1} />
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
                    disabled={hasErrors() || loadingSearch}
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
        {!isFormValid() && (
            <Typography variant="body2" color="text.secondary">
              Complete all required fields to continue
            </Typography>
          )}
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
            disabled={ !isFormValid() || !mapLoaded || isSubmitting}
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
    // </LoadScript>
  );
}