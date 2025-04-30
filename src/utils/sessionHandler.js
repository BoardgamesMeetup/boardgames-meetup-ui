import React, { useEffect } from 'react';
import { getSession } from '../cognito';
import { useNavigate } from 'react-router-dom';

export function useSessionExpirationCheck(checkIntervalMs = 60000) {
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();

    const intervalId = setInterval(checkSession, checkIntervalMs);

    return () => clearInterval(intervalId);
  }, []);

  const checkSession = async () => {
    try {
      await getSession();
    } catch (error) {
      console.log('Session expired or invalid:', error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('CognitoIdentityServiceProvider.2fh4vfib1ogm8ofn0s5hda5u9.LastAuthUser');
    } catch (e) {
      console.error('Error clearing storage', e);
    }

    navigate('/login', { state: { sessionExpired: true } });
  };

  return { checkSession, handleLogout };
}