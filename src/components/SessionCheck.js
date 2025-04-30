import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../cognito';

function SessionCheck({ checkIntervalMs = 60000 }) {
  const navigate = useNavigate();

  useEffect(() => {
    checkSessionValidity();
    
    const intervalId = setInterval(checkSessionValidity, checkIntervalMs);
    
    return () => clearInterval(intervalId);
  }, []);

  const checkSessionValidity = async () => {
    try {
      const session = await getSession();
      if (!session.isValid()) {
        handleSessionExpiration();
      }
    } catch (error) {
      console.log('Session check failed:', error);
      handleSessionExpiration();
    }
  };

  const handleSessionExpiration = () => {
    localStorage.removeItem('CognitoIdentityServiceProvider.2fh4vfib1ogm8ofn0s5hda5u9.LastAuthUser');
    
    navigate('/login', { state: { sessionExpired: true } });
  };

  return null;
}

export default SessionCheck;