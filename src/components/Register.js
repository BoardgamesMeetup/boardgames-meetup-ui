import React, { useState } from 'react';
import {
  registerUser,
} from '../cognito';

import {
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Modal,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import axios from 'axios';
import {
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import {
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

const roles = [
  { value: 'PLAYER', label: 'Player' },
  { value: 'EVENT_PLANNER', label: 'Event Planner' },
  { value: 'ADMIN', label: 'Admin' }
];

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    givenName: '',
    familyName: '',
    role: 'PLAYER',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState('');


  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (email) => emailRegex.test(email);

const validateField = (name, value) => {
  let error = '';
  
  switch (name) {
    case 'familyName':
      if (!value || value.trim() === '') {
        error = 'Family Name is required';
      } else if (value.trim().length < 2) {
        error = 'Family Name must be at least 2 characters';
      }
      break;
    case 'givenName':
      if (!value || value.trim() === '') {
        error = 'Given Name is required';
      } else if (value.trim().length < 2) {
        error = 'Given Name must be at least 2 characters';
      }
      break;
    case 'role':
      if (!value) {
        error = 'Please select a role';
        setErrors(errors.role = error);
      }
      break;
    default:
      break;
  }
  
  return error;
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Invalid email' }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    } else {
        // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    }
  };

  const isFormValid = formData.email &&
    formData.familyName &&
    formData.givenName &&
    formData.role &&
    validateEmail(formData.email) &&
    !validateField('email', formData.email) &&
    !validateField('familyName', formData.familyName) &&
    !validateField('givenName', formData.givenName) &&
    !validateField('role', formData.role);

const handleModalClose = () => {
  setShowModal(false);
  
  if (isSuccessModal) {
    try {
      localStorage.removeItem('CognitoIdentityServiceProvider.2fh4vfib1ogm8ofn0s5hda5u9.LastAuthUser');
      
      localStorage.setItem('comingFromRegistration', 'true');
    } catch (e) {
      console.log('Error clearing local storage', e);
    }
    
    window.location.href = '/login';
  }
};

  const showErrorModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsSuccessModal(false);
    setShowModal(true);
  };

  const showSuccessModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsSuccessModal(true);
    setShowModal(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match!');
      return;
    }
    
    setLoading(true);
    
    try {
      const tempUserId = `temp-${Date.now()}`;
      
      let backendRegistered = false;
      try {
        const res = await axios.post('http://localhost:9013/user-service/register', {
          userId: tempUserId,
          email: formData.email,
          givenName: formData.givenName,
          familyName: formData.familyName,
          role: formData.role,
        });
        
        console.log("Backend registration successful:", res);
        backendRegistered = true;
      } catch (dbErr) {
        console.error('Backend error during registration:', dbErr);
        showErrorModal(
          'Registration Error', 
          dbErr.response?.data?.message || 'Error communicating with our services. Please try again later.'
        );
        setLoading(false);
        return;
      }
      
      if (backendRegistered) {
        const attributeList = [
          new CognitoUserAttribute({ Name: 'email', Value: formData.email }),
          new CognitoUserAttribute({ Name: 'given_name', Value: formData.givenName }),
          new CognitoUserAttribute({ Name: 'family_name', Value: formData.familyName }),
          new CognitoUserAttribute({ Name: 'profile', Value: formData.role })
        ];
        
        try {
          const result = await registerUser(formData, attributeList);
          console.log('Cognito registration success:', result);
          
          const { userSub } = result;
          try {
            console.log("User ID updated in backend, tempid: ", tempUserId);
            console.log("User ID updated in backend, cognito id: ", userSub);

            await axios.put(`http://localhost:9013/user-service/update-id/${tempUserId}`, { userId: userSub });
            console.log("User ID updated in backend");
            
            showSuccessModal(
              'Registration Successful', 
              `Thank you for registering! We've sent a confirmation email to ${formData.email}. Please check your inbox and follow the instructions to verify your account.`
            );
          } catch (updateErr) {
            console.error('Error updating user ID in backend:', updateErr);
            showSuccessModal(
              'Registration Successful', 
              `Thank you for registering! We've sent a confirmation email to ${formData.email}. Please check your inbox and follow the instructions to verify your account.`
            );
          }
        } catch (cognitoErr) {
          console.error('Cognito registration error:', cognitoErr);
          
          let errorMessage;
          switch (cognitoErr.code) {
            case 'UsernameExistsException':
              errorMessage = 'An account with this email already exists.';
              break;
            case 'InvalidPasswordException':
              errorMessage = 'Password does not meet the requirements. It must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.';
              break;
            case 'InvalidParameterException':
              errorMessage = 'Invalid parameter provided. Please check all required fields.';
              break;
            default:
              errorMessage = cognitoErr.message || 'An unexpected error occurred during registration.';
          }
          
          try {
            await axios.delete(`http://localhost:9013/user-service/registration/delete/${tempUserId}`);
            console.log("Temporary user removed from backend after Cognito failure");
          } catch (cleanupErr) {
            console.error('Error cleaning up temporary user from backend:', cleanupErr);
          }
          
          showErrorModal('Registration Error', errorMessage);
        }
      }
    } catch (err) {
      console.error('General registration error:', err);
      showErrorModal(
        'Registration Error', 
        'An unexpected error occurred. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: 400,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        mt: 5
      }}
    >
      <Typography variant="h5" align="center">
        Register
      </Typography>
      
      {passwordError && (
        <Typography color="error" align="center">
          {passwordError}
        </Typography>
      )}

      <TextField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        error={!!errors.email}
        helperText={errors.email}
      />
      <TextField
        label="Given Name"
        name="givenName"
        value={formData.givenName}
        onChange={handleChange}
        required
        error={!!errors.givenName}
        helperText={errors.givenName}
      />
      <TextField
        label="Family Name"
        name="familyName"
        value={formData.familyName}
        onChange={handleChange}
        required
        error={!!errors.familyName}
        helperText={errors.familyName}
      />
      <TextField
        select
        label="Role"
        name="role"
        value={formData.role}
        onChange={handleChange}
        error={!!errors.role}
        helperText={errors.role}
      >
        {roles.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={handleChange}
        required
        helperText="Must include uppercase, lowercase, number and special character"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleTogglePasswordVisibility}
                edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <TextField
        label="Confirm Password"
        name="confirmPassword"
        type={showPassword ? "text" : "password"}
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleTogglePasswordVisibility}
                edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      <Button
        variant="contained"
        onClick={handleRegister}
        disabled={!isFormValid || loading}
        className={isFormValid ? 'enabled-style' : 'disabled-style'}
      >
        {loading ? <CircularProgress size={24} /> : 'Register'}
      </Button>

      <Modal
        open={showModal}
        onClose={handleModalClose}
        aria-labelledby="registration-modal"
      >
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Typography 
            variant="h6" 
            component="h2" 
            color={isSuccessModal ? "success.main" : "error.main"}
          >
            {modalTitle}
          </Typography>
          <Typography>
            {modalMessage}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleModalClose}
            >
              {isSuccessModal ? "OK" : "Close"}
            </Button>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
}

export default Register;