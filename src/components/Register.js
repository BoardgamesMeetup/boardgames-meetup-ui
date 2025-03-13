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
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import {
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';


const roles = [
  { value: 'PLAYER', label: 'Player' },
  { value: 'EVENT_PLANNER', label: 'Event Planner' },
  { value: 'ADMIN', label: 'Admin' }
];

function Register() {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    givenName: '',
    familyName: '',
    role: 'PLAYER',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };


  const handleRegister = async (e) => {
    setErrorMsg('');
    setSuccessMsg('');
    e.preventDefault();
    try {
      if (formData.password !== formData.confirmPassword) {
        setMessage('Passwords do not match!');
        return;
      }
  
      setLoading(true);
  
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: formData.email }),
        new CognitoUserAttribute({ Name: 'given_name', Value: formData.givenName }),
        new CognitoUserAttribute({ Name: 'family_name', Value: formData.familyName }),
        new CognitoUserAttribute({ Name: 'profile', Value: formData.role })
      ];
      var result;
      try {
       result = await registerUser(formData, attributeList);
      console.log('Register success:', result);
      } catch (err) {
        console.error('Register error:', err);
        switch (err.code) {
          case 'UsernameExistsException':
            setErrorMsg('That username already exists. Please choose a different one.');
            break;
          case 'InvalidPasswordException':
            setErrorMsg('Password must meet the required complexity rules.');
            break;
          case 'InvalidParameterException':
            setErrorMsg('Invalid parameter. Please check all required fields.');
            break;
          default:
            setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
        }
      }    
      try {
        const { userSub } = result;
        console.log("Call user-service for registration: ", userSub);

        const res = await axios.post('http://localhost:9011/user-service/register', {
          userId: userSub,
          email: formData.email,
          givenName: formData.givenName,
          familyName: formData.familyName,
          role: formData.role
        });
        console.log("Register result: ", res);
        console.log(res.data.message || 'Registration successful! Check your email for confirmation.');
      } catch (dbErr) {
        console.error('Backend error saving user in DB:', dbErr);
        console.log(dbErr.response?.data?.message || 'Error saving user to backend');
      } finally {
        console.log(false);
      }
      setModalMessage('Registration successful! Check email for code.');
      setShowModal(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setModalMessage(err.message || JSON.stringify(err));
      setShowModal(true);
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
    {message && <Typography color="primary">{message}</Typography>}
    {errorMsg && <div style={{ color: 'red' }}>{errorMsg}</div>}
      {successMsg && <div style={{ color: 'green' }}>{successMsg}</div>}

    <TextField
      label="Email"
      name="email"
      type="email"
      value={formData.email}
      onChange={handleChange}
      required
    />
    <TextField
      label="Given Name"
      name="givenName"
      value={formData.givenName}
      onChange={handleChange}
      required
    />
    <TextField
      label="Family Name"
      name="familyName"
      value={formData.familyName}
      onChange={handleChange}
      required
    />
    <TextField
      select
      label="Role"
      name="role"
      value={formData.role}
      onChange={handleChange}
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
      type="password"
      value={formData.password}
      onChange={handleChange}
      required
    />
    <TextField
      label="Confirm Password"
      name="confirmPassword"
      type="password"
      value={formData.confirmPassword}
      onChange={handleChange}
      required
    />

    <Button
      variant="contained"
      onClick={handleRegister}
      disabled={loading}
    >
      {loading ? <CircularProgress size={24} /> : 'Register'}
    </Button>
  </Box>
);
}
export default Register;
